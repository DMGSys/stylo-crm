import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        servicioProductos: {
          include: {
            servicio: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        movimientos: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            usuario: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)
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

    // Validar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id }
    })

    if (!productoExistente) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
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

    // Actualizar el producto
    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
        marca: data.marca,
        codigo: data.codigo,
        precioCosto: parseFloat(data.precioCosto),
        precioVenta: data.precioVenta ? parseFloat(data.precioVenta) : parseFloat(data.precioCosto),
        stock: parseInt(data.stock),
        stockMinimo: data.stockMinimo ? parseInt(data.stockMinimo) : 5,
        unidadMedida: data.unidadMedida,
        activo: data.activo !== undefined ? data.activo : true,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        proveedor: data.proveedor,
        notas: data.notas || null
      },
      include: {
        categoria: true
      }
    })

    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
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

    // Verificar si el producto está siendo usado en servicios
    const serviciosConProducto = await prisma.servicioProducto.findFirst({
      where: { productoId: id }
    })

    if (serviciosConProducto) {
      return NextResponse.json(
        { error: 'No se puede eliminar un producto que está siendo usado en servicios' },
        { status: 400 }
      )
    }

    // Verificar si hay movimientos de inventario
    const movimientos = await prisma.movimientoInventario.findFirst({
      where: { productoId: id }
    })

    if (movimientos) {
      return NextResponse.json(
        { error: 'No se puede eliminar un producto que tiene movimientos de inventario registrados' },
        { status: 400 }
      )
    }

    // Eliminar el producto
    await prisma.producto.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Producto eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
