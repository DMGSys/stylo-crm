import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pagos: true
          }
        }
      }
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(cuenta)
  } catch (error) {
    console.error('Error al obtener cuenta bancaria:', error)
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
    
    // Verificar que la cuenta existe
    const cuentaExistente = await prisma.cuentaBancaria.findUnique({
      where: { id }
    })

    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (body.predeterminada === true) {
      await prisma.cuentaBancaria.updateMany({
        where: { 
          predeterminada: true,
          id: { not: id }
        },
        data: { predeterminada: false }
      })
    }

    // Actualizar la cuenta
    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            pagos: true
          }
        }
      }
    })

    return NextResponse.json(cuentaActualizada)
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error)
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
    
    // Verificar que la cuenta existe
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pagos: true
          }
        }
      }
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no tenga pagos asociados
    if (cuenta._count.pagos > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la cuenta porque tiene ${cuenta._count.pagos} pagos asociados` },
        { status: 409 }
      )
    }

    // Eliminar la cuenta
    await prisma.cuentaBancaria.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Cuenta bancaria eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

