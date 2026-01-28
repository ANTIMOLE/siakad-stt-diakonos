/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Client
 * ✅ UPDATED: Cookie-based authentication with credentials: 'include'
 */

import axios from "axios"
import { AxiosError, InternalAxiosRequestConfig } from "axios"
import { 
  ApiResponse, 
  PaginatedApiResponse,
  AdminDashboardStats, 
  DosenDashboardStats, 
  MahasiswaDashboardStats,
  Mahasiswa,
  Dosen,
  MataKuliah,
  Semester,
  KelasMK,
  KRS,
  Nilai,
  NilaiByKelasResponse,
  KHS,
  Pembayaran,
  JenisPembayaran,
  Presensi,
  PresensiStatsMahasiswa,
  PresensiStatsKelas,
} from '@/types/model';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

// ============================================
// AXIOS INSTANCE
// ============================================
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    headers:{
        'Content-Type': 'application/json'
    },
    withCredentials: true, // ✅ CRITICAL: Send cookies with every request
})

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // ✅ NO MANUAL TOKEN - Cookie is sent automatically
        // Token is in HttpOnly cookie, browser handles it
        return config;
    },
    (error : AxiosError) => {
        return Promise.reject(error)    
    }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error : AxiosError) =>{
        if (error.response){
            const status = error.response.status;
            
            if (status === 401) {
                console.error('Unauthorized');
                // Clear local storage (only user data, not token)
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } else if (status === 403) {
                console.error('Access denied');
            } else if (status === 404) {
                console.error('Resource not found');
            } else if (status === 500) {
                console.error('Server error');
            }
        } else if (error.request){
            console.error('No response from server');
        } else{
            console.error('Error', error.message);
        }
        
        return Promise.reject(error);
    }
)

// ============================================
// AUTH API FUNCTIONS
// ============================================
export const authAPI = {
    // ✅ Login - Token set in HttpOnly cookie by server
    login: (identifier: string, password: string): Promise<ApiResponse<{ user: any }>> => 
        api.post('/auth/login', { identifier, password }),
    
    // ✅ Logout - Clear cookie on server
    logout: (): Promise<ApiResponse<any>> =>
        api.post('/auth/logout'),

    // ✅ Get current user
    getCurrentUser: (): Promise<ApiResponse<any>> =>
        api.get('/auth/me'),
    
    // ✅ Change password
    changePassword: (oldPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<any>> =>
        api.post('/auth/change-password', { oldPassword, newPassword, confirmPassword }),

    // ✅ Refresh token
    refreshToken: (): Promise<ApiResponse<any>> =>
        api.post('/auth/refresh'),
};

// ============================================
// MAHASISWA API FUNCTIONS
// ============================================
export const mahasiswaAPI = {
  getAll: (
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      prodi?: number;
      angkatan?: number;
      status?: string;
      dosenWaliId?: number;
    } 
  ): Promise<PaginatedApiResponse<Mahasiswa>> => 
    api.get('/mahasiswa', { params }),

  getById: (id: number): Promise<ApiResponse<Mahasiswa>> => 
    api.get(`/mahasiswa/${id}`),
  
  create: (data: any): Promise<ApiResponse<Mahasiswa>> => 
    api.post('/mahasiswa', data),
  
  update: (id: number, data: any): Promise<ApiResponse<Mahasiswa>> => 
    api.put(`/mahasiswa/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/mahasiswa/${id}`),

  getKRS: (id: number): Promise<ApiResponse<KRS[]>> => 
    api.get(`/mahasiswa/${id}/krs`),
  
  getKHS: (id: number): Promise<ApiResponse<KHS[]>> => 
    api.get(`/mahasiswa/${id}/khs`),
}

// ============================================
// DOSEN API FUNCTIONS
// ============================================
export const dosenAPI = {
  getAll: (
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      prodiId?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } 
  ): Promise<PaginatedApiResponse<Dosen>> => 
    api.get('/dosen', { params }), 

  getById: (id: number): Promise<ApiResponse<Dosen>> => 
    api.get(`/dosen/${id}`),
  
  create: (data: any): Promise<ApiResponse<Dosen>> => 
    api.post('/dosen', data),
  
  update: (id: number, data: any): Promise<ApiResponse<Dosen>> => 
    api.put(`/dosen/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/dosen/${id}`),
}

