import { useState, useEffect } from 'react'

export interface ConfiguracionMoneda {
  simbolo: string
  nombre: string
  posicion: 'before' | 'after'
  decimales: number
}

export interface ConfiguracionNegocio {
  nombre: string
  telefono: string
  direccion: string
  horario_apertura: string
  horario_cierre: string
}

export interface Configuraciones {
  moneda: ConfiguracionMoneda
  negocio: ConfiguracionNegocio
}

// Cache para las configuraciones
let configCache: Configuraciones | null = null
let configCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Función para obtener configuraciones del servidor o localStorage
export async function fetchConfiguraciones(): Promise<Configuraciones> {
  // Usar cache si está disponible y no ha expirado
  if (configCache && Date.now() - configCacheTime < CACHE_DURATION) {
    return configCache
  }

  try {
    const response = await fetch('/api/configuracion')
    if (!response.ok) {
      throw new Error('Error al obtener configuraciones')
    }
    
    const data = await response.json()
    
    // Si la respuesta está vacía, usar localStorage
    if (Object.keys(data).length === 0) {
      return getConfigFromLocalStorage()
    }
    
    // Transformar los datos a la estructura esperada
    const config: Configuraciones = {
      moneda: {
        simbolo: data.moneda_simbolo || '€',
        nombre: data.moneda_nombre || 'EUR',
        posicion: data.moneda_posicion || 'after',
        decimales: parseInt(data.moneda_decimales || '2')
      },
      negocio: {
        nombre: data.negocio_nombre || 'Peluquería Elegance',
        telefono: data.negocio_telefono || '+34 666 123 456',
        direccion: data.negocio_direccion || 'Calle Principal 123, Madrid',
        horario_apertura: data.horario_apertura || '09:00',
        horario_cierre: data.horario_cierre || '20:00'
      }
    }

    // Actualizar cache
    configCache = config
    configCacheTime = Date.now()
    
    return config
  } catch (error) {
    console.error('Error al cargar configuraciones desde servidor, usando localStorage:', error)
    return getConfigFromLocalStorage()
  }
}

// Función para obtener configuración desde localStorage
function getConfigFromLocalStorage(): Configuraciones {
  if (typeof window === 'undefined') {
    return getDefaultConfig()
  }

  try {
    const saved = localStorage.getItem('peluqueria_config')
    if (saved) {
      const config = JSON.parse(saved)
      // Actualizar cache
      configCache = config
      configCacheTime = Date.now()
      return config
    }
  } catch (error) {
    console.error('Error al leer localStorage:', error)
  }
  
  return getDefaultConfig()
}

// Función para guardar configuración en localStorage
export function saveConfigToLocalStorage(config: Configuraciones) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('peluqueria_config', JSON.stringify(config))
    // Actualizar cache
    configCache = config
    configCacheTime = Date.now()
  } catch (error) {
    console.error('Error al guardar en localStorage:', error)
  }
}

// Configuración por defecto
function getDefaultConfig(): Configuraciones {
  const defaultConfig: Configuraciones = {
    moneda: {
      simbolo: '€',
      nombre: 'EUR',
      posicion: 'after',
      decimales: 2
    },
    negocio: {
      nombre: 'Peluquería Elegance',
      telefono: '+34 666 123 456',
      direccion: 'Calle Principal 123, Madrid',
      horario_apertura: '09:00',
      horario_cierre: '20:00'
    }
  }
  
  // Guardar en localStorage si no existe
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('peluqueria_config')
    if (!saved) {
      saveConfigToLocalStorage(defaultConfig)
    }
  }
  
  return defaultConfig
}

// Hook para usar configuraciones en componentes
export function useConfiguraciones() {
  const [config, setConfig] = useState<Configuraciones | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfiguraciones()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  return { config, loading, refetch: () => fetchConfiguraciones().then(setConfig) }
}

// Función para formatear precios según la configuración
export function formatPrice(
  precio: number, 
  configuracion?: ConfiguracionMoneda
): string {
  const config = configuracion || {
    simbolo: '€',
    posicion: 'after',
    decimales: 2
  }

  const precioFormateado = precio.toFixed(config.decimales)
  
  if (config.posicion === 'before') {
    return `${config.simbolo}${precioFormateado}`
  } else {
    return `${precioFormateado}${config.simbolo}`
  }
}

// Hook específico para formateo de precios
export function usePriceFormatter() {
  const { config } = useConfiguraciones()
  
  const formatPrice = (precio: number): string => {
    if (!config) {
      return `${precio.toFixed(2)}€` // Fallback
    }
    
    const precioFormateado = precio.toFixed(config.moneda.decimales)
    
    if (config.moneda.posicion === 'before') {
      return `${config.moneda.simbolo}${precioFormateado}`
    } else {
      return `${precioFormateado}${config.moneda.simbolo}`
    }
  }
  
  return { formatPrice, config }
}

// Función para limpiar el cache (útil después de actualizar configuraciones)
export function clearConfigCache() {
  configCache = null
  configCacheTime = 0
}
