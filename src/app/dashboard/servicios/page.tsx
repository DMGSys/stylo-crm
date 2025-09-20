'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface Categoria {
  id: string
  nombre: string
  color?: string
  icono?: string
}

interface Servicio {
  id: string
  nombre: string
  descripcion?: string
  precioBase: number
  precioVenta?: number
  duracionMinutos: number
  activo: boolean
  requiereProductos: boolean
  categoria: Categoria
}

export default function ServiciosPage() {
  const { formatPrice } = usePriceFormatter()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    fetchServicios()
    fetchCategorias()
  }, [])

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios?limit=100')
      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      const data = await response.json()
      setCategorias(data.categorias || [])
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const filteredServicios = servicios.filter(servicio => {
    const matchSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       servicio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = !filtroCategoria || servicio.categoria.id === filtroCategoria
    return matchSearch && matchCategoria
  })

  const getDuracionText = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    
    if (horas > 0 && mins > 0) {
      return `${horas}h ${mins}min`
    } else if (horas > 0) {
      return `${horas}h`
    } else {
      return `${mins}min`
    }
  }

  const getMargen = (precioBase: number, precioVenta?: number) => {
    if (!precioVenta) return 0
    return ((precioVenta - precioBase) / precioBase * 100).toFixed(1)
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
          <h1 className="text-2xl font-bold text-gray-900">Servicios y Precios</h1>
          <p className="text-gray-600">Gestiona tu catálogo de servicios y productos</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/servicios/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </Link>
          <Link
            href="/dashboard/productos"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <TagIcon className="h-4 w-4 mr-2" />
            Ver Productos
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
              Buscar Servicios
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Filtrar por Categoría
            </label>
            <select
              id="categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" className="text-gray-900 bg-white">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id} className="text-gray-900 bg-white">
                  {categoria.icono} {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFiltroCategoria('')
              }}
              className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Servicios
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {servicios.length}
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
                <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Precio Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {servicios.length > 0 
                      ? formatPrice(servicios.reduce((sum, s) => sum + (s.precioVenta || s.precioBase), 0) / servicios.length)
                      : formatPrice(0)
                    }
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
                <ClockIcon className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Duración Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {servicios.length > 0 
                      ? getDuracionText(Math.round(servicios.reduce((sum, s) => sum + s.duracionMinutos, 0) / servicios.length))
                      : '0min'
                    }
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
                <TagIcon className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categorías
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {categorias.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Servicios */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredServicios.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay servicios</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filtroCategoria 
                  ? 'No se encontraron servicios con los filtros seleccionados.' 
                  : 'Comienza agregando un nuevo servicio.'}
              </p>
              {!searchTerm && !filtroCategoria && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/servicios/nuevo"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nuevo Servicio
                  </Link>
                </div>
              )}
            </li>
          ) : (
            filteredServicios.map((servicio) => (
              <li key={servicio.id}>
                <Link
                  href={`/dashboard/servicios/${servicio.id}/editar`}
                  className="block hover:bg-gray-50 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: servicio.categoria.color || '#6B7280' }}
                        >
                          <span className="text-lg">
                            {servicio.categoria.icono || '💇‍♀️'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h4 className="text-lg font-medium text-gray-900">
                            {servicio.nombre}
                          </h4>
                          {servicio.requiereProductos && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Requiere productos
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{servicio.descripcion}</p>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {servicio.categoria.nombre}
                          </span>
                          <ClockIcon className="h-4 w-4 ml-4 mr-1" />
                          {getDuracionText(servicio.duracionMinutos)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-xs text-gray-500">Costo</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatPrice(servicio.precioBase)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Venta</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatPrice(servicio.precioVenta || servicio.precioBase)}
                            </p>
                          </div>
                          {servicio.precioVenta && (
                            <div>
                              <p className="text-xs text-gray-500">Margen</p>
                              <p className="text-sm font-medium text-green-600">
                                +{getMargen(servicio.precioBase, servicio.precioVenta)}%
                              </p>
                            </div>
                          )}
                        </div>
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
