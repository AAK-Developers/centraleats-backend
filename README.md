# CentralEats Backend — UCE

Transactional backend for the food ordering platform on the UCE university campus. Developed under a **Modular Monolith** and **Clean Architecture** approach to ensure decoupling, robust testing, and future scalability.
---

## 🏛️ Architectural Design

The system is structured as a **Modular Monolith**. Each business domain or context is isolated within its own folder in `src/modules/`, sharing only utility types or infrastructure middlewares in the `src/shared/` folder.

### 📂 Layer Structure (Clean Architecture)
Each module follows a strictly unidirectional dependency flow (from outside in):

```
src/modules/<module-name>/
├── application/use-cases/         # Business use cases (Orchestration)
├── domain/
│   ├── entities/                  # Pure domain entities
│   ├── repositories/              # Persistence contracts/interfaces
│   └── rules/                     # Business rules and validations
├── infrastructure/persistence/    # Repository implementation (Prisma / In-Memory)
└── presentation/http/
    ├── controllers/               # Thin Express controllers
    └── routes/                    # Express HTTP route definitions
```

---

## 🛠️ Technologies Used

* **Runtime:** Node.js (v18+)
* **Language:** TypeScript
* **Web Framework:** Express (v5.x)
* **Data Validation:** Zod (v4.x)
* **ORM:** Prisma Client (v7.8.0)
* **Database:** Supabase (PostgreSQL)

---

## ⚙️ Requirements and Initial Configuration

### 1. Environment Variables
Create a `.env` file in the root of the project based on the `.env.example` file:

```bash
cp .env.example .env
```

Configure your Supabase database credentials in the `.env` file:
* `DATABASE_URL`: URL of the Supabase transactional pooler (port 6543 with `pgbouncer=true`).
* `DIRECT_URL`: Direct connection URL to execute migrations (port 5432).

---

## 🗄️ Database Initialization and Migrations

### 1. Execute the First Migration
Once the environment variables are configured with your real Supabase project password, execute:
```bash
npx prisma migrate dev --name init
```

### 2. Integrity Constraints (CHECK Constraints)
Prisma does not support the creation of native SQL `CHECK` constraints. To ensure financial and stock integrity in your Supabase database, execute the following SQL script in the SQL Editor of the Supabase web console after migrating:

```sql
ALTER TABLE "Product" ADD CONSTRAINT "product_stock_non_negative" CHECK (stock >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_price_positive" CHECK (price > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity_positive" CHECK (quantity > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_unit_price_positive" CHECK ("unitPrice" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_positive" CHECK (amount > 0);
```

### 3. Load Initial Data (Seed)
To populate the database with test mockups (Administrators, Vendors, Categories, and Products), execute:
```bash
npx prisma db seed
```

---

## 🚀 Running Commands

* **Install dependencies:** `npm install`
* **Development Mode:** `npm run dev` (uses `ts-node-dev` for hot reload)
* **Verify TypeScript Compilation:** `npx tsc --noEmit`
* **Compile for Production:** `npm run build`
* **Run in Production:** `npm run start`

---

## 📡 Available Public Endpoints (Phase 8)

| Method | Endpoint | Description | Requires Authentication |
|---|---|---|---|
| **GET** | `/health` | General health status of the backend API | ❌ No |
| **GET** | `/api/categories` | Get the list of active categories | ❌ No |
| **GET** | `/api/vendors` | Get the list of active vendors/food stalls | ❌ No |
| **GET** | `/api/products` | Get the product catalog (supports optional filter `?vendorId=`) | ❌ No |

## Current Project Status

### Infrastructure completed

- Supabase PostgreSQL configuration
- Prisma ORM configuration
- Versioned migrations
- Initial data seed
- Prisma Client generated
- Modular Monolith architecture
- Clean Architecture

### Next phase

- Clerk Authentication integration
- JWT Middleware
- Clerk User ↔ Database Synchronization
- Private endpoint protection