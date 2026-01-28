/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';

import { mahasiswaAPI } from '@/lib/api';

export default function ProfilMahasiswaPage() {
  const router = useRouter();

  // ============================================
  // GET USER FROM LOCALSTORAGE
  // ============================================
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

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mahasiswa, setMahasiswa] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH MAHASISWA DATA
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
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.mahasiswa?.id) {
      fetchMahasiswa();
    }
  }, [user, isAuthLoading]);

  // ============================================
  // HELPERS
  // ============================================
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      AKTIF: { className: 'bg-green-100 text-green-700 border-green-300', label: 'Aktif' },
      CUTI: { className: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Cuti' },
      LULUS: { className: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Lulus' },
      KELUAR: { className: 'bg-red-100 text-red-700 border-red-300', label: 'Keluar' },
      NON_AKTIF: { className: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Non Aktif' },
    };

    const statusInfo = statusMap[status] || { className: '', label: status };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getJenisKelamin = (jk: string | null) => {
    if (!jk) return '-';
    return jk === 'L' ? 'Laki-laki' : 'Perempuan';
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isAuthLoading || isLoading) {
    return <LoadingSpinner size="lg" text="Memuat profil..." />;
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !mahasiswa) {
    return (
      <ErrorState
        title="Gagal Memuat Profil"
        message={error || 'Data mahasiswa tidak ditemukan'}
        onRetry={() => window.location.reload()}
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
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Informasi Utama</CardTitle>
                <CardDescription>Data identitas mahasiswa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NIM */}
            <div>
              <p className="text-sm text-muted-foreground">NIM</p>
              <p className="text-base font-mono font-semibold">{mahasiswa.nim}</p>
            </div>

            <Separator />

            {/* Nama Lengkap */}
            <div>
              <p className="text-sm text-muted-foreground">Nama Lengkap</p>
              <p className="text-base font-semibold">{mahasiswa.namaLengkap}</p>
            </div>

            <Separator />

            {/* Angkatan */}
            <div>
              <p className="text-sm text-muted-foreground">Angkatan</p>
              <Badge variant="outline" className="font-mono">{mahasiswa.angkatan}</Badge>
            </div>

            <Separator />

            {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(mahasiswa.status)}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Akademik */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Informasi Akademik</CardTitle>
                <CardDescription>Program studi dan bimbingan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Program Studi */}
            <div>
              <p className="text-sm text-muted-foreground">Program Studi</p>
              {mahasiswa.prodi ? (
                <div>
                  <p className="text-base font-semibold">{mahasiswa.prodi.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {mahasiswa.prodi.kode} • {mahasiswa.prodi.jenjang}
                  </p>
                </div>
              ) : (
                <p className="text-sm">Belum ditentukan</p>
              )}
            </div>

            <Separator />

            {/* Dosen Wali */}
            <div>
              <p className="text-sm text-muted-foreground">Dosen Wali</p>
              {mahasiswa.dosenWali ? (
                <div className="flex items-start gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-base font-medium">{mahasiswa.dosenWali.namaLengkap}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      NIDN: {mahasiswa.dosenWali.nidn}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">Belum ditentukan</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Pribadi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-purple-100 p-2">
                <IdCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>Data personal mahasiswa</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tempat, Tanggal Lahir */}
            <div>
              <p className="text-sm text-muted-foreground">Tempat, Tanggal Lahir</p>
              <p className="text-base">{mahasiswa.tempatTanggalLahir || '-'}</p>
            </div>

            <Separator />

            {/* Jenis Kelamin */}
            <div>
              <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
              <p className="text-base">{getJenisKelamin(mahasiswa.jenisKelamin)}</p>
            </div>

            <Separator />

            {/* Alamat */}
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-base">{mahasiswa.alamat || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Akun */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Informasi Mahasiswa</CardTitle>
                <CardDescription>Status mahasiswa dalam sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Akun */}
            <div>
              <p className="text-sm text-muted-foreground">Status Mahasiwa</p>
              <div className="flex items-center gap-2 mt-1">
                {mahasiswa.user?.isActive ? (
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

            {/* Tanggal Terdaftar */}
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Terdaftar</p>
              <p className="text-base">{formatDate(mahasiswa.user?.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}