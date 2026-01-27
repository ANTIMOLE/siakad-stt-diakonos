// API endpoints, status mappings, role constants
// Nilai huruf mapping, SKS limits, dll

/**
 * Constants & Configurations
 * Centralized constants untuk seluruh aplikasi
 */

// ============================================
// API ENDPOINTS (for reference)
// ============================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  MAHASISWA: '/mahasiswa',
  DOSEN: '/dosen',
  MATA_KULIAH: '/mata-kuliah',
  SEMESTER: '/semester',
  KELAS_MK: '/kelas-mk',
  PAKET_KRS: '/paket-krs',
  KRS: '/krs',
  NILAI: '/nilai',
  KHS: '/khs',
  DASHBOARD: '/dashboard',
};

// ============================================
// USER ROLES
// ============================================
export const ROLES = {
  ADMIN: 'ADMIN',
  DOSEN: 'DOSEN',
  MAHASISWA: 'MAHASISWA',
  KEUANGAN: 'KEUANGAN',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================
// STATUS ENUMS
// ============================================

export const STATUS_MAHASISWA = {
  AKTIF: 'AKTIF',
  CUTI: 'CUTI',
  NON_AKTIF: 'NON_AKTIF',
  LULUS: 'LULUS',
  DO: 'DO',
} as const;

export const STATUS_DOSEN = {
  AKTIF: 'AKTIF',
  NON_AKTIF: 'NON_AKTIF',
} as const;

export const STATUS_KRS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const PERIODE_SEMESTER = {
  GANJIL: 'GANJIL',
  GENAP: 'GENAP',
} as const;

// ============================================
// NILAI HURUF & BOBOT
// ============================================

export const NILAI_HURUF = {
  A: 'A',
  AB: 'AB',
  B: 'B',
  BC: 'BC',
  C: 'C',
  CD: 'CD',
  D: 'D',
  DE: 'DE',
  E: 'E',
} as const;

export type NilaiHuruf = typeof NILAI_HURUF[keyof typeof NILAI_HURUF];

// Mapping Nilai Huruf ke Bobot
export const NILAI_BOBOT: Record<NilaiHuruf, number> = {
  A: 4.0,
  AB: 3.5,
  B: 3.0,
  BC: 2.5,
  C: 2.0,
  CD: 1.5,
  D: 1.0,
  DE: 0.5,
  E: 0.0,
};

// Mapping Nilai Angka ke Nilai Huruf
// TODO: Konfirmasi range nilai dari dokumen Peraturan Akademik
export const NILAI_ANGKA_TO_HURUF: { min: number; max: number; huruf: NilaiHuruf }[] = [
  { min: 90, max: 100, huruf: 'A' },
  { min: 85, max: 89, huruf: 'AB' },
  { min: 80, max: 84, huruf: 'B' },
  { min: 75, max: 79, huruf: 'BC' },
  { min: 70, max: 74, huruf: 'C' },
  { min: 65, max: 69, huruf: 'CD' },
  { min: 60, max: 64, huruf: 'D' },
  { min: 55, max: 59, huruf: 'DE' },
  { min: 0, max: 54, huruf: 'E' },
];

/**
 * Convert nilai angka ke nilai huruf
 */
export function getNilaiHuruf(nilaiAngka: number): NilaiHuruf {
  for (const range of NILAI_ANGKA_TO_HURUF) {
    if (nilaiAngka >= range.min && nilaiAngka <= range.max) {
      return range.huruf;
    }
  }
  return 'E'; // Default
}

/**
 * Get bobot from nilai huruf
 */
export function getBobot(nilaiHuruf: NilaiHuruf): number {
  return NILAI_BOBOT[nilaiHuruf] || 0;
}

// ============================================
// SKS & AKADEMIK
// ============================================

export const SKS_CONFIG = {
  MIN_SKS_PER_SEMESTER: 0,
  MAX_SKS_PER_SEMESTER: 25,
  TOTAL_SKS_LULUS: 144, // S1 - 8 semester
  SKS_OPTIONS: [2, 3], // SKS per mata kuliah
  DURASI_PER_SKS: 50, // menit (1 SKS = 50 menit, 2 SKS = 100 menit)
} as const;

// ============================================
// HARI & WAKTU
// ============================================

export const HARI = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export type Hari = typeof HARI[number];

export const JAM_KULIAH = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
] as const;

// ============================================
// RUANGAN
// ============================================

export const RUANGAN = [
  { id: 1, nama: 'Teologi 1' },
  { id: 2, nama: 'Teologi 2' },
  { id: 3, nama: 'PAK 1' },
  { id: 4, nama: 'PAK 2' },
] as const;

// ============================================
// PROGRAM STUDI
// ============================================

export const PRODI = {
  PAK: {
    id: 1,
    kode: 'PAK',
    nama: 'Pendidikan Agama Kristen',
  },
  TEOLOGI: {
    id: 2,
    kode: 'TEOLOGI',
    nama: 'Teologi',
  },
} as const;

