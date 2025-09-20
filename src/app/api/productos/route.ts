import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const categoriaId = searchParams.get("categoriaId")
    const stockBajo = searchParams.get("stockBajo") === "true"

    const skip = (page - 1) * limit

    const where = {
      activo: true,
      ...(search ? {
        OR: [
          { nombre: { contains: search } },
          { descripcion: { contains: search } },
          { marca: { contains: search } },
          { codigo: { contains: search } }
        ]
      } : {}),
      ...(categoriaId ? { categoriaId } : {}),
      ...(stockBajo ? {
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      } : {})
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip,
        take: limit,
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              color: true,
              icono: true
            }
          },
          _count: {
            select: {
              servicioProductos: true,
              movimientos: true
            }
          }
        },
        orderBy: {
          nombre: "asc"
        }
      }),
      prisma.producto.count({ where })
    ])

    return NextResponse.json({
      productos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar campos obligatorios
    if (!body.nombre || !body.categoriaId || !body.precioCosto || !body.precioVenta) {
      return NextResponse.json(
        { error: "Nombre, categoría, precio de costo y precio de venta son obligatorios" },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: body.categoriaId }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      )
    }

    // Verificar código único si se proporciona
    if (body.codigo) {
      const existingCodigo = await prisma.producto.findFirst({
        where: {
          codigo: body.codigo.trim(),
          activo: true
        }
      })

      if (existingCodigo) {
        return NextResponse.json(
          { error: "Ya existe un producto activo con ese código" },
          { status: 409 }
        )
      }
    }

    // Verificar nombre único
    const existingNombre = await prisma.producto.findFirst({
      where: {
        nombre: body.nombre.trim(),
        activo: true
      }
    })

    if (existingNombre) {
      return NextResponse.json(
        { error: "Ya existe un producto activo con ese nombre" },
        { status: 409 }
      )
    }

    // Crear el producto
    const producto = await prisma.producto.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion?.trim() || undefined,
        categoriaId: body.categoriaId,
        marca: body.marca?.trim() || undefined,
        codigo: body.codigo?.trim() || undefined,
        precioCosto: parseFloat(body.precioCosto),
        precioVenta: parseFloat(body.precioVenta),
        stock: parseInt(body.stock) || 0,
        stockMinimo: parseInt(body.stockMinimo) || 5,
        unidadMedida: body.unidadMedida || "unidad",
        fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : undefined,
        proveedor: body.proveedor?.trim() || undefined,
        notas: body.notas?.trim() || undefined
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            color: true,
            icono: true
          }
        }
      }
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear producto:", error)
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
