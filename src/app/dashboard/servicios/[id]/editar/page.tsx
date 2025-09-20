'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuthRequired } from '@/lib/auth'
import { usePriceFormatter } from '@/lib/config'

interface Servicio {
  id: string
  nombre: string
  descripcion?: string
  categoriaId: string
  precioBase: number
  precioVenta?: number
  duracionMinutos: number
  activo: boolean
  requiereProductos: boolean
  notas?: string
  categoria: {
    id: string
    nombre: string
  }
}

interface Categoria {
  id: string
  nombre: string
}

interface Producto {
  id: string
  nombre: string
  precioCompra: number
  precioVenta?: number
  stock: number
  unidadMedida: string
}

interface ServicioProducto {
  id: string
  productoId: string
  cantidad: number
  obligatorio: boolean
  producto: Producto
}

export default function EditarServicioPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR', 'ESTILISTA'])
  const { formatPrice } = usePriceFormatter()
  
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [servicioProductos, setServicioProductos] = useState<ServicioProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaId: '',
    precioBase: '',
    precioVenta: '',
    duracionMinutos: '30',
    activo: true,
    requiereProductos: false,
    notas: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchServicio(params.id as string)
      fetchCategorias()
      fetchProductos()
    }
  }, [params.id])

  const fetchServicio = async (id: string) => {
    try {
      const response = await fetch(`/api/servicios/${id}`)
      if (response.ok) {
        const data = await response.json()
        setServicio(data)
        setServicioProductos(data.servicioProductos || [])
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          categoriaId: data.categoriaId,
          precioBase: data.precioBase.toString(),
          precioVenta: data.precioVenta?.toString() || '',
          duracionMinutos: data.duracionMinutos.toString(),
          activo: data.activo,
          requiereProductos: data.requiereProductos,
          notas: data.notas || ''
        })
      }
    } catch (error) {
      console.error('Error al cargar servicio:', error)
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

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/productos?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProductos(data.productos || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
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
      const response = await fetch(`/api/servicios/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precioBase: parseFloat(formData.precioBase),
          precioVenta: formData.precioVenta ? parseFloat(formData.precioVenta) : null,
          duracionMinutos: parseInt(formData.duracionMinutos),
          productos: servicioProductos.map(sp => ({
            productoId: sp.productoId,
            cantidad: sp.cantidad,
            obligatorio: sp.obligatorio
          }))
        }),
      })

      if (response.ok) {
        router.push('/dashboard/servicios')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar servicio')
      }
    } catch (error) {
      console.error('Error al actualizar servicio:', error)
      alert('Error al actualizar servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/servicios/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/servicios')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar servicio')
      }
    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      alert('Error al eliminar servicio: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  const formatDuracion = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos} min`
    } else {
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
    }
  }

  const agregarProducto = (productoId: string, cantidad: number = 1, obligatorio: boolean = false) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) return

    const yaExiste = servicioProductos.find(sp => sp.productoId === productoId)
    if (yaExiste) return

    const nuevoServicioProducto: ServicioProducto = {
      id: `temp-${Date.now()}`, // ID temporal
      productoId,
      cantidad,
      obligatorio,
      producto
    }

    setServicioProductos(prev => [...prev, nuevoServicioProducto])
  }

  const actualizarProducto = (productoId: string, cantidad: number, obligatorio: boolean) => {
    setServicioProductos(prev => 
      prev.map(sp => 
        sp.productoId === productoId 
          ? { ...sp, cantidad, obligatorio }
          : sp
      )
    )
  }

  const eliminarProducto = (productoId: string) => {
    setServicioProductos(prev => prev.filter(sp => sp.productoId !== productoId))
  }

  const calcularCostoProductos = () => {
    return servicioProductos.reduce((total, sp) => {
      const precioCompra = sp.producto.precioCompra || 0
      const cantidad = sp.cantidad || 0
      return total + (precioCompra * cantidad)
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!servicio) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Servicio no encontrado</h3>
        <Link
          href="/dashboard/servicios"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          Volver a Servicios
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-6">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-3 sm:p-6 mb-3 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <Link
                href="/dashboard/servicios"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xs sm:text-sm">
                      {servicio.categoria?.icono || '💇‍♀️'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Editar Servicio</h1>
                    <p className="text-xs sm:text-sm text-gray-500">{servicio.categoria?.nombre}</p>
                  </div>
                </div>
                <p className="text-sm sm:text-lg text-blue-600 font-medium mt-1 truncate">{servicio.nombre}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                servicio.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {servicio.activo ? '✅ Activo' : '❌ Inactivo'}
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
              <p className="text-sm text-gray-500 mt-1">Detalles principales del servicio</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">✂️</span>
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Corte Clásico, Tinte Completo..."
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
                    placeholder="Descripción detallada del servicio..."
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

                {/* Duración */}
                <div>
                  <label htmlFor="duracionMinutos" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <ClockIcon className="h-4 w-4 text-blue-500 mr-2" />
                    Duración *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="duracionMinutos"
                      name="duracionMinutos"
                      value={formData.duracionMinutos}
                      onChange={handleInputChange}
                      min="15"
                      max="480"
                      step="15"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 text-gray-900 placeholder-gray-500"
                      placeholder="30"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">min</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                    ⏱️ Tiempo estimado: <span className="font-medium">{formatDuracion(parseInt(formData.duracionMinutos) || 30)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Precios y Costos */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-green-500 mr-2">💰</span>
                Precios y Costos
              </h3>
              <p className="text-sm text-gray-500 mt-1">Gestión de precios y márgenes de ganancia</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Precio Base */}
                <div>
                  <label htmlFor="precioBase" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-green-500 mr-2">💵</span>
                    Precio Base (Costo) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="precioBase"
                      name="precioBase"
                      value={formData.precioBase}
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
                  <p className="mt-1 text-xs text-gray-500">Costo del servicio (sin margen)</p>
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
                  {formData.precioVenta && formData.precioBase && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Margen de ganancia:</span>
                        <span className={`font-medium px-2 py-1 rounded-md ${
                          parseFloat(formData.precioVenta) > parseFloat(formData.precioBase)
                            ? 'text-green-700 bg-green-100'
                            : 'text-red-700 bg-red-100'
                        }`}>
                          {((parseFloat(formData.precioVenta) - parseFloat(formData.precioBase)) / parseFloat(formData.precioBase) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Ganancia: ${(parseFloat(formData.precioVenta) - parseFloat(formData.precioBase)).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Configuración Adicional */}
          <div className="bg-white shadow-md rounded-lg border-2 border-gray-200">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="h-5 w-5 text-purple-500 mr-2">⚙️</span>
                Configuración Adicional
              </h3>
              <p className="text-sm text-gray-500 mt-1">Opciones y notas del servicio</p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="space-y-6">
                {/* Notas */}
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-purple-500 mr-2">📝</span>
                    Notas
                  </label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Notas adicionales sobre el servicio..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white hover:border-gray-400 resize-none text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="text-purple-500 mr-2">🔧</span>
                    Opciones del Servicio
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors">
                      <input
                        id="requiereProductos"
                        name="requiereProductos"
                        type="checkbox"
                        checked={formData.requiereProductos}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requiereProductos" className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          📦 Requiere productos del inventario
                        </div>
                        <div className="text-xs text-gray-500">
                          Este servicio consume productos del inventario
                        </div>
                      </label>
                    </div>

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
                          {formData.activo ? '✅ Servicio activo' : '❌ Servicio inactivo'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formData.activo 
                            ? 'El servicio está disponible para nuevas citas'
                            : 'El servicio no estará disponible para nuevas citas'
                          }
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Gestión de Productos (solo si requiere productos) */}
                {formData.requiereProductos && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center mb-4">
                      <span className="text-purple-500 mr-2">📦</span>
                      Productos Requeridos
                    </h4>
                    
                    {/* Agregar Producto */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              agregarProducto(e.target.value)
                              e.target.value = '' // Limpiar selección
                            }
                          }}
                          className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleccionar producto...</option>
                          {productos
                            .filter(p => !servicioProductos.find(sp => sp.productoId === p.id))
                            .map((producto) => (
                              <option key={producto.id} value={producto.id}>
                                {producto.nombre} - {formatPrice(producto.precioCompra || 0)} ({producto.stock} {producto.unidadMedida})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Lista de Productos */}
                    {servicioProductos.length > 0 && (
                      <div className="space-y-3">
                        {servicioProductos.map((sp) => (
                          <div key={sp.productoId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-900">{sp.producto.nombre}</h5>
                                  <p className="text-xs text-gray-500">
                                    Stock: {sp.producto.stock} {sp.producto.unidadMedida} • 
                                    Costo: {formatPrice(sp.producto.precioCompra || 0)} cada uno
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatPrice((sp.producto.precioCompra || 0) * sp.cantidad)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {sp.cantidad} × {formatPrice(sp.producto.precioCompra || 0)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <label className="text-xs text-gray-600">Cantidad:</label>
                                    <input
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      value={sp.cantidad}
                                      onChange={(e) => actualizarProducto(sp.productoId, parseFloat(e.target.value), sp.obligatorio)}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-500">{sp.producto.unidadMedida}</span>
                                  </div>
                                  
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={sp.obligatorio}
                                      onChange={(e) => actualizarProducto(sp.productoId, sp.cantidad, e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-1 text-xs text-gray-600">Obligatorio</span>
                                  </label>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => eliminarProducto(sp.productoId)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  ❌ Quitar
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Resumen de Costos */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-blue-900">Costo total de productos:</span>
                            <span className="font-bold text-blue-900">{formatPrice(calcularCostoProductos())}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-blue-800">Precio base del servicio:</span>
                            <span className="text-blue-800">{formatPrice(parseFloat(formData.precioBase) || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-blue-200">
                            <span className="font-bold text-blue-900">Costo total:</span>
                            <span className="font-bold text-blue-900">
                              {formatPrice((parseFloat(formData.precioBase) || 0) + calcularCostoProductos())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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
                Eliminar Servicio
              </button>

              <div className="flex flex-col items-stretch space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <Link
                  href="/dashboard/servicios"
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
