import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password } = body

    // Validaciones básicas
    if (!password) {
      return NextResponse.json(
        { error: 'La contraseña es obligatoria' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Actualizar contraseña
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Crear log de auditoría
    await createAuditLog({
      accion: 'UPDATE',
      entidad: 'User',
      entidadId: id,
      datosAntes: {
        action: 'password_change'
      },
      datosDespues: {
        action: 'password_changed',
        timestamp: new Date().toISOString()
      },
      ip: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    })

  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
