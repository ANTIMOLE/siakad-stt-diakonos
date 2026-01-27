/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, AlertCircle, Calendar, Clock, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { mahasiswaAPI, krsAPI } from '@/lib/api';
import { KRS } from '@/types/model';

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

export default function MahasiswaKRSPage() {
  // ============================================
  // AMBIL USER DARI LOCALSTORAGE
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
  // STATE MANAGEMENT KRS
  // ============================================
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [selectedKRS, setSelectedKRS] = useState<KRS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ============================================
  // FETCH ALL KRS FOR THIS MAHASISWA
  // ============================================
  useEffect(() => {
    const fetchKRS = async () => {
      if (!user?.mahasiswa?.id) {
        setError('Data mahasiswa tidak ditemukan atau Anda belum login');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await mahasiswaAPI.getKRS(user.mahasiswa.id);

        if (response.success && response.data) {
          const krsData = response.data;
          setKrsList(krsData);

          if (krsData.length > 0) {
            const activeKRS = krsData.find((k) => k.semester?.isActive);
            setSelectedKRS(activeKRS || krsData[0]);
          } else {
            setSelectedKRS(null);
          }
        } else {
          setKrsList([]);
          setSelectedKRS(null);
        }
      } catch (err: any) {
        console.error('Fetch KRS error:', err);

        if (err.response?.status === 404) {
          setKrsList([]);
          setSelectedKRS(null);
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Terjadi kesalahan saat memuat KRS'
          );
          toast.error('Gagal memuat KRS');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Hanya jalankan fetch setelah auth loading selesai
    if (!isAuthLoading) {
      fetchKRS();
    }
  }, [user, isAuthLoading]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSemesterChange = (krsId: string) => {
    const krs = krsList.find((k) => k.id.toString() === krsId);
    if (krs) {
      setSelectedKRS(krs);
    }
  };

const handleDownloadPDF = async () => {
  if (!selectedKRS) return;

  try {
    setIsDownloading(true);

    const blob = await krsAPI.downloadPDF(selectedKRS.id);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // ✅ FIX: Backend already sets proper filename in Content-Disposition header
    // Just use a safe default based on available data
    const nim = user?.mahasiswa?.nim || 'KRS';
    const tahun = selectedKRS.semester?.tahunAkademik?.replace('/', '-') || '';
    const periode = selectedKRS.semester?.periode || '';
    link.download = `KRS_${nim}_${tahun}_${periode}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('KRS berhasil didownload');
  } catch (err: any) {
    console.error('Download error:', err);
    toast.error('Gagal mendownload KRS');
  } finally {
    setIsDownloading(false);
  }
};

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const sortedDetail = selectedKRS?.detail
    ? [...selectedKRS.detail].sort((a, b) => {
        const hariA = a.kelasMK?.hari || '';
        const hariB = b.kelasMK?.hari || '';
        const hariCompare = HARI_ORDER[hariA] - HARI_ORDER[hariB];
        if (hariCompare !== 0) return hariCompare;
        return (a.kelasMK?.jamMulai || '').localeCompare(b.kelasMK?.jamMulai || '');
      })
    : [];

  // ============================================
  // LOADING AUTH / USER BELUM ADA
  // ============================================
  if (isAuthLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data autentikasi..." />
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorState
        title="Akses Ditolak"
        message="Anda belum login atau session telah berakhir. Silakan login kembali."
        onRetry={() => (window.location.href = '/login')}
      />
    );
  }

  // ============================================
  // LOADING KRS
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat KRS..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <ErrorState title="Gagal Memuat KRS" message={error} onRetry={handleRetry} />
    );
  }

  // ============================================
  // EMPTY STATE - NO KRS AT ALL
  // ============================================
  if (krsList.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kartu Rencana Studi (KRS)"
          description="Kartu Rencana Studi untuk setiap semester"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="Belum Ada KRS"
              description="Anda belum memiliki KRS untuk semester manapun. Silakan hubungi admin atau dosen wali Anda."
              className="border-0"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER WITH KRS DATA
  // ============================================
  const krs = selectedKRS!;

  // ... (sisa return JSX sama persis seperti kode asli kamu)
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kartu Rencana Studi (KRS)"
        description="Lihat dan download KRS Anda untuk setiap semester"
      />

      {/* Semester Selector + Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <label className="text-sm font-medium mb-2 block">
                Pilih Semester
              </label>
              <Select
                value={krs.id.toString()}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {krsList.map((k) => (
                    <SelectItem key={k.id} value={k.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>
                          {k.semester?.tahunAkademik} - {k.semester?.periode}
                        </span>
                        {k.semester?.isActive && (
                          <Badge variant="default" className="text-xs">
                            Aktif
                          </Badge>
                        )}
                        <StatusBadge status={k.status} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {krs.status === 'APPROVED' && (
              <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {krs.status === 'DRAFT' && (
        <Alert className="border-gray-200 bg-gray-50">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-900">
            <strong>Status: Draft</strong>
            <br />
            KRS masih dalam tahap penyusunan oleh admin. Belum disubmit untuk
            approval.
          </AlertDescription>
        </Alert>
      )}

      {krs.status === 'SUBMITTED' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Status: Menunggu Approval</strong>
            <br />
            KRS sedang ditinjau oleh dosen wali. Anda akan mendapat notifikasi
            setelah KRS disetujui atau ditolak.
          </AlertDescription>
        </Alert>
      )}

      {krs.status === 'APPROVED' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Status: Disetujui</strong>
            <br />
            KRS telah disetujui pada{' '}
            {krs.tanggalApproval &&
              format(new Date(krs.tanggalApproval), 'dd MMMM yyyy HH:mm', {
                locale: id,
              })}{' '}
            oleh {krs.approvedBy?.dosen?.namaLengkap || 'Dosen Wali'}
          </AlertDescription>
        </Alert>
      )}

      {krs.status === 'REJECTED' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Status: Ditolak</strong>
            <br />
            {krs.catatanAdmin && (
              <>
                <strong>Alasan:</strong> {krs.catatanAdmin}
                <br />
              </>
            )}
            Silakan hubungi admin untuk memperbaiki KRS sesuai catatan dosen wali.
          </AlertDescription>
        </Alert>
      )}

      {/* KRS Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informasi KRS</CardTitle>
            <StatusBadge status={krs.status} showIcon />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Semester</p>
              <Badge variant="outline" className="font-medium">
                {krs.semester?.tahunAkademik} {krs.semester?.periode}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total SKS</p>
              <p className="text-2xl font-bold text-blue-600">{krs.totalSKS}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Jumlah Mata Kuliah
              </p>
              <p className="text-2xl font-bold text-green-600">
                {krs.detail?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Submit</p>
              <p className="font-medium">
                {krs.tanggalSubmit
                  ? format(new Date(krs.tanggalSubmit), 'dd MMM yyyy', {
                      locale: id,
                    })
                  : '-'}
              </p>
            </div>
          </div>

          {/* Paket KRS Info */}
          {krs.paketKRS && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">
                Berdasarkan Paket KRS
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{krs.paketKRS.namaPaket}</Badge>
                {krs.isModified && (
                  <Badge
                    variant="outline"
                    className="text-yellow-700 border-yellow-300"
                  >
                    Dimodifikasi
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KRS Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Mata Kuliah</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedDetail.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Kode MK</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDetail.map((detail, index) => (
                    <TableRow key={detail.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono">
                        {detail.kelasMK?.mataKuliah?.kodeMK || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {detail.kelasMK?.mataKuliah?.namaMK || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {detail.kelasMK?.mataKuliah?.sks || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {detail.kelasMK?.dosen?.namaLengkap || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {detail.kelasMK?.hari || '-'},{' '}
                            {detail.kelasMK?.jamMulai || '-'} -{' '}
                            {detail.kelasMK?.jamSelesai || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{detail.kelasMK?.ruangan?.nama || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="text-right">
                      Total:
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">{krs.totalSKS}</Badge>
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="Belum Ada Mata Kuliah"
                description="Belum ada mata kuliah yang terdaftar di KRS ini"
                className="border-0"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Calendar Info */}
      {krs.semester && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Kalender Akademik Semester Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Periode Semester
                </p>
                <p className="text-sm font-medium">
                  {format(new Date(krs.semester.tanggalMulai), 'dd MMMM yyyy', {
                    locale: id,
                  })}{' '}
                  -{' '}
                  {format(new Date(krs.semester.tanggalSelesai), 'dd MMMM yyyy', {
                    locale: id,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Periode KRS</p>
                <p className="text-sm font-medium">
                  {format(
                    new Date(krs.semester.periodeKRSMulai),
                    'dd MMMM yyyy',
                    {
                      locale: id,
                    }
                  )}{' '}
                  -{' '}
                  {format(
                    new Date(krs.semester.periodeKRSSelesai),
                    'dd MMMM yyyy',
                    {
                      locale: id,
                    }
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-2">
                Informasi Penting:
              </p>
              <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
                <li>
                  KRS ini untuk semester {krs.semester?.tahunAkademik}{' '}
                  {krs.semester?.periode}
                </li>
                <li>Total SKS yang diambil: {krs.totalSKS} SKS</li>
                <li>Jumlah mata kuliah: {krs.detail?.length || 0} mata kuliah</li>
                <li>
                  Status:{' '}
                  {krs.status === 'DRAFT' && 'Masih draft, belum disubmit'}
                  {krs.status === 'SUBMITTED' &&
                    'Menunggu approval dosen wali'}
                  {krs.status === 'APPROVED' && 'Telah disetujui'}
                  {krs.status === 'REJECTED' &&
                    'Ditolak, perlu perbaikan'}
                </li>
                {krs.approvedBy && (
                  <li>
                    Disetujui oleh:{' '}
                    {krs.approvedBy.dosen?.namaLengkap || 'Dosen Wali'}
                  </li>
                )}
                {krs.status === 'APPROVED' && (
                  <li className="font-medium">
                    Anda dapat mengunduh KRS dalam format PDF menggunakan tombol
                    di atas
                  </li>
                )}
                {krs.status === 'REJECTED' && krs.catatanAdmin && (
                  <li className="font-medium text-red-700">
                    Catatan: {krs.catatanAdmin}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}