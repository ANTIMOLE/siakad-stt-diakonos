import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper functions
function getNilaiHuruf(nilaiAngka: number): string {
  if (nilaiAngka >= 85) return 'A';
  if (nilaiAngka >= 80) return 'AB';
  if (nilaiAngka >= 75) return 'B';
  if (nilaiAngka >= 70) return 'BC';
  if (nilaiAngka >= 65) return 'C';
  if (nilaiAngka >= 60) return 'CD';
  if (nilaiAngka >= 55) return 'D';
  if (nilaiAngka >= 50) return 'DE';
  return 'E';
}

function getBobot(nilaiHuruf: string): number {
  const bobotMap: Record<string, number> = {
    'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5,
    'C': 2.0, 'CD': 1.5, 'D': 1.0, 'DE': 0.5, 'E': 0.0,
  };
  return bobotMap[nilaiHuruf] || 0;
}

function randomGrade(min: number = 65, max: number = 95): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAttendanceStatus(): string {
  const rand = Math.random();
  if (rand < 0.80) return 'HADIR';
  if (rand < 0.90) return 'IZIN';
  if (rand < 0.95) return 'SAKIT';
  return 'ALPHA';
}

async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');

  const tables = [
    'presensi_detail', 'presensi', 'pembayaran', 'khs', 'nilai',
    'krs_detail', 'krs', 'paket_krs_detail', 'paket_krs',
    'kelas_mk_file', 'kelas_mata_kuliah', 'mata_kuliah', 
    'semester', 'ruangan', 'mahasiswa', 'dosen', 'users', 
    'program_studi', 'audit_log',
  ];

  try {
    // ✅ MYSQL: Disable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of tables) {
      try {
        // ✅ MYSQL: TRUNCATE syntax (no RESTART IDENTITY)
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
        console.log(`✓ Cleaned ${table}`);
      } catch (error: any) {
        console.log(`⚠ Error cleaning ${table}:`, error.message);
      }
    }

    // ✅ MYSQL: Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('\n✅ Database cleaned successfully!\n');
  } catch (error: any) {
    console.error('❌ Error in cleanDatabase:', error.message);
    throw error;
  }
}

