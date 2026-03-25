-- Add optional selected installation foreign key on machines
ALTER TABLE "machines"
ADD COLUMN "installationId" TEXT;

ALTER TABLE "machines"
ADD CONSTRAINT "machines_installationId_fkey"
FOREIGN KEY ("installationId") REFERENCES "installations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "machines_installationId_idx" ON "machines"("installationId");
