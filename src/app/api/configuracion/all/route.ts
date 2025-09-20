import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const configuraciones = await prisma.configuracion.findMany({
      orderBy: [
        { categoria: 'asc' },
        { clave: 'asc' }
      ]
    })

    return NextResponse.json(configuraciones)
  } catch (error) {
    console.error("Error al obtener configuraciones detalladas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
