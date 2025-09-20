const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🔐 Actualizando contraseñas de usuarios existentes...")

  try {
    // Buscar usuarios con contraseñas sin hashear
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { password: "admin123" },
          { password: "estilista123" }
        ]
      }
    })

    for (const user of users) {
      let newPassword = user.password
      
      if (user.password === "admin123") {
        newPassword = await bcrypt.hash("admin123", 10)
      } else if (user.password === "estilista123") {
        newPassword = await bcrypt.hash("estilista123", 10)
      }

      if (newPassword !== user.password) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            password: newPassword,
            activo: true
          }
        })
        console.log(`✅ Contraseña actualizada para: ${user.email}`)
      }
    }

    console.log("🎉 Actualización de contraseñas completada!")

  } catch (error) {
    console.error("❌ Error al actualizar contraseñas:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
