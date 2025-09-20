import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: id
      },
      include: {
        citas: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            estado: true,
            servicio: true,
            precio: true,
            notas: true
          },
          orderBy: {
            fecha: "desc"
          }
        },
        historialCambios: {
          include: {
            usuario: {
              select: {
                name: true,
                email: true
              }
            },
            cita: {
              select: {
                id: true,
                servicio: true,
                precio: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al obtener cliente:", error)
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
    
    // Validar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: id }
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // Validar duplicados si se están cambiando datos únicos
    if (body.email && body.email !== clienteExistente.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "El formato del email no es válido" },
          { status: 400 }
        )
      }

      const existingEmail = await prisma.cliente.findFirst({
        where: {
          email: body.email.trim(),
          activo: true,
          id: { not: id } // Excluir el cliente actual
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: "Ya existe otro cliente activo con ese email" },
          { status: 409 }
        )
      }
    }

    // Validar nombre completo si se está cambiando
    if ((body.nombre && body.nombre !== clienteExistente.nombre) || 
        (body.apellido && body.apellido !== clienteExistente.apellido)) {
      const nombreFinal = body.nombre || clienteExistente.nombre
      const apellidoFinal = body.apellido || clienteExistente.apellido
      
      const existingNombre = await prisma.cliente.findFirst({
        where: {
          nombre: nombreFinal.trim(),
          apellido: apellidoFinal.trim(),
          activo: true,
          id: { not: id }
        }
      })

      if (existingNombre) {
        return NextResponse.json(
          { error: "Ya existe otro cliente activo con ese nombre y apellido" },
          { status: 409 }
        )
      }
    }

    // Validar teléfono si se está cambiando
    if (body.telefono && body.telefono !== clienteExistente.telefono) {
      const existingTelefono = await prisma.cliente.findFirst({
        where: {
          telefono: body.telefono.trim(),
          activo: true,
          id: { not: id }
        }
      })

      if (existingTelefono) {
        return NextResponse.json(
          { error: "Ya existe otro cliente activo con ese teléfono" },
          { status: 409 }
        )
      }
    }

    // Actualizar cliente
    const cliente = await prisma.cliente.update({
      where: {
        id: id
      },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        citas: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            estado: true,
            servicio: true,
            precio: true,
            notas: true
          },
          orderBy: {
            fecha: "desc"
          }
        }
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
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
    // Verificar que el cliente existe
    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            citas: true
          }
        }
      }
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    // En lugar de eliminar, desactivar el cliente
    const clienteDesactivado = await prisma.cliente.update({
      where: { id: id },
      data: { 
        activo: false,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            citas: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Cliente desactivado correctamente",
      cliente: clienteDesactivado
    })
  } catch (error) {
    console.error("Error al desactivar cliente:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
