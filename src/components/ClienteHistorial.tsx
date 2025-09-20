'use client'

import React, { useState } from 'react'
import {
  ClockIcon,
  UserIcon,
  CameraIcon,
  PencilIcon,
  ColorSwatchIcon,
  ScissorsIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface HistorialRegistro {
  id: string
  tipoRegistro: string
  titulo: string
  descripcion?: string
  datosAntes?: any
  datosDespues?: any
  fotos?: string
  createdAt: string
  usuario?: {
    name?: string
    email: string
  }
  cita?: {
    id: string
    servicio?: string
    precio?: number
  }
}

interface ClienteHistorialProps {
  clienteId: string
  historial: HistorialRegistro[]
  onAddRegistro?: () => void
  className?: string
}

export default function ClienteHistorial({ 
  clienteId, 
  historial, 
  onAddRegistro, 
  className = '' 
}: ClienteHistorialProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getTipoIcon = (tipo: string) => {
    const icons = {
      SERVICIO: ScissorsIcon,
      CAMBIO_FISICO: ColorSwatchIcon,
      FOTO: CameraIcon,
      NOTA: ChatBubbleLeftIcon
    }
    return icons[tipo as keyof typeof icons] || PencilIcon
  }

  const getTipoColor = (tipo: string) => {
    const colors = {
      SERVICIO: 'bg-blue-100 text-blue-800 border-blue-200',
      CAMBIO_FISICO: 'bg-purple-100 text-purple-800 border-purple-200',
      FOTO: 'bg-green-100 text-green-800 border-green-200',
      NOTA: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatearCambios = (antes: any, despues: any) => {
    if (!antes && !despues) return null

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {antes && (
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-1">Antes:</h5>
            <div className="bg-red-50 p-2 rounded text-xs">
              <pre className="text-red-800 whitespace-pre-wrap">
                {JSON.stringify(antes, null, 2)}
              </pre>
            </div>
          </div>
        )}
        {despues && (
          <div>
            <h5 className="text-xs font-medium text-gray-700 mb-1">Después:</h5>
            <div className="bg-green-50 p-2 rounded text-xs">
              <pre className="text-green-800 whitespace-pre-wrap">
                {JSON.stringify(despues, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    )
  }

  const historialOrdenado = [...historial].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Historial Detallado</h3>
          {onAddRegistro && (
            <button
              onClick={onAddRegistro}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Agregar Registro
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Registro completo de servicios, cambios físicos y notas
        </p>
      </div>

      <div className="px-6 py-4">
        {historialOrdenado.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Sin historial</h4>
            <p className="mt-1 text-sm text-gray-500">
              Los servicios y cambios aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {historialOrdenado.map((registro, index) => {
                const isExpanded = expandedItems.has(registro.id)
                const TipoIcon = getTipoIcon(registro.tipoRegistro)
                const isLast = index === historialOrdenado.length - 1

                return (
                  <li key={registro.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span 
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true" 
                        />
                      )}
                      
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getTipoColor(registro.tipoRegistro)}`}>
                            <TipoIcon className="h-4 w-4" />
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {registro.titulo}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(registro.tipoRegistro)}`}>
                                  {registro.tipoRegistro.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(registro.createdAt).toLocaleDateString('es-ES')} a las{' '}
                                  {new Date(registro.createdAt).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            {(registro.descripcion || registro.datosAntes || registro.datosDespues || registro.fotos) && (
                              <button
                                onClick={() => toggleExpanded(registro.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Información básica siempre visible */}
                          <div className="mt-2 text-sm text-gray-600">
                            {registro.usuario && (
                              <div className="flex items-center text-xs text-gray-500">
                                <UserIcon className="h-3 w-3 mr-1" />
                                {registro.usuario.name || registro.usuario.email}
                              </div>
                            )}
                            {registro.cita && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <ScissorsIcon className="h-3 w-3 mr-1" />
                                {registro.cita.servicio} 
                                {registro.cita.precio && (
                                  <span className="ml-1">- ${registro.cita.precio}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Detalles expandibles */}
                          {isExpanded && (
                            <div className="mt-3 space-y-3">
                              {registro.descripcion && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Descripción:</h5>
                                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {registro.descripcion}
                                  </p>
                                </div>
                              )}

                              {(registro.datosAntes || registro.datosDespues) && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Cambios Registrados:</h5>
                                  {formatearCambios(registro.datosAntes, registro.datosDespues)}
                                </div>
                              )}

                              {registro.fotos && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Fotos:</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {registro.fotos.split(',').map((foto, index) => (
                                      <img
                                        key={index}
                                        src={foto.trim()}
                                        alt={`Foto ${index + 1}`}
                                        className="h-16 w-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                                        onClick={() => window.open(foto.trim(), '_blank')}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
