'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  ExclamationTriangleIcon,
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

interface Producto {
  id: string
  nombre: string
  descripcion?: string
  marca?: string
  codigo?: string
  precioCosto: number
  precioVenta: number
  stock: number
  stockMinimo: number
  unidadMedida: string
  activo: boolean
  categoria: Categoria
}

export default function ProductosPage() {
  const { formatPrice } = usePriceFormatter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
  }, [])

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/productos?limit=100')
      const data = await response.json()
      setProductos(data.productos || [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
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

  const filteredProductos = productos.filter(producto => {
    const matchSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       producto.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCategoria = !filtroCategoria || producto.categoria.id === filtroCategoria
    
    let matchStock = true
    if (filtroStock === 'bajo') {
      matchStock = producto.stock <= producto.stockMinimo
    } else if (filtroStock === 'agotado') {
      matchStock = producto.stock === 0
    }
    
    return matchSearch && matchCategoria && matchStock
  })

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock === 0) {
      return { text: 'Agotado', color: 'bg-red-100 text-red-800' }
    } else if (stock <= stockMinimo) {
      return { text: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { text: 'Disponible', color: 'bg-green-100 text-green-800' }
    }
  }

  const getMargen = (costo: number, venta: number) => {
    return ((venta - costo) / costo * 100).toFixed(1)
  }

  const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo && p.stock > 0).length
  const productosAgotados = productos.filter(p => p.stock === 0).length

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
          <h1 className="text-2xl font-bold text-gray-900">Productos e Inventario</h1>
          <p className="text-gray-600">Gestiona tu inventario y precios de productos</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/productos/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Link>
          <Link
            href="/dashboard/servicios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <TagIcon className="h-4 w-4 mr-2" />
            Ver Servicios
          </Link>
        </div>
      </div>

      {/* Alertas de Stock */}
      {(productosStockBajo > 0 || productosAgotados > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Atención:</strong> 
                {productosAgotados > 0 && ` ${productosAgotados} productos agotados`}
                {productosAgotados > 0 && productosStockBajo > 0 && ' y '}
                {productosStockBajo > 0 && ` ${productosStockBajo} productos con stock bajo`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
              Buscar Productos
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nombre, marca o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
              <FunnelIcon className="h-4 w-4 inline mr-1" />
              Categoría
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

          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Stock
            </label>
            <select
              id="stock"
              value={filtroStock}
              onChange={(e) => setFiltroStock(e.target.value)}
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="" className="text-gray-900 bg-white">Todos los productos</option>
              <option value="bajo" className="text-gray-900 bg-white">Stock bajo</option>
              <option value="agotado" className="text-gray-900 bg-white">Agotados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFiltroCategoria('')
                setFiltroStock('')
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
                <CubeIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Productos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {productos.length}
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
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Stock Bajo
                  </dt>
                  <dd className="text-lg font-medium text-yellow-600">
                    {productosStockBajo}
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
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Agotados
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {productosAgotados}
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
                    Valor Inventario
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatPrice(productos.reduce((sum, p) => sum + (p.precioCosto * p.stock), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredProductos.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filtroCategoria || filtroStock
                  ? 'No se encontraron productos con los filtros seleccionados.' 
                  : 'Comienza agregando un nuevo producto.'}
              </p>
              {!searchTerm && !filtroCategoria && !filtroStock && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/productos/nuevo"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Link>
                </div>
              )}
            </li>
          ) : (
            filteredProductos.map((producto) => {
              const stockStatus = getStockStatus(producto.stock, producto.stockMinimo)
              return (
                <li key={producto.id}>
                  <Link
                    href={`/dashboard/productos/${producto.id}`}
                    className="block hover:bg-gray-50 px-6 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div 
                            className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: producto.categoria.color || '#6B7280' }}
                          >
                            <span className="text-lg">
                              {producto.categoria.icono || '📦'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h4 className="text-lg font-medium text-gray-900">
                              {producto.nombre}
                            </h4>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {producto.marca && (
                              <span>Marca: {producto.marca}</span>
                            )}
                            {producto.codigo && (
                              <span>Código: {producto.codigo}</span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {producto.categoria.nombre}
                            </span>
                          </div>
                          {producto.descripcion && (
                            <p className="mt-1 text-sm text-gray-500 truncate max-w-md">
                              {producto.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="text-right space-y-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-xs text-gray-500">Costo</p>
                              <p className="text-sm font-medium text-gray-700">
                                {formatPrice(producto.precioCosto)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Venta</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(producto.precioVenta)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Margen</p>
                              <p className="text-sm font-medium text-green-600">
                                +{getMargen(producto.precioCosto, producto.precioVenta)}%
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Stock</p>
                            <p className="text-sm font-medium text-gray-900">
                              {producto.stock} {producto.unidadMedida}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