// ============================================
// JENIS KELAMIN
// ============================================

export const JENIS_KELAMIN = {
  L: 'Laki-laki',
  P: 'Perempuan',
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const;

// ============================================
// TABLE SORTING
// ============================================

export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// ============================================
// DATE FORMATS
// ============================================

export const DATE_FORMAT = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_LONG: 'DD MMMM YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
} as const;

// ============================================
// FILE UPLOAD
// ============================================

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  NIM_LENGTH: 9,
  NIDN_LENGTH: 10,
  PASSWORD_MIN_LENGTH: 6,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+62|0)8\d{8,11}$/,
} as const;

// ============================================
// TOAST DURATION
// ============================================

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 3000,
  WARNING: 4000,
} as const;

// ============================================
// NAVIGATION MENUS
// ============================================

export const ADMIN_MENU = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Mahasiswa', href: '/admin/mahasiswa', icon: 'Users' },
  { label: 'Dosen', href: '/admin/dosen', icon: 'GraduationCap' },
  { label: 'Mata Kuliah', href: '/admin/mata-kuliah', icon: 'BookOpen' },
  { label: 'Kelas MK', href: '/admin/kelas-mk', icon: 'School' },
  { label: 'Paket KRS', href: '/admin/paket-krs', icon: 'Package' },
  { label: 'KRS', href: '/admin/krs', icon: 'CheckSquare' },
  { label: 'KRS Approval', href: '/admin/krs-approval', icon: 'CheckSquare' },
  { label: 'Semester', href: '/admin/semester', icon: 'Calendar' },
  { label: 'Pembayaran', href: '/admin/pembayaran', icon: 'FileText' },
] as const;

export const DOSEN_MENU = [
  { label: 'Dashboard', href: '/dosen/dashboard', icon: 'LayoutDashboard' },
  { label: 'Jadwal', href: '/dosen/jadwal', icon: 'BookOpen' },
  { label: 'Mahasiswa Bimbingan', href: '/dosen/mahasiswa-bimbingan', icon: 'Users' },
  { label: 'Input Nilai', href: '/dosen/input-nilai', icon: 'FileText' },
  { label: 'KRS Approval', href: '/dosen/krs-approval', icon: 'CheckSquare' },
  { label: 'Presensi', href: '/dosen/presensi', icon: 'Calendar' },
] as const;

export const MAHASISWA_MENU = [
  { label: 'Dashboard', href: '/mahasiswa/dashboard', icon: 'LayoutDashboard' },
  { label: 'KRS', href: '/mahasiswa/krs', icon: 'FileText' },
  { label: 'Jadwal', href: '/mahasiswa/jadwal', icon: 'Calendar' },
  { label: 'KHS', href: '/mahasiswa/khs', icon: 'Award' },
  { label: 'Nilai', href: '/mahasiswa/nilai', icon: 'FileText' },
  { label: 'Pembayaran', href: '/mahasiswa/pembayaran', icon: 'DollarSign' },
] as const;

export const KEUANGAN_MENU = [
  { label: 'Dashboard', href: '/keuangan/dashboard', icon: 'LayoutDashboard' },
  { label: 'Pembayaran', href: '/keuangan/pembayaran', icon: 'FileText' },
  // Tambahkan menu lainnya sesuai kebutuhan
] as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  REQUIRED: 'Field ini wajib diisi',
  INVALID_EMAIL: 'Format email tidak valid',
  INVALID_NIM: 'NIM harus 9 digit angka',
  INVALID_NIDN: 'NIDN harus 10 digit angka',
  INVALID_PHONE: 'Format nomor HP tidak valid',
  PASSWORD_TOO_SHORT: `Password minimal ${VALIDATION.PASSWORD_MIN_LENGTH} karakter`,
  PASSWORD_NOT_MATCH: 'Password tidak cocok',
  FILE_TOO_LARGE: `File maksimal ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`,
  FILE_TYPE_NOT_ALLOWED: 'Tipe file tidak didukung',
  NETWORK_ERROR: 'Koneksi bermasalah. Coba lagi.',
  UNAUTHORIZED: 'Sesi anda telah berakhir. Silakan login kembali.',
  FORBIDDEN: 'Anda tidak memiliki akses.',
  NOT_FOUND: 'Data tidak ditemukan.',
  SERVER_ERROR: 'Terjadi kesalahan pada server.',
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Login berhasil',
  LOGOUT: 'Logout berhasil',
  CREATE: 'Data berhasil ditambahkan',
  UPDATE: 'Data berhasil diperbarui',
  DELETE: 'Data berhasil dihapus',
  SUBMIT: 'Data berhasil disubmit',
  APPROVE: 'Berhasil disetujui',
  REJECT: 'Berhasil ditolak',
  FINALIZE: 'Nilai berhasil di-finalize',
} as const;
