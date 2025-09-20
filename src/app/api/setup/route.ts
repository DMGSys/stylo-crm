import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, role } = await request.json()

    if (action === 'check_users') {
      // Verificar usuarios existentes
      const users = await prisma.user.findMany()
      return NextResponse.json({ 
        count: users.length,
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          activo: u.activo
        }))
      })
    }

    if (action === 'create_user') {
      // Crear usuario individual
      if (!email || !password || !role) {
        return NextResponse.json(
          { error: "Email, contraseña y rol son requeridos" },
          { status: 400 }
        )
      }

      // Verificar si ya existe
      const existing = await prisma.user.findUnique({
        where: { email }
      })

      if (existing) {
        return NextResponse.json(
          { error: "El usuario ya existe" },
          { status: 409 }
        )
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          role,
          activo: true
        }
      })

      return NextResponse.json({
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    }

    if (action === 'create_default_users') {
      // Crear usuarios por defecto
      const results = []

      // Admin
      try {
        const adminExists = await prisma.user.findUnique({
          where: { email: "admin@peluqueria.com" }
        })

        if (!adminExists) {
          const hashedAdminPassword = await bcrypt.hash("admin123", 10)
          const admin = await prisma.user.create({
            data: {
              email: "admin@peluqueria.com",
              password: hashedAdminPassword,
              name: "Administrador",
              role: "ADMINISTRADOR",
              activo: true
            }
          })
          results.push({ email: admin.email, status: "created" })
        } else {
          results.push({ email: adminExists.email, status: "exists" })
        }
      } catch (error) {
        results.push({ email: "admin@peluqueria.com", status: "error", error: error.message })
      }

      // Estilista
      try {
        const estilistaExists = await prisma.user.findUnique({
          where: { email: "estilista@peluqueria.com" }
        })

        if (!estilistaExists) {
          const hashedEstilistaPassword = await bcrypt.hash("estilista123", 10)
          const estilista = await prisma.user.create({
            data: {
              email: "estilista@peluqueria.com",
              password: hashedEstilistaPassword,
              name: "Ana Estilista",
              role: "ESTILISTA",
              activo: true
            }
          })
          results.push({ email: estilista.email, status: "created" })
        } else {
          results.push({ email: estilistaExists.email, status: "exists" })
        }
      } catch (error) {
        results.push({ email: "estilista@peluqueria.com", status: "error", error: error.message })
      }

      return NextResponse.json({ results })
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error en setup:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}
