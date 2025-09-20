'use client'

import React from 'react'

interface CaracteristicasFisicas {
  tipoPelo: string
  largoPelo?: string
  colorOriginalPelo?: string
  colorActualPelo?: string
  texturaPelo?: string
  densidadPelo?: string
}

interface ClienteCaracteristicasProps {
  caracteristicas: CaracteristicasFisicas
  className?: string
}

export default function ClienteCaracteristicas({ caracteristicas, className = '' }: ClienteCaracteristicasProps) {
  
  const getTipoIcon = (tipo: string) => {
    const icons = {
      LISO: '🧑‍🦰',
      RIZADO: '👩‍🦱',
      ONDULADO: '🧑‍🦱',
      TEÑIDO: '👩‍🎤',
      MIXTO: '🧑‍🎨'
    }
    return icons[tipo as keyof typeof icons] || '👤'
  }

  const getLargoIcon = (largo: string) => {
    const icons = {
      RAPADO: '👨‍🦲',
      MUY_CORTO: '👦',
      CORTO: '🧑‍🦰',
      MEDIANO: '👩‍🦰',
      LARGO: '👩‍🦳',
      MUY_LARGO: '👸'
    }
    return icons[largo as keyof typeof icons] || '✂️'
  }

  const getColorBadge = (color: string) => {
    const colorMap: Record<string, string> = {
      'negro': '#000000',
      'castaño oscuro': '#4A2C2A',
      'castaño': '#8B4513',
      'castaño claro': '#CD853F',
      'rubio oscuro': '#B8860B',
      'rubio': '#FFD700',
      'rubio claro': '#FFF8DC',
      'pelirrojo': '#CD5C5C',
      'gris': '#808080',
      'blanco': '#F5F5F5',
      'otro': '#6B7280'
    }
    
    const bgColor = colorMap[color?.toLowerCase()] || '#6B7280'
    const textColor = ['negro', 'castaño oscuro', 'castaño'].includes(color?.toLowerCase()) ? 'white' : 'black'
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
        style={{ 
          backgroundColor: bgColor, 
          color: textColor,
          borderColor: bgColor === '#F5F5F5' ? '#D1D5DB' : bgColor
        }}
      >
        {color}
      </span>
    )
  }

  const getTexturaIcon = (textura: string) => {
    const icons = {
      'grueso': '🔵',
      'fino': '🔸',
      'normal': '🔹'
    }
    return icons[textura?.toLowerCase() as keyof typeof icons] || '🔹'
  }

  const getDensidadIcon = (densidad: string) => {
    const icons = {
      'poco': '📉',
      'normal': '📊',
      'abundante': '📈'
    }
    return icons[densidad?.toLowerCase() as keyof typeof icons] || '📊'
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <span className="text-blue-600 mr-2">💁‍♀️</span>
        Características del Cabello
      </h4>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Tipo de Pelo */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xs font-medium">Tipo</span>
            <span className="text-lg">{getTipoIcon(caracteristicas.tipoPelo)}</span>
          </div>
          <div className="mt-1 font-medium text-gray-900 capitalize">
            {caracteristicas.tipoPelo?.toLowerCase()}
          </div>
        </div>

        {/* Largo de Pelo */}
        {caracteristicas.largoPelo && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs font-medium">Largo</span>
              <span className="text-lg">{getLargoIcon(caracteristicas.largoPelo)}</span>
            </div>
            <div className="mt-1 font-medium text-gray-900 capitalize">
              {caracteristicas.largoPelo?.toLowerCase().replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Color Original */}
        {caracteristicas.colorOriginalPelo && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-gray-600 text-xs font-medium mb-2">Color Original</div>
            <div className="flex items-center space-x-2">
              {getColorBadge(caracteristicas.colorOriginalPelo)}
            </div>
          </div>
        )}

        {/* Color Actual */}
        {caracteristicas.colorActualPelo && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-gray-600 text-xs font-medium mb-2">Color Actual</div>
            <div className="flex items-center space-x-2">
              {getColorBadge(caracteristicas.colorActualPelo)}
            </div>
          </div>
        )}

        {/* Textura */}
        {caracteristicas.texturaPelo && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs font-medium">Textura</span>
              <span className="text-lg">{getTexturaIcon(caracteristicas.texturaPelo)}</span>
            </div>
            <div className="mt-1 font-medium text-gray-900 capitalize">
              {caracteristicas.texturaPelo}
            </div>
          </div>
        )}

        {/* Densidad */}
        {caracteristicas.densidadPelo && (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-xs font-medium">Densidad</span>
              <span className="text-lg">{getDensidadIcon(caracteristicas.densidadPelo)}</span>
            </div>
            <div className="mt-1 font-medium text-gray-900 capitalize">
              {caracteristicas.densidadPelo}
            </div>
          </div>
        )}
      </div>

      {/* Comparación de colores si son diferentes */}
      {caracteristicas.colorOriginalPelo && 
       caracteristicas.colorActualPelo && 
       caracteristicas.colorOriginalPelo !== caracteristicas.colorActualPelo && (
        <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center text-xs text-yellow-800">
            <span className="mr-2">🎨</span>
            <span className="font-medium">Cambio de color:</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Original:</span>
              {getColorBadge(caracteristicas.colorOriginalPelo)}
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">Actual:</span>
              {getColorBadge(caracteristicas.colorActualPelo)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
