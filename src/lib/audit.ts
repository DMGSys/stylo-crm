import { prisma } from "./prisma"

export interface AuditLogData {
  usuarioId?: string
  accion: 'CREATE' | 'UPDATE' | 'DELETE'
  entidad: 'Cliente' | 'Cita' | 'User' | 'Configuracion'
  entidadId: string
  datosAntes?: any
  datosDespues?: any
  ip?: string
  userAgent?: string
}

// Función para crear un log de auditoría
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: data.usuarioId,
        accion: data.accion,
        entidad: data.entidad,
        entidadId: data.entidadId,
        datosAntes: data.datosAntes ? JSON.stringify(data.datosAntes) : undefined,
        datosDespues: data.datosDespues ? JSON.stringify(data.datosDespues) : undefined,
        ip: data.ip,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    console.error('Error al crear log de auditoría:', error)
    // No lanzar error para no interrumpir la operación principal
  }
}

// Función para obtener logs de auditoría
export async function getAuditLogs(
  filters: {
    usuarioId?: string
    entidad?: string
    accion?: string
    fechaDesde?: Date
    fechaHasta?: Date
    page?: number
    limit?: number
  } = {}
) {
  try {
    const {
      usuarioId,
      entidad,
      accion,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 50
    } = filters

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (usuarioId) where.usuarioId = usuarioId
    if (entidad) where.entidad = entidad
    if (accion) where.accion = accion
    
    if (fechaDesde || fechaHasta) {
      where.createdAt = {}
      if (fechaDesde) where.createdAt.gte = fechaDesde
      if (fechaHasta) where.createdAt.lte = fechaHasta
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error)
    return {
      logs: [],
      pagination: { page: 1, limit, total: 0, pages: 0 }
    }
  }
}

// Función helper para obtener IP del request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Función helper para obtener User Agent
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}

// Función para verificar permisos por rol
export function hasPermission(userRole: string, action: string, resource: string): boolean {
  const permissions = {
    ADMINISTRADOR: {
      clientes: ['create', 'read', 'update', 'delete'],
      citas: ['create', 'read', 'update', 'delete'],
      usuarios: ['create', 'read', 'update', 'delete'],
      configuracion: ['read', 'update'],
      auditoria: ['read']
    },
    ESTILISTA: {
      clientes: ['create', 'read', 'update'],
      citas: ['create', 'read', 'update'],
      usuarios: [],
      configuracion: ['read'],
      auditoria: []
    }
  }

  const userPermissions = permissions[userRole as keyof typeof permissions]
  if (!userPermissions) return false

  const resourcePermissions = userPermissions[resource as keyof typeof userPermissions]
  if (!resourcePermissions) return false

  return resourcePermissions.includes(action)
}

// Función para crear mensajes de WhatsApp con configuración
export function createWhatsAppMessage(cita: any, cliente: any, config?: any): string {
  // Usar configuración pasada o valores por defecto
  const nombreNegocio = config?.negocio?.nombre || 'Peluquería Elegance'
  const direccionNegocio = config?.negocio?.direccion || 'Calle Principal 123, Madrid'
  const telefonoNegocio = config?.negocio?.telefono || '+34 666 123 456'
  const simboloMoneda = config?.moneda?.simbolo || '€'
  const posicionMoneda = config?.moneda?.posicion || 'after'
  const decimales = config?.moneda?.decimales || 2

  const fecha = new Date(cita.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Formatear precio según configuración
  let precioFormateado = ''
  if (cita.precio) {
    const precioTexto = cita.precio.toFixed(decimales)
    if (posicionMoneda === 'before') {
      precioFormateado = ` - Precio: ${simboloMoneda}${precioTexto}`
    } else {
      precioFormateado = ` - Precio: ${precioTexto}${simboloMoneda}`
    }
  }

  return `${nombreNegocio}

¡Hola ${cliente.nombre}!

Te confirmamos tu cita:

📅 Fecha: ${fecha}
🕐 Hora: ${cita.hora}
💇‍♀️ Servicio: ${cita.servicio || 'Servicio de peluquería'}${precioFormateado}

📍 Dirección: ${direccionNegocio}
📞 Teléfono: ${telefonoNegocio}

${cita.notas ? `📝 Notas: ${cita.notas}\n\n` : ''}¡Te esperamos!

Para cancelar o reprogramar, responde a este mensaje.`
}
