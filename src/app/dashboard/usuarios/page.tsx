'use client'

import { useState, useEffect } from 'react'
import { useAuthRequired } from '@/lib/auth'
import Link from 'next/link'
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon
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

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email?: string
  telefono?: string
  activo: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const { user } = useAuthRequired(['ADMINISTRADOR'])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'usuarios' | 'clientes'>('usuarios')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetchUsuarios()
    fetchClientes()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/usuarios')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.usuarios || [])
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activo: !currentStatus
        })
      })

      if (response.ok) {
        fetchUsuarios()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cambiar estado del usuario')
      }
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error)
      alert('Error al cambiar estado del usuario')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsuarios()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error al eliminar usuario')
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      ADMINISTRADOR: 'bg-purple-100 text-purple-800',
      ESTILISTA: 'bg-blue-100 text-blue-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRoleIcon = (role: string) => {
    return role === 'ADMINISTRADOR' ? ShieldCheckIcon : UserIcon
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || usuario.role === roleFilter
    const matchesStatus = showInactive || usuario.activo !== false
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = showInactive || cliente.activo
    const hasEmail = cliente.email // Solo clientes con email pueden convertirse en usuarios
    
    return matchesSearch && matchesStatus && hasEmail
  })

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios del sistema y convierte clientes en usuarios</p>
        </div>
        <Link
          href="/dashboard/usuarios/nuevo"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'usuarios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserGroupIcon className="h-5 w-5 inline mr-2" />
            Usuarios del Sistema ({filteredUsuarios.length})
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clientes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserIcon className="h-5 w-5 inline mr-2" />
            Clientes Convertibles ({filteredClientes.length})
          </button>
        </nav>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, email..."
              className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {activeTab === 'usuarios' && (
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
                <FunnelIcon className="h-4 w-4 inline mr-1" />
                Rol
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="" className="text-gray-900 bg-white">Todos los roles</option>
                <option value="ADMINISTRADOR" className="text-gray-900 bg-white">Administrador</option>
                <option value="ESTILISTA" className="text-gray-900 bg-white">Estilista</option>
              </select>
            </div>
          )}

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mostrar inactivos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredUsuarios.length === 0 ? (
              <li className="px-6 py-12 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron usuarios con los filtros seleccionados.
                </p>
              </li>
            ) : (
              filteredUsuarios.map((usuario) => {
                const RoleIcon = getRoleIcon(usuario.role)
                return (
                  <li key={usuario.id}>
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                            <RoleIcon className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {usuario.name || 'Sin nombre'}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(usuario.role)}`}>
                              {usuario.role}
                            </span>
                            {usuario.activo === false && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {usuario.email}
                            {usuario._count && (
                              <span className="ml-2">
                                • {usuario._count.citas} citas • {usuario._count.auditLogs} acciones
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            Creado: {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
                            {usuario.ultimoAcceso && (
                              <span className="ml-2">
                                • Último acceso: {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/usuarios/${usuario.id}/editar`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar usuario"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        
                        <Link
                          href={`/dashboard/usuarios/${usuario.id}/password`}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Cambiar contraseña"
                        >
                          <KeyIcon className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleToggleUserStatus(usuario.id, usuario.activo !== false)}
                          className={`transition-colors ${
                            usuario.activo !== false 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={usuario.activo !== false ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usuario.activo !== false ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        
                        {usuario.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(usuario.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar usuario"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}

      {/* Lista de Clientes Convertibles */}
      {activeTab === 'clientes' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  Clientes que pueden convertirse en usuarios
                </h3>
                <p className="text-xs text-blue-700">
                  Solo se muestran clientes con email registrado
                </p>
              </div>
            </div>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {filteredClientes.length === 0 ? (
              <li className="px-6 py-12 text-center">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes convertibles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron clientes con email que puedan convertirse en usuarios.
                </p>
              </li>
            ) : (
              filteredClientes.map((cliente) => (
                <li key={cliente.id}>
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          {!cliente.activo && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {cliente.email}
                          {cliente.telefono && <span className="ml-2">• {cliente.telefono}</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Cliente desde: {new Date(cliente.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/usuarios/convertir/${cliente.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        Convertir en Usuario
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Administradores
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {usuarios.filter(u => u.role === 'ADMINISTRADOR' && u.activo !== false).length}
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
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Estilistas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {usuarios.filter(u => u.role === 'ESTILISTA' && u.activo !== false).length}
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
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Usuarios Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {usuarios.filter(u => u.activo !== false).length}
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
                <UserIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Clientes Convertibles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.filter(c => c.email && c.activo).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
