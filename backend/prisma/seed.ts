/**
 * Prisma Seed Script
 * Clean & Explicit Auth-Oriented Seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. CLEAR DATABASE
  // ============================================
  console.log('🗑️ Clearing database...');

  await prisma.auditLog.deleteMany();
  await prisma.kHS.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.kRSDetail.deleteMany();
  await prisma.kRS.deleteMany();
  await prisma.paketKRSDetail.deleteMany();
  await prisma.paketKRS.deleteMany();
  await prisma.kelasMataKuliah.deleteMany();
  await prisma.mataKuliah.deleteMany();
  await prisma.ruangan.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.mahasiswa.deleteMany();
  await prisma.dosen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.programStudi.deleteMany();

  console.log('✅ Database cleared');

  // ============================================
  // 2. PASSWORD
  // ============================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // 3. USERS (ADMIN & KEUANGAN)
  // ============================================
  console.log('👤 Creating Admin & Keuangan...');

  const adminUser = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const keuanganUser = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'KEUANGAN',
      isActive: true,
    },
  });

  // ============================================
  // 4. PROGRAM STUDI
  // ============================================
  const prodiPAK = await prisma.programStudi.create({
    data: {
      kode: 'PAK',
      nama: 'Pendidikan Agama Kristen',
      jenjang: 'S1',
      isActive: true,
    },
  });

  const prodiTeologi = await prisma.programStudi.create({
    data: {
      kode: 'TEO',
      nama: 'Teologi',
      jenjang: 'S1',
      isActive: true,
    },
  });

  // ============================================
  // 5. DOSEN
  // ============================================
  console.log('👨‍🏫 Creating Dosen...');

  const dosen1 = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'DOSEN',
      isActive: true,
      dosen: {
        create: {
          nidn: '0101018901',
          nuptk: '1234567890123456',
          namaLengkap: 'Dr. Markus Simanjuntak, M.Th',
          prodiId: prodiPAK.id,
          posisi: 'Dosen Tetap',
          jafung: 'Lektor',
          status: 'AKTIF',
          alumni: 'false',
          lamaMengajar: '10',
        },
      },
    },
    include: { dosen: true },
  });

  const dosen2 = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'DOSEN',
      isActive: true,
      dosen: {
        create: {
          nidn: '0202029001',
          nuptk: '2234567890123456',
          namaLengkap: 'Dr. Ruth Simatupang, M.Pd.K',
          prodiId: prodiTeologi.id,
          posisi: 'Dosen Tetap',
          jafung: 'Lektor Kepala',
          status: 'AKTIF',
          alumni: 'false',
          lamaMengajar: '15',
        },
      },
    },
    include: { dosen: true },
  });

  // ============================================
  // 6. MAHASISWA
  // ============================================
  console.log('👨‍🎓 Creating Mahasiswa...');

  const mhs1 = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'MAHASISWA',
      isActive: true,
      mahasiswa: {
        create: {
          nim: '2024010001',
          namaLengkap: 'Andi Wijaya',
          prodiId: prodiPAK.id,
          angkatan: 2024,
          status: 'AKTIF',
          dosenWaliId: dosen1.dosen!.id,
        },
      },
    },
    include: { mahasiswa: true },
  });

  const mhs2 = await prisma.user.create({
    data: {
      password: hashedPassword,
      role: 'MAHASISWA',
      isActive: true,
      mahasiswa: {
        create: {
          nim: '2024020001',
          namaLengkap: 'Citra Dewi',
          prodiId: prodiTeologi.id,
          angkatan: 2024,
          status: 'AKTIF',
          dosenWaliId: dosen2.dosen!.id,
        },
      },
    },
    include: { mahasiswa: true },
  });

  // ============================================
  // SUMMARY + LOGIN INFO
  // ============================================
  console.log('\n================ LOGIN INFO ================');
  console.log('ADMIN');
  console.log(`Identifier : ${adminUser.id}`);
  console.log('Password   : password123\n');

  console.log('KEUANGAN');
  console.log(`Identifier : ${keuanganUser.id}`);
  console.log('Password   : password123\n');

  console.log('DOSEN');
  console.log('Identifier : 1234567890123456');
  console.log('Password   : password123\n');

  console.log('MAHASISWA');
  console.log('Identifier : 2024010001');
  console.log('Password   : password123');
  console.log('============================================');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
