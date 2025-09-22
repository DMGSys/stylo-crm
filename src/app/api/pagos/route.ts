import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metodoPago = searchParams.get('metodoPago')
    const estadoPago = searchParams.get('estadoPago')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros
    const where: any = {}
    
    if (metodoPago) {
      where.metodoPago = metodoPago
    }
    
    if (estadoPago) {
      where.estadoPago = estadoPago
    }
    
    if (fechaDesde || fechaHasta) {
      where.fechaPago = {}
      if (fechaDesde) where.fechaPago.gte = new Date(fechaDesde + 'T00:00:00')
      if (fechaHasta) where.fechaPago.lte = new Date(fechaHasta + 'T23:59:59')
    }

    // Obtener pagos
    const pagos = await prisma.pago.findMany({
      where,
      include: {
        cita: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        fechaPago: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Obtener el total para paginación
    const totalPagos = await prisma.pago.count({ where })

    return NextResponse.json({
      pagos,
      total: totalPagos,
      limit,
      offset,
      hasMore: offset + limit < totalPagos
    })

  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los pagos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      citaId,
      monto,
      montoServicio,
      propina = 0,
      descuento = 0,
      metodoPago = 'EFECTIVO',
      cuentaBancariaId,
      estadoPago = 'COMPLETADO',
      referencia,
      notas,
      usuarioId
    } = body

    // Validar campos requeridos
    if (!citaId || !monto || !montoServicio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: citaId, monto, montoServicio' },
        { status: 400 }
      )
    }

    // Verificar que la cita existe
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        cliente: true
      }
    })

    if (!cita) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no existe ya un pago para esta cita
    const pagoExistente = await prisma.pago.findUnique({
      where: { citaId }
    })

    if (pagoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un pago registrado para esta cita' },
        { status: 409 }
      )
    }

    // Crear el pago
    const nuevoPago = await prisma.pago.create({
      data: {
        citaId,
        clienteId: cita.clienteId,
        usuarioId,
        monto: parseFloat(monto.toString()),
        montoServicio: parseFloat(montoServicio.toString()),
        propina: parseFloat(propina.toString()),
        descuento: parseFloat(descuento.toString()),
        metodoPago,
        cuentaBancariaId,
        estadoPago,
        referencia,
        notas
      },
      include: {
        cita: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Si el pago está completado, crear movimiento de caja
    if (estadoPago === 'COMPLETADO') {
      await prisma.movimientoCaja.create({
        data: {
          tipo: 'INGRESO_SERVICIO',
          concepto: `Pago de servicio - ${cita.servicio || 'Servicio'}`,
          monto: parseFloat(monto.toString()),
          metodoPago,
          pagoId: nuevoPago.id,
          usuarioId
        }
      })
    }

    // Actualizar estado de la cita si no está ya realizada
    if (cita.estado !== 'REALIZADA') {
      await prisma.cita.update({
        where: { id: citaId },
        data: { estado: 'REALIZADA' }
      })
    }

    return NextResponse.json(nuevoPago, { status: 201 })

  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error al crear el pago' },
      { status: 500 }
    )
  }
}
