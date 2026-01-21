-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "pembayaran_krs" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "jenisPembayaran" TEXT NOT NULL DEFAULT 'Pembayaran KRS',
    "nominal" INTEGER NOT NULL,
    "buktiUrl" TEXT NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "catatan" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_krs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pembayaran_krs_mahasiswaId_idx" ON "pembayaran_krs"("mahasiswaId");

-- CreateIndex
CREATE INDEX "pembayaran_krs_semesterId_idx" ON "pembayaran_krs"("semesterId");

-- CreateIndex
CREATE INDEX "pembayaran_krs_status_idx" ON "pembayaran_krs"("status");

-- AddForeignKey
ALTER TABLE "pembayaran_krs" ADD CONSTRAINT "pembayaran_krs_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_krs" ADD CONSTRAINT "pembayaran_krs_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran_krs" ADD CONSTRAINT "pembayaran_krs_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
