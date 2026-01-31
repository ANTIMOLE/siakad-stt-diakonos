-- CreateEnum
CREATE TYPE "TipeFileKelas" AS ENUM ('RPS', 'RPP', 'MATERI');

-- CreateTable
CREATE TABLE "kelas_mk_file" (
    "id" SERIAL NOT NULL,
    "kelasMKId" INTEGER NOT NULL,
    "tipeFile" "TipeFileKelas" NOT NULL,
    "namaFile" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mingguKe" INTEGER,
    "keterangan" TEXT,
    "uploadedById" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelas_mk_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kelas_mk_file_kelasMKId_idx" ON "kelas_mk_file"("kelasMKId");

-- CreateIndex
CREATE INDEX "kelas_mk_file_tipeFile_idx" ON "kelas_mk_file"("tipeFile");

-- AddForeignKey
ALTER TABLE "kelas_mk_file" ADD CONSTRAINT "kelas_mk_file_kelasMKId_fkey" FOREIGN KEY ("kelasMKId") REFERENCES "kelas_mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas_mk_file" ADD CONSTRAINT "kelas_mk_file_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
