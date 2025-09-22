import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar que la cuenta existe y está activa
    const cuenta = await prisma.cuentaBancaria.findUnique({
      where: { id }
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta bancaria no encontrada' },
        { status: 404 }
      )
    }

    if (!cuenta.activa) {
      return NextResponse.json(
        { error: 'No se puede establecer como predeterminada una cuenta inactiva' },
        { status: 400 }
      )
    }

    // Desmarcar todas las cuentas como predeterminadas
    await prisma.cuentaBancaria.updateMany({
      where: { predeterminada: true },
      data: { predeterminada: false }
    })

    // Marcar esta cuenta como predeterminada
    const cuentaActualizada = await prisma.cuentaBancaria.update({
      where: { id },
      data: { 
        predeterminada: true,
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
    console.error('Error al establecer cuenta predeterminada:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

