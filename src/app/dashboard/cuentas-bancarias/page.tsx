'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PlusIcon,
  BanknotesIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
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
  activa: boolean
  predeterminada: boolean
  moneda: string
  notas?: string
  createdAt: string
  _count?: {
    pagos: number
  }
}

export default function CuentasBancariasPage() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  useEffect(() => {
    fetchCuentas()
  }, [])

  const fetchCuentas = async () => {
    try {
      const response = await fetch('/api/cuentas-bancarias')
      if (response.ok) {
        const data = await response.json()
        setCuentas(data.cuentas || [])
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActiva = async (id: string, activa: boolean) => {
    try {
      const response = await fetch(`/api/cuentas-bancarias/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activa: !activa })
      })

      if (response.ok) {
        fetchCuentas()
        setMensaje({ 
          tipo: 'success', 
          texto: `Cuenta ${!activa ? 'activada' : 'desactivada'} exitosamente` 
        })
      }
    } catch (error) {
      console.error('Error al actualizar cuenta:', error)
      setMensaje({ tipo: 'error', texto: 'Error al actualizar la cuenta' })
    }
  }

  const setPredeterminada = async (id: string) => {
    try {
      const response = await fetch(`/api/cuentas-bancarias/${id}/predeterminada`, {
        method: 'PATCH'
      })

      if (response.ok) {
        fetchCuentas()
        setMensaje({ tipo: 'success', texto: 'Cuenta predeterminada actualizada' })
      }
    } catch (error) {
      console.error('Error al establecer cuenta predeterminada:', error)
      setMensaje({ tipo: 'error', texto: 'Error al establecer cuenta predeterminada' })
    }
  }

  const eliminarCuenta = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la cuenta "${nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/cuentas-bancarias/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCuentas()
        setMensaje({ tipo: 'success', texto: 'Cuenta eliminada exitosamente' })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar cuenta')
      }
    } catch (error) {
      console.error('Error al eliminar cuenta:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la cuenta'
      setMensaje({ tipo: 'error', texto: errorMessage })
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'CORRIENTE':
        return <BanknotesIcon className="h-5 w-5 text-blue-500" />
      case 'AHORRO':
        return <CreditCardIcon className="h-5 w-5 text-green-500" />
      default:
        return <BanknotesIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getMonedaFlag = (moneda: string) => {
    const flags = {
      ARS: '🇦🇷',
      EUR: '🇪🇺',
      USD: '🇺🇸',
      GBP: '🇬🇧',
      MXN: '🇲🇽',
      COP: '🇨🇴'
    }
    return flags[moneda as keyof typeof flags] || '💰'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cuentas Bancarias</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona las cuentas bancarias del negocio para recibir transferencias
              </p>
            </div>
            <Link
              href="/dashboard/cuentas-bancarias/nueva"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`rounded-md p-4 ${mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {mensaje.tipo === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-400" />
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

      {/* Lista de cuentas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Cuentas Configuradas ({cuentas.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : cuentas.length === 0 ? (
          <div className="text-center py-12">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas configuradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Agrega tu primera cuenta bancaria para recibir transferencias.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/cuentas-bancarias/nueva"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Cuenta
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cuentas.map((cuenta) => (
              <div key={cuenta.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getTipoIcon(cuenta.tipoCuenta)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {cuenta.nombre}
                        </h4>
                        {cuenta.predeterminada && (
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        )}
                        <span className="text-sm text-gray-500">
                          {getMonedaFlag(cuenta.moneda)} {cuenta.moneda}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          cuenta.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {cuenta.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="font-medium">{cuenta.banco} - {cuenta.titular}</div>
                        <div className="text-xs text-gray-500 mt-1">{cuenta.tipoCuenta}</div>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        {cuenta.cvu && (
                          <div>🇦🇷 CVU: <span className="font-mono">{cuenta.cvu}</span></div>
                        )}
                        {cuenta.cbu && (
                          <div>🇦🇷 CBU: <span className="font-mono">{cuenta.cbu}</span></div>
                        )}
                        {cuenta.alias && (
                          <div>📝 Alias: <span className="font-mono">{cuenta.alias}</span></div>
                        )}
                        {cuenta.iban && (
                          <div>🇪🇺 IBAN: <span className="font-mono">{cuenta.iban}</span></div>
                        )}
                        {cuenta.numeroCuenta && (
                          <div>🏦 Cuenta: <span className="font-mono">{cuenta.numeroCuenta}</span></div>
                        )}
                      </div>

                      {cuenta._count?.pagos && cuenta._count.pagos > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          💳 {cuenta._count.pagos} pagos registrados
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!cuenta.predeterminada && cuenta.activa && (
                      <button
                        onClick={() => setPredeterminada(cuenta.id)}
                        className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors"
                        title="Establecer como predeterminada"
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleActiva(cuenta.id, cuenta.activa)}
                      className={`p-2 rounded-md transition-colors ${
                        cuenta.activa 
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      title={cuenta.activa ? 'Desactivar' : 'Activar'}
                    >
                      {cuenta.activa ? (
                        <XCircleIcon className="h-4 w-4" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    <Link
                      href={`/dashboard/cuentas-bancarias/${cuenta.id}/editar`}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => eliminarCuenta(cuenta.id, cuenta.nombre)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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

