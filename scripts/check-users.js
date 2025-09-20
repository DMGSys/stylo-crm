const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Verificando usuarios en la base de datos...")

  try {
    const users = await prisma.user.findMany()
    
    console.log(`📊 Total de usuarios encontrados: ${users.length}`)
    
    if (users.length === 0) {
      console.log("❌ No hay usuarios en la base de datos")
      return
    }

    users.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Nombre: ${user.name || 'Sin nombre'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Rol: ${user.role}`)
      console.log(`   Activo: ${user.activo}`)
      console.log(`   Contraseña: ${user.password ? (user.password.startsWith('$2') ? 'Hasheada ✅' : 'Texto plano ⚠️') : 'Sin contraseña ❌'}`)
      console.log(`   Último acceso: ${user.ultimoAcceso || 'Nunca'}`)
      console.log(`   Creado: ${user.createdAt}`)
    })

    // Verificar credenciales específicas
    console.log("\n🔐 Verificando credenciales de prueba:")
    
    const admin = await prisma.user.findUnique({
      where: { email: "admin@peluqueria.com" }
    })
    
    if (admin) {
      console.log("✅ Usuario admin encontrado")
      console.log(`   Activo: ${admin.activo}`)
      console.log(`   Contraseña configurada: ${!!admin.password}`)
    } else {
      console.log("❌ Usuario admin NO encontrado")
    }

    const estilista = await prisma.user.findUnique({
      where: { email: "estilista@peluqueria.com" }
    })
    
    if (estilista) {
      console.log("✅ Usuario estilista encontrado")
      console.log(`   Activo: ${estilista.activo}`)
      console.log(`   Contraseña configurada: ${!!estilista.password}`)
    } else {
      console.log("❌ Usuario estilista NO encontrado")
    }

  } catch (error) {
    console.error("❌ Error al verificar usuarios:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
