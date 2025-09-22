'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon
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

interface Cita {
  id: string
  clienteId: string
  servicioId?: string
  fecha: string
  hora: string
  estado: string
  servicio?: string
  precio?: number
  notas?: string
  recordatorio: boolean
  createdAt: string
  updatedAt: string
  cliente: Cliente
  servicioRef?: Servicio
}

export default function EditarCitaPage() {
  const router = useRouter()
  const params = useParams()
  const { formatPrice } = usePriceFormatter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [cita, setCita] = useState<Cita | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false)
  const [permitirSuperposicion, setPermitirSuperposicion] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState<{
    disponible: boolean
    conflictos?: any[]
    superposiciones?: any[]
    sugerencias?: string[]
    duracionServicio?: number
    intervaloConfigurado?: number
    tiempoTotalOcupado?: number
    mensaje?: string
  } | null>(null)
  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    fecha: '',
    hora: '',
    estado: 'PENDIENTE',
    servicio: '',
    precio: '',
    notas: '',
    recordatorio: false
  })

  useEffect(() => {
    if (params.id) {
      fetchCita()
      fetchClientes()
      fetchServicios()
    }
  }, [params.id])

  const fetchCita = async () => {
    try {
      const response = await fetch(`/api/citas/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCita(data)
        
        // Convertir fecha ISO a formato de input date
        const fechaObj = new Date(data.fecha)
        const fechaLocal = fechaObj.toISOString().split('T')[0]
        
        setFormData({
          clienteId: data.clienteId,
          servicioId: data.servicioId || '',
          fecha: fechaLocal,
          hora: data.hora,
          estado: data.estado,
          servicio: data.servicio || '',
          precio: data.precio ? data.precio.toString() : '',
          notas: data.notas || '',
          recordatorio: data.recordatorio
        })
      } else {
        setMensaje({ tipo: 'error', texto: 'Cita no encontrada' })
      }
    } catch (error) {
      console.error('Error al cargar cita:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar la cita' })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes?limit=100')
      const data = await response.json()
      setClientes(data.clientes || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios?limit=100')
      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error al cargar servicios:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-completar precio cuando se selecciona un servicio
      if (field === 'servicioId' && typeof value === 'string') {
        const servicioSeleccionado = servicios.find(s => s.id === value)
        if (servicioSeleccionado) {
          newData.precio = (servicioSeleccionado.precioVenta || servicioSeleccionado.precioBase).toString()
          newData.servicio = servicioSeleccionado.nombre
        }
      }
      
      return newData
    })
  }

  const verificarDisponibilidad = async (fecha: string, hora: string, servicioId?: string, permitirSuper?: boolean) => {
    if (!fecha || !hora) {
      setDisponibilidad(null)
      return
    }

    setVerificandoDisponibilidad(true)
    try {
      let url = `/api/citas/disponibilidad?fecha=${fecha}&hora=${hora}`
      if (servicioId) {
        url += `&servicioId=${servicioId}`
      }
      if (permitirSuper) {
        url += `&permitirSuperposicion=true`
      }
      // Excluir la cita actual de la verificación
      url += `&excluirCitaId=${params.id}`
      
      const response = await fetch(url)
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

  // Verificar disponibilidad cuando cambie fecha, hora, servicio o superposición
  useEffect(() => {
    if (formData.fecha && formData.hora && cita) {
      // Solo verificar si cambió la fecha/hora original
      const fechaOriginal = new Date(cita.fecha).toISOString().split('T')[0]
      if (formData.fecha !== fechaOriginal || formData.hora !== cita.hora) {
        const timeoutId = setTimeout(() => {
          verificarDisponibilidad(formData.fecha, formData.hora, formData.servicioId, permitirSuperposicion)
        }, 500)
        
        return () => clearTimeout(timeoutId)
      } else {
        setDisponibilidad(null)
      }
    }
  }, [formData.fecha, formData.hora, formData.servicioId, permitirSuperposicion, cita])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        recordatorio: formData.recordatorio,
        permitirSuperposicion: permitirSuperposicion
      }

      const response = await fetch(`/api/citas/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(citaData)
      })

      if (response.ok) {
        const citaActualizada = await response.json()
        setMensaje({ tipo: 'success', texto: 'Cita actualizada exitosamente' })
        
        // Actualizar los datos locales
        setCita(citaActualizada)
        
        // Redirigir al detalle después de 2 segundos
        setTimeout(() => {
          router.push(`/dashboard/agenda/${params.id}`)
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar cita')
      }
    } catch (error) {
      console.error('Error al actualizar cita:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la cita'
      setMensaje({ tipo: 'error', texto: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita? Esta acción no se puede deshacer.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/citas/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Cita eliminada exitosamente' })
        setTimeout(() => {
          router.push('/dashboard/agenda')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar cita')
      }
    } catch (error) {
      console.error('Error al eliminar cita:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la cita'
      setMensaje({ tipo: 'error', texto: errorMessage })
    } finally {
      setDeleting(false)
    }
  }

  const generarOpcionesHora = () => {
    const opciones = []
    for (let hora = 8; hora <= 21; hora++) {
      const horaStr = `${hora.toString().padStart(2, '0')}:00`
      const horaMediaStr = `${hora.toString().padStart(2, '0')}:30`
      opciones.push(horaStr)
      if (hora < 21) opciones.push(horaMediaStr)
    }
    return opciones
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMADA':
        return 'bg-blue-100 text-blue-800'
      case 'REALIZADA':
        return 'bg-green-100 text-green-800'
      case 'CANCELADA':
        return 'bg-red-100 text-red-800'
      case 'REAGENDADA':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cita) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Cita no encontrada</h3>
        <Link
          href="/dashboard/agenda"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver a Agenda
        </Link>
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
              <h1 className="text-2xl font-bold text-gray-900">Editar Cita</h1>
              <p className="mt-1 text-sm text-gray-500">
                {cita.cliente.nombre} {cita.cliente.apellido} - {formatDate(cita.fecha)} a las {cita.hora}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                {cita.estado}
              </span>
              <PencilIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`rounded-md p-4 ${mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {mensaje.tipo === 'success' ? (
                <CheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <XMarkIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {mensaje.texto}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Cliente */}
              <div>
                <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700">
                  Cliente *
                </label>
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
                      {cliente.nombre} {cliente.apellido}
                      {cliente.telefono && ` - ${cliente.telefono}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Servicio */}
              <div>
                <label htmlFor="servicioId" className="block text-sm font-medium text-gray-700">
                  Servicio
                </label>
                <select
                  id="servicioId"
                  value={formData.servicioId}
                  onChange={(e) => handleInputChange('servicioId', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" className="text-gray-900 bg-white">Servicio personalizado...</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id} className="text-gray-900 bg-white">
                      {servicio.categoria.icono} {servicio.nombre} - {formatPrice(servicio.precioVenta || servicio.precioBase)} ({servicio.duracionMinutos}min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Servicio personalizado */}
              {!formData.servicioId && (
                <div className="sm:col-span-2">
                  <label htmlFor="servicio" className="block text-sm font-medium text-gray-700">
                    Descripción del servicio personalizado
                  </label>
                  <input
                    type="text"
                    id="servicio"
                    value={formData.servicio}
                    onChange={(e) => handleInputChange('servicio', e.target.value)}
                    placeholder="Ej: Corte y peinado especial"
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Fecha */}
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  required
                  value={formData.fecha}
                  onChange={(e) => handleInputChange('fecha', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Hora */}
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

                {/* Checkbox para permitir superposición */}
                {formData.servicioId && (
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permitirSuperposicion}
                        onChange={(e) => setPermitirSuperposicion(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Permitir superposición de citas
                      </span>
                    </label>
                  </div>
                )}

                {/* Indicador de disponibilidad */}
                {(formData.fecha && formData.hora) && (
                  <div className="mt-3">
                    {verificandoDisponibilidad ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Verificando disponibilidad...
                      </div>
                    ) : disponibilidad ? (
                      <div className="space-y-3">
                        {/* Estado de disponibilidad */}
                        <div className={`flex items-center text-sm ${disponibilidad.disponible ? 'text-green-600' : 'text-red-600'}`}>
                          {disponibilidad.disponible ? (
                            <CheckIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 mr-1" />
                          )}
                          {disponibilidad.disponible ? 'Horario disponible' : 'Conflicto de horario'}
                        </div>

                        {/* Información de conflictos y sugerencias */}
                        {disponibilidad.conflictos && disponibilidad.conflictos.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <h4 className="text-sm font-medium text-red-800 mb-2">Conflictos:</h4>
                            {disponibilidad.conflictos.map((conflicto, index) => (
                              <div key={index} className="text-xs text-red-700">
                                • {conflicto.cliente} - {conflicto.servicio}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sugerencias */}
                        {disponibilidad.sugerencias && disponibilidad.sugerencias.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm font-medium text-green-800 mb-2">Horarios disponibles:</p>
                            <div className="flex flex-wrap gap-1">
                              {disponibilidad.sugerencias.map((horario) => (
                                <button
                                  key={horario}
                                  type="button"
                                  onClick={() => handleInputChange('hora', horario)}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 transition-colors"
                                >
                                  {horario}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Estado */}
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
                  <option value="REALIZADA" className="text-gray-900 bg-white">Realizada</option>
                  <option value="CANCELADA" className="text-gray-900 bg-white">Cancelada</option>
                  <option value="REAGENDADA" className="text-gray-900 bg-white">Reagendada</option>
                </select>
              </div>

              {/* Precio */}
              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="number"
                  id="precio"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Notas */}
              <div className="sm:col-span-2">
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                  Notas
                </label>
                <textarea
                  id="notas"
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  placeholder="Notas adicionales sobre la cita..."
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Recordatorio */}
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
                    Enviar recordatorio por WhatsApp
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                Eliminando...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar Cita
              </>
            )}
          </button>

          <div className="flex w-full sm:w-auto space-x-3">
            <Link
              href={`/dashboard/agenda/${params.id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.clienteId || !formData.fecha || !formData.hora || (disponibilidad && !disponibilidad.disponible && !permitirSuperposicion)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        </div>
      </form>
    </div>
  )
}

