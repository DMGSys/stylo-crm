import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const hora = searchParams.get('hora')

    if (!fecha || !hora) {
      return NextResponse.json(
        { error: 'Fecha y hora son requeridas' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una cita en esa fecha y hora
    const citaExistente = await prisma.cita.findFirst({
      where: {
        fecha: new Date(fecha + 'T' + hora + ':00'),
        hora: hora,
        estado: {
          not: 'CANCELADA'
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    })

    if (citaExistente) {
      return NextResponse.json({
        disponible: false,
        conflicto: {
          cliente: `${citaExistente.cliente.nombre} ${citaExistente.cliente.apellido}`,
          servicio: citaExistente.servicio,
          estado: citaExistente.estado
        }
      })
    }

    // También verificar citas en horarios cercanos (considerando duración de servicios)
    const fechaDateTime = new Date(fecha + 'T00:00:00')
    const citasDelDia = await prisma.cita.findMany({
      where: {
        fecha: {
          gte: fechaDateTime,
          lt: new Date(fechaDateTime.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: {
          not: 'CANCELADA'
        }
      },
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

    // Verificar solapamientos considerando duración
    const horaMinutos = parseInt(hora.split(':')[0]) * 60 + parseInt(hora.split(':')[1])
    
    for (const cita of citasDelDia) {
      const citaHoraMinutos = parseInt(cita.hora.split(':')[0]) * 60 + parseInt(cita.hora.split(':')[1])
      const duracionCita = cita.servicioRef?.duracionMinutos || 30
      
      // Verificar si hay solapamiento
      if (
        (horaMinutos >= citaHoraMinutos && horaMinutos < citaHoraMinutos + duracionCita) ||
        (citaHoraMinutos >= horaMinutos && citaHoraMinutos < horaMinutos + 30) // Asumimos 30 min por defecto
      ) {
        return NextResponse.json({
          disponible: false,
          conflicto: {
            cliente: `${cita.cliente.nombre} ${cita.cliente.apellido}`,
            servicio: cita.servicio,
            estado: cita.estado,
            tipo: 'solapamiento'
          }
        })
      }
    }

    return NextResponse.json({
      disponible: true,
      sugerencias: generarSugerenciasHorario(citasDelDia, fecha)
    })

  } catch (error) {
    console.error('Error al verificar disponibilidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function generarSugerenciasHorario(citasDelDia: any[], fecha: string): string[] {
  const horariosOcupados = citasDelDia.map(cita => cita.hora)
  const horariosDisponibles = []
  
  // Generar horarios de 9:00 a 20:00 cada 30 minutos
  for (let hora = 9; hora <= 20; hora++) {
    const horaStr = `${hora.toString().padStart(2, '0')}:00`
    const horaMediaStr = `${hora.toString().padStart(2, '0')}:30`
    
    if (!horariosOcupados.includes(horaStr)) {
      horariosDisponibles.push(horaStr)
    }
    if (hora < 20 && !horariosOcupados.includes(horaMediaStr)) {
      horariosDisponibles.push(horaMediaStr)
    }
  }
  
  return horariosDisponibles.slice(0, 5) // Devolver máximo 5 sugerencias
}
