/*
  Warnings:

  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "openingTime" TEXT;
