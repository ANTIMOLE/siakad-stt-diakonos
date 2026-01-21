-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOSEN', 'MAHASISWA');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusMahasiswa" AS ENUM ('AKTIF', 'CUTI', 'NON_AKTIF', 'LULUS', 'DO');

-- CreateEnum
CREATE TYPE "StatusDosen" AS ENUM ('AKTIF', 'NON_AKTIF');

-- CreateEnum
CREATE TYPE "PeriodeSemester" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "StatusKRS" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NilaiHuruf" AS ENUM ('A', 'AB', 'B', 'BC', 'C', 'CD', 'D', 'DE', 'E');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MAHASISWA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_studi" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL DEFAULT 'S1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_studi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahasiswa" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nim" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" "JenisKelamin" NOT NULL,
    "alamat" TEXT,
    "noHp" TEXT,
    "emailPersonal" TEXT,
    "prodiId" INTEGER NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "status" "StatusMahasiswa" NOT NULL DEFAULT 'AKTIF',
    "dosenWaliId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dosen" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nidn" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "prodiId" INTEGER,
    "noHp" TEXT,
    "emailDosen" TEXT,
    "status" "StatusDosen" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_kuliah" (
    "id" SERIAL NOT NULL,
    "kodeMK" TEXT NOT NULL,
    "namaMK" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "semesterIdeal" INTEGER NOT NULL,
    "isLintasProdi" BOOLEAN NOT NULL DEFAULT false,
    "deskripsi" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mata_kuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_kuliah_prasyarat" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "prasyaratMkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mata_kuliah_prasyarat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruangan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ruangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester" (
    "id" SERIAL NOT NULL,
    "tahunAkademik" TEXT NOT NULL,
    "periode" "PeriodeSemester" NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "periodeKRSMulai" TIMESTAMP(3) NOT NULL,
    "periodeKRSSelesai" TIMESTAMP(3) NOT NULL,
    "periodePerbaikanKRSMulai" TIMESTAMP(3) NOT NULL,
    "periodePerbaikanKRSSelesai" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas_mata_kuliah" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "dosenId" INTEGER NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "ruanganId" INTEGER NOT NULL,
    "kuotaMax" INTEGER NOT NULL DEFAULT 30,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelas_mata_kuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket_krs" (
    "id" SERIAL NOT NULL,
    "namaPaket" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "semesterPaket" INTEGER NOT NULL,
    "totalSKS" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paket_krs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paket_krs_detail" (
    "id" SERIAL NOT NULL,
    "paketKRSId" INTEGER NOT NULL,
    "kelasMKId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paket_krs_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krs" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "paketKRSId" INTEGER,
    "status" "StatusKRS" NOT NULL DEFAULT 'DRAFT',
    "totalSKS" INTEGER NOT NULL DEFAULT 0,
    "isModified" BOOLEAN NOT NULL DEFAULT false,
    "catatanAdmin" TEXT,
    "tanggalSubmit" TIMESTAMP(3),
    "tanggalApproval" TIMESTAMP(3),
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "krs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krs_detail" (
    "id" SERIAL NOT NULL,
    "krsId" INTEGER NOT NULL,
    "kelasMKId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "krs_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "kelasMKId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "nilaiAngka" DECIMAL(5,2),
    "nilaiHuruf" "NilaiHuruf",
    "bobot" DECIMAL(3,2),
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "inputById" INTEGER NOT NULL,
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khs" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "ips" DECIMAL(4,2) NOT NULL,
    "ipk" DECIMAL(4,2) NOT NULL,
    "totalSKSSemester" INTEGER NOT NULL,
    "totalSKSKumulatif" INTEGER NOT NULL,
    "tanggalGenerate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "khs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" INTEGER,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "program_studi_kode_key" ON "program_studi"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_userId_key" ON "mahasiswa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mahasiswa_nim_key" ON "mahasiswa"("nim");

-- CreateIndex
CREATE INDEX "mahasiswa_nim_idx" ON "mahasiswa"("nim");

-- CreateIndex
CREATE INDEX "mahasiswa_prodiId_idx" ON "mahasiswa"("prodiId");

-- CreateIndex
CREATE INDEX "mahasiswa_angkatan_idx" ON "mahasiswa"("angkatan");

-- CreateIndex
CREATE INDEX "mahasiswa_dosenWaliId_idx" ON "mahasiswa"("dosenWaliId");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_userId_key" ON "dosen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dosen_nidn_key" ON "dosen"("nidn");

-- CreateIndex
CREATE INDEX "dosen_nidn_idx" ON "dosen"("nidn");

-- CreateIndex
CREATE INDEX "dosen_prodiId_idx" ON "dosen"("prodiId");

-- CreateIndex
CREATE UNIQUE INDEX "mata_kuliah_kodeMK_key" ON "mata_kuliah"("kodeMK");

-- CreateIndex
CREATE INDEX "mata_kuliah_kodeMK_idx" ON "mata_kuliah"("kodeMK");

-- CreateIndex
CREATE INDEX "mata_kuliah_semesterIdeal_idx" ON "mata_kuliah"("semesterIdeal");

-- CreateIndex
CREATE UNIQUE INDEX "mata_kuliah_prasyarat_mkId_prasyaratMkId_key" ON "mata_kuliah_prasyarat"("mkId", "prasyaratMkId");

-- CreateIndex
CREATE UNIQUE INDEX "ruangan_nama_key" ON "ruangan"("nama");

-- CreateIndex
CREATE INDEX "semester_isActive_idx" ON "semester"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "semester_tahunAkademik_periode_key" ON "semester"("tahunAkademik", "periode");

-- CreateIndex
CREATE INDEX "kelas_mata_kuliah_semesterId_idx" ON "kelas_mata_kuliah"("semesterId");

-- CreateIndex
CREATE INDEX "kelas_mata_kuliah_dosenId_idx" ON "kelas_mata_kuliah"("dosenId");

-- CreateIndex
CREATE INDEX "kelas_mata_kuliah_hari_jamMulai_idx" ON "kelas_mata_kuliah"("hari", "jamMulai");

-- CreateIndex
CREATE INDEX "paket_krs_angkatan_prodiId_semesterPaket_idx" ON "paket_krs"("angkatan", "prodiId", "semesterPaket");

-- CreateIndex
CREATE UNIQUE INDEX "paket_krs_detail_paketKRSId_kelasMKId_key" ON "paket_krs_detail"("paketKRSId", "kelasMKId");

-- CreateIndex
CREATE INDEX "krs_status_idx" ON "krs"("status");

-- CreateIndex
CREATE INDEX "krs_semesterId_idx" ON "krs"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "krs_mahasiswaId_semesterId_key" ON "krs"("mahasiswaId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "krs_detail_krsId_kelasMKId_key" ON "krs_detail"("krsId", "kelasMKId");

-- CreateIndex
CREATE INDEX "nilai_semesterId_idx" ON "nilai"("semesterId");

-- CreateIndex
CREATE INDEX "nilai_kelasMKId_idx" ON "nilai"("kelasMKId");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_mahasiswaId_kelasMKId_semesterId_key" ON "nilai"("mahasiswaId", "kelasMKId", "semesterId");

-- CreateIndex
CREATE INDEX "khs_semesterId_idx" ON "khs"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "khs_mahasiswaId_semesterId_key" ON "khs"("mahasiswaId", "semesterId");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_tableName_recordId_idx" ON "audit_log"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "program_studi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahasiswa" ADD CONSTRAINT "mahasiswa_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dosen" ADD CONSTRAINT "dosen_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "program_studi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_kuliah_prasyarat" ADD CONSTRAINT "mata_kuliah_prasyarat_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_kuliah_prasyarat" ADD CONSTRAINT "mata_kuliah_prasyarat_prasyaratMkId_fkey" FOREIGN KEY ("prasyaratMkId") REFERENCES "mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas_mata_kuliah" ADD CONSTRAINT "kelas_mata_kuliah_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas_mata_kuliah" ADD CONSTRAINT "kelas_mata_kuliah_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas_mata_kuliah" ADD CONSTRAINT "kelas_mata_kuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas_mata_kuliah" ADD CONSTRAINT "kelas_mata_kuliah_ruanganId_fkey" FOREIGN KEY ("ruanganId") REFERENCES "ruangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_krs" ADD CONSTRAINT "paket_krs_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "program_studi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_krs" ADD CONSTRAINT "paket_krs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_krs_detail" ADD CONSTRAINT "paket_krs_detail_paketKRSId_fkey" FOREIGN KEY ("paketKRSId") REFERENCES "paket_krs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_krs_detail" ADD CONSTRAINT "paket_krs_detail_kelasMKId_fkey" FOREIGN KEY ("kelasMKId") REFERENCES "kelas_mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_paketKRSId_fkey" FOREIGN KEY ("paketKRSId") REFERENCES "paket_krs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs_detail" ADD CONSTRAINT "krs_detail_krsId_fkey" FOREIGN KEY ("krsId") REFERENCES "krs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs_detail" ADD CONSTRAINT "krs_detail_kelasMKId_fkey" FOREIGN KEY ("kelasMKId") REFERENCES "kelas_mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_kelasMKId_fkey" FOREIGN KEY ("kelasMKId") REFERENCES "kelas_mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_inputById_fkey" FOREIGN KEY ("inputById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khs" ADD CONSTRAINT "khs_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "mahasiswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khs" ADD CONSTRAINT "khs_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
