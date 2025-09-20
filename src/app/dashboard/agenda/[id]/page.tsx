'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter, useConfiguraciones } from '@/lib/config'
import { createWhatsAppMessage } from '@/lib/audit'

interface Cita {
  id: string
  fecha: string
  hora: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA' | 'REAGENDADA'
  servicio?: string
  precio?: number
  notas?: string
  fotos?: string
  recordatorio: boolean
  createdAt: string
  updatedAt: string
  cliente: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
    email?: string
    tipoPelo: string
    fotos?: string
  }
  usuario?: {
    id: string
    name?: string
    email?: string
  }
}

export default function CitaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { formatPrice } = usePriceFormatter()
  const { config } = useConfiguraciones()
  const [cita, setCita] = useState<Cita | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCita(params.id as string)
    }
  }, [params.id])

  const fetchCita = async (id: string) => {
    try {
      const response = await fetch(`/api/citas/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCita(data)
      } else {
        console.error('Cita no encontrada')
        router.push('/dashboard/agenda')
      }
    } catch (error) {
      console.error('Error al cargar cita:', error)
      router.push('/dashboard/agenda')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    const colors = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMADA: 'bg-green-100 text-green-800 border-green-200',
      REALIZADA: 'bg-blue-100 text-blue-800 border-blue-200',
      CANCELADA: 'bg-red-100 text-red-800 border-red-200',
      REAGENDADA: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  const updateEstado = async (nuevoEstado: string) => {
    if (!cita) return

    try {
      const response = await fetch(`/api/citas/${cita.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: nuevoEstado
        })
      })

      if (response.ok) {
        // Si se marca como realizada, descontar inventario
        if (nuevoEstado === 'REALIZADA' && cita?.servicioId) {
          try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const inventarioResponse = await fetch('/api/inventario/movimiento', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                citaId: cita.id,
                usuarioId: user.id
              }),
            })
            
            if (inventarioResponse.ok) {
              console.log('✅ Inventario actualizado correctamente')
            }
          } catch (error) {
            console.warn('⚠️ Error al actualizar inventario:', error)
            // No mostrar error al usuario, es un proceso secundario
          }
        }
        
        const updatedCita = await response.json()
        setCita(updatedCita)
      } else {
        throw new Error('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      alert('Error al actualizar el estado. Inténtalo de nuevo.')
    }
  }

  const enviarWhatsApp = () => {
    if (!cita) return

    const mensaje = createWhatsAppMessage(cita, cita.cliente, config)
    const telefono = cita.cliente.telefono?.replace(/\D/g, '') // Remover caracteres no numéricos
    
    if (!telefono) {
      alert('El cliente no tiene número de teléfono registrado')
      return
    }

    // Codificación mínima para WhatsApp - preserva emojis y caracteres especiales
    const mensajeCodificado = mensaje
      .replace(/\n/g, '%0A')  // Saltos de línea
      .replace(/ /g, '%20')   // Espacios
      .replace(/&/g, '%26')   // Ampersand
    
    const url = `https://wa.me/${telefono}?text=${mensajeCodificado}`
    window.open(url, '_blank')
  }

  const copiarMensaje = () => {
    if (!cita) return

    const mensaje = createWhatsAppMessage(cita, cita.cliente, config)
    navigator.clipboard.writeText(mensaje).then(() => {
      alert('Mensaje copiado al portapapeles')
    }).catch(() => {
      alert('Error al copiar el mensaje')
    })
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cita) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Cita no encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          La cita que buscas no existe o ha sido eliminada.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/agenda"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Agenda
          </Link>
        </div>
      </div>
    )
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
            <h1 className="text-2xl font-bold text-gray-900">
              Cita - {cita.cliente.nombre} {cita.cliente.apellido}
            </h1>
            <p className="text-gray-600">
              {formatFecha(cita.fecha)} a las {cita.hora}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/agenda/${cita.id}/editar`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles de la Cita */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Detalles de la Cita</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(cita.estado)}`}>
                  {cita.estado}
                </span>
              </div>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatFecha(cita.fecha)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hora</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {cita.hora}
                  </dd>
                </div>
                {cita.servicio && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Servicio</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{cita.servicio}</dd>
                  </div>
                )}
                {cita.precio && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Precio</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center font-medium">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {formatPrice(cita.precio)}
                    </dd>
                  </div>
                )}
                {cita.usuario?.name && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Atendido por</dt>
                    <dd className="mt-1 text-sm text-gray-900">{cita.usuario.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Recordatorio</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {cita.recordatorio ? '✅ Activado' : '❌ Desactivado'}
                  </dd>
                </div>
                {cita.notas && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notas</dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{cita.notas}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {cita.cliente.fotos ? (
                    <img
                      src={cita.cliente.fotos}
                      alt={`${cita.cliente.nombre} ${cita.cliente.apellido}`}
                      className="h-16 w-16 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <span className="text-2xl">{getHairTypeAvatar(cita.cliente.tipoPelo)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {cita.cliente.nombre} {cita.cliente.apellido}
                  </h4>
                  <p className="text-sm text-gray-500">Tipo de pelo: {cita.cliente.tipoPelo}</p>
                  <div className="mt-2 space-y-1">
                    {cita.cliente.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        <a href={`tel:${cita.cliente.telefono}`} className="text-blue-600 hover:text-blue-800">
                          {cita.cliente.telefono}
                        </a>
                      </div>
                    )}
                    {cita.cliente.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        <a href={`mailto:${cita.cliente.email}`} className="text-blue-600 hover:text-blue-800">
                          {cita.cliente.email}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/dashboard/clientes/${cita.cliente.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver perfil completo →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Acciones Rápidas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Acciones</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {cita.estado === 'PENDIENTE' && (
                <button
                  onClick={() => updateEstado('CONFIRMADA')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Confirmar Cita
                </button>
              )}
              
              {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
                <button
                  onClick={() => updateEstado('REALIZADA')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Marcar como Realizada
                </button>
              )}

              {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && (
                <button
                  onClick={() => updateEstado('CANCELADA')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancelar Cita
                </button>
              )}

              {cita.cliente.telefono && (
                <button
                  onClick={enviarWhatsApp}
                  className="w-full flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </button>
              )}

              <button
                onClick={copiarMensaje}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Copiar Mensaje
              </button>

              <Link
                href={`/dashboard/agenda/nueva?cliente=${cita.cliente.id}`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Nueva Cita para este Cliente
              </Link>
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Historial</h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-sm text-gray-500 space-y-2">
                <div>
                  <span className="font-medium">Creada:</span> {new Date(cita.createdAt).toLocaleString('es-ES')}
                </div>
                <div>
                  <span className="font-medium">Última actualización:</span> {new Date(cita.updatedAt).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
