'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuthRequired } from '@/lib/auth'
import { usePriceFormatter } from '@/lib/config'

interface Categoria {
  id: string
  nombre: string
}

export default function NuevoServicioPage() {
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR', 'ESTILISTA'])
  const { formatPrice } = usePriceFormatter()
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
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
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precioBase: parseFloat(formData.precioBase),
          precioVenta: formData.precioVenta ? parseFloat(formData.precioVenta) : null,
          duracionMinutos: parseInt(formData.duracionMinutos)
        }),
      })

      if (response.ok) {
        router.push('/dashboard/servicios')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear servicio')
      }
    } catch (error) {
      console.error('Error al crear servicio:', error)
      alert('Error al crear servicio')
    } finally {
      setSaving(false)
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
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/servicios"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Servicio</h1>
            <p className="text-gray-600">Crear un nuevo servicio para tu catálogo</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Corte Clásico"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={3}
                placeholder="Descripción detallada del servicio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                id="categoriaId"
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Duración */}
            <div>
              <label htmlFor="duracionMinutos" className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="inline h-4 w-4 mr-1" />
                Duración (minutos) *
              </label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tiempo estimado: {formatDuracion(parseInt(formData.duracionMinutos) || 30)}
              </p>
            </div>

            {/* Precio Base */}
            <div>
              <label htmlFor="precioBase" className="block text-sm font-medium text-gray-700 mb-2">
                Precio Base (Costo) *
              </label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Precio de Venta */}
            <div>
              <label htmlFor="precioVenta" className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta
              </label>
              <input
                type="number"
                id="precioVenta"
                name="precioVenta"
                value={formData.precioVenta}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formData.precioVenta && formData.precioBase && (
                <p className="mt-1 text-xs text-gray-500">
                  Margen: {((parseFloat(formData.precioVenta) - parseFloat(formData.precioBase)) / parseFloat(formData.precioBase) * 100).toFixed(1)}%
                </p>
              )}
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows={2}
                placeholder="Notas adicionales sobre el servicio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Checkboxes */}
            <div className="sm:col-span-2 space-y-4">
              <div className="flex items-center">
                <input
                  id="requiereProductos"
                  name="requiereProductos"
                  type="checkbox"
                  checked={formData.requiereProductos}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiereProductos" className="ml-2 block text-sm text-gray-900">
                  Requiere productos del inventario
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                  Servicio activo
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end space-x-3">
          <Link
            href="/dashboard/servicios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Creando...' : 'Crear Servicio'}
          </button>
        </div>
      </form>
    </div>
  )
}