async function main() {
  await cleanDatabase();
  console.log('🌱 Starting seed...\n');

  // ============================================
  // 1. PROGRAM STUDI
  // ============================================
  console.log('📚 Seeding Program Studi...');
  const prodiTEO = await prisma.programStudi.create({
    data: { kode: 'TEO', nama: 'Teologi', jenjang: 'S1', isActive: true },
  });
  const prodiPAK = await prisma.programStudi.create({
    data: { kode: 'PAK', nama: 'Pendidikan Agama Kristen', jenjang: 'S1', isActive: true },
  });
  console.log('✅ 2 Program Studi created\n');

  // ============================================
  // 2. USERS - ADMIN & KEUANGAN
  // ============================================
  console.log('👤 Seeding Admin & Keuangan...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: { username: 'admin', password: hashedPassword, role: 'ADMIN', isActive: true },
  });
  const keuanganUser = await prisma.user.create({
    data: { username: 'keuangan', password: hashedPassword, role: 'KEUANGAN', isActive: true },
  });
  console.log('✅ Admin & Keuangan created\n');

  // ============================================
  // 3. DOSEN (5 dosen)
  // ============================================
  console.log('👨‍🏫 Seeding Dosen...');
  const dosenData = [
    { nidn: '0101018901', nuptk: '1234567890123456', nama: 'Dr. Andreas Sitorus, M.Th', prodi: prodiTEO.id, username: 'dosen1' },
    { nidn: '0102028902', nuptk: '1234567890123457', nama: 'Dr. Maria Simanjuntak, M.Div', prodi: prodiTEO.id, username: 'dosen2' },
    { nidn: '0103038903', nuptk: '1234567890123458', nama: 'Pdt. Yohanes Hutabarat, M.Th', prodi: prodiTEO.id, username: 'dosen3' },
    { nidn: '0104048904', nuptk: '1234567890123459', nama: 'Dr. Ruth Siahaan, M.Pd.K', prodi: prodiPAK.id, username: 'dosen4' },
    { nidn: '0105058905', nuptk: '1234567890123460', nama: 'Pdt. Daniel Manurung, M.Pd.K', prodi: prodiPAK.id, username: 'dosen5' },
  ];

  const dosens = [];
  for (const d of dosenData) {
    const user = await prisma.user.create({
      data: { username: d.username, password: hashedPassword, role: 'DOSEN', isActive: true },
    });
    const dosen = await prisma.dosen.create({
      data: {
        userId: user.id, nidn: d.nidn, nuptk: d.nuptk, namaLengkap: d.nama,
        prodiId: d.prodi, posisi: 'Dosen Tetap', jafung: 'Lektor',
        alumni: 'STT Diakonos', lamaMengajar: '5 tahun', status: 'AKTIF',
      },
    });
    dosens.push(dosen);
  }
  console.log('✅ 5 Dosen created\n');

  // ============================================
  // 4. MAHASISWA (15 mahasiswa)
  // ============================================
  console.log('👨‍🎓 Seeding Mahasiswa...');
  const mahasiswaData = [
    // Angkatan 2024 - TEO (5)
    { nim: '2024010001', nama: 'Samuel Pakpahan', prodi: prodiTEO.id, angkatan: 2024, wali: dosens[0].id },
    { nim: '2024010002', nama: 'Debora Simbolon', prodi: prodiTEO.id, angkatan: 2024, wali: dosens[1].id },
    { nim: '2024010003', nama: 'Hosea Lumban Gaol', prodi: prodiTEO.id, angkatan: 2024, wali: dosens[2].id },
    { nim: '2024010004', nama: 'Ester Nainggolan', prodi: prodiTEO.id, angkatan: 2024, wali: dosens[0].id },
    { nim: '2024010005', nama: 'Timotius Sihombing', prodi: prodiTEO.id, angkatan: 2024, wali: dosens[1].id },
    // Angkatan 2024 - PAK (5)
    { nim: '2024020001', nama: 'Rut Simamora', prodi: prodiPAK.id, angkatan: 2024, wali: dosens[3].id },
    { nim: '2024020002', nama: 'Daud Hutajulu', prodi: prodiPAK.id, angkatan: 2024, wali: dosens[4].id },
    { nim: '2024020003', nama: 'Sara Napitupulu', prodi: prodiPAK.id, angkatan: 2024, wali: dosens[3].id },
    { nim: '2024020004', nama: 'Stefanus Panjaitan', prodi: prodiPAK.id, angkatan: 2024, wali: dosens[4].id },
    { nim: '2024020005', nama: 'Lidia Situmorang', prodi: prodiPAK.id, angkatan: 2024, wali: dosens[3].id },
    // Angkatan 2023 - TEO (3)
    { nim: '2023010001', nama: 'Petrus Sinaga', prodi: prodiTEO.id, angkatan: 2023, wali: dosens[0].id },
    { nim: '2023010002', nama: 'Hana Sitompul', prodi: prodiTEO.id, angkatan: 2023, wali: dosens[1].id },
    { nim: '2023010003', nama: 'Yakub Hutapea', prodi: prodiTEO.id, angkatan: 2023, wali: dosens[2].id },
    // Angkatan 2023 - PAK (2)
    { nim: '2023020001', nama: 'Maria Sirait', prodi: prodiPAK.id, angkatan: 2023, wali: dosens[3].id },
    { nim: '2023020002', nama: 'Yosua Tamba', prodi: prodiPAK.id, angkatan: 2023, wali: dosens[4].id },
  ];

  const mahasiswas = [];
  for (const m of mahasiswaData) {
    const user = await prisma.user.create({
      data: { password: hashedPassword, role: 'MAHASISWA', isActive: true },
    });
    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        userId: user.id, nim: m.nim, namaLengkap: m.nama, prodiId: m.prodi,
        angkatan: m.angkatan, dosenWaliId: m.wali, status: 'AKTIF',
        jenisKelamin: 'L', tempatTanggalLahir: 'Jakarta, 01 Januari 2000', alamat: 'Jakarta',
      },
    });
    mahasiswas.push(mahasiswa);
  }
  console.log('✅ 15 Mahasiswa created (5 TEO + 5 PAK Angkatan 2024, 3 TEO + 2 PAK Angkatan 2023)\n');

  // ============================================
  // 5. RUANGAN
  // ============================================
  console.log('🏫 Seeding Ruangan...');
  const ruangans = await Promise.all([
    prisma.ruangan.create({ data: { nama: 'Teologi 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'Teologi 2', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 2', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'Aula', kapasitas: 50 } }),
    prisma.ruangan.create({ data: { nama: 'Lab Komputer', kapasitas: 25 } }),
  ]);
  console.log('✅ 6 Ruangan created\n');

  // ============================================
  // 6. MATA KULIAH (30 MK)
  // ============================================
  console.log('📖 Seeding Mata Kuliah...');
  const mataKuliahData = [
    // Semester 1 (8 MK)
    { kode: 'TEO101', nama: 'Pengantar Teologi', sks: 3, semester: 1 },
    { kode: 'TEO102', nama: 'Bahasa Ibrani I', sks: 2, semester: 1 },
    { kode: 'TEO103', nama: 'Perjanjian Lama I', sks: 3, semester: 1 },
    { kode: 'TEO104', nama: 'Sejarah Gereja I', sks: 3, semester: 1 },
    { kode: 'TEO105', nama: 'Hermeneutika Dasar', sks: 2, semester: 1 },
    { kode: 'TEO106', nama: 'Pengantar Filsafat', sks: 3, semester: 1 },
    { kode: 'TEO107', nama: 'Etika Kristen Dasar', sks: 2, semester: 1 },
    { kode: 'TEO108', nama: 'Ibadah Kristen', sks: 2, semester: 1 },
    // Semester 2 (8 MK)
    { kode: 'TEO201', nama: 'Teologi Sistematika I', sks: 3, semester: 2 },
    { kode: 'TEO202', nama: 'Bahasa Ibrani II', sks: 2, semester: 2 },
    { kode: 'TEO203', nama: 'Perjanjian Lama II', sks: 3, semester: 2 },
    { kode: 'TEO204', nama: 'Perjanjian Baru I', sks: 3, semester: 2 },
    { kode: 'TEO205', nama: 'Bahasa Yunani I', sks: 2, semester: 2 },
    { kode: 'TEO206', nama: 'Homiletika I', sks: 3, semester: 2 },
    { kode: 'TEO207', nama: 'Counseling Dasar', sks: 2, semester: 2 },
    { kode: 'TEO208', nama: 'Musik Gereja', sks: 2, semester: 2 },
    // Semester 3 (7 MK)
    { kode: 'TEO301', nama: 'Teologi Sistematika II', sks: 3, semester: 3 },
    { kode: 'TEO302', nama: 'Perjanjian Baru II', sks: 3, semester: 3 },
    { kode: 'TEO303', nama: 'Bahasa Yunani II', sks: 2, semester: 3 },
    { kode: 'TEO304', nama: 'Homiletika II', sks: 3, semester: 3 },
    { kode: 'TEO305', nama: 'Misiologi I', sks: 3, semester: 3 },
    { kode: 'TEO306', nama: 'Pendidikan Agama Kristen I', sks: 3, semester: 3 },
    { kode: 'TEO307', nama: 'Teologi Pastoral', sks: 2, semester: 3 },
    // Semester 4 (7 MK)
    { kode: 'TEO401', nama: 'Teologi Sistematika III', sks: 3, semester: 4 },
    { kode: 'TEO402', nama: 'Eksegesis PL', sks: 3, semester: 4 },
    { kode: 'TEO403', nama: 'Eksegesis PB', sks: 3, semester: 4 },
    { kode: 'TEO404', nama: 'Misiologi II', sks: 3, semester: 4 },
    { kode: 'TEO405', nama: 'Pendidikan Agama Kristen II', sks: 3, semester: 4 },
    { kode: 'TEO406', nama: 'Apologetika', sks: 2, semester: 4 },
    { kode: 'TEO407', nama: 'Kepemimpinan Kristen', sks: 3, semester: 4 },
  ];

  const mataKuliahs = [];
  for (const mk of mataKuliahData) {
    const created = await prisma.mataKuliah.create({
      data: {
        kodeMK: mk.kode,
        namaMK: mk.nama,
        sks: mk.sks,
        semesterIdeal: mk.semester,
        isActive: true,
      },
    });
    mataKuliahs.push(created);
  }
  console.log(`✅ ${mataKuliahs.length} Mata Kuliah created\n`);

  // ============================================
  // 7. SEMESTER (4 semester)
  // ============================================
  console.log('📅 Seeding Semester...');
  console.log('   Timeline: PAST → PRESENT → FUTURE\n');
  
  const semester1 = await prisma.semester.create({
    data: {
      tahunAkademik: '2024/2025',
      periode: 'GANJIL',
      tanggalMulai: new Date('2024-08-01'),
      tanggalSelesai: new Date('2024-12-31'),
      periodeKRSMulai: new Date('2024-07-15'),
      periodeKRSSelesai: new Date('2024-08-15'),
      periodePerbaikanKRSMulai: new Date('2024-08-16'),
      periodePerbaikanKRSSelesai: new Date('2024-08-25'),
      isActive: false,
    },
  });
  console.log('   ✓ 2024/2025 GANJIL (COMPLETED)');

  const semester2 = await prisma.semester.create({
    data: {
      tahunAkademik: '2024/2025',
      periode: 'GENAP',
      tanggalMulai: new Date('2025-01-15'),
      tanggalSelesai: new Date('2025-06-15'),
      periodeKRSMulai: new Date('2025-01-01'),
      periodeKRSSelesai: new Date('2025-01-31'),
      periodePerbaikanKRSMulai: new Date('2025-02-01'),
      periodePerbaikanKRSSelesai: new Date('2025-02-10'),
      isActive: false,
    },
  });
  console.log('   ✓ 2024/2025 GENAP (COMPLETED)');

  const semester3 = await prisma.semester.create({
    data: {
      tahunAkademik: '2025/2026',
      periode: 'GANJIL',
      tanggalMulai: new Date('2025-08-01'),
      tanggalSelesai: new Date('2025-12-31'),
      periodeKRSMulai: new Date('2025-07-15'),
      periodeKRSSelesai: new Date('2025-08-15'),
      periodePerbaikanKRSMulai: new Date('2025-08-16'),
      periodePerbaikanKRSSelesai: new Date('2025-08-25'),
      isActive: true,
    },
  });
  console.log('   ✓ 2025/2026 GANJIL (ACTIVE ✅)');

  const semester4 = await prisma.semester.create({
    data: {
      tahunAkademik: '2025/2026',
      periode: 'GENAP',
      tanggalMulai: new Date('2026-01-15'),
      tanggalSelesai: new Date('2026-06-15'),
      periodeKRSMulai: new Date('2026-01-01'),
      periodeKRSSelesai: new Date('2026-01-31'),
      periodePerbaikanKRSMulai: new Date('2026-02-01'),
      periodePerbaikanKRSSelesai: new Date('2026-02-10'),
      isActive: false,
    },
  });
  console.log('   ✓ 2025/2026 GENAP (FUTURE)\n');
  console.log('✅ 4 Semester created\n');

  // ============================================
  // 8. KELAS MATA KULIAH (NO CONFLICTS!)
  // ============================================
  console.log('🎓 Seeding Kelas Mata Kuliah (NO SCHEDULE CONFLICTS)...');
  
  const mkSem1 = mataKuliahs.filter(mk => mk.semesterIdeal === 1);
  const mkSem2 = mataKuliahs.filter(mk => mk.semesterIdeal === 2);
  const mkSem3 = mataKuliahs.filter(mk => mk.semesterIdeal === 3);
  const mkSem4 = mataKuliahs.filter(mk => mk.semesterIdeal === 4);

  const jadwalHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const jadwalJam = [
    { mulai: '08:00', selesai: '10:00' },
    { mulai: '10:00', selesai: '12:00' },
    { mulai: '13:00', selesai: '15:00' },
    { mulai: '15:00', selesai: '17:00' },
  ];

  let globalJadwalIdx = 0;
  const allKelas: any[] = [];

  // Semester 1 (2024/2025 GANJIL) - COMPLETED
  for (const mk of mkSem1) {
    const dosen = dosens[globalJadwalIdx % dosens.length];
    const ruangan = ruangans[globalJadwalIdx % ruangans.length];
    const hari = jadwalHari[Math.floor(globalJadwalIdx / jadwalJam.length) % jadwalHari.length];
    const jam = jadwalJam[globalJadwalIdx % jadwalJam.length];

    const kelas = await prisma.kelasMataKuliah.create({
      data: {
        mkId: mk.id,
        semesterId: semester1.id,
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari,
        jamMulai: jam.mulai,
        jamSelesai: jam.selesai,
        kuotaMax: 30,
      },
    });
    allKelas.push({ kelas, akademikSemester: semester1 });
    globalJadwalIdx++;
  }
  console.log(`   ✓ ${mkSem1.length} classes for 2024/2025 GANJIL`);

  // Semester 2 (2024/2025 GENAP) - COMPLETED
  for (const mk of mkSem2) {
    const dosen = dosens[globalJadwalIdx % dosens.length];
    const ruangan = ruangans[globalJadwalIdx % ruangans.length];
    const hari = jadwalHari[Math.floor(globalJadwalIdx / jadwalJam.length) % jadwalHari.length];
    const jam = jadwalJam[globalJadwalIdx % jadwalJam.length];

    const kelas = await prisma.kelasMataKuliah.create({
      data: {
        mkId: mk.id,
        semesterId: semester2.id,
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari,
        jamMulai: jam.mulai,
        jamSelesai: jam.selesai,
        kuotaMax: 30,
      },
    });
    allKelas.push({ kelas, akademikSemester: semester2 });
    globalJadwalIdx++;
  }
  console.log(`   ✓ ${mkSem2.length} classes for 2024/2025 GENAP`);

  // Semester 3 (2025/2026 GANJIL) - ACTIVE
  for (const mk of mkSem3) {
    const dosen = dosens[globalJadwalIdx % dosens.length];
    const ruangan = ruangans[globalJadwalIdx % ruangans.length];
    const hari = jadwalHari[Math.floor(globalJadwalIdx / jadwalJam.length) % jadwalHari.length];
    const jam = jadwalJam[globalJadwalIdx % jadwalJam.length];

    const kelas = await prisma.kelasMataKuliah.create({
      data: {
        mkId: mk.id,
        semesterId: semester3.id,
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari,
        jamMulai: jam.mulai,
        jamSelesai: jam.selesai,
        kuotaMax: 30,
      },
    });
    allKelas.push({ kelas, akademikSemester: semester3 });
    globalJadwalIdx++;
  }
  console.log(`   ✓ ${mkSem3.length} classes for 2025/2026 GANJIL (ACTIVE)`);

  // Semester 4 (2025/2026 GENAP) - FUTURE
  for (const mk of mkSem4) {
    const dosen = dosens[globalJadwalIdx % dosens.length];
    const ruangan = ruangans[globalJadwalIdx % ruangans.length];
    const hari = jadwalHari[Math.floor(globalJadwalIdx / jadwalJam.length) % jadwalHari.length];
    const jam = jadwalJam[globalJadwalIdx % jadwalJam.length];

    const kelas = await prisma.kelasMataKuliah.create({
      data: {
        mkId: mk.id,
        semesterId: semester4.id,
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari,
        jamMulai: jam.mulai,
        jamSelesai: jam.selesai,
        kuotaMax: 30,
      },
    });
    allKelas.push({ kelas, akademikSemester: semester4 });
    globalJadwalIdx++;
  }
  console.log(`   ✓ ${mkSem4.length} classes for 2025/2026 GENAP (FUTURE)`);
  console.log(`✅ ${allKelas.length} Kelas total (NO CONFLICTS)\n`);

  // ============================================
  // 9. PAKET KRS (FULL TEO + PAK SUPPORT!)
  // ============================================
  console.log('📦 Seeding Paket KRS (BOTH TEO & PAK)...');
  
  const kelas2024Sem1 = allKelas.filter(k => k.akademikSemester.id === semester1.id).map(k => k.kelas);
  const kelas2024Sem2 = allKelas.filter(k => k.akademikSemester.id === semester2.id).map(k => k.kelas);
  const kelas2024Sem3 = allKelas.filter(k => k.akademikSemester.id === semester3.id).map(k => k.kelas);

  // ========== ANGKATAN 2024 SEMESTER 1 ==========
  console.log('   Creating Angkatan 2024 Semester 1 pakets...');
  
  const paket2024Sem1TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 1 Teologi Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiTEO.id,
      semesterPaket: 1,
      semesterId: semester1.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem1) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem1TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2024Sem1PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 1 PAK Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 1,
      semesterId: semester1.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem1) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem1PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2024 Semester 1 (TEO & PAK)');

  // ========== ANGKATAN 2024 SEMESTER 2 ==========
  console.log('   Creating Angkatan 2024 Semester 2 pakets...');
  
  const paket2024Sem2TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 2 Teologi Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiTEO.id,
      semesterPaket: 2,
      semesterId: semester2.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem2) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem2TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2024Sem2PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 2 PAK Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 2,
      semesterId: semester2.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem2) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem2PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2024 Semester 2 (TEO & PAK)');

  // ========== ANGKATAN 2024 SEMESTER 3 (ACTIVE) ==========
  console.log('   Creating Angkatan 2024 Semester 3 pakets (ACTIVE)...');
  
  const paket2024Sem3TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 Teologi Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiTEO.id,
      semesterPaket: 3,
      semesterId: semester3.id,
      totalSKS: 19,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem3) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem3TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2024Sem3PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 PAK Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 3,
      semesterId: semester3.id,
      totalSKS: 19,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem3) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2024Sem3PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2024 Semester 3 (TEO & PAK) - ACTIVE');

  // ========== ANGKATAN 2023 SEMESTER 3 ==========
  console.log('   Creating Angkatan 2023 Semester 3 pakets...');
  
  const paket2023Sem3TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 Teologi Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiTEO.id,
      semesterPaket: 3,
      semesterId: semester1.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem1) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem3TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2023Sem3PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 PAK Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiPAK.id,
      semesterPaket: 3,
      semesterId: semester1.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem1) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem3PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2023 Semester 3 (TEO & PAK)');

  // ========== ANGKATAN 2023 SEMESTER 4 ==========
  console.log('   Creating Angkatan 2023 Semester 4 pakets...');
  
  const paket2023Sem4TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 4 Teologi Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiTEO.id,
      semesterPaket: 4,
      semesterId: semester2.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem2) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem4TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2023Sem4PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 4 PAK Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiPAK.id,
      semesterPaket: 4,
      semesterId: semester2.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem2) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem4PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2023 Semester 4 (TEO & PAK)');

  // ========== ANGKATAN 2023 SEMESTER 5 (ACTIVE) ==========
  console.log('   Creating Angkatan 2023 Semester 5 pakets (ACTIVE)...');
  
  const paket2023Sem5TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 5 Teologi Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiTEO.id,
      semesterPaket: 5,
      semesterId: semester3.id,
      totalSKS: 19,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem3) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem5TEO.id, kelasMKId: kelas.id },
    });
  }

  const paket2023Sem5PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 5 PAK Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiPAK.id,
      semesterPaket: 5,
      semesterId: semester3.id,
      totalSKS: 19,
      createdById: adminUser.id,
    },
  });
  for (const kelas of kelas2024Sem3) {
    await prisma.paketKRSDetail.create({
      data: { paketKRSId: paket2023Sem5PAK.id, kelasMKId: kelas.id },
    });
  }
  console.log('   ✓ Angkatan 2023 Semester 5 (TEO & PAK) - ACTIVE');

  console.log('✅ Paket KRS created (12 pakets total: 6 TEO + 6 PAK)\n');

  // ============================================
  // 10. KRS (PRODI-AWARE ASSIGNMENT!)
  // ============================================
  console.log('📝 Seeding KRS (PRODI-AWARE, only COMPLETED semesters)...');
  
  // Angkatan 2024 - Semester 1 & 2
  for (let i = 0; i < 10; i++) {
    const mhs = mahasiswas[i];

    const paketSem1 = mhs.prodiId === prodiTEO.id ? paket2024Sem1TEO : paket2024Sem1PAK;
    const paketSem2 = mhs.prodiId === prodiTEO.id ? paket2024Sem2TEO : paket2024Sem2PAK;

    // Semester 1
    const krs1 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester1.id,
        paketKRSId: paketSem1.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2024-07-20'),
        tanggalApproval: new Date('2024-07-25'),
        approvedById: mhs.dosenWaliId,
      },
    });
    for (const kelas of kelas2024Sem1) {
      await prisma.kRSDetail.create({
        data: { krsId: krs1.id, kelasMKId: kelas.id },
      });
    }

    // Semester 2
    const krs2 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester2.id,
        paketKRSId: paketSem2.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2025-01-05'),
        tanggalApproval: new Date('2025-01-10'),
        approvedById: mhs.dosenWaliId,
      },
    });
    for (const kelas of kelas2024Sem2) {
      await prisma.kRSDetail.create({
        data: { krsId: krs2.id, kelasMKId: kelas.id },
      });
    }
  }

  // Angkatan 2023 - Semester 3 & 4
  for (let i = 10; i < 15; i++) {
    const mhs = mahasiswas[i];

    const paketSem3 = mhs.prodiId === prodiTEO.id ? paket2023Sem3TEO : paket2023Sem3PAK;
    const paketSem4 = mhs.prodiId === prodiTEO.id ? paket2023Sem4TEO : paket2023Sem4PAK;

    // Their Sem 3 (2024/2025 GANJIL)
    const krs1 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester1.id,
        paketKRSId: paketSem3.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2024-07-20'),
        tanggalApproval: new Date('2024-07-25'),
        approvedById: mhs.dosenWaliId,
      },
    });
    for (const kelas of kelas2024Sem1) {
      await prisma.kRSDetail.create({
        data: { krsId: krs1.id, kelasMKId: kelas.id },
      });
    }

    // Their Sem 4 (2024/2025 GENAP)
    const krs2 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester2.id,
        paketKRSId: paketSem4.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2025-01-05'),
        tanggalApproval: new Date('2025-01-10'),
        approvedById: mhs.dosenWaliId,
      },
    });
    for (const kelas of kelas2024Sem2) {
      await prisma.kRSDetail.create({
        data: { krsId: krs2.id, kelasMKId: kelas.id },
      });
    }
  }

  console.log('✅ KRS created (30 total: 20 Angkatan 2024 + 10 Angkatan 2023)\n');

  // ============================================
  // 11. NILAI
  // ============================================
  console.log('💯 Seeding Nilai...');
  const allKRS = await prisma.kRS.findMany({
    where: { status: 'APPROVED' },
    include: { detail: true },
  });

  for (const krs of allKRS) {
    for (const detail of krs.detail) {
      const nilaiAngka = randomGrade();
      const nilaiHuruf = getNilaiHuruf(nilaiAngka);
      const bobot = getBobot(nilaiHuruf);

      await prisma.nilai.create({
        data: {
          mahasiswaId: krs.mahasiswaId,
          kelasMKId: detail.kelasMKId,
          semesterId: krs.semesterId,
          nilaiAngka,
          nilaiHuruf: nilaiHuruf as any,
          bobot,
          isFinalized: true,
          inputById: dosens[0].userId,
        },
      });
    }
  }
  console.log('✅ Nilai created\n');

  // ============================================
  // 12. KHS
  // ============================================
  console.log('📊 Seeding KHS...');
  for (const mhs of mahasiswas) {
    const mhsKRS = allKRS.filter(k => k.mahasiswaId === mhs.id);

    let totalBobotKumulatif = 0;
    let totalSKSKumulatif = 0;

    for (const krs of mhsKRS) {
      const nilaiSemester = await prisma.nilai.findMany({
        where: { mahasiswaId: mhs.id, semesterId: krs.semesterId },
        include: { kelasMK: { include: { mataKuliah: true } } },
      });

      let totalBobotSemester = 0;
      let totalSKSSemester = 0;

      for (const n of nilaiSemester) {
        const sks = n.kelasMK.mataKuliah.sks;
        const bobot = Number(n.bobot || 0);
        totalBobotSemester += bobot * sks;
        totalSKSSemester += sks;
      }

      totalBobotKumulatif += totalBobotSemester;
      totalSKSKumulatif += totalSKSSemester;

      const ips = totalSKSSemester > 0 ? totalBobotSemester / totalSKSSemester : 0;
      const ipk = totalSKSKumulatif > 0 ? totalBobotKumulatif / totalSKSKumulatif : 0;

      await prisma.kHS.create({
        data: {
          mahasiswaId: mhs.id,
          semesterId: krs.semesterId,
          ips: ips.toFixed(2),
          ipk: ipk.toFixed(2),
          totalSKSSemester,
          totalSKSKumulatif,
        },
      });
    }
  }
  console.log('✅ KHS created\n');

  // ============================================
  // 13. PEMBAYARAN
  // ============================================
  console.log('💰 Seeding Pembayaran...');
  for (const mhs of mahasiswas) {
    const mhsKRS = allKRS.filter(k => k.mahasiswaId === mhs.id);

    for (const krs of mhsKRS) {
      await prisma.pembayaran.create({
        data: {
          mahasiswaId: mhs.id,
          semesterId: krs.semesterId,
          jenisPembayaran: 'KRS',
          nominal: 1000000,
          buktiUrl: '/uploads/bukti-dummy.jpg',
          status: 'APPROVED',
          verifiedById: keuanganUser.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.pembayaran.create({
        data: {
          mahasiswaId: mhs.id,
          semesterId: krs.semesterId,
          jenisPembayaran: 'TENGAH_SEMESTER',
          nominal: 500000,
          buktiUrl: '/uploads/bukti-dummy.jpg',
          status: 'APPROVED',
          verifiedById: keuanganUser.id,
          verifiedAt: new Date(),
        },
      });
    }
  }
  console.log('✅ Pembayaran created\n');

  // ============================================
  // 14. PRESENSI
  // ============================================
  console.log('✅ Seeding Presensi...');
  const completedKelas = allKelas
    .filter(k => k.akademikSemester.id === semester1.id || k.akademikSemester.id === semester2.id)
    .map(k => k.kelas);

  for (const kelas of completedKelas) {
    const studentsInClass = await prisma.kRSDetail.findMany({
      where: { kelasMKId: kelas.id },
      include: { krs: true },
    });

    const totalPertemuan = 14 + Math.floor(Math.random() * 3);

    for (let p = 1; p <= totalPertemuan; p++) {
      const presensi = await prisma.presensi.create({
        data: {
          kelasMKId: kelas.id,
          pertemuan: p,
          tanggal: new Date(2024, 7, p * 7),
          materi: `Materi Pertemuan ${p}`,
          catatan: `Pertemuan ke-${p}`,
        },
      });

      for (const student of studentsInClass) {
        await prisma.presensiDetail.create({
          data: {
            presensiId: presensi.id,
            mahasiswaId: student.krs.mahasiswaId,
            status: randomAttendanceStatus() as any,
          },
        });
      }
    }
  }
  console.log('✅ Presensi created\n');

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ULTIMATE PERFECT SEED COMPLETED! (MySQL Edition)');
  console.log('='.repeat(70));
  console.log('📊 SUMMARY:');
  console.log('-'.repeat(70));
  console.log('Master Data:');
  console.log('  ✅ 2 Program Studi (TEO, PAK)');
  console.log('  ✅ 5 Dosen + 1 Admin + 1 Keuangan');
  console.log('  ✅ 15 Mahasiswa:');
  console.log('     • Angkatan 2024: 5 TEO + 5 PAK = 10 students');
  console.log('     • Angkatan 2023: 3 TEO + 2 PAK = 5 students');
  console.log('  ✅ 6 Ruangan');
  console.log('  ✅ 30 Mata Kuliah (8 Sem1 + 8 Sem2 + 7 Sem3 + 7 Sem4)');
  console.log('');
  console.log('Academic Timeline:');
  console.log('  ✅ 2024/2025 GANJIL   - COMPLETED (has KRS/Nilai/KHS/Pembayaran)');
  console.log('  ✅ 2024/2025 GENAP    - COMPLETED (has KRS/Nilai/KHS/Pembayaran)');
  console.log('  🔴 2025/2026 GANJIL   - ACTIVE (pakets ready, NO KRS assigned yet)');
  console.log('  ⏳ 2025/2026 GENAP    - FUTURE (pakets ready, NO KRS assigned yet)');
  console.log('');
  console.log('Paket KRS:');
  console.log('  ✅ 12 Paket Total (6 TEO + 6 PAK):');
  console.log('     • Angkatan 2024: Sem 1-3 (3 pakets × 2 prodi = 6)');
  console.log('     • Angkatan 2023: Sem 3-5 (3 pakets × 2 prodi = 6)');
  console.log('');
  console.log('KRS Assignment:');
  console.log('  ✅ 30 KRS Total (all APPROVED):');
  console.log('     • Angkatan 2024: 10 students × 2 semesters = 20 KRS');
  console.log('     • Angkatan 2023: 5 students × 2 semesters = 10 KRS');
  console.log('  ✅ PRODI-AWARE: Each student assigned to correct paket (TEO/PAK)');
  console.log('');
  console.log('✅ MYSQL-SPECIFIC FIXES APPLIED:');
  console.log('  ✅ Foreign key checks handling (MySQL syntax)');
  console.log('  ✅ TRUNCATE without RESTART IDENTITY (MySQL compatible)');
  console.log('  ✅ Backtick table names for MySQL');
  console.log('  ✅ No schedule conflicts (global jadwal index)');
  console.log('  ✅ FULL PAK paket support (12 pakets: 6 TEO + 6 PAK)');
  console.log('  ✅ Prodi-aware KRS assignment');
  console.log('='.repeat(70));
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('  Admin:         admin / password123');
  console.log('  Keuangan:      keuangan / password123');
  console.log('  Dosen TEO:     dosen1 / password123');
  console.log('  Dosen PAK:     dosen4 / password123');
  console.log('  Mahasiswa TEO: 2024010001 / password123');
  console.log('  Mahasiswa PAK: 2024020001 / password123');
  console.log('='.repeat(70));
  console.log('\n✨ MySQL Database seeded perfectly! ✨\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
