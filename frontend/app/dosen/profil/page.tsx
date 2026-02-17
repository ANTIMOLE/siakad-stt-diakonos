/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Shield,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import { dosenAPI } from '@/lib/api';

// ✅ Helper functions outside
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusConfig = (status: string) => {
  if (status === 'AKTIF') {
    return { className: 'bg-green-100 text-green-700 border-green-300', label: 'Aktif' };
  }
  return { className: '', label: 'Tidak Aktif' };
};

export default function ProfilDosenPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Gagal parse user dari localStorage');
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

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
        setError(err.response?.data?.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.dosen?.id) {
      fetchDosen();
    }
  }, [user, isAuthLoading]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const statusBadge = useMemo(() => {
    if (!dosen?.status) return null;
    const config = getStatusConfig(dosen.status);
    return <Badge className={config.className}>{config.label}</Badge>;
  }, [dosen?.status]);

  const accountStatus = useMemo(
    () => ({
      isActive: dosen?.user?.isActive,
      createdAt: formatDate(dosen?.user?.createdAt),
    }),
    [dosen?.user]
  );

  const counts = useMemo(
    () => ({
      mahasiswaBimbingan: dosen?._count?.mahasiswaBimbingan || 0,
      kelasDiampu: dosen?._count?.kelasMataKuliah || 0,
    }),
    [dosen?._count]
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

  if (error || !dosen) {
    return (
      <ErrorState
        title="Gagal Memuat Profil"
        message={error || 'Data dosen tidak ditemukan'}
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
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Utama</CardTitle>
                <CardDescription className="text-xs">Data identitas dosen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">NIDN</p>
              <p className="text-base font-mono font-semibold">{dosen.nidn}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">NUPTK</p>
              <p className="text-base font-mono font-semibold">{dosen.nuptk}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Nama Lengkap</p>
              <p className="text-base font-semibold">{dosen.namaLengkap}</p>
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
                <CardDescription className="text-xs">Data akademik dan jabatan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Program Studi</p>
              {dosen.prodi ? (
                <div className="mt-1">
                  <p className="text-base font-semibold">{dosen.prodi.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {dosen.prodi.kode} • {dosen.prodi.jenjang}
                  </p>
                </div>
              ) : (
                <p className="text-sm">-</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Posisi</p>
              <p className="text-sm">{dosen.posisi || '-'}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Jabatan Fungsional</p>
              <p className="text-sm">{dosen.jafung || '-'}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Lama Mengajar</p>
              <p className="text-sm">{dosen.lamaMengajar || '-'}</p>
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
                <CardDescription className="text-xs">Data personal dosen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Tempat Lahir</p>
              <p className="text-sm">{dosen.tempatLahir || '-'}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
              <p className="text-sm">{formatDate(dosen.tanggalLahir)}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Riwayat Pendidikan</p>
              <p className="text-sm">{dosen.alumni || '-'}</p>
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
                {accountStatus.isActive ? (
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
              <p className="text-xs text-muted-foreground">Tanggal Bergabung</p>
              <p className="text-sm">{accountStatus.createdAt}</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Mahasiswa Bimbingan</p>
              <p className="text-sm font-semibold">{counts.mahasiswaBimbingan} mahasiswa</p>
            </div>

            <Separator />

            <div>
              <p className="text-xs text-muted-foreground">Kelas Diampu</p>
              <p className="text-sm font-semibold">{counts.kelasDiampu} kelas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
