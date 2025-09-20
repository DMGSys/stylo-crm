'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthRequired } from '@/lib/auth'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const { user } = useAuthRequired(['ADMINISTRADOR'])
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ESTILISTA',
    activo: true
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setMensaje({ tipo: 'error', texto: 'Nombre, email y contraseña son obligatorios' })
      return
    }

    if (!formData.email.includes('@')) {
      setMensaje({ tipo: 'error', texto: 'Email inválido' })
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
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          activo: formData.activo
        })
      })

      if (response.ok) {
        const nuevoUsuario = await response.json()
        setMensaje({ tipo: 'success', texto: 'Usuario creado correctamente' })
        
        // Redirigir a la lista de usuarios después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard/usuarios')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error al crear usuario:', error)
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al crear el usuario' })
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
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="ESTILISTA" className="text-gray-900 bg-white">Estilista</option>
                      <option value="ADMINISTRADOR" className="text-gray-900 bg-white">Administrador</option>
                    </select>
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

            {/* Contraseña */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Contraseña</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Contraseña *
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
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="block w-full px-3 py-2 pr-10 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
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
                      Confirmar Contraseña *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Repetir contraseña"
                      />
                    </div>
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        Las contraseñas no coinciden
                      </p>
                    )}
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

            {/* Información del Rol */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Permisos del Rol</h3>
              </div>
              <div className="px-6 py-4">
                {formData.role === 'ADMINISTRADOR' ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Gestionar usuarios
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Ver auditoría
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Configurar sistema
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Gestionar clientes y citas
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Gestionar servicios y productos
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Gestionar clientes
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Gestionar citas
                    </div>
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Ver configuración
                    </div>
                    <div className="flex items-center text-red-600">
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Gestionar usuarios
                    </div>
                    <div className="flex items-center text-red-600">
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Ver auditoría
                    </div>
                  </div>
                )}
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
            disabled={saving || !formData.name.trim() || !formData.email.trim() || !formData.password.trim() || formData.password !== formData.confirmPassword}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Crear Usuario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
