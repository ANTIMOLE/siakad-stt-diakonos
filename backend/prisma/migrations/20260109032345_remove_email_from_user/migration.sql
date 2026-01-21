/*
  Warnings:

  - You are about to drop the column `emailDosen` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `noHp` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `alamat` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `emailPersonal` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `jenisKelamin` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `noHp` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalLahir` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `tempatLahir` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `mata_kuliah_prasyarat` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nuptk]` on the table `dosen` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alumni` to the `dosen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jafung` to the `dosen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lamaMengajar` to the `dosen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nuptk` to the `dosen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `posisi` to the `dosen` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "mata_kuliah_prasyarat" DROP CONSTRAINT "mata_kuliah_prasyarat_mkId_fkey";

-- DropForeignKey
ALTER TABLE "mata_kuliah_prasyarat" DROP CONSTRAINT "mata_kuliah_prasyarat_prasyaratMkId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "dosen" DROP COLUMN "emailDosen",
DROP COLUMN "noHp",
ADD COLUMN     "alumni" TEXT NOT NULL,
ADD COLUMN     "jafung" TEXT NOT NULL,
ADD COLUMN     "lamaMengajar" TEXT NOT NULL,
ADD COLUMN     "nuptk" TEXT NOT NULL,
ADD COLUMN     "posisi" TEXT NOT NULL,
ADD COLUMN     "tanggalLahir" TIMESTAMP(3),
ADD COLUMN     "tempatLahir" TEXT;

-- AlterTable
ALTER TABLE "mahasiswa" DROP COLUMN "alamat",
DROP COLUMN "emailPersonal",
DROP COLUMN "jenisKelamin",
DROP COLUMN "noHp",
DROP COLUMN "tanggalLahir",
DROP COLUMN "tempatLahir";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email";

-- DropTable
DROP TABLE "mata_kuliah_prasyarat";

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nuptk_key" ON "dosen"("nuptk");
