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
  Building2, 
  Calendar,
  Shield,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import { dosenAPI } from '@/lib/api';

export default function ProfilDosenPage() {
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
  const [dosen, setDosen] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DOSEN DATA
  // ============================================
  useEffect(() => {
    const fetchDosen = async () => {
      if (!user?.dosen?.id) {
        setError('Data dosen tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await dosenAPI.getById(user.dosen.id);

        if (response.success && response.data) {
          setDosen(response.data);
        } else {
          setError(response.message || 'Gagal memuat data dosen');
        }
      } catch (err: any) {
        console.error('Fetch dosen error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.dosen?.id) {
      fetchDosen();
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
    if (status === 'AKTIF') {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Aktif</Badge>;
    }
    return <Badge variant="outline">Tidak Aktif</Badge>;
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
  if (error || !dosen) {
    return (
      <ErrorState
        title="Gagal Memuat Profil"
        message={error || 'Data dosen tidak ditemukan'}
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
        title="Profil Dosen"
        description="Informasi data pribadi dan akademik"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
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
                <CardDescription>Data identitas dosen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NIDN */}
            <div>
              <p className="text-sm text-muted-foreground">NIDN</p>
              <p className="text-base font-mono font-semibold">{dosen.nidn}</p>
            </div>

            <Separator />

            {/* NUPTK */}
            <div>
              <p className="text-sm text-muted-foreground">NUPTK</p>
              <p className="text-base font-mono font-semibold">{dosen.nuptk}</p>
            </div>

            <Separator />

            {/* Nama Lengkap */}
            <div>
              <p className="text-sm text-muted-foreground">Nama Lengkap</p>
              <p className="text-base font-semibold">{dosen.namaLengkap}</p>
            </div>

            <Separator />

            {/* Status */}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(dosen.status)}
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
                <CardDescription>Data akademik dan jabatan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Program Studi */}
            <div>
              <p className="text-sm text-muted-foreground">Program Studi</p>
              {dosen.prodi ? (
                <div>
                  <p className="text-base font-semibold">{dosen.prodi.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {dosen.prodi.kode} • {dosen.prodi.jenjang}
                  </p>
                </div>
              ) : (
                <p className="text-sm">Belum ditentukan</p>
              )}
            </div>

            <Separator />

            {/* Posisi */}
            <div>
              <p className="text-sm text-muted-foreground">Posisi</p>
              <p className="text-base">{dosen.posisi || '-'}</p>
            </div>

            <Separator />

            {/* Jabatan Fungsional */}
            <div>
              <p className="text-sm text-muted-foreground">Jabatan Fungsional</p>
              <p className="text-base">{dosen.jafung || '-'}</p>
            </div>

            <Separator />

            {/* Lama Mengajar */}
            <div>
              <p className="text-sm text-muted-foreground">Lama Mengajar</p>
              <p className="text-base">{dosen.lamaMengajar || '-'}</p>
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
                <CardDescription>Data personal dosen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tempat Lahir */}
            <div>
              <p className="text-sm text-muted-foreground">Tempat Lahir</p>
              <p className="text-base">{dosen.tempatLahir || '-'}</p>
            </div>

            <Separator />

            {/* Tanggal Lahir */}
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
              <p className="text-base">{formatDate(dosen.tanggalLahir)}</p>
            </div>

            <Separator />

            {/* Alumni */}
            <div>
              <p className="text-sm text-muted-foreground">Riwayat Pendidikan</p>
              <p className="text-base">{dosen.alumni || '-'}</p>
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
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>Status akun sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Akun */}
            <div>
              <p className="text-sm text-muted-foreground">Status Akun</p>
              <div className="flex items-center gap-2 mt-1">
                {dosen.user?.isActive ? (
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

            {/* Tanggal Bergabung */}
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Bergabung</p>
              <p className="text-base">{formatDate(dosen.user?.createdAt)}</p>
            </div>

            <Separator />

            {/* Jumlah Mahasiswa Bimbingan */}
            <div>
              <p className="text-sm text-muted-foreground">Mahasiswa Bimbingan</p>
              <p className="text-base font-semibold">{dosen._count?.mahasiswaBimbingan || 0} mahasiswa</p>
            </div>

            <Separator />

            {/* Jumlah Kelas Diampu */}
            <div>
              <p className="text-sm text-muted-foreground">Kelas Diampu</p>
              <p className="text-base font-semibold">{dosen._count?.kelasMataKuliah || 0} kelas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}