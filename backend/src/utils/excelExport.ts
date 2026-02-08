/**
 * Excel Export Utility
 * Generate Excel files for data export
 * ✅ Uses xlsx library for Excel generation
 */

import * as XLSX from 'xlsx';
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
 * Export Mahasiswa to Excel
 */
export const exportMahasiswaToExcel = (
  mahasiswa: any[],
  res: Response,
  filters?: {
    prodi?: string;
    angkatan?: number;
    status?: string;
  }
) => {
  // Prepare data
  const data = mahasiswa.map((m, index) => ({
    'No': index + 1,
    'NIM': m.nim,
    'Nama Lengkap': m.namaLengkap,
    'Tempat/Tgl Lahir': m.tempatTanggalLahir || '-',
    'Jenis Kelamin': m.jenisKelamin === 'L' ? 'Laki-laki' : m.jenisKelamin === 'P' ? 'Perempuan' : '-',
    'Alamat': m.alamat || '-',
    'Program Studi': m.prodi?.nama || '-',
    'Angkatan': m.angkatan,
    'Dosen Wali': m.dosenWali?.namaLengkap || '-',
    'Status': m.status,
    'Akun Aktif': m.user?.isActive ? 'Ya' : 'Tidak',
    'Tgl Registrasi': formatDate(m.createdAt),
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 12 }, // NIM
    { wch: 25 }, // Nama
    { wch: 20 }, // Tempat/Tgl Lahir
    { wch: 15 }, // Jenis Kelamin
    { wch: 30 }, // Alamat
    { wch: 20 }, // Prodi
    { wch: 10 }, // Angkatan
    { wch: 25 }, // Dosen Wali
    { wch: 12 }, // Status
    { wch: 12 }, // Akun Aktif
    { wch: 18 }, // Tgl Registrasi
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data Mahasiswa');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `Mahasiswa_${timestamp}`;
  
  if (filters?.prodi) filename += `_${filters.prodi}`;
  if (filters?.angkatan) filename += `_${filters.angkatan}`;
  if (filters?.status) filename += `_${filters.status}`;
  
  filename += '.xlsx';

  // Write to buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Send response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

/**
 * Export Dosen to Excel
 */
export const exportDosenToExcel = (
  dosen: any[],
  res: Response,
  filters?: {
    prodi?: string;
    status?: string;
  }
) => {
  // Prepare data
  const data = dosen.map((d, index) => ({
    'No': index + 1,
    'NIDN': d.nidn,
    'NUPTK': d.nuptk,
    'Nama Lengkap': d.namaLengkap,
    'Program Studi': d.prodi?.nama || '-',
    'Tempat Lahir': d.tempatLahir || '-',
    'Tanggal Lahir': formatDate(d.tanggalLahir),
    'Posisi': d.posisi || '-',
    'Jabatan Fungsional': d.jafung || '-',
    'Alumni': d.alumni || '-',
    'Lama Mengajar': d.lamaMengajar || '-',
    'Status': d.status,
    'Jumlah Bimbingan': d._count?.mahasiswaBimbingan || 0,
    'Jumlah Kelas': d._count?.kelasMataKuliah || 0,
    'Akun Aktif': d.user?.isActive ? 'Ya' : 'Tidak',
    'Tgl Registrasi': formatDate(d.createdAt),
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 12 }, // NIDN
    { wch: 18 }, // NUPTK
    { wch: 25 }, // Nama
    { wch: 20 }, // Prodi
    { wch: 15 }, // Tempat Lahir
    { wch: 15 }, // Tanggal Lahir
    { wch: 20 }, // Posisi
    { wch: 20 }, // Jafung
    { wch: 25 }, // Alumni
    { wch: 15 }, // Lama Mengajar
    { wch: 12 }, // Status
    { wch: 12 }, // Bimbingan
    { wch: 12 }, // Kelas
    { wch: 12 }, // Akun Aktif
    { wch: 18 }, // Tgl Registrasi
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data Dosen');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `Dosen_${timestamp}`;
  
  if (filters?.prodi) filename += `_${filters.prodi}`;
  if (filters?.status) filename += `_${filters.status}`;
  
  filename += '.xlsx';

  // Write to buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Send response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};

/**
 * Export Mata Kuliah to Excel
 */
export const exportMataKuliahToExcel = (
  mataKuliah: any[],
  res: Response,
  filters?: {
    semesterIdeal?: number;
    isActive?: boolean;
  }
) => {
  // Prepare data
  const data = mataKuliah.map((mk, index) => ({
    'No': index + 1,
    'Kode MK': mk.kodeMK,
    'Nama Mata Kuliah': mk.namaMK,
    'SKS': mk.sks,
    'Semester Ideal': mk.semesterIdeal,
    'Lintas Prodi': mk.isLintasProdi ? 'Ya' : 'Tidak',
    'Deskripsi': mk.deskripsi || '-',
    'Status': mk.isActive ? 'Aktif' : 'Nonaktif',
    'Jumlah Kelas': mk._count?.kelasMataKuliah || 0,
    'Tgl Dibuat': formatDate(mk.createdAt),
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 12 }, // Kode MK
    { wch: 35 }, // Nama MK
    { wch: 8 },  // SKS
    { wch: 12 }, // Semester Ideal
    { wch: 12 }, // Lintas Prodi
    { wch: 40 }, // Deskripsi
    { wch: 10 }, // Status
    { wch: 12 }, // Jumlah Kelas
    { wch: 18 }, // Tgl Dibuat
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data Mata Kuliah');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `MataKuliah_${timestamp}`;
  
  if (filters?.semesterIdeal) filename += `_Sem${filters.semesterIdeal}`;
  if (filters?.isActive !== undefined) filename += filters.isActive ? '_Aktif' : '_Nonaktif';
  
  filename += '.xlsx';

  // Write to buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Send response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
};