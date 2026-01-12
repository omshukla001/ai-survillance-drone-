-- CreateTable
CREATE TABLE "Detection" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Detection_timestamp_idx" ON "Detection"("timestamp");

-- CreateIndex
CREATE INDEX "Detection_source_idx" ON "Detection"("source");
