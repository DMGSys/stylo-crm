const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando datos de ejemplo para el sistema de pagos...')

  try {
    // Obtener citas realizadas sin pago
    const citasRealizadas = await prisma.cita.findMany({
      where: {
        estado: 'REALIZADA'
      },
      include: {
        cliente: true,
        pago: true
      },
      take: 3
    })

    // Obtener el usuario administrador
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMINISTRADOR' }
    })

    if (citasRealizadas.length === 0) {
      console.log('No se encontraron citas realizadas. Creando algunas citas de ejemplo...')
      
      // Crear algunas citas realizadas de ejemplo
      const clientes = await prisma.cliente.findMany({ take: 2 })
      
      if (clientes.length > 0) {
        const hoy = new Date()
        
        await prisma.cita.create({
          data: {
            clienteId: clientes[0].id,
            usuarioId: admin?.id,
            fecha: hoy,
            hora: '10:00',
            servicio: 'Corte y peinado',
            precio: 25.00,
            estado: 'REALIZADA'
          }
        })

        await prisma.cita.create({
          data: {
            clienteId: clientes[1]?.id || clientes[0].id,
            usuarioId: admin?.id,
            fecha: hoy,
            hora: '14:30',
            servicio: 'Tinte y corte',
            precio: 45.00,
            estado: 'REALIZADA'
          }
        })

        console.log('✓ Citas realizadas de ejemplo creadas')
        
        // Volver a obtener las citas
        const nuevasCitas = await prisma.cita.findMany({
          where: { estado: 'REALIZADA' },
          include: { cliente: true },
          take: 2
        })
        
        citasRealizadas.push(...nuevasCitas)
      }
    }

    // Crear pagos de ejemplo
    const pagosEjemplo = [
      {
        citaId: citasRealizadas[0]?.id,
        clienteId: citasRealizadas[0]?.clienteId,
        usuarioId: admin?.id,
        monto: 25.00,
        montoServicio: 25.00,
        propina: 0,
        descuento: 0,
        metodoPago: 'EFECTIVO',
        estadoPago: 'COMPLETADO',
        notas: 'Pago en efectivo, sin propina'
      },
      {
        citaId: citasRealizadas[1]?.id,
        clienteId: citasRealizadas[1]?.clienteId,
        usuarioId: admin?.id,
        monto: 50.00,
        montoServicio: 45.00,
        propina: 5.00,
        descuento: 0,
        metodoPago: 'TARJETA_CREDITO',
        estadoPago: 'COMPLETADO',
        referencia: 'TXN123456789',
        notas: 'Pago con tarjeta, cliente dejó propina'
      },
      {
        citaId: citasRealizadas[2]?.id,
        clienteId: citasRealizadas[2]?.clienteId,
        usuarioId: admin?.id,
        monto: 35.00,
        montoServicio: 40.00,
        propina: 0,
        descuento: 5.00,
        metodoPago: 'TRANSFERENCIA',
        estadoPago: 'COMPLETADO',
        referencia: 'REF987654321',
        notas: 'Descuento por cliente frecuente'
      }
    ]

    // Crear los pagos
    let pagosCreados = 0
    for (const pagoData of pagosEjemplo) {
      if (pagoData.citaId) {
        try {
          // Verificar que no existe ya un pago para esta cita
          const pagoExistente = await prisma.pago.findUnique({
            where: { citaId: pagoData.citaId }
          })

          if (!pagoExistente) {
            const pago = await prisma.pago.create({
              data: pagoData
            })

            // Crear movimiento de caja correspondiente
            await prisma.movimientoCaja.create({
              data: {
                tipo: 'INGRESO_SERVICIO',
                concepto: `Pago de servicio - ${citasRealizadas.find(c => c.id === pagoData.citaId)?.servicio || 'Servicio'}`,
                monto: pagoData.monto,
                metodoPago: pagoData.metodoPago,
                pagoId: pago.id,
                usuarioId: admin?.id
              }
            })

            console.log(`✓ Pago creado: ${pagoData.metodoPago} - $${pagoData.monto}`)
            pagosCreados++
          }
        } catch (error) {
          console.error(`Error al crear pago para cita ${pagoData.citaId}:`, error)
        }
      }
    }

    // Crear algunos movimientos de caja adicionales (gastos)
    const gastosEjemplo = [
      {
        tipo: 'EGRESO_GASTO',
        concepto: 'Compra de productos de peluquería',
        monto: -150.00,
        metodoPago: 'EFECTIVO',
        usuarioId: admin?.id
      },
      {
        tipo: 'EGRESO_GASTO',
        concepto: 'Pago de servicios (electricidad)',
        monto: -80.00,
        metodoPago: 'TRANSFERENCIA',
        usuarioId: admin?.id
      }
    ]

    for (const gasto of gastosEjemplo) {
      await prisma.movimientoCaja.create({
        data: gasto
      })
      console.log(`✓ Gasto registrado: ${gasto.concepto} - $${Math.abs(gasto.monto)}`)
    }

    console.log('\n✅ Sistema de pagos inicializado exitosamente!')
    console.log(`💰 Se crearon ${pagosCreados} pagos de ejemplo`)
    console.log(`📊 Se crearon ${gastosEjemplo.length} movimientos de caja`)
    console.log('\n💳 Ahora puedes ver los cobros en /dashboard/cobros')

  } catch (error) {
    console.error('❌ Error al crear datos de pagos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
