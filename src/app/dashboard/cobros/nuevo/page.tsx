'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { usePriceFormatter } from '@/lib/config'

interface CitaPendiente {
  id: string
  fecha: string
  hora: string
  servicio?: string
  precio?: number
  estado: string
  cliente: {
    id: string
    nombre: string
    apellido: string
    telefono?: string
  }
  pago?: {
    id: string
    estadoPago: string
  }
}

export default function NuevoPagoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formatPrice } = usePriceFormatter()
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [citasPendientes, setCitasPendientes] = useState<CitaPendiente[]>([])
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [cuentasBancarias, setCuentasBancarias] = useState<any[]>([])
  const [formData, setFormData] = useState({
    citaId: searchParams.get('cita') || '',
    montoServicio: '',
    propina: '0',
    descuento: '0',
    metodoPago: 'EFECTIVO',
    cuentaBancariaId: '',
    referencia: '',
    notas: ''
  })

  useEffect(() => {
    fetchCitasPendientes()
    fetchConfiguracionBanco()
  }, [])

  useEffect(() => {
    // Auto-calcular monto total cuando cambien los valores
    const montoServicio = parseFloat(formData.montoServicio) || 0
    const propina = parseFloat(formData.propina) || 0
    const descuento = parseFloat(formData.descuento) || 0
    const montoTotal = montoServicio + propina - descuento
    
    // Actualizar el monto total en el display
    setMontoTotal(montoTotal)
  }, [formData.montoServicio, formData.propina, formData.descuento])

  const [montoTotal, setMontoTotal] = useState(0)

  const fetchCitasPendientes = async () => {
    try {
      const response = await fetch('/api/citas/pendientes-pago')
      if (response.ok) {
        const data = await response.json()
        setCitasPendientes(data.citas || [])
        
        // Si hay una cita preseleccionada, cargar sus datos
        const citaId = searchParams.get('cita')
        if (citaId) {
          const citaSeleccionada = data.citas.find((c: CitaPendiente) => c.id === citaId)
          if (citaSeleccionada) {
            setFormData(prev => ({
              ...prev,
              montoServicio: (citaSeleccionada.precio || 0).toString()
            }))
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar citas pendientes:', error)
    } finally {
      setLoadingCitas(false)
    }
  }

  const fetchConfiguracionBanco = async () => {
    try {
      const response = await fetch('/api/cuentas-bancarias?activasOnly=true')
      if (response.ok) {
        const data = await response.json()
        setCuentasBancarias(data.cuentas || [])
        
        // Seleccionar cuenta predeterminada si existe
        const cuentaPredeterminada = data.cuentas.find((c: any) => c.predeterminada)
        if (cuentaPredeterminada) {
          setFormData(prev => ({
            ...prev,
            cuentaBancariaId: cuentaPredeterminada.id
          }))
        }
      }
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-completar precio cuando se selecciona una cita
      if (field === 'citaId') {
        const citaSeleccionada = citasPendientes.find(c => c.id === value)
        if (citaSeleccionada) {
          newData.montoServicio = (citaSeleccionada.precio || 0).toString()
        }
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.citaId || !formData.montoServicio) {
      setMensaje({ tipo: 'error', texto: 'Cita y monto del servicio son obligatorios' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const pagoData = {
        citaId: formData.citaId,
        monto: montoTotal,
        montoServicio: parseFloat(formData.montoServicio),
        propina: parseFloat(formData.propina) || 0,
        descuento: parseFloat(formData.descuento) || 0,
        metodoPago: formData.metodoPago,
        cuentaBancariaId: formData.cuentaBancariaId || undefined,
        estadoPago: 'COMPLETADO',
        referencia: formData.referencia || undefined,
        notas: formData.notas || undefined,
        usuarioId: null // Se puede obtener de la sesión
      }

      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pagoData)
      })

      if (response.ok) {
        const nuevoPago = await response.json()
        setMensaje({ tipo: 'success', texto: 'Pago registrado exitosamente' })
        
        // Redirigir a la lista de cobros después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard/cobros')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar pago')
      }
    } catch (error) {
      console.error('Error al registrar pago:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar el pago'
      setMensaje({ tipo: 'error', texto: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  const getCitaSeleccionada = () => {
    return citasPendientes.find(c => c.id === formData.citaId)
  }

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO':
        return <BanknotesIcon className="h-5 w-5 text-green-500" />
      case 'TARJETA_CREDITO':
      case 'TARJETA_DEBITO':
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const citaSeleccionada = getCitaSeleccionada()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Registrar Pago</h1>
              <p className="mt-1 text-sm text-gray-500">
                Registra el cobro de un servicio realizado
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
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
              {/* Selección de Cita */}
              <div className="sm:col-span-2">
                <label htmlFor="citaId" className="block text-sm font-medium text-gray-700">
                  Cita a Cobrar *
                </label>
                {loadingCitas ? (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Cargando citas...
                  </div>
                ) : (
                  <select
                    id="citaId"
                    required
                    value={formData.citaId}
                    onChange={(e) => handleInputChange('citaId', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="" className="text-gray-900 bg-white">Seleccionar cita...</option>
                    {citasPendientes.map((cita) => (
                      <option key={cita.id} value={cita.id} className="text-gray-900 bg-white">
                        {cita.cliente.nombre} {cita.cliente.apellido} - {new Date(cita.fecha).toLocaleDateString('es-ES')} {cita.hora} - {cita.servicio} 
                        {cita.precio && ` - ${formatPrice(cita.precio)}`}
                      </option>
                    ))}
                  </select>
                )}
                
                {/* Información de la cita seleccionada */}
                {citaSeleccionada && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900">
                          {citaSeleccionada.cliente.nombre} {citaSeleccionada.cliente.apellido}
                        </h4>
                        <div className="mt-1 text-sm text-blue-700">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(citaSeleccionada.fecha).toLocaleDateString('es-ES')} a las {citaSeleccionada.hora}
                            </span>
                          </div>
                          <div className="mt-1">
                            Servicio: {citaSeleccionada.servicio}
                          </div>
                          {citaSeleccionada.cliente.telefono && (
                            <div className="mt-1">
                              📞 {citaSeleccionada.cliente.telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Monto del Servicio */}
              <div>
                <label htmlFor="montoServicio" className="block text-sm font-medium text-gray-700">
                  Monto del Servicio *
                </label>
                <input
                  type="number"
                  id="montoServicio"
                  step="0.01"
                  min="0"
                  required
                  value={formData.montoServicio}
                  onChange={(e) => handleInputChange('montoServicio', e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Propina */}
              <div>
                <label htmlFor="propina" className="block text-sm font-medium text-gray-700">
                  Propina
                </label>
                <input
                  type="number"
                  id="propina"
                  step="0.01"
                  min="0"
                  value={formData.propina}
                  onChange={(e) => handleInputChange('propina', e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Descuento */}
              <div>
                <label htmlFor="descuento" className="block text-sm font-medium text-gray-700">
                  Descuento
                </label>
                <input
                  type="number"
                  id="descuento"
                  step="0.01"
                  min="0"
                  value={formData.descuento}
                  onChange={(e) => handleInputChange('descuento', e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Método de Pago */}
              <div>
                <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700">
                  Método de Pago *
                </label>
                <select
                  id="metodoPago"
                  required
                  value={formData.metodoPago}
                  onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA_CREDITO">💳 Tarjeta de Crédito</option>
                  <option value="TARJETA_DEBITO">💳 Tarjeta de Débito</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia</option>
                  <option value="PAYPAL">💰 PayPal</option>
                  <option value="BIZUM">📱 Bizum</option>
                  <option value="OTROS">🔄 Otros</option>
                </select>
              </div>

              {/* Selección de cuenta bancaria para transferencias */}
              {formData.metodoPago === 'TRANSFERENCIA' && (
                <div className="sm:col-span-2">
                  <label htmlFor="cuentaBancariaId" className="block text-sm font-medium text-gray-700">
                    Cuenta Bancaria para Recibir *
                  </label>
                  <select
                    id="cuentaBancariaId"
                    required={formData.metodoPago === 'TRANSFERENCIA'}
                    value={formData.cuentaBancariaId}
                    onChange={(e) => handleInputChange('cuentaBancariaId', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cuentasBancarias.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.predeterminada ? '⭐ ' : ''}{cuenta.nombre} - {cuenta.banco} ({cuenta.moneda})
                      </option>
                    ))}
                  </select>
                  
                  {cuentasBancarias.length === 0 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No hay cuentas bancarias configuradas. 
                        <Link 
                          href="/dashboard/cuentas-bancarias/nueva" 
                          className="font-medium underline hover:no-underline ml-1"
                        >
                          Agregar una cuenta
                        </Link>
                      </p>
                    </div>
                  )}
                  
                  {/* Mostrar datos de la cuenta seleccionada */}
                  {formData.cuentaBancariaId && (
                    (() => {
                      const cuentaSeleccionada = cuentasBancarias.find(c => c.id === formData.cuentaBancariaId)
                      if (!cuentaSeleccionada) return null
                      
                      return (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <h4 className="text-sm font-medium text-blue-900 mb-3">
                            📋 Datos para Transferencia - {cuentaSeleccionada.nombre}
                          </h4>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                            {cuentaSeleccionada.cvu && (
                              <div>
                                <span className="font-medium text-blue-800">🇦🇷 CVU:</span>
                                <div className="text-blue-700 font-mono text-xs mt-1 p-2 bg-blue-100 rounded">
                                  {cuentaSeleccionada.cvu}
                                </div>
                              </div>
                            )}
                            {cuentaSeleccionada.cbu && (
                              <div>
                                <span className="font-medium text-blue-800">🇦🇷 CBU:</span>
                                <div className="text-blue-700 font-mono text-xs mt-1 p-2 bg-blue-100 rounded">
                                  {cuentaSeleccionada.cbu}
                                </div>
                              </div>
                            )}
                            {cuentaSeleccionada.alias && (
                              <div>
                                <span className="font-medium text-blue-800">📝 Alias:</span>
                                <div className="text-blue-700 font-mono text-xs mt-1 p-2 bg-blue-100 rounded">
                                  {cuentaSeleccionada.alias}
                                </div>
                              </div>
                            )}
                            {cuentaSeleccionada.iban && (
                              <div>
                                <span className="font-medium text-blue-800">🇪🇺 IBAN:</span>
                                <div className="text-blue-700 font-mono text-xs mt-1 p-2 bg-blue-100 rounded">
                                  {cuentaSeleccionada.iban}
                                </div>
                              </div>
                            )}
                            {cuentaSeleccionada.numeroCuenta && (
                              <div>
                                <span className="font-medium text-blue-800">🏦 Cuenta:</span>
                                <div className="text-blue-700 font-mono text-xs mt-1 p-2 bg-blue-100 rounded">
                                  {cuentaSeleccionada.numeroCuenta}
                                </div>
                              </div>
                            )}
                            <div className="sm:col-span-2">
                              <span className="font-medium text-blue-800">🏦 Banco:</span>
                              <div className="text-blue-700 mt-1">
                                {cuentaSeleccionada.banco} - {cuentaSeleccionada.titular}
                              </div>
                              <div className="text-blue-600 text-xs mt-1">
                                {cuentaSeleccionada.tipoCuenta} • {cuentaSeleccionada.moneda}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  )}
                </div>
              )}

              {/* Referencia (para pagos electrónicos) */}
              {formData.metodoPago !== 'EFECTIVO' && (
                <div className="sm:col-span-2">
                  <label htmlFor="referencia" className="block text-sm font-medium text-gray-700">
                    Número de Referencia/Transacción
                  </label>
                  <input
                    type="text"
                    id="referencia"
                    value={formData.referencia}
                    onChange={(e) => handleInputChange('referencia', e.target.value)}
                    placeholder="Ej: TXN123456789, Ref: 987654"
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Notas */}
              <div className="sm:col-span-2">
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                  Notas del Pago
                </label>
                <textarea
                  id="notas"
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  placeholder="Observaciones adicionales sobre el pago..."
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del Pago */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Resumen del Pago</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monto del servicio:</span>
                <span className="font-medium">{formatPrice(parseFloat(formData.montoServicio) || 0)}</span>
              </div>
              {parseFloat(formData.propina) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Propina:</span>
                  <span className="font-medium text-green-600">+{formatPrice(parseFloat(formData.propina))}</span>
                </div>
              )}
              {parseFloat(formData.descuento) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento:</span>
                  <span className="font-medium text-red-600">-{formatPrice(parseFloat(formData.descuento))}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total a Cobrar:</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(montoTotal)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getMetodoIcon(formData.metodoPago)}
                <span>Método: {formData.metodoPago.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            href="/dashboard/cobros"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.citaId || !formData.montoServicio}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Registrar Pago - {formatPrice(montoTotal)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
