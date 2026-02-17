/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  IdCard, 
  GraduationCap, 
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';

import { mahasiswaAPI } from '@/lib/api';

// ✅ Helper functions outside component
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { className: string; label: string }> = {
    AKTIF: { className: 'bg-green-100 text-green-700 border-green-300', label: 'Aktif' },
    CUTI: { className: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Cuti' },
    LULUS: { className: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Lulus' },
    KELUAR: { className: 'bg-red-100 text-red-700 border-red-300', label: 'Keluar' },
    NON_AKTIF: { className: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Non Aktif' },
  };

  return statusMap[status] || { className: 'bg-gray-100 text-gray-700', label: status };
};

const getJenisKelamin = (jk: string | null): string => {
  if (!jk) return '-';
  return jk === 'L' ? 'Laki-laki' : 'Perempuan';
};

export default function ProfilMahasiswaPage() {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (err) {
        console.error('Gagal parse user dari localStorage');
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  const [mahasiswa, setMahasiswa] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchMahasiswa = async () => {
      if (!user?.mahasiswa?.id) {
        setError('Data mahasiswa tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await mahasiswaAPI.getById(user.mahasiswa.id);

        if (response.success && response.data) {
          setMahasiswa(response.data);
        } else {
          setError(response.message || 'Gagal memuat data mahasiswa');
        }
      } catch (err: any) {
        console.error('Fetch mahasiswa error:', err);
        setError(err.response?.data?.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.mahasiswa?.id) {
      fetchMahasiswa();
    }
  }, [user, isAuthLoading]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const statusBadge = useMemo(() => {
    if (!mahasiswa?.status) return null;
    const config = getStatusConfig(mahasiswa.status);
    return <Badge className={config.className}>{config.label}</Badge>;
  }, [mahasiswa?.status]);

  const jenisKelamin = useMemo(
    () => getJenisKelamin(mahasiswa?.jenisKelamin),
    [mahasiswa?.jenisKelamin]
  );

  const registrationDate = useMemo(
    () => formatDate(mahasiswa?.user?.createdAt),
    [mahasiswa?.user?.createdAt]
  );

  const isActive = useMemo(
    () => mahasiswa?.user?.isActive,
    [mahasiswa?.user?.isActive]
  );

  // ============================================
  // HANDLERS
  // ============================================
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isAuthLoading || isLoading) {
    return <LoadingSpinner size="lg" text="Memuat profil..." />;
  }

  if (error || !mahasiswa) {
    return (
      <ErrorState
        title="Gagal Memuat Profil"
        message={error || 'Data mahasiswa tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Mahasiswa"
        description="Informasi data pribadi dan akademik"
        breadcrumbs={[
          { label: 'Dashboard', href: '/mahasiswa/dashboard' },
          { label: 'Profil' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informasi Utama */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Utama</CardTitle>
                <CardDescription className="text-xs">Data identitas mahasiswa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">NIM</p>
              <p className="text-base font-mono font-semibold">{mahasiswa.nim}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Nama Lengkap</p>
              <p className="text-base font-semibold">{mahasiswa.namaLengkap}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Angkatan</p>
              <Badge variant="outline" className="font-mono">{mahasiswa.angkatan}</Badge>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              {statusBadge}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Akademik */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Akademik</CardTitle>
                <CardDescription className="text-xs">Program studi dan bimbingan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Program Studi</p>
              {mahasiswa.prodi ? (
                <div className="mt-1">
                  <p className="text-base font-semibold">{mahasiswa.prodi.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {mahasiswa.prodi.kode} • {mahasiswa.prodi.jenjang}
                  </p>
                </div>
              ) : (
                <p className="text-sm">-</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Dosen Wali</p>
              {mahasiswa.dosenWali ? (
                <div className="flex items-start gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{mahasiswa.dosenWali.namaLengkap}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      NIDN: {mahasiswa.dosenWali.nidn}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">-</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Pribadi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2.5">
                <IdCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
                <CardDescription className="text-xs">Data personal mahasiswa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tempat, Tanggal Lahir</p>
              <p className="text-sm">{mahasiswa.tempatTanggalLahir || '-'}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Jenis Kelamin</p>
              <p className="text-sm">{jenisKelamin}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Alamat</p>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm">{mahasiswa.alamat || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Akun */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Akun</CardTitle>
                <CardDescription className="text-xs">Status akun sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Status Akun</p>
              <div className="flex items-center gap-2 mt-1">
                {isActive ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Aktif</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Tidak Aktif</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Tanggal Terdaftar</p>
              <p className="text-sm">{registrationDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
