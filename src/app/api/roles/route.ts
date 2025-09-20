import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activo = searchParams.get('activo')
    
    const where: any = {}
    if (activo !== null) where.activo = activo === 'true'

    const roles = await prisma.role.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        icono: true,
        activo: true,
        permisos: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usuarios: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      roles,
      total: roles.length
    })

  } catch (error) {
    console.error('Error al obtener roles:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, color, icono, permisos, activo = true } = body

    // Validaciones básicas
    if (!nombre || !permisos) {
      return NextResponse.json(
        { error: 'Nombre y permisos son obligatorios' },
        { status: 400 }
      )
    }

    // Verificar si el nombre ya existe
    const existingRole = await prisma.role.findUnique({
      where: { nombre }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Ya existe un rol con ese nombre' },
        { status: 400 }
      )
    }

    // Validar estructura de permisos
    if (typeof permisos !== 'object' || Array.isArray(permisos)) {
      return NextResponse.json(
        { error: 'Los permisos deben ser un objeto válido' },
        { status: 400 }
      )
    }

    // Crear rol
    const nuevoRol = await prisma.role.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim(),
        color: color || '#6B7280',
        icono: icono || '👤',
        permisos,
        activo
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        color: true,
        icono: true,
        activo: true,
        permisos: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usuarios: true
          }
        }
      }
    })

    // Crear log de auditoría
    await createAuditLog({
      accion: 'CREATE',
      entidad: 'Role',
      entidadId: nuevoRol.id,
      datosDespues: {
        nombre: nuevoRol.nombre,
        descripcion: nuevoRol.descripcion,
        color: nuevoRol.color,
        icono: nuevoRol.icono,
        activo: nuevoRol.activo,
        permisos: nuevoRol.permisos
      },
      ip: getClientIP(request),
      userAgent: getUserAgent(request)
    })

    return NextResponse.json(nuevoRol, { status: 201 })

  } catch (error) {
    console.error('Error al crear rol:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
