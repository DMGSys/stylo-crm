import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activasOnly = searchParams.get('activasOnly') === 'true'

    const where: any = {}
    if (activasOnly) {
      where.activa = true
    }

    const cuentas = await prisma.cuentaBancaria.findMany({
      where,
      include: {
        _count: {
          select: {
            pagos: true
          }
        }
      },
      orderBy: [
        { predeterminada: 'desc' },
        { activa: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      cuentas,
      total: cuentas.length
    })

  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error)
    return NextResponse.json(
      { error: 'Error al obtener las cuentas bancarias' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      banco,
      titular,
      tipoCuenta,
      cvu,
      cbu,
      alias,
      iban,
      numeroCuenta,
      codigoSwift,
      moneda = 'ARS',
      notas,
      predeterminada = false
    } = body

    // Validar campos requeridos
    if (!nombre || !banco || !titular || !tipoCuenta) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, banco, titular, tipoCuenta' },
        { status: 400 }
      )
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (predeterminada) {
      await prisma.cuentaBancaria.updateMany({
        where: { predeterminada: true },
        data: { predeterminada: false }
      })
    }

    // Crear la cuenta
    const nuevaCuenta = await prisma.cuentaBancaria.create({
      data: {
        nombre: nombre.trim(),
        banco: banco.trim(),
        titular: titular.trim(),
        tipoCuenta: tipoCuenta.trim(),
        cvu: cvu?.trim() || undefined,
        cbu: cbu?.trim() || undefined,
        alias: alias?.trim() || undefined,
        iban: iban?.trim() || undefined,
        numeroCuenta: numeroCuenta?.trim() || undefined,
        codigoSwift: codigoSwift?.trim() || undefined,
        moneda,
        notas: notas?.trim() || undefined,
        predeterminada,
        activa: true
      },
      include: {
        _count: {
          select: {
            pagos: true
          }
        }
      }
    })

    return NextResponse.json(nuevaCuenta, { status: 201 })

  } catch (error) {
    console.error('Error al crear cuenta bancaria:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta bancaria' },
      { status: 500 }
    )
  }
}

