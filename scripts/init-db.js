const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Inicializando base de datos...')

  try {
    // Crear usuario administrador por defecto
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@peluqueria.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@peluqueria.com',
        password: hashedPassword,
        role: 'ADMINISTRADOR'
      }
    })

    console.log('Usuario administrador creado:', adminUser.email)

    // Crear algunos datos de ejemplo
    const cliente1 = await prisma.cliente.upsert({
      where: { id: 'cliente-ejemplo-1' },
      update: {},
      create: {
        id: 'cliente-ejemplo-1',
        nombre: 'María',
        apellido: 'González',
        telefono: '+56912345678',
        email: 'maria@email.com',
        tipoPelo: 'LISO',
        notas: 'Cliente preferido. Le gusta el corte clásico.'
      }
    })

    const cliente2 = await prisma.cliente.upsert({
      where: { id: 'cliente-ejemplo-2' },
      update: {},
      create: {
        id: 'cliente-ejemplo-2',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        telefono: '+56987654321',
        email: 'carlos@email.com',
        tipoPelo: 'RIZADO',
        notas: 'Nuevo cliente. Interesado en tratamientos capilares.'
      }
    })

    console.log('Clientes de ejemplo creados')

    // Crear citas de ejemplo
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    await prisma.cita.create({
      data: {
        clienteId: cliente1.id,
        usuarioId: adminUser.id,
        fecha: tomorrow,
        hora: '10:00',
        servicio: 'Corte y peinado',
        precio: 15000,
        estado: 'CONFIRMADA',
        notas: 'Cita confirmada por WhatsApp'
      }
    })

    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)

    await prisma.cita.create({
      data: {
        clienteId: cliente2.id,
        usuarioId: adminUser.id,
        fecha: dayAfter,
        hora: '14:30',
        servicio: 'Tratamiento capilar',
        precio: 25000,
        estado: 'PENDIENTE',
        notas: 'Primera consulta'
      }
    })

    console.log('Citas de ejemplo creadas')
    console.log('Base de datos inicializada correctamente!')
    console.log('\nCredenciales de acceso:')
    console.log('Email: admin@peluqueria.com')
    console.log('Contraseña: admin123')

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
