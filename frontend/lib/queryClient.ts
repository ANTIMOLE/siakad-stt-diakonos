/* eslint-disable @typescript-eslint/no-explicit-any */
// QueryClient config untuk React Query
// Default options (staleTime, cacheTime)

/**
 * TanStack Query (React Query) Configuration
 * Setup QueryClient dengan default options
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data dianggap fresh selama 5 menit
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: Data di cache selama 10 menit
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      
      // Retry on failure (max 3x)
      retry: 3,
      
      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (untuk data real-time)
      refetchOnWindowFocus: false, // Set true jika butuh auto-refresh
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount (kalau data udah stale)
      refetchOnMount: true,
    },
    
    mutations: {
      // Retry mutations (biasanya ga perlu, karena manual action user)
      retry: false,
      
      // Mutation network mode
      networkMode: 'online',
    },
  },
});

// ============================================
// QUERY KEYS (for invalidation & caching)
// ============================================

export const QUERY_KEYS = {
  // Auth
  ME: ['auth', 'me'],
  
  // Mahasiswa
  MAHASISWA: ['mahasiswa'],
  MAHASISWA_DETAIL: (id: number) => ['mahasiswa', id],
  MAHASISWA_KRS: (id: number) => ['mahasiswa', id, 'krs'],
  MAHASISWA_KHS: (id: number) => ['mahasiswa', id, 'khs'],
  
  // Dosen
  DOSEN: ['dosen'],
  DOSEN_DETAIL: (id: number) => ['dosen', id],
  
  // Mata Kuliah
  MATA_KULIAH: ['mata-kuliah'],
  MATA_KULIAH_DETAIL: (id: number) => ['mata-kuliah', id],
  
  // Semester
  SEMESTER: ['semester'],
  SEMESTER_DETAIL: (id: number) => ['semester', id],
  
  // Kelas MK
  KELAS_MK: ['kelas-mk'],
  KELAS_MK_DETAIL: (id: number) => ['kelas-mk', id],
  
  // Paket KRS
  PAKET_KRS: ['paket-krs'],
  PAKET_KRS_DETAIL: (id: number) => ['paket-krs', id],
  
  // KRS
  KRS: ['krs'],
  KRS_DETAIL: (id: number) => ['krs', id],
  KRS_PENDING: ['krs', 'pending'],
  
  // Nilai
  NILAI_KELAS: (kelasId: number) => ['nilai', 'kelas', kelasId],
  
  // KHS
  KHS: ['khs'],
  KHS_DETAIL: (id: number) => ['khs', id],
  KHS_TRANSKRIP: (mahasiswaId: number) => ['khs', 'transkrip', mahasiswaId],
  
  // Dashboard
  DASHBOARD_ADMIN: ['dashboard', 'admin'],
  DASHBOARD_DOSEN: ['dashboard', 'dosen'],
  DASHBOARD_MAHASISWA: ['dashboard', 'mahasiswa'],
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Invalidate all queries untuk refresh data
 */
export function invalidateAll() {
  return queryClient.invalidateQueries();
}

/**
 * Invalidate specific query keys
 */
export function invalidateQueries(queryKey: any[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Clear all cache
 */
export function clearCache() {
  return queryClient.clear();
}

/**
 * Set query data manually (optimistic update)
 */
export function setQueryData<T>(queryKey: any[], data: T) {
  return queryClient.setQueryData(queryKey, data);
}

/**
 * Get query data from cache
 */
export function getQueryData<T>(queryKey: any[]): T | undefined {
  return queryClient.getQueryData(queryKey);
}

// Export queryClient as default
export default queryClient;
