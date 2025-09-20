'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface Cita {
  id: string
  fecha: string
  hora: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA' | 'REAGENDADA'
  servicio?: string
  precio?: number
  notas?: string
  cliente: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
    email?: string
  }
  usuario?: {
    id: string
    name?: string
  }
}

export default function AgendaPage() {
  const { formatPrice } = usePriceFormatter()
  const [citas, setCitas] = useState<Cita[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [filtroRapido, setFiltroRapido] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    // Si hay un parámetro de estado en la URL, usarlo como filtro inicial
    const estadoParam = searchParams.get('estado')
    if (estadoParam) {
      setFiltroEstado(estadoParam)
    }
    fetchCitas()
  }, [searchParams])

  const fetchCitas = async () => {
    try {
      const response = await fetch('/api/citas?limit=100')
      const data = await response.json()
      setCitas(data.citas || [])
    } catch (error) {
      console.error('Error al cargar citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFechaFiltroRapido = (filtro: string) => {
    const hoy = new Date()
    const mañana = new Date(hoy)
    mañana.setDate(hoy.getDate() + 1)
    
    switch (filtro) {
      case 'HOY':
        return hoy.toISOString().split('T')[0]
      case 'MAÑANA':
        return mañana.toISOString().split('T')[0]
      case 'SEMANA':
        // Próximos 7 días
        return null // Se maneja en el filtro
      default:
        return null
    }
  }

  const filteredCitas = citas.filter(cita => {
    const matchEstado = filtroEstado === 'TODOS' || cita.estado === filtroEstado
    
    // Filtro de fecha específica
    const matchFecha = !fechaFiltro || new Date(cita.fecha).toISOString().split('T')[0] === fechaFiltro
    
    // Filtro rápido de fecha
    let matchFiltroRapido = true
    if (filtroRapido) {
      const fechaCita = new Date(cita.fecha)
      const hoy = new Date()
      
      switch (filtroRapido) {
        case 'HOY':
          matchFiltroRapido = fechaCita.toISOString().split('T')[0] === hoy.toISOString().split('T')[0]
          break
        case 'MAÑANA':
          const mañana = new Date(hoy)
          mañana.setDate(hoy.getDate() + 1)
          matchFiltroRapido = fechaCita.toISOString().split('T')[0] === mañana.toISOString().split('T')[0]
          break
        case 'SEMANA':
          const unaSemana = new Date(hoy)
          unaSemana.setDate(hoy.getDate() + 7)
          matchFiltroRapido = fechaCita >= hoy && fechaCita <= unaSemana
          break
        default:
          matchFiltroRapido = true
      }
    }
    
    return matchEstado && matchFecha && matchFiltroRapido
  })

  const getEstadoColor = (estado: string) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      REALIZADA: 'bg-blue-100 text-blue-800',
      CANCELADA: 'bg-red-100 text-red-800',
      REAGENDADA: 'bg-purple-100 text-purple-800'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatHora = (hora: string) => {
    return hora
  }

  const estadosCount = {
    TODOS: citas.length,
    PENDIENTE: citas.filter(c => c.estado === 'PENDIENTE').length,
    CONFIRMADA: citas.filter(c => c.estado === 'CONFIRMADA').length,
    REALIZADA: citas.filter(c => c.estado === 'REALIZADA').length,
    CANCELADA: citas.filter(c => c.estado === 'CANCELADA').length,
    REAGENDADA: citas.filter(c => c.estado === 'REAGENDADA').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gestiona las citas de tu peluquería</p>
        </div>
        <Link
          href="/dashboard/agenda/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Cita
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Filtrar por Estado
            </label>
            <select
              id="estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="block w-full pl-4 pr-10 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 min-h-[44px]"
            >
              <option value="TODOS" className="text-gray-900 bg-white font-medium">
                📋 Todos los estados ({estadosCount.TODOS})
              </option>
              <option value="PENDIENTE" className="text-yellow-800 bg-yellow-50 font-medium">
                ⏳ Pendientes ({estadosCount.PENDIENTE})
              </option>
              <option value="CONFIRMADA" className="text-green-800 bg-green-50 font-medium">
                ✅ Confirmadas ({estadosCount.CONFIRMADA})
              </option>
              <option value="REALIZADA" className="text-blue-800 bg-blue-50 font-medium">
                ✨ Realizadas ({estadosCount.REALIZADA})
              </option>
              <option value="CANCELADA" className="text-red-800 bg-red-50 font-medium">
                ❌ Canceladas ({estadosCount.CANCELADA})
              </option>
              <option value="REAGENDADA" className="text-purple-800 bg-purple-50 font-medium">
                🔄 Reagendadas ({estadosCount.REAGENDADA})
              </option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filtro-rapido" className="block text-sm font-medium text-gray-700 mb-2">
              ⚡ Filtros Rápidos
            </label>
            <select
              id="filtro-rapido"
              value={filtroRapido}
              onChange={(e) => {
                setFiltroRapido(e.target.value)
                if (e.target.value) {
                  setFechaFiltro('') // Limpiar filtro de fecha específica
                }
              }}
              className="block w-full pl-4 pr-10 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 min-h-[44px]"
            >
              <option value="" className="text-gray-900 bg-white">Seleccionar período...</option>
              <option value="HOY" className="text-blue-800 bg-blue-50 font-medium">
                📅 Hoy
              </option>
              <option value="MAÑANA" className="text-green-800 bg-green-50 font-medium">
                🌅 Mañana
              </option>
              <option value="SEMANA" className="text-purple-800 bg-purple-50 font-medium">
                📆 Próximos 7 días
              </option>
            </select>
          </div>
          
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Fecha Específica
            </label>
            <input
              type="date"
              id="fecha"
              value={fechaFiltro}
              onChange={(e) => {
                setFechaFiltro(e.target.value)
                if (e.target.value) {
                  setFiltroRapido('') // Limpiar filtro rápido
                }
              }}
              placeholder="Seleccionar fecha..."
              className="block w-full pl-4 pr-4 py-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 min-h-[44px]"
            />
          </div>
        </div>
        
        {/* Botón de limpiar filtros */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              setFiltroEstado('TODOS')
              setFechaFiltro('')
              setFiltroRapido('')
            }}
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-base sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors duration-200 min-h-[44px]"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Limpiar Todos los Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(estadosCount).map(([estado, count]) => (
          <div key={estado} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <dl>
                    <dt className="text-xs font-medium text-gray-500 truncate">
                      {estado === 'TODOS' ? 'Total' : estado.charAt(0) + estado.slice(1).toLowerCase()}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {count}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Citas List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredCitas.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filtroEstado !== 'TODOS' || fechaFiltro 
                  ? 'No se encontraron citas con los filtros seleccionados.' 
                  : 'Comienza agregando una nueva cita.'}
              </p>
              {filtroEstado === 'TODOS' && !fechaFiltro && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/agenda/nueva"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Cita
                  </Link>
                </div>
              )}
            </li>
          ) : (
            filteredCitas
              .sort((a, b) => new Date(a.fecha + ' ' + a.hora).getTime() - new Date(b.fecha + ' ' + b.hora).getTime())
              .map((cita) => (
                <li key={cita.id}>
                  <Link
                    href={`/dashboard/agenda/${cita.id}`}
                    className="block hover:bg-gray-50 px-3 sm:px-6 py-3 sm:py-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 flex-1">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {cita.cliente.nombre} {cita.cliente.apellido}
                            </div>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                              {cita.estado}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center mt-1 text-sm text-gray-500 space-y-1 sm:space-y-0">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{formatFecha(cita.fecha)}</span>
                            </div>
                            <div className="flex items-center sm:ml-4">
                              <ClockIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span>{formatHora(cita.hora)}</span>
                            </div>
                            {cita.cliente.telefono && (
                              <div className="flex items-center sm:ml-4">
                                <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{cita.cliente.telefono}</span>
                              </div>
                            )}
                          </div>
                          {cita.servicio && (
                            <div className="mt-1 text-sm text-gray-900 font-medium">
                              {cita.servicio}
                            </div>
                          )}
                          {cita.notas && (
                            <p className="mt-1 text-sm text-gray-500 truncate max-w-md">
                              {cita.notas}
                            </p>
                          )}
                        </div>
                      </div>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-2 sm:space-y-0">
                          <div className="text-left sm:text-right">
                            {cita.precio && (
                              <div className="flex items-center text-base sm:text-sm text-gray-900 font-medium">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span>{formatPrice(cita.precio)}</span>
                              </div>
                            )}
                            {cita.usuario?.name && (
                              <div className="text-xs text-gray-500 mt-1">
                                Atendido por: {cita.usuario.name}
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                  </Link>
                </li>
              ))
          )}
        </ul>
      </div>
    </div>
  )
}
