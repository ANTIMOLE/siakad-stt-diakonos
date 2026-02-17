// ============================================
// SEED PAKET KRS - SIAKAD STT DIAKONOS
// 8 Paket KRS untuk Semester 2, 4, 6, 8
// PAK & Teologi - Semester Genap 2025/2026
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Paket KRS...');

  // ============================================
  // 1. GET SEMESTER & USER ADMIN
  // ============================================
  console.log('📅 Getting semester & admin...');

  const semester = await prisma.semester.findFirst({
    where: {
      tahunAkademik: '2025/2026',
      periode: 'GENAP',
    },
  });

  if (!semester) {
    throw new Error('Semester 2025/2026 GENAP not found! Run seed-kelas first.');
  }

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    throw new Error('Admin user not found! Run seed.ts first.');
  }

  console.log('✅ Semester & Admin ready');

  // ============================================
  // 2. GET PROGRAM STUDI
  // ============================================
  console.log('📚 Getting Program Studi...');

  const prodiPAK = await prisma.programStudi.findFirst({
    where: { kode: 'PAK' },
  });

  const prodiTeologi = await prisma.programStudi.findFirst({
    where: { kode: 'TEO' },
  });

  if (!prodiPAK || !prodiTeologi) {
    throw new Error('Program Studi not found! Run seed.ts first.');
  }

  console.log('✅ Program Studi ready');

  // ============================================
  // 3. GET ALL KELAS MATA KULIAH
  // ============================================
  console.log('📖 Loading all Kelas Mata Kuliah...');

  const allKelas = await prisma.kelasMataKuliah.findMany({
    where: { semesterId: semester.id },
    include: {
      mataKuliah: true,
      dosen: true,
    },
  });

  console.log(`✅ Found ${allKelas.length} kelas`);

  // Helper function to find kelas by kode MK
  const findKelasByKodeMK = (kodeMK: string) => {
    const searchKode = kodeMK.trim().replace(/\s+/g, ' ');
    return allKelas.find(k => {
      const mkKode = k.mataKuliah.kodeMK.trim().replace(/\s+/g, ' ');
      return mkKode === searchKode || mkKode.replace(/\s/g, '') === searchKode.replace(/\s/g, '');
    });
  };

  // ============================================
  // 4. CLEAR EXISTING PAKET KRS (optional)
  // ============================================
  console.log('🗑️  Clearing existing Paket KRS...');
  await prisma.paketKRSDetail.deleteMany();
  await prisma.paketKRS.deleteMany({
    where: { semesterId: semester.id },
  });
  console.log('✅ Cleared');

  // ============================================
  // 5. SEED PAKET KRS
  // ============================================
  console.log('📦 Creating Paket KRS...');

  let successCount = 0;
  let totalDetailCreated = 0;

  // ============================================
  // PAKET 1: Paket KRS Semester 2 - PAK
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 2 - PAK...');

  const paket1 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 2 - PAK',
      angkatan: 2024,
      prodiId: prodiPAK.id,
      semesterPaket: 2,
      semesterId: semester.id,
      totalSKS: 23,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket1 = [
    'KK P2214',
    'KB 2239',
    'KK 2224',
    'KK 2208',
    'KB P2267',
    'KK 2211',
    'KK 2315',
    'PB 2269',
    'KK P2253',
    'PB P2234',
    'PK 2202',
  ];

  let detailCount1 = 0;
  for (const kodeMK of detailPaket1) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket1.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount1++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 2 - PAK: ${detailCount1} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount1;

  // ============================================
  // PAKET 2: Paket KRS Semester 2 - Teologi
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 2 - Teologi...');

  const paket2 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 2 - Teologi',
      angkatan: 2024,
      prodiId: prodiTeologi.id,
      semesterPaket: 2,
      semesterId: semester.id,
      totalSKS: 21,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket2 = [
    'PB T2261',
    'KB 2239',
    'KK 2224',
    'KK 2208',
    'PB T4252',
    'KK 2211',
    'KK 2315',
    'PB 2269',
    'KK T2214',
    'PK 2202',
  ];

  let detailCount2 = 0;
  for (const kodeMK of detailPaket2) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket2.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount2++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 2 - Teologi: ${detailCount2} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount2;

  // ============================================
  // PAKET 3: Paket KRS Semester 4 - PAK
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 4 - PAK...');

  const paket3 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 4 - PAK',
      angkatan: 2023,
      prodiId: prodiPAK.id,
      semesterPaket: 4,
      semesterId: semester.id,
      totalSKS: 24,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket3 = [
    'KB 4381',
    'PB 4264',
    'KB 4238',
    'KB P4254',
    'KB 4255',
    'PK 4206',
    'PB 4358',
    'KB P4336',
    'KK 4225',
    'KK 4228',
    'KK P4263',
  ];

  let detailCount3 = 0;
  for (const kodeMK of detailPaket3) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket3.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount3++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 4 - PAK: ${detailCount3} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount3;

  // ============================================
  // PAKET 4: Paket KRS Semester 4 - Teologi
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 4 - Teologi...');

  const paket4 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 4 - Teologi',
      angkatan: 2023,
      prodiId: prodiTeologi.id,
      semesterPaket: 4,
      semesterId: semester.id,
      totalSKS: 24,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket4 = [
    'KB 4381',
    'PB 4264',
    'KB 4238',
    'PB T4268',
    'KB 4255',
    'PK 4206',
    'PB 4358',
    'PB T4254',
    'KK 4225',
    'KK 4228',
    'PB T4246',
  ];

  let detailCount4 = 0;
  for (const kodeMK of detailPaket4) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket4.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount4++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 4 - Teologi: ${detailCount4} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount4;

  // ============================================
  // PAKET 5: Paket KRS Semester 6 - PAK
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 6 - PAK...');

  const paket5 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 6 - PAK',
      angkatan: 2022,
      prodiId: prodiPAK.id,
      semesterPaket: 6,
      semesterId: semester.id,
      totalSKS: 6,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket5 = [
    'BB 6674',
  ];

  let detailCount5 = 0;
  for (const kodeMK of detailPaket5) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket5.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount5++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 6 - PAK: ${detailCount5} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount5;

  // ============================================
  // PAKET 6: Paket KRS Semester 6 - Teologi
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 6 - Teologi...');

  const paket6 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 6 - Teologi',
      angkatan: 2022,
      prodiId: prodiTeologi.id,
      semesterPaket: 6,
      semesterId: semester.id,
      totalSKS: 6,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket6 = [
    'BB 6674',
  ];

  let detailCount6 = 0;
  for (const kodeMK of detailPaket6) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket6.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount6++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 6 - Teologi: ${detailCount6} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount6;

  // ============================================
  // PAKET 7: Paket KRS Semester 8 - PAK
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 8 - PAK...');

  const paket7 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 8 - PAK',
      angkatan: 2021,
      prodiId: prodiPAK.id,
      semesterPaket: 8,
      semesterId: semester.id,
      totalSKS: 6,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket7 = [
    'BB 8675',
  ];

  let detailCount7 = 0;
  for (const kodeMK of detailPaket7) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket7.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount7++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 8 - PAK: ${detailCount7} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount7;

  // ============================================
  // PAKET 8: Paket KRS Semester 8 - Teologi
  // ============================================
  console.log('📦 Creating: Paket KRS Semester 8 - Teologi...');

  const paket8 = await prisma.paketKRS.create({
    data: {
      namaPaket: 'Paket KRS Semester 8 - Teologi',
      angkatan: 2021,
      prodiId: prodiTeologi.id,
      semesterPaket: 8,
      semesterId: semester.id,
      totalSKS: 6,
      createdById: adminUser.id,
    },
  });

  // Add detail (mata kuliah)
  const detailPaket8 = [
    'BB 8675',
  ];

  let detailCount8 = 0;
  for (const kodeMK of detailPaket8) {
    const kelas = findKelasByKodeMK(kodeMK);
    if (kelas) {
      await prisma.paketKRSDetail.create({
        data: {
          paketKRSId: paket8.id,
          kelasMKId: kelas.id,
        },
      });
      detailCount8++;
    } else {
      console.log(`   ⚠️  Kelas not found for: ${kodeMK}`);
    }
  }

  console.log(`   ✅ Paket KRS Semester 8 - Teologi: ${detailCount8} mata kuliah added`);
  successCount++;
  totalDetailCreated += detailCount8;

  // ============================================
  // SUMMARY
  // ============================================
  console.log('');
  console.log('🎉 SEED PAKET KRS COMPLETED!');
  console.log('');
  console.log('📊 SUMMARY:');
  console.log(`   ✅ ${successCount} Paket KRS created`);
  console.log(`   ✅ ${totalDetailCreated} Mata Kuliah entries added`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });