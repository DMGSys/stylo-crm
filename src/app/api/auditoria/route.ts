import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getAuditLogs } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea administrador
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const filtros = {
      entidad: searchParams.get("entidad") || undefined,
      accion: searchParams.get("accion") || undefined,
      usuarioId: searchParams.get("usuarioId") || undefined,
      fechaDesde: searchParams.get("fechaDesde") ? new Date(searchParams.get("fechaDesde")!) : undefined,
      fechaHasta: searchParams.get("fechaHasta") ? new Date(searchParams.get("fechaHasta")!) : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50")
    }

    const result = await getAuditLogs(filtros)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al obtener logs de auditoría:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
