const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("👩‍🎨 Creando usuario estilista...")

  try {
    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: "estilista@peluqueria.com" }
    })

    if (existingUser) {
      console.log("⏭️  El usuario estilista ya existe")
      return
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash("estilista123", 10)

    // Crear usuario estilista
    const estilista = await prisma.user.create({
      data: {
        name: "Ana Estilista",
        email: "estilista@peluqueria.com",
        password: hashedPassword,
        role: "ESTILISTA",
        activo: true
      }
    })

    console.log("✅ Usuario estilista creado:", estilista.email)
    console.log("🔑 Contraseña: estilista123")
    console.log("👤 Rol: ESTILISTA")

  } catch (error) {
    console.error("❌ Error al crear estilista:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
