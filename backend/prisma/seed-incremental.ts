/**
 * INCREMENTAL SEED - ADD MORE DATA
 * Run this AFTER initial seed to add more testing data
 * Does NOT delete existing data
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding more seed data (incremental)...\n');

  const password = await bcrypt.hash('password123', 10);

  // ============================================
  // GET EXISTING DATA
  // ============================================
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const prodiPAK = await prisma.programStudi.findFirst({ where: { kode: 'PAK' } });
  const prodiTEO = await prisma.programStudi.findFirst({ where: { kode: 'TEO' } });
  const ruangan = await prisma.ruangan.findMany({ where: { isActive: true } });

  if (!admin || !prodiPAK || !prodiTEO) {
    console.error('❌ Base data not found! Run initial seed first.');
    process.exit(1);
  }

  // ============================================
  // 1. ADD 3 MORE DOSEN (total jadi 5)
  // ============================================
  console.log('👨‍🏫 Adding 3 more Dosen...');

  const dosenData = [
    { nidn: '0303039101', nuptk: '3334567890123456', nama: 'Pdt. Daniel Hutabarat, M.Div', prodi: prodiPAK.id },
    { nidn: '0404049201', nuptk: '4434567890123456', nama: 'Dr. Esther Panjaitan, M.Th', prodi: prodiTEO.id },
    { nidn: '0505059301', nuptk: '5534567890123456', nama: 'Pdt. Gideon Sinaga, S.Th', prodi: prodiPAK.id },
  ];

  for (const d of dosenData) {
    const exists = await prisma.dosen.findUnique({ where: { nidn: d.nidn } });
    if (!exists) {
      await prisma.user.create({
        data: {
          password,
          role: 'DOSEN',
          isActive: true,
          dosen: {
            create: {
              nidn: d.nidn,
              nuptk: d.nuptk,
              namaLengkap: d.nama,
              prodiId: d.prodi,
              posisi: 'Dosen Tetap',
              jafung: 'Lektor',
              alumni: 'false',
              lamaMengajar: '5',
              status: 'AKTIF',
            },
          },
        },
      });
      console.log(`  ✅ ${d.nama}`);
    } else {
      console.log(`  ⏭️  ${d.nama} (exists)`);
    }
  }

  const allDosen = await prisma.dosen.findMany({ where: { status: 'AKTIF' } });

  // ============================================
  // 2. ADD 8 MORE MAHASISWA (total jadi 10)
  // ============================================
  console.log('\n👨‍🎓 Adding 8 more Mahasiswa...');

  const mahasiswaData = [
    { 
      nim: '2024010002', 
      nama: 'Budi Santoso', 
      prodi: prodiPAK.id, 
      jk: 'L', 
      angkatan: 2024,
      tempatTanggalLahir: 'Jakarta, 15 Mei 2006',
      alamat: 'Jl. Gatot Subroto No. 12, Jakarta Selatan'
    },
    { 
      nim: '2024010003', 
      nama: 'Christina Wijaya', 
      prodi: prodiPAK.id, 
      jk: 'P', 
      angkatan: 2024,
      tempatTanggalLahir: 'Bandung, 22 Agustus 2006',
      alamat: 'Jl. Dago No. 45, Bandung'
    },
    { 
      nim: '2024010004', 
      nama: 'David Lumban Tobing', 
      prodi: prodiPAK.id, 
      jk: 'L', 
      angkatan: 2024,
      tempatTanggalLahir: 'Medan, 10 Januari 2006',
      alamat: 'Jl. Sisingamangaraja No. 78, Medan'
    },
    { 
      nim: '2024020002', 
      nama: 'Esther Simatupang', 
      prodi: prodiTEO.id, 
      jk: 'P', 
      angkatan: 2024,
      tempatTanggalLahir: 'Yogyakarta, 5 Maret 2006',
      alamat: 'Jl. Malioboro No. 23, Yogyakarta'
    },
    { 
      nim: '2024020003', 
      nama: 'Felix Manurung', 
      prodi: prodiTEO.id, 
      jk: 'L', 
      angkatan: 2024,
      tempatTanggalLahir: 'Surabaya, 18 September 2006',
      alamat: 'Jl. Tunjungan No. 67, Surabaya'
    },
    { 
      nim: '2023010001', 
      nama: 'Grace Sitompul', 
      prodi: prodiPAK.id, 
      jk: 'P', 
      angkatan: 2023,
      tempatTanggalLahir: 'Semarang, 12 April 2005',
      alamat: 'Jl. Pandanaran No. 34, Semarang'
    },
    { 
      nim: '2023020001', 
      nama: 'Hendrikus Nababan', 
      prodi: prodiTEO.id, 
      jk: 'L', 
      angkatan: 2023,
      tempatTanggalLahir: 'Palembang, 7 November 2005',
      alamat: 'Jl. Sudirman No. 56, Palembang'
    },
    { 
      nim: '2022010001', 
      nama: 'Irene Tampubolon', 
      prodi: prodiPAK.id, 
      jk: 'P', 
      angkatan: 2022,
      tempatTanggalLahir: 'Makassar, 28 Februari 2004',
      alamat: 'Jl. Pettarani No. 89, Makassar'
    },
  ];

  for (let i = 0; i < mahasiswaData.length; i++) {
    const m = mahasiswaData[i];
    const exists = await prisma.mahasiswa.findUnique({ where: { nim: m.nim } });
    if (!exists) {
      await prisma.user.create({
        data: {
          password,
          role: 'MAHASISWA',
          isActive: true,
          mahasiswa: {
            create: {
              nim: m.nim,
              namaLengkap: m.nama,
              jenisKelamin: m.jk as any,
              tempatTanggalLahir: m.tempatTanggalLahir,
              alamat: m.alamat,
              prodiId: m.prodi,
              angkatan: m.angkatan,
              dosenWaliId: allDosen[i % allDosen.length].id,
              status: 'AKTIF',
            },
          },
        },
      });
      console.log(`  ✅ ${m.nim} - ${m.nama}`);
    } else {
      console.log(`  ⏭️  ${m.nim} (exists)`);
    }
  }

  const allMahasiswa = await prisma.mahasiswa.findMany();

  // ============================================
  // 3. ADD 15 MATA KULIAH
  // ============================================
  console.log('\n📚 Adding 15 Mata Kuliah...');

  const mkData = [
    { kode: 'PAK101', nama: 'Pengantar Teologi', sks: 3, sem: 1 },
    { kode: 'PAK102', nama: 'Bahasa Yunani I', sks: 3, sem: 1 },
    { kode: 'PAK103', nama: 'Pengantar PL', sks: 3, sem: 1 },
    { kode: 'PAK104', nama: 'Etika Kristen', sks: 2, sem: 1 },
    { kode: 'PAK105', nama: 'Sejarah Gereja I', sks: 2, sem: 1 },
    { kode: 'PAK201', nama: 'Bahasa Yunani II', sks: 3, sem: 2 },
    { kode: 'PAK202', nama: 'Pengantar PB', sks: 3, sem: 2 },
    { kode: 'PAK203', nama: 'Hermeneutika', sks: 3, sem: 2 },
    { kode: 'PAK204', nama: 'Teologi Sistematika I', sks: 3, sem: 2 },
    { kode: 'TEO101', nama: 'Pengantar Filsafat', sks: 3, sem: 1 },
    { kode: 'TEO102', nama: 'Logika', sks: 2, sem: 1 },
    { kode: 'TEO201', nama: 'Filsafat Agama', sks: 3, sem: 2 },
    { kode: 'TEO202', nama: 'Antropologi Teologi', sks: 2, sem: 2 },
    { kode: 'TEO301', nama: 'Studi Komparatif Agama', sks: 3, sem: 3 },
    { kode: 'TEO302', nama: 'Teologi Feminis', sks: 2, sem: 3 },
  ];

  for (const mk of mkData) {
    const exists = await prisma.mataKuliah.findUnique({ where: { kodeMK: mk.kode } });
    if (!exists) {
      await prisma.mataKuliah.create({
        data: {
          kodeMK: mk.kode,
          namaMK: mk.nama,
          sks: mk.sks,
          semesterIdeal: mk.sem,
          isLintasProdi: mk.kode.startsWith('TEO'),
          isActive: true,
        },
      });
      console.log(`  ✅ ${mk.kode} - ${mk.nama}`);
    } else {
      console.log(`  ⏭️  ${mk.kode} (exists)`);
    }
  }

  const allMK = await prisma.mataKuliah.findMany();

  // ============================================
  // 4. ADD 4 SEMESTERS
  // ============================================
  console.log('\n📅 Adding 4 Semesters...');

  const semesterData = [
    {
      tahun: '2023/2024',
      periode: 'GANJIL',
      active: false,
      mulai: '2023-09-01',
      selesai: '2024-01-31',
    },
    {
      tahun: '2023/2024',
      periode: 'GENAP',
      active: false,
      mulai: '2024-02-01',
      selesai: '2024-07-31',
    },
    {
      tahun: '2024/2025',
      periode: 'GANJIL',
      active: true,
      mulai: '2024-09-01',
      selesai: '2025-01-31',
    },
    {
      tahun: '2024/2025',
      periode: 'GENAP',
      active: false,
      mulai: '2025-02-01',
      selesai: '2025-07-31',
    },
  ];

  for (const sem of semesterData) {
    const exists = await prisma.semester.findFirst({
      where: {
        tahunAkademik: sem.tahun,
        periode: sem.periode as any,
      },
    });

    if (!exists) {
      const mulaiDate = new Date(sem.mulai);
      const krsStart = new Date(mulaiDate);
      krsStart.setDate(1);
      const krsEnd = new Date(mulaiDate);
      krsEnd.setDate(15);
      const perbaikanStart = new Date(mulaiDate);
      perbaikanStart.setDate(16);
      const perbaikanEnd = new Date(mulaiDate);
      perbaikanEnd.setDate(30);

      await prisma.semester.create({
        data: {
          tahunAkademik: sem.tahun,
          periode: sem.periode as any,
          isActive: sem.active,
          tanggalMulai: new Date(sem.mulai),
          tanggalSelesai: new Date(sem.selesai),
          periodeKRSMulai: krsStart,
          periodeKRSSelesai: krsEnd,
          periodePerbaikanKRSMulai: perbaikanStart,
          periodePerbaikanKRSSelesai: perbaikanEnd,
        },
      });
      console.log(`  ✅ ${sem.tahun} ${sem.periode}${sem.active ? ' (ACTIVE)' : ''}`);
    } else {
      console.log(`  ⏭️  ${sem.tahun} ${sem.periode} (exists)`);
    }
  }

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  if (!activeSemester) {
    console.error('❌ No active semester found!');
    process.exit(1);
  }

  // ============================================
  // 5. CREATE KELAS MK (untuk semester aktif)
  // ============================================
  console.log('\n🏫 Creating Kelas MK for active semester...');

  const semester1MK = allMK.filter((mk) => mk.semesterIdeal === 1);
  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const jamList = [
    { mulai: '08:00', selesai: '10:30' },
    { mulai: '10:45', selesai: '13:15' },
    { mulai: '13:30', selesai: '16:00' },
  ];

  let kelasCount = 0;
  for (let i = 0; i < semester1MK.length && i < 10; i++) {
    const mk = semester1MK[i];
    const dosen = allDosen[i % allDosen.length];
    const ruang = ruangan[i % ruangan.length];
    const hari = hariList[i % hariList.length];
    const jam = jamList[i % jamList.length];

    if (!ruang) continue;

    const exists = await prisma.kelasMataKuliah.findFirst({
      where: {
        mkId: mk.id,
        semesterId: activeSemester.id,
        dosenId: dosen.id,
      },
    });

    if (!exists) {
      await prisma.kelasMataKuliah.create({
        data: {
          mkId: mk.id,
          semesterId: activeSemester.id,
          dosenId: dosen.id,
          ruanganId: ruang.id,
          hari,
          jamMulai: jam.mulai,
          jamSelesai: jam.selesai,
          kuotaMax: 30,
        },
      });
      console.log(`  ✅ ${mk.kodeMK} - ${hari} ${jam.mulai}`);
      kelasCount++;
    }
  }

  const allKelas = await prisma.kelasMataKuliah.findMany({
    where: { semesterId: activeSemester.id },
    include: { mataKuliah: true },
  });

  // ============================================
  // 6. CREATE PAKET KRS
  // ============================================
  console.log('\n📦 Creating Paket KRS...');

  const paketExists = await prisma.paketKRS.findFirst({
    where: {
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 1,
    },
  });

  let paketKRS;
  if (!paketExists && allKelas.length > 0) {
    const totalSKS = allKelas.reduce((sum, k) => sum + k.mataKuliah.sks, 0);

    paketKRS = await prisma.paketKRS.create({
      data: {
        namaPaket: 'Paket Semester 1 PAK 2024',
        angkatan: 2024,
        prodiId: prodiPAK.id,
        semesterPaket: 1,
        semesterId: activeSemester.id,
        totalSKS,
        createdById: admin.id,
      },
    });

    // Add paket details
    for (const kelas of allKelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paketKRS.id,
          kelasMKId: kelas.id,
        },
      });
    }

    console.log(`  ✅ Paket created with ${allKelas.length} mata kuliah (${totalSKS} SKS)`);
  } else {
    paketKRS = paketExists;
    console.log(`  ⏭️  Paket already exists`);
  }

  // ============================================
  // 7. CREATE KRS for mahasiswa 2024
  // ============================================
  console.log('\n📝 Creating KRS for mahasiswa...');

  const mhs2024 = allMahasiswa.filter((m) => m.angkatan === 2024);
  let krsCount = 0;

  for (let i = 0; i < Math.min(mhs2024.length, 5); i++) {
    const mhs = mhs2024[i];
    const exists = await prisma.kRS.findFirst({
      where: {
        mahasiswaId: mhs.id,
        semesterId: activeSemester.id,
      },
    });

    if (!exists && paketKRS && allKelas.length > 0) {
      // Create KRS
      const status = i === 0 ? 'DRAFT' : i < 3 ? 'SUBMITTED' : 'APPROVED';
      const krs = await prisma.kRS.create({
        data: {
          mahasiswaId: mhs.id,
          semesterId: activeSemester.id,
          paketKRSId: paketKRS.id,
          totalSKS: paketKRS.totalSKS,
          status: status as any,
          tanggalSubmit: status !== 'DRAFT' ? new Date() : null,
          tanggalApproval: status === 'APPROVED' ? new Date() : null,
          approvedById: status === 'APPROVED' ? allDosen[0].userId : null,
        },
      });

      // Add KRS details
      for (const kelas of allKelas) {
        await prisma.kRSDetail.create({
          data: {
            krsId: krs.id,
            kelasMKId: kelas.id,
          },
        });
      }

      console.log(`  ✅ ${mhs.nim} - ${status}`);
      krsCount++;
    }
  }

  // ============================================
  // 8. CREATE NILAI for APPROVED KRS
  // ============================================
  console.log('\n🎓 Creating Nilai for approved KRS...');

  const approvedKRS = await prisma.kRS.findMany({
    where: { status: 'APPROVED' },
    include: { detail: true },
  });

  let nilaiCount = 0;
  for (const krs of approvedKRS) {
    for (const detail of krs.detail) {
      const exists = await prisma.nilai.findFirst({
        where: {
          mahasiswaId: krs.mahasiswaId,
          kelasMKId: detail.kelasMKId,
          semesterId: krs.semesterId,
        },
      });

      if (!exists) {
        const nilaiAngka = 75 + Math.floor(Math.random() * 20); // 75-95
        let nilaiHuruf = 'B';
        if (nilaiAngka >= 90) nilaiHuruf = 'A';
        else if (nilaiAngka >= 85) nilaiHuruf = 'AB';
        else if (nilaiAngka >= 80) nilaiHuruf = 'B';
        else if (nilaiAngka >= 75) nilaiHuruf = 'BC';

        await prisma.nilai.create({
          data: {
            mahasiswaId: krs.mahasiswaId,
            kelasMKId: detail.kelasMKId,
            semesterId: krs.semesterId,
            nilaiAngka,
            nilaiHuruf: nilaiHuruf as any,
            bobot: nilaiAngka >= 90 ? 4.0 : nilaiAngka >= 85 ? 3.5 : nilaiAngka >= 80 ? 3.0 : 2.5,
            isFinalized: true,
            inputById: allDosen[0].userId,
          },
        });
        nilaiCount++;
      }
    }
  }

  console.log(`  ✅ ${nilaiCount} nilai created`);

  // ============================================
  // 9. CREATE KHS for approved KRS
  // ============================================
  console.log('\n📊 Creating KHS...');

  let khsCount = 0;
  for (const krs of approvedKRS) {
    const exists = await prisma.kHS.findFirst({
      where: {
        mahasiswaId: krs.mahasiswaId,
        semesterId: krs.semesterId,
      },
    });

    if (!exists) {
      const ips = 3.2 + Math.random() * 0.7; // 3.2-3.9
      await prisma.kHS.create({
        data: {
          mahasiswaId: krs.mahasiswaId,
          semesterId: krs.semesterId,
          ips: parseFloat(ips.toFixed(2)),
          ipk: parseFloat(ips.toFixed(2)),
          totalSKSSemester: krs.totalSKS,
          totalSKSKumulatif: krs.totalSKS,
        },
      });
      khsCount++;
    }
  }

  console.log(`  ✅ ${khsCount} KHS created`);

  // ============================================
  // 10. CREATE PEMBAYARAN for KRS
  // ============================================
  console.log('\n💰 Creating Pembayaran...');

  const allKRS = await prisma.kRS.findMany({ take: 5 });
  let bayarCount = 0;

  for (let i = 0; i < allKRS.length; i++) {
    const krs = allKRS[i];
    const exists = await prisma.pembayaran.findFirst({
      where: {
        mahasiswaId: krs.mahasiswaId,
        semesterId: krs.semesterId,
        jenisPembayaran: 'KRS',
      },
    });

    if (!exists) {
      const status = i < 3 ? 'APPROVED' : 'PENDING';
      await prisma.pembayaran.create({
        data: {
          mahasiswaId: krs.mahasiswaId,
          semesterId: krs.semesterId,
          jenisPembayaran: 'KRS',
          nominal: 500000,
          buktiUrl: 'https://example.com/bukti.jpg',
          status: status as any,
          verifiedById: status === 'APPROVED' ? admin.id : null,
          verifiedAt: status === 'APPROVED' ? new Date() : null,
        },
      });
      console.log(`  ✅ Pembayaran ${krs.mahasiswaId} - ${status}`);
      bayarCount++;
    }
  }

  // ============================================
  // 11. CREATE PRESENSI
  // ============================================
  console.log('\n✅ Creating Presensi...');

  let presensiCount = 0;
  for (let i = 0; i < Math.min(allKelas.length, 3); i++) {
    const kelas = allKelas[i];

    for (let pertemuan = 1; pertemuan <= 3; pertemuan++) {
      const exists = await prisma.presensi.findFirst({
        where: {
          kelasMKId: kelas.id,
          pertemuan,
        },
      });

      if (!exists) {
        const presensi = await prisma.presensi.create({
          data: {
            kelasMKId: kelas.id,
            pertemuan,
            tanggal: new Date(),
            materi: `Materi Pertemuan ${pertemuan}`,
          },
        });

        // Add presensi detail for enrolled students
        const enrolledKRS = await prisma.kRSDetail.findMany({
          where: { kelasMKId: kelas.id },
          include: { krs: true },
        });

        for (const detail of enrolledKRS) {
          await prisma.presensiDetail.create({
            data: {
              presensiId: presensi.id,
              mahasiswaId: detail.krs.mahasiswaId,
              status: Math.random() > 0.2 ? 'HADIR' : 'ALPHA',
            },
          });
        }

        presensiCount++;
      }
    }
  }

  console.log(`  ✅ ${presensiCount} presensi created`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========== SUMMARY ==========');
  console.log(`✅ Dosen: +3`);
  console.log(`✅ Mahasiswa: +8`);
  console.log(`✅ Mata Kuliah: 15`);
  console.log(`✅ Semester: 4`);
  console.log(`✅ Kelas MK: ${kelasCount}`);
  console.log(`✅ Paket KRS: 1`);
  console.log(`✅ KRS: ${krsCount}`);
  console.log(`✅ Nilai: ${nilaiCount}`);
  console.log(`✅ KHS: ${khsCount}`);
  console.log(`✅ Pembayaran: ${bayarCount}`);
  console.log(`✅ Presensi: ${presensiCount}`);
  console.log('=============================\n');
}

main()
  .then(() => {
    console.log('✅ Incremental seed completed!\n');
    prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });