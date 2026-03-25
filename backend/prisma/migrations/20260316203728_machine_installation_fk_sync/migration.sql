/*
  Warnings:

  - You are about to drop the column `installationLocation` on the `machines` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "machines_installationId_idx";

-- AlterTable
ALTER TABLE "machines" DROP COLUMN "installationLocation";
