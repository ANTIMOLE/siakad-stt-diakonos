/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

// ============================================
// HELPER FUNCTIONS
// ============================================
const calculateCurrentSemester = (angkatan: number): number => {
  const currentYear = new Date().getFullYear();
  const yearsSinceEnrollment = currentYear - angkatan;
  return Math.min(yearsSinceEnrollment * 2 + 1, 8);
};

const getLatestKHS = (khsHistory: KHS[]): KHS | null => {
  if (khsHistory.length === 0) return null;
  return khsHistory.reduce((latest, khs) => {
    return new Date(khs.createdAt) > new Date(latest.createdAt) ? khs : latest;
  }, khsHistory[0]);
};

const calculateMahasiswaStats = (mahasiswa: Mahasiswa | null, khsHistory: KHS[]) => {
  if (!mahasiswa) {
    return { semester: '-', ipk: '-', totalSKS: '-' };
  }

  const latestKHS = getLatestKHS(khsHistory);
  
  return {
    semester: calculateCurrentSemester(mahasiswa.angkatan),
    ipk: latestKHS ? Number(latestKHS.ipk).toFixed(2) : '-',
    totalSKS: latestKHS ? latestKHS.totalSKSKumulatif : '-',
  };
};

const getGenderLabel = (gender: string): string => {
  return gender === 'L' ? 'Laki-laki' : gender === 'P' ? 'Perempuan' : '-';
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================
// QUICK STAT CARD COMPONENT
// ============================================
const QuickStatCard = ({ 
  value, 
  label, 
  children 
}: { 
  value: string | number; 
  label: string;
  children?: React.ReactNode;
}) => (
  <Card>
    <CardContent className="pt-6">
      {children || <div className="text-2xl font-bold">{value}</div>}
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
    </CardContent>
  </Card>
);

// ============================================
// INFO ROW COMPONENT
// ============================================
const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon?: any;
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </dt>
    <dd className="mt-1 text-sm">{value}</dd>
  </div>
);

// ============================================
// KRS HISTORY ITEM COMPONENT
// ============================================
const KRSHistoryItem = ({ krs }: { krs: KRS }) => (
  <div className="flex items-center justify-between border-b pb-4 last:border-0">
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
);

// ============================================
// KHS HISTORY ITEM COMPONENT
// ============================================
const KHSHistoryItem = ({
  khs,
  onDownload,
  isDownloading,
}: {
  khs: KHS;
  onDownload: (id: number) => void;
  isDownloading: boolean;
}) => (
  <div className="flex items-center justify-between border-b pb-4 last:border-0">
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
      onClick={() => onDownload(khs.id)}
      disabled={isDownloading}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? 'Downloading...' : 'Download PDF'}
    </Button>
  </div>
);

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyHistoryState = ({ message }: { message: string }) => (
  <p className="text-sm text-muted-foreground text-center py-8">{message}</p>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function DetailMahasiswaPage() {
  const router = useRouter();
  const params = useParams();
  const mahasiswaId = parseInt(params.id as string);

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

        const mhsResponse = await mahasiswaAPI.getById(mahasiswaId);

        if (!mhsResponse.success) {
          setError(mhsResponse.message || 'Gagal memuat data mahasiswa');
          return;
        }

        setMahasiswa(mhsResponse.data || null);

        try {
          const krsResponse = await krsAPI.getAll({ mahasiswaId: mahasiswaId });
          if (krsResponse.success) {
            setKrsHistory(krsResponse.data || []);
          }
        } catch (err) {
          console.warn('Failed to fetch KRS history:', err);
        }

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
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (mahasiswaId) {
      fetchData();
    }
  }, [mahasiswaId]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const stats = useMemo(
    () => calculateMahasiswaStats(mahasiswa, khsHistory),
    [mahasiswa, khsHistory]
  );

  const sortedKRSHistory = useMemo(
    () => [...krsHistory].sort((a, b) => b.id - a.id),
    [krsHistory]
  );

  const sortedKHSHistory = useMemo(
    () => [...khsHistory].sort((a, b) => b.id - a.id),
    [khsHistory]
  );

  // ============================================
  // HANDLERS
  // ============================================
  const handleDelete = useCallback(async () => {
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
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    }
  }, [mahasiswa, router]);

  const handleDownloadKHS = useCallback(async (khsId: number) => {
    try {
      setIsDownloadingKHS(khsId);
      const blob = await khsAPI.downloadPDF(khsId);

      const filename = `KHS_${mahasiswa?.nim}_${khsId}.pdf`;
      downloadBlob(blob, filename);

      toast.success('KHS berhasil didownload');
    } catch (err: any) {
      console.error('Download KHS error:', err);
      toast.error('Gagal mendownload KHS');
    } finally {
      setIsDownloadingKHS(null);
    }
  }, [mahasiswa]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

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
          <Button variant="outline" onClick={handleBack}>
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
        <QuickStatCard value={stats.semester} label="Semester" />
        <QuickStatCard value={stats.ipk} label="IPK" />
        <QuickStatCard value={stats.totalSKS} label="Total SKS" />
        <QuickStatCard label="Status" value={mahasiswa.status}>
          <StatusBadge status={mahasiswa.status} />
        </QuickStatCard>
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
                  <InfoRow label="NIM" value={<span className="font-mono">{mahasiswa.nim}</span>} />
                  <InfoRow label="Nama Lengkap" value={<span className="font-semibold">{mahasiswa.namaLengkap}</span>} />
                  <InfoRow
                    icon={Calendar}
                    label="Tempat/Tanggal Lahir"
                    value={mahasiswa.tempatTanggalLahir || '-'}
                  />
                  <InfoRow
                    icon={User}
                    label="Jenis Kelamin"
                    value={
                      mahasiswa.jenisKelamin ? (
                        <Badge variant="outline">{getGenderLabel(mahasiswa.jenisKelamin)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )
                    }
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Alamat"
                    value={mahasiswa.alamat || '-'}
                  />
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
                  <InfoRow
                    label="Program Studi"
                    value={
                      mahasiswa.prodi ? (
                        <Badge>{mahasiswa.prodi.kode} - {mahasiswa.prodi.nama}</Badge>
                      ) : (
                        '-'
                      )
                    }
                  />
                  <InfoRow
                    label="Angkatan"
                    value={<Badge variant="secondary">{mahasiswa.angkatan}</Badge>}
                  />
                  <InfoRow
                    label="Status"
                    value={<StatusBadge status={mahasiswa.status} />}
                  />
                  <InfoRow
                    label="Dosen Wali"
                    value={mahasiswa.dosenWali?.namaLengkap || '-'}
                  />
                  <InfoRow
                    label="Terdaftar Sejak"
                    value={formatDate(mahasiswa.createdAt)}
                  />
                  <InfoRow
                    label="Terakhir Diupdate"
                    value={formatDate(mahasiswa.updatedAt)}
                  />
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
              {sortedKRSHistory.length === 0 ? (
                <EmptyHistoryState message="Belum ada riwayat KRS" />
              ) : (
                <div className="space-y-4">
                  {sortedKRSHistory.map((krs) => (
                    <KRSHistoryItem key={krs.id} krs={krs} />
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
              {sortedKHSHistory.length === 0 ? (
                <EmptyHistoryState message="Belum ada riwayat KHS" />
              ) : (
                <div className="space-y-4">
                  {sortedKHSHistory.map((khs) => (
                    <KHSHistoryItem
                      key={khs.id}
                      khs={khs}
                      onDownload={handleDownloadKHS}
                      isDownloading={isDownloadingKHS === khs.id}
                    />
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
