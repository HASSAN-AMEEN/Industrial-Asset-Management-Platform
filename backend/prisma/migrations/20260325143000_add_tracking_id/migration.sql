-- Add readable tracking ID for shipments
ALTER TABLE "shipments" ADD COLUMN "trackingId" TEXT;

-- Backfill existing rows using year + id prefix
UPDATE "shipments"
SET "trackingId" = CONCAT(
  'SHP-',
  EXTRACT(YEAR FROM "createdAt")::INT,
  '-',
  UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 6))
)
WHERE "trackingId" IS NULL;

CREATE UNIQUE INDEX "shipments_trackingId_key" ON "shipments"("trackingId");
