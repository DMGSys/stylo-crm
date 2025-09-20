const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  console.log("💇‍♀️ Creando servicios y productos de peluquería...")

  try {
    // Crear categorías
    const categoriaServicios = await prisma.categoria.create({
      data: {
        nombre: "Servicios de Peluquería",
        descripcion: "Servicios principales de corte, peinado y tratamientos",
        color: "#3B82F6",
        icono: "💇‍♀️"
      }
    })

    const categoriaColoracion = await prisma.categoria.create({
      data: {
        nombre: "Coloración y Tintes",
        descripcion: "Servicios de coloración, mechas y tratamientos de color",
        color: "#8B5CF6",
        icono: "🎨"
      }
    })

    const categoriaTratamientos = await prisma.categoria.create({
      data: {
        nombre: "Tratamientos Capilares",
        descripcion: "Tratamientos de hidratación, reparación y cuidado",
        color: "#10B981",
        icono: "✨"
      }
    })

    const categoriaProductos = await prisma.categoria.create({
      data: {
        nombre: "Productos y Insumos",
        descripcion: "Shampoos, acondicionadores, tintes y herramientas",
        color: "#F59E0B",
        icono: "🧴"
      }
    })

    console.log("✅ Categorías creadas")

    // Crear servicios
    const servicios = [
      {
        nombre: "Corte Clásico",
        descripcion: "Corte de cabello tradicional para hombre o mujer",
        categoriaId: categoriaServicios.id,
        precioBase: 20.00,
        precioVenta: 25.00,
        duracionMinutos: 30
      },
      {
        nombre: "Corte y Peinado",
        descripcion: "Corte de cabello con peinado incluido",
        categoriaId: categoriaServicios.id,
        precioBase: 25.00,
        precioVenta: 35.00,
        duracionMinutos: 45
      },
      {
        nombre: "Lavado y Secado",
        descripcion: "Lavado con shampoo y secado profesional",
        categoriaId: categoriaServicios.id,
        precioBase: 10.00,
        precioVenta: 15.00,
        duracionMinutos: 20,
        requiereProductos: true
      },
      {
        nombre: "Tinte Completo",
        descripcion: "Coloración completa del cabello",
        categoriaId: categoriaColoracion.id,
        precioBase: 35.00,
        precioVenta: 50.00,
        duracionMinutos: 120,
        requiereProductos: true
      },
      {
        nombre: "Mechas",
        descripcion: "Mechas o reflejos en el cabello",
        categoriaId: categoriaColoracion.id,
        precioBase: 40.00,
        precioVenta: 60.00,
        duracionMinutos: 90,
        requiereProductos: true
      },
      {
        nombre: "Tratamiento Hidratante",
        descripcion: "Mascarilla hidratante para cabello seco",
        categoriaId: categoriaTratamientos.id,
        precioBase: 15.00,
        precioVenta: 25.00,
        duracionMinutos: 45,
        requiereProductos: true
      },
      {
        nombre: "Alisado Brasileño",
        descripcion: "Tratamiento de alisado permanente",
        categoriaId: categoriaTratamientos.id,
        precioBase: 80.00,
        precioVenta: 120.00,
        duracionMinutos: 180,
        requiereProductos: true
      }
    ]

    for (const servicioData of servicios) {
      await prisma.servicio.create({ data: servicioData })
    }

    console.log("✅ Servicios creados")

    // Crear productos
    const productos = [
      {
        nombre: "Shampoo Hidratante",
        descripcion: "Shampoo para cabello seco y dañado",
        categoriaId: categoriaProductos.id,
        marca: "L'Oréal",
        codigo: "SH001",
        precioCosto: 8.50,
        precioVenta: 15.00,
        stock: 25,
        stockMinimo: 5,
        unidadMedida: "ml",
        proveedor: "Distribuidora Beauty"
      },
      {
        nombre: "Acondicionador Reparador",
        descripcion: "Acondicionador para cabello dañado",
        categoriaId: categoriaProductos.id,
        marca: "L'Oréal",
        codigo: "AC001",
        precioCosto: 9.00,
        precioVenta: 16.00,
        stock: 20,
        stockMinimo: 5,
        unidadMedida: "ml",
        proveedor: "Distribuidora Beauty"
      },
      {
        nombre: "Tinte Rubio Ceniza",
        descripcion: "Tinte permanente rubio ceniza",
        categoriaId: categoriaProductos.id,
        marca: "Wella",
        codigo: "TI001",
        precioCosto: 12.00,
        precioVenta: 20.00,
        stock: 15,
        stockMinimo: 3,
        unidadMedida: "unidad",
        proveedor: "Distribuidora Beauty"
      },
      {
        nombre: "Decolorante",
        descripcion: "Polvo decolorante para mechas",
        categoriaId: categoriaProductos.id,
        marca: "Schwarzkopf",
        codigo: "DE001",
        precioCosto: 15.00,
        precioVenta: 25.00,
        stock: 10,
        stockMinimo: 2,
        unidadMedida: "gr",
        proveedor: "Distribuidora Beauty"
      },
      {
        nombre: "Mascarilla Hidratante",
        descripcion: "Mascarilla intensiva para cabello seco",
        categoriaId: categoriaProductos.id,
        marca: "Kerastase",
        codigo: "MA001",
        precioCosto: 18.00,
        precioVenta: 30.00,
        stock: 12,
        stockMinimo: 3,
        unidadMedida: "ml",
        proveedor: "Distribuidora Beauty"
      },
      {
        nombre: "Tijeras Profesionales",
        descripcion: "Tijeras de corte profesional",
        categoriaId: categoriaProductos.id,
        marca: "Jaguar",
        codigo: "TJ001",
        precioCosto: 45.00,
        precioVenta: 80.00,
        stock: 3,
        stockMinimo: 1,
        unidadMedida: "unidad",
        proveedor: "Herramientas Pro"
      }
    ]

    for (const productoData of productos) {
      await prisma.producto.create({ data: productoData })
    }

    console.log("✅ Productos creados")

    // Crear una promoción de ejemplo
    const promocion = await prisma.promocion.create({
      data: {
        nombre: "Descuento Nuevos Clientes",
        descripcion: "20% de descuento para clientes nuevos",
        tipo: "PORCENTAJE",
        valor: 20.0,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        usoMaximo: 100
      }
    })

    console.log("✅ Promoción creada")

    console.log("\n🎉 Base de datos de servicios creada exitosamente!")
    console.log("📊 Resumen:")
    console.log(`   - 4 categorías`)
    console.log(`   - ${servicios.length} servicios`)
    console.log(`   - ${productos.length} productos`)
    console.log(`   - 1 promoción`)

  } catch (error) {
    console.error("❌ Error durante la creación:", error.message)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
