'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function NuevoClientePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoPelo: 'LISO',
    colorOriginalPelo: '',
    redesSociales: '',
    notas: ''
  })

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
      const response = await fetch('/api/clientes', {
        method: 'POST',
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
        const nuevoCliente = await response.json()
        setMensaje({ tipo: 'success', texto: 'Cliente creado exitosamente' })
        
        // Redirigir al detalle del cliente después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/clientes/${nuevoCliente.id}`)
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cliente')
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al crear el cliente' })
    } finally {
      setSaving(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard/clientes"
            className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
            <p className="text-gray-600">Agrega un nuevo cliente a tu base de datos</p>
          </div>
        </div>
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
                      placeholder="Ej: María"
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
                      placeholder="Ej: García"
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
                      placeholder="Ej: +34 666 123 456"
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
                      placeholder="Ej: maria@email.com"
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
                      placeholder="Ej: @maria_garcia"
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
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/clientes"
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
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Crear Cliente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
