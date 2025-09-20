'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthRequired } from '@/lib/auth'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserIcon,
  LockClosedIcon
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
}

export default function CambiarPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR'])
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }))
    setMensaje({ tipo: 'success', texto: 'Contraseña generada automáticamente' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.password.trim()) {
      setMensaje({ tipo: 'error', texto: 'La contraseña es obligatoria' })
      return
    }

    if (formData.password.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const response = await fetch(`/api/usuarios/${usuario!.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password
        })
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Contraseña actualizada correctamente' })
        
        // Limpiar formulario
        setFormData({
          password: '',
          confirmPassword: ''
        })
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard/usuarios')
        }, 3000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al cambiar contraseña')
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al cambiar la contraseña' })
    } finally {
      setSaving(false)
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
          <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <KeyIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cambiar Contraseña</h1>
        <p className="text-gray-600 mt-2">
          Actualizar credenciales de acceso para {usuario.name || usuario.email}
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
          {/* Formulario de Contraseña */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del Usuario */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información del Usuario</h3>
                <p className="text-sm text-gray-500 mt-1">Usuario al que se le cambiará la contraseña</p>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm text-gray-900">{usuario.name || 'Sin nombre'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm text-gray-900">{usuario.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(usuario.role)}`}>
                        {React.createElement(getRoleIcon(usuario.role), {
                          className: "h-4 w-4 mr-1"
                        })}
                        {usuario.role}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.activo !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Nueva Contraseña</h3>
                <p className="text-sm text-gray-500 mt-1">La contraseña anterior será reemplazada</p>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Nueva Contraseña *
                      </label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Generar automáticamente
                      </button>
                    </div>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="block w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords ? (
                          <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      La contraseña debe tener al menos 6 caracteres
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirmar Nueva Contraseña *
                    </label>
                    <div className="mt-1">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Repetir nueva contraseña"
                      />
                    </div>
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        Las contraseñas no coinciden
                      </p>
                    )}
                  </div>

                  {/* Fortaleza de contraseña */}
                  {formData.password && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Fortaleza de la contraseña:</p>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          {formData.password.length >= 6 ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={formData.password.length >= 6 ? 'text-green-700' : 'text-red-700'}>
                            Al menos 6 caracteres
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {/[A-Z]/.test(formData.password) ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={/[A-Z]/.test(formData.password) ? 'text-green-700' : 'text-red-700'}>
                            Al menos una mayúscula
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {/[0-9]/.test(formData.password) ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={/[0-9]/.test(formData.password) ? 'text-green-700' : 'text-red-700'}>
                            Al menos un número
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {/[!@#$%^&*]/.test(formData.password) ? (
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={/[!@#$%^&*]/.test(formData.password) ? 'text-green-700' : 'text-red-700'}>
                            Al menos un símbolo (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Información */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información de Seguridad</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start">
                    <LockClosedIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Contraseña segura</p>
                      <p>Use combinación de mayúsculas, números y símbolos</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <KeyIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Cambio inmediato</p>
                      <p>La contraseña se actualizará al guardar</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Notificación</p>
                      <p>El usuario deberá usar la nueva contraseña</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Últimos accesos */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actividad</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Usuario desde:</p>
                    <p className="text-gray-600">
                      {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {usuario.ultimoAcceso && (
                    <div>
                      <p className="font-medium text-gray-900">Último acceso:</p>
                      <p className="text-gray-600">
                        {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')} a las{' '}
                        {new Date(usuario.ultimoAcceso).toLocaleTimeString('es-ES')}
                      </p>
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
            href="/dashboard/usuarios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.password.trim() || formData.password !== formData.confirmPassword}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cambiando...
              </>
            ) : (
              <>
                <KeyIcon className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
