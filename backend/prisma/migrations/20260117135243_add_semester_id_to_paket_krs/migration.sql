/*
  Warnings:

  - Added the required column `semesterId` to the `paket_krs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "paket_krs" ADD COLUMN     "semesterId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "paket_krs" ADD CONSTRAINT "paket_krs_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
