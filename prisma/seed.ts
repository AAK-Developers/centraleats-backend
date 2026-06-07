import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

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

  // 1. Seed Users (Admin & Vendor Owner)
  const admin = await prisma.user.create({
    data: {
      clerkId: "clerk_admin_123",
      email: "admin@centraleats.com",
      fullName: "Admin CentralEats",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.ADMIN,
    },
  });

  const vendorOwner = await prisma.user.create({
    data: {
      clerkId: "clerk_vendor_123",
      email: "donpepe@centraleats.com",
      fullName: "Don Pepe",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.VENDOR,
    },
  });

  const student = await prisma.user.create({
    data: {
      clerkId: "clerk_student_123",
      email: "estudiante@uce.edu.ec",
      fullName: "Antony Coello",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80",
      role: UserRole.STUDENT,
    },
  });

  console.log("👤 Users seeded successfully.");

  // 2. Seed Categories
  const categoryAlmuerzo = await prisma.category.create({
    data: { name: "Almuerzos", isActive: true },
  });

  const categoryBebidas = await prisma.category.create({
    data: { name: "Bebidas", isActive: true },
  });

  const categorySnacks = await prisma.category.create({
    data: { name: "Snacks", isActive: true },
  });

  console.log("📁 Categories seeded successfully.");

  // 3. Seed Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      name: "El Palacio del Almuerzo",
      description: "Los mejores almuerzos caseros del campus, sopa y segundo plato con jugo incluido.",
      location: "Frente a la Facultad de Jurisprudencia",
      phone: "0999999999",
      isActive: true,
      ownerId: vendorOwner.id,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: "Cafetería Central UCE",
      description: "Café, empanadas, postres y sándwiches frescos todos los días.",
      location: "Bajos de la Administración Central",
      phone: "0988888888",
      isActive: true,
      ownerId: admin.id,
    },
  });

  console.log("🏪 Vendors seeded successfully.");

  // 4. Seed Products
  // Products for Vendor 1 (El Palacio del Almuerzo)
  await prisma.product.create({
    data: {
      name: "Almuerzo Ejecutivo Completo",
      description: "Entrada de sopa del día, plato fuerte (carne/pollo/pescado con arroz y ensalada) y jugo natural.",
      price: 3.50,
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
      isActive: true,
      vendorId: vendor1.id,
      categoryId: categoryAlmuerzo.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Jugo de Naranja Grande",
      description: "Exprimido al instante y 100% natural.",
      price: 1.50,
      stock: 60,
      imageUrl: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=300&q=80",
      isActive: true,
      vendorId: vendor1.id,
      categoryId: categoryBebidas.id,
    },
  });

  // Products for Vendor 2 (Cafetería Central UCE)
  await prisma.product.create({
    data: {
      name: "Empanada de Viento con Azúcar",
      description: "Empanada gigante frita rellena de queso, espolvoreada con azúcar blanca.",
      price: 0.80,
      stock: 35,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=300&q=80",
      isActive: true,
      vendorId: vendor2.id,
      categoryId: categorySnacks.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Café Americano Caliente",
      description: "Café negro filtrado de especialidad lojano.",
      price: 1.20,
      stock: 100,
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80",
      isActive: true,
      vendorId: vendor2.id,
      categoryId: categoryBebidas.id,
    },
  });

  console.log("🥞 Products seeded successfully.");
  console.log("🚀 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
