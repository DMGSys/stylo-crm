import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')

    if (!fecha) {
      return NextResponse.json(
        { error: 'Fecha es requerida' },
        { status: 400 }
      )
    }

    // Crear rango de fechas para el día específico
    const fechaInicio = new Date(fecha + 'T00:00:00')
    const fechaFin = new Date(fecha + 'T23:59:59')

    // Obtener todas las citas del día
    const citas = await prisma.cita.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true
          }
        },
        usuario: {
          select: {
            id: true,
            name: true
          }
        },
        servicioRef: {
          select: {
            id: true,
            nombre: true,
            duracionMinutos: true,
            precioVenta: true,
            precioBase: true,
            categoria: {
              select: {
                nombre: true,
                icono: true
              }
            }
          }
        }
      },
      orderBy: [
        { hora: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Calcular estadísticas del día
    const estadisticas = {
      totalCitas: citas.length,
      citasPorEstado: {
        PENDIENTE: citas.filter(c => c.estado === 'PENDIENTE').length,
        CONFIRMADA: citas.filter(c => c.estado === 'CONFIRMADA').length,
        REALIZADA: citas.filter(c => c.estado === 'REALIZADA').length,
        CANCELADA: citas.filter(c => c.estado === 'CANCELADA').length,
        REAGENDADA: citas.filter(c => c.estado === 'REAGENDADA').length
      },
      ingresosTotales: citas
        .filter(c => c.estado === 'REALIZADA' && c.precio)
        .reduce((sum, c) => sum + (c.precio || 0), 0),
      ingresosEstimados: citas
        .filter(c => ['PENDIENTE', 'CONFIRMADA'].includes(c.estado) && c.precio)
        .reduce((sum, c) => sum + (c.precio || 0), 0),
      tiempoTotalOcupado: citas
        .filter(c => c.estado !== 'CANCELADA')
        .reduce((sum, c) => {
          const duracion = c.servicioRef?.duracionMinutos || 30
          return sum + duracion
        }, 0)
    }

    // Detectar conflictos de horario
    const conflictos = []
    const citasPorHora = citas.reduce((acc, cita) => {
      if (cita.estado !== 'CANCELADA') {
        if (!acc[cita.hora]) {
          acc[cita.hora] = []
        }
        acc[cita.hora].push(cita)
      }
      return acc
    }, {} as Record<string, any[]>)

    for (const [hora, citasEnHora] of Object.entries(citasPorHora)) {
      if (citasEnHora.length > 1) {
        conflictos.push({
          hora,
          cantidad: citasEnHora.length,
          citas: citasEnHora.map(c => ({
            id: c.id,
            cliente: `${c.cliente.nombre} ${c.cliente.apellido}`,
            servicio: c.servicio || c.servicioRef?.nombre,
            estado: c.estado
          }))
        })
      }
    }

    // Generar horarios disponibles para el día
    const horariosDisponibles = []
    for (let hora = 8; hora <= 20; hora++) {
      const horaStr = `${hora.toString().padStart(2, '0')}:00`
      const horaMediaStr = `${hora.toString().padStart(2, '0')}:30`
      
      if (!citasPorHora[horaStr]) {
        horariosDisponibles.push(horaStr)
      }
      if (hora < 20 && !citasPorHora[horaMediaStr]) {
        horariosDisponibles.push(horaMediaStr)
      }
    }

    return NextResponse.json({
      fecha,
      citas,
      estadisticas,
      conflictos,
      horariosDisponibles,
      resumen: {
        ocupacionPorcentaje: Math.round((citas.filter(c => c.estado !== 'CANCELADA').length / 26) * 100), // 26 slots de 30min de 8:00 a 21:00
        horasOcupadas: Math.round(estadisticas.tiempoTotalOcupado / 60 * 10) / 10,
        eficiencia: estadisticas.totalCitas > 0 ? Math.round((estadisticas.citasPorEstado.REALIZADA / estadisticas.totalCitas) * 100) : 0
      }
    })

  } catch (error) {
    console.error('Error al obtener ocupación del día:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

