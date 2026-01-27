/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, Edit, AlertCircle, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { krsAPI } from '@/lib/api';
import { KRS } from '@/types/model';

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

export default function AdminKRSDetailPage() {
  const router = useRouter();
  const params = useParams();
  const krsId = params?.id ? parseInt(params.id as string) : null;

  const [krs, setKrs] = useState<KRS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // FETCH KRS DETAIL
  useEffect(() => {
    if (!krsId) {
      setError('ID KRS tidak valid');
      setIsLoading(false);
      return;
    }

    const fetchKRS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await krsAPI.getById(krsId);

        if (response.success && response.data) {
          setKrs(response.data);
        } else {
          setError(response.message || 'Gagal memuat detail KRS');
        }
      } catch (err: any) {
        console.error('Fetch KRS error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data KRS'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchKRS();
  }, [krsId]);

  // HANDLERS
  const handleBack = () => {
    router.push('/admin/krs');
  };

  const handleEdit = () => {
    if (krs) {
      router.push(`/admin/krs/${krs.id}/edit`);
    }
  };

  const handleDownloadPDF = async () => {
    if (!krs) return;

    try {
      setIsDownloading(true);

      const blob = await krsAPI.downloadPDF(krs.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const nim = krs.mahasiswa?.nim || 'KRS';
      const tahun = krs.semester?.tahunAkademik?.replace('/', '-') || '';
      const periode = krs.semester?.periode || '';
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

  // COMPUTED
  const sortedDetail = krs?.detail
    ? [...krs.detail].sort((a, b) => {
        const hariA = a.kelasMK?.hari || '';
        const hariB = b.kelasMK?.hari || '';
        const hariCompare = HARI_ORDER[hariA] - HARI_ORDER[hariB];
        if (hariCompare !== 0) return hariCompare;
        return (a.kelasMK?.jamMulai || '').localeCompare(b.kelasMK?.jamMulai || '');
      })
    : [];

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat detail KRS..." />
      </div>
    );
  }

  // ERROR STATE
  if (error || !krs) {
    return (
      <ErrorState
        title="Gagal Memuat Detail KRS"
        message={error || 'KRS tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Detail KRS"
        description={`KRS ${krs.mahasiswa?.namaLengkap} - ${krs.semester?.tahunAkademik} ${krs.semester?.periode}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'KRS', href: '/admin/krs' },
          { label: 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            {(krs.status === 'DRAFT' || krs.status === 'REJECTED') && (
              <Button onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit KRS
              </Button>
            )}
            {krs.status === 'APPROVED' && (
              <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            )}
          </div>
        }
      />

      {/* Status Alerts */}
      {krs.status === 'DRAFT' && (
        <Alert className="border-gray-200 bg-gray-50">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-900">
            <strong>Status: Draft</strong> - KRS belum disubmit untuk approval. 
            Anda dapat mengedit atau menghapus KRS ini.
          </AlertDescription>
        </Alert>
      )}

      {krs.status === 'SUBMITTED' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Status: Menunggu Approval</strong> - KRS sedang menunggu persetujuan dosen wali.
          </AlertDescription>
        </Alert>
      )}

      {krs.status === 'APPROVED' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Status: Disetujui</strong> - KRS telah disetujui pada{' '}
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
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Status: Ditolak</strong>
            {krs.catatanAdmin && (
              <>
                <br />
                <strong>Alasan:</strong> {krs.catatanAdmin}
              </>
            )}
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mahasiswa</p>
              <p className="font-medium">
                {krs.mahasiswa?.namaLengkap || '-'}
              </p>
              <p className="text-sm text-muted-foreground">
                NIM: {krs.mahasiswa?.nim || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Program Studi</p>
              <p className="font-medium">
                {krs.mahasiswa?.prodi?.nama || '-'}
              </p>
              <p className="text-sm text-muted-foreground">
                Angkatan {krs.mahasiswa?.angkatan || '-'}
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground mb-1">Jumlah Mata Kuliah</p>
              <p className="text-2xl font-bold text-green-600">
                {krs.detail?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Dibuat</p>
              <p className="font-medium">
                {format(new Date(krs.createdAt), 'dd MMMM yyyy HH:mm', {
                  locale: id,
                })}
              </p>
            </div>
          </div>

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
                    Dimodifikasi dari paket
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
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-gray-200 p-2">
                <AlertCircle className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">KRS Dibuat</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(krs.createdAt), 'dd MMMM yyyy HH:mm', {
                    locale: id,
                  })}
                </p>
              </div>
            </div>

            {krs.tanggalSubmit && (
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-yellow-200 p-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">KRS Disubmit</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(krs.tanggalSubmit), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            )}

            {krs.tanggalApproval && krs.status === 'APPROVED' && (
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-green-200 p-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">KRS Disetujui</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(krs.tanggalApproval), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    oleh {krs.approvedBy?.dosen?.namaLengkap || 'Dosen Wali'}
                  </p>
                </div>
              </div>
            )}

            {krs.tanggalApproval && krs.status === 'REJECTED' && (
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-red-200 p-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">KRS Ditolak</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(krs.tanggalApproval), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    oleh {krs.approvedBy?.dosen?.namaLengkap || 'Dosen Wali'}
                  </p>
                  {krs.catatanAdmin && (
                    <p className="text-sm text-red-600 mt-1">
                      Catatan: {krs.catatanAdmin}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}