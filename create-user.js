const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando usuario administrador...')
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@peluqueria.com',
        password: hashedPassword,
        role: 'ADMINISTRADOR'
      }
    })
    
    console.log('✅ Usuario creado:', user.email)
    console.log('🔑 Contraseña: admin123')
    
    // Crear cliente de ejemplo
    const cliente = await prisma.cliente.create({
      data: {
        nombre: 'María',
        apellido: 'González',
        telefono: '+56912345678',
        email: 'maria@email.com',
        tipoPelo: 'LISO',
        notas: 'Cliente preferido'
      }
    })
    
    console.log('✅ Cliente creado:', cliente.nombre, cliente.apellido)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
