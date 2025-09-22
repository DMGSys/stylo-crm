import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const clienteId = searchParams.get('clienteId')
    const tipoRegistro = searchParams.get('tipoRegistro')

    // Construir filtros
    const where: any = {}
    
    if (clienteId) {
      where.clienteId = clienteId
    }
    
    if (tipoRegistro && tipoRegistro !== 'TODOS') {
      where.tipoRegistro = tipoRegistro
    }

    // Obtener registros del historial
    const registros = await prisma.historialCliente.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        },
        usuario: {
          select: {
            id: true,
            name: true
          }
        },
        cita: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            servicio: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Obtener el total de registros para paginación
    const totalRegistros = await prisma.historialCliente.count({
      where
    })

    return NextResponse.json({
      registros,
      total: totalRegistros,
      limit,
      offset,
      hasMore: offset + limit < totalRegistros
    })

  } catch (error) {
    console.error('Error al obtener historial:', error)
    return NextResponse.json(
      { error: 'Error al obtener el historial' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clienteId,
      citaId,
      tipoRegistro,
      titulo,
      descripcion,
      datosAntes,
      datosDespues,
      fotos,
      usuarioId
    } = body

    // Validar campos requeridos
    if (!clienteId || !tipoRegistro || !titulo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: clienteId, tipoRegistro, titulo' },
        { status: 400 }
      )
    }

    // Validar que el tipo de registro sea válido
    const tiposValidos = ['SERVICIO', 'CAMBIO_FISICO', 'FOTO', 'NOTA']
    if (!tiposValidos.includes(tipoRegistro)) {
      return NextResponse.json(
        { error: 'Tipo de registro no válido' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Crear el registro de historial
    const nuevoRegistro = await prisma.historialCliente.create({
      data: {
        clienteId,
        citaId,
        tipoRegistro,
        titulo,
        descripcion,
        datosAntes,
        datosDespues,
        fotos,
        usuarioId
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
        usuario: {
          select: {
            id: true,
            name: true
          }
        },
        cita: {
          select: {
            id: true,
            fecha: true,
            hora: true,
            servicio: true
          }
        }
      }
    })

    return NextResponse.json(nuevoRegistro, { status: 201 })

  } catch (error) {
    console.error('Error al crear registro de historial:', error)
    return NextResponse.json(
      { error: 'Error al crear el registro de historial' },
      { status: 500 }
    )
  }
}
