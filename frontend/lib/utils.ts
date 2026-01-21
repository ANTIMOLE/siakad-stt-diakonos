/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utility Functions
 * Helper functions untuk format data, classnames, dll
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// CLASSNAMES MERGER (dari shadcn/ui)
// ============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format date ke DD/MM/YYYY
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date ke DD MMM YYYY (e.g., 15 Agt 2024)
 */
export function formatDateLong(date: string | Date): string {
  if (!date) return '-';
  
  const d = new Date(date);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Format datetime ke DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  
  const d = new Date(date);
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format time ke HH:mm
 */
export function formatTime(time: string): string {
  if (!time) return '-';
  
  // If already in HH:mm format
  if (time.includes(':')) return time;
  
  // If Date object
  const d = new Date(time);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Get relative time (e.g., "2 hari yang lalu")
 */
export function getRelativeTime(date: string | Date): string {
  if (!date) return '-';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return formatDate(date);
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format currency ke format Rupiah
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number dengan thousand separator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format IPK/IPS (2 decimal places)
 */
export function formatIPK(ipk: number | string): string {
  const num = typeof ipk === 'string' ? parseFloat(ipk) : ipk;
  return num.toFixed(2);
}

// ============================================
// STRING FORMATTING
// ============================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string dengan ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Format NIM dengan separator (e.g., 220711833 → 22.07.11833)
 */
export function formatNIM(nim: string): string {
  if (!nim) return '-';
  if (nim.length !== 9) return nim;
  
  return `${nim.slice(0, 2)}.${nim.slice(2, 4)}.${nim.slice(4)}`;
}

/**
 * Format NIDN dengan separator (e.g., 0815087301 → 0815.08.7301)
 */
export function formatNIDN(nidn: string): string {
  if (!nidn) return '-';
  if (nidn.length !== 10) return nidn;
  
  return `${nidn.slice(0, 4)}.${nidn.slice(4, 6)}.${nidn.slice(6)}`;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate NIM format (9 digits)
 */
export function isValidNIM(nim: string): boolean {
  return /^\d{9}$/.test(nim);
}

/**
 * Validate NIDN format (10 digits)
 */
export function isValidNIDN(nidn: string): boolean {
  return /^\d{10}$/.test(nidn);
}

/**
 * Validate phone number (Indonesia)
 */
export function isValidPhone(phone: string): boolean {
  // Format: 08xx-xxxx-xxxx or +628xx-xxxx-xxxx
  return /^(\+62|0)8\d{8,11}$/.test(phone.replace(/[-\s]/g, ''));
}

// ============================================
// STATUS & BADGE HELPERS
// ============================================

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    // KRS
    'DRAFT': 'info',
    'SUBMITTED': 'warning',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    
    // Mahasiswa
    'AKTIF': 'success',
    'CUTI': 'warning',
    'NON_AKTIF': 'danger',
    'LULUS': 'success',
    'DO': 'danger',
    
    // General
    'active': 'success',
    'inactive': 'danger',
    'pending': 'warning',
  };
  
  return statusMap[status.toUpperCase()] || 'info';
}

/**
 * Get status label (Indonesia)
 * 
 * 
 * 
 */


export function getStatusLabel(
  status: string,
  type: 'krs' | 'mahasiswa' | 'dosen'
): string {
  const maps = {
    krs: krsLabelMap,
    mahasiswa: mahasiswaLabelMap,
    dosen: dosenLabelMap,
  };

  return maps[type][status.toUpperCase()] || status;
}

const krsLabelMap: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

const mahasiswaLabelMap: Record<string, string> = {
  AKTIF: 'Aktif',
  CUTI: 'Cuti',
  NON_AKTIF: 'Tidak Aktif',
  LULUS: 'Lulus',
  DO: 'Drop Out',
};

const dosenLabelMap: Record<string, string> = {
  AKTIF: 'Aktif',
  NON_AKTIF: 'Tidak Aktif',
};


// export function getStatusLabel(status: string): string {
//   const labelMap: Record<string, string> = {
//     // KRS
//     'DRAFT': 'Draft',
//     'SUBMITTED': 'Menunggu Persetujuan',
//     'APPROVED': 'Disetujui',
//     'REJECTED': 'Ditolak',
    
//     // Mahasiswa
//     'AKTIF': 'Aktif',
//     'CUTI': 'Cuti',
//     'NON_AKTIF': 'Tidak Aktif',
//     'LULUS': 'Lulus',
//     'DO': 'Drop Out',
    
//     // Dosen
//     'AKTIF': 'Aktif',
//     'NON_AKTIF': 'Tidak Aktif',
//   };
  
//   return labelMap[status.toUpperCase()] || status;
// }

// ============================================
// FILE HELPERS
// ============================================

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// ============================================
// ARRAY HELPERS
// ============================================

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function (delay execution)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
