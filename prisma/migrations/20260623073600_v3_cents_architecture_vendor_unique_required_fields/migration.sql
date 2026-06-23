-- ============================================================
-- Migration: v3_cents_architecture_vendor_unique_required_fields
-- CentralEats — Schema v3.0
-- 
-- ESTRATEGIA: Backfill de NULLs existentes antes de aplicar
-- restricciones NOT NULL. Esto garantiza que los datos legacy
-- no bloqueen la migración.
-- ============================================================

-- PASO 1: Rellenar valores NULL en Vendor antes de hacer NOT NULL
-- Vendor existentes sin openingTime/closingTime/location reciben
-- valores de placeholder seguros para no bloquear la migración.
UPDATE "Vendor"
SET "location" = 'Por definir - Campus UCE'
WHERE "location" IS NULL;

UPDATE "Vendor"
SET "openingTime" = '08:00'
WHERE "openingTime" IS NULL;

UPDATE "Vendor"
SET "closingTime" = '17:00'
WHERE "closingTime" IS NULL;

UPDATE "Vendor"
SET "phone" = '0000000000'
WHERE "phone" IS NULL;

-- PASO 2: Aplicar restricciones NOT NULL en Vendor
ALTER TABLE "Vendor" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "Vendor" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "Vendor" ALTER COLUMN "openingTime" SET NOT NULL;
ALTER TABLE "Vendor" ALTER COLUMN "closingTime" SET NOT NULL;

-- PASO 3: Añadir restricción UNIQUE en ownerId (1 dueño = 1 local)
-- Primero eliminamos el índice antiguo si existe
DROP INDEX IF EXISTS "Vendor_ownerId_idx";
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_ownerId_key" UNIQUE ("ownerId");

-- PASO 4: Cambio de tipo Decimal → Int en Product.price (arquitectura centavos)
-- Convertir valores existentes: $3.50 → 350
ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE INTEGER USING ROUND("price" * 100)::INTEGER;

-- PASO 5: Eliminar default de Product.stock (stock obligatorio sin default implícito)
ALTER TABLE "Product" ALTER COLUMN "stock" DROP DEFAULT;

-- PASO 6: Cambio de tipo Decimal → Int en Order.totalAmount
ALTER TABLE "Order"
  ALTER COLUMN "totalAmount" TYPE INTEGER USING ROUND("totalAmount" * 100)::INTEGER;

-- PASO 7: Cambio de tipo Decimal → Int en OrderItem.unitPrice
ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE INTEGER USING ROUND("unitPrice" * 100)::INTEGER;

-- PASO 8: Cambio de tipo Decimal → Int en Payment.amount
ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE INTEGER USING ROUND("amount" * 100)::INTEGER;

-- PASO 9: Añadir campo description a Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- PASO 10: Añadir índice en Product.isAvailable (nuevo campo de visibilidad)
CREATE INDEX IF NOT EXISTS "Product_isAvailable_idx" ON "Product"("isAvailable");

-- PASO 11: Actualizar el comentario del esquema en Vendor (relación 1:1 con User)
-- La relación User.vendors[] pasa a User.vendor (singular) a nivel ORM.
-- No requiere cambio DDL: la constraint @unique en ownerId ya lo garantiza.
