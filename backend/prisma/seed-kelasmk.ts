// ============================================
// SEED KELAS MATA KULIAH - SIAKAD STT DIAKONOS (FIXED)
// 28 Kelas untuk Semester Genap 2025/2026
// With Better Error Handling
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Kelas Mata Kuliah...');

  // ============================================
  // 1. GET SEMESTER AKTIF (2025/2026 GENAP)
  // ============================================
  console.log('📅 Getting active semester...');

  let semester = await prisma.semester.findFirst({
    where: {
      tahunAkademik: '2025/2026',
      periode: 'GENAP',
    },
  });

  if (!semester) {
    console.log('📅 Creating semester 2025/2026 GENAP...');
    semester = await prisma.semester.create({
      data: {
        tahunAkademik: '2025/2026',
        periode: 'GENAP',
        tanggalMulai: new Date('2026-02-01'),
        tanggalSelesai: new Date('2026-06-30'),
        periodeKRSMulai: new Date('2026-01-15'),
        periodeKRSSelesai: new Date('2026-02-15'),
        periodePerbaikanKRSMulai: new Date('2026-02-16'),
        periodePerbaikanKRSSelesai: new Date('2026-02-28'),
        isActive: true,
      },
    });
  }

  console.log('✅ Semester:', semester.tahunAkademik, semester.periode);

  // ============================================
  // 2. GET/CREATE RUANGAN
  // ============================================
  console.log('🏢 Getting/Creating ruangan...');

  const ruanganPAK1 = await prisma.ruangan.upsert({
    where: { nama: 'PAK I' },
    update: {},
    create: { nama: 'PAK I', kapasitas: 30, isActive: true },
  });

  const ruanganTeologi1 = await prisma.ruangan.upsert({
    where: { nama: 'Teologi I' },
    update: {},
    create: { nama: 'Teologi I', kapasitas: 30, isActive: true },
  });

  const ruanganTeologi2 = await prisma.ruangan.upsert({
    where: { nama: 'Teologi II' },
    update: {},
    create: { nama: 'Teologi II', kapasitas: 30, isActive: true },
  });

  console.log('✅ Ruangan ready');

  // ============================================
  // 3. GET ALL DOSEN & MATA KULIAH
  // ============================================
  console.log('👨‍🏫 Loading dosen & mata kuliah...');

  const allDosen = await prisma.dosen.findMany();
  const allMataKuliah = await prisma.mataKuliah.findMany();

  console.log(`✅ Found ${allDosen.length} dosen, ${allMataKuliah.length} mata kuliah`);

  // Helper functions
  const findDosenByName = (name: string) => {
    const searchName = name.toLowerCase().trim();
    return allDosen.find(d => {
      const dosenName = d.namaLengkap.toLowerCase();
      // Check if main name matches (before comma)
      const mainName = dosenName.split(',')[0].trim();
      const searchMainName = searchName.split(',')[0].trim();
      return mainName.includes(searchMainName) || searchMainName.includes(mainName);
    });
  };

  const findMataKuliahByKode = (kode: string) => {
    const searchKode = kode.trim().replace(/\s+/g, ' ');
    return allMataKuliah.find(mk => {
      const mkKode = mk.kodeMK.trim().replace(/\s+/g, ' ');
      return mkKode === searchKode || mkKode.replace(/\s/g, '') === searchKode.replace(/\s/g, '');
    });
  };

  // ============================================
  // 4. CLEAR EXISTING KELAS
  // ============================================
  console.log('🗑️  Clearing existing kelas...');
  await prisma.kelasMataKuliah.deleteMany({
    where: { semesterId: semester.id },
  });
  console.log('✅ Cleared');

  // ============================================
  // 5. SEED KELAS MATA KULIAH (28 KELAS)
  // ============================================
  console.log('📚 Seeding 28 Kelas Mata Kuliah...');

  const kelasData = [
    { 
      hari: 'Senin', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KK P2214',
      namaMK: 'Dasar-dasar Pendidikan',
      dosenName: 'Dr. Rianto',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Senin', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'PB T2261',
      namaMK: 'PI Pribadi',
      dosenName: 'Raden Ade Christian Aritonang',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Senin', 
      jamMulai: '07:15', 
      jamSelesai: '09:45',
      kodeMK: 'KB 4381',
      namaMK: 'Teologi Sistematika II',
      dosenName: 'Tabita Todingbua',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Senin', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'KB 2239',
      namaMK: 'Sejarah Gereja Umum',
      dosenName: 'Orance Amelia Neonane',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Senin', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'PB 4264',
      namaMK: 'Metode PA',
      dosenName: 'Dr. Pujiono',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Senin', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'KK 2224',
      namaMK: 'Psikologi Perkembangan',
      dosenName: 'Agus Silo Witrasno',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Senin', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'KB 4238',
      namaMK: 'Etika Kristen II',
      dosenName: 'Dr. FX. Jeffry Harimurti',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KK 2208',
      namaMK: 'Pembimbing & Pengetahuan PL II',
      dosenName: 'Paulus Setyo Pramono',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KB P4254',
      namaMK: 'Kurikulum PAK',
      dosenName: 'Dr. Mulyono, M.Pd.K.',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'PB T4268',
      namaMK: 'Pertumbuhan Gereja',
      dosenName: 'Udin Firman Hidayat, M.Pd.',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'KB P2267',
      namaMK: 'Pembimbing PAK I',
      dosenName: 'Dr. Pujiono',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'PB T4252',
      namaMK: 'Liturgika',
      dosenName: 'Udin Firman Hidayat',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'KB 4255',
      namaMK: 'PAK/PWG Anak',
      dosenName: 'Ester Muriya',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'KK 2211',
      namaMK: 'Pembimbing & Pengetahuan PB II',
      dosenName: 'Fajar Dani Eko Mei Setiawan',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Selasa', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'PK 4206',
      namaMK: 'Bahasa Inggris Teologi',
      dosenName: 'Orance Amelia Neonane',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Rabu', 
      jamMulai: '07:30', 
      jamSelesai: '10:00',
      kodeMK: 'KK 2315',
      namaMK: 'Bahasa Yunani I',
      dosenName: 'Dafit Mei Dianto',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Rabu', 
      jamMulai: '07:30', 
      jamSelesai: '10:00',
      kodeMK: 'PB 4358',
      namaMK: 'Homiletika I',
      dosenName: 'Fajar Dani Eko Mei Setiawan',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Rabu', 
      jamMulai: '10:20', 
      jamSelesai: '12:00',
      kodeMK: 'PB 2269',
      namaMK: 'Musik Gereja',
      dosenName: 'Wahyu Oktorio Stevanus, S.Mg.',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Rabu', 
      jamMulai: '10:20', 
      jamSelesai: '12:00',
      kodeMK: 'KB P4336',
      namaMK: 'Perencanaan Pembelajaran PAK',
      dosenName: 'Dr. Sutoyo',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Rabu', 
      jamMulai: '10:20', 
      jamSelesai: '12:00',
      kodeMK: 'PB T4254',
      namaMK: 'Pelayanan Pastoral II',
      dosenName: 'Dafit Mei Dianto',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KK T2214',
      namaMK: 'Bahasa Ibrani II',
      dosenName: 'Tabita Todingbua',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KK P2253',
      namaMK: 'Psikologi Pendidikan',
      dosenName: 'Dr. FX. Jeffry Harimurti',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '08:00', 
      jamSelesai: '09:40',
      kodeMK: 'KK 4225',
      namaMK: 'Tafsir PL I',
      dosenName: 'John Marlin',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'PB P2234',
      namaMK: 'Bimbingan Konseling',
      dosenName: 'Dr. Sutoyo',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '10:00', 
      jamSelesai: '11:40',
      kodeMK: 'KK 4228',
      namaMK: 'Tafsir PB I',
      dosenName: 'John Marlin',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '14:00', 
      jamSelesai: '16:30',
      kodeMK: 'PK 2202',
      namaMK: 'Komunikasi',
      dosenName: 'Agus Silo Witrasno',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'KK P4263',
      namaMK: 'Media Pembelajaran PAK',
      dosenName: 'Dr. Rianto',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Kamis', 
      jamMulai: '14:00', 
      jamSelesai: '15:40',
      kodeMK: 'PB T4246',
      namaMK: 'Pastoral Konseling',
      dosenName: 'Paulus Setyo Pramono',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Sabtu', 
      jamMulai: '18:00', 
      jamSelesai: '19:40',
      kodeMK: 'BB 6674',
      namaMK: 'PPL',
      dosenName: 'Orance Amelia Neonane',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Sabtu', 
      jamMulai: '18:00', 
      jamSelesai: '19:40',
      kodeMK: 'BB 6674',
      namaMK: 'PPL',
      dosenName: 'Fajar Dani Eko Mei Setiawan',
      ruangan: ruanganTeologi1
    },
    { 
      hari: 'Sabtu', 
      jamMulai: '17:00', 
      jamSelesai: '18:40',
      kodeMK: 'BB 8675',
      namaMK: 'Skrispi',
      dosenName: 'Dr. Sutoyo',
      ruangan: ruanganPAK1
    },
    { 
      hari: 'Sabtu', 
      jamMulai: '17:00', 
      jamSelesai: '18:40',
      kodeMK: 'BB 8675',
      namaMK: 'Skrispi',
      dosenName: 'Dafit Mei Dianto',
      ruangan: ruanganTeologi1
    },
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const kelas of kelasData) {
    const mataKuliah = findMataKuliahByKode(kelas.kodeMK);
    const dosen = findDosenByName(kelas.dosenName);

    if (!mataKuliah) {
      console.log(`⚠️  SKIP: Mata Kuliah '${kelas.kodeMK}' (${kelas.namaMK}) tidak ditemukan`);
      skipCount++;
      continue;
    }

    if (!dosen) {
      console.log(`⚠️  SKIP: Dosen '${kelas.dosenName}' tidak ditemukan`);
      skipCount++;
      continue;
    }

    try {
      await prisma.kelasMataKuliah.create({
        data: {
          mkId: mataKuliah.id,
          semesterId: semester.id,
          dosenId: dosen.id,
          hari: kelas.hari,
          jamMulai: kelas.jamMulai,
          jamSelesai: kelas.jamSelesai,
          ruanganId: kelas.ruangan.id,
          kuotaMax: 30,
          keterangan: 'Semester Genap 2025/2026',
        },
      });
      successCount++;
      console.log(`   ✅ ${kelas.hari} ${kelas.jamMulai} - ${mataKuliah.namaMK}`);
    } catch (error) {
      console.log(`   ❌ Error creating kelas ${kelas.namaMK}:`, error);
      skipCount++;
    }
  }

  console.log('');
  console.log('🎉 SEED KELAS COMPLETED!');
  console.log('');
  console.log('📊 SUMMARY:');
  console.log(`   ✅ ${successCount} Kelas created successfully`);
  console.log(`   ⚠️  ${skipCount} Kelas skipped (missing data)`);
  console.log('');
}
main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });