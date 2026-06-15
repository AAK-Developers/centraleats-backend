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
* **Authentication:** Clerk (@clerk/backend)
* **Webhooks Security:** Svix

---

## ⚙️ How to Run Locally

### 1. Environment Variables
Create a `.env` file in the root of the project based on the `.env.example` file:

```bash
cp .env.example .env
```

Configure your credentials in the `.env` file:
* `DATABASE_URL`: Supabase transactional pooler URL (port 6543, `pgbouncer=true`).
* `DIRECT_URL`: Direct connection URL to execute migrations (port 5432).
* `CLERK_SECRET_KEY`: Clerk secret key (`sk_...`).
* `CLERK_PUBLISHABLE_KEY`: Clerk publishable key (`pk_...`).
* `CLERK_WEBHOOK_SECRET`: Svix webhook signing secret (`whsec_...`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
Start the local server with hot-reloading (ts-node-dev):
```bash
npm run dev
```
The server will be available at `http://localhost:3000`.

---

## 🗄️ Database Initialization and Migrations

If you are setting up the database for the first time:

1. **Execute Migrations:**
   ```bash
   npx prisma migrate dev
   ```

2. **Integrity Constraints (CHECK Constraints):**
   Execute the following SQL in your Supabase SQL Editor to enforce business rules:
   ```sql
   ALTER TABLE "Product" ADD CONSTRAINT "product_stock_non_negative" CHECK (stock >= 0);
   ALTER TABLE "Product" ADD CONSTRAINT "product_price_positive" CHECK (price > 0);
   ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity_positive" CHECK (quantity > 0);
   ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_unit_price_positive" CHECK ("unitPrice" > 0);
   ALTER TABLE "Payment" ADD CONSTRAINT "payment_amount_positive" CHECK (amount > 0);
   ```

3. **Load Initial Data (Seed):**
   ```bash
   npx prisma db seed
   ```

---

## 🧪 How to Test It

### Type Checking
Ensure the codebase has no TypeScript errors before committing:
```bash
npx tsc --noEmit
```

### Manual API Testing
You can test the endpoints using Postman or cURL. 

1. **Public Endpoints (No Auth needed):**
   ```bash
   curl -X GET http://localhost:3000/health
   curl -X GET http://localhost:3000/api/products
   ```

2. **Protected Endpoints (Requires Clerk JWT):**
   Extract a valid Bearer Token from your Clerk frontend integration and use it in the headers:
   ```bash
   curl -X GET http://localhost:3000/api/protected-test \
     -H "Authorization: Bearer <YOUR_CLERK_JWT_TOKEN>"
   ```

3. **RBAC Testing (Role Based Access Control):**
   You can verify roles using the test endpoints (`/api/protected-test/student` or `/api/protected-test/vendor`). The API will return `403 Forbidden` if the user does not exist locally, is inactive, or has insufficient privileges.

### Testing Clerk Webhooks Locally
To test user synchronization locally, you must expose your localhost to the internet so Clerk can send Webhook events:
1. Install and run ngrok: `ngrok http 3000`
2. Update your Clerk Dashboard Webhook URL to point to `https://<your-ngrok-url>/api/webhooks/clerk`.
3. Update `CLERK_WEBHOOK_SECRET` in `.env` with the new secret provided by Clerk.

---

## ☁️ Deployment to AWS

To deploy this backend to an AWS EC2 instance using Docker, follow these steps:

### 1. Provision an EC2 Instance
1. Launch an EC2 instance (e.g., Ubuntu 22.04 LTS, t2.micro or higher).
2. Configure the **Security Group** to allow inbound traffic on ports `80` (HTTP), `443` (HTTPS), and `22` (SSH).
3. Connect to your instance via SSH.

### 2. Install Docker and Docker Compose
Run the following commands on your EC2 instance:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```
*(You may need to log out and log back in for group changes to take effect).*

### 3. Clone and Configure
Clone your repository onto the EC2 instance:
```bash
git clone https://github.com/AAK-Developers/centraleats-backend.git
cd centraleats-backend
```
Create the production `.env` file securely on the server with your production database URLs and Clerk keys.

### 4. Deploy with Docker Compose
The repository contains a `Dockerfile` and `docker-compose.yml`. To build and run the backend in detached mode:
```bash
docker-compose up -d --build
```
The application will start inside the container and bind to the specified port.

---

## 📡 Available Endpoints

| Method | Endpoint | Description | Requires Auth | Role |
|---|---|---|---|---|
| **GET** | `/health` | API health status | ❌ No | Any |
| **POST**| `/api/webhooks/clerk` | Clerk User Sync webhook | 🔐 Svix | Server |
| **GET** | `/api/categories` | List active categories | ❌ No | Any |
| **GET** | `/api/vendors` | List active vendors | ❌ No | Any |
| **GET** | `/api/products` | Get catalog (`?vendorId=`) | ❌ No | Any |
| **GET** | `/api/protected-test` | Authenticated check | ✅ Yes | Any |
| **GET** | `/api/protected-test/student` | RBAC test for Students | ✅ Yes | STUDENT / ADMIN |

---

## ✅ Current Project Status

- [x] Supabase PostgreSQL configuration & Migrations
- [x] Prisma ORM Integration & Modular Architecture
- [x] Clerk Webhook Integration (User Sync to Local DB) (SCRUM-21)
- [x] Clerk JWT Token Validation Middleware (SCRUM-22)
- [x] RBAC (Role Based Access Control) implementation (SCRUM-23)
- [ ] Role Onboarding / Selection
- [ ] Order Processing & Websockets