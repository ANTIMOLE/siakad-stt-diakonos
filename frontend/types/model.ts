/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data Model Types
 * TypeScript interfaces untuk data models dari backend
 * ✅ UPDATED: Sesuai dengan schema terbaru (Pembayaran + Presensi)
 */

// ============================================
// BASE TYPES
// ============================================

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODI (Program Studi)
// ============================================

export interface Prodi {
  id: number;
  kode: string;
  nama: string;
  jenjang: string;
  isActive: boolean;
}

// ============================================
// USER
// ============================================

export type UserRole = 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';

export interface User {
  id: number;
  username: string | null; // ✅ NEW
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// DOSEN
// ============================================

export type DosenStatus = 'AKTIF' | 'NON_AKTIF';

export interface Dosen extends BaseEntity {
  nidn: string;
  nuptk: string;
  namaLengkap: string;
  prodiId: number | null;
  status: DosenStatus;
  posisi: string;
  jafung: string;
  alumni: string;
  lamaMengajar: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  userId: number;
  
  // Relations
  prodi?: Prodi;
  user?: User;
  _count?: {
    mahasiswaBimbingan: number;
    kelasMataKuliah: number;
  };
}

// ============================================
// MAHASISWA
// ============================================

export type MahasiswaStatus = 'AKTIF' | 'CUTI' | 'NON_AKTIF' | 'LULUS' | 'DO';

export interface Mahasiswa extends BaseEntity {
  nim: string;
  namaLengkap: string;
  tempatTanggalLahir: string | null;  // ✅ TAMBAHKAN
  jenisKelamin: 'L' | 'P' | null;     // ✅ TAMBAHKAN
  alamat: string | null; 
  prodiId: number;
  angkatan: number;
  dosenWaliId: number | null;
  status: MahasiswaStatus;
  userId: number;
  
  // Relations
  prodi?: Prodi;
  dosenWali?: {
    id: number;
    nidn: string;
    namaLengkap: string;
  };
  user?: User;
}

// ============================================
// MATA KULIAH
// ============================================

export interface MataKuliah extends BaseEntity {
  kodeMK: string;
  namaMK: string;
  sks: number;
  semesterIdeal: number;
  isLintasProdi: boolean;
  isActive: boolean;
  deskripsi: string | null;
}

// ============================================
// SEMESTER
// ============================================

export type PeriodeSemester = 'GANJIL' | 'GENAP';

export interface Semester extends BaseEntity {
  tahunAkademik: string;
  periode: PeriodeSemester;
  isActive: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
  periodeKRSMulai: string;
  periodeKRSSelesai: string;
  periodePerbaikanKRSMulai: string;
  periodePerbaikanKRSSelesai: string;
}

// ============================================
// RUANGAN
// ============================================

export interface Ruangan extends BaseEntity {
  nama: string;
  kapasitas: number;
  isActive: boolean;
}

// ============================================
// KELAS MATA KULIAH
// ============================================

export type Hari = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface KelasMK extends BaseEntity {
  mkId: number;
  semesterId: number;
  dosenId: number;
  ruanganId: number;
  hari: Hari;
  jamMulai: string;
  jamSelesai: string;
  kuotaMax: number;
  keterangan: string | null;
  
  // Relations
  mataKuliah?: MataKuliah;
  semester?: Semester;
  dosen?: {
    id: number;
    nidn: string;
    namaLengkap: string;
  };
  ruangan?: Ruangan;
  _count?: {
    krsDetail: number;
    nilai: number;
    presensi: number; // ✅ ADDED
  };
}

// ============================================
// PAKET KRS
// ============================================

export interface PaketKRS extends BaseEntity {
  namaPaket: string;
  angkatan: number;
  prodiId: number;
  semesterPaket: number;
  semesterId: number;
  totalSKS: number;
  createdById: number;
  
  // Relations
  prodi?: Prodi;
  semester?: Semester;
  createdBy?: User;
  detail?: PaketKRSDetail[];
  _count?: {
    detail: number;
    krs?: number;
  };
}

export interface PaketKRSDetail {
  id: number;
  paketKRSId: number;
  kelasMKId: number;
  createdAt: string;
  
