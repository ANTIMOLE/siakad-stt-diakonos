import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Updating Mata Kuliah dengan isLintasProdi...\n');

  const mkData = [
    // SEMESTER 1
    { kode: 'KK 1313', nama: 'Bahasa Ibrani I', sks: 3, sem: 1, lintas: true },
    { kode: 'PB 1265', nama: 'Disiplin Rohani', sks: 2, sem: 1, lintas: true },
    { kode: 'KK 1207', nama: 'Pembimbing & Pengetahuan PL I', sks: 2, sem: 1, lintas: true },
    { kode: 'PK 1205', nama: 'Bahasa Inggris Dasar', sks: 2, sem: 1, lintas: true },
    { kode: 'KK 1210', nama: 'Pembimbing & Pengetahuan PB I', sks: 2, sem: 1, lintas: true },
    { kode: 'PK 1204', nama: 'Bahasa Indonesia', sks: 2, sem: 1, lintas: true },
    { kode: 'PB 1266', nama: 'Pembentukan Watak dan Tata Nilai', sks: 2, sem: 1, lintas: true },
    { kode: 'PK 1201', nama: 'Kewarganegaraan', sks: 2, sem: 1, lintas: true },
    { kode: 'KK 1217', nama: 'Psikologi Umum', sks: 2, sem: 1, lintas: true },
    { kode: 'KK 1219', nama: 'Pengantar Filsafat', sks: 2, sem: 1, lintas: true },
    { kode: 'KK 1223', nama: 'Dasar-dasar Iman Kristen', sks: 2, sem: 1, lintas: true },
    
    // SEMESTER 2
    { kode: 'KK P2214', nama: 'Dasar-dasar Pendidikan', sks: 2, sem: 2, lintas: false },
    { kode: 'PB T2261', nama: 'PI Pribadi', sks: 2, sem: 2, lintas: false },
    { kode: 'KB 2239', nama: 'Sejarah Gereja Umum', sks: 2, sem: 2, lintas: true },
    { kode: 'KK 2224', nama: 'Psikologi Perkembangan', sks: 2, sem: 2, lintas: true },
    { kode: 'KK 2208', nama: 'Pembimbing & Pengetahuan PL II', sks: 2, sem: 2, lintas: true },
    { kode: 'KB P2267', nama: 'Pembimbing PAK I', sks: 2, sem: 2, lintas: false },
    { kode: 'PB T4252', nama: 'Liturgika', sks: 2, sem: 2, lintas: false },
    { kode: 'KK 2211', nama: 'Pembimbing & Pengetahuan PB II', sks: 2, sem: 2, lintas: true },
    { kode: 'KK 2315', nama: 'Bahasa Yunani I', sks: 3, sem: 2, lintas: true },
    { kode: 'PB 2269', nama: 'Musik Gereja', sks: 2, sem: 2, lintas: true },
    { kode: 'KK T2214', nama: 'Bahasa Ibrani II', sks: 2, sem: 2, lintas: false },
    { kode: 'KK P2253', nama: 'Psikologi Pendidikan', sks: 2, sem: 2, lintas: false },
    { kode: 'PB P2234', nama: 'Bimbingan Konseling', sks: 2, sem: 2, lintas: false },
    { kode: 'PK 2202', nama: 'Komunikasi', sks: 2, sem: 2, lintas: true },
    { kode: 'KK 2222', nama: 'Pembimbing Teologi Sistematika', sks: 2, sem: 2, lintas: true },
    
    // SEMESTER 3
    { kode: 'KK P3247', nama: 'Teori Belajar PAK', sks: 2, sem: 3, lintas: false },
    { kode: 'PK 3203', nama: 'Sosiologi', sks: 2, sem: 3, lintas: true },
    { kode: 'KB 3241', nama: 'Sejarah Gereja Indonesia', sks: 2, sem: 3, lintas: true },
    { kode: 'KK 3212', nama: 'Pembimbing & Pengetahuan PB III', sks: 2, sem: 3, lintas: true },
    { kode: 'KK T3216', nama: 'Bahasa Yunani II', sks: 2, sem: 3, lintas: false },
    { kode: 'PB T3253', nama: 'Pelayanan Pastoral I', sks: 2, sem: 3, lintas: false },
    { kode: 'KB P3268', nama: 'Pembimbing PAK II', sks: 2, sem: 3, lintas: false },
    { kode: 'KK 3209', nama: 'Pembimbing & Pengetahuan PL III', sks: 2, sem: 3, lintas: true },
    { kode: 'KK P3235', nama: 'Profesi Keguruan PAK', sks: 2, sem: 3, lintas: false },
    { kode: 'KB 3380', nama: 'Teologi Sistematika I', sks: 3, sem: 3, lintas: true },
    { kode: 'KK 3218', nama: 'Hermeneutika', sks: 2, sem: 3, lintas: true },
    { kode: 'KB 3337', nama: 'Etika Kristen I', sks: 3, sem: 3, lintas: true },
    { kode: 'PB T3267', nama: 'Penanaman Gereja', sks: 2, sem: 3, lintas: false },
    
    // SEMESTER 4
    { kode: 'KB 4381', nama: 'Teologi Sistematika II', sks: 3, sem: 4, lintas: true },
    { kode: 'PB 4264', nama: 'Metode PA', sks: 2, sem: 4, lintas: true },
    { kode: 'KB 4238', nama: 'Etika Kristen II', sks: 2, sem: 4, lintas: true },
    { kode: 'KB P4254', nama: 'Kurikulum PAK', sks: 2, sem: 4, lintas: false },
    { kode: 'PB T4268', nama: 'Pertumbuhan Gereja', sks: 2, sem: 4, lintas: false },
    { kode: 'KB 4255', nama: 'PAK/PWG Anak', sks: 2, sem: 4, lintas: true },
    { kode: 'PK 4206', nama: 'Bahasa Inggris Teologi', sks: 2, sem: 4, lintas: true },
    { kode: 'PB 4358', nama: 'Homiletika I', sks: 3, sem: 4, lintas: true },
    { kode: 'KB P4336', nama: 'Perencanaan Pembelajaran PAK', sks: 2, sem: 4, lintas: false },
    { kode: 'PB T4254', nama: 'Pelayanan Pastoral II', sks: 2, sem: 4, lintas: false },
    { kode: 'KK 4225', nama: 'Tafsir PL I', sks: 2, sem: 4, lintas: true },
    { kode: 'KK 4228', nama: 'Tafsir PB I', sks: 2, sem: 4, lintas: true },
    { kode: 'KK P4263', nama: 'Media Pembelajaran PAK', sks: 2, sem: 4, lintas: false },
    { kode: 'PB T4246', nama: 'Pastoral Konseling', sks: 2, sem: 4, lintas: false },
    
    // SEMESTER 5
    { kode: 'KK 5229', nama: 'Tafsir PB II', sks: 2, sem: 5, lintas: true },
    { kode: 'KB 5256', nama: 'PAK/PWG Remaja', sks: 2, sem: 5, lintas: true },
    { kode: 'KB P5252', nama: 'Strategi Pembelajaran PAK', sks: 2, sem: 5, lintas: false },
    { kode: 'KB P5250', nama: 'Metode Pembelajaran', sks: 2, sem: 5, lintas: false },
    { kode: 'PB T5263', nama: 'PI Kontekstual', sks: 2, sem: 5, lintas: false },
    { kode: 'KB 5382', nama: 'Teologi Sistematika III', sks: 3, sem: 5, lintas: true },
    { kode: 'KK 5226', nama: 'Tafsir PL II', sks: 2, sem: 5, lintas: true },
    { kode: 'KB P5248', nama: 'Praktek Perencanaan PAK', sks: 2, sem: 5, lintas: false },
    { kode: 'KB 5242', nama: 'Teologi PL I', sks: 2, sem: 5, lintas: true },
    { kode: 'KB P5246', nama: 'Evaluasi PAK', sks: 2, sem: 5, lintas: false },
    { kode: 'PB T5248', nama: 'Kepemimpinan Kristen', sks: 2, sem: 5, lintas: false },
    { kode: 'PB 5271', nama: 'Apologetika', sks: 2, sem: 5, lintas: true },
    { kode: 'KB T5250', nama: 'Manajemen Gereja', sks: 2, sem: 5, lintas: false },
    { kode: 'PB 5260', nama: 'Misiologi', sks: 2, sem: 5, lintas: true },
    { kode: 'PB 5259', nama: 'Homiletika II', sks: 2, sem: 5, lintas: false },
    
    // SEMESTER 6
    { kode: 'BB 6674', nama: 'PPL', sks: 6, sem: 6, lintas: true },
    
    // SEMESTER 7
    { kode: 'KB 7257', nama: 'PAK/PWG Dewasa', sks: 2, sem: 7, lintas: true },
    { kode: 'KK 7227', nama: 'Tafsir PL III', sks: 2, sem: 7, lintas: true },
    { kode: 'KK 7230', nama: 'Tafsir PB III', sks: 2, sem: 7, lintas: true },
    { kode: 'KK 7220', nama: 'Statistika', sks: 2, sem: 7, lintas: true },
    { kode: 'KB P7272', nama: 'Administrasi PAK', sks: 2, sem: 7, lintas: false },
    { kode: 'KK 7221', nama: 'Metodologi Penelitian', sks: 2, sem: 7, lintas: true },
    { kode: 'PB T7247', nama: 'Konseling Keluarga', sks: 2, sem: 7, lintas: false },
    { kode: 'KB 7244', nama: 'Teologi PB I', sks: 2, sem: 7, lintas: true },
    { kode: 'KB 7243', nama: 'Teologi PL II', sks: 2, sem: 7, lintas: true },
    { kode: 'KK P7261', nama: 'Filsafat Pendidikan', sks: 2, sem: 7, lintas: false },
    { kode: 'PB 7276', nama: 'Pendidikan Anti Korupsi', sks: 2, sem: 7, lintas: true },
    { kode: 'KB T7283', nama: 'Teologi Sistematika IV', sks: 2, sem: 7, lintas: false },
    { kode: 'KB T7236', nama: 'Teologi Kontemporer', sks: 2, sem: 7, lintas: false },
    
    // SEMESTER 8
    { kode: 'KB 8245', nama: 'Teologi PB II', sks: 2, sem: 8, lintas: true },
    { kode: 'BB 8675', nama: 'Skrispi', sks: 6, sem: 8, lintas: true },
  ];

  let updated = 0;
  let created = 0;

  for (const mk of mkData) {
    try {
      const result = await prisma.mataKuliah.upsert({
        where: { kodeMK: mk.kode },
        update: {
          namaMK: mk.nama,
          sks: mk.sks,
          semesterIdeal: mk.sem,
          isLintasProdi: mk.lintas,
          isActive: true,
        },
        create: {
          kodeMK: mk.kode,
          namaMK: mk.nama,
          sks: mk.sks,
          semesterIdeal: mk.sem,
          isLintasProdi: mk.lintas,
          isActive: true,
        },
      });

      // Check if it was an update or create
      const existing = await prisma.mataKuliah.findUnique({
        where: { kodeMK: mk.kode },
      });

      if (existing) {
        updated++;
        console.log(`✓ Updated: ${mk.kode} - ${mk.nama} (Lintas: ${mk.lintas ? 'YA' : 'TIDAK'})`);
      } else {
        created++;
        console.log(`+ Created: ${mk.kode} - ${mk.nama} (Lintas: ${mk.lintas ? 'YA' : 'TIDAK'})`);
      }
    } catch (error: any) {
      console.error(`✗ Error processing ${mk.kode}:`, error.message);
    }
  }

  console.log('\n=================================');
  console.log('📊 SUMMARY');
  console.log('=================================');
  console.log(`✅ Total Processed: ${mkData.length}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`➕ Created: ${created}`);
  console.log('=================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    throw e;
  });
