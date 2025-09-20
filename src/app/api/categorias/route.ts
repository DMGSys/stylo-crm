import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    const where = includeInactive ? {} : { activo: true }

    const categorias = await prisma.categoria.findMany({
      where,
      include: {
        _count: {
          select: {
            servicios: true,
            productos: true
          }
        }
      },
      orderBy: {
        nombre: "asc"
      }
    })

    return NextResponse.json({
      categorias
    })
  } catch (error) {
    console.error("Error al obtener categorías:", error)
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
    if (!body.nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      )
    }

    // Verificar que no exista otra categoría activa con el mismo nombre
    const existingCategoria = await prisma.categoria.findFirst({
      where: {
        nombre: body.nombre.trim(),
        activo: true
      }
    })

    if (existingCategoria) {
      return NextResponse.json(
        { error: "Ya existe una categoría activa con ese nombre" },
        { status: 409 }
      )
    }

    // Crear la categoría
    const categoria = await prisma.categoria.create({
      data: {
        nombre: body.nombre.trim(),
        descripcion: body.descripcion?.trim() || undefined,
        color: body.color || undefined,
        icono: body.icono || undefined
      }
    })

    return NextResponse.json(categoria, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear categoría:", error)
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
