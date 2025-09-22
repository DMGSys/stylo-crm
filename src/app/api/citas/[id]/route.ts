import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cita = await prisma.cita.findUnique({
      where: {
        id: id
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            tipoPelo: true,
            fotos: true
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

    if (!cita) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(cita)
  } catch (error) {
    console.error("Error al obtener cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
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
    const body = await request.json()
    
    // Validar que la cita existe
    const citaExistente = await prisma.cita.findUnique({
      where: { id: id }
    })

    if (!citaExistente) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      )
    }

    // Validar campos obligatorios
    if (!body.clienteId || !body.fecha || !body.hora) {
      return NextResponse.json(
        { error: "Cliente, fecha y hora son obligatorios" },
        { status: 400 }
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

    // Validar conflictos de horario solo si no se permite superposición y cambió la fecha/hora
    const permitirSuperposicion = body.permitirSuperposicion === true
    const fechaHora = new Date(body.fecha)
    
    const cambioHorario = 
      new Date(citaExistente.fecha).getTime() !== fechaHora.getTime() || 
      citaExistente.hora !== body.hora

    if (!permitirSuperposicion && cambioHorario) {
      const conflicto = await prisma.cita.findFirst({
        where: {
          fecha: fechaHora,
          hora: body.hora,
          id: { not: id }, // Excluir la cita actual
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

    // Preparar datos para actualización
    const updateData: any = {
      clienteId: body.clienteId,
      servicioId: body.servicioId || undefined,
      fecha: fechaHora,
      hora: body.hora,
      estado: body.estado || citaExistente.estado,
      servicio: body.servicio?.trim() || (servicio ? servicio.nombre : undefined),
      precio: precioCalculado > 0 ? precioCalculado : undefined,
      notas: body.notas?.trim() || undefined,
      recordatorio: body.recordatorio !== undefined ? body.recordatorio : citaExistente.recordatorio,
      updatedAt: new Date()
    }

    // Actualizar cita
    const cita = await prisma.cita.update({
      where: {
        id: id
      },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            tipoPelo: true,
            fotos: true
          }
        },
        usuario: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        servicioRef: {
          select: {
            id: true,
            nombre: true,
            duracionMinutos: true,
            precioVenta: true,
            precioBase: true,
            categoria: {
              select: {
                nombre: true,
                icono: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(cita)
  } catch (error) {
    console.error("Error al actualizar cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
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
    // Verificar que la cita existe
    const citaExistente = await prisma.cita.findUnique({
      where: { id: id }
    })

    if (!citaExistente) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      )
    }

    // Eliminar cita
    await prisma.cita.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: "Cita eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar cita:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
