import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const categoriaId = searchParams.get("categoriaId")

    const skip = (page - 1) * limit

    const where = {
      activo: true,
      ...(search ? {
        OR: [
          { nombre: { contains: search } },
          { descripcion: { contains: search } }
        ]
      } : {}),
      ...(categoriaId ? { categoriaId } : {})
    }

    const [servicios, total] = await Promise.all([
      prisma.servicio.findMany({
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
              citas: true,
              servicioProductos: true
            }
          }
        },
        orderBy: {
          nombre: "asc"
        }
      }),
      prisma.servicio.count({ where })
    ])

    return NextResponse.json({
      servicios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error al obtener servicios:", error)
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
    if (!body.nombre || !body.categoriaId || !body.precioBase) {
      return NextResponse.json(
        { error: "Nombre, categoría y precio base son obligatorios" },
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

    // Verificar que no exista otro servicio activo con el mismo nombre
    const existingServicio = await prisma.servicio.findFirst({
      where: {
        nombre: body.nombre.trim(),
        activo: true
      }
    })

    if (existingServicio) {
      return NextResponse.json(
        { error: "Ya existe un servicio activo con ese nombre" },
        { status: 409 }
      )
    }

    // Crear el servicio
    const servicio = await prisma.servicio.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion?.trim() || undefined,
        categoriaId: body.categoriaId,
        precioBase: parseFloat(body.precioBase),
        precioVenta: body.precioVenta ? parseFloat(body.precioVenta) : undefined,
        duracionMinutos: body.duracionMinutos || 30,
        requiereProductos: body.requiereProductos || false,
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

    return NextResponse.json(servicio, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear servicio:", error)
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
