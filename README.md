# 💇‍♀️ Sistema de Gestión para Peluquerías - PWA

Sistema completo de gestión para peluquerías desarrollado con Next.js, Prisma y SQLite. Incluye gestión de clientes, citas, servicios, inventario y configuración avanzada.

## 🚀 Características Principales

### 👥 **Gestión de Clientes**
- ✅ CRUD completo de clientes
- ✅ Validación de duplicados (email, teléfono, nombre)
- ✅ Avatares por tipo de cabello
- ✅ Fotos de perfil
- ✅ Desactivación en lugar de eliminación
- ✅ Historial de citas por cliente

### 📅 **Sistema de Citas**
- ✅ Agenda completa con filtros avanzados
- ✅ Estados configurables (Pendiente, Confirmada, Realizada, Cancelada, Reagendada)
- ✅ Verificación de disponibilidad en tiempo real
- ✅ Integración con servicios y precios
- ✅ Mensajes de WhatsApp personalizados
- ✅ Conflictos de horarios inteligentes

### 💇‍♀️ **Servicios y Precios**
- ✅ Catálogo completo de servicios
- ✅ Gestión de duración por servicio
- ✅ Precios base y de venta
- ✅ Cálculo automático de márgenes
- ✅ Categorización de servicios
- ✅ Edición individual de servicios

### 📦 **Inventario**
- ✅ Gestión de productos
- ✅ Control de stock
- ✅ Alertas de stock bajo
- ✅ Movimientos de inventario
- ✅ Costos y precios de venta

### ⚙️ **Configuración Avanzada**
- ✅ Monedas personalizables (EUR, USD, ARS, etc.)
- ✅ Información del negocio
- ✅ Horarios detallados por día de la semana
- ✅ Intervalos entre citas configurables
- ✅ Horarios de descanso opcionales

### 🔐 **Sistema de Autenticación**
- ✅ Roles de usuario (Administrador, Estilista)
- ✅ Protección de rutas
- ✅ Auditoría completa de acciones
- ✅ Sesiones seguras

### 📱 **PWA y Responsive**
- ✅ Optimizado para móviles (6"+)
- ✅ Adaptado para tablets (10"+)
- ✅ Diseño responsive completo
- ✅ Área táctil optimizada (44px mínimo)

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: SQLite + Prisma ORM
- **Estilos**: Tailwind CSS
- **Iconos**: Heroicons
- **Autenticación**: Sistema personalizado con bcryptjs
- **PWA**: Service Worker y manifest

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd peluqueria-pwa

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma db push

# Poblar con datos iniciales
node scripts/seed.js
```

### Configuración Inicial
```bash
# Crear usuarios administrador
node create-admin.js

# Crear usuario estilista
node create-user.js
```

### Ejecutar en Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Usuarios por Defecto

### Administrador
- **Email**: admin@peluqueria.com
- **Contraseña**: admin123
- **Permisos**: Acceso completo al sistema

### Estilista
- **Email**: estilista@peluqueria.com
- **Contraseña**: estilista123
- **Permisos**: Gestión de citas y clientes

## 📋 Funcionalidades Detalladas

### 🎯 **Dashboard Principal**
- Resumen de citas del día
- Estadísticas rápidas
- Navegación por roles

### 👥 **Gestión de Clientes**
- Lista con búsqueda y filtros
- Creación con validación de duplicados
- Edición completa de información
- Avatares automáticos por tipo de cabello
- Historial de citas

### 📅 **Sistema de Agenda**
- Vista de todas las citas
- Filtros por estado y fecha
- Filtros rápidos (Hoy, Mañana, Semana)
- Creación de citas con validación
- Verificación de disponibilidad

### 💇‍♀️ **Servicios**
- Catálogo completo con 7 servicios predefinidos
- Edición de precios y duración
- Categorización (Peluquería, Coloración, Tratamientos)
- Cálculo automático de márgenes

### 📦 **Inventario**
- 6 productos de ejemplo
- Control de stock con alertas
- Movimientos de entrada/salida
- Gestión de costos

### 📱 **Integración WhatsApp**
- Mensajes personalizados por negocio
- Formato profesional con emojis
- Datos del negocio configurables
- Codificación optimizada para móviles

### ⚙️ **Configuración**
- **Monedas**: EUR, USD, ARS, COP, MXN, GBP, JPY
- **Negocio**: Nombre, dirección, teléfono
- **Horarios**: Configuración detallada por día
- **Formato**: Posición de símbolo, decimales

## 📱 Responsive Design

### 📱 **Móviles (320px - 640px)**
- Botones mínimo 44px de altura
- Texto base más grande
- Layouts apilados verticalmente
- Padding optimizado para espacio

### 📱 **Tablets (640px - 1024px)**
- Grillas de 2 columnas
- Balance entre espacio y usabilidad
- Botones de tamaño intermedio

### 🖥️ **Desktop (1024px+)**
- Grillas de 4 columnas
- Aprovechamiento máximo del espacio
- Efectos hover y animaciones

## 🔧 Estructura del Proyecto

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── auth/          # Autenticación
│   ├── dashboard/     # Panel principal
│   └── ...
├── lib/
│   ├── auth.ts        # Hooks de autenticación
│   ├── config.ts      # Configuración
│   ├── prisma.ts      # Cliente de base de datos
│   └── audit.ts       # Auditoría y WhatsApp
prisma/
├── schema.prisma      # Esquema de base de datos
└── dev.db            # Base de datos SQLite
scripts/
├── seed.js           # Datos iniciales
└── ...              # Scripts de utilidad
```

## 🎨 Paleta de Colores

- **🔵 Azul**: Primario (#3B82F6)
- **🟢 Verde**: Éxito (#10B981)
- **🟡 Amarillo**: Advertencia (#F59E0B)
- **🔴 Rojo**: Error (#EF4444)
- **🟣 Morado**: Secundario (#8B5CF6)

## 📊 Base de Datos

### Modelos Principales
- **User**: Usuarios del sistema
- **Cliente**: Clientes de la peluquería
- **Cita**: Citas y servicios
- **Servicio**: Catálogo de servicios
- **Producto**: Inventario
- **Configuracion**: Configuraciones del sistema
- **AuditLog**: Registro de auditoría

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs
- Protección de rutas por roles
- Validación de datos en frontend y backend
- Auditoría completa de acciones

## 📱 PWA Features

- Responsive design completo
- Optimizado para dispositivos táctiles
- Interfaz nativa-like
- Carga rápida

## 🤝 Contribución

Este sistema está diseñado para ser fácilmente extensible. Algunas áreas de mejora futura:

- [ ] Notificaciones push
- [ ] Sincronización offline
- [ ] Reportes avanzados
- [ ] Integración con sistemas de pago
- [ ] API para aplicaciones móviles nativas

## 📄 Licencia

Proyecto de código abierto para peluquerías.

---

**Desarrollado con ❤️ para el sector de belleza y cuidado personal**