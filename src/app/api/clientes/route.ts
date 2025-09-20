import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    const where = {
      activo: true, // Solo mostrar clientes activos
      ...(search ? {
        OR: [
          { nombre: { contains: search } },
          { apellido: { contains: search } },
          { email: { contains: search } },
          { telefono: { contains: search } }
        ]
      } : {})
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              citas: true
            }
          },
          citas: {
            select: {
              id: true,
              fecha: true,
              estado: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.cliente.count({ where })
    ])

    return NextResponse.json({
      clientes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Datos recibidos para crear cliente:", body)
    
    // Validar campos obligatorios
    if (!body.nombre || !body.apellido) {
      console.log("Error: Faltan campos obligatorios")
      return NextResponse.json(
        { error: "Nombre y apellido son obligatorios" },
        { status: 400 }
      )
    }

    // Validar email si se proporciona
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "El formato del email no es válido" },
          { status: 400 }
        )
      }

      // Verificar que no exista otro cliente activo con el mismo email
      const existingClienteEmail = await prisma.cliente.findFirst({
        where: {
          email: body.email.trim(),
          activo: true
        }
      })

      if (existingClienteEmail) {
        return NextResponse.json(
          { error: "Ya existe un cliente activo con ese email" },
          { status: 409 }
        )
      }
    }

    // Verificar que no exista otro cliente activo con el mismo nombre completo
    const existingClienteNombre = await prisma.cliente.findFirst({
      where: {
        nombre: body.nombre.trim(),
        apellido: body.apellido.trim(),
        activo: true
      }
    })

    if (existingClienteNombre) {
      return NextResponse.json(
        { error: "Ya existe un cliente activo con ese nombre y apellido" },
        { status: 409 }
      )
    }

    // Verificar teléfono si se proporciona
    if (body.telefono) {
      const existingClienteTelefono = await prisma.cliente.findFirst({
        where: {
          telefono: body.telefono.trim(),
          activo: true
        }
      })

      if (existingClienteTelefono) {
        return NextResponse.json(
          { error: "Ya existe un cliente activo con ese teléfono" },
          { status: 409 }
        )
      }
    }

    // Crear el cliente
    const cliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre.trim(),
        apellido: body.apellido.trim(),
        telefono: body.telefono?.trim() || undefined,
        email: body.email?.trim() || undefined,
        tipoPelo: body.tipoPelo || 'LISO',
        redesSociales: body.redesSociales?.trim() || undefined,
        notas: body.notas?.trim() || undefined,
        activo: true
      },
      include: {
        _count: {
          select: {
            citas: true
          }
        }
      }
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear cliente:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese email" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
