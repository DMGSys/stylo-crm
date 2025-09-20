'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  tipoPelo: string
  redesSociales?: string
  fotos?: string
  notas?: string
  createdAt: string
  updatedAt: string
}

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    tipoPelo: 'LISO',
    redesSociales: '',
    notas: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchCliente(params.id as string)
    }
  }, [params.id])

  const fetchCliente = async (id: string) => {
    try {
      const response = await fetch(`/api/clientes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCliente(data)
        
        // Inicializar formulario con datos del cliente
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          email: data.email || '',
          tipoPelo: data.tipoPelo || 'LISO',
          redesSociales: data.redesSociales || '',
          notas: data.notas || ''
        })
      } else {
        console.error('Cliente no encontrado')
        router.push('/dashboard/clientes')
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error)
      router.push('/dashboard/clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre y apellido son obligatorios' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const response = await fetch(`/api/clientes/${cliente!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          telefono: formData.telefono.trim() || undefined,
          email: formData.email.trim() || undefined,
          tipoPelo: formData.tipoPelo,
          redesSociales: formData.redesSociales.trim() || undefined,
          notas: formData.notas.trim() || undefined
        })
      })

      if (response.ok) {
        const clienteActualizado = await response.json()
        setCliente(clienteActualizado)
        setMensaje({ tipo: 'success', texto: 'Cliente actualizado exitosamente' })
        
        // Redirigir al detalle del cliente después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/clientes/${cliente!.id}`)
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar cliente')
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al actualizar el cliente' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('¿Estás seguro de que quieres desactivar este cliente? El cliente será removido de las listas pero mantendrá su historial de citas.')) {
      return
    }

    try {
      const response = await fetch(`/api/clientes/${cliente!.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Cliente desactivado exitosamente' })
        setTimeout(() => {
          router.push('/dashboard/clientes')
        }, 1500)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al desactivar cliente')
      }
    } catch (error) {
      console.error('Error al desactivar cliente:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al desactivar el cliente' })
    }
  }

  const getHairTypeColor = (tipo: string) => {
    const colors = {
      LISO: 'bg-blue-100 text-blue-800',
      RIZADO: 'bg-purple-100 text-purple-800',
      ONDULADO: 'bg-green-100 text-green-800',
      TEÑIDO: 'bg-pink-100 text-pink-800',
      MIXTO: 'bg-yellow-100 text-yellow-800'
    }
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getHairTypeAvatar = (tipoPelo: string) => {
    const avatars = {
      LISO: '🧑‍🦰',
      RIZADO: '👩‍🦱',
      ONDULADO: '🧑‍🦱',
      TEÑIDO: '👩‍🎤',
      MIXTO: '🧑‍🎨'
    }
    return avatars[tipoPelo as keyof typeof avatars] || '👤'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Cliente no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El cliente que buscas no existe o ha sido eliminado.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/clientes"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href={`/dashboard/clientes/${cliente.id}`}
            className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Cliente
            </h1>
            <p className="text-gray-600">Modifica la información de {cliente.nombre} {cliente.apellido}</p>
          </div>
        </div>
        <button
          onClick={handleDeactivate}
          className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Desactivar Cliente
        </button>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`rounded-lg p-4 shadow-sm ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border-l-4 border-green-400' 
            : 'bg-red-50 border-l-4 border-red-400'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {mensaje.tipo === 'success' ? (
                <CheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <XMarkIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {mensaje.texto}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      required
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      id="apellido"
                      required
                      value={formData.apellido}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="tipoPelo" className="block text-sm font-medium text-gray-700">
                      Tipo de Pelo
                    </label>
                    <select
                      id="tipoPelo"
                      value={formData.tipoPelo}
                      onChange={(e) => handleInputChange('tipoPelo', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="LISO" className="text-gray-900 bg-white">Liso</option>
                      <option value="RIZADO" className="text-gray-900 bg-white">Rizado</option>
                      <option value="ONDULADO" className="text-gray-900 bg-white">Ondulado</option>
                      <option value="TEÑIDO" className="text-gray-900 bg-white">Teñido</option>
                      <option value="MIXTO" className="text-gray-900 bg-white">Mixto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="redesSociales" className="block text-sm font-medium text-gray-700">
                      Redes Sociales
                    </label>
                    <input
                      type="text"
                      id="redesSociales"
                      value={formData.redesSociales}
                      onChange={(e) => handleInputChange('redesSociales', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ej: @usuario_instagram"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                      Notas
                    </label>
                    <textarea
                      id="notas"
                      rows={4}
                      value={formData.notas}
                      onChange={(e) => handleInputChange('notas', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Observaciones, preferencias, alergias, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Preview */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vista Previa</h3>
              </div>
              <div className="px-6 py-4">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full mx-auto bg-gray-100 flex items-center justify-center border-2 border-gray-200 mb-4">
                    <span className="text-3xl">{getHairTypeAvatar(formData.tipoPelo)}</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {formData.nombre || 'Nombre'} {formData.apellido || 'Apellido'}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHairTypeColor(formData.tipoPelo)} mt-2`}>
                    {formData.tipoPelo}
                  </span>
                  {(formData.telefono || formData.email) && (
                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                      {formData.telefono && <div>📞 {formData.telefono}</div>}
                      {formData.email && <div>✉️ {formData.email}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información Original</h3>
              </div>
              <div className="px-6 py-4 text-sm text-gray-600">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Cliente desde:</span> {new Date(cliente.createdAt).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span> {new Date(cliente.updatedAt).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Eliminar Cliente
          </button>
          
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/clientes/${cliente.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.nombre.trim() || !formData.apellido.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
