import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const configuraciones = await prisma.configuracion.findMany()
    
    // Convertir array de configuraciones a objeto clave-valor
    const config: Record<string, string> = {}
    configuraciones.forEach(conf => {
      config[conf.clave] = conf.valor
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error al obtener configuraciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Actualizar cada configuración individualmente para evitar transacciones
    for (const [clave, valor] of Object.entries(body)) {
      try {
        // Buscar si existe
        const existe = await prisma.configuracion.findUnique({
          where: { clave }
        })

        if (existe) {
          // Actualizar
          await prisma.configuracion.update({
            where: { clave },
            data: {
              valor: String(valor),
              updatedAt: new Date()
            }
          })
        } else {
          // Crear nuevo
          await prisma.configuracion.create({
            data: {
              clave,
              valor: String(valor),
              tipo: 'string',
              categoria: 'general'
            }
          })
        }
      } catch (error) {
        console.error(`Error procesando configuración ${clave}:`, error)
      }
    }

    // Obtener las configuraciones actualizadas
    const configuraciones = await prisma.configuracion.findMany()
    const config: Record<string, string> = {}
    configuraciones.forEach(conf => {
      config[conf.clave] = conf.valor
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error al actualizar configuraciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { clave, valor } = body

    if (!clave || valor === undefined) {
      return NextResponse.json(
        { error: "Clave y valor son requeridos" },
        { status: 400 }
      )
    }

    // Buscar si la configuración existe
    const existe = await prisma.configuracion.findUnique({
      where: { clave }
    })

    let configuracion
    if (existe) {
      // Actualizar configuración existente
      configuracion = await prisma.configuracion.update({
        where: { clave },
        data: {
          valor: String(valor),
          updatedAt: new Date()
        }
      })
    } else {
      // Crear nueva configuración
      configuracion = await prisma.configuracion.create({
        data: {
          clave,
          valor: String(valor),
          tipo: 'string',
          categoria: 'general'
        }
      })
    }

    return NextResponse.json(configuracion)
  } catch (error) {
    console.error("Error al actualizar configuración:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
