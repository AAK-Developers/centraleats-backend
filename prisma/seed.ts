import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing tables in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleared.");

  // ─── 1. USERS ───────────────────────────────────────────────────────────────
  // Regla de dominio: solo usuarios con rol VENDOR pueden ser propietarios de Vendor.
  // El admin NO puede ser ownerId de ningún local.

  const admin = await prisma.user.create({
    data: {
      clerkId: "clerk_admin_123",
      email: "admin@centraleats.com",
      fullName: "Admin CentralEats",
      avatarUrl:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.ADMIN,
    },
  });

  // Vendor Owner 1 — "El Palacio del Almuerzo"
  const vendorOwner1 = await prisma.user.create({
    data: {
      clerkId: "clerk_vendor_123",
      email: "donpepe@centraleats.com",
      fullName: "Don Pepe",
      avatarUrl:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.VENDOR,
    },
  });

  // Vendor Owner 2 — "Cafetería Central UCE"
  // CORRECCIÓN: Cada Vendor tiene su propio User con rol VENDOR.
  // El admin nunca puede ser ownerId de un Vendor.
  const vendorOwner2 = await prisma.user.create({
    data: {
      clerkId: "clerk_vendor_456",
      email: "cafeteria@centraleats.com",
      fullName: "Doña María",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.VENDOR,
    },
  });

  // Estudiante de prueba
  const student = await prisma.user.create({
    data: {
      clerkId: "clerk_student_123",
      email: "estudiante@uce.edu.ec",
      fullName: "Antony Coello",
      avatarUrl:
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.STUDENT,
    },
  });

  console.log(`👤 Users seeded: admin, 2 vendors, 1 student.`);
  // Suppress unused warning for admin and student — present for role completeness
  void admin;
  void student;

  // ─── 2. CATEGORIES ──────────────────────────────────────────────────────────
  // Categorías amplias y semánticas para soportar diversidad gastronómica del campus UCE.
  // Se especifican IDs fijos para coincidir con la lista rígida del frontend.

  const categoryPlatosFuertes = await prisma.category.create({
    data: {
      id: "06542c60-ad6b-4844-b1b1-3ad6d5baf35a",
      name: "Almuerzos",
      description: "Almuerzos, menús ejecutivos y platos tradicionales del campus.",
      isActive: true,
    },
  });

  const categoryDesayunos = await prisma.category.create({
    data: {
      name: "Desayunos y Cafetería",
      description: "Desayunos, café, empanadas, sándwiches y pastelería.",
      isActive: true,
    },
  });

  const categorySnacks = await prisma.category.create({
    data: {
      id: "153a9f76-160d-4895-814d-9831c33088cd",
      name: "Snacks",
      description: "Papas fritas, bolones, chifles y otros acompañantes.",
      isActive: true,
    },
  });

  const categoryBebidas = await prisma.category.create({
    data: {
      id: "b5003928-6d64-417b-8798-2726d16c8cfb",
      name: "Bebidas",
      description: "Jugos naturales, aguas, colas y bebidas calientes.",
      isActive: true,
    },
  });

  console.log(`📁 Categories seeded: Platos Fuertes, Desayunos y Cafetería, Snacks y Acompañantes, Bebidas.`);

  // ─── 3. VENDORS ─────────────────────────────────────────────────────────────
  // Todos los campos de perfil son REQUERIDOS en v3.0.
  // openingTime / closingTime en formato HH:mm estricto.

  const vendor1 = await prisma.vendor.create({
    data: {
      name: "El Palacio del Almuerzo",
      description: "Los mejores almuerzos caseros del campus, sopa y segundo plato con jugo incluido.",
      location: "Frente a la Facultad de Jurisprudencia",
      phone: "0999999999",
      openingTime: "07:30",
      closingTime: "15:00",
      isActive: true,
      ownerId: vendorOwner1.id,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Cafetería Central UCE",
      description: "Café, empanadas, postres y sándwiches frescos todos los días.",
      location: "Bajos de la Administración Central",
      phone: "0988888888",
      openingTime: "06:30",
      closingTime: "17:00",
      isActive: true,
      ownerId: vendorOwner2.id, // CORRECTO: propietario con rol VENDOR
    },
  });

  console.log(`🏪 Vendors seeded: ${vendor1.name}, ${vendor2.name}.`);

  // ─── 4. PRODUCTS ────────────────────────────────────────────────────────────
  // ARQUITECTURA DE CENTAVOS: todos los precios en Int (centavos).
  // $3.50 → 350 | $1.50 → 150 | $0.80 → 80 | $1.20 → 120
  // stock OBLIGATORIO: sin default. Valor real de inventario inicial.
  // isAvailable: true si stock > 0 (regla de negocio explícita).

  // Vendor 1 — El Palacio del Almuerzo
  await prisma.product.create({
    data: {
      name: "Almuerzo Ejecutivo Completo",
      description: "Sopa del día, plato fuerte (carne/pollo/pescado con arroz y ensalada) y jugo natural.",
      price: 350, // $3.50 en centavos
      stock: 45,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor1.id,
      categoryId: categoryPlatosFuertes.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Seco de Pollo con Arroz",
      description: "Presa de pollo en salsa criolla con arroz, menestra y ensalada.",
      price: 280, // $2.80 en centavos
      stock: 30,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor1.id,
      categoryId: categoryPlatosFuertes.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Jugo de Naranja Grande",
      description: "Exprimido al instante, 100% natural sin azúcar añadida.",
      price: 150, // $1.50 en centavos
      stock: 60,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor1.id,
      categoryId: categoryBebidas.id,
    },
  });

  // Vendor 2 — Cafetería Central UCE
  await prisma.product.create({
    data: {
      name: "Empanada de Viento con Azúcar",
      description: "Empanada gigante frita rellena de queso, espolvoreada con azúcar blanca.",
      price: 80, // $0.80 en centavos
      stock: 35,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor2.id,
      categoryId: categoryDesayunos.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Café Americano Caliente",
      description: "Café negro filtrado de especialidad lojano, sin azúcar.",
      price: 120, // $1.20 en centavos
      stock: 100,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor2.id,
      categoryId: categoryDesayunos.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Bolón de Verde con Queso",
      description: "Bolón tradicional de plátano verde con queso derretido en el interior.",
      price: 150, // $1.50 en centavos
      stock: 25,
      isAvailable: true,
      isActive: true,
      imageUrl:
        "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=300&q=80",
      vendorId: vendor2.id,
      categoryId: categorySnacks.id,
    },
  });

  console.log(`🍽️  Products seeded with cents architecture (price in Int).`);
  console.log(`✅ Seed v3.0 completed successfully!`);
  console.log(`   → admin: admin@centraleats.com`);
  console.log(`   → vendor 1: donpepe@centraleats.com`);
  console.log(`   → vendor 2: cafeteria@centraleats.com`);
  console.log(`   → student: estudiante@uce.edu.ec`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
