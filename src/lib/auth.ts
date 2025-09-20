import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  role: string
}

// Hook para proteger páginas que requieren autenticación
export function useAuthRequired() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Verificar si hay usuario en localStorage
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } else {
        // No hay usuario, redirigir al login
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('user')
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error en logout:', error)
      localStorage.removeItem('user')
      router.push('/auth/signin')
    }
  }

  return { 
    session: user ? { user } : null, 
    status: loading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
    isAuthenticated: !!user,
    logout
  }
}

// Hook para proteger páginas que requieren rol específico
export function useRoleRequired(requiredRole: string | string[]) {
  const { session, status, logout } = useAuthRequired()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Aún cargando

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(session.user?.role || '')) {
      router.push('/dashboard?error=unauthorized')
    }
  }, [session, status, router, requiredRole])

  return { 
    session, 
    status, 
    isAuthenticated: !!session,
    hasRole: session?.user?.role && (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).includes(session.user.role),
    logout
  }
}

// Función para verificar permisos
export function hasPermission(userRole: string, action: string, resource: string): boolean {
  const permissions = {
    ADMINISTRADOR: {
      clientes: ['create', 'read', 'update', 'delete'],
      citas: ['create', 'read', 'update', 'delete'],
      usuarios: ['create', 'read', 'update', 'delete'],
      configuracion: ['read', 'update'],
      auditoria: ['read']
    },
    ESTILISTA: {
      clientes: ['create', 'read', 'update'],
      citas: ['create', 'read', 'update'],
      usuarios: [],
      configuracion: ['read'],
      auditoria: []
    }
  }

  const userPermissions = permissions[userRole as keyof typeof permissions]
  if (!userPermissions) return false

  const resourcePermissions = userPermissions[resource as keyof typeof userPermissions]
  if (!resourcePermissions) return false

  return resourcePermissions.includes(action)
}
