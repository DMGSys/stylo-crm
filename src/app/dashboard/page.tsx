'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface Stats {
  totalClientes: number
  citasHoy: number
  citasPendientes: number
  citasRealizadas: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClientes: 0,
    citasHoy: 0,
    citasPendientes: 0,
    citasRealizadas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [clientesRes, citasRes] = await Promise.all([
        fetch('/api/clientes?limit=1'),
        fetch('/api/citas?limit=1000')
      ])

      const clientesData = await clientesRes.json()
      const citasData = await citasRes.json()

      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const mañana = new Date(hoy)
      mañana.setDate(mañana.getDate() + 1)

      const citasHoy = citasData.citas?.filter((cita: any) => {
        const fechaCita = new Date(cita.fecha)
        return fechaCita >= hoy && fechaCita < mañana
      }).length || 0

      const citasPendientes = citasData.citas?.filter((cita: any) => 
        cita.estado === 'PENDIENTE'
      ).length || 0

      const citasRealizadas = citasData.citas?.filter((cita: any) => 
        cita.estado === 'REALIZADA'
      ).length || 0

      setStats({
        totalClientes: clientesData.pagination?.total || 0,
        citasHoy,
        citasPendientes,
        citasRealizadas
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
      // Datos de ejemplo si hay error
      setStats({
        totalClientes: 1,
        citasHoy: 0,
        citasPendientes: 1,
        citasRealizadas: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      name: 'Total Clientes',
      value: stats.totalClientes,
      icon: UsersIcon,
      href: '/dashboard/clientes',
      color: 'bg-blue-500'
    },
    {
      name: 'Citas Hoy',
      value: stats.citasHoy,
      icon: CalendarIcon,
      href: '/dashboard/agenda',
      color: 'bg-green-500'
    },
    {
      name: 'Pendientes',
      value: stats.citasPendientes,
      icon: ClockIcon,
      href: '/dashboard/agenda?estado=PENDIENTE',
      color: 'bg-yellow-500'
    },
    {
      name: 'Realizadas',
      value: stats.citasRealizadas,
      icon: ClockIcon,
      href: '/dashboard/agenda?estado=REALIZADA',
      color: 'bg-purple-500'
    }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, Administrador!
          </h1>
          <p className="text-gray-600">Bienvenido a tu panel de peluquería</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/clientes/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Link>
          <Link
            href="/dashboard/agenda/nueva"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Cita
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/clientes"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <UsersIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Ver Clientes</span>
            </Link>
            
            <Link
              href="/dashboard/agenda"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <CalendarIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Ver Agenda</span>
            </Link>
            
            <Link
              href="/dashboard/historial"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
            >
              <ClockIcon className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Ver Historial</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}