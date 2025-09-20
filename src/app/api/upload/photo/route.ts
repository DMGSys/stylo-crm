import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { photoDataUrl, clienteId, type = 'cliente' } = body

    if (!photoDataUrl) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      )
    }

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      )
    }

    // Validar que sea una imagen válida
    if (!photoDataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagen inválido' },
        { status: 400 }
      )
    }

    // Extraer datos de la imagen
    const matches = photoDataUrl.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        { error: 'Formato de imagen inválido' },
        { status: 400 }
      )
    }

    const imageType = matches[1]
    const imageData = matches[2]
    
    // Validar tipo de imagen
    const allowedTypes = ['jpeg', 'jpg', 'png', 'webp']
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Tipo de imagen no soportado. Use JPEG, PNG o WebP' },
        { status: 400 }
      )
    }

    // Convertir base64 a buffer
    const buffer = Buffer.from(imageData, 'base64')
    
    // Validar tamaño (máximo 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Imagen muy grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', type)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileName = `${clienteId}_${timestamp}_${randomString}.${imageType}`
    const filePath = join(uploadsDir, fileName)

    // Guardar archivo
    await writeFile(filePath, buffer)

    // Crear URL pública
    const publicUrl = `/uploads/${type}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: buffer.length,
      type: imageType
    })

  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Método para eliminar fotos (opcional)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    const type = searchParams.get('type') || 'cliente'

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nombre de archivo requerido' },
        { status: 400 }
      )
    }

    const filePath = join(process.cwd(), 'public', 'uploads', type, fileName)
    
    // Verificar si el archivo existe antes de intentar eliminarlo
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
      
      return NextResponse.json({
        success: true,
        message: 'Archivo eliminado correctamente'
      })
    } else {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
