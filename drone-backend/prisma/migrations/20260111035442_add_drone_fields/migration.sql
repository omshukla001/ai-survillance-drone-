-- AlterTable
ALTER TABLE "Detection" ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "batteryLevel" INTEGER,
ADD COLUMN     "droneId" TEXT NOT NULL DEFAULT 'drone_1',
ADD COLUMN     "heading" DOUBLE PRECISION,
ADD COLUMN     "speed" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT;

-- CreateTable
CREATE TABLE "DroneStatus" (
    "id" TEXT NOT NULL DEFAULT 'drone_1',
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "batteryLevel" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DroneStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Detection_droneId_idx" ON "Detection"("droneId");
