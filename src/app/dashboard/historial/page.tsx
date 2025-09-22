'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthRequired } from '@/lib/auth'
import {
  ClockIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  CameraIcon,
  TagIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface HistorialRegistro {
  id: string
  clienteId: string
  citaId?: string
  tipoRegistro: string
  titulo: string
  descripcion?: string
  datosAntes?: any
  datosDespues?: any
  fotos?: string
  usuarioId?: string
  createdAt: string
  cliente: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
  }
  usuario?: {
    id: string
    name: string
  }
  cita?: {
    id: string
    fecha: string
    hora: string
    servicio?: string
  }
}

export default function HistorialPage() {
  const { user } = useAuthRequired()
  const [registros, setRegistros] = useState<HistorialRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [clienteFiltro, setClienteFiltro] = useState('')

  useEffect(() => {
    fetchHistorial()
  }, [])

  const fetchHistorial = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/historial?limit=100')
      if (response.ok) {
        const data = await response.json()
        setRegistros(data.registros || [])
      }
    } catch (error) {
      console.error('Error al cargar historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistros = registros.filter(registro => {
    const matchesSearch = searchTerm === '' || 
      registro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (registro.descripcion && registro.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTipo = tipoFiltro === 'TODOS' || registro.tipoRegistro === tipoFiltro
    
    const matchesCliente = clienteFiltro === '' ||
      registro.cliente.nombre.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
      registro.cliente.apellido.toLowerCase().includes(clienteFiltro.toLowerCase())

    return matchesSearch && matchesTipo && matchesCliente
  })

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'SERVICIO':
        return <TagIcon className="h-5 w-5 text-blue-500" />
      case 'CAMBIO_FISICO':
        return <UserIcon className="h-5 w-5 text-green-500" />
      case 'FOTO':
        return <CameraIcon className="h-5 w-5 text-purple-500" />
      case 'NOTA':
        return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const colors = {
      SERVICIO: 'bg-blue-100 text-blue-800',
      CAMBIO_FISICO: 'bg-green-100 text-green-800',
      FOTO: 'bg-purple-100 text-purple-800',
      NOTA: 'bg-yellow-100 text-yellow-800'
    }
    
    const labels = {
      SERVICIO: 'Servicio',
      CAMBIO_FISICO: 'Cambio Físico',
      FOTO: 'Foto',
      NOTA: 'Nota'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[tipo as keyof typeof labels] || tipo}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historial de Clientes</h1>
              <p className="mt-1 text-sm text-gray-500">
                Registro completo de servicios, cambios y notas de todos los clientes
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="relative">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="TODOS">Todos los tipos</option>
                <option value="SERVICIO">Servicios</option>
                <option value="CAMBIO_FISICO">Cambios Físicos</option>
                <option value="FOTO">Fotos</option>
                <option value="NOTA">Notas</option>
              </select>
            </div>

            {/* Filtro por cliente */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por cliente..."
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            name: 'Total Registros', 
            value: registros.length.toString(),
            icon: DocumentTextIcon,
            color: 'bg-blue-500'
          },
          { 
            name: 'Servicios', 
            value: registros.filter(r => r.tipoRegistro === 'SERVICIO').length.toString(),
            icon: TagIcon,
            color: 'bg-green-500'
          },
          { 
            name: 'Cambios Físicos', 
            value: registros.filter(r => r.tipoRegistro === 'CAMBIO_FISICO').length.toString(),
            icon: UserIcon,
            color: 'bg-purple-500'
          },
          { 
            name: 'Fotos', 
            value: registros.filter(r => r.tipoRegistro === 'FOTO').length.toString(),
            icon: CameraIcon,
            color: 'bg-yellow-500'
          }
        ].map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de registros */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Registros del Historial ({filteredRegistros.length})
          </h3>
        </div>
        
        {filteredRegistros.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500">
              {registros.length === 0 
                ? 'Aún no hay registros en el historial.' 
                : 'No se encontraron registros con los filtros aplicados.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRegistros.map((registro) => (
              <div key={registro.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    {getTipoIcon(registro.tipoRegistro)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {registro.titulo}
                        </h4>
                        {getTipoBadge(registro.tipoRegistro)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(registro.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <Link
                        href={`/dashboard/clientes/${registro.clienteId}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {registro.cliente.nombre} {registro.cliente.apellido}
                      </Link>
                      {registro.cliente.telefono && (
                        <span className="text-sm text-gray-500 ml-2">
                          • {registro.cliente.telefono}
                        </span>
                      )}
                    </div>
                    
                    {registro.descripcion && (
                      <p className="mt-2 text-sm text-gray-600">
                        {registro.descripcion}
                      </p>
                    )}
                    
                    {registro.cita && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Link
                          href={`/dashboard/agenda/${registro.cita.id}`}
                          className="hover:text-gray-700"
                        >
                          Relacionado con cita: {new Date(registro.cita.fecha).toLocaleDateString('es-ES')} a las {registro.cita.hora}
                          {registro.cita.servicio && ` - ${registro.cita.servicio}`}
                        </Link>
                      </div>
                    )}
                    
                    {registro.usuario && (
                      <div className="mt-2 text-xs text-gray-500">
                        Registrado por: {registro.usuario.name}
                      </div>
                    )}
                    
                    {/* Mostrar cambios si es un cambio físico */}
                    {registro.tipoRegistro === 'CAMBIO_FISICO' && (registro.datosAntes || registro.datosDespues) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <h5 className="text-xs font-medium text-gray-900 mb-2">Cambios registrados:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {registro.datosAntes && (
                            <div>
                              <span className="font-medium text-red-600">Antes:</span>
                              <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(registro.datosAntes, null, 2)}
                              </pre>
                            </div>
                          )}
                          {registro.datosDespues && (
                            <div>
                              <span className="font-medium text-green-600">Después:</span>
                              <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(registro.datosDespues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
