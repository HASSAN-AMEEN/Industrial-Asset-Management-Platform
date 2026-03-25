-- CreateTable
CREATE TABLE "shipment_items" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single-machine shipments into shipment_items
INSERT INTO "shipment_items" ("id", "shipmentId", "machineId", "createdAt")
SELECT CONCAT('legacy-', s."id"), s."id", s."machineId", s."createdAt"
FROM "shipments" s
WHERE s."machineId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shipment_items_shipmentId_machineId_key" ON "shipment_items"("shipmentId", "machineId");

-- CreateIndex
CREATE INDEX "shipment_items_machineId_idx" ON "shipment_items"("machineId");

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_machineId_fkey";

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "machineId";