  // Relations
  paketKRS?: PaketKRS;
  kelasMK?: KelasMK;
}

// ============================================
// KRS
// ============================================

export type KRSStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface KRS extends BaseEntity {
  mahasiswaId: number;
  semesterId: number;
  paketKRSId: number | null;
  status: KRSStatus;
  totalSKS: number;
  isModified: boolean;
  catatanAdmin: string | null;
  tanggalSubmit: string | null;
  tanggalApproval: string | null;
  approvedById: number | null;
  
  // Relations
  mahasiswa?: Mahasiswa;
  semester?: Semester;
  paketKRS?: {
    id: number;
    namaPaket: string;
    angkatan: number;
    semesterPaket: number;
  };
  detail?: KRSDetail[];
  approvedBy?: {
    id: number;
    dosen?: {
      nidn: string;
      namaLengkap: string;
    };
  };
  _count?: {
    detail: number;
  };
}

export interface KRSDetail {
  id: number;
  krsId: number;
  kelasMKId: number;
  createdAt: string;
  
  // Relations
  kelasMK?: KelasMK;
}

// ============================================
// NILAI
// ============================================

export type NilaiHuruf = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'CD' | 'D' | 'DE' | 'E';

export interface Nilai extends BaseEntity {
  mahasiswaId: number;
  kelasMKId: number;
  semesterId: number;
  nilaiAngka: number | null;
  nilaiHuruf: NilaiHuruf | null;
  bobot: number | null;
  isFinalized: boolean;
  inputById: number;
  tanggalInput: string;
  
  // Relations
  mahasiswa?: Mahasiswa;
  kelasMK?: KelasMK;
  semester?: Semester;
  inputBy?: {
    id: number;
    role: UserRole;
  };
}

export interface NilaiMahasiswa {
  mahasiswaId: number;
  nim: string;
  namaLengkap: string;
  nilaiId: number | null;
  nilaiAngka: number | null;
  nilaiHuruf: NilaiHuruf | null;
  bobot: number | null;
  isFinalized: boolean;
}

export interface NilaiByKelasResponse {
  kelas: any;
  mahasiswa: NilaiMahasiswa[];
  totalMahasiswa: number;
  totalDinilai: number;
  isAllFinalized: boolean;
}

// ============================================
// KHS
// ============================================

export interface KHS extends BaseEntity {
  mahasiswaId: number;
  semesterId: number;
  ips: number;
  ipk: number;
  totalSKSSemester: number;
  totalSKSKumulatif: number;
  tanggalGenerate: string;
  
  // Relations
  mahasiswa?: Mahasiswa;
  semester?: Semester;
}

// ============================================
// PEMBAYARAN - ✅ UPDATED (Unified System)
// ============================================

export type PembayaranStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type JenisPembayaran = 
  | 'KRS'
  | 'TENGAH_SEMESTER'
  | 'PPL'
  | 'SKRIPSI'
  | 'WISUDA'
  | 'KOMITMEN_BULANAN';

export interface Pembayaran extends BaseEntity {
  mahasiswaId: number;
  semesterId: number | null; // ✅ Nullable for non-semester payments
  jenisPembayaran: JenisPembayaran; // ✅ Enum instead of string
  nominal: number;
  buktiUrl: string;
  status: PembayaranStatus;
  catatan: string | null;
  bulanPembayaran: string | null; // ✅ For KOMITMEN_BULANAN
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedById: number | null;
  
  // Relations
  mahasiswa?: Mahasiswa;
  semester?: Semester | null; // ✅ Nullable
  verifiedBy?: {
    id: number;
    role: UserRole;
  };
}

// Alias for backward compatibility
export type PembayaranKRS = Pembayaran;

// ============================================
// PRESENSI - ✅ NEW
// ============================================

export type StatusPresensi = 
  | 'HADIR'
  | 'TIDAK_HADIR'
  | 'IZIN'
  | 'SAKIT'
  | 'ALPHA';

export interface Presensi extends BaseEntity {
  kelasMKId: number;
  tanggal: string;
  pertemuan: number; // 1-16
  materi: string | null;
  catatan: string | null;
  
