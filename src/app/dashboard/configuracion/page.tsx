'use client'

import { useState, useEffect } from 'react'
import {
  CogIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useConfiguraciones, clearConfigCache, saveConfigToLocalStorage } from '@/lib/config'

interface ConfiguracionItem {
  clave: string
  valor: string
  tipo: string
  categoria: string
  descripcion?: string
}

export default function ConfiguracionPage() {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchConfiguraciones()
  }, [])

  const fetchConfiguraciones = async () => {
    try {
      const response = await fetch('/api/configuracion/all')
      if (response.ok) {
        const data = await response.json()
        setConfiguraciones(data)
        
        // Inicializar formData
        const initialData: Record<string, string> = {}
        data.forEach((config: ConfiguracionItem) => {
          initialData[config.clave] = config.valor
        })
        setFormData(initialData)
      } else {
        // Si no existe la API detallada, usar la básica
        const basicResponse = await fetch('/api/configuracion')
        if (basicResponse.ok) {
          const basicData = await basicResponse.json()
          setFormData(basicData)
        }
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar configuraciones' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (clave: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [clave]: valor
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)

    try {
      // Intentar guardar en el servidor
      const response = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Configuración guardada exitosamente en el servidor' })
        clearConfigCache()
      } else {
        // Si el servidor falla, guardar en localStorage
        throw new Error('Error del servidor')
      }
    } catch (error) {
      console.warn('Error al guardar en servidor, guardando localmente:', error)
      
      // Guardar en localStorage como fallback
      const config = {
        moneda: {
          simbolo: formData.moneda_simbolo || '€',
          nombre: formData.moneda_nombre || 'EUR',
          posicion: (formData.moneda_posicion as 'before' | 'after') || 'after',
          decimales: parseInt(formData.moneda_decimales || '2')
        },
        negocio: {
          nombre: formData.negocio_nombre || 'Peluquería Elegance',
          telefono: formData.negocio_telefono || '+34 666 123 456',
          direccion: formData.negocio_direccion || 'Calle Principal 123, Madrid',
          horario_apertura: formData.horario_apertura || '09:00',
          horario_cierre: formData.horario_cierre || '20:00'
        }
      }
      
      saveConfigToLocalStorage(config)
      clearConfigCache()
      setMensaje({ tipo: 'success', texto: 'Configuración guardada localmente (servidor no disponible)' })
    } finally {
      setSaving(false)
      // Ocultar mensaje después de 4 segundos
      setTimeout(() => setMensaje(null), 4000)
    }
  }

  const getPreview = () => {
    const simbolo = formData.moneda_simbolo || '€'
    const decimales = parseInt(formData.moneda_decimales || '2')
    const posicion = formData.moneda_posicion || 'after'
    const precio = 45.5

    const precioFormateado = precio.toFixed(decimales)
    
    if (posicion === 'before') {
      return `${simbolo}${precioFormateado}`
    } else {
      return `${precioFormateado}${simbolo}`
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Personaliza la configuración de tu peluquería</p>
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
        {/* Configuración de Moneda */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Configuración de Moneda</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="moneda_simbolo" className="block text-sm font-medium text-gray-700">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  id="moneda_simbolo"
                  value={formData.moneda_simbolo || ''}
                  onChange={(e) => handleInputChange('moneda_simbolo', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                  placeholder="€"
                />
              </div>
              
              <div>
                <label htmlFor="moneda_nombre" className="block text-sm font-medium text-gray-700">
                  Código de Moneda
                </label>
                <select
                  id="moneda_nombre"
                  value={formData.moneda_nombre || ''}
                  onChange={(e) => {
                    const selectedCurrency = e.target.value
                    handleInputChange('moneda_nombre', selectedCurrency)
                    
                    // Auto-actualizar símbolo según la moneda seleccionada
                    const symbols: Record<string, string> = {
                      'EUR': '€',
                      'USD': '$',
                      'ARS': '$',
                      'COP': '$',
                      'MXN': '$',
                      'GBP': '£',
                      'JPY': '¥'
                    }
                    if (symbols[selectedCurrency]) {
                      handleInputChange('moneda_simbolo', symbols[selectedCurrency])
                    }
                  }}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                >
                  <option value="EUR" className="text-gray-900 bg-white">EUR - Euro</option>
                  <option value="USD" className="text-gray-900 bg-white">USD - Dólar Americano</option>
                  <option value="ARS" className="text-gray-900 bg-white">ARS - Peso Argentino</option>
                  <option value="COP" className="text-gray-900 bg-white">COP - Peso Colombiano</option>
                  <option value="MXN" className="text-gray-900 bg-white">MXN - Peso Mexicano</option>
                  <option value="GBP" className="text-gray-900 bg-white">GBP - Libra Esterlina</option>
                  <option value="JPY" className="text-gray-900 bg-white">JPY - Yen Japonés</option>
                </select>
              </div>

              <div>
                <label htmlFor="moneda_posicion" className="block text-sm font-medium text-gray-700">
                  Posición del Símbolo
                </label>
                <select
                  id="moneda_posicion"
                  value={formData.moneda_posicion || ''}
                  onChange={(e) => handleInputChange('moneda_posicion', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                >
                  <option value="after" className="text-gray-900 bg-white">Después del precio (25.00€)</option>
                  <option value="before" className="text-gray-900 bg-white">Antes del precio (€25.00)</option>
                </select>
              </div>

              <div>
                <label htmlFor="moneda_decimales" className="block text-sm font-medium text-gray-700">
                  Decimales
                </label>
                <select
                  id="moneda_decimales"
                  value={formData.moneda_decimales || ''}
                  onChange={(e) => handleInputChange('moneda_decimales', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                >
                  <option value="0" className="text-gray-900 bg-white">Sin decimales (25)</option>
                  <option value="1" className="text-gray-900 bg-white">1 decimal (25.0)</option>
                  <option value="2" className="text-gray-900 bg-white">2 decimales (25.00)</option>
                </select>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-sm font-medium text-blue-900">Vista previa del formato:</p>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  Precio de ejemplo: <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">{getPreview()}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Así se mostrarán todos los precios en la aplicación
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Negocio */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-6 w-6 text-gray-400 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Información del Negocio</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="negocio_nombre" className="block text-sm font-medium text-gray-700">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  id="negocio_nombre"
                  value={formData.negocio_nombre || ''}
                  onChange={(e) => handleInputChange('negocio_nombre', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                  placeholder="Peluquería Elegance"
                />
              </div>
              
              <div>
                <label htmlFor="negocio_telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="text"
                  id="negocio_telefono"
                  value={formData.negocio_telefono || ''}
                  onChange={(e) => handleInputChange('negocio_telefono', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                  placeholder="+34 666 123 456"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="negocio_direccion" className="block text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <input
                  type="text"
                  id="negocio_direccion"
                  value={formData.negocio_direccion || ''}
                  onChange={(e) => handleInputChange('negocio_direccion', e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                  placeholder="Calle Principal 123, Madrid"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horarios de Atención Detallados */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Horarios de Atención</h3>
                  <p className="text-sm text-gray-500">Configure horarios específicos para cada día</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                💡 Ejemplo: Martes 9-18, Sábado 13-20
              </div>
            </div>
          </div>
          <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Configuración por Día */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  📅 Horarios por Día de la Semana
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Aplicar horario estándar (L-V 9-18, S 9-14)
                      const horarioEstandar = {
                        lunes: { activo: true, inicio: '09:00', fin: '18:00', descanso_inicio: '13:00', descanso_fin: '14:00' },
                        martes: { activo: true, inicio: '09:00', fin: '18:00', descanso_inicio: '13:00', descanso_fin: '14:00' },
                        miercoles: { activo: true, inicio: '09:00', fin: '18:00', descanso_inicio: '13:00', descanso_fin: '14:00' },
                        jueves: { activo: true, inicio: '09:00', fin: '18:00', descanso_inicio: '13:00', descanso_fin: '14:00' },
                        viernes: { activo: true, inicio: '09:00', fin: '18:00', descanso_inicio: '13:00', descanso_fin: '14:00' },
                        sabado: { activo: true, inicio: '09:00', fin: '14:00', descanso_inicio: '', descanso_fin: '' },
                        domingo: { activo: false, inicio: '', fin: '', descanso_inicio: '', descanso_fin: '' }
                      }
                      handleInputChange('horarios_detallados', JSON.stringify(horarioEstandar))
                    }}
                    className="w-full sm:w-auto text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium min-h-[40px]"
                  >
                    📋 Estándar L-V
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Aplicar horario extendido (L-S 10-20)
                      const horarioExtendido = {
                        lunes: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
                        martes: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
                        miercoles: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
                        jueves: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
                        viernes: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '14:00', descanso_fin: '15:00' },
                        sabado: { activo: true, inicio: '10:00', fin: '20:00', descanso_inicio: '', descanso_fin: '' },
                        domingo: { activo: false, inicio: '', fin: '', descanso_inicio: '', descanso_fin: '' }
                      }
                      handleInputChange('horarios_detallados', JSON.stringify(horarioExtendido))
                    }}
                    className="w-full sm:w-auto text-sm px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium min-h-[40px]"
                  >
                    🌟 Extendido L-S
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'lunes', label: 'Lunes', emoji: '1️⃣' },
                  { key: 'martes', label: 'Martes', emoji: '2️⃣' },
                  { key: 'miercoles', label: 'Miércoles', emoji: '3️⃣' },
                  { key: 'jueves', label: 'Jueves', emoji: '4️⃣' },
                  { key: 'viernes', label: 'Viernes', emoji: '5️⃣' },
                  { key: 'sabado', label: 'Sábado', emoji: '6️⃣' },
                  { key: 'domingo', label: 'Domingo', emoji: '7️⃣' }
                ].map((dia) => {
                  const horarios = formData.horarios_detallados ? JSON.parse(formData.horarios_detallados) : {}
                  const horarioDia = horarios[dia.key] || { activo: false, inicio: '', fin: '', descanso_inicio: '', descanso_fin: '' }
                  
                  return (
                    <div key={dia.key} className={`border-2 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                      horarioDia.activo 
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{dia.emoji}</span>
                          <h4 className="text-sm font-medium text-gray-900">{dia.label}</h4>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={horarioDia.activo}
                              onChange={(e) => {
                                const nuevosHorarios = { ...horarios }
                                nuevosHorarios[dia.key] = {
                                  ...horarioDia,
                                  activo: e.target.checked,
                                  inicio: e.target.checked ? (horarioDia.inicio || '09:00') : '',
                                  fin: e.target.checked ? (horarioDia.fin || '18:00') : ''
                                }
                                handleInputChange('horarios_detallados', JSON.stringify(nuevosHorarios))
                              }}
                              className="sr-only"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                              horarioDia.activo ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                horarioDia.activo ? 'translate-x-6' : 'translate-x-0.5'
                              } mt-0.5`}></div>
                            </div>
                          </div>
                          <span className={`ml-3 text-sm font-medium ${
                            horarioDia.activo ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {horarioDia.activo ? '✅ Abierto' : '❌ Cerrado'}
                          </span>
                        </label>
                      </div>
                      
                      {horarioDia.activo && (
                        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs font-medium text-blue-700 mb-2 flex items-center">
                                🕐 <span className="ml-1">Inicio</span>
                              </label>
                            <input
                              type="time"
                              value={horarioDia.inicio}
                              onChange={(e) => {
                                const nuevosHorarios = { ...horarios }
                                nuevosHorarios[dia.key] = { ...horarioDia, inicio: e.target.value }
                                handleInputChange('horarios_detallados', JSON.stringify(nuevosHorarios))
                              }}
                              className="w-full px-3 py-3 sm:py-2 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-2 flex items-center">
                              🕕 <span className="ml-1">Fin</span>
                            </label>
                            <input
                              type="time"
                              value={horarioDia.fin}
                              onChange={(e) => {
                                const nuevosHorarios = { ...horarios }
                                nuevosHorarios[dia.key] = { ...horarioDia, fin: e.target.value }
                                handleInputChange('horarios_detallados', JSON.stringify(nuevosHorarios))
                              }}
                              className="w-full px-3 py-3 sm:py-2 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-purple-700 mb-2 flex items-center">
                              ☕ <span className="ml-1">Descanso inicio</span>
                            </label>
                            <input
                              type="time"
                              value={horarioDia.descanso_inicio}
                              onChange={(e) => {
                                const nuevosHorarios = { ...horarios }
                                nuevosHorarios[dia.key] = { ...horarioDia, descanso_inicio: e.target.value }
                                handleInputChange('horarios_detallados', JSON.stringify(nuevosHorarios))
                              }}
                              className="w-full px-3 py-3 sm:py-2 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                              placeholder="Opcional"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-purple-700 mb-2 flex items-center">
                              ☕ <span className="ml-1">Descanso fin</span>
                            </label>
                            <input
                              type="time"
                              value={horarioDia.descanso_fin}
                              onChange={(e) => {
                                const nuevosHorarios = { ...horarios }
                                nuevosHorarios[dia.key] = { ...horarioDia, descanso_fin: e.target.value }
                                handleInputChange('horarios_detallados', JSON.stringify(nuevosHorarios))
                              }}
                              className="w-full px-3 py-3 sm:py-2 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
                              placeholder="Opcional"
                            />
                          </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Intervalo entre Citas */}
            <div>
              <label htmlFor="horarios_intervalo_citas" className="block text-sm font-medium text-gray-700">
                ⏱️ Intervalo entre Citas (minutos)
              </label>
              <select
                id="horarios_intervalo_citas"
                value={formData.horarios_intervalo_citas || '30'}
                onChange={(e) => handleInputChange('horarios_intervalo_citas', e.target.value)}
                className="mt-1 block w-full px-4 py-3 sm:py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors text-base sm:text-sm min-h-[44px]"
              >
                <option value="15" className="text-gray-900 bg-white">15 minutos</option>
                <option value="30" className="text-gray-900 bg-white">30 minutos</option>
                <option value="45" className="text-gray-900 bg-white">45 minutos</option>
                <option value="60" className="text-gray-900 bg-white">60 minutos</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Tiempo mínimo entre el final de una cita y el inicio de la siguiente
              </p>
            </div>

            {/* Preview de Horarios Detallados */}
            {formData.horarios_detallados && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">📋 Resumen de Horarios</h4>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const horarios = JSON.parse(formData.horarios_detallados)
                      return Object.entries(horarios).map(([dia, config]: [string, any]) => (
                        <div key={dia} className="flex items-center justify-between text-sm text-blue-800">
                          <span className="font-medium capitalize">{dia}:</span>
                          {config.activo ? (
                            <span>
                              {config.inicio} - {config.fin}
                              {config.descanso_inicio && config.descanso_fin && 
                                ` (Descanso: ${config.descanso_inicio}-${config.descanso_fin})`
                              }
                            </span>
                          ) : (
                            <span className="text-red-600">Cerrado</span>
                          )}
                        </div>
                      ))
                    } catch {
                      return <p className="text-sm text-red-600">Error al mostrar horarios</p>
                    }
                  })()}
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Intervalo entre citas:</strong> {formData.horarios_intervalo_citas || '30'} minutos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={fetchConfiguraciones}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
