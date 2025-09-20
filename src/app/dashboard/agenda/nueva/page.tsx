'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  tipoPelo: string
}

interface Servicio {
  id: string
  nombre: string
  descripcion?: string
  precioBase: number
  precioVenta?: number
  duracionMinutos: number
  categoria: {
    id: string
    nombre: string
    icono?: string
  }
}

export default function NuevaCitaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = usePriceFormatter()
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingServicios, setLoadingServicios] = useState(true)
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState<{
    disponible: boolean
    conflicto?: any
    sugerencias?: string[]
  } | null>(null)
  const [formData, setFormData] = useState({
    clienteId: searchParams.get('cliente') || '',
    servicioId: '',
    usuarioId: '', // Se puede obtener de la sesión
    fecha: '',
    hora: '',
    estado: 'PENDIENTE',
    servicio: '', // Texto libre para servicios personalizados
    precio: '',
    notas: '',
    recordatorio: false
  })

  useEffect(() => {
    fetchClientes()
    fetchServicios()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes?limit=100')
      const data = await response.json()
      setClientes(data.clientes || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios?limit=100')
      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    } finally {
      setLoadingServicios(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Si se selecciona un servicio, actualizar precio y duración automáticamente
    if (field === 'servicioId' && typeof value === 'string' && value) {
      const servicioSeleccionado = servicios.find(s => s.id === value)
      if (servicioSeleccionado) {
        setFormData(prev => ({
          ...prev,
          servicio: servicioSeleccionado.nombre,
          precio: (servicioSeleccionado.precioVenta || servicioSeleccionado.precioBase).toString()
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.clienteId || !formData.fecha || !formData.hora) {
      setMensaje({ tipo: 'error', texto: 'Cliente, fecha y hora son obligatorios' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const citaData = {
        clienteId: formData.clienteId,
        servicioId: formData.servicioId || undefined,
        fecha: new Date(formData.fecha + 'T' + formData.hora + ':00'),
        hora: formData.hora,
        estado: formData.estado,
        servicio: formData.servicio.trim() || undefined,
        precio: formData.precio ? parseFloat(formData.precio) : undefined,
        notas: formData.notas.trim() || undefined,
        recordatorio: formData.recordatorio
      }

      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(citaData)
      })

      if (response.ok) {
        const nuevaCita = await response.json()
        setMensaje({ tipo: 'success', texto: 'Cita creada exitosamente' })
        
        // Redirigir al detalle de la cita después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/agenda/${nuevaCita.id}`)
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cita')
      }
    } catch (error) {
      console.error('Error al crear cita:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cita'
      
      // Mejorar mensaje para conflictos de horario
      if (errorMessage.includes('ya hay una cita programada')) {
        setMensaje({ 
          tipo: 'error', 
          texto: `⚠️ Conflicto de horario: Ya hay una cita programada para el ${formData.fecha} a las ${formData.hora}. Por favor, selecciona otro horario disponible.` 
        })
      } else {
        setMensaje({ tipo: 'error', texto: errorMessage })
      }
    } finally {
      setSaving(false)
    }
  }

  const getClienteSeleccionado = () => {
    return clientes.find(c => c.id === formData.clienteId)
  }

  const getEstadoColor = (estado: string) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      REALIZADA: 'bg-blue-100 text-blue-800',
      CANCELADA: 'bg-red-100 text-red-800',
      REAGENDADA: 'bg-purple-100 text-purple-800'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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

  // Generar opciones de hora cada 30 minutos
  const generarOpcionesHora = () => {
    const opciones = []
    for (let hora = 9; hora <= 20; hora++) {
      opciones.push(`${hora.toString().padStart(2, '0')}:00`)
      if (hora < 20) {
        opciones.push(`${hora.toString().padStart(2, '0')}:30`)
      }
    }
    return opciones
  }

  const formatDuracion = (minutos: number) => {
    if (minutos < 60) {
      return `${minutos} min`
    } else {
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
    }
  }

  const getServicioSeleccionado = () => {
    return servicios.find(s => s.id === formData.servicioId)
  }

  const verificarDisponibilidad = async (fecha: string, hora: string) => {
    if (!fecha || !hora) {
      setDisponibilidad(null)
      return
    }

    setVerificandoDisponibilidad(true)
    try {
      const response = await fetch(`/api/citas/disponibilidad?fecha=${fecha}&hora=${hora}`)
      if (response.ok) {
        const data = await response.json()
        setDisponibilidad(data)
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error)
    } finally {
      setVerificandoDisponibilidad(false)
    }
  }

  // Verificar disponibilidad cuando cambie fecha u hora
  useEffect(() => {
    if (formData.fecha && formData.hora) {
      const timeoutId = setTimeout(() => {
        verificarDisponibilidad(formData.fecha, formData.hora)
      }, 500) // Debounce de 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [formData.fecha, formData.hora])

  const clienteSeleccionado = getClienteSeleccionado()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard/agenda"
            className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Cita</h1>
            <p className="text-gray-600">Agenda una nueva cita para un cliente</p>
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
            {/* Información de la Cita */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Información de la Cita</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700">
                      Cliente *
                    </label>
                    {loadingClientes ? (
                      <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        Cargando clientes...
                      </div>
                    ) : (
                      <select
                        id="clienteId"
                        required
                        value={formData.clienteId}
                        onChange={(e) => handleInputChange('clienteId', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="" className="text-gray-900 bg-white">Seleccionar cliente...</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id} className="text-gray-900 bg-white">
                            {cliente.nombre} {cliente.apellido} {cliente.telefono ? `(${cliente.telefono})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {clientes.length === 0 && !loadingClientes && (
                      <p className="mt-2 text-sm text-gray-500">
                        No hay clientes disponibles. 
                        <Link href="/dashboard/clientes/nuevo" className="text-blue-600 hover:text-blue-800 ml-1">
                          Crear nuevo cliente
                        </Link>
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.fecha}
                      onChange={(e) => handleInputChange('fecha', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="hora" className="block text-sm font-medium text-gray-700">
                      Hora *
                    </label>
                    <select
                      id="hora"
                      required
                      value={formData.hora}
                      onChange={(e) => handleInputChange('hora', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="" className="text-gray-900 bg-white">Seleccionar hora...</option>
                      {generarOpcionesHora().map((hora) => (
                        <option key={hora} value={hora} className="text-gray-900 bg-white">
                          {hora}
                        </option>
                      ))}
                    </select>
                    
                    {/* Indicador de disponibilidad */}
                    {(formData.fecha && formData.hora) && (
                      <div className="mt-2">
                        {verificandoDisponibilidad ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                            Verificando disponibilidad...
                          </div>
                        ) : disponibilidad ? (
                          disponibilidad.disponible ? (
                            <div className="flex items-center text-sm text-green-600">
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Horario disponible
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-red-600">
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Horario ocupado
                                {disponibilidad.conflicto && (
                                  <span className="ml-1">
                                    - {disponibilidad.conflicto.cliente}
                                  </span>
                                )}
                              </div>
                              {disponibilidad.sugerencias && disponibilidad.sugerencias.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  <p className="font-medium">Horarios disponibles:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {disponibilidad.sugerencias.map((horario) => (
                                      <button
                                        key={horario}
                                        type="button"
                                        onClick={() => handleInputChange('hora', horario)}
                                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                                      >
                                        {horario}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="PENDIENTE" className="text-gray-900 bg-white">Pendiente</option>
                      <option value="CONFIRMADA" className="text-gray-900 bg-white">Confirmada</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="servicioId" className="block text-sm font-medium text-gray-700">
                      Servicio
                    </label>
                    {loadingServicios ? (
                      <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        Cargando servicios...
                      </div>
                    ) : (
                      <select
                        id="servicioId"
                        value={formData.servicioId}
                        onChange={(e) => handleInputChange('servicioId', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="" className="text-gray-900 bg-white">Seleccionar servicio...</option>
                        {servicios.map((servicio) => (
                          <option key={servicio.id} value={servicio.id} className="text-gray-900 bg-white">
                            {servicio.categoria.icono} {servicio.nombre} - {formatPrice(servicio.precioVenta || servicio.precioBase)} ({formatDuracion(servicio.duracionMinutos)})
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      O puedes escribir un servicio personalizado en el campo de notas
                    </p>
                    
                    {/* Información del servicio seleccionado */}
                    {getServicioSeleccionado() && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800 font-medium">
                              Duración estimada: {formatDuracion(getServicioSeleccionado()!.duracionMinutos)}
                            </span>
                          </div>
                          <span className="text-blue-800">
                            {getServicioSeleccionado()!.categoria.nombre}
                          </span>
                        </div>
                        {getServicioSeleccionado()!.descripcion && (
                          <p className="mt-1 text-xs text-blue-700">
                            {getServicioSeleccionado()!.descripcion}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
                      Precio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="precio"
                      value={formData.precio}
                      onChange={(e) => handleInputChange('precio', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                      Notas
                    </label>
                    <textarea
                      id="notas"
                      rows={3}
                      value={formData.notas}
                      onChange={(e) => handleInputChange('notas', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="recordatorio"
                        type="checkbox"
                        checked={formData.recordatorio}
                        onChange={(e) => handleInputChange('recordatorio', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="recordatorio" className="ml-2 block text-sm text-gray-900">
                        Enviar recordatorio
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Preview */}
          <div className="space-y-6">
            {/* Cliente Seleccionado */}
            {clienteSeleccionado && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xl">{getHairTypeAvatar(clienteSeleccionado.tipoPelo)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                      </p>
                      {clienteSeleccionado.telefono && (
                        <p className="text-sm text-gray-500">{clienteSeleccionado.telefono}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista Previa de la Cita */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vista Previa</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {formData.fecha && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha</p>
                    <p className="text-sm text-gray-900">
                      {new Date(formData.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                {formData.hora && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hora</p>
                    <p className="text-sm text-gray-900">{formData.hora}</p>
                  </div>
                )}
                
                {formData.servicio && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Servicio</p>
                    <p className="text-sm text-gray-900">{formData.servicio}</p>
                  </div>
                )}
                
                {formData.precio && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Precio</p>
                    <p className="text-sm text-gray-900">{formatPrice(parseFloat(formData.precio))}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(formData.estado)}`}>
                    {formData.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/agenda"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.clienteId || !formData.fecha || !formData.hora || (disponibilidad && !disponibilidad.disponible)}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Cita
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
