/**
 * TypeScript Type Definitions
 * Common types used across the application
 */

import { Request } from 'express';

// ============================================
// REQUEST TYPES
// ============================================

/**
 * Authenticated request with user information
 * Used in routes that require authentication
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    identifier?: string;
    role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
  };
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// AUTH TYPES
// ============================================

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponse {
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
    namaLengkap?: string;
  };
  token: string;
}

/**
 * Register request body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
  namaLengkap: string;
  nim?: string; // For MAHASISWA
  nidn?: string; // For DOSEN
  prodiId?: number;
  angkatan?: number; // For MAHASISWA
}

/**
 * Change password request body
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// USER TYPES
// ============================================

/**
 * User with related data
 */
export interface UserWithProfile {
  id: number;
  email: string;
  role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
  isActive: boolean;
  mahasiswa?: {
    id: number;
    nim: string;
    namaLengkap: string;
    prodi: {
      id: number;
      nama: string;
      kode: string;
    };
  };
  dosen?: {
    id: number;
    nidn: string;
    namaLengkap: string;
    prodi?: {
      id: number;
      nama: string;
      kode: string;
    };
  };
}

// ============================================
// QUERY TYPES
// ============================================

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Search query parameters
 */
export interface SearchQuery extends PaginationQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter query parameters for mahasiswa
 */
export interface MahasiswaFilterQuery extends SearchQuery {
  prodiId?: number;
  angkatan?: number;
  status?: 'AKTIF' | 'CUTI' | 'NON_AKTIF' | 'LULUS' | 'DO';
  dosenWaliId?: number;
}

/**
 * Filter query parameters for KRS
 */
export interface KRSFilterQuery extends SearchQuery {
  semesterId?: number;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  mahasiswaId?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Omit specific fields from type
 */
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

/**
 * Pick specific fields from type
 */
export type PickFields<T, K extends keyof T> = Pick<T, K>;
