/*
  Warnings:

  - You are about to drop the `pembayaran_krs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusPresensi" AS ENUM ('HADIR', 'TIDAK_HADIR', 'IZIN', 'SAKIT', 'ALPHA');

-- CreateEnum
CREATE TYPE "JenisPembayaran" AS ENUM ('KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN');

-- DropForeignKey
ALTER TABLE "pembayaran_krs" DROP CONSTRAINT "pembayaran_krs_mahasiswaId_fkey";

-- DropForeignKey
ALTER TABLE "pembayaran_krs" DROP CONSTRAINT "pembayaran_krs_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "pembayaran_krs" DROP CONSTRAINT "pembayaran_krs_verifiedById_fkey";

-- AlterTable
ALTER TABLE "mahasiswa" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "jenisKelamin" "JenisKelamin",
ADD COLUMN     "tempatTanggalLahir" TEXT;

-- DropTable
DROP TABLE "pembayaran_krs";

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "semesterId" INTEGER,
    "jenisPembayaran" "JenisPembayaran" NOT NULL DEFAULT 'KRS',
    "nominal" INTEGER NOT NULL,
    "buktiUrl" TEXT NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "catatan" TEXT,
    "bulanPembayaran" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" SERIAL NOT NULL,
    "kelasMKId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pertemuan" INTEGER NOT NULL,
    "materi" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi_detail" (
    "id" SERIAL NOT NULL,
    "presensiId" INTEGER NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "status" "StatusPresensi" NOT NULL DEFAULT 'ALPHA',
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presensi_detail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pembayaran_mahasiswaId_idx" ON "pembayaran"("mahasiswaId");

-- CreateIndex
CREATE INDEX "pembayaran_semesterId_idx" ON "pembayaran"("semesterId");

-- CreateIndex
CREATE INDEX "pembayaran_status_idx" ON "pembayaran"("status");

-- CreateIndex
CREATE INDEX "pembayaran_jenisPembayaran_idx" ON "pembayaran"("jenisPembayaran");

-- CreateIndex
CREATE INDEX "presensi_kelasMKId_idx" ON "presensi"("kelasMKId");

-- CreateIndex
CREATE INDEX "presensi_tanggal_idx" ON "presensi"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_kelasMKId_pertemuan_key" ON "presensi"("kelasMKId", "pertemuan");

-- CreateIndex
CREATE INDEX "presensi_detail_mahasiswaId_idx" ON "presensi_detail"("mahasiswaId");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_detail_presensiId_mahasiswaId_key" ON "presensi_detail"("presensiId", "mahasiswaId");

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_kelasMKId_fkey" FOREIGN KEY ("kelasMKId") REFERENCES "kelas_mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_detail" ADD CONSTRAINT "presensi_detail_presensiId_fkey" FOREIGN KEY ("presensiId") REFERENCES "presensi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_detail" ADD CONSTRAINT "presensi_detail_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
