import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const estado = searchParams.get("estado")

    const skip = (page - 1) * limit

    const where = estado ? { estado } : {}

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: limit,
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
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          fecha: "asc"
        }
      }),
      prisma.cita.count({ where })
    ])

    return NextResponse.json({
      citas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error al obtener citas:", error)
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
    if (!body.clienteId || !body.fecha || !body.hora) {
      return NextResponse.json(
        { error: "Cliente, fecha y hora son obligatorios" },
        { status: 400 }
      )
    }

    // Validar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: body.clienteId }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Obtener información del servicio si se proporciona
    let servicio = null
    let precioCalculado = body.precio ? parseFloat(body.precio) : 0

    if (body.servicioId) {
      servicio = await prisma.servicio.findUnique({
        where: { id: body.servicioId },
        include: {
          categoria: true
        }
      })

      if (servicio) {
        // Usar precio de venta del servicio si no se especifica precio
        if (!body.precio || body.precio === '') {
          precioCalculado = servicio.precioVenta || servicio.precioBase
        }
      }
    }

    // Validar conflictos de horario solo si no se permite superposición
    const permitirSuperposicion = body.permitirSuperposicion === true
    const fechaHora = new Date(body.fecha)

    if (!permitirSuperposicion) {
      const conflicto = await prisma.cita.findFirst({
        where: {
          fecha: fechaHora,
          hora: body.hora,
          estado: {
            in: ['PENDIENTE', 'CONFIRMADA']
          }
        }
      })

      if (conflicto) {
        return NextResponse.json(
          { error: "Ya hay una cita programada para esa fecha y hora" },
          { status: 409 }
        )
      }
    }

    // Crear la cita
    const cita = await prisma.cita.create({
      data: {
        clienteId: body.clienteId,
        servicioId: body.servicioId || undefined,
        fecha: fechaHora,
        hora: body.hora,
        estado: body.estado || 'PENDIENTE',
        servicio: body.servicio?.trim() || (servicio ? servicio.nombre : undefined),
        precio: precioCalculado > 0 ? precioCalculado : undefined,
        notas: body.notas?.trim() || undefined,
        recordatorio: body.recordatorio || false
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            tipoPelo: true
          }
        },
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(cita, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear cita:", error)
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
