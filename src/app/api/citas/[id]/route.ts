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

    // Actualizar cita
    const cita = await prisma.cita.update({
      where: {
        id: id
      },
      data: {
        ...body,
        updatedAt: new Date()
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
