'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuthRequired } from '@/lib/auth'
import { usePriceFormatter } from '@/lib/config'

interface Producto {
  id: string
  nombre: string
  descripcion?: string
  categoriaId: string
  marca?: string
  codigo?: string
  precioCosto: number
  precioVenta: number
  stock: number
  stockMinimo: number
  unidadMedida: string
  activo: boolean
  fechaVencimiento?: string
  proveedor?: string
  notas?: string
  categoria: {
    id: string
    nombre: string
    icono?: string
    color?: string
  }
  servicioProductos?: {
    servicio: {
      id: string
      nombre: string
    }
  }[]
  movimientos?: {
    id: string
    tipo: string
    cantidad: number
    createdAt: string
    usuario?: {
      name?: string
    }
  }[]
}

interface Categoria {
  id: string
  nombre: string
  icono?: string
  color?: string
}

export default function EditarProductoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR', 'ESTILISTA'])
  const { formatPrice } = usePriceFormatter()
  
  const [producto, setProducto] = useState<Producto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: '',
    marca: '',
    codigo: '',
    precioCosto: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '',
    unidadMedida: '',
    activo: true,
    fechaVencimiento: '',
    proveedor: '',
    notas: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchProducto(params.id as string)
      fetchCategorias()
    }
  }, [params.id])

  const fetchProducto = async (id: string) => {
    try {
      const response = await fetch(`/api/productos/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProducto(data)
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          categoriaId: data.categoriaId,
          marca: data.marca || '',
          codigo: data.codigo || '',
          precioCosto: data.precioCosto.toString(),
          precioVenta: data.precioVenta?.toString() || '',
          stock: data.stock.toString(),
          stockMinimo: data.stockMinimo?.toString() || '',
          unidadMedida: data.unidadMedida,
          activo: data.activo,
          fechaVencimiento: data.fechaVencimiento || '',
          proveedor: data.proveedor || '',
          notas: data.notas || ''
        })
      }
    } catch (error) {
      console.error('Error al cargar producto:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/productos/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precioCosto: parseFloat(formData.precioCosto),
          precioVenta: formData.precioVenta ? parseFloat(formData.precioVenta) : null,
          stock: parseInt(formData.stock),
          stockMinimo: formData.stockMinimo ? parseInt(formData.stockMinimo) : null
        }),
      })

      if (response.ok) {
        router.push('/dashboard/productos')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar producto')
      }
    } catch (error) {
      console.error('Error al actualizar producto:', error)
      alert('Error al actualizar producto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/productos')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      alert('Error al eliminar producto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const getStockStatus = () => {
    if (!producto) return 'normal'
    
    const stockMinimo = producto.stockMinimo || 5
    if (producto.stock <= 0) return 'agotado'
    if (producto.stock <= stockMinimo) return 'bajo'
    return 'normal'
  }

  const getStockColor = () => {
    const status = getStockStatus()
    switch (status) {
      case 'agotado': return 'text-red-600 bg-red-100'
      case 'bajo': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Producto no encontrado</h3>
        <Link
          href="/dashboard/productos"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          Volver a Productos
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-6">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-3 sm:p-6 mb-3 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Link
                href="/dashboard/productos"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: producto.categoria?.color || '#6B7280' }}
                  >
                    <span className="text-xs sm:text-sm">
                      {producto.categoria?.icono || '📦'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Editar Producto</h1>
                    <p className="text-xs sm:text-sm text-gray-500">{producto.categoria?.nombre}</p>
                  </div>
                </div>
                <p className="text-sm sm:text-lg text-blue-600 font-medium mt-1 truncate">{producto.nombre}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockColor()}`}>
                {getStockStatus() === 'agotado' ? '❌ Agotado' : 
                 getStockStatus() === 'bajo' ? '⚠️ Stock Bajo' : '✅ Stock OK'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                producto.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {producto.activo ? '✅ Activo' : '❌ Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-blue-500 mr-2">📝</span>
                Información Básica
              </h3>
              <p className="text-sm text-gray-500 mt-1">Detalles principales del producto</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">📦</span>
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Shampoo Profesional, Tinte Rubio..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">📄</span>
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Descripción detallada del producto..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">🏷️</span>
                    Categoría *
                  </label>
                  <select
                    id="categoriaId"
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  >
                    <option value="" className="text-gray-500 bg-white">Seleccionar categoría...</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id} className="text-gray-900 bg-white">
                        {categoria.icono} {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">🏷️</span>
                    Marca
                  </label>
                  <input
                    type="text"
                    id="marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    placeholder="Ej: L'Oréal, Schwarzkopf..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Código */}
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">🔢</span>
                    Código
                  </label>
                  <input
                    type="text"
                    id="codigo"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    placeholder="Ej: SH001, TI002..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">📏</span>
                    Unidad de Medida *
                  </label>
                  <select
                    id="unidadMedida"
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  >
                    <option value="" className="text-gray-500 bg-white">Seleccionar unidad...</option>
                    <option value="ml" className="text-gray-900 bg-white">ml (mililitros)</option>
                    <option value="gr" className="text-gray-900 bg-white">gr (gramos)</option>
                    <option value="unidad" className="text-gray-900 bg-white">unidad</option>
                    <option value="piezas" className="text-gray-900 bg-white">piezas</option>
                    <option value="pares" className="text-gray-900 bg-white">pares</option>
                    <option value="metros" className="text-gray-900 bg-white">metros</option>
                  </select>
                </div>

                {/* Proveedor */}
                <div>
                  <label htmlFor="proveedor" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">🏢</span>
                    Proveedor
                  </label>
                  <input
                    type="text"
                    id="proveedor"
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                    placeholder="Ej: Distribuidora Beauty..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inventario y Stock */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-purple-500 mr-2">📊</span>
                Inventario y Stock
              </h3>
              <p className="text-sm text-gray-500 mt-1">Control de existencias y alertas</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Stock Actual */}
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <CubeIcon className="h-4 w-4 text-purple-500 mr-2" />
                    Stock Actual *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      required
                      placeholder="0.0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">{formData.unidadMedida}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-purple-500 mr-2" />
                    Stock Mínimo
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="stockMinimo"
                      name="stockMinimo"
                      value={formData.stockMinimo}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="5.0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">{formData.unidadMedida}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Alerta cuando el stock esté por debajo de este valor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-green-500 mr-2">💰</span>
                Precios
              </h3>
              <p className="text-sm text-gray-500 mt-1">Gestión de costos y precios de venta</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Precio de Costo */}
                <div>
                  <label htmlFor="precioCosto" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-green-500 mr-2">💵</span>
                    Precio de Costo *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="precioCosto"
                      name="precioCosto"
                      value={formData.precioCosto}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Costo por {formData.unidadMedida}</p>
                </div>

                {/* Precio de Venta */}
                <div>
                  <label htmlFor="precioVenta" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-green-500 mr-2">💰</span>
                    Precio de Venta
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="precioVenta"
                      name="precioVenta"
                      value={formData.precioVenta}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                  </div>
                  {formData.precioVenta && formData.precioCosto && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Margen de ganancia:</span>
                        <span className={`font-medium px-2 py-1 rounded-md ${
                          parseFloat(formData.precioVenta) > parseFloat(formData.precioCosto)
                            ? 'text-green-700 bg-green-100'
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {((parseFloat(formData.precioVenta) - parseFloat(formData.precioCosto)) / parseFloat(formData.precioCosto) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Precio por {formData.unidadMedida} (opcional)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración Adicional */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-orange-500 mr-2">⚙️</span>
                Configuración Adicional
              </h3>
              <p className="text-sm text-gray-500 mt-1">Opciones y notas del producto</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="space-y-6">
                {/* Fecha de Vencimiento */}
                <div>
                  <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-orange-500 mr-2">📅</span>
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    id="fechaVencimiento"
                    name="fechaVencimiento"
                    value={formData.fechaVencimiento}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional - Para productos con fecha de caducidad
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-orange-500 mr-2">📝</span>
                    Notas
                  </label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Notas adicionales sobre el producto..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Estado Activo */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors">
                  <input
                    id="activo"
                    name="activo"
                    type="checkbox"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {formData.activo ? '✅ Producto activo' : '❌ Producto inactivo'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formData.activo 
                        ? 'El producto está disponible para usar en servicios'
                        : 'El producto no estará disponible para nuevos servicios'
                      }
                    </div>
                  </label>
                </div>

                {/* Información de Uso */}
                {producto.servicioProductos && producto.servicioProductos.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">🔗 Usado en Servicios:</h4>
                    <div className="space-y-1">
                      {producto.servicioProductos.map((sp) => (
                        <div key={sp.servicio.id} className="text-sm text-blue-800">
                          • {sp.servicio.nombre}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col items-stretch space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 sm:py-3 border-2 border-red-300 text-base sm:text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors min-h-[48px]"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Eliminar Producto
              </button>

              <div className="flex flex-col items-stretch space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <Link
                  href="/dashboard/productos"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 sm:py-3 border-2 border-gray-300 text-base sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-h-[48px]"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 sm:py-3 border border-transparent text-base sm:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all sm:transform sm:hover:scale-105 min-h-[48px]"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
