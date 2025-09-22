'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CurrencyDollarIcon,
  PlusIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface Pago {
  id: string
  monto: number
  montoServicio: number
  propina: number
  descuento: number
  metodoPago: string
  estadoPago: string
  fechaPago: string
  referencia?: string
  notas?: string
  cita: {
    id: string
    fecha: string
    hora: string
    servicio?: string
    estado: string
    cliente: {
      id: string
      nombre: string
      apellido: string
      telefono?: string
    }
  }
  usuario?: {
    id: string
    name: string
  }
}

interface EstadisticasDiarias {
  fecha: string
  totalIngresos: number
  totalPagos: number
  promedioTicket: number
  metodosPopulares: { [key: string]: number }
  serviciosRealizados: number
  clientesAtendidos: number
}

export default function CobrosPage() {
  const { formatPrice } = usePriceFormatter()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasDiarias | null>(null)
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'pagos' | 'contabilidad'>('pagos')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })
  const [filtros, setFiltros] = useState({
    metodoPago: '',
    estadoPago: '',
    fechaDesde: '',
    fechaHasta: ''
  })

  useEffect(() => {
    if (vistaActiva === 'pagos') {
      fetchPagos()
    } else {
      fetchEstadisticasDiarias()
    }
  }, [vistaActiva, fechaSeleccionada, filtros])

  const fetchPagos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtros.metodoPago) params.append('metodoPago', filtros.metodoPago)
      if (filtros.estadoPago) params.append('estadoPago', filtros.estadoPago)
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde)
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta)

      const response = await fetch(`/api/pagos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPagos(data.pagos || [])
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticasDiarias = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contabilidad/diaria?fecha=${fechaSeleccionada}`)
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO':
        return <BanknotesIcon className="h-5 w-5 text-green-500" />
      case 'TARJETA_CREDITO':
      case 'TARJETA_DEBITO':
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'PENDIENTE':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors = {
      COMPLETADO: 'bg-green-100 text-green-800',
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CANCELADO: 'bg-red-100 text-red-800',
      REEMBOLSADO: 'bg-purple-100 text-purple-800'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + 'T12:00:00')
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // Calcular estadísticas de los pagos cargados
  const estadisticasPagos = {
    total: pagos.reduce((sum, pago) => sum + pago.monto, 0),
    cantidad: pagos.length,
    promedio: pagos.length > 0 ? pagos.reduce((sum, pago) => sum + pago.monto, 0) / pagos.length : 0,
    propinas: pagos.reduce((sum, pago) => sum + (pago.propina || 0), 0),
    descuentos: pagos.reduce((sum, pago) => sum + (pago.descuento || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header con pestañas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Cobros</h1>
              <p className="text-gray-600">Gestión de pagos y contabilidad diaria</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard/cobros/nuevo"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Registrar Pago
              </Link>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-t border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setVistaActiva('pagos')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                vistaActiva === 'pagos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <CurrencyDollarIcon className="h-5 w-5 mr-2 inline" />
              Pagos y Cobros
            </button>
            <button
              onClick={() => setVistaActiva('contabilidad')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                vistaActiva === 'contabilidad'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2 inline" />
              Contabilidad Diaria
            </button>
          </nav>
        </div>
      </div>

      {/* Vista de Pagos */}
      {vistaActiva === 'pagos' && (
        <>
          {/* Estadísticas de pagos */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-green-500 p-3 rounded-md">
                      <CurrencyDollarIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Cobrado
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatPrice(estadisticasPagos.total)}
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
                    <div className="bg-blue-500 p-3 rounded-md">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Pagos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {estadisticasPagos.cantidad}
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
                      <ChartBarIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ticket Promedio
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatPrice(estadisticasPagos.promedio)}
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
                      <BanknotesIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Propinas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatPrice(estadisticasPagos.propinas)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FunnelIcon className="h-4 w-4 inline mr-1" />
                  Método de Pago
                </label>
                <select
                  value={filtros.metodoPago}
                  onChange={(e) => setFiltros(prev => ({ ...prev, metodoPago: e.target.value }))}
                  className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Todos los métodos</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filtros.estadoPago}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estadoPago: e.target.value }))}
                  className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Lista de pagos */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Registro de Pagos ({pagos.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos registrados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza registrando tu primer pago.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/cobros/nuevo"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <div key={pago.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getMetodoIcon(pago.metodoPago)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/dashboard/clientes/${pago.cita.cliente.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              {pago.cita.cliente.nombre} {pago.cita.cliente.apellido}
                            </Link>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(pago.estadoPago)}`}>
                              {pago.estadoPago}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {pago.cita.servicio} - {new Date(pago.cita.fecha).toLocaleDateString('es-ES')} a las {pago.cita.hora}
                          </div>
                          {pago.cita.cliente.telefono && (
                            <div className="mt-1 text-xs text-gray-500">
                              📞 {pago.cita.cliente.telefono}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Pagado el {new Date(pago.fechaPago).toLocaleDateString('es-ES')} 
                            {pago.usuario && ` por ${pago.usuario.name}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-medium text-gray-900">
                          {formatPrice(pago.monto)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pago.metodoPago.replace('_', ' ')}
                        </div>
                        {pago.propina > 0 && (
                          <div className="text-xs text-green-600">
                            +{formatPrice(pago.propina)} propina
                          </div>
                        )}
                        {pago.descuento > 0 && (
                          <div className="text-xs text-red-600">
                            -{formatPrice(pago.descuento)} descuento
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Vista de Contabilidad Diaria */}
      {vistaActiva === 'contabilidad' && (
        <>
          {/* Selector de fecha */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Contabilidad del {formatearFecha(fechaSeleccionada)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Resumen financiero completo del día
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="block px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas diarias */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : estadisticas ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="bg-green-500 p-3 rounded-md">
                          <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Ingresos Totales
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatPrice(estadisticas.totalIngresos)}
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
                        <div className="bg-blue-500 p-3 rounded-md">
                          <DocumentTextIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Servicios Realizados
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {estadisticas.serviciosRealizados}
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
                          <ChartBarIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Ticket Promedio
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {formatPrice(estadisticas.promedioTicket)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose por métodos de pago */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Desglose por Método de Pago
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(estadisticas.metodosPopulares).map(([metodo, cantidad]) => (
                      <div key={metodo} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {getMetodoIcon(metodo)}
                        </div>
                        <div className="text-lg font-medium text-gray-900">{cantidad}</div>
                        <div className="text-sm text-gray-500">{metodo.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin datos para esta fecha</h3>
              <p className="mt-1 text-sm text-gray-500">
                No hay registros contables para el día seleccionado.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
