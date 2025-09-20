import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { citaId, usuarioId } = await request.json()

    if (!citaId || !usuarioId) {
      return NextResponse.json(
        { error: 'ID de cita y usuario son requeridos' },
        { status: 400 }
      )
    }

    // Obtener la cita con su servicio y productos
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        servicioRef: {
          include: {
            servicioProductos: {
              include: {
                producto: true
              }
            }
          }
        }
      }
    })

    if (!cita) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      )
    }

    if (!cita.servicioRef || !cita.servicioRef.requiereProductos) {
      return NextResponse.json(
        { message: 'El servicio no requiere productos' }
      )
    }

    const movimientos = []

    // Crear movimientos de salida para cada producto
    for (const servicioProducto of cita.servicioRef.servicioProductos) {
      const producto = servicioProducto.producto
      
      // Verificar stock disponible
      if (producto.stock < servicioProducto.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Requerido: ${servicioProducto.cantidad}` },
          { status: 400 }
        )
      }

      // Crear movimiento de inventario
      const movimiento = await prisma.movimientoInventario.create({
        data: {
          productoId: producto.id,
          usuarioId: usuarioId,
          citaId: citaId,
          tipo: 'SALIDA',
          cantidad: servicioProducto.cantidad,
          precioUnitario: producto.precioCompra,
          motivo: `Servicio: ${cita.servicioRef.nombre}`,
          referencia: `Cita #${cita.id.slice(-8)}`
        }
      })

      // Actualizar stock del producto
      await prisma.producto.update({
        where: { id: producto.id },
        data: {
          stock: {
            decrement: servicioProducto.cantidad
          }
        }
      })

      movimientos.push(movimiento)
    }

    return NextResponse.json({
      message: 'Inventario actualizado correctamente',
      movimientos: movimientos.length
    })

  } catch (error) {
    console.error('Error al procesar inventario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
