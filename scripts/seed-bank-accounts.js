const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Creando cuentas bancarias de ejemplo...')

  try {
    // Cuentas bancarias de ejemplo
    const cuentasEjemplo = [
      {
        nombre: 'Cuenta Principal Santander',
        banco: 'Banco Santander',
        titular: 'Peluquería Elegance S.L.',
        tipoCuenta: 'EMPRESARIAL',
        cvu: '0000003100010000000001',
        cbu: '0720001540000001234567',
        alias: 'SALON.ELEGANCE.PRINCIPAL',
        moneda: 'ARS',
        predeterminada: true,
        notas: 'Cuenta principal para recibir pagos de clientes'
      },
      {
        nombre: 'Cuenta Ahorro BBVA',
        banco: 'BBVA Argentina',
        titular: 'María González',
        tipoCuenta: 'AHORRO',
        cvu: '0000007000010000000002',
        cbu: '0170001540000009876543',
        alias: 'SALON.BELLEZA.AHORRO',
        moneda: 'ARS',
        predeterminada: false,
        notas: 'Cuenta de ahorro para reservas'
      },
      {
        nombre: 'Cuenta EUR Santander',
        banco: 'Banco Santander España',
        titular: 'Salon Elegance Europe',
        tipoCuenta: 'CORRIENTE',
        iban: 'ES91 2100 0418 4502 0005 1332',
        numeroCuenta: '4502000513320',
        codigoSwift: 'BSCHESMMXXX',
        moneda: 'EUR',
        predeterminada: false,
        notas: 'Cuenta para clientes europeos'
      },
      {
        nombre: 'Cuenta USD Chase',
        banco: 'Chase Bank',
        titular: 'Salon Elegance USA LLC',
        tipoCuenta: 'EMPRESARIAL',
        numeroCuenta: '1234567890123456',
        codigoSwift: 'CHASUS33XXX',
        moneda: 'USD',
        predeterminada: false,
        notas: 'Cuenta para clientes internacionales'
      }
    ]

    let cuentasCreadas = 0
    for (const cuentaData of cuentasEjemplo) {
      try {
        const cuenta = await prisma.cuentaBancaria.create({
          data: cuentaData
        })
        console.log(`✓ Cuenta creada: ${cuenta.nombre} (${cuenta.banco})`)
        cuentasCreadas++
      } catch (error) {
        console.error(`Error al crear cuenta ${cuentaData.nombre}:`, error)
      }
    }

    console.log('\n✅ Cuentas bancarias creadas exitosamente!')
    console.log(`🏦 Se crearon ${cuentasCreadas} cuentas bancarias`)
    console.log('\n📋 Resumen de cuentas:')
    console.log('• Cuenta Principal Santander (ARS) - Predeterminada ⭐')
    console.log('• Cuenta Ahorro BBVA (ARS)')
    console.log('• Cuenta EUR Santander (EUR)')
    console.log('• Cuenta USD Chase (USD)')
    console.log('\n💳 Ahora puedes gestionar las cuentas en /dashboard/cuentas-bancarias')

  } catch (error) {
    console.error('❌ Error al crear cuentas bancarias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

