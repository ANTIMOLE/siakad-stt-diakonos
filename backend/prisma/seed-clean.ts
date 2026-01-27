import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to convert nilai angka to huruf
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

// Helper function to convert nilai huruf to bobot
function getBobot(nilaiHuruf: string): number {
  const bobotMap: Record<string, number> = {
    'A': 4.0,
    'AB': 3.5,
    'B': 3.0,
    'BC': 2.5,
    'C': 2.0,
    'CD': 1.5,
    'D': 1.0,
    'DE': 0.5,
    'E': 0.0,
  };
  return bobotMap[nilaiHuruf] || 0;
}

// Helper to generate random grade
function randomGrade(min: number = 65, max: number = 95): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper for attendance status
function randomAttendanceStatus(): string {
  const rand = Math.random();
  if (rand < 0.80) return 'HADIR';
  if (rand < 0.90) return 'IZIN';
  if (rand < 0.95) return 'SAKIT';
  return 'ALPHA';
}

async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');

  // ✅ Use actual PostgreSQL table names (from @@map in schema)
  const tables = [
    'presensi_detail',
    'presensi',
    'pembayaran',
    'khs',
    'nilai',
    'krs_detail',
    'krs',
    'paket_krs_detail',
    'paket_krs',
    'kelas_mata_kuliah',
    'mata_kuliah',
    'semester',
    'ruangan',
    'mahasiswa',
    'dosen',
    'users',  // Note: "users" not "User"
    'program_studi',
    'audit_log',
  ];

  // Disable foreign key checks temporarily
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  // Truncate all tables and reset IDs
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`
      );
      console.log(`✓ Cleaned ${table}`);
    } catch (error: any) {
      console.log(`⚠ Error cleaning ${table}:`, error.message);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');

  console.log('\n✅ Database cleaned successfully!\n');
}

async function main() {
  // 🧹 CLEAN DATABASE FIRST
  await cleanDatabase();

  console.log('🌱 Starting seed...\n');

  // ============================================
  // 1. PROGRAM STUDI
  // ============================================
  console.log('📚 Seeding Program Studi...');
  const prodiTEO = await prisma.programStudi.create({
    data: {
      kode: 'TEO',
      nama: 'Teologi',
      jenjang: 'S1',
      isActive: true,
    },
  });

  const prodiPAK = await prisma.programStudi.create({
    data: {
      kode: 'PAK',
      nama: 'Pendidikan Agama Kristen',
      jenjang: 'S1',
      isActive: true,
    },
  });
  console.log('✅ Program Studi created\n');

  // ============================================
  // 2. USERS - ADMIN & KEUANGAN
  // ============================================
  console.log('👤 Seeding Admin & Keuangan...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const keuanganUser = await prisma.user.create({
    data: {
      username: 'keuangan',
      password: hashedPassword,
      role: 'KEUANGAN',
      isActive: true,
    },
  });
  console.log('✅ Admin & Keuangan created\n');

  // ============================================
  // 3. DOSEN (5 dosen)
  // ============================================
  console.log('👨‍🏫 Seeding Dosen...');
  
  const dosenData = [
    { nidn: '0101018901', nuptk: '1234567890123456', nama: 'Dr. Andreas Sitorus, M.Th', prodi: prodiTEO.id, username: 'dosen1' },
    { nidn: '0102028902', nuptk: '1234567890123457', nama: 'Dr. Maria Simanjuntak, M.Div', prodi: prodiTEO.id, username: 'dosen2' },
    { nidn: '0103038903', nuptk: '1234567890123458', nama: 'Pdt. Yohanes Hutabarat, M.Th', prodi: prodiTEO.id, username: null },
    { nidn: '0104048904', nuptk: '1234567890123459', nama: 'Dr. Ruth Siahaan, M.Pd.K', prodi: prodiPAK.id, username: null },
    { nidn: '0105058905', nuptk: '1234567890123460', nama: 'Pdt. Daniel Manurung, M.Pd.K', prodi: prodiPAK.id, username: null },
  ];

  const dosens = [];
  for (const d of dosenData) {
    const user = await prisma.user.create({
      data: {
        username: d.username,
        password: hashedPassword,
        role: 'DOSEN',
        isActive: true,
      },
    });

    const dosen = await prisma.dosen.create({
      data: {
        userId: user.id,
        nidn: d.nidn,
        nuptk: d.nuptk,
        namaLengkap: d.nama,
        prodiId: d.prodi,
        posisi: 'Dosen Tetap',
        jafung: 'Lektor',
        alumni: 'STT Diakonos',
        lamaMengajar: '5 tahun',
        status: 'AKTIF',
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
    // Angkatan 2024 - Teologi (5)
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
    // Angkatan 2023 - Teologi (3)
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
      data: {
        password: hashedPassword,
        role: 'MAHASISWA',
        isActive: true,
      },
    });

    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        userId: user.id,
        nim: m.nim,
        namaLengkap: m.nama,
        prodiId: m.prodi,
        angkatan: m.angkatan,
        dosenWaliId: m.wali,
        status: 'AKTIF',
        jenisKelamin: 'L',
        tempatTanggalLahir: 'Jakarta, 01 Januari 2000',
        alamat: 'Jakarta',
      },
    });
    mahasiswas.push(mahasiswa);
  }
  console.log('✅ 15 Mahasiswa created\n');

  // ============================================
  // 5. RUANGAN
  // ============================================
  console.log('🏫 Seeding Ruangan...');
  const ruangans = await Promise.all([
    prisma.ruangan.create({ data: { nama: 'Teologi 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'Teologi 2', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 2', kapasitas: 30 } }),
  ]);
  console.log('✅ 4 Ruangan created\n');

  // ============================================
  // 6. MATA KULIAH
  // ============================================
  console.log('📖 Seeding Mata Kuliah...');
  
  const mataKuliahData = [
    // Semester 1
    { kode: 'TEO101', nama: 'Pengantar Teologi', sks: 3, semester: 1 },
    { kode: 'TEO102', nama: 'Bahasa Ibrani I', sks: 2, semester: 1 },
    { kode: 'TEO103', nama: 'Perjanjian Lama I', sks: 3, semester: 1 },
    { kode: 'TEO104', nama: 'Sejarah Gereja I', sks: 3, semester: 1 },
    { kode: 'TEO105', nama: 'Hermeneutika Dasar', sks: 2, semester: 1 },
    { kode: 'TEO106', nama: 'Pengantar Filsafat', sks: 3, semester: 1 },
    { kode: 'TEO107', nama: 'Etika Kristen Dasar', sks: 2, semester: 1 },
    { kode: 'TEO108', nama: 'Ibadah Kristen', sks: 2, semester: 1 },
    
    // Semester 2
    { kode: 'TEO201', nama: 'Teologi Sistematika I', sks: 3, semester: 2 },
    { kode: 'TEO202', nama: 'Bahasa Ibrani II', sks: 2, semester: 2 },
    { kode: 'TEO203', nama: 'Perjanjian Lama II', sks: 3, semester: 2 },
    { kode: 'TEO204', nama: 'Perjanjian Baru I', sks: 3, semester: 2 },
    { kode: 'TEO205', nama: 'Bahasa Yunani I', sks: 2, semester: 2 },
    { kode: 'TEO206', nama: 'Homiletika I', sks: 3, semester: 2 },
    { kode: 'TEO207', nama: 'Counseling Dasar', sks: 2, semester: 2 },
    { kode: 'TEO208', nama: 'Musik Gereja', sks: 2, semester: 2 },
    
    // Semester 3
    { kode: 'TEO301', nama: 'Teologi Sistematika II', sks: 3, semester: 3 },
    { kode: 'TEO302', nama: 'Perjanjian Baru II', sks: 3, semester: 3 },
    { kode: 'TEO303', nama: 'Bahasa Yunani II', sks: 2, semester: 3 },
    { kode: 'TEO304', nama: 'Homiletika II', sks: 3, semester: 3 },
    { kode: 'TEO305', nama: 'Misiologi I', sks: 3, semester: 3 },
    { kode: 'TEO306', nama: 'Pendidikan Agama Kristen I', sks: 3, semester: 3 },
    { kode: 'TEO307', nama: 'Teologi Pastoral', sks: 2, semester: 3 },
    
    // Semester 4
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
  // 7. SEMESTER
  // ============================================
  console.log('📅 Seeding Semester...');
  
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
      isActive: true, // ✅ ACTIVE
    },
  });

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
  
  console.log('✅ 4 Semester created\n');

  // ============================================
  // 8. KELAS MATA KULIAH
  // ============================================
  console.log('🎓 Seeding Kelas Mata Kuliah...');
  
  // Get mata kuliah by semester
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

  const kelasData: any[] = [];
  let jadwalIdx = 0;

  // Create classes for Semester 1 (2024/2025 GANJIL)
  for (const mk of mkSem1) {
    const dosen = dosens[jadwalIdx % dosens.length];
    const ruangan = mk.kodeMK.includes('TEO') ? ruangans[jadwalIdx % 2] : ruangans[2 + (jadwalIdx % 2)];
    const hari = jadwalHari[jadwalIdx % jadwalHari.length];
    const jam = jadwalJam[Math.floor(jadwalIdx / jadwalHari.length) % jadwalJam.length];

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
    kelasData.push({ kelas, semester: 1 });
    jadwalIdx++;
  }

  // Create classes for Semester 2 (2024/2025 GENAP)
  jadwalIdx = 0;
  for (const mk of mkSem2) {
    const dosen = dosens[jadwalIdx % dosens.length];
    const ruangan = mk.kodeMK.includes('TEO') ? ruangans[jadwalIdx % 2] : ruangans[2 + (jadwalIdx % 2)];
    const hari = jadwalHari[jadwalIdx % jadwalHari.length];
    const jam = jadwalJam[Math.floor(jadwalIdx / jadwalHari.length) % jadwalJam.length];

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
    kelasData.push({ kelas, semester: 2 });
    jadwalIdx++;
  }

  // Create classes for Semester 3 (2025/2026 GANJIL - CURRENT)
  jadwalIdx = 0;
  for (const mk of mkSem3) {
    const dosen = dosens[jadwalIdx % dosens.length];
    const ruangan = mk.kodeMK.includes('TEO') ? ruangans[jadwalIdx % 2] : ruangans[2 + (jadwalIdx % 2)];
    const hari = jadwalHari[jadwalIdx % jadwalHari.length];
    const jam = jadwalJam[Math.floor(jadwalIdx / jadwalHari.length) % jadwalJam.length];

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
    kelasData.push({ kelas, semester: 3 });
    jadwalIdx++;
  }

  // Create classes for Semester 4 (future - for Sem 5 Angkatan 2023)
  jadwalIdx = 0;
  for (const mk of mkSem4) {
    const dosen = dosens[jadwalIdx % dosens.length];
    const ruangan = mk.kodeMK.includes('TEO') ? ruangans[jadwalIdx % 2] : ruangans[2 + (jadwalIdx % 2)];
    const hari = jadwalHari[jadwalIdx % jadwalHari.length];
    const jam = jadwalJam[Math.floor(jadwalIdx / jadwalHari.length) % jadwalJam.length];

    const kelas = await prisma.kelasMataKuliah.create({
      data: {
        mkId: mk.id,
        semesterId: semester3.id, // Using current semester for now
        dosenId: dosen.id,
        ruanganId: ruangan.id,
        hari,
        jamMulai: jam.mulai,
        jamSelesai: jam.selesai,
        kuotaMax: 30,
      },
    });
    kelasData.push({ kelas, semester: 4 });
    jadwalIdx++;
  }

  console.log(`✅ ${kelasData.length} Kelas Mata Kuliah created\n`);

  // ============================================
  // 9. PAKET KRS
  // ============================================
  console.log('📦 Seeding Paket KRS...');

  const sem1Classes = kelasData.filter(k => k.semester === 1).map(k => k.kelas);
  const sem2Classes = kelasData.filter(k => k.semester === 2).map(k => k.kelas);
  const sem3Classes = kelasData.filter(k => k.semester === 3).map(k => k.kelas);
  const sem4Classes = kelasData.filter(k => k.semester === 4).map(k => k.kelas);

  // Paket for Angkatan 2024, Semester 1
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

  // ✅ Add classes to Paket 2024 Sem 1 TEO
  for (const kelas of sem1Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem1TEO.id,
        kelasMKId: kelas.id,
      },
    });
  }

  // ✅ Also add to PAK paket
  for (const kelas of sem1Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem1PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

  // Paket for Angkatan 2024, Semester 2
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

  // ✅ Add classes to both TEO and PAK paket
  for (const kelas of sem2Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem2TEO.id,
        kelasMKId: kelas.id,
      },
    });
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem2PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

  // Paket for Angkatan 2024, Semester 3 (CURRENT - not assigned yet)
  const paket2024Sem3TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 Teologi Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiTEO.id,
      semesterPaket: 3,
      semesterId: semester3.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });

  const paket2024Sem3PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 3 PAK Angkatan 2024',
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 3,
      semesterId: semester3.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });

  // ✅ Add classes to both pakets
  for (const kelas of sem3Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem3TEO.id,
        kelasMKId: kelas.id,
      },
    });
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2024Sem3PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

  // Paket for Angkatan 2023
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

  // ✅ Add sem1 classes (as their semester 3)
  for (const kelas of sem1Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem3TEO.id,
        kelasMKId: kelas.id,
      },
    });
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem3PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

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

  // ✅ Add sem2 classes (as their semester 4)
  for (const kelas of sem2Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem4TEO.id,
        kelasMKId: kelas.id,
      },
    });
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem4PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

  const paket2023Sem5TEO = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 5 Teologi Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiTEO.id,
      semesterPaket: 5,
      semesterId: semester3.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });

  const paket2023Sem5PAK = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket Semester 5 PAK Angkatan 2023',
      angkatan: 2023,
      prodiId: prodiPAK.id,
      semesterPaket: 5,
      semesterId: semester3.id,
      totalSKS: 20,
      createdById: adminUser.id,
    },
  });

  // ✅ Add sem3 classes (as their semester 5)
  for (const kelas of sem3Classes) {
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem5TEO.id,
        kelasMKId: kelas.id,
      },
    });
    await prisma.paketKRSDetail.create({
      data: {
        paketKRSId: paket2023Sem5PAK.id,
        kelasMKId: kelas.id,
      },
    });
  }

  console.log('✅ Paket KRS created\n');

  // ============================================
  // 10. KRS (Only for completed semesters)
  // ============================================
  console.log('📝 Seeding KRS...');

  // Angkatan 2024 students - Semester 1 only
  for (let i = 0; i < 10; i++) {
    const mhs = mahasiswas[i];
    const paket = mhs.prodiId === prodiTEO.id ? paket2024Sem1TEO : paket2024Sem1PAK;

    const krs = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester1.id,
        paketKRSId: paket.id,
        status: 'APPROVED',
        totalSKS: 20,
        isModified: false,
        tanggalSubmit: new Date('2024-07-20'),
        tanggalApproval: new Date('2024-07-25'),
        approvedById: adminUser.id,
      },
    });

    // Add KRS Details
    for (const kelas of sem1Classes) {
      await prisma.kRSDetail.create({
        data: {
          krsId: krs.id,
          kelasMKId: kelas.id,
        },
      });
    }
  }

  // Angkatan 2023 students - Semesters 1, 2, 3
  for (let i = 10; i < 15; i++) {
    const mhs = mahasiswas[i];

    // Semester 1 (as Semester 3 for them)
    const krs1 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester1.id,
        paketKRSId: paket2023Sem3TEO.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2024-07-20'),
        tanggalApproval: new Date('2024-07-25'),
        approvedById: adminUser.id,
      },
    });

    for (const kelas of sem1Classes) {
      await prisma.kRSDetail.create({
        data: { krsId: krs1.id, kelasMKId: kelas.id },
      });
    }

    // Semester 2 (as Semester 4 for them)
    const krs2 = await prisma.kRS.create({
      data: {
        mahasiswaId: mhs.id,
        semesterId: semester2.id,
        paketKRSId: paket2023Sem4TEO.id,
        status: 'APPROVED',
        totalSKS: 20,
        tanggalSubmit: new Date('2025-01-05'),
        tanggalApproval: new Date('2025-01-10'),
        approvedById: adminUser.id,
      },
    });

    for (const kelas of sem2Classes) {
      await prisma.kRSDetail.create({
        data: { krsId: krs2.id, kelasMKId: kelas.id },
      });
    }
  }

  console.log('✅ KRS created\n');

  // ============================================
  // 11. NILAI (Only for completed semesters)
  // ============================================
  console.log('💯 Seeding Nilai...');

  // Get all approved KRS
  const allKRS = await prisma.kRS.findMany({
    where: { status: 'APPROVED' },
    include: { detail: true, mahasiswa: true },
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

  // For each mahasiswa and completed semester
  for (const mhs of mahasiswas) {
    const completedKRS = allKRS.filter(k => k.mahasiswaId === mhs.id);

    let totalBobotKumulatif = 0;
    let totalSKSKumulatif = 0;

    for (const krs of completedKRS) {
      // Get nilai for this semester
      const nilaiSemester = await prisma.nilai.findMany({
        where: {
          mahasiswaId: mhs.id,
          semesterId: krs.semesterId,
        },
        include: {
          kelasMK: {
            include: { mataKuliah: true },
          },
        },
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
    const completedKRS = allKRS.filter(k => k.mahasiswaId === mhs.id);

    for (const krs of completedKRS) {
      // KRS Payment
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

      // Tengah Semester Payment
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

      // Monthly commitment payments (3-4 per semester)
      const monthlyCount = krs.semesterId === semester1.id ? 4 : 3;
      for (let m = 0; m < monthlyCount; m++) {
        await prisma.pembayaran.create({
          data: {
            mahasiswaId: mhs.id,
            semesterId: krs.semesterId,
            jenisPembayaran: 'KOMITMEN_BULANAN',
            nominal: 300000,
            buktiUrl: '/uploads/bukti-dummy.jpg',
            status: 'APPROVED',
            bulanPembayaran: new Date(2024, 8 + m, 1), // Aug, Sep, Oct, Nov
            verifiedById: keuanganUser.id,
            verifiedAt: new Date(),
          },
        });
      }
    }
  }

  console.log('✅ Pembayaran created\n');

  // ============================================
  // 14. PRESENSI (Only for completed semesters)
  // ============================================
  console.log('✅ Seeding Presensi...');

  const completedClasses = kelasData.filter(k => k.semester <= 2).map(k => k.kelas);

  for (const kelas of completedClasses) {
    // Get students in this class
    const studentsInClass = await prisma.kRSDetail.findMany({
      where: { kelasMKId: kelas.id },
      include: {
        krs: {
          include: { mahasiswa: true },
        },
      },
    });

    const totalPertemuan = 14 + Math.floor(Math.random() * 3); // 14-16

    for (let p = 1; p <= totalPertemuan; p++) {
      const presensi = await prisma.presensi.create({
        data: {
          kelasMKId: kelas.id,
          pertemuan: p,
          tanggal: new Date(2024, 7, p * 7), // Weekly
          materi: `Materi Pertemuan ${p}`,
          catatan: `Pertemuan ke-${p}`,
        },
      });

      // Add attendance for each student
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

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Summary:');
  console.log('- 2 Program Studi');
  console.log('- 1 Admin, 1 Keuangan');
  console.log('- 5 Dosen');
  console.log('- 15 Mahasiswa (10 Sem 2, 5 Sem 4)');
  console.log('- 4 Ruangan');
  console.log('- 30 Mata Kuliah');
  console.log('- 4 Semester (1 Active: 2025/2026 GANJIL)');
  console.log('- Complete historical data (KRS, Nilai, KHS, Pembayaran, Presensi)');
  console.log('\nLogin credentials:');
  console.log('- Admin: admin / password123');
  console.log('- Keuangan: keuangan / password123');
  console.log('- Dosen: 0101018901 / password123 (or dosen1 / password123)');
  console.log('- Mahasiswa: 2024010001 / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });