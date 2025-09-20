'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthRequired } from '@/lib/auth'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface Usuario {
  id: string
  name?: string
  email: string
  role: 'ADMINISTRADOR' | 'ESTILISTA'
  activo?: boolean
  createdAt: string
  updatedAt: string
  ultimoAcceso?: string
  _count?: {
    citas: number
    auditLogs: number
  }
}

export default function EditarUsuarioPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR'])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ESTILISTA',
    activo: true
  })

  useEffect(() => {
    if (params.id) {
      fetchUsuario(params.id as string)
    }
  }, [params.id])

  const fetchUsuario = async (id: string) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`)
      if (response.ok) {
        const data = await response.json()
        setUsuario(data)
        
        // Inicializar formulario con datos del usuario
        setFormData({
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'ESTILISTA',
          activo: data.activo !== false
        })
      } else {
        console.error('Usuario no encontrado')
        router.push('/dashboard/usuarios')
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error)
      router.push('/dashboard/usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.name.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es obligatorio' })
      return
    }

    if (!formData.email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El email es obligatorio' })
      return
    }

    if (!formData.email.includes('@')) {
      setMensaje({ tipo: 'error', texto: 'Email inválido' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const response = await fetch(`/api/usuarios/${usuario!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          activo: formData.activo
        })
      })

      if (response.ok) {
        const usuarioActualizado = await response.json()
        setUsuario(usuarioActualizado)
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado correctamente' })
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard/usuarios')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al actualizar el usuario' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${usuario!.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Usuario eliminado correctamente' })
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard/usuarios')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al eliminar el usuario' })
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'ADMINISTRADOR' ? ShieldCheckIcon : UserIcon
  }

  const getRoleColor = (role: string) => {
    const colors = {
      ADMINISTRADOR: 'bg-purple-100 text-purple-800',
      ESTILISTA: 'bg-blue-100 text-blue-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Usuario no encontrado</h3>
        <Link
          href="/dashboard/usuarios"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Usuarios
        </Link>
      </div>
    )
  }

  // Prevenir que un usuario se edite a sí mismo o que se elimine el último admin
  const canDelete = usuario.id !== user?.id
  const canChangeRole = usuario.id !== user?.id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/usuarios"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver a Usuarios
          </Link>
        </div>
      </div>

      {/* Título */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <PencilIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
        <p className="text-gray-600 mt-2">
          Modificar información de {usuario.name || usuario.email}
        </p>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`rounded-md p-4 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ej: María García López"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="usuario@stylo.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Rol *
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      disabled={!canChangeRole}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="ESTILISTA" className="text-gray-900 bg-white">Estilista</option>
                      <option value="ADMINISTRADOR" className="text-gray-900 bg-white">Administrador</option>
                    </select>
                    {!canChangeRole && (
                      <p className="mt-1 text-xs text-gray-500">
                        No puedes cambiar tu propio rol
                      </p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => handleInputChange('activo', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Estadísticas de Uso</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {usuario._count?.citas || 0}
                    </div>
                    <div className="text-sm text-gray-500">Citas Gestionadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {usuario._count?.auditLogs || 0}
                    </div>
                    <div className="text-sm text-gray-500">Acciones Registradas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.ceil((new Date().getTime() - new Date(usuario.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-500">Días en el Sistema</div>
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
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Usuario desde:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Última actualización:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(usuario.updatedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {usuario.ultimoAcceso && (
                    <div>
                      <span className="font-medium text-gray-700">Último acceso:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')} a las{' '}
                        {new Date(usuario.ultimoAcceso).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                  )}
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
                    {React.createElement(getRoleIcon(formData.role), {
                      className: "h-8 w-8 text-gray-600"
                    })}
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {formData.name || 'Nombre del Usuario'}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(formData.role)} mt-2`}>
                    {formData.role}
                  </span>
                  {formData.email && (
                    <div className="mt-4 text-sm text-gray-600">
                      ✉️ {formData.email}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/usuarios/${usuario.id}/password`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </Link>
                  
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Eliminar Usuario
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/usuarios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.name.trim() || !formData.email.trim()}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
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
      </form>
    </div>
  )
}