  // Relations
  kelasMK?: {
    id: number;
    hari: Hari;
    jamMulai: string;
    jamSelesai: string;
    mataKuliah?: {
      kodeMK: string;
      namaMK: string;
      sks: number;
    };
    dosen?: {
      nidn: string;
      namaLengkap: string;
    };
    ruangan?: {
      nama: string;
    };
  };
  detail?: PresensiDetail[];
  _count?: {
    detail: number;
  };
}

export interface PresensiDetail {
  id: number;
  presensiId: number;
  mahasiswaId: number;
  status: StatusPresensi;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  presensi?: Presensi;
  mahasiswa?: {
    nim: string;
    namaLengkap: string;
  };
}

// ✅ NEW: Presensi Statistics Types
export interface PresensiStatsMahasiswa {
  totalPertemuan: number;
  hadir: number;
  tidakHadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  persentaseKehadiran: number;
  detail: Array<{
    id: number;
    presensiId: number;
    mahasiswaId: number;
    status: StatusPresensi;
    keterangan: string | null;
    createdAt: string;
    updatedAt: string;
    presensi: {
      pertemuan: number;
      tanggal: string;
      materi: string | null;
    };
  }>;
}

export interface PresensiStatsKelas {
  totalPertemuan: number;
  totalMahasiswa: number;
  students: Array<{
    mahasiswaId: number;
    mahasiswa: {
      nim: string;
      namaLengkap: string;
    };
    hadir: number;
    tidakHadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    persentase: number;
  }>;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface AdminDashboardStats {
  totalMahasiswa: number;
  mahasiswaAktif: number;
  totalDosen: number;
  dosenAktif: number;
  totalMataKuliah: number;
  mataKuliahAktif: number;
  krsPending: number;
  krsApproved: number;
  krsRejected: number;
  semesterAktif?: Semester;
  recentActivities?: Activity[];
}

export interface DosenDashboardStats {
  totalMahasiswaBimbingan: number;
  mahasiswaAktif: number;
  totalKelasMengajar: number;
  krsPendingApproval: number;
  semesterAktif?: Semester;
  jadwalHariIni?: KelasMK[];
}

export interface MahasiswaDashboardStats {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: number;
  dosenWali?: string;
  ips: number | null;
  ipk: number | null;
  totalSKSLulus: number;
  krsStatus?: KRSStatus;
  jadwalHariIni?: KelasMK[];
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface DosenFormData {
  nidn: string;
  nuptk: string;
  namaLengkap: string;
  prodiId?: number;
  posisi: string;
  jafung: string;
  alumni: string;
  lamaMengajar: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  password?: string;
}

export interface MahasiswaFormData {
  nim: string;
  namaLengkap: string;
  prodiId: number;
  angkatan: number;
  tempatTanggalLahir?: string;
  jenisKelamin?: 'L' | 'P';
  alamat?: string;
  dosenWaliId?: number;
  password?: string;
}

// ✅ NEW: Pembayaran Form Data
export interface PembayaranFormData {
  mahasiswaId: number;
  semesterId?: number; // Optional for non-semester payments
  jenisPembayaran: JenisPembayaran;
  nominal: number;
  buktiFile: File;
  bulanPembayaran?: Date; // For KOMITMEN_BULANAN
}

// ✅ NEW: Presensi Form Data
export interface PresensiFormData {
  kelasMKId: number;
  pertemuan: number;
  tanggal: Date;
  materi?: string;
  catatan?: string;
}

export interface PresensiUpdateData {
  updates: Array<{
    mahasiswaId: number;
    status: StatusPresensi;
    keterangan?: string;
  }>;
  materi?: string;
  catatan?: string;
}

// ============================================
// FILTER TYPES
// ============================================

export interface DosenFilters {
  search?: string;
  prodiId?: number;
  status?: DosenStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MahasiswaFilters {
  search?: string;
  jenisKelamin?: 'L' | 'P';
  prodiId?: number;
  angkatan?: number;
  status?: MahasiswaStatus;
  dosenWaliId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface KRSFilters {
  search?: string;
  semesterId?: number;
  mahasiswaId?: number;
  status?: KRSStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ UPDATED: Pembayaran Filters
export interface PembayaranFilters {
  search?: string;
  semesterId?: number;
  mahasiswaId?: number;
  jenisPembayaran?: JenisPembayaran; // ✅ ADDED
  status?: PembayaranStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaketKRSFilters {
  angkatan?: number;
  prodiId?: number;
  semesterId?: number;
  semesterPaket?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ NEW: Presensi Filters
export interface PresensiFilters {
  kelasMKId?: number;
  semesterId?: number;
  dosenId?: number;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export enum TipeFileKelas {
  RPS = 'RPS',
  RPP = 'RPP',
  MATERI = 'MATERI',
}

export interface KelasMKFile {
  id: number;
  kelasMKId: number;
  tipeFile: TipeFileKelas;
  namaFile: string;
  fileUrl: string;
  mingguKe?: number;
  keterangan?: string;
  uploadedById: number;
  uploadedAt: string;
  updatedAt: string;
  
  // Relations (optional)
  uploadedBy?: {
    namaLengkap: string;
  };
}