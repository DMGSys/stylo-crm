const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando datos de ejemplo para el historial...')

  try {
    // Obtener algunos clientes existentes
    const clientes = await prisma.cliente.findMany({
      take: 3
    })

    // Obtener el usuario administrador
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMINISTRADOR' }
    })

    // Obtener algunas citas existentes
    const citas = await prisma.cita.findMany({
      take: 2
    })

    if (clientes.length === 0) {
      console.log('No se encontraron clientes. Ejecuta el script de inicialización primero.')
      return
    }

    // Crear registros de historial de ejemplo
    const registrosHistorial = [
      {
        clienteId: clientes[0]?.id,
        tipoRegistro: 'SERVICIO',
        titulo: 'Corte y peinado realizado',
        descripcion: 'Se realizó corte en capas y peinado con ondas naturales. Cliente muy satisfecha con el resultado.',
        usuarioId: admin?.id,
        citaId: citas[0]?.id
      },
      {
        clienteId: clientes[0]?.id,
        tipoRegistro: 'CAMBIO_FISICO',
        titulo: 'Cambio de color de cabello',
        descripcion: 'Cambio de castaño natural a rubio ceniza. Proceso de decoloración y tonalización.',
        datosAntes: {
          colorOriginalPelo: 'Castaño natural',
          colorActualPelo: 'Castaño natural',
          largoPelo: 'LARGO'
        },
        datosDespues: {
          colorOriginalPelo: 'Castaño natural',
          colorActualPelo: 'Rubio ceniza',
          largoPelo: 'MEDIANO'
        },
        usuarioId: admin?.id
      },
      {
        clienteId: clientes[1]?.id,
        tipoRegistro: 'NOTA',
        titulo: 'Preferencias del cliente',
        descripcion: 'Al cliente le gusta el corte corto pero no demasiado. Prefiere productos sin sulfatos. Tiene cuero cabelludo sensible.',
        usuarioId: admin?.id
      },
      {
        clienteId: clientes[1]?.id,
        tipoRegistro: 'FOTO',
        titulo: 'Foto antes del servicio',
        descripcion: 'Foto tomada antes de realizar el tratamiento capilar.',
        fotos: 'antes_tratamiento_001.jpg',
        usuarioId: admin?.id,
        citaId: citas[1]?.id
      },
      {
        clienteId: clientes[2]?.id,
        tipoRegistro: 'SERVICIO',
        titulo: 'Tratamiento de hidratación',
        descripcion: 'Aplicación de mascarilla hidratante profunda. Cabello muy dañado por tintes anteriores.',
        usuarioId: admin?.id
      },
      {
        clienteId: clientes[2]?.id,
        tipoRegistro: 'CAMBIO_FISICO',
        titulo: 'Cambio de largo',
        descripcion: 'Corte significativo para eliminar puntas dañadas y dar nueva forma.',
        datosAntes: {
          largoPelo: 'MUY_LARGO',
          estadoCabello: 'Dañado, puntas abiertas'
        },
        datosDespues: {
          largoPelo: 'MEDIANO',
          estadoCabello: 'Saludable, hidratado'
        },
        usuarioId: admin?.id
      }
    ]

    // Crear los registros
    for (const registro of registrosHistorial) {
      if (registro.clienteId) {
        await prisma.historialCliente.create({
          data: registro
        })
        console.log(`✓ Registro creado: ${registro.titulo}`)
      }
    }

    console.log('\n✅ Datos de historial creados exitosamente!')
    console.log(`📝 Se crearon ${registrosHistorial.filter(r => r.clienteId).length} registros de historial`)

  } catch (error) {
    console.error('❌ Error al crear datos de historial:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
