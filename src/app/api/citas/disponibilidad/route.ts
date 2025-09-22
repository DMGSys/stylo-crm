import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const hora = searchParams.get('hora')
    const servicioId = searchParams.get('servicioId')
    const permitirSuperposicion = searchParams.get('permitirSuperposicion') === 'true'
    const excluirCitaId = searchParams.get('excluirCitaId')

    if (!fecha || !hora) {
      return NextResponse.json(
        { error: 'Fecha y hora son requeridas' },
        { status: 400 }
      )
    }

    // Obtener configuración de intervalos
    const configIntervalo = await prisma.configuracion.findUnique({
      where: { clave: 'horarios_intervalo_citas' }
    })
    const intervaloMinutos = parseInt(configIntervalo?.valor || '30')

    // Obtener duración del servicio si se proporciona
    let duracionServicio = 30 // duración por defecto
    if (servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: servicioId },
        select: { duracionMinutos: true }
      })
      if (servicio) {
        duracionServicio = servicio.duracionMinutos
      }
    }

    // Obtener todas las citas del día
    const fechaDateTime = new Date(fecha + 'T00:00:00')
    const whereClause: any = {
      fecha: {
        gte: fechaDateTime,
        lt: new Date(fechaDateTime.getTime() + 24 * 60 * 60 * 1000)
      },
      estado: {
        not: 'CANCELADA'
      }
    }

    // Excluir cita específica si se proporciona (para edición)
    if (excluirCitaId) {
      whereClause.id = {
        not: excluirCitaId
      }
    }

    const citasDelDia = await prisma.cita.findMany({
      where: whereClause,
      include: {
        servicioRef: {
          select: {
            duracionMinutos: true
          }
        },
        cliente: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    })

    // Convertir hora a minutos para cálculos
    const horaMinutos = parseInt(hora.split(':')[0]) * 60 + parseInt(hora.split(':')[1])
    const finNuevaCita = horaMinutos + duracionServicio

    // Verificar conflictos y calcular información
    const conflictos = []
    const superposiciones = []
    let tiempoTotalOcupado = duracionServicio

    for (const cita of citasDelDia) {
      const citaHoraMinutos = parseInt(cita.hora.split(':')[0]) * 60 + parseInt(cita.hora.split(':')[1])
      const duracionCita = cita.servicioRef?.duracionMinutos || 30
      const finCitaExistente = citaHoraMinutos + duracionCita

      // Verificar si es exactamente la misma hora
      if (citaHoraMinutos === horaMinutos) {
        conflictos.push({
          tipo: 'exacto',
          cliente: `${cita.cliente.nombre} ${cita.cliente.apellido}`,
          servicio: cita.servicio,
          estado: cita.estado,
          hora: cita.hora,
          duracion: duracionCita
        })
      }
      // Verificar solapamientos
      else if (
        (horaMinutos < finCitaExistente && finNuevaCita > citaHoraMinutos) ||
        (citaHoraMinutos < finNuevaCita && finCitaExistente > horaMinutos)
      ) {
        superposiciones.push({
          tipo: 'solapamiento',
          cliente: `${cita.cliente.nombre} ${cita.cliente.apellido}`,
          servicio: cita.servicio,
          estado: cita.estado,
          hora: cita.hora,
          duracion: duracionCita,
          solapamientoMinutos: Math.min(finNuevaCita, finCitaExistente) - Math.max(horaMinutos, citaHoraMinutos)
        })
        
        // Calcular tiempo total considerando superposición
        const inicioSuperpuesto = Math.min(horaMinutos, citaHoraMinutos)
        const finSuperpuesto = Math.max(finNuevaCita, finCitaExistente)
        tiempoTotalOcupado = Math.max(tiempoTotalOcupado, finSuperpuesto - inicioSuperpuesto)
      }
      // Verificar si no respeta el intervalo configurado
      else {
        const distanciaAntes = horaMinutos - finCitaExistente
        const distanciaDespues = citaHoraMinutos - finNuevaCita

        if ((distanciaAntes > 0 && distanciaAntes < intervaloMinutos) || 
            (distanciaDespues > 0 && distanciaDespues < intervaloMinutos)) {
          superposiciones.push({
            tipo: 'intervalo_insuficiente',
            cliente: `${cita.cliente.nombre} ${cita.cliente.apellido}`,
            servicio: cita.servicio,
            estado: cita.estado,
            hora: cita.hora,
            duracion: duracionCita,
            intervaloRequerido: intervaloMinutos,
            intervaloActual: Math.min(distanciaAntes, distanciaDespues)
          })
        }
      }
    }

    // Si hay conflictos exactos y no se permite superposición
    if (conflictos.length > 0 && !permitirSuperposicion) {
      return NextResponse.json({
        disponible: false,
        conflictos,
        mensaje: 'Ya existe una cita en este horario exacto'
      })
    }

    // Si hay superposiciones y no se permite
    if (superposiciones.length > 0 && !permitirSuperposicion) {
      return NextResponse.json({
        disponible: false,
        conflictos: superposiciones,
        mensaje: 'Hay conflictos de horario o no se respeta el intervalo configurado'
      })
    }

    // Si se permite superposición, devolver información completa
    return NextResponse.json({
      disponible: true,
      permiteSuperposicion: permitirSuperposicion,
      duracionServicio,
      intervaloConfigurado: intervaloMinutos,
      tiempoTotalOcupado,
      conflictos: conflictos.length > 0 ? conflictos : undefined,
      superposiciones: superposiciones.length > 0 ? superposiciones : undefined,
      sugerencias: generarSugerenciasHorario(citasDelDia, fecha, intervaloMinutos)
    })

  } catch (error) {
    console.error('Error al verificar disponibilidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generarSugerenciasHorario(citasDelDia: any[], fecha: string, intervaloMinutos: number): string[] {
  const horariosDisponibles = []
  
  // Obtener configuración de horarios (por defecto 9:00 a 20:00)
  const horaInicio = 9 * 60 // 9:00 en minutos
  const horaFin = 20 * 60   // 20:00 en minutos
  
  // Crear lista de horarios ocupados con sus duraciones
  const ocupados = citasDelDia.map(cita => {
    const horaMinutos = parseInt(cita.hora.split(':')[0]) * 60 + parseInt(cita.hora.split(':')[1])
    const duracion = cita.servicioRef?.duracionMinutos || 30
    return {
      inicio: horaMinutos,
      fin: horaMinutos + duracion
    }
  }).sort((a, b) => a.inicio - b.inicio)
  
  // Generar sugerencias respetando intervalos
  for (let minutos = horaInicio; minutos < horaFin; minutos += intervaloMinutos) {
    let disponible = true
    
    // Verificar si este horario está libre
    for (const ocupado of ocupados) {
      // Si el horario propuesto se solapa con uno ocupado
      if (minutos < ocupado.fin && (minutos + 30) > ocupado.inicio) {
        disponible = false
        break
      }
      
      // Si no respeta el intervalo antes o después
      if ((minutos > ocupado.fin && minutos - ocupado.fin < intervaloMinutos) ||
          (ocupado.inicio > minutos && ocupado.inicio - (minutos + 30) < intervaloMinutos)) {
        disponible = false
        break
      }
    }
    
    if (disponible) {
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      const horaStr = `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
      horariosDisponibles.push(horaStr)
      
      if (horariosDisponibles.length >= 8) break // Máximo 8 sugerencias
    }
  }
  
  return horariosDisponibles
}
