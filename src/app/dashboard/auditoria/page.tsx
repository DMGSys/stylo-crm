'use client'

import { useState, useEffect } from 'react'
import { useAuthRequired } from '@/lib/auth'
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface AuditLog {
  id: string
  accion: string
  entidad: string
  entidadId: string
  datosAntes?: string
  datosDespues?: string
  ip?: string
  userAgent?: string
  createdAt: string
  usuario?: {
    id: string
    name?: string
    email: string
    role: string
  }
}

export default function AuditoriaPage() {
  const { user, loading: authLoading } = useAuthRequired(['ADMINISTRADOR'])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    entidad: '',
    accion: '',
    usuarioId: '',
    fechaDesde: '',
    fechaHasta: ''
  })
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'ADMINISTRADOR' && !authLoading) {
      fetchLogs()
    }
  }, [user, authLoading, filtros])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/auditoria?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error al cargar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      entidad: '',
      accion: '',
      usuarioId: '',
      fechaDesde: '',
      fechaHasta: ''
    })
  }

  const getAccionColor = (accion: string) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800'
    }
    return colors[accion as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getEntidadIcon = (entidad: string) => {
    const icons = {
      Cliente: UserIcon,
      Cita: ClockIcon,
      User: UserIcon,
      Configuracion: DocumentTextIcon
    }
    const IconComponent = icons[entidad as keyof typeof icons] || DocumentTextIcon
    return <IconComponent className="h-5 w-5" />
  }

  const formatearDatos = (datos: string) => {
    try {
      const parsed = JSON.parse(datos)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return datos
    }
  }

  // La verificación de permisos ya se maneja en useAuthRequired
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Calcular estadísticas
  const estadisticas = {
    total: logs.length,
    acciones: {
      CREATE: logs.filter(log => log.accion === 'CREATE').length,
      UPDATE: logs.filter(log => log.accion === 'UPDATE').length,
      DELETE: logs.filter(log => log.accion === 'DELETE').length
    },
    entidades: {
      Cliente: logs.filter(log => log.entidad === 'Cliente').length,
      Cita: logs.filter(log => log.entidad === 'Cita').length,
      User: logs.filter(log => log.entidad === 'User').length,
      Configuracion: logs.filter(log => log.entidad === 'Configuracion').length
    },
    usuarios: [...new Set(logs.map(log => log.usuario?.name || 'Sistema'))].length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auditoría del Sistema</h1>
              <p className="text-gray-600">Historial de cambios y acciones de usuarios</p>
            </div>
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Registros
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Usuarios Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.usuarios}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 p-3 rounded-md">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Creaciones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.acciones.CREATE}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-purple-500 p-3 rounded-md">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Modificaciones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {estadisticas.acciones.UPDATE}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="entidad" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Entidad
            </label>
            <select
              id="entidad"
              value={filtros.entidad}
              onChange={(e) => handleFiltroChange('entidad', e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" className="text-gray-900 bg-white">Todas las entidades</option>
              <option value="Cliente" className="text-gray-900 bg-white">Clientes</option>
              <option value="Cita" className="text-gray-900 bg-white">Citas</option>
              <option value="User" className="text-gray-900 bg-white">Usuarios</option>
              <option value="Configuracion" className="text-gray-900 bg-white">Configuración</option>
            </select>
          </div>

          <div>
            <label htmlFor="accion" className="block text-sm font-medium text-gray-700 mb-2">
              Acción
            </label>
            <select
              id="accion"
              value={filtros.accion}
              onChange={(e) => handleFiltroChange('accion', e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" className="text-gray-900 bg-white">Todas las acciones</option>
              <option value="CREATE" className="text-gray-900 bg-white">Crear</option>
              <option value="UPDATE" className="text-gray-900 bg-white">Actualizar</option>
              <option value="DELETE" className="text-gray-900 bg-white">Eliminar</option>
            </select>
          </div>

          <div>
            <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              id="fechaDesde"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              id="fechaHasta"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron logs de auditoría con los filtros seleccionados.
              </p>
            </li>
          ) : (
            logs.map((log) => (
              <li key={log.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {getEntidadIcon(log.entidad)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {log.usuario?.name || 'Sistema'} 
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccionColor(log.accion)}`}>
                            {log.accion}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {log.entidad}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString('es-ES')}
                          {log.usuario?.email && (
                            <span className="ml-2">• {log.usuario.email}</span>
                          )}
                          {log.ip && (
                            <span className="ml-2">• IP: {log.ip}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {expandedLog === log.id ? 'Ocultar' : 'Ver detalles'}
                    </button>
                  </div>
                  
                  {expandedLog === log.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {log.datosAntes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Datos Anteriores:</h4>
                            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto">
                              {formatearDatos(log.datosAntes)}
                            </pre>
                          </div>
                        )}
                        {log.datosDespues && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Datos Nuevos:</h4>
                            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto">
                              {formatearDatos(log.datosDespues)}
                            </pre>
                          </div>
                        )}
                      </div>
                      {log.userAgent && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">
                            <strong>Navegador:</strong> {log.userAgent}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
