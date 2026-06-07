# CentralEats Backend — UCE

Backend transaccional para la plataforma de pedidos de comida en el campus universitario de la UCE. Desarrollado bajo un enfoque de **Modular Monolith** y **Clean Architecture** para garantizar desacoplamiento, pruebas robustas y escalabilidad futura.

---

## 🏛️ Diseño Arquitectónico

El sistema está estructurado como un **Monolito Modular**. Cada dominio o contexto de negocio se encuentra aislado dentro de su propia carpeta en `src/modules/`, compartiendo únicamente tipos utilitarios o middlewares de infraestructura en la carpeta `src/shared/`.

### 📂 Estructura de Capas (Clean Architecture)
Cada módulo sigue un flujo de dependencias estrictamente unidireccional (de afuera hacia adentro):

```
src/modules/<module-name>/
├── application/use-cases/         # Casos de uso de negocio (Orquestación)
├── domain/
│   ├── entities/                  # Entidades puras del dominio
│   ├── repositories/              # Contratos/interfaces de persistencia
│   └── rules/                     # Reglas y validaciones de negocio
├── infrastructure/persistence/    # Implementación de repositorios (Prisma / In-Memory)
└── presentation/http/
    ├── controllers/               # Controladores Express delgados (Thin Controllers)
    └── routes/                    # Definición de rutas HTTP Express
```

---

## 🛠️ Tecnologías Utilizadas

* **Runtime:** Node.js (v18+)
* **Lenguaje:** TypeScript
* **Framework Web:** Express (v5.x)
* **Validación de Datos:** Zod (v4.x)
* **ORM:** Prisma Client (v7.8.0)
* **Base de Datos:** Supabase (PostgreSQL)

---

## ⚙️ Requisitos y Configuración Inicial

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example`:

```bash
cp .env.example .env
```

Configura tus credenciales de base de datos de Supabase en el archivo `.env`:
* `DATABASE_URL`: URL del pooler transaccional de Supabase (puerto 6543 con `pgbouncer=true`).
* `DIRECT_URL`: URL de conexión directa para ejecutar las migraciones (puerto 5432).

---

## 🗄️ Inicialización de Base de Datos y Migraciones

### 1. Ejecutar la Primera Migración
Una vez configuradas las variables de entorno con la contraseña real de tu proyecto Supabase, ejecuta:
```bash
npx prisma migrate dev --name init
```

### 2. Restricciones de Integridad (CHECK Constraints)
Prisma no soporta la creación de restricciones `CHECK` nativas de SQL. Para asegurar la integridad financiera y de stock en tu base de datos Supabase, ejecuta el siguiente script SQL en el editor de SQL (SQL Editor) de la consola web de Supabase tras migrar:

```sql
ALTER TABLE "Product" ADD CONSTRAINT "product_stock_non_negative" CHECK (stock >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_price_positive" CHECK (price > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity_positive" CHECK (quantity > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_unit_price_positive" CHECK ("unitPrice" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_positive" CHECK (amount > 0);
```

### 3. Cargar Datos Iniciales (Seed)
Para poblar la base de datos con mockups de prueba (Administradores, Vendedores, Categorías y Productos), ejecuta:
```bash
npx prisma db seed
```

---

## 🚀 Comandos de Ejecución

* **Instalar dependencias:** `npm install`
* **Modo Desarrollo:** `npm run dev` (utiliza `ts-node-dev` para recarga en caliente)
* **Verificar Compilación TypeScript:** `npx tsc --noEmit`
* **Compilar para Producción:** `npm run build`
* **Iniciar en Producción:** `npm run start`

---

## 📡 Endpoints Públicos Disponibles (Fase 8)

| Método | Endpoint | Descripción | Requiere Autenticación |
|---|---|---|---|
| **GET** | `/health` | Estado de salud general del API backend | ❌ No |
| **GET** | `/api/categories` | Obtiene el listado de categorías activas | ❌ No |
| **GET** | `/api/vendors` | Obtiene el listado de vendedores/puestos de comida activos | ❌ No |
| **GET** | `/api/products` | Obtiene el catálogo de productos (admite filtro opcional `?vendorId=`) | ❌ No |