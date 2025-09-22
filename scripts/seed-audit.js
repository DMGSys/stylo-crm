const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando registros de auditoría de ejemplo...')

  try {
    // Obtener un usuario para los registros
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMINISTRADOR' }
    })

    if (!admin) {
      console.log('No se encontró un usuario administrador. Ejecuta el script de inicialización primero.')
      return
    }

    // Obtener algunos clientes y citas para los registros
    const clientes = await prisma.cliente.findMany({ take: 2 })
    const citas = await prisma.cita.findMany({ take: 2 })

    // Crear registros de auditoría de ejemplo
    const registrosAuditoria = [
      {
        usuarioId: admin.id,
        accion: 'CREATE',
        entidad: 'Cliente',
        entidadId: clientes[0]?.id || 'cliente-ejemplo-1',
        datosAntes: null,
        datosDespues: JSON.stringify({
          nombre: 'María',
          apellido: 'González',
          telefono: '+56912345678',
          email: 'maria@email.com',
          tipoPelo: 'LISO'
        }),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        usuarioId: admin.id,
        accion: 'UPDATE',
        entidad: 'Cliente',
        entidadId: clientes[0]?.id || 'cliente-ejemplo-1',
        datosAntes: JSON.stringify({
          telefono: '+56912345678'
        }),
        datosDespues: JSON.stringify({
          telefono: '+56987654321'
        }),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        usuarioId: admin.id,
        accion: 'CREATE',
        entidad: 'Cita',
        entidadId: citas[0]?.id || 'cita-ejemplo-1',
        datosAntes: null,
        datosDespues: JSON.stringify({
          clienteId: clientes[0]?.id,
          fecha: new Date().toISOString(),
          hora: '10:00',
          servicio: 'Corte y peinado',
          precio: 15000,
          estado: 'PENDIENTE'
        }),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        usuarioId: admin.id,
        accion: 'UPDATE',
        entidad: 'Cita',
        entidadId: citas[0]?.id || 'cita-ejemplo-1',
        datosAntes: JSON.stringify({
          estado: 'PENDIENTE'
        }),
        datosDespues: JSON.stringify({
          estado: 'CONFIRMADA'
        }),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        usuarioId: admin.id,
        accion: 'UPDATE',
        entidad: 'Configuracion',
        entidadId: 'config-moneda',
        datosAntes: JSON.stringify({
          moneda_simbolo: '$',
          moneda_nombre: 'USD'
        }),
        datosDespues: JSON.stringify({
          moneda_simbolo: '€',
          moneda_nombre: 'EUR'
        }),
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        usuarioId: admin.id,
        accion: 'CREATE',
        entidad: 'User',
        entidadId: 'usuario-ejemplo',
        datosAntes: null,
        datosDespues: JSON.stringify({
          name: 'Carlos Estilista',
          email: 'carlos@salon.com',
          role: 'ESTILISTA'
        }),
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    ]

    // Crear los registros con fechas escalonadas
    for (let i = 0; i < registrosAuditoria.length; i++) {
      const registro = registrosAuditoria[i]
      const fecha = new Date()
      fecha.setHours(fecha.getHours() - (registrosAuditoria.length - i)) // Escalonar las fechas
      
      await prisma.auditLog.create({
        data: {
          ...registro,
          createdAt: fecha
        }
      })
      console.log(`✓ Registro de auditoría creado: ${registro.accion} ${registro.entidad}`)
    }

    console.log('\n✅ Registros de auditoría creados exitosamente!')
    console.log(`📊 Se crearon ${registrosAuditoria.length} registros de auditoría`)
    console.log('\n🔍 Ahora puedes ver los registros en /dashboard/auditoria')

  } catch (error) {
    console.error('❌ Error al crear registros de auditoría:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
