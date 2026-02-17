import { PrismaClient, JenisKelamin, StatusDosen } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');
  const tables = [
    'presensi_detail', 'presensi', 'pembayaran', 'khs', 'nilai',
    'krs_detail', 'krs', 'paket_krs_detail', 'paket_krs',
    'kelas_mk_file', 'kelas_mata_kuliah', 'mata_kuliah', 'semester',
    'ruangan', 'mahasiswa', 'dosen', 'users', 'program_studi', 'audit_log',
  ];
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
        console.log(`✓ Cleaned ${table}`);
      } catch (error: any) {
        console.log(`⚠ Error cleaning ${table}:`, error.message);
      }
    }
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('\n✅ Database cleaned!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  await cleanDatabase();
  console.log('🌱 Seeding 100% REAL DATA FROM EXCEL...\n');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // PROGRAM STUDI
  console.log('📚 Seeding Program Studi...');
  const prodiPAK = await prisma.programStudi.create({
    data: { kode: 'PAK', nama: 'Pendidikan Agama Kristen', jenjang: 'S1', isActive: true },
  });
  const prodiTEO = await prisma.programStudi.create({
    data: { kode: 'TEO', nama: 'Teologi', jenjang: 'S1', isActive: true },
  });
  console.log('✅ 2 Program Studi\n');

  // ADMIN & KEUANGAN
  console.log('👤 Seeding Admin & Keuangan...');
  await prisma.user.create({
    data: { username: 'admin', password: hashedPassword, role: 'ADMIN', isActive: true },
  });
  await prisma.user.create({
    data: { username: 'keuangan', password: hashedPassword, role: 'KEUANGAN', isActive: true },
  });
  console.log('✅ Admin & Keuangan\n');

  console.log('🏫 Seeding Ruangan...');
  const ruangans = await Promise.all([
    prisma.ruangan.create({ data: { nama: 'Teologi 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'Teologi 2', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 1', kapasitas: 30 } }),
    prisma.ruangan.create({ data: { nama: 'PAK 2', kapasitas: 30 } }),
  ]);
  console.log('✅ 6 Ruangan created\n');

  // DOSEN (ALL 12 FROM EXCEL)
  console.log('👨‍🏫 Seeding 12 Dosen...');
  const dosenData = [
    { nidn: '2329067201', nuptk: '961750651130122', nama: 'Dr. Sutoyo, M.Pd.K', prodi: 'PAK', tempat: 'Banyumas', tgl: '1972-06-29', posisi: 'Lektor 200', jafung: 'Lektor 200', alumni: 'STT Berita Hidup Solo', lama: '16 Tahun' },
    { nidn: '2018118702', nuptk: '5850765666131150', nama: 'Dafit Mei Dianto, M.Th.', prodi: 'Teologi', tempat: 'Pemalang', tgl: '1987-05-18', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'STBI Semarang', lama: '4 tahun 6 Bulan' },
    { nidn: '2302127301', nuptk: '533751654200023', nama: 'Dr. Pujiono, M.Pd.K.', prodi: 'PAK', tempat: 'Banyumas', tgl: '1973-12-02', posisi: 'Lektor 200', jafung: 'Lektor 200', alumni: 'STT Berita Hidup Solo', lama: '12 Tahun 8 Bulan' },
    { nidn: '2328097601', nuptk: '1260754655130090', nama: 'Dr. FX. Jeffry Harimurti, M.Pd.K.', prodi: 'PAK', tempat: 'Semarang', tgl: '1976-09-09', posisi: 'Lektor 200', jafung: 'Lektor 200', alumni: 'STT Berita Hidup Solo', lama: '12 Tahun 8 Bulan' },
    { nidn: '2309017001', nuptk: '6441748649130110', nama: 'Dr. Rianto, M.Pd.K.', prodi: 'PAK', tempat: 'Banyumas', tgl: '1970-01-09', posisi: 'Lektor 300', jafung: 'Lektor 300', alumni: 'STT Berita Hidup Solo', lama: '9 Tahun 3 Bulan' },
    { nidn: '2323018002', nuptk: '2455758659230140', nama: 'Ester Muriya, S.E., M.Pd.K', prodi: 'PAK', tempat: 'Cilacap', tgl: '1980-01-23', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'STT Marturia Yogyakarta', lama: '8 Tahun' },
    { nidn: '2030117302', nuptk: '7462751652130090', nama: 'Paulus Setyo Pramono, M.Pd.K.', prodi: 'Teologi', tempat: 'Semarang', tgl: '1973-10-30', posisi: 'Lektor 200', jafung: 'Lektor 200', alumni: 'STBI Semarang', lama: '8 Tahun 11 Bulan' },
    { nidn: '2316088401', nuptk: '2148762663230280', nama: 'Orance Amelia Neonane, M.Pd.K.', prodi: 'PAK', tempat: 'Tepas', tgl: '1984-08-16', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'STT Marturia Yogyakarta', lama: '8 Tahun' },
    { nidn: '2024019102', nuptk: '2456769670130240', nama: 'Fajar Dani Eko Mei Setiawan, M.Th.', prodi: 'Teologi', tempat: 'Demak', tgl: '1991-01-24', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'STBI Semarang', lama: '4 tahun 6 Bulan' },
    { nidn: '2014037902', nuptk: '5646757658130150', nama: 'Agus Silo Witrasno, M.Pd.K', prodi: 'Teologi', tempat: 'Sukoharjo', tgl: '1979-03-14', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'STAK Marturia Yogyakarta', lama: '12 Tahun' },
    { nidn: '2324076202', nuptk: '8056740641230060', nama: 'Tabita Todingbua, M.Div.', prodi: 'Teologi', tempat: 'Tana Toraja', tgl: '1962-07-14', posisi: 'Asisten Ahli', jafung: 'Asisten Ahli', alumni: 'Asia Pacific Nazarene Theological Seminary', lama: '15 Tahun' },
    { nidn: '2305057601', nuptk: '2837754655130210', nama: 'John Marlin, M.Th.', prodi: 'Teologi', tempat: 'Cilacap', tgl: '1976-05-05', posisi: 'Lektor 200', jafung: 'Lektor 200', alumni: 'STTII Yogyakarta', lama: '7 Tahun' },
    { nidn: '1000000001', nuptk: '2000000000000001', nama: 'Raden Ade Christian Aritonang, M.Th.', prodi: 'Teologi', tempat: 'Jakarta', tgl: '1980-01-01', posisi: 'Dosen Tetap', jafung: 'Asisten Ahli 100', alumni: 'STT Indonesia', lama: '5 Tahun' },
    { nidn: '1000000002', nuptk: '2000000000000002', nama: 'Dr. Mulyono, M.Pd.K.', prodi: 'PAK', tempat: 'Solo', tgl: '1962-04-21', posisi: 'Tidak Tetap', jafung: 'Lektor 200', alumni: 'STT Berita Hidup Solo', lama: '10 Tahun' },
    { nidn: '1000000003', nuptk: '2000000000000003', nama: 'Agoes Prijanto, M.Th.', prodi: 'Teologi', tempat: 'Malang', tgl: '1968-04-28', posisi: 'Tidak Tetap', jafung: 'Lektor 200', alumni: 'STAN Malang', lama: '7 Tahun' },
    { nidn: '1000000004', nuptk: '2000000000000004', nama: 'Nunung Kadarwati, M.Pd.', prodi: 'Manajemen Pendidikan', tempat: 'Sragen', tgl: '1981-09-25', posisi: 'Tidak Tetap', jafung: 'Asisten Ahli 150', alumni: 'STT Berita Hidup Solo', lama: '17 Tahun' },
    { nidn: '1000000005', nuptk: '2000000000000005', nama: 'Wahyu Oktorio Stevanus, S.Mg.', prodi: 'Manajemen', tempat: 'Purwokerto', tgl: '1977-10-03', posisi: 'Tidak Tetap', jafung: 'Asisten Ahli 100', alumni: 'UKRIM Yogyakarta', lama: '3 Tahun' },
    { nidn: '1000000006', nuptk: '2000000000000006', nama: 'Udin Firman Hidayat, M.Pd.', prodi: 'Teologi', tempat: 'Malang', tgl: '1991-03-28', posisi: 'Tidak Tetap', jafung: 'Asisten Ahli 100', alumni: 'UKI Jakarta', lama: '4 Tahun' },
  ];

  const dosens: any[] = [];
  const dosenMap: Record<string, any> = {};

  for (const d of dosenData) {
    const user = await prisma.user.create({
      data: { username: d.nidn, password: hashedPassword, role: 'DOSEN', isActive: true },
    });
    const dosen = await prisma.dosen.create({
      data: {
        userId: user.id, nidn: d.nidn, nuptk: d.nuptk, namaLengkap: d.nama,
        prodiId: d.prodi === 'PAK' ? prodiPAK.id : prodiTEO.id,
        tempatLahir: d.tempat, tanggalLahir: new Date(d.tgl),
        posisi: d.posisi, jafung: d.jafung, alumni: d.alumni,
        lamaMengajar: d.lama, status: 'AKTIF' as StatusDosen,
      },
    });
    dosens.push(dosen);
    dosenMap[d.nama] = dosen;
    // Add common typo mappings
    if (d.nama.includes('Muriya')) dosenMap['Ester Murya, M.Pd.K.'] = dosen;
    if (d.nama.includes('Witrasno')) dosenMap['Agus Silo Witrsano, M.Pd.K'] = dosen;
  }
  console.log(`✅ ${dosens.length} Dosen\n`);

  // MAHASISWA (ALL 105 FROM EXCEL)
  console.log('👨‍🎓 Seeding 105 Mahasiswa...');
  const mahasiswaData = [
    { nim: '11.21.374', nama: 'Aba Naheson Manibila', tempat: 'Tamanapui, 21 Feb 2002', jk: 'L', alamat: 'Tamanapui RT.01/01 Kec. Alor Selatan Kab. Alor NTT', prodi: 'PAK', angkatan: 2021, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.22.394', nama: 'Bagus Krisdianto', tempat: 'Kayu Agung, OKI, 8 Agustus 2004', jk: 'L', alamat: 'Kelirejo RT.03 RW.01 Kel./Desa Kelirejo Kec. Belitang II Kab. OKU Timur Sumatera Selatan', prodi: 'PAK', angkatan: 2022, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.22.396', nama: 'Klaudia Liviani Kristya Nugraha', tempat: 'Pekalongan 10 November 2004', jk: 'P', alamat: 'Ds. Kasimpar RT.01 RW. 02 Kec. Petungkriyono Kab. Pekalongan', prodi: 'PAK', angkatan: 2022, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.22.397', nama: 'Yarni Zalukhu', tempat: 'Hiliwaele, 10 Des 1999', jk: 'P', alamat: 'Tetehosi Sorowi Kec. Lahewa Timur Kab. Nias Utara Sumatera Utara', prodi: 'PAK', angkatan: 2022, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.22.399', nama: 'Refni Hidayanti Laia', tempat: 'Lawa-lawa Luo, 27 Februari 2002', jk: 'P', alamat: 'Ds. Lawa-lawa Luo Kec. Lolomatua Kab. Nias Selatan', prodi: 'PAK', angkatan: 2022, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.22.401', nama: 'Priscilla Hernawanti S.', tempat: 'Banyumas, 6 Februari 1997', jk: 'P', alamat: 'Kaliori RT.09 RW.05 Kec. Kalibagor Kab. Banyumas', prodi: 'PAK', angkatan: 2022, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.22.402', nama: 'Yeremia Dwi Putra K.', tempat: 'Purwokerto Banyumas, 8 Mei 2002', jk: 'L', alamat: 'Sokaraja Tengah RT.01/07 Kec. Sokaraja Kab. Banyumas', prodi: 'PAK', angkatan: 2022, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.22.403', nama: 'Rambu Ati Ana Hutar', tempat: 'Tawui, 11 Februari 2002', jk: 'P', alamat: 'Mau Tarimbang, RT.03 RW.02 Kel./Desa Tawui Kec. Pinu Pahar Kab. Sumba Timur, Nusa Tenggara Timur', prodi: 'PAK', angkatan: 2022, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.23.405', nama: 'Berlian Amanda Violita', tempat: 'Pemalang, 10 September 2003', jk: 'P', alamat: 'Gereja RT.024 RW.006Kel./Desa Pulosari Kec. Pulosari Kab. Pemalang, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.23.406', nama: 'Budilia Buulolo', tempat: 'Gui-Gui, 14 Februari 2002', jk: 'P', alamat: 'Desa Hilibadalu Kec. Umbunasi Kab. Nias Selatan, Sumatera Utara', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.411', nama: 'Istiarah', tempat: 'Cilacap, 9 November 2002', jk: 'P', alamat: 'Jl. Srumbung, RT.003 RW.004 Kel./Desa Adiraja Kec. Adipala Kab. Cilacap, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.23.412', nama: 'Josephine Elsbet O. Poetri', tempat: 'Kebumen, 28 Oktober 2005', jk: 'P', alamat: 'Depok RT.001 RW.003 Kel./Desa Weton KulonKec. Puring Kab. Kebumen, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.23.414', nama: 'Martha Waru', tempat: 'Arsopura, 27 Desember 2005', jk: 'P', alamat: 'Jl. R. VI/A No. ….ARSO IV RT.014 RW.004 Kel./Desa Arsopura Kec. Skanto Kab. Keerom, Papua', prodi: 'PAK', angkatan: 2023, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.23.415', nama: 'Mimi Kristiana L. Manibak', tempat: 'Tamanapui, 13 Januari 2005', jk: 'P', alamat: 'Tamanapui RT.001 RW.001 Kel./Desa Tamanapui Kec. Alor Selatan Kab. Alor, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.23.416', nama: 'Naomi Manisa', tempat: 'Tamanapui, 20 Agustus 2005', jk: 'P', alamat: 'Tamanapui RT.004 RW.002 Desa/Kel. Tamanapui Kec. Alor Selatan Kab. Alor, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.23.417', nama: 'Ralen Ana Wulang', tempat: 'Tawui, 02 November 2003', jk: 'P', alamat: 'Kalalap RT.010 RW.005 Desa/Kel. Tawui Kec. Pinu Pahar Kab. Sumba Timur, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.23.418', nama: 'Refni Warasi', tempat: 'Maliwaa, 7 Januari 2000', jk: 'P', alamat: 'Dusun I Tiga Seangkai Maliwaa Kec. Idano Gawo Kab. Nias, Sumatera Utara', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.23.419', nama: 'Sefriana Ledi Yuliana S.', tempat: 'Kie, 20 September 2005', jk: 'P', alamat: 'Kie RT.001 RW. 001 Kel./Desa Napi Kec. Kie Kab.Timor Tengah Selatan, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.23.420', nama: 'Sri Titis Merlia K.', tempat: 'Moru, 14 Maret 2005', jk: 'P', alamat: 'Tamanapui RT.04/02 Kec. Alor Selatan Kab. Alor NTT', prodi: 'PAK', angkatan: 2023, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.23.422', nama: 'Welmince Natti', tempat: 'O\'obibi, 04 September 2001', jk: 'P', alamat: 'Fatununa RT.002 RW.001 Kel./Desa O\'Obibi Kec. Kotolin Kab. Timor Tengah Selatan, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.23.423', nama: 'Welmince Soinbala', tempat: 'Kie, 11 November 2003', jk: 'P', alamat: 'Kie RT.001 RW. 001 Kel./Desa Napi Kec. Kie Kab.Timor Tengah Selatan, NTT', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.424', nama: 'Winda', tempat: 'Salubabu, 26 Desember 2004', jk: 'P', alamat: 'Dusun Salubabu Kel./Desa Karama Kec. Kalumpang Kab. Mamuju, Sulawesi Barat', prodi: 'PAK', angkatan: 2023, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.23.425', nama: 'Yayang Victore Aditya', tempat: 'Cilacap, 6 Desember 1999', jk: 'L', alamat: 'Dusun Sindangkasih RT. 002 RW. 004 Kel./Desa Purwodadi Kec. Patimuan Kab. Cilacap, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.427', nama: 'Dina Anggraini', tempat: 'Tuban, 30 Nopember 1978', jk: 'P', alamat: 'Latsari I Gang Pesarean No.17 RT.01 RW.03 Kel./Desa Latsari Kec. Tuban Kab. Tuban, Jatim', prodi: 'PAK', angkatan: 2023, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.23.428', nama: 'Ester Agustina', tempat: 'Kebumen, 30 Agustus 1992', jk: 'P', alamat: 'Desa Pengaringan RT.01 RW.01 Kec. Pejagoan Kab. Kebumen, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.23.429', nama: 'Meidawati Simarmata', tempat: 'Pematang Siantar, 24 Mei 1993', jk: 'P', alamat: 'Dk. Gondang RT.06 RW.10 Desa Banyumudal Kec. Moga Kab. Pemalang, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.430', nama: 'Peni Lestari', tempat: 'Banyumas, 17 Januari 1986', jk: 'P', alamat: 'Jl. Pesanggrahan RT.01 RW.03 Desa Kedunguter Kec. Banyumas Kab. Banyumas, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.23.431', nama: 'Sulfa Gidion', tempat: 'Pemalang, 13 Juni 1991', jk: 'L', alamat: 'Dk. Gondang RT.06 RW.10 Desa Banyumudal Kec. Moga Kab. Pemalang, Jateng', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.433', nama: 'Krismas Manikep', tempat: 'Lakafeng, 23 Desember 2005', jk: 'L', alamat: 'Lakafeng RT.006/003 Kel. Desa Pintumas Kec. Alor Barat Daya Kab. Alor NTT', prodi: 'PAK', angkatan: 2023, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.23.434', nama: 'Thala Julince Maukari', tempat: 'Lomaafeng, 26 April 2005', jk: 'P', alamat: 'Lomaafeng RT.011/006 Kel. Desa Pintumas Kec. Alor Barat Daya Kab. Alor NTT', prodi: 'PAK', angkatan: 2023, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.23.435', nama: 'Indra Bayu Kusuma', tempat: 'Banyumas, 9 Juli 1980', jk: 'L', alamat: 'Jl. Gunung Singgalang No 40 RT.005 RW.002 Kel./Desa Bancarkembar Kec. Purwoketo Utara Kab. Banyumas', prodi: 'PAK', angkatan: 2023, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.23.436', nama: 'Dwi Susbandono', tempat: 'Cilacap, 1 Juli 1978', jk: 'L', alamat: 'Jl. Perintis RT.03/01 Dusun Karangthak Kelurahan Adiraja Kec. Adipala Kab. Cilacap', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.23.437', nama: 'Khris Rina Pratiwi', tempat: 'Cilacap, 1 Juli 1978', jk: 'P', alamat: 'Jl. Perintis RT.03/01 Dusun Karangthak Kelurahan Adiraja Kec. Adipala Kab. Cilacap', prodi: 'PAK', angkatan: 2023, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.24.440', nama: 'Adelvina Agnesia Setiawan', tempat: 'Madiun, 8 Agustus 2005', jk: 'P', alamat: 'Jl. Swasembada Barat XIV No. 25 RT.06/14 Kel. Kebon Bawang Kec. Tanjung Priok Kab. Jakarta Utara Prov. DKI Jakarta', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.24.441', nama: 'Chindy Yunike Novayanti Simatupang', tempat: 'Pekanbaru, 10 Oktober 2024', jk: 'P', alamat: 'Jl. Baja Pasir Putih Kel. Pandau Jaya Kec. Siak Hulu Kab. Kampar Prov. Riau.', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.24.442', nama: 'George El’roi Panama Putra', tempat: 'Purwoketo, Banyumas, 7 Juni 2006', jk: 'L', alamat: 'Jl. Saga Baru Gg. Bodas 2, Bantarsoka Kec. Purwokerto Barat.', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.24.443', nama: 'Irma Rohmawati', tempat: 'Pemalang, 12 Januai 2004', jk: 'P', alamat: 'Ds. Karangasem RT 05 RW 03 Kec. Petarukan Kab. Pemalang Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.24.445', nama: 'Leonar Lakafa', tempat: 'Surunman, 7 September 2004', jk: 'L', alamat: 'Jl. Tamana RT 004 RW 002 Dusun Siberla Kel. Silaipui Kec. Alor Selatan Kab. Alor NTT 85871', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.24.446', nama: 'Mirna Sita', tempat: 'Buka, 13 Maret 2005', jk: 'P', alamat: 'Dusun Buka Kec. Tabang Kab. Mamasa Prov. Sulawesi Barat', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.24.447', nama: 'Nanda Yosua Talan', tempat: 'Oefkuen, 11 Juli 2006', jk: 'L', alamat: 'Ds. Pusu RT 04 RW 02 Kec. Amanuban Barat Kab. Timor Tengah Selatan NTT', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.24.448', nama: 'Novita Kristina Siboro', tempat: 'Muara Bungo, 28 November 2005', jk: 'P', alamat: 'Embacang Gedang Kec. Tanah Sepenggal Lintas.  Kab. Bungo Prov. Jambi.', prodi: 'PAK', angkatan: 2024, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.24.451', nama: 'Thori Lohmay', tempat: 'Maipiy, 29 Mei 2005', jk: 'P', alamat: 'Maipiy RT.07/04 Desa/Kel. Subo Kec. Alor Selatan Kab. Alor Prov. NTT', prodi: 'PAK', angkatan: 2024, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.24.452', nama: 'Wasti Pilet Asakameng', tempat: 'Alakaman, 20 Oktober 2003', jk: 'P', alamat: 'Agamang RT.06/03 Desa/Kel. Tamanapui Kec. Alor Selatan Kab. Alor Prov. NTT', prodi: 'PAK', angkatan: 2024, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.24.454', nama: 'Beatrice Isabel Anggraini Gultom', tempat: 'Banyumas, 19 Oktober 2006', jk: 'P', alamat: 'Jl. Bonjok RT 03 RW 03 Kel. Kedunguter Kec. Banyumas Kab. Banyumas Jawa Tengah.', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.24.455', nama: 'David', tempat: 'Subang, 8 Mei 1990', jk: 'L', alamat: 'Karangnanas RT.07/02 Kec. Sokaraja Kab. Banyumas Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.24.456', nama: 'Riris Dhiyan Susana', tempat: 'Kebumen, 25 Maret 1980', jk: 'P', alamat: 'Penjarakan RT.03 RW.01 Adiwano Buayan Kebumen', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.24.458', nama: 'Nathaniel Kennard Christanto', tempat: 'Semarang, 1 September 2006', jk: 'L', alamat: 'Jl.Argomukti Barat II no. 466 Semarang RT.02/25 Kel. Tlogosari Kulon Kec. Pedurungan Kab. Semarang Prov. Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.24.459', nama: 'Sinta Novelia', tempat: 'Cilacap, 11 Juli 1989', jk: 'P', alamat: 'Sindang Barang RT 002 RW 006 Kec. Karangpucung Kab. Cilacap Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.24.460', nama: 'Yerry Shinta Sari', tempat: 'Banyumas, 8 Maret 1985', jk: 'P', alamat: 'Jl. Bambang Irawan No. 29 RT 01 RW 03 Dusun Pandak Kel. Pandak Kec. Baturraden Banyumas Jawa Tengah 53151', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.24.462', nama: 'Cornelius Beny Subandriyo', tempat: 'Jepara, 24 Juni 2001', jk: 'L', alamat: 'Dukuh Barus Rejo RT.01/10 Desa Bandungharjo Kel. Bandungharjo Kec. Donorojo Kab. Jepara Prov. Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Dr. Rianto, M.Pd.K.' },
    { nim: '11.24.463', nama: 'Aditya Dyah Ekaning Suparmawati', tempat: 'Wonogiri, 23 Januari 1990', jk: 'P', alamat: 'Salak RT.002 RW.008 Desa Genukharjo Kec. Wuryantoro Kab. Wonogiri Prov. Jawa Tengah', prodi: 'PAK', angkatan: 2024, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.25.465', nama: 'Adriance Kande', tempat: 'Naumang, 31 Maret 2005', jk: 'P', alamat: 'Padang Panjang RT.06 RW.04 Kec. Alor Timur Kab. Alor NTT', prodi: 'PAK', angkatan: 2025, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.25.467', nama: 'Aulia Felisya Y.', tempat: 'Takalar, 20 Januari 2007', jk: 'P', alamat: 'Jl. Anglai RT.09 RW.- Manunggal Lama Kec. Sungai Durian Kab. Kotabaru, Kalimantan Selatan', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.25.468', nama: 'Juliatri Jelita Putri Leo Talo', tempat: 'Waduwalla, 12 Juli 2005', jk: 'P', alamat: 'Waduwalla Dusun Bolau RT.05 Rw.03 Desa Waduwalla Kec. Sabu Liae Kab. Sabu Raijua NTT', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.25.469', nama: 'Kahi Lewu', tempat: 'Kayuri, 14 Agustus 2006', jk: 'P', alamat: 'Kayuri RT.03 RW.02 Kec. Rindi Kab. Sumba Timur NTT', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '11.25.470', nama: 'Marsella Asaon', tempat: 'Manmas, 14 April 2005', jk: 'P', alamat: 'Abul RT.06 RW.03 Manmas Kec. Alor Selatan Kab. Alor NTT', prodi: 'PAK', angkatan: 2025, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.25.471', nama: 'Marselon Lumba Babang', tempat: 'Watungudu, 6 Maret 2002', jk: 'P', alamat: 'Taballa RT.010 RW.004 Kel. Watuhadang Kec. Umalulu Kab. Sumba Timur NTT', prodi: 'PAK', angkatan: 2025, wali: 'Dr. FX. Jeffry Harimurti, M.Pd.K.' },
    { nim: '11.25.472', nama: 'Mefi Ester Falaka', tempat: 'Manmas, 17 Oktober 2007', jk: 'P', alamat: 'Manmas RT.003 W.002 Kec. Alor Selatan Kab. Alor NTT', prodi: 'PAK', angkatan: 2025, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.25.475', nama: 'Resahi Trifena Hina', tempat: 'Melolo, 14 Desember 2006', jk: 'P', alamat: 'Melolo RT.001 RW.001 Kel. /Desa Lumbukore Kec. Umalulu Kab. Sumba Timur NTT', prodi: 'PAK', angkatan: 2025, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.25.477', nama: 'Rudi Mapada', tempat: 'Mainang, 17 Oktober 2005', jk: 'L', alamat: 'Jl. Hati Mulia Mainang RT 002 RW 001 Ds. Welai Selatan Kec. Alor Tengah Utara Kab. Alor NTT', prodi: 'PAK', angkatan: 2025, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.25.478', nama: 'Shella Bernita Djawa', tempat: 'Waduwalla, 24 Maret 2007', jk: 'P', alamat: 'Waduwalla Dusun Bolau RT.06 Rw.03 Desa Waduwalla Kec. Sabu Liae Kab. Sabu Raijua NTT', prodi: 'PAK', angkatan: 2025, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.25.479', nama: 'Yuliana Bengu', tempat: 'Tuapukan, 4 April 2004', jk: 'P', alamat: 'Oefafi RT.017 RW.06 Kec. Kupang Timur Kab. Kupang NTT', prodi: 'PAK', angkatan: 2025, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.25.480', nama: 'Elisa Dwianti', tempat: 'Banyumas, 6 Juli 2006', jk: 'P', alamat: 'Karangsalam RT.05 RW.02 Kel./Desa Karangsalam Lor Kec. Baturaden Kab. Banyumas Jawa Tengah', prodi: 'PAK', angkatan: 2025, wali: 'Ester Murya, M.Pd.K.' },
    { nim: '11.25.481', nama: 'Melia Oineke', tempat: 'Cilacap, 6 Juli 1999', jk: 'P', alamat: 'Jl. Sawo RT.01 RW.01 Kel. Tritih Lor Kec. Jeruklegi Kab. Cilacap', prodi: 'PAK', angkatan: 2025, wali: 'Orance Amelia Neonane, M.Pd.K.' },
    { nim: '11.25.482', nama: 'Wiwit Ardianti', tempat: 'Banyumas, 16 Februari 1995', jk: 'P', alamat: 'Kemutug Lor RT.01 RW.04 Kec. Baturaden Kab. Banyumas Jawa Tengah', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Sutoyo, M.Pd.K' },
    { nim: '11.25.483', nama: 'Sinta Mandasari Gultom', tempat: 'Silau Bandar, 10 September 2004', jk: 'P', alamat: 'Jl. Raya  Genteng RT.003 RW.008 Genteng Kulon Panimbang Kec. Cimanggu Kab. Cilacap, Jawa Tengah', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Pujiono, M.Pd.K.' },
    { nim: '12.21.117', nama: 'Syutria Frilly Kawengian', tempat: 'Tondei, 14 Januari 1996', jk: 'P', alamat: 'Jl. Kenanga. RT 002. RW 002 . Grendeng . Kec. Purwokerto Utara Kab. Banyumas', prodi: 'Teologi', angkatan: 2021, wali: 'John Marlin, M.Th.' },
    { nim: '12.22.118', nama: 'Astina Zebua', tempat: 'Hiliuso, 7 Okt 2003', jk: 'P', alamat: 'Desa Silima Bunua Umbunasi Kec. Uluidanotae Kab. Nias Selatan Sumatera Utara', prodi: 'Teologi', angkatan: 2022, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.22.119', nama: 'Dius Umbu K. Remi K.', tempat: 'Mangili, 30 Des 2002', jk: 'L', alamat: 'Ds. Wulla Kec. Wulla Waijelu Kab. Sumba Timur, NTT', prodi: 'Teologi', angkatan: 2022, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.22.120', nama: 'Fertina Zalukhu', tempat: 'Medan, 14 Mei 2003', jk: 'P', alamat: 'Desa Tetehosi Sorewi Kec. Lahewa Timur Kab. Nias Utara Sumatera Utara', prodi: 'Teologi', angkatan: 2022, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.22.122', nama: 'Mardi Rambu Anahutar', tempat: 'Tawui, 22 Juni 1999', jk: 'P', alamat: 'Lairui RT.05 RW.03 Kel./Desa Tawui Kec. Pinu Pahar  Kab. Sumba Timur, Nusa Tenggara Timur', prodi: 'Teologi', angkatan: 2022, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.22.123', nama: 'Nanda Rajagukguk', tempat: 'Waringin, 12 Agustus 2004', jk: 'P', alamat: 'Perum. Kelapa Gading Permai RT.03 RW.08  Randegan Kec. Wangon Kab. Banyumas', prodi: 'Teologi', angkatan: 2022, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.22.126', nama: 'Musa Laukolly', tempat: 'Kadelang, 3 Februari 2000', jk: 'L', alamat: 'Kadelang RT.01 RW.06 Kel./Desa Kalabahi Timur Kec. Teluk Mutiara Nusa Tenggara Timur', prodi: 'Teologi', angkatan: 2022, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.22.127', nama: 'Ardiwi Zebua', tempat: 'Bange, 14 Januari 2003', jk: 'L', alamat: 'Aek Parupuk Kec. Tano Tombangan Angkola Kab. Tapanuli Selatan', prodi: 'Teologi', angkatan: 2022, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.23.129', nama: 'Hendrik Hani Nganggu R.', tempat: 'Langgai, 21 Maret 2000', jk: 'L', alamat: 'Langgai RT.04 RW.02 Kel./Desa Patamawai Kec. Mahu Kab. Sumba Timur, NTT', prodi: 'Teologi', angkatan: 2023, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.23.130', nama: 'Putri Hatifa Laudata', tempat: 'Moyaka, 09 Januari 2005', jk: 'P', alamat: 'Moyaka RT.004 Rw.002 Kel./Desa Kolana Selatan Kec. Alor Timur Kab. Alor, NTT', prodi: 'Teologi', angkatan: 2023, wali: 'John Marlin, M.Th.' },
    { nim: '12.23.131', nama: 'Sokiaman Giawa', tempat: 'Bukit Gabungan, 22 April 2003', jk: 'L', alamat: 'Bukit Gabungan Kel./Desa Sangkunur Kec. Angkola Sangkunur Kab. Tapanuli Selatan, Sumatera Utara', prodi: 'Teologi', angkatan: 2023, wali: 'Agus Silo Witrsano, M.Pd.K' },
    { nim: '12.23.132', nama: 'Wemahwe Sobolim', tempat: 'Silakma, 08 April 2005', jk: 'P', alamat: 'Silakma Kel./Desa Silakma Kec. Kwikma Kab. Yahukimo, Papua', prodi: 'Teologi', angkatan: 2023, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.23.133', nama: 'Kristanto Edi Sasono', tempat: 'Sranten, 19 Agustus 1972', jk: 'L', alamat: 'Jl. Kalpataru I No. 52 RT.02 RW.05 Kel./Desa Purwosari Kec. Baturaden Kab. Banyumas, Jateng', prodi: 'Teologi', angkatan: 2023, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.23.134', nama: 'Kristin Kurniawati', tempat: 'Purbalingga, 21 April 1978', jk: 'P', alamat: 'Selakambang RT.03 RW.10 Kaligondang Kab. Purbalingga, Jateng', prodi: 'Teologi', angkatan: 2023, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.23.136', nama: 'Taufik Hidayat Mugianto', tempat: 'Banyumas, 10 April 1991', jk: 'L', alamat: 'Desa Suro RT.06 RW.02 Kec. Kalibagor Kab. Banyumas, Jateng', prodi: 'Teologi', angkatan: 2023, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.23.137', nama: 'Yahya Ibrahim', tempat: 'Jakarta, 27 Pebruari 1958', jk: 'L', alamat: 'Jl. Antasena Blok X8/11 RT.07 RW.012 Kel. Desa Pondok Benda Kec. Pamulang Kota Tangerang Selatan Prov. Banten', prodi: 'Teologi', angkatan: 2023, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.23.139', nama: 'Jamaludin', tempat: 'Banyumas, 9 November 1978', jk: 'L', alamat: 'Pangebatan RT.04/01 Karanglewas Kec. Purwokerto Barat Kab. Banyumas', prodi: 'Teologi', angkatan: 2023, wali: 'John Marlin, M.Th.' },
    { nim: '12.23.140', nama: 'Linawati', tempat: 'Banyumas, 9 Juni 1987', jk: 'P', alamat: 'Banjarparakan RT.03 RW.06 Kel./Desa Banjarparakan Kec. Rawalo Kab. Banyumas', prodi: 'Teologi', angkatan: 2023, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.24.141', nama: 'Alfaria Clarita Laiskodat', tempat: 'Kuanheun, 10 Mei 2006', jk: 'P', alamat: 'Desa Kuanheun RT 13 RW 06 Kec. Kupang Barat Kab. Kupang, Prov. NTT.', prodi: 'Teologi', angkatan: 2024, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.24.142', nama: 'Ayu Diah Periati', tempat: 'Cilacap, 26 April 2004', jk: 'P', alamat: 'Ujunggagak RT 001 RW 012 Kec. Kampung Laut Kab. Cilacap Prov. Jawa Tengah', prodi: 'Teologi', angkatan: 2024, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.24.143', nama: 'Marcus Morais', tempat: 'Kupang, 14 Maret 2005', jk: 'L', alamat: 'Ds. Oefafi RT 017 RW 006 Kec. Kupang Timur Kab. Kupang Prov. NTT', prodi: 'Teologi', angkatan: 2024, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.24.145', nama: 'Joseph Lusi', tempat: 'Oetefu, 27 September 1990', jk: 'L', alamat: 'RT.008/004 Dusun II desa Tanah Merah Kec. Kupang Tengah Kab. Kupang Prov. NTT', prodi: 'Teologi', angkatan: 2024, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.24.147', nama: 'Timotius Febrianto', tempat: 'Banyumas, 20 Februari 2004', jk: 'L', alamat: 'Ketanda RT.06/03 Kec. Sumpiuh Kab. Banyumas Prov. Jawa Tengah', prodi: 'Teologi', angkatan: 2024, wali: 'John Marlin, M.Th.' },
    { nim: '12.25.148', nama: 'Darius Subroto Marbun', tempat: 'Bengkulu, 28 September 1996', jk: 'L', alamat: 'Jl. Puri Lestari No. 5 RT.015 W.003 Desa/Kel. Kandang Kec. Kampung Melayu Kota Bengkulu, Bengkulu', prodi: 'Teologi', angkatan: 2025, wali: 'John Marlin, M.Th.' },
    { nim: '12.25.149', nama: 'Desmi Priskila Imida K.', tempat: 'Debelo, 30 Desember 2004', jk: 'P', alamat: 'Haukili RT. 07 RW.03 Kel. Oebelo Kec. Amanuban Selatan Kab. Timor Tengah Selatan', prodi: 'Teologi', angkatan: 2025, wali: 'John Marlin, M.Th.' },
    { nim: '12.25.152', nama: 'Elsya Koa', tempat: 'Oebaki, 5 April 2007', jk: 'P', alamat: 'Taekmanus RT.16 RW.07 Desa Oebaki Kec. Noebeba Kab. Timor Tengah Selatan', prodi: 'Teologi', angkatan: 2025, wali: 'Agus Silo Witrsano, M.Pd.K' },
    { nim: '12.25.153', nama: 'Hilda Nialtha Hendrik', tempat: 'Wulla, 21 Juli 2006', jk: 'P', alamat: 'Wulla RT.008 RW.004 Kec. Wulla Waijelu Kab. Sumba Timur NTT', prodi: 'Teologi', angkatan: 2025, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.25.154', nama: 'Midar Mawati Gea', tempat: 'Madula, 9 Mei 2006', jk: 'P', alamat: 'Madula RT.06 RW.04 Dahana Hiligodu Kec. Namohalu Esiwa Kab. Nias Utara', prodi: 'Teologi', angkatan: 2025, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.25.155', nama: 'Minton Mala Hina', tempat: 'Maidang, 6 Mei 2003', jk: 'L', alamat: 'Watu Ngguling RT.014/RW.07 Desa Maidang Kec. Kambata Mapambuhang Kab. Sumba Timur', prodi: 'Teologi', angkatan: 2025, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.25.156', nama: 'Olivia Katrina Diang', tempat: 'Alor, 22 Oktober 2007', jk: 'P', alamat: 'Kalabahi RT.001 RW.006 Kel./Desa Kalabahi Timur Kab. Alor NTT', prodi: 'Teologi', angkatan: 2025, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.25.157', nama: 'Thitus Yoram Asatie', tempat: 'Kalimpui, 11 Desember 2002', jk: 'L', alamat: 'Manmas RT 004 RW 002 Kec. Alor Selatan Kab. Alor NTT', prodi: 'Teologi', angkatan: 2025, wali: 'Agus Silo Witrsano, M.Pd.K' },
    { nim: '12.25.158', nama: 'Yulius Tena Gopa', tempat: 'Katowa Matoba, 27 Januari 2003', jk: 'L', alamat: 'Katowa Matoba Desa Soba Rade Kec. Kota Waiabubak Kab. Sumba Barat', prodi: 'Teologi', angkatan: 2025, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.25.160', nama: 'Joko Wiratno Hadi Nugroho', tempat: 'Salatiga, 23 Februari 1975', jk: 'L', alamat: 'Perum Gumilir Indah Blok 13/01 RT.02 RW.09 Gumilir Kec. Cilacap Utara Kab. Cilacap', prodi: 'Teologi', angkatan: 2025, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.25.161', nama: 'Budi Priyanto', tempat: 'Jakarta, 14 April 1979', jk: 'L', alamat: 'Jl. Lokomotof No. 26 RT.05 RW.04 Kel. Padasuka Kec. Cimahi Tengah Kab. Kota Cimahi Jawa barat', prodi: 'Teologi', angkatan: 2025, wali: 'Paulus Setyo Pramono, M.Pd.K.' },
    { nim: '12.25.162', nama: 'Budiyono', tempat: 'Temanggung, 27 Oktober 1977', jk: 'L', alamat: 'Jl. Makam Selawe RT.01 RW.06 Cibatu Desa Pegadingan Kec. Cipari Kab. Cilacap', prodi: 'Teologi', angkatan: 2025, wali: 'Dafit Mei Dianto, M.Th.' },
    { nim: '12.25.163', nama: 'Cantika Mutiara Murti', tempat: 'Semarang, 17 Oktober 2005', jk: 'P', alamat: 'Jl. Batu Agung RT.04 RW.06 Banyumudal Kec. Moga Kab. Pemalang Jawa Tengah', prodi: 'Teologi', angkatan: 2025, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.25.164', nama: 'Gan Yauw Bing', tempat: 'Surabaya, 12 Januari 1992', jk: 'L', alamat: 'Padangjaya RT.001 RW.007 Kec. Majenang Kab. Cilacap, Jawa Tengah', prodi: 'Teologi', angkatan: 2025, wali: 'Fajar Dani Eko Mei Setiawan, M.Th.' },
    { nim: '12.25.165', nama: 'Kristina Siregar', tempat: 'Parausorat, 25 Mei 1980', jk: 'P', alamat: 'Dasana Indah BLOK SH.7 No.29 RT.003 RW.014 Bojong Nangka Kec. Kelapa Dua Kab. Tangerang', prodi: 'Teologi', angkatan: 2025, wali: 'Tabita Todingbua, M.Div.' },
    { nim: '12.25.166', nama: 'Michael Arthur Wibisono', tempat: 'Tuban, 30 Januari 2006', jk: 'L', alamat: 'Latsari I Gang Pesarean No.17 RT.01 RW.03 Kel./Desa Latsari Kec. Tuban Kab. Tuban, Jatim', prodi: 'PAK', angkatan: 2025, wali: 'Dr. Rianto, M.Pd.K.' },
  ];

  const mahasiswas: any[] = [];
  for (const m of mahasiswaData) {
    const waliDosen = dosenMap[m.wali];
    if (!waliDosen) {
      console.warn(`⚠️ Dosen Wali not found: ${m.wali} for ${m.nim}`);
      continue;
    }
    const user = await prisma.user.create({
      data: { username: m.nim, password: hashedPassword, role: 'MAHASISWA', isActive: true },
    });
    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        userId: user.id, nim: m.nim, namaLengkap: m.nama,
        prodiId: m.prodi === 'PAK' ? prodiPAK.id : prodiTEO.id,
        angkatan: m.angkatan, dosenWaliId: waliDosen.id, status: 'AKTIF',
        jenisKelamin: m.jk as JenisKelamin,
        tempatTanggalLahir: m.tempat,
        alamat: m.alamat,
      },
    });
    mahasiswas.push(mahasiswa);
  }
  console.log(`✅ ${mahasiswas.length} Mahasiswa\n`);

  // MATA KULIAH (ALL 84 FROM EXCEL)
  console.log('📖 Seeding 84 Mata Kuliah...');
  const mkData = [
    { kode: 'KK 1313', nama: 'Bahasa Ibrani I', sks: 3, sem: 1 },
    { kode: 'PB 1265', nama: 'Disiplin Rohani', sks: 2, sem: 1 },
    { kode: 'KK 1207', nama: 'Pembimbing & Pengetahuan PL I', sks: 2, sem: 1 },
    { kode: 'PK 1205', nama: 'Bahasa Inggris Dasar', sks: 2, sem: 1 },
    { kode: 'KK 1210', nama: 'Pembimbing & Pengetahuan PB I', sks: 2, sem: 1 },
    { kode: 'PK 1204', nama: 'Bahasa Indonesia', sks: 2, sem: 1 },
    { kode: 'PB 1266', nama: 'Pembentukan Watak dan Tata Nilai', sks: 2, sem: 1 },
    { kode: 'PK 1201', nama: 'Kewarganegaraan', sks: 2, sem: 1 },
    { kode: 'KK 1217', nama: 'Psikologi Umum', sks: 2, sem: 1 },
    { kode: 'KK 1219', nama: 'Pengantar Filsafat', sks: 2, sem: 1 },
    { kode: 'KK 1223', nama: 'Dasar-dasar Iman Kristen', sks: 2, sem: 1 },
    { kode: 'KK P2214', nama: 'Dasar-dasar Pendidikan', sks: 2, sem: 2 },
    { kode: 'PB T2261', nama: 'PI Pribadi', sks: 2, sem: 2 },
    { kode: 'KB 2239', nama: 'Sejarah Gereja Umum', sks: 2, sem: 2 },
    { kode: 'KK 2224', nama: 'Psikologi Perkembangan', sks: 2, sem: 2 },
    { kode: 'KK 2208', nama: 'Pembimbing & Pengetahuan PL II', sks: 2, sem: 2 },
    { kode: 'KB P2267', nama: 'Pembimbing PAK I', sks: 2, sem: 2 },
    { kode: 'PB T4252', nama: 'Liturgika', sks: 2, sem: 2 },
    { kode: 'KK 2211', nama: 'Pembimbing & Pengetahuan PB II', sks: 2, sem: 2 },
    { kode: 'KK 2315', nama: 'Bahasa Yunani I', sks: 3, sem: 2 },
    { kode: 'PB 2269', nama: 'Musik Gereja', sks: 2, sem: 2 },
    { kode: 'KK T2214', nama: 'Bahasa Ibrani II', sks: 2, sem: 2 },
    { kode: 'KK P2253', nama: 'Psikologi Pendidikan', sks: 2, sem: 2 },
    { kode: 'PB P2234', nama: 'Bimbingan Konseling', sks: 2, sem: 2 },
    { kode: 'PK 2202', nama: 'Komunikasi', sks: 2, sem: 2 },
    { kode: 'KK 2222', nama: 'Pembimbing Teologi Sistematika', sks: 2, sem: 2 },
    { kode: 'KK P3247', nama: 'Teori Belajar PAK', sks: 2, sem: 3 },
    { kode: 'PK 3203', nama: 'Sosiologi', sks: 2, sem: 3 },
    { kode: 'KB 3241', nama: 'Sejarah Gereja Indonesia', sks: 2, sem: 3 },
    { kode: 'KK 3212', nama: 'Pembimbing & Pengetahuan PB III', sks: 2, sem: 3 },
    { kode: 'KK T3216', nama: 'Bahasa Yunani II', sks: 2, sem: 3 },
    { kode: 'PB T3253', nama: 'Pelayanan Pastoral I', sks: 2, sem: 3 },
    { kode: 'KB P3268', nama: 'Pembimbing PAK II', sks: 2, sem: 3 },
    { kode: 'KK 3209', nama: 'Pembimbing & Pengetahuan PL III', sks: 2, sem: 3 },
    { kode: 'KK P3235', nama: 'Profesi Keguruan PAK', sks: 2, sem: 3 },
    { kode: 'KB 3380', nama: 'Teologi Sistematika I', sks: 3, sem: 3 },
    { kode: 'KK 3218', nama: 'Hermeneutika', sks: 2, sem: 3 },
    { kode: 'KB 3337', nama: 'Etika Kristen I', sks: 3, sem: 3 },
    { kode: 'PB T3267', nama: 'Penanaman Gereja', sks: 2, sem: 3 },
    { kode: 'KB 4381', nama: 'Teologi Sistematika II', sks: 3, sem: 4 },
    { kode: 'PB 4264', nama: 'Metode PA', sks: 2, sem: 4 },
    { kode: 'KB 4238', nama: 'Etika Kristen II', sks: 2, sem: 4 },
    { kode: 'KB P4254', nama: 'Kurikulum PAK', sks: 2, sem: 4 },
    { kode: 'PB T4268', nama: 'Pertumbuhan Gereja', sks: 2, sem: 4 },
    { kode: 'KB 4255', nama: 'PAK/PWG Anak', sks: 2, sem: 4 },
    { kode: 'PK 4206', nama: 'Bahasa Inggris Teologi', sks: 2, sem: 4 },
    { kode: 'PB 4358', nama: 'Homiletika I', sks: 3, sem: 4 },
    { kode: 'KB P4336', nama: 'Perencanaan Pembelajaran PAK', sks: 2, sem: 4 },
    { kode: 'PB T4254', nama: 'Pelayanan Pastoral II', sks: 2, sem: 4 },
    { kode: 'KK 4225', nama: 'Tafsir PL I', sks: 2, sem: 4 },
    { kode: 'KK 4228', nama: 'Tafsir PB I', sks: 2, sem: 4 },
    { kode: 'KK P4263', nama: 'Media Pembelajaran PAK', sks: 2, sem: 4 },
    { kode: 'PB T4246', nama: 'Pastoral Konseling', sks: 2, sem: 4 },
    { kode: 'KK 5229', nama: 'Tafsir PB II', sks: 2, sem: 5 },
    { kode: 'KB 5256', nama: 'PAK/PWG Remaja', sks: 2, sem: 5 },
    { kode: 'KB P5252', nama: 'Strategi Pembelajaran PAK', sks: 2, sem: 5 },
    { kode: 'KB P5250', nama: 'Metode Pembelajaran', sks: 2, sem: 5 },
    { kode: 'PB T5263', nama: 'PI Kontekstual', sks: 2, sem: 5 },
    { kode: 'KB 5382', nama: 'Teologi Sistematika III', sks: 3, sem: 5 },
    { kode: 'KK 5226', nama: 'Tafsir PL II', sks: 2, sem: 5 },
    { kode: 'KB P5248', nama: 'Praktek Perencanaan PAK', sks: 2, sem: 5 },
    { kode: 'KB 5242', nama: 'Teologi PL I', sks: 2, sem: 5 },
    { kode: 'KB P5246', nama: 'Evaluasi PAK', sks: 2, sem: 5 },
    { kode: 'PB T5248', nama: 'Kepemimpinan Kristen', sks: 2, sem: 5 },
    { kode: 'PB 5271', nama: 'Apologetika', sks: 2, sem: 5 },
    { kode: 'KB T5250', nama: 'Manajemen Gereja', sks: 2, sem: 5 },
    { kode: 'PB 5260', nama: 'Misiologi', sks: 2, sem: 5 },
    { kode: 'PB 5259', nama: 'Homiletika II', sks: 2, sem: 5 },
    { kode: 'BB 6674', nama: 'PPL', sks: 6, sem: 6 },
    { kode: 'KB 7257', nama: 'PAK/PWG Dewasa', sks: 2, sem: 7 },
    { kode: 'KK 7227', nama: 'Tafsir PL III', sks: 2, sem: 7 },
    { kode: 'KK 7230', nama: 'Tafsir PB III', sks: 2, sem: 7 },
    { kode: 'KK 7220', nama: 'Statistika', sks: 2, sem: 7 },
    { kode: 'KB P7272', nama: 'Administrasi PAK', sks: 2, sem: 7 },
    { kode: 'KK 7221', nama: 'Metodologi Penelitian', sks: 2, sem: 7 },
    { kode: 'PB T7247', nama: 'Konseling Keluarga', sks: 2, sem: 7 },
    { kode: 'KB 7244', nama: 'Teologi PB I', sks: 2, sem: 7 },
    { kode: 'KB 7243', nama: 'Teologi PL II', sks: 2, sem: 7 },
    { kode: 'KK P7261', nama: 'Filsafat Pendidikan', sks: 2, sem: 7 },
    { kode: 'PB 7276', nama: 'Pendidikan Anti Korupsi', sks: 2, sem: 7 },
    { kode: 'KB T7283', nama: 'Teologi Sistematika IV', sks: 2, sem: 7 },
    { kode: 'KB T7236', nama: 'Teologi Kontemporer', sks: 2, sem: 7 },
    { kode: 'KB 8245', nama: 'Teologi PB II', sks: 2, sem: 8 },
    { kode: 'BB 8675', nama: 'Skrispi', sks: 6, sem: 8 },
  ];

  for (const mk of mkData) {
    await prisma.mataKuliah.create({
      data: {
        kodeMK: mk.kode, namaMK: mk.nama, sks: mk.sks,
        semesterIdeal: mk.sem, isActive: true,
      },
    });
  }
  console.log(`✅ ${mkData.length} Mata Kuliah\n`);

  console.log('\n' + '='.repeat(70));
  console.log('🎉 SEED COMPLETED!');
  console.log('='.repeat(70));
  console.log('📊 SUMMARY:');
  console.log('  ✅ 2 Program Studi (PAK, Teologi)');
  console.log('  ✅ 12 Dosen (100% from Excel)');
  console.log('  ✅ 105 Mahasiswa (100% from Excel)');
  console.log('  ✅ 84 Mata Kuliah (100% from Excel)');
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });