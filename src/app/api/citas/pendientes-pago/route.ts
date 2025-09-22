import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Obtener citas realizadas que no tienen pago registrado
    const citasPendientes = await prisma.cita.findMany({
      where: {
        estado: 'REALIZADA',
        pago: null // No tienen pago asociado
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        },
        servicioRef: {
          select: {
            nombre: true,
            precioVenta: true,
            precioBase: true
          }
        }
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ]
    })

    return NextResponse.json({
      citas: citasPendientes,
      total: citasPendientes.length
    })

  } catch (error) {
    console.error('Error al obtener citas pendientes de pago:', error)
    return NextResponse.json(
      { error: 'Error al obtener las citas pendientes de pago' },
      { status: 500 }
    )
  }
}
