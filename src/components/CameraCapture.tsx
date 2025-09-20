'use client'

import { useState, useRef, useCallback } from 'react'
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface CameraCaptureProps {
  onPhotoCapture: (photoDataUrl: string) => void
  onClose: () => void
  currentPhoto?: string
}

export default function CameraCapture({ onPhotoCapture, onClose, currentPhoto }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detectar si es dispositivo móvil
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Inicializar cámara
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Detener stream anterior si existe
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setError(
        err.name === 'NotAllowedError' 
          ? 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.'
          : err.name === 'NotFoundError'
          ? 'No se encontró cámara disponible.'
          : 'Error al acceder a la cámara. Intenta subir una foto desde galería.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [stream, facingMode])

  // Cambiar entre cámara frontal y trasera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhoto(photoDataUrl)
  }

  // Confirmar foto
  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto)
      cleanup()
      onClose()
    }
  }

  // Retomar foto
  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  // Subir desde galería
  const uploadFromGallery = () => {
    fileInputRef.current?.click()
  }

  // Manejar archivo seleccionado
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido.')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setCapturedPhoto(result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Limpiar recursos
  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  // Cerrar modal
  const handleClose = () => {
    cleanup()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {capturedPhoto ? 'Confirmar Foto' : 'Capturar Foto'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Vista previa de foto capturada */}
            {capturedPhoto ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedPhoto}
                    alt="Foto capturada"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Retomar
                  </button>
                  <button
                    onClick={confirmPhoto}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Video preview */}
                <div className="relative mb-4">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover rounded-lg bg-gray-900"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Controles */}
                <div className="space-y-3">
                  {/* Botones principales */}
                  <div className="flex space-x-3">
                    <button
                      onClick={uploadFromGallery}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <PhotoIcon className="h-4 w-4 mr-2" />
                      Galería
                    </button>
                    
                    {stream && (
                      <>
                        {isMobile() && (
                          <button
                            onClick={switchCamera}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            title="Cambiar cámara"
                          >
                            🔄
                          </button>
                        )}
                        
                        <button
                          onClick={capturePhoto}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <CameraIcon className="h-4 w-4 mr-2" />
                          Capturar
                        </button>
                      </>
                    )}
                  </div>

                  {/* Iniciar cámara si no está activa */}
                  {!stream && !isLoading && (
                    <button
                      onClick={startCamera}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Activar Cámara
                    </button>
                  )}

                  {/* Mostrar foto actual si existe */}
                  {currentPhoto && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-500 mb-2">Foto actual:</p>
                      <img
                        src={currentPhoto}
                        alt="Foto actual"
                        className="w-16 h-16 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Input oculto para galería */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
