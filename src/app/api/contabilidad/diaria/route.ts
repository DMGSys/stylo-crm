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

    // Obtener todos los pagos del día
    const pagosDelDia = await prisma.pago.findMany({
      where: {
        fechaPago: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        cita: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    })

    // Obtener citas realizadas del día (para servicios sin pago registrado)
    const citasRealizadas = await prisma.cita.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: 'REALIZADA'
      },
      include: {
        pago: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })

    // Obtener movimientos de caja del día
    const movimientosCaja = await prisma.movimientoCaja.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        usuario: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Calcular estadísticas
    const totalIngresos = pagosDelDia
      .filter(p => p.estadoPago === 'COMPLETADO')
      .reduce((sum, p) => sum + p.monto, 0)

    const totalPagos = pagosDelDia.length

    const promedioTicket = totalPagos > 0 ? totalIngresos / totalPagos : 0

    // Agrupar por método de pago
    const metodosPopulares = pagosDelDia.reduce((acc, pago) => {
      acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Servicios realizados (incluyendo los que no tienen pago registrado)
    const serviciosRealizados = citasRealizadas.length

    // Clientes únicos atendidos
    const clientesAtendidos = new Set(citasRealizadas.map(c => c.clienteId)).size

    // Ingresos por método de pago
    const ingresosPorMetodo = pagosDelDia.reduce((acc, pago) => {
      if (pago.estadoPago === 'COMPLETADO') {
        acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + pago.monto
      }
      return acc
    }, {} as Record<string, number>)

    // Propinas totales
    const totalPropinas = pagosDelDia.reduce((sum, p) => sum + (p.propina || 0), 0)

    // Descuentos totales
    const totalDescuentos = pagosDelDia.reduce((sum, p) => sum + (p.descuento || 0), 0)

    // Servicios sin pago registrado
    const serviciosSinPago = citasRealizadas.filter(c => !c.pago).length

    // Ingresos estimados de servicios sin pago
    const ingresosEstimados = citasRealizadas
      .filter(c => !c.pago && c.precio)
      .reduce((sum, c) => sum + (c.precio || 0), 0)

    return NextResponse.json({
      fecha,
      totalIngresos,
      totalPagos,
      promedioTicket,
      metodosPopulares,
      serviciosRealizados,
      clientesAtendidos,
      ingresosPorMetodo,
      totalPropinas,
      totalDescuentos,
      serviciosSinPago,
      ingresosEstimados,
      movimientosCaja,
      resumen: {
        ventasBrutas: totalIngresos + totalDescuentos,
        ventasNetas: totalIngresos,
        efectividad: serviciosRealizados > 0 ? Math.round((totalPagos / serviciosRealizados) * 100) : 0,
        ticketPromedio: promedioTicket
      }
    })

  } catch (error) {
    console.error('Error al obtener contabilidad diaria:', error)
    return NextResponse.json(
      { error: 'Error al obtener la contabilidad diaria' },
      { status: 500 }
    )
  }
}
