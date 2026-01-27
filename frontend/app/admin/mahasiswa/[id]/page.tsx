/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Detail Mahasiswa Page
 * ✅ UPDATED: Sesuai schema baru (tempatTanggalLahir, jenisKelamin, alamat)
 * ✅ FIXED: Param KRS & KHS API call menggunakan camelCase (mahasiswaId)
 * ✅ ADDED: Handler download PDF untuk KHS di tab riwayat
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit, Trash2, User, FileText, Award, ArrowLeft, MapPin, Calendar, Download } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

import { mahasiswaAPI, krsAPI, khsAPI } from '@/lib/api';
import { Mahasiswa, KRS, KHS } from '@/types/model';

export default function DetailMahasiswaPage() {
  const router = useRouter();
  const params = useParams();
  const mahasiswaId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa | null>(null);
  const [krsHistory, setKrsHistory] = useState<KRS[]>([]);
  const [khsHistory, setKhsHistory] = useState<KHS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('biodata');
  const [isDownloadingKHS, setIsDownloadingKHS] = useState<number | null>(null);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch mahasiswa detail
        const mhsResponse = await mahasiswaAPI.getById(mahasiswaId);

        if (!mhsResponse.success) {
          setError(mhsResponse.message || 'Gagal memuat data mahasiswa');
          return;
        }

        setMahasiswa(mhsResponse.data || null);

        // Fetch KRS history - ✅ FIXED: snake_case mahasiswa_id
        try {
          const krsResponse = await krsAPI.getAll({ mahasiswa_id: mahasiswaId });
          if (krsResponse.success) {
            setKrsHistory(krsResponse.data || []);
          }
        } catch (err) {
          console.warn('Failed to fetch KRS history:', err);
        }

        // Fetch KHS history - ✅ FIXED: snake_case mahasiswa_id
        try {
          const khsResponse = await khsAPI.getAll({ mahasiswaId: mahasiswaId });
          if (khsResponse.success) {
            setKhsHistory(khsResponse.data || []);
          }
        } catch (err) {
          console.warn('Failed to fetch KHS history:', err);
        }
      } catch (err: any) {
        console.error('Fetch mahasiswa error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data mahasiswa'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (mahasiswaId) {
      fetchData();
    }
  }, [mahasiswaId]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDelete = async () => {
    if (!mahasiswa) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus mahasiswa ${mahasiswa.namaLengkap}?`)) {
      return;
    }

    try {
      const response = await mahasiswaAPI.delete(mahasiswa.id);

      if (response.success) {
        toast.success('Mahasiswa berhasil dihapus');
        router.push('/admin/mahasiswa');
      } else {
        toast.error(response.message || 'Gagal menghapus mahasiswa');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus mahasiswa'
      );
    }
  };

  // ✅ ADDED: Handler download PDF KHS per item
  const handleDownloadKHS = async (khsId: number) => {
    try {
      setIsDownloadingKHS(khsId);
      const blob = await khsAPI.downloadPDF(khsId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KHS_${mahasiswa?.nim}_Semester_${khsId}.pdf`; // Bisa improve dengan semester info
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('KHS berhasil didownload');
    } catch (err: any) {
      console.error('Download KHS error:', err);
      toast.error('Gagal mendownload KHS');
    } finally {
      setIsDownloadingKHS(null);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // CALCULATE STATS
  // ============================================
  const calculateStats = () => {
    if (!mahasiswa || khsHistory.length === 0) {
      return {
        semester: '-',
        ipk: '-',
        totalSKS: '-',
      };
    }

    // Get latest KHS for IPK and total SKS
    const latestKHS = khsHistory.reduce((latest, khs) => {
      return new Date(khs.createdAt) > new Date(latest.createdAt) ? khs : latest;
    }, khsHistory[0]);

    // Calculate current semester based on angkatan
    const currentYear = new Date().getFullYear();
    const yearsSinceEnrollment = currentYear - mahasiswa.angkatan;
    const currentSemester = Math.min(yearsSinceEnrollment * 2 + 1, 8);

    return {
      semester: currentSemester,
      ipk: Number(latestKHS.ipk).toFixed(2),
      totalSKS: latestKHS.totalSKSKumulatif,
    };
  };

  const stats = calculateStats();

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !mahasiswa) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Mahasiswa tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={mahasiswa.namaLengkap}
          description={`NIM: ${mahasiswa.nim}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Mahasiswa', href: '/admin/mahasiswa' },
            { label: mahasiswa.namaLengkap },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Link href={`/admin/mahasiswa/${mahasiswaId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.semester}</div>
            <p className="text-xs text-muted-foreground">Semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.ipk}</div>
            <p className="text-xs text-muted-foreground">IPK</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.totalSKS}</div>
            <p className="text-xs text-muted-foreground">Total SKS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <StatusBadge status={mahasiswa.status} />
            <p className="text-xs text-muted-foreground mt-2">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="biodata">
            <User className="mr-2 h-4 w-4" />
            Biodata
          </TabsTrigger>
          <TabsTrigger value="krs">
            <FileText className="mr-2 h-4 w-4" />
            Riwayat KRS ({krsHistory.length})
          </TabsTrigger>
          <TabsTrigger value="khs">
            <Award className="mr-2 h-4 w-4" />
            Riwayat KHS ({khsHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Biodata Tab */}
        <TabsContent value="biodata">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Data Pribadi */}
            <Card>
              <CardHeader>
                <CardTitle>Data Pribadi</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">NIM</dt>
                    <dd className="mt-1 text-sm font-mono">{mahasiswa.nim}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Nama Lengkap</dt>
                    <dd className="mt-1 text-sm font-semibold">{mahasiswa.namaLengkap}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tempat/Tanggal Lahir
                    </dt>
                    <dd className="mt-1 text-sm">
                      {mahasiswa.tempatTanggalLahir || '-'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Jenis Kelamin
                    </dt>
                    <dd className="mt-1">
                      {mahasiswa.jenisKelamin ? (
                        <Badge variant="outline">
                          {mahasiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Alamat
                    </dt>
                    <dd className="mt-1 text-sm">
                      {mahasiswa.alamat || '-'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Data Akademik */}
            <Card>
              <CardHeader>
                <CardTitle>Data Akademik</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Program Studi</dt>
                    <dd className="mt-1">
                      {mahasiswa.prodi ? (
                        <Badge>{mahasiswa.prodi.kode} - {mahasiswa.prodi.nama}</Badge>
                      ) : (
                        <span className="text-sm">-</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Angkatan</dt>
                    <dd className="mt-1">
                      <Badge variant="secondary">{mahasiswa.angkatan}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <StatusBadge status={mahasiswa.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Dosen Wali</dt>
                    <dd className="mt-1 text-sm">
                      {mahasiswa.dosenWali?.namaLengkap || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Terdaftar Sejak</dt>
                    <dd className="mt-1 text-sm">{formatDate(mahasiswa.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</dt>
                    <dd className="mt-1 text-sm">{formatDate(mahasiswa.updatedAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* KRS History Tab */}
        <TabsContent value="krs">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat KRS</CardTitle>
            </CardHeader>
            <CardContent>
              {krsHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada riwayat KRS
                </p>
              ) : (
                <div className="space-y-4">
                  {krsHistory
                    .sort((a, b) => b.id - a.id)
                    .map((krs) => (
                      <div
                        key={krs.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {krs.semester?.tahunAkademik || '-'} {krs.semester?.periode || '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {krs.totalSKS} SKS • {krs._count?.detail || 0} Mata Kuliah
                          </p>
                          {krs.tanggalSubmit && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Submit: {formatDate(krs.tanggalSubmit)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={krs.status} />
                          <Link href={`/admin/krs/${krs.id}`}>
                            <Button variant="ghost" size="sm">
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KHS History Tab */}
        <TabsContent value="khs">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat KHS</CardTitle>
            </CardHeader>
            <CardContent>
              {khsHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada riwayat KHS
                </p>
              ) : (
                <div className="space-y-4">
                  {khsHistory
                    .sort((a, b) => b.id - a.id)
                    .map((khs) => (
                      <div
                        key={khs.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {khs.semester?.tahunAkademik || '-'} {khs.semester?.periode || '-'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            IPS: {Number(khs.ips).toFixed(2)} • IPK: {Number(khs.ipk).toFixed(2)} • {khs.totalSKSSemester} SKS
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total SKS Kumulatif: {khs.totalSKSKumulatif}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadKHS(khs.id)}
                          disabled={isDownloadingKHS === khs.id}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {isDownloadingKHS === khs.id ? 'Downloading...' : 'Download PDF'}
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}