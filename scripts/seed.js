const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...")

  try {
    // Buscar usuario administrador existente
    let admin = await prisma.user.findUnique({
      where: { email: "admin@peluqueria.com" }
    })
    
    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      admin = await prisma.user.create({
        data: {
          name: "Administrador",
          email: "admin@peluqueria.com",
          password: hashedPassword,
          role: "ADMINISTRADOR",
          activo: true
        }
      })
      console.log("✅ Usuario administrador creado:", admin.email)
    } else {
      console.log("⏭️  Usuario administrador ya existe:", admin.email)
    }

    // Crear cliente 1
    const cliente1 = await prisma.cliente.create({
      data: {
        nombre: "María",
        apellido: "García",
        telefono: "+34 666 123 456",
        email: "maria.garcia@email.com",
        tipoPelo: "RIZADO",
        notas: "Cliente desde hace 2 años. Prefiere cortes modernos."
      }
    })
    console.log("✅ Cliente 1 creado:", cliente1.nombre)

    // Crear cliente 2
    const cliente2 = await prisma.cliente.create({
      data: {
        nombre: "Carlos",
        apellido: "López",
        telefono: "+34 666 789 012",
        email: "carlos.lopez@email.com",
        tipoPelo: "LISO",
        notas: "Nuevo cliente. Interesado en tintes."
      }
    })
    console.log("✅ Cliente 2 creado:", cliente2.nombre)

    // Crear cliente 3
    const cliente3 = await prisma.cliente.create({
      data: {
        nombre: "Ana",
        apellido: "Martín",
        telefono: "+34 666 345 678",
        email: "ana.martin@email.com",
        tipoPelo: "ONDULADO",
        notas: "Cliente frecuente. Le gustan los mechones."
      }
    })
    console.log("✅ Cliente 3 creado:", cliente3.nombre)

    // Crear cita 1
    const cita1 = await prisma.cita.create({
      data: {
        clienteId: cliente1.id,
        usuarioId: admin.id,
        fecha: new Date("2025-01-21T10:00:00Z"),
        hora: "10:00",
        estado: "CONFIRMADA",
        servicio: "Corte y peinado",
        precio: 25.00,
        notas: "Cita confirmada por WhatsApp"
      }
    })
    console.log("✅ Cita 1 creada:", cita1.servicio)

    // Crear cita 2
    const cita2 = await prisma.cita.create({
      data: {
        clienteId: cliente2.id,
        usuarioId: admin.id,
        fecha: new Date("2025-01-21T11:30:00Z"),
        hora: "11:30",
        estado: "PENDIENTE",
        servicio: "Tinte completo",
        precio: 45.00,
        notas: "Primera vez con tinte"
      }
    })
    console.log("✅ Cita 2 creada:", cita2.servicio)

    // Crear cita 3
    const cita3 = await prisma.cita.create({
      data: {
        clienteId: cliente3.id,
        usuarioId: admin.id,
        fecha: new Date("2025-01-22T15:00:00Z"),
        hora: "15:00",
        estado: "PENDIENTE",
        servicio: "Mechones y corte",
        precio: 60.00,
        notas: "Mechones rubios"
      }
    })
    console.log("✅ Cita 3 creada:", cita3.servicio)

    console.log("🎉 Seed completado exitosamente!")
    console.log(`📊 Resumen:`)
    console.log(`   - 1 usuario administrador`)
    console.log(`   - 3 clientes`)
    console.log(`   - 3 citas`)

  } catch (error) {
    console.error("❌ Error durante el seed:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
