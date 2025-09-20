'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthRequired } from '@/lib/auth'
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  TagIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CubeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, status, logout } = useAuthRequired()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['ADMINISTRADOR', 'ESTILISTA'] },
    { name: 'Clientes', href: '/dashboard/clientes', icon: UsersIcon, roles: ['ADMINISTRADOR', 'ESTILISTA'] },
    { name: 'Agenda', href: '/dashboard/agenda', icon: CalendarIcon, roles: ['ADMINISTRADOR', 'ESTILISTA'] },
    { name: 'Servicios', href: '/dashboard/servicios', icon: TagIcon, roles: ['ADMINISTRADOR', 'ESTILISTA'] },
    { name: 'Productos', href: '/dashboard/productos', icon: CubeIcon, roles: ['ADMINISTRADOR', 'ESTILISTA'] },
    { name: 'Usuarios', href: '/dashboard/usuarios', icon: UserGroupIcon, roles: ['ADMINISTRADOR'] },
    { name: 'Configuración', href: '/dashboard/configuracion', icon: CogIcon, roles: ['ADMINISTRADOR'] },
    { name: 'Auditoría', href: '/dashboard/auditoria', icon: DocumentTextIcon, roles: ['ADMINISTRADOR'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(session?.user?.role || '')
  )

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // useAuthRequired se encarga de la redirección
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">💇‍♀️</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Panel de Control
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Gestión del Salón
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 w-full border-t border-gray-200 bg-white">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {session.user?.name || session.user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user?.role}
                </p>
              </div>
              <button
                onClick={logout}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Branding de Stylo */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-center">
              <Image
                src="/logo/stylo-logo.png"
                alt="Stylo"
                width={16}
                height={16}
                className="mr-2"
              />
              <span className="text-xs text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Powered by <span style={{ color: '#C9A227', fontWeight: '600' }}>Stylo</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
