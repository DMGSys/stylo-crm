const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function createUserSafe(userData) {
  try {
    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    
    if (existing) {
      console.log(`⏭️  Usuario ya existe: ${userData.email}`)
      return existing
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: userData
    })
    
    console.log(`✅ Usuario creado: ${user.email} (${user.role})`)
    return user
  } catch (error) {
    console.error(`❌ Error creando usuario ${userData.email}:`, error.message)
    return null
  }
}

async function main() {
  console.log("👥 Creando usuarios del sistema...")

  try {
    // Crear usuario administrador
    const hashedAdminPassword = await bcrypt.hash("admin123", 10)
    const admin = await createUserSafe({
      name: "Administrador",
      email: "admin@peluqueria.com",
      password: hashedAdminPassword,
      role: "ADMINISTRADOR",
      activo: true
    })

    // Crear usuario estilista
    const hashedEstilistaPassword = await bcrypt.hash("estilista123", 10)
    const estilista = await createUserSafe({
      name: "Ana Estilista",
      email: "estilista@peluqueria.com", 
      password: hashedEstilistaPassword,
      role: "ESTILISTA",
      activo: true
    })

    console.log("\n🎉 Proceso completado!")
    console.log("🔐 Credenciales de acceso:")
    console.log("   Admin: admin@peluqueria.com / admin123")
    console.log("   Estilista: estilista@peluqueria.com / estilista123")

  } catch (error) {
    console.error("❌ Error general:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
