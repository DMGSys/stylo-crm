'use client'

import React, { useState, useEffect } from 'react'
import { useAuthRequired } from '@/lib/auth'
import Link from 'next/link'
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Role {
  id: string
  nombre: string
  descripcion?: string
  color: string
  icono: string
  activo: boolean
  permisos: Record<string, string[]>
  createdAt: string
  updatedAt: string
  _count: {
    usuarios: number
  }
}

export default function RolesPage() {
  const { user } = useAuthRequired(['ADMINISTRADOR'])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activo: !currentStatus
        })
      })

      if (response.ok) {
        fetchRoles()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al cambiar estado del rol')
      }
    } catch (error) {
      console.error('Error al cambiar estado del rol:', error)
      alert('Error al cambiar estado del rol')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return

    if (role._count.usuarios > 0) {
      alert(`No se puede eliminar el rol "${role.nombre}" porque tiene ${role._count.usuarios} usuarios asignados.`)
      return
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el rol "${role.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRoles()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar rol')
      }
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      alert('Error al eliminar rol')
    }
  }

  const getPermissionCount = (permisos: Record<string, string[]>) => {
    return Object.values(permisos).flat().length
  }

  const getPermissionsByCategory = (permisos: Record<string, string[]>) => {
    const categories = {
      'Usuarios': permisos.usuarios || [],
      'Clientes': permisos.clientes || [],
      'Citas': permisos.citas || [],
      'Servicios': permisos.servicios || [],
      'Productos': permisos.productos || [],
      'Configuración': permisos.configuracion || [],
      'Auditoría': permisos.auditoria || [],
      'Roles': permisos.roles || [],
      'Reportes': permisos.reportes || []
    }

    return categories
  }

  const getActionIcon = (action: string) => {
    const icons = {
      create: '➕',
      read: '👁️',
      update: '✏️',
      delete: '🗑️',
      export: '📤'
    }
    return icons[action as keyof typeof icons] || '🔹'
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600">Administra roles y permisos del sistema</p>
        </div>
        <Link
          href="/dashboard/roles/nuevo"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Rol
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Roles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {roles.length}
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
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Roles Activos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {roles.filter(r => r.activo).length}
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
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Usuarios Asignados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {roles.reduce((total, role) => total + role._count.usuarios, 0)}
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
                <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Permisos Promedio
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(roles.reduce((total, role) => total + getPermissionCount(role.permisos), 0) / roles.length) || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Roles */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {roles.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay roles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando un rol personalizado.
              </p>
            </li>
          ) : (
            roles.map((role) => (
              <li key={role.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div 
                          className="h-10 w-10 rounded-full flex items-center justify-center border-2 text-white font-bold"
                          style={{ backgroundColor: role.color }}
                        >
                          <span className="text-lg">{role.icono}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {role.nombre}
                          </p>
                          {!role.activo && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getPermissionCount(role.permisos)} permisos
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {role.descripcion || 'Sin descripción'}
                          <span className="ml-2">
                            • {role._count.usuarios} usuarios asignados
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Creado: {new Date(role.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Ver permisos"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <Link
                        href={`/dashboard/roles/${role.id}/editar`}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Editar rol"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      
                      <button
                        onClick={() => handleToggleRoleStatus(role.id, role.activo)}
                        className={`transition-colors ${
                          role.activo 
                            ? 'text-orange-600 hover:text-orange-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={role.activo ? 'Desactivar rol' : 'Activar rol'}
                      >
                        {role.activo ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                      
                      {role._count.usuarios === 0 && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Eliminar rol"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Permisos expandidos */}
                  {expandedRole === role.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Permisos Detallados:</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(getPermissionsByCategory(role.permisos)).map(([category, actions]) => (
                          <div key={category} className="border border-gray-200 rounded-lg p-3">
                            <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                              {category}
                            </h5>
                            <div className="space-y-1">
                              {actions.length > 0 ? (
                                actions.map((action) => (
                                  <div key={action} className="flex items-center text-xs text-green-600">
                                    <span className="mr-2">{getActionIcon(action)}</span>
                                    <span className="capitalize">{action}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center text-xs text-red-600">
                                  <XMarkIcon className="h-3 w-3 mr-2" />
                                  Sin permisos
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Información sobre roles predefinidos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Roles Predefinidos
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Stylo incluye roles predefinidos optimizados para salones de belleza. 
                Puedes crear roles personalizados según las necesidades específicas de tu negocio.
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-blue-600 sm:grid-cols-4">
              <div>👑 Super Admin</div>
              <div>👔 Gerente</div>
              <div>✂️ Estilista Senior</div>
              <div>💇‍♀️ Estilista</div>
              <div>📞 Recepcionista</div>
              <div>🤝 Asistente</div>
              <div>💅 Manicurista</div>
              <div>👨‍🦲 Barbero</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
