'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  tipoPelo: string
  notas?: string
  createdAt: string
  _count?: {
    citas: number
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes?limit=100')
      const data = await response.json()
      setClientes(data.clientes || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.includes(searchTerm)
  )

  const getTipoPeloColor = (tipo: string) => {
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
      LISO: '🧑‍🦰', // Persona con pelo liso rojizo
      RIZADO: '👩‍🦱', // Mujer con pelo rizado
      ONDULADO: '🧑‍🦱', // Persona con pelo ondulado
      TEÑIDO: '👩‍🎤', // Mujer con pelo teñido (estilo rockstar)
      MIXTO: '🧑‍🎨' // Persona artística (pelo mixto)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>
        <Link
          href="/dashboard/clientes/nuevo"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar clientes por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.length}
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
                <PhoneIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Con Teléfono
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.filter(c => c.telefono).length}
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
                <EnvelopeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Con Email
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clientes.filter(c => c.email).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredClientes.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron clientes con ese criterio de búsqueda.' : 'Comienza agregando un nuevo cliente.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    href="/dashboard/clientes/nuevo"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nuevo Cliente
                  </Link>
                </div>
              )}
            </li>
          ) : (
            filteredClientes.map((cliente) => (
              <li key={cliente.id}>
                <Link
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="block hover:bg-gray-50 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {cliente.fotos ? (
                          <img
                            src={cliente.fotos}
                            alt={`${cliente.nombre} ${cliente.apellido}`}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                            <span className="text-lg">{getHairTypeAvatar(cliente.tipoPelo)}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombre} {cliente.apellido}
                          </div>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoPeloColor(cliente.tipoPelo)}`}>
                            {cliente.tipoPelo}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          {cliente.telefono && (
                            <div className="flex items-center mr-4">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {cliente.telefono}
                            </div>
                          )}
                          {cliente.email && (
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {cliente.email}
                            </div>
                          )}
                        </div>
                        {cliente.notas && (
                          <p className="mt-1 text-sm text-gray-500 truncate max-w-md">
                            {cliente.notas}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {cliente._count?.citas || 0} citas
                        </div>
                        <div className="text-xs text-gray-500">
                          Cliente desde {new Date(cliente.createdAt).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
