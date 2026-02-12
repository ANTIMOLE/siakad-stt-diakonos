import ExcelJS from 'exceljs';
import { Response } from 'express';

/**
 * Format date to Indonesian format
 */
const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Create styled header row
 */
const styleHeaderRow = (worksheet: ExcelJS.Worksheet) => {
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
};

// ============================================
// 1. MAHASISWA EXPORT (EXISTING)
// ============================================
export const exportMahasiswaToExcel = async (
  mahasiswa: any[],
  res: Response,
  filters?: {
    prodi?: string;
    angkatan?: number;
    status?: string;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Mahasiswa');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIM', key: 'nim', width: 12 },
    { header: 'Nama Lengkap', key: 'namaLengkap', width: 25 },
    { header: 'Tempat/Tgl Lahir', key: 'tempatTanggalLahir', width: 20 },
    { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
    { header: 'Alamat', key: 'alamat', width: 30 },
    { header: 'Program Studi', key: 'prodi', width: 20 },
    { header: 'Angkatan', key: 'angkatan', width: 10 },
    { header: 'Dosen Wali', key: 'dosenWali', width: 25 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Akun Aktif', key: 'akunAktif', width: 12 },
    { header: 'Tgl Registrasi', key: 'tglRegistrasi', width: 18 },
  ];

  styleHeaderRow(worksheet);

  mahasiswa.forEach((m, index) => {
    worksheet.addRow({
      no: index + 1,
      nim: m.nim,
      namaLengkap: m.namaLengkap,
      tempatTanggalLahir: m.tempatTanggalLahir || '-',
      jenisKelamin: m.jenisKelamin === 'L' ? 'Laki-laki' : m.jenisKelamin === 'P' ? 'Perempuan' : '-',
      alamat: m.alamat || '-',
      prodi: m.prodi?.nama || '-',
      angkatan: m.angkatan,
      dosenWali: m.dosenWali?.namaLengkap || '-',
      status: m.status,
      akunAktif: m.user?.isActive ? 'Ya' : 'Tidak',
      tglRegistrasi: formatDate(m.createdAt),
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `Mahasiswa_${timestamp}`;
  
  if (filters?.prodi) filename += `_${filters.prodi}`;
  if (filters?.angkatan) filename += `_${filters.angkatan}`;
  if (filters?.status) filename += `_${filters.status}`;
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ============================================
// 2. DOSEN EXPORT (EXISTING)
// ============================================
export const exportDosenToExcel = async (
  dosen: any[],
  res: Response,
  filters?: {
    prodi?: string;
    status?: string;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Dosen');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIDN', key: 'nidn', width: 12 },
    { header: 'NUPTK', key: 'nuptk', width: 18 },
    { header: 'Nama Lengkap', key: 'namaLengkap', width: 25 },
    { header: 'Program Studi', key: 'prodi', width: 20 },
    { header: 'Tempat Lahir', key: 'tempatLahir', width: 15 },
    { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
    { header: 'Posisi', key: 'posisi', width: 20 },
    { header: 'Jabatan Fungsional', key: 'jafung', width: 20 },
    { header: 'Alumni', key: 'alumni', width: 25 },
    { header: 'Lama Mengajar', key: 'lamaMengajar', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Jumlah Bimbingan', key: 'bimbingan', width: 12 },
    { header: 'Jumlah Kelas', key: 'kelas', width: 12 },
    { header: 'Akun Aktif', key: 'akunAktif', width: 12 },
    { header: 'Tgl Registrasi', key: 'tglRegistrasi', width: 18 },
  ];

  styleHeaderRow(worksheet);

  dosen.forEach((d, index) => {
    worksheet.addRow({
      no: index + 1,
      nidn: d.nidn,
      nuptk: d.nuptk,
      namaLengkap: d.namaLengkap,
      prodi: d.prodi?.nama || '-',
      tempatLahir: d.tempatLahir || '-',
      tanggalLahir: formatDate(d.tanggalLahir),
      posisi: d.posisi || '-',
      jafung: d.jafung || '-',
      alumni: d.alumni || '-',
      lamaMengajar: d.lamaMengajar || '-',
      status: d.status,
      bimbingan: d._count?.mahasiswaBimbingan || 0,
      kelas: d._count?.kelasMataKuliah || 0,
      akunAktif: d.user?.isActive ? 'Ya' : 'Tidak',
      tglRegistrasi: formatDate(d.createdAt),
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `Dosen_${timestamp}`;
  
  if (filters?.prodi) filename += `_${filters.prodi}`;
  if (filters?.status) filename += `_${filters.status}`;
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ============================================
// 3. MATA KULIAH EXPORT (EXISTING)
// ============================================
export const exportMataKuliahToExcel = async (
  mataKuliah: any[],
  res: Response,
  filters?: {
    semesterIdeal?: number;
    isActive?: boolean;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Mata Kuliah');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Kode MK', key: 'kodeMK', width: 12 },
    { header: 'Nama Mata Kuliah', key: 'namaMK', width: 35 },
    { header: 'SKS', key: 'sks', width: 8 },
    { header: 'Semester Ideal', key: 'semesterIdeal', width: 12 },
    { header: 'Lintas Prodi', key: 'lintasProdi', width: 12 },
    { header: 'Deskripsi', key: 'deskripsi', width: 40 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Jumlah Kelas', key: 'jumlahKelas', width: 12 },
    { header: 'Tgl Dibuat', key: 'tglDibuat', width: 18 },
  ];

  styleHeaderRow(worksheet);

  mataKuliah.forEach((mk, index) => {
    worksheet.addRow({
      no: index + 1,
      kodeMK: mk.kodeMK,
      namaMK: mk.namaMK,
      sks: mk.sks,
      semesterIdeal: mk.semesterIdeal,
      lintasProdi: mk.isLintasProdi ? 'Ya' : 'Tidak',
      deskripsi: mk.deskripsi || '-',
      status: mk.isActive ? 'Aktif' : 'Nonaktif',
      jumlahKelas: mk._count?.kelasMataKuliah || 0,
      tglDibuat: formatDate(mk.createdAt),
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `MataKuliah_${timestamp}`;
  
  if (filters?.semesterIdeal) filename += `_Sem${filters.semesterIdeal}`;
  if (filters?.isActive !== undefined) filename += filters.isActive ? '_Aktif' : '_Nonaktif';
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ============================================
// 4. KELAS MK EXPORT (NEW)
// ============================================
export const exportKelasMKToExcel = async (
  kelasList: any[],
  res: Response,
  filters?: {
    semester?: string;
    hari?: string;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Kelas');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Kode MK', key: 'kodeMK', width: 12 },
    { header: 'Nama Mata Kuliah', key: 'namaMK', width: 35 },
    { header: 'SKS', key: 'sks', width: 8 },
    { header: 'Dosen', key: 'dosen', width: 25 },
    { header: 'Hari', key: 'hari', width: 10 },
    { header: 'Jam', key: 'jam', width: 15 },
    { header: 'Ruangan', key: 'ruangan', width: 15 },
    { header: 'Kuota', key: 'kuota', width: 10 },
    { header: 'Terisi', key: 'terisi', width: 10 },
    { header: 'Semester', key: 'semester', width: 20 },
  ];

  styleHeaderRow(worksheet);

  kelasList.forEach((k, index) => {
    worksheet.addRow({
      no: index + 1,
      kodeMK: k.mataKuliah?.kodeMK || '-',
      namaMK: k.mataKuliah?.namaMK || '-',
      sks: k.mataKuliah?.sks || 0,
      dosen: k.dosen?.namaLengkap || '-',
      hari: k.hari,
      jam: `${k.jamMulai} - ${k.jamSelesai}`,
      ruangan: k.ruangan?.nama || '-',
      kuota: k.kuotaMax,
      terisi: k._count?.krsDetail || 0,
      semester: k.semester ? `${k.semester.tahunAkademik} ${k.semester.periode}` : '-',
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `Kelas_${timestamp}`;
  
  if (filters?.semester) filename += `_${filters.semester}`;
  if (filters?.hari) filename += `_${filters.hari}`;
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ============================================
// 5. PAKET KRS EXPORT (NEW)
// ============================================
export const exportPaketKRSToExcel = async (
  paketList: any[],
  res: Response,
  filters?: {
    angkatan?: number;
    prodi?: string;
    semester?: string;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Paket KRS');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Paket', key: 'namaPaket', width: 35 },
    { header: 'Angkatan', key: 'angkatan', width: 10 },
    { header: 'Program Studi', key: 'prodi', width: 20 },
    { header: 'Semester Paket', key: 'semesterPaket', width: 12 },
    { header: 'Semester Akademik', key: 'semesterAkademik', width: 20 },
    { header: 'Jumlah MK', key: 'jumlahMK', width: 10 },
    { header: 'Total SKS', key: 'totalSKS', width: 10 },
    { header: 'Tgl Dibuat', key: 'tglDibuat', width: 18 },
  ];

  styleHeaderRow(worksheet);

  paketList.forEach((p, index) => {
    worksheet.addRow({
      no: index + 1,
      namaPaket: p.namaPaket,
      angkatan: p.angkatan,
      prodi: p.prodi?.nama || '-',
      semesterPaket: p.semesterPaket,
      semesterAkademik: p.semester ? `${p.semester.tahunAkademik} ${p.semester.periode}` : '-',
      jumlahMK: p._count?.detail || 0,
      totalSKS: p.totalSKS,
      tglDibuat: formatDate(p.createdAt),
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `PaketKRS_${timestamp}`;
  
  if (filters?.angkatan) filename += `_${filters.angkatan}`;
  if (filters?.prodi) filename += `_${filters.prodi}`;
  if (filters?.semester) filename += `_${filters.semester}`;
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};

// ============================================
// 6. KRS EXPORT (NEW)
// ============================================
export const exportKRSToExcel = async (
  krsList: any[],
  res: Response,
  filters?: {
    semester?: string;
    status?: string;
  }
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data KRS');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'NIM', key: 'nim', width: 12 },
    { header: 'Nama Mahasiswa', key: 'namaMahasiswa', width: 25 },
    { header: 'Program Studi', key: 'prodi', width: 20 },
    { header: 'Semester', key: 'semester', width: 20 },
    { header: 'Total SKS', key: 'totalSKS', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tanggal Submit', key: 'tglSubmit', width: 18 },
    { header: 'Tanggal Approval', key: 'tglApproval', width: 18 },
    { header: 'Disetujui Oleh', key: 'approvedBy', width: 25 },
    { header: 'Catatan', key: 'catatan', width: 30 },
  ];

  styleHeaderRow(worksheet);

  krsList.forEach((k, index) => {
    // ✅ FIXED: Get approver name based on role
    let approverName = '-';
    if (k.approvedBy) {
      if (k.approvedBy.role === 'DOSEN' && k.approvedBy.dosen) {
        approverName = k.approvedBy.dosen.namaLengkap;
      } else if (k.approvedBy.role === 'MAHASISWA' && k.approvedBy.mahasiswa) {
        approverName = k.approvedBy.mahasiswa.namaLengkap;
      } else if (k.approvedBy.username) {
        // ADMIN or KEUANGAN - use username
        approverName = k.approvedBy.username;
      }
    }

    worksheet.addRow({
      no: index + 1,
      nim: k.mahasiswa?.nim || '-',
      namaMahasiswa: k.mahasiswa?.namaLengkap || '-',
      prodi: k.mahasiswa?.prodi?.nama || '-',
      semester: k.semester ? `${k.semester.tahunAkademik} ${k.semester.periode}` : '-',
      totalSKS: k.totalSKS,
      status: k.status,
      tglSubmit: formatDate(k.tanggalSubmit),
      tglApproval: formatDate(k.tanggalApproval),
      approvedBy: approverName,
      catatan: k.catatanAdmin || '-',
    });
  });

  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `KRS_${timestamp}`;
  
  if (filters?.semester) filename += `_${filters.semester}`;
  if (filters?.status) filename += `_${filters.status}`;
  
  filename += '.xlsx';

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
};