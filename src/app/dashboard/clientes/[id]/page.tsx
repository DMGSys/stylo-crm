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
  CameraIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  tipoPelo: string
  redesSociales?: string
  fotos?: string
  notas?: string
  createdAt: string
  updatedAt: string
  citas: Array<{
    id: string
    fecha: string
    hora: string
    estado: string
    servicio?: string
    precio?: number
    notas?: string
  }>
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { formatPrice } = usePriceFormatter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCliente(params.id as string)
    }
  }, [params.id])

  const fetchCliente = async (id: string) => {
    try {
      const response = await fetch(`/api/clientes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCliente(data)
        if (data.fotos) {
          setPhotoPreview(data.fotos)
        }
      } else {
        console.error('Cliente no encontrado')
        router.push('/dashboard/clientes')
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error)
      router.push('/dashboard/clientes')
    } finally {
      setLoading(false)
    }
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

  const getHairTypeColor = (tipo: string) => {
    const colors = {
      LISO: 'bg-blue-100 text-blue-800',
      RIZADO: 'bg-purple-100 text-purple-800',
      ONDULADO: 'bg-green-100 text-green-800',
      TEÑIDO: 'bg-pink-100 text-pink-800',
      MIXTO: 'bg-yellow-100 text-yellow-800'
    }
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB')
      return
    }

    setUploadingPhoto(true)

    try {
      // Convertir a base64 para preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('clienteId', cliente!.id)

      // Enviar al servidor (por ahora simulamos guardando en base64)
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Actualizar en la base de datos
      const response = await fetch(`/api/clientes/${cliente!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fotos: base64
        })
      })

      if (response.ok) {
        // Actualizar el estado local
        setCliente(prev => prev ? { ...prev, fotos: base64 } : null)
      } else {
        throw new Error('Error al guardar la foto')
      }
    } catch (error) {
      console.error('Error al subir foto:', error)
      alert('Error al subir la foto. Inténtalo de nuevo.')
      setPhotoPreview(cliente?.fotos || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return

    try {
      const response = await fetch(`/api/clientes/${cliente!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fotos: null
        })
      })

      if (response.ok) {
        setCliente(prev => prev ? { ...prev, fotos: undefined } : null)
        setPhotoPreview(null)
      } else {
        throw new Error('Error al eliminar la foto')
      }
    } catch (error) {
      console.error('Error al eliminar foto:', error)
      alert('Error al eliminar la foto. Inténtalo de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Cliente no encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          El cliente que buscas no existe o ha sido eliminado.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/clientes"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Link>
        </div>
      </div>
    )
  }

  const citasRealizadas = cliente.citas.filter(c => c.estado === 'REALIZADA')
  const totalGastado = citasRealizadas.reduce((sum, cita) => sum + (cita.precio || 0), 0)
  const proximaCita = cliente.citas
    .filter(c => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA')
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/dashboard/clientes"
            className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {cliente.nombre} {cliente.apellido}
            </h1>
            <p className="text-gray-600">Información del cliente</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/clientes/${cliente.id}/editar`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Link>
          <Link
            href={`/dashboard/agenda/nueva?cliente=${cliente.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Personal */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{cliente.nombre} {cliente.apellido}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de Pelo</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHairTypeColor(cliente.tipoPelo)}`}>
                      {getHairTypeAvatar(cliente.tipoPelo)} {cliente.tipoPelo}
                    </span>
                  </dd>
                </div>
                {cliente.telefono && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:text-blue-800">
                        {cliente.telefono}
                      </a>
                    </dd>
                  </div>
                )}
                {cliente.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:text-blue-800">
                        {cliente.email}
                      </a>
                    </dd>
                  </div>
                )}
                {cliente.redesSociales && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Redes Sociales</dt>
                    <dd className="mt-1 text-sm text-gray-900">{cliente.redesSociales}</dd>
                  </div>
                )}
                {cliente.notas && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notas</dt>
                    <dd className="mt-1 text-sm text-gray-900">{cliente.notas}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cliente desde</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(cliente.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Historial de Citas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Historial de Citas</h3>
            </div>
            <div className="px-6 py-4">
              {cliente.citas.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin citas</h3>
                  <p className="mt-1 text-sm text-gray-500">Este cliente aún no tiene citas registradas.</p>
                  <div className="mt-6">
                    <Link
                      href={`/dashboard/agenda/nueva?cliente=${cliente.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Agendar Primera Cita
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cliente.citas
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((cita) => (
                      <div key={cita.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-8 w-8 text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(cita.fecha).toLocaleDateString('es-ES')} - {cita.hora}
                              </p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                                {cita.estado}
                              </span>
                            </div>
                            {cita.servicio && (
                              <p className="text-sm text-gray-900 font-medium">{cita.servicio}</p>
                            )}
                            {cita.notas && (
                              <p className="text-sm text-gray-500">{cita.notas}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {cita.precio && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 flex items-center">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                {formatPrice(cita.precio)}
                              </p>
                            </div>
                          )}
                          <Link
                            href={`/dashboard/agenda/${cita.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Foto del Cliente */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Foto del Cliente</h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center">
                <div className="mb-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt={`${cliente.nombre} ${cliente.apellido}`}
                        className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
                      />
                      <button
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-4xl">{getHairTypeAvatar(cliente.tipoPelo)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="photo-upload"
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    {uploadingPhoto ? 'Subiendo...' : (photoPreview ? 'Cambiar Foto' : 'Subir Foto')}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG hasta 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Estadísticas</h3>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total de Citas</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{cliente.citas.length}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Citas Realizadas</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">{citasRealizadas.length}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Gastado</dt>
                  <dd className="mt-1 text-2xl font-semibold text-blue-600">{formatPrice(totalGastado)}</dd>
                </div>
                {proximaCita && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Próxima Cita</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(proximaCita.fecha).toLocaleDateString('es-ES')} - {proximaCita.hora}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
