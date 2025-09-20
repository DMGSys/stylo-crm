import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.activo) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar contraseña
    let isPasswordValid = false
    
    if (user.password) {
      // Si la contraseña está hasheada
      if (user.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, user.password)
      } else {
        // Si es contraseña en texto plano (legacy)
        isPasswordValid = password === user.password
        
        // Actualizar a hash si coincide
        if (isPasswordValid) {
          const hashedPassword = await bcrypt.hash(password, 10)
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          })
        }
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Actualizar último acceso
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { ultimoAcceso: new Date() }
      })
    } catch (updateError) {
      console.warn("Error actualizando último acceso:", updateError)
      // No fallar el login por esto
    }

    // Respuesta simple sin JWT
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
