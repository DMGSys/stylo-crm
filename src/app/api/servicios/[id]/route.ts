import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const servicio = await prisma.servicio.findUnique({
      where: { id },
      include: {
        categoria: true,
        servicioProductos: {
          include: {
            producto: true
          }
        }
      }
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al obtener servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Validar que el servicio existe
    const servicioExistente = await prisma.servicio.findUnique({
      where: { id }
    })

    if (!servicioExistente) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // Validar que la categoría existe si se proporciona
    if (data.categoriaId) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: data.categoriaId }
      })

      if (!categoria) {
        return NextResponse.json(
          { error: 'Categoría no encontrada' },
          { status: 400 }
        )
      }
    }

    // Si se proporcionan productos, actualizar las relaciones
    if (data.productos && Array.isArray(data.productos)) {
      // Eliminar productos existentes
      await prisma.servicioProducto.deleteMany({
        where: { servicioId: id }
      })

      // Agregar nuevos productos
      for (const producto of data.productos) {
        await prisma.servicioProducto.create({
          data: {
            servicioId: id,
            productoId: producto.productoId,
            cantidad: producto.cantidad,
            obligatorio: producto.obligatorio
          }
        })
      }
    }

    // Actualizar el servicio
    const servicioActualizado = await prisma.servicio.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        precioBase: parseFloat(data.precioBase),
        precioVenta: data.precioVenta ? parseFloat(data.precioVenta) : null,
        duracionMinutos: parseInt(data.duracionMinutos) || 30,
        activo: data.activo !== undefined ? data.activo : true,
        requiereProductos: data.requiereProductos !== undefined ? data.requiereProductos : false,
        notas: data.notas || null
      },
      include: {
        categoria: true,
        servicioProductos: {
          include: {
            producto: true
          }
        }
      }
    })

    return NextResponse.json(servicioActualizado)
  } catch (error) {
    console.error('Error al actualizar servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar si el servicio tiene citas asociadas
    const citasConServicio = await prisma.cita.findFirst({
      where: { servicioId: id }
    })

    if (citasConServicio) {
      return NextResponse.json(
        { error: 'No se puede eliminar un servicio que tiene citas registradas' },
        { status: 400 }
      )
    }

    // Eliminar relaciones con productos primero
    await prisma.servicioProducto.deleteMany({
      where: { servicioId: id }
    })

    // Eliminar el servicio
    await prisma.servicio.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Servicio eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