// ============================================
// MATA KULIAH API FUNCTIONS
// ============================================
export const mataKuliahAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    prodi?: number;
    semester?: number;
  }): Promise<PaginatedApiResponse<MataKuliah>> => 
    api.get('/mata-kuliah', { params }),

  getById: (id: number): Promise<ApiResponse<MataKuliah>> => 
    api.get(`/mata-kuliah/${id}`),
  
  create: (data: any): Promise<ApiResponse<MataKuliah>> => 
    api.post('/mata-kuliah', data),
  
  update: (id: number, data: any): Promise<ApiResponse<MataKuliah>> => 
    api.put(`/mata-kuliah/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/mata-kuliah/${id}`),
}

// ============================================
// SEMESTER API FUNCTIONS
// ============================================
export const semesterAPI = {
  getAll: (): Promise<ApiResponse<Semester[]>> => 
    api.get('/semester'),
  
  getById: (id: number): Promise<ApiResponse<Semester>> => 
    api.get(`/semester/${id}`),
  
  create: (data: any): Promise<ApiResponse<Semester>> => 
    api.post('/semester', data),
  
  update: (id: number, data: any): Promise<ApiResponse<Semester>> => 
    api.put(`/semester/${id}`, data),
  
  // ✅ ADD THIS - Delete semester
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/semester/${id}`),
  
  activate: (id: number): Promise<ApiResponse<Semester>> => 
    api.post(`/semester/${id}/activate`)
};

// ============================================
// KELAS MATA KULIAH API FUNCTIONS
// ============================================
export const kelasMKAPI = {
  getAll: (params?: {
    semester_id?: number;  // Keep this
    prodi?: number;
    dosenId?: number;
    hari?: string;
    limit?: number;
  }): Promise<ApiResponse<KelasMK[]>> => {
    // ✅ Don't use pagination for dropdown loads
    const finalParams = { ...params };
    if (params?.limit === undefined && !params?.semester_id) {
      // If loading all for dropdowns, don't paginate
      return api.get('/kelas-mk', { params: { ...finalParams, limit: 1000 } });
    }
    return api.get('/kelas-mk', { params: finalParams });
  },
  
  getById: (id: number): Promise<ApiResponse<KelasMK>> => 
    api.get(`/kelas-mk/${id}`),
  
  create: (data: any): Promise<ApiResponse<KelasMK>> => 
    api.post('/kelas-mk', data),
  
  update: (id: number, data: any): Promise<ApiResponse<KelasMK>> => 
    api.put(`/kelas-mk/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/kelas-mk/${id}`),
};

// ============================================
// PAKET KRS API FUNCTIONS
// ============================================
export const paketKRSAPI = {
  getAll: (params?: {
    angkatan?: number;
    prodi?: number;
    semester_paket?: number;
  }): Promise<ApiResponse<any[]>> => 
    api.get('/paket-krs', { params }),
  
  getById: (id: number): Promise<ApiResponse<any>> => 
    api.get(`/paket-krs/${id}`),
  
  create: (data: any): Promise<ApiResponse<any>> => 
    api.post('/paket-krs', data),
  
  update: (id: number, data: any): Promise<ApiResponse<any>> => 
    api.put(`/paket-krs/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/paket-krs/${id}`),
  
  addMK: (paketId: number, kelasMKId: number): Promise<ApiResponse<any>> => 
    api.post(`/paket-krs/${paketId}/add-mk`, { kelas_mk_id: kelasMKId }),
  
  removeMK: (paketId: number, kelasMKId: number): Promise<ApiResponse<any>> => 
    api.delete(`/paket-krs/${paketId}/mk/${kelasMKId}`),
};

// ============================================
// KRS API FUNCTIONS
// ============================================
export const krsAPI = {
  getAll: (params?: {
    semesterId?: number;        // ✅ Matches backend req.query.semesterId
    status?: string;
    mahasiswaId?: number;        // ✅ Matches backend req.query.mahasiswaId
  }): Promise<ApiResponse<KRS[]>> => 
    api.get('/krs', { params }),
  
  getById: (id: number): Promise<ApiResponse<KRS>> => 
    api.get(`/krs/${id}`),
  
  create: (data: any): Promise<ApiResponse<KRS>> => 
    api.post('/krs', data),
  
  update: (id: number, data: any): Promise<ApiResponse<KRS>> => 
    api.put(`/krs/${id}`, data),
  
  submit: (id: number): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/submit`),
  
  approve: (id: number, catatan?: string): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/approve`, { catatan_admin: catatan }),
  
  reject: (id: number, catatan: string): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/reject`, { catatan_admin: catatan }),

  downloadPDF: (id: number): Promise<Blob> => 
    api.get(`/krs/${id}/pdf`, { responseType: 'blob' }),
    
  getCurrent: (): Promise<ApiResponse<KRS>> => 
    api.get('/krs/current'),

  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/krs/${id}`),
}

// ============================================
// NILAI API FUNCTIONS
// ============================================
export const nilaiAPI = {
  getByKelas: (kelasId: number): Promise<ApiResponse<NilaiByKelasResponse>> => 
    api.get(`/nilai/kelas/${kelasId}`),
  
  saveNilai: (kelasId: number, nilai: any[]): Promise<ApiResponse<any>> => 
    api.post(`/nilai/kelas/${kelasId}`, { nilai }),
  
  finalize: (kelasId: number): Promise<ApiResponse<any>> => 
    api.post(`/nilai/kelas/${kelasId}/finalize`),
  
  unlock: (kelasId: number): Promise<ApiResponse<any>> => 
    api.post(`/nilai/kelas/${kelasId}/unlock`),
};

// ============================================
// KHS API FUNCTIONS
// ============================================
export const khsAPI = {
  getAll: (params?: {
    mahasiswaId?: number;        // ✅ Matches backend req.query.mahasiswaId
    semesterId?: number;         // ✅ FIXED: Was semester_id
  }): Promise<ApiResponse<KHS[]>> => 
    api.get('/khs', { params }),
  
  getById: (id: number): Promise<ApiResponse<KHS>> => 
    api.get(`/khs/${id}`),
  
  generate: (semesterId: number): Promise<ApiResponse<any>> => 
    api.post(`/khs/generate/${semesterId}`),
  
  downloadPDF: (id: number): Promise<Blob> => 
    api.get(`/khs/${id}/pdf`, { responseType: 'blob' }),
  
  getTranskrip: (mahasiswaId: number): Promise<ApiResponse<any>> => 
    api.get(`/khs/transkrip/${mahasiswaId}`),
  
  downloadTranskripPDF: (mahasiswaId: number): Promise<Blob> => 
    api.get(`/khs/transkrip/${mahasiswaId}/pdf`, { responseType: 'blob' }),
};

// ============================================
// DASHBOARD API FUNCTIONS
// ============================================
export const dashboardAPI = {
  getAdminStats: (): Promise<ApiResponse<AdminDashboardStats>> => 
    api.get('/dashboard/admin'),
  
  getDosenStats: (): Promise<ApiResponse<DosenDashboardStats>> => 
    api.get('/dashboard/dosen'),
  
  getMahasiswaStats: (): Promise<ApiResponse<MahasiswaDashboardStats>> => 
    api.get('/dashboard/mahasiswa'),

  getKeuanganStats: (): Promise<ApiResponse<any>> => 
    api.get('/dashboard/keuangan'),
};

// ============================================
// PEMBAYARAN API FUNCTIONS
// ============================================
export const pembayaranAPI = {
  uploadBukti: (formData: FormData): Promise<ApiResponse<Pembayaran>> => 
    api.post('/pembayaran/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

    getBuktiUrl: (id: number): string => 
    `${BASE_URL}/pembayaran/bukti/${id}`,
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    semesterId?: number;
    mahasiswaId?: number;
    jenisPembayaran?: JenisPembayaran;
    status?: string;
  }): Promise<PaginatedApiResponse<Pembayaran>> => 
    api.get('/pembayaran', { params }),
  
  getHistory: (params?: {
    jenisPembayaran?: JenisPembayaran;
    tahunAkademik?: string;
  }): Promise<ApiResponse<Pembayaran[]>> => 
    api.get('/pembayaran/mahasiswa', { params }),
  
  getById: (id: number): Promise<ApiResponse<Pembayaran>> => 
    api.get(`/pembayaran/${id}`),
  
  approve: (id: number): Promise<ApiResponse<Pembayaran>> => 
    api.post(`/pembayaran/${id}/approve`),
  
  reject: (id: number, catatan: string): Promise<ApiResponse<Pembayaran>> => 
    api.post(`/pembayaran/${id}/reject`, { catatan }),

  getMonthlyCommitment: (mahasiswaId: number, tahunAkademik?: string): Promise<ApiResponse<Pembayaran[]>> =>
    api.get(`/pembayaran/monthly-commitment/${mahasiswaId}`, { 
      params: { tahunAkademik } 
    }),

  checkKRSPayment: (mahasiswaId: number, semesterId: number): Promise<ApiResponse<{ approved: boolean }>> =>
    api.get(`/pembayaran/check-krs/${mahasiswaId}/${semesterId}`),

  getStats: (params?: {
    semesterId?: number;
    jenisPembayaran?: JenisPembayaran;
  }): Promise<ApiResponse<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalNominal: number;
  }>> =>
    api.get('/pembayaran/stats', { params }),
};

// ============================================
// PRESENSI API FUNCTIONS
// ============================================
export const presensiAPI = {
  getAll: (params: {
    kelasMKId: number;
    semesterId?: number; // ✅ Added
  }): Promise<ApiResponse<Presensi[]>> => 
    api.get('/presensi', { params }),
  
  getById: (id: number): Promise<ApiResponse<Presensi>> => 
    api.get(`/presensi/${id}`),
  
  create: (data: {
    kelasMKId: number;
    pertemuan: number;
    tanggal?: string;
    materi?: string;
    catatan?: string;
  }): Promise<ApiResponse<Presensi>> => 
    api.post('/presensi', data),
  
  update: (id: number, data: {
    updates: Array<{
      mahasiswaId: number;
      status: 'HADIR' | 'TIDAK_HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA';
      keterangan?: string;
    }>;
    materi?: string;
    catatan?: string;
  }): Promise<ApiResponse<Presensi>> => 
    api.put(`/presensi/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/presensi/${id}`),
  
  getStatsMahasiswa: (mahasiswaId: number, kelasMKId: number): Promise<ApiResponse<PresensiStatsMahasiswa>> => 
    api.get(`/presensi/mahasiswa/${mahasiswaId}/kelas/${kelasMKId}`),
  
  getStatsKelas: (kelasMKId: number): Promise<ApiResponse<PresensiStatsKelas>> => 
    api.get(`/presensi/kelas/${kelasMKId}/stats`),
  
  // ✅ UPDATED: Added semesterId parameter
  getDosenClasses: (params?: {
    semesterId?: number;
  }): Promise<ApiResponse<KelasMK[]>> => 
    api.get('/presensi/dosen/my-classes', { params }),
};

// ============================================
// RUANGAN API FUNCTIONS
// ============================================
export const ruanganAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedApiResponse<any>> => 
    api.get('/ruangan', { params }),
  
  getById: (id: number): Promise<ApiResponse<any>> => 
    api.get(`/ruangan/${id}`),
  
  create: (data: { nama: string; kapasitas?: number }): Promise<ApiResponse<any>> => 
    api.post('/ruangan', data),
  
  update: (id: number, data: { nama?: string; kapasitas?: number; isActive?: boolean }): Promise<ApiResponse<any>> => 
    api.put(`/ruangan/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/ruangan/${id}`),
};

export default api;