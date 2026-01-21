/* eslint-disable @typescript-eslint/no-explicit-any */
// Setup Axios untuk API calls
// Base URL, interceptors, error handling
// JWT token attachment otomatis
// ✅ UPDATED: Added Pembayaran & Presensi APIs

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
  KHS,
  Pembayaran, // ✅ ADDED
  JenisPembayaran, // ✅ ADDED
  Presensi, // ✅ ADDED
  //PresensiDetail, // ✅ ADDED
  PresensiStatsMahasiswa, // ✅ ADDED
  PresensiStatsKelas, // ✅ ADDED
} from '@/types/model';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 20000, // 20 detik
    headers:{
        'Content-Type': 'application/json'
    }
})

// ============================================
// REQUEST INTERCEPTOR - Attach JWT Token
// ============================================

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("token")

        if(token ){
            config.headers.Authorization = `Bearer ${token}`
        }

        return config;
    },
    (error : AxiosError) => {
        return Promise.reject(error)    
    }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================

api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error : AxiosError) =>{
        if (error.response){
            const status = error.response.status;
            
            // ✅ Jangan auto redirect 401 - biar component handle
            if (status === 401) {
                console.error('Unauthorized');
                // Cuma clear token kalau bukan di login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    localStorage.removeItem('token');
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
        
        // ✅ PENTING: Reject dengan full error object
        return Promise.reject(error);
    }
)


// ============================================
// AUTH API FUNCTIONS
// ============================================

export const authAPI = {
    login: (identifier: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => 
        api.post('/auth/login', { identifier, password }),
    
    logout: (): Promise<ApiResponse<any>> =>
        api.post('/auth/logout'),

    getCurrentUser: (): Promise<ApiResponse<any>> =>
        api.get('/auth/me'),
    
    changePassword: (oldPassword: string, newPassword: string): Promise<ApiResponse<any>> =>
        api.post('/auth/change-password', { oldPassword, newPassword }),
};

// ============================================
// MAHASISWA API FUNCTIONS
// ============================================

export const mahasiswaAPI = {
  // ✅ getAll = Paginated (list)
  getAll: (
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      prodi?: number;
      angkatan?: number;
      status?: string;
    } 
  ): Promise<PaginatedApiResponse<Mahasiswa>> => 
    api.get('/mahasiswa', { params }),

  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<Mahasiswa>> => 
    api.get(`/mahasiswa/${id}`),
  
  // ✅ create = Single item created
  create: (data: any): Promise<ApiResponse<Mahasiswa>> => 
    api.post('/mahasiswa', data),
  
  // ✅ update = Single item updated
  update: (id: number, data: any): Promise<ApiResponse<Mahasiswa>> => 
    api.put(`/mahasiswa/${id}`, data),
  
  // ✅ delete = Confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/mahasiswa/${id}`),

  // ✅ getKRS = Array (list KRS mahasiswa)
  getKRS: (id: number): Promise<ApiResponse<KRS[]>> => 
    api.get(`/mahasiswa/${id}/krs`),
  
  // ✅ getKHS = Array (list KHS mahasiswa)
  getKHS: (id: number): Promise<ApiResponse<KHS[]>> => 
    api.get(`/mahasiswa/${id}/khs`),
}

// ============================================
// DOSEN API FUNCTIONS
// ============================================

export const dosenAPI = {
  // ✅ getAll = Paginated
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

  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<Dosen>> => 
    api.get(`/dosen/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<Dosen>> => 
    api.post('/dosen', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<Dosen>> => 
    api.put(`/dosen/${id}`, data),
  
  // ✅ delete = Confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/dosen/${id}`),
}

// ============================================
// MATA KULIAH API FUNCTIONS
// ============================================

export const mataKuliahAPI = {
  // ✅ getAll = Paginated
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    prodi?: number;
    semester?: number;
  }): Promise<PaginatedApiResponse<MataKuliah>> => 
    api.get('/mata-kuliah', { params }),

  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<MataKuliah>> => 
    api.get(`/mata-kuliah/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<MataKuliah>> => 
    api.post('/mata-kuliah', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<MataKuliah>> => 
    api.put(`/mata-kuliah/${id}`, data),
  
  // ✅ delete = Confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/mata-kuliah/${id}`),
}

// ============================================
// SEMESTER API FUNCTIONS
// ============================================

export const semesterAPI = {
  // ✅ getAll = Array tanpa pagination (semester biasanya sedikit)
  getAll: (): Promise<ApiResponse<Semester[]>> => 
    api.get('/semester'),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<Semester>> => 
    api.get(`/semester/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<Semester>> => 
    api.post('/semester', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<Semester>> => 
    api.put(`/semester/${id}`, data),
  
  // ✅ activate = Single item (updated semester)
  activate: (id: number): Promise<ApiResponse<Semester>> => 
    api.post(`/semester/${id}/activate`)
};

// ============================================
// KELAS MATA KULIAH API FUNCTIONS
// ============================================

export const kelasMKAPI = {
  // ✅ getAll = Array atau Paginated (tergantung backend)
  // Biasanya array karena filter-nya spesifik
  getAll: (params?: {
    semester_id?: number;
    prodi?: number;
    dosen_id?: number;
    hari?: string;
  }): Promise<ApiResponse<KelasMK[]>> => 
    api.get('/kelas-mk', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<KelasMK>> => 
    api.get(`/kelas-mk/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<KelasMK>> => 
    api.post('/kelas-mk', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<KelasMK>> => 
    api.put(`/kelas-mk/${id}`, data),
  
  // ✅ delete = Confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/kelas-mk/${id}`),
};

// ============================================
// PAKET KRS API FUNCTIONS
// ============================================

export const paketKRSAPI = {
  // ✅ getAll = Array
  getAll: (params?: {
    angkatan?: number;
    prodi?: number;
    semester_paket?: number;
  }): Promise<ApiResponse<any[]>> => 
    api.get('/paket-krs', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<any>> => 
    api.get(`/paket-krs/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<any>> => 
    api.post('/paket-krs', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<any>> => 
    api.put(`/paket-krs/${id}`, data),
  
  // ✅ delete = Confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/paket-krs/${id}`),
  
  // ✅ addMK = Single paket updated
  addMK: (paketId: number, kelasMKId: number): Promise<ApiResponse<any>> => 
    api.post(`/paket-krs/${paketId}/add-mk`, { kelas_mk_id: kelasMKId }),
  
  // ✅ removeMK = Confirmation
  removeMK: (paketId: number, kelasMKId: number): Promise<ApiResponse<any>> => 
    api.delete(`/paket-krs/${paketId}/mk/${kelasMKId}`),
};

// ============================================
// KRS API FUNCTIONS
// ============================================

export const krsAPI = {
  // ✅ getAll = Array atau Paginated
  getAll: (params?: {
    semester_id?: number;
    status?: string;
    mahasiswa_id?: number;
  }): Promise<ApiResponse<KRS[]>> => 
    api.get('/krs', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<KRS>> => 
    api.get(`/krs/${id}`),
  
  // ✅ create = Single item
  create: (data: any): Promise<ApiResponse<KRS>> => 
    api.post('/krs', data),
  
  // ✅ update = Single item
  update: (id: number, data: any): Promise<ApiResponse<KRS>> => 
    api.put(`/krs/${id}`, data),
  
  // ✅ submit = Single item updated
  submit: (id: number): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/submit`),
  
  // ✅ approve = Single item updated
  approve: (id: number, catatan?: string): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/approve`, { catatan_admin: catatan }),
  
  // ✅ reject = Single item updated
  reject: (id: number, catatan: string): Promise<ApiResponse<KRS>> => 
    api.post(`/krs/${id}/reject`, { catatan_admin: catatan }),

  // ✅ downloadPDF = Blob (file)
  downloadPDF: (id: number): Promise<Blob> => 
    api.get(`/krs/${id}/download`, { responseType: 'blob' }),
    
  getCurrent: (): Promise<ApiResponse<KRS>> => 
    api.get('/krs/current'),

  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/krs/${id}`),
}

// ============================================
// NILAI API FUNCTIONS
// ============================================

export const nilaiAPI = {
  // ✅ getByKelas = Array nilai mahasiswa
  getByKelas: (kelasId: number): Promise<ApiResponse<Nilai[]>> => 
    api.get(`/nilai/kelas/${kelasId}`),
  
  // ✅ saveNilai = Confirmation
  saveNilai: (kelasId: number, nilai: any[]): Promise<ApiResponse<any>> => 
    api.post('/nilai', { kelas_mk_id: kelasId, nilai }),
  
  // ✅ finalize = Confirmation
  finalize: (kelasId: number): Promise<ApiResponse<any>> => 
    api.put(`/nilai/kelas/${kelasId}/finalize`),
  
  // ✅ unlock = Confirmation
  unlock: (kelasId: number): Promise<ApiResponse<any>> => 
    api.put(`/nilai/kelas/${kelasId}/unlock`),
};

// ============================================
// KHS API FUNCTIONS
// ============================================

export const khsAPI = {
  // ✅ getAll = Array
  getAll: (params?: {
    mahasiswa_id?: number;
    semester_id?: number;
  }): Promise<ApiResponse<KHS[]>> => 
    api.get('/khs', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<KHS>> => 
    api.get(`/khs/${id}`),
  
  // ✅ generate = Array KHS generated
  generate: (semesterId: number): Promise<ApiResponse<any>> => 
    api.post(`/khs/generate/${semesterId}`),
  
  // ✅ downloadPDF = Blob
  downloadPDF: (id: number): Promise<Blob> => 
    api.get(`/khs/${id}/pdf`, { responseType: 'blob' }),
  
  // ✅ getTranskrip = Single transkrip
  getTranskrip: (mahasiswaId: number): Promise<ApiResponse<any>> => 
    api.get(`/khs/transkrip/${mahasiswaId}`),
  
  // ✅ downloadTranskripPDF = Blob
  downloadTranskripPDF: (mahasiswaId: number): Promise<Blob> => 
    api.get(`/khs/transkrip/${mahasiswaId}/pdf`, { responseType: 'blob' }),
};

// ============================================
// DASHBOARD API FUNCTIONS
// ============================================

export const dashboardAPI = {
  // ✅ Single dashboard stats
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
// PEMBAYARAN API FUNCTIONS - ✅ UPDATED (Unified System)
// ============================================

export const pembayaranAPI = {
  // ✅ uploadBukti = Single upload confirmation
  uploadBukti: (formData: FormData): Promise<ApiResponse<Pembayaran>> => 
    api.post('/pembayaran/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // ✅ getAll = Array atau Paginated (with filters)
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    semesterId?: number;
    mahasiswaId?: number;
    jenisPembayaran?: JenisPembayaran; // ✅ UPDATED
    status?: string;
  }): Promise<PaginatedApiResponse<Pembayaran>> => 
    api.get('/pembayaran', { params }),
  
  // ✅ getHistory = Array pembayaran history (for logged-in mahasiswa)
  getHistory: (params?: {
    jenisPembayaran?: JenisPembayaran; // ✅ UPDATED
    tahunAkademik?: string;
  }): Promise<ApiResponse<Pembayaran[]>> => 
    api.get('/pembayaran/mahasiswa', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<Pembayaran>> => 
    api.get(`/pembayaran/${id}`),
  
  // ✅ approve = Confirmation
  approve: (id: number): Promise<ApiResponse<Pembayaran>> => 
    api.post(`/pembayaran/${id}/approve`),
  
  // ✅ reject = Confirmation
  reject: (id: number, catatan: string): Promise<ApiResponse<Pembayaran>> => 
    api.post(`/pembayaran/${id}/reject`, { catatan }),

  // ✅ NEW: Get monthly commitment history
  getMonthlyCommitment: (mahasiswaId: number, tahunAkademik?: string): Promise<ApiResponse<Pembayaran[]>> =>
    api.get(`/pembayaran/monthly-commitment/${mahasiswaId}`, { 
      params: { tahunAkademik } 
    }),

  // ✅ NEW: Check if KRS payment is approved
  checkKRSPayment: (mahasiswaId: number, semesterId: number): Promise<ApiResponse<{ approved: boolean }>> =>
    api.get(`/pembayaran/check-krs/${mahasiswaId}/${semesterId}`),

  // ✅ NEW: Get payment stats
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
// PRESENSI API FUNCTIONS - ✅ NEW
// ============================================

export const presensiAPI = {
  // ✅ getAll = Array presensi for a class
  getAll: (params: {
    kelasMKId: number;
  }): Promise<ApiResponse<Presensi[]>> => 
    api.get('/presensi', { params }),
  
  // ✅ getById = Single presensi with details
  getById: (id: number): Promise<ApiResponse<Presensi>> => 
    api.get(`/presensi/${id}`),
  
  // ✅ create = Create new presensi session
  create: (data: {
    kelasMKId: number;
    pertemuan: number;
    tanggal?: string;
    materi?: string;
    catatan?: string;
  }): Promise<ApiResponse<Presensi>> => 
    api.post('/presensi', data),
  
  // ✅ update = Update attendance for students
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
  
  // ✅ delete = Delete presensi session
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/presensi/${id}`),
  
  // ✅ getStatsMahasiswa = Get student attendance stats in a class
  getStatsMahasiswa: (mahasiswaId: number, kelasMKId: number): Promise<ApiResponse<PresensiStatsMahasiswa>> => 
    api.get(`/presensi/mahasiswa/${mahasiswaId}/kelas/${kelasMKId}`),
  
  // ✅ getStatsKelas = Get class attendance statistics
  getStatsKelas: (kelasMKId: number): Promise<ApiResponse<PresensiStatsKelas>> => 
    api.get(`/presensi/kelas/${kelasMKId}/stats`),
  
  // ✅ getDosenClasses = Get all classes taught by logged-in dosen
  getDosenClasses: (params?: {
    semesterId?: number;
  }): Promise<ApiResponse<KelasMK[]>> => 
    api.get('/presensi/dosen/my-classes', { params }),
};

// ============================================
// RUANGAN API FUNCTIONS
// ============================================

export const ruanganAPI = {
  // ✅ getAll = Paginated (sesuai controller)
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string; // 'true' or 'false'
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedApiResponse<any>> => 
    api.get('/ruangan', { params }),
  
  // ✅ getById = Single item
  getById: (id: number): Promise<ApiResponse<any>> => 
    api.get(`/ruangan/${id}`),
  
  // ✅ create = Single item
  create: (data: { nama: string; kapasitas?: number }): Promise<ApiResponse<any>> => 
    api.post('/ruangan', data),
  
  // ✅ update = Single item
  update: (id: number, data: { nama?: string; kapasitas?: number; isActive?: boolean }): Promise<ApiResponse<any>> => 
    api.put(`/ruangan/${id}`, data),
  
  // ✅ delete = Soft delete confirmation
  delete: (id: number): Promise<ApiResponse<any>> => 
    api.delete(`/ruangan/${id}`),
};

// Default export
export default api;