'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline'

export default function NuevaCuentaBancariaPage() {
  const router = useRouter()
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.banco || !formData.titular) {
      setMensaje({ tipo: 'error', texto: 'Nombre, banco y titular son obligatorios' })
      return
    }

    setSaving(true)
    setMensaje(null)

    try {
      const response = await fetch('/api/cuentas-bancarias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const nuevaCuenta = await response.json()
        setMensaje({ tipo: 'success', texto: 'Cuenta bancaria creada exitosamente' })
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/dashboard/cuentas-bancarias')
        }, 2000)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cuenta')
      }
    } catch (error) {
      console.error('Error al crear cuenta:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta'
      setMensaje({ tipo: 'error', texto: errorMessage })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Cuenta Bancaria</h1>
              <p className="mt-1 text-sm text-gray-500">
                Agrega una nueva cuenta para recibir transferencias
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
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
                  Titular *
                </label>
                <input
                  type="text"
                  id="titular"
                  required
                  value={formData.titular}
                  onChange={(e) => handleInputChange('titular', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nombre completo del titular"
                />
              </div>

              <div>
                <label htmlFor="tipoCuenta" className="block text-sm font-medium text-gray-700">
                  Tipo de Cuenta *
                </label>
                <select
                  id="tipoCuenta"
                  required
                  value={formData.tipoCuenta}
                  onChange={(e) => handleInputChange('tipoCuenta', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="CORRIENTE">Cuenta Corriente</option>
                  <option value="AHORRO">Cuenta de Ahorro</option>
                  <option value="EMPRESARIAL">Cuenta Empresarial</option>
                </select>
              </div>

              <div>
                <label htmlFor="moneda" className="block text-sm font-medium text-gray-700">
                  Moneda
                </label>
                <select
                  id="moneda"
                  value={formData.moneda}
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="ARS">🇦🇷 Peso Argentino (ARS)</option>
                  <option value="EUR">🇪🇺 Euro (EUR)</option>
                  <option value="USD">🇺🇸 Dólar (USD)</option>
                  <option value="GBP">🇬🇧 Libra (GBP)</option>
                  <option value="MXN">🇲🇽 Peso Mexicano (MXN)</option>
                  <option value="COP">🇨🇴 Peso Colombiano (COP)</option>
                </select>
              </div>

              {/* Datos Bancarios */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Datos Bancarios</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Completa los campos según tu región y tipo de cuenta
                </p>
              </div>

              <div>
                <label htmlFor="cvu" className="block text-sm font-medium text-gray-700">
                  🇦🇷 CVU (Argentina)
                </label>
                <input
                  type="text"
                  id="cvu"
                  value={formData.cvu}
                  onChange={(e) => handleInputChange('cvu', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0000003100010000000001"
                  maxLength={22}
                />
              </div>

              <div>
                <label htmlFor="cbu" className="block text-sm font-medium text-gray-700">
                  🇦🇷 CBU (Argentina)
                </label>
                <input
                  type="text"
                  id="cbu"
                  value={formData.cbu}
                  onChange={(e) => handleInputChange('cbu', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0170001540000001234567"
                  maxLength={22}
                />
              </div>

              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-gray-700">
                  📝 Alias Bancario
                </label>
                <input
                  type="text"
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => handleInputChange('alias', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="SALON.BELLEZA.123"
                  maxLength={20}
                />
              </div>

              <div>
                <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
                  🇪🇺 IBAN (Europa)
                </label>
                <input
                  type="text"
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ES91 2100 0418 4502 0005 1332"
                  maxLength={34}
                />
              </div>

              <div>
                <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700">
                  🏦 Número de Cuenta
                </label>
                <input
                  type="text"
                  id="numeroCuenta"
                  value={formData.numeroCuenta}
                  onChange={(e) => handleInputChange('numeroCuenta', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="1234567890123456"
                />
              </div>

              <div>
                <label htmlFor="codigoSwift" className="block text-sm font-medium text-gray-700">
                  🌍 Código SWIFT
                </label>
                <input
                  type="text"
                  id="codigoSwift"
                  value={formData.codigoSwift}
                  onChange={(e) => handleInputChange('codigoSwift', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="BSCHESMMXXX"
                  maxLength={11}
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
                  className="mt-1 block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Observaciones sobre esta cuenta..."
                />
              </div>

              {/* Configuración */}
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="predeterminada"
                    type="checkbox"
                    checked={formData.predeterminada}
                    onChange={(e) => handleInputChange('predeterminada', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="predeterminada" className="ml-2 block text-sm text-gray-900 flex items-center">
                    <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                    Establecer como cuenta predeterminada
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La cuenta predeterminada se mostrará primero en los formularios de pago
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            href="/dashboard/cuentas-bancarias"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.nombre || !formData.banco || !formData.titular}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Crear Cuenta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

