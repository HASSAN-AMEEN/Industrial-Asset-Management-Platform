-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('ACTIVE', 'REMOVED', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "installations" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "clientId" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installedBy" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "siteAddress" TEXT,
    "siteNotes" TEXT,
    "status" "InstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
