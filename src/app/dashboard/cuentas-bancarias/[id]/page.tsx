'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface CuentaBancaria {
  id: string
  nombre: string
  banco: string
  titular: string
  tipoCuenta: string
  cvu?: string
  cbu?: string
  alias?: string
  iban?: string
  numeroCuenta?: string
  codigoSwift?: string
  moneda: string
  notas?: string
  predeterminada: boolean
  activa: boolean
}

export default function EditarCuentaBancariaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    banco: '',
    titular: '',
    tipoCuenta: 'CORRIENTE',
    cvu: '',
    cbu: '',
    alias: '',
    iban: '',
    numeroCuenta: '',
    codigoSwift: '',
    moneda: 'ARS',
    notas: '',
    predeterminada: false
  })

  useEffect(() => {
    if (resolvedParams.id) {
      fetchCuenta()
    }
  }, [resolvedParams.id])

  const fetchCuenta = async () => {
    try {
      const response = await fetch(`/api/cuentas-bancarias/${resolvedParams.id}`)
      if (response.ok) {
        const cuenta: CuentaBancaria = await response.json()
        setFormData({
          nombre: cuenta.nombre || '',
          banco: cuenta.banco || '',
          titular: cuenta.titular || '',
          tipoCuenta: cuenta.tipoCuenta || 'CORRIENTE',
          cvu: cuenta.cvu || '',
          cbu: cuenta.cbu || '',
          alias: cuenta.alias || '',
          iban: cuenta.iban || '',
          numeroCuenta: cuenta.numeroCuenta || '',
          codigoSwift: cuenta.codigoSwift || '',
          moneda: cuenta.moneda || 'ARS',
          notas: cuenta.notas || '',
          predeterminada: cuenta.predeterminada || false
        })
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al cargar la cuenta bancaria' })
      }
    } catch (error) {
      console.error('Error al cargar cuenta:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar la cuenta bancaria' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)

    try {
      const response = await fetch(`/api/cuentas-bancarias/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Cuenta bancaria actualizada exitosamente' })
        setTimeout(() => {
          router.push('/dashboard/cuentas-bancarias')
        }, 1500)
      } else {
        const error = await response.json()
        setMensaje({ tipo: 'error', texto: error.message || 'Error al actualizar la cuenta' })
      }
    } catch (error) {
      console.error('Error al actualizar cuenta:', error)
      setMensaje({ tipo: 'error', texto: 'Error al actualizar la cuenta bancaria' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cuenta bancaria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/dashboard/cuentas-bancarias"
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-blue-600 mr-3" />
                    Editar Cuenta Bancaria
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Modifica la información de la cuenta bancaria
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className={`rounded-md p-4 mb-6 ${mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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
                {/* Información Básica */}
                <div className="sm:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                    Nombre de la Cuenta *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Cuenta Principal Santander"
                  />
                </div>

                <div>
                  <label htmlFor="banco" className="block text-sm font-medium text-gray-700">
                    Banco *
                  </label>
                  <input
                    type="text"
                    id="banco"
                    required
                    value={formData.banco}
                    onChange={(e) => handleInputChange('banco', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Banco Santander"
                  />
                </div>

                <div>
                  <label htmlFor="titular" className="block text-sm font-medium text-gray-700">
                    Titular de la Cuenta *
                  </label>
                  <input
                    type="text"
                    id="titular"
                    required
                    value={formData.titular}
                    onChange={(e) => handleInputChange('titular', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label htmlFor="tipoCuenta" className="block text-sm font-medium text-gray-700">
                    Tipo de Cuenta *
                  </label>
                  <select
                    id="tipoCuenta"
                    value={formData.tipoCuenta}
                    onChange={(e) => handleInputChange('tipoCuenta', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="CORRIENTE">Corriente</option>
                    <option value="AHORRO">Ahorro</option>
                    <option value="CAJA_AHORRO">Caja de Ahorro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="moneda" className="block text-sm font-medium text-gray-700">
                    Moneda *
                  </label>
                  <select
                    id="moneda"
                    value={formData.moneda}
                    onChange={(e) => handleInputChange('moneda', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="predeterminada"
                      checked={formData.predeterminada}
                      onChange={(e) => handleInputChange('predeterminada', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="predeterminada" className="ml-2 block text-sm text-gray-900">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        Cuenta predeterminada
                      </div>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Esta será la cuenta utilizada por defecto para nuevos pagos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Bancaria</h3>
                </div>

                <div>
                  <label htmlFor="cbu" className="block text-sm font-medium text-gray-700">
                    CBU
                  </label>
                  <input
                    type="text"
                    id="cbu"
                    value={formData.cbu}
                    onChange={(e) => handleInputChange('cbu', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: 0070000000000000000001"
                  />
                </div>

                <div>
                  <label htmlFor="cvu" className="block text-sm font-medium text-gray-700">
                    CVU
                  </label>
                  <input
                    type="text"
                    id="cvu"
                    value={formData.cvu}
                    onChange={(e) => handleInputChange('cvu', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: 0000000000000000000001"
                  />
                </div>

                <div>
                  <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                    Alias
                  </label>
                  <input
                    type="text"
                    id="alias"
                    value={formData.alias}
                    onChange={(e) => handleInputChange('alias', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: mi.alias"
                  />
                </div>

                <div>
                  <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    id="numeroCuenta"
                    value={formData.numeroCuenta}
                    onChange={(e) => handleInputChange('numeroCuenta', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: 1234567890"
                  />
                </div>

                <div>
                  <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
                    IBAN
                  </label>
                  <input
                    type="text"
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: AR1234567890123456789012"
                  />
                </div>

                <div>
                  <label htmlFor="codigoSwift" className="block text-sm font-medium text-gray-700">
                    Código SWIFT
                  </label>
                  <input
                    type="text"
                    id="codigoSwift"
                    value={formData.codigoSwift}
                    onChange={(e) => handleInputChange('codigoSwift', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Ej: BANKSARB"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                  Notas Adicionales
                </label>
                <textarea
                  id="notas"
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => handleInputChange('notas', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Información adicional sobre la cuenta..."
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/cuentas-bancarias"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    </div>
  )
}
