import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true,
        _count: {
          select: {
            citas: true,
            auditLogs: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(usuario)

  } catch (error) {
    console.error('Error al obtener usuario:', error)
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
    const body = await request.json()

    // Obtener usuario actual para auditoría
    const usuarioAnterior = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true
      }
    })

    if (!usuarioAnterior) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos para actualizar
    const updateData: any = {}

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: 'El nombre es obligatorio' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.email !== undefined) {
      if (!body.email.includes('@')) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }

      // Verificar que el email no esté en uso por otro usuario
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.email.toLowerCase().trim(),
          NOT: { id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con ese email' },
          { status: 400 }
        )
      }

      updateData.email = body.email.toLowerCase().trim()
    }

    if (body.role !== undefined) {
      if (!['ADMINISTRADOR', 'ESTILISTA'].includes(body.role)) {
        return NextResponse.json(
          { error: 'Rol inválido' },
          { status: 400 }
        )
      }
      updateData.role = body.role
    }

    if (body.activo !== undefined) {
      updateData.activo = body.activo
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        ultimoAcceso: true,
        _count: {
          select: {
            citas: true,
            auditLogs: true
          }
        }
      }
    })

    // Crear log de auditoría
    await createAuditLog({
      accion: 'UPDATE',
      entidad: 'User',
      entidadId: id,
      datosAntes: usuarioAnterior,
      datosDespues: {
        name: usuarioActualizado.name,
        email: usuarioActualizado.email,
        role: usuarioActualizado.role,
        activo: usuarioActualizado.activo
      },
      ip: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json(usuarioActualizado)

  } catch (error) {
    console.error('Error al actualizar usuario:', error)
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

    // Obtener usuario para auditoría
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            citas: true,
            auditLogs: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el usuario tiene citas asociadas
    if (usuario._count.citas > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el usuario porque tiene ${usuario._count.citas} citas asociadas. Puedes desactivarlo en su lugar.` },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id }
    })

    // Crear log de auditoría
    await createAuditLog({
      accion: 'DELETE',
      entidad: 'User',
      entidadId: id,
      datosAntes: {
        name: usuario.name,
        email: usuario.email,
        role: usuario.role
      },
      ip: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario eliminado correctamente' 
    })

  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
