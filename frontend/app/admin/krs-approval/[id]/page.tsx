/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User, FileText, CheckCircle, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { krsAPI, mahasiswaAPI } from '@/lib/api';
import { KRS, KHS } from '@/types/model';

// ✅ Helper function to safely convert Decimal to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return parseFloat(String(value)) || 0;
};

export default function KRSApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const krsId = Number(params.id);

  // STATE
  const [krs, setKrs] = useState<KRS | null>(null);
  const [lastKHS, setLastKHS] = useState<KHS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [catatan, setCatatan] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch KRS detail
        const krsResponse = await krsAPI.getById(krsId);
        if (!krsResponse.success || !krsResponse.data) {
          throw new Error('KRS tidak ditemukan');
        }

        const krsData = krsResponse.data;
        setKrs(krsData);

        // Set existing catatan if any
        if (krsData.catatanAdmin) {
          setCatatan(krsData.catatanAdmin);
        }

        // 2. Fetch KHS mahasiswa (last semester)
        if (krsData.mahasiswaId) {
          try {
            const khsResponse = await mahasiswaAPI.getKHS(krsData.mahasiswaId);
            if (khsResponse.success && khsResponse.data && khsResponse.data.length > 0) {
              setLastKHS(khsResponse.data[0]);
            }
          } catch (khsError) {
            console.warn('Failed to fetch KHS:', khsError);
          }
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

    if (krsId) {
      fetchData();
    }
  }, [krsId]);

  // HANDLERS
  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const handleReject = () => {
    if (!catatan.trim()) {
      toast.error('Catatan wajib diisi untuk penolakan');
      return;
    }
    setShowRejectDialog(true);
  };

  const confirmApprove = async () => {
    try {
      setIsApproving(true);

      const response = await krsAPI.approve(krsId, catatan.trim() || undefined);

      if (response.success) {
        toast.success('KRS berhasil disetujui');
        setTimeout(() => router.push('/admin/krs-approval'), 1000);
      } else {
        toast.error(response.message || 'Gagal menyetujui KRS');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menyetujui KRS'
      );
    } finally {
      setIsApproving(false);
      setShowApproveDialog(false);
    }
  };

  const confirmReject = async () => {
    try {
      setIsRejecting(true);

      const response = await krsAPI.reject(krsId, catatan);

      if (response.success) {
        toast.success('KRS berhasil ditolak');
        setTimeout(() => router.push('/admin/krs-approval'), 1000);
      } else {
        toast.error(response.message || 'Gagal menolak KRS');
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menolak KRS'
      );
    } finally {
      setIsRejecting(false);
      setShowRejectDialog(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

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
        title="Gagal Memuat Data"
        message={error || 'KRS tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // COMPUTED VALUES
  const isSubmitted = krs.status === 'SUBMITTED';
  const isApproved = krs.status === 'APPROVED';
  const isRejected = krs.status === 'REJECTED';

  // RENDER
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Review KRS"
        description={`${krs.mahasiswa?.namaLengkap || 'Mahasiswa'} • ${krs.semester?.tahunAkademik || ''} ${krs.semester?.periode || ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Approval KRS', href: '/dosen/krs-approval' },
          { label: 'Review' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/dosen/krs-approval')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Status Alerts */}
      {isApproved && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            KRS ini sudah disetujui
            {krs.catatanAdmin && (
              <span className="block mt-1 text-sm">
                Catatan: {krs.catatanAdmin}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isRejected && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            KRS ini telah ditolak
            {krs.catatanAdmin && (
              <span className="block mt-1 text-sm">
                Catatan: {krs.catatanAdmin}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isSubmitted && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            KRS ini menunggu approval dari Anda. Review dan berikan keputusan.
          </AlertDescription>
        </Alert>
      )}

      {/* Mahasiswa Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Informasi Mahasiswa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">NIM</p>
              <p className="font-mono font-medium">
                {krs.mahasiswa?.nim || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">
                {krs.mahasiswa?.namaLengkap || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Program Studi</p>
              <p className="font-medium">
                {krs.mahasiswa?.prodi?.nama || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Angkatan</p>
              <p className="font-medium">{krs.mahasiswa?.angkatan || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KHS Semester Lalu */}
      {lastKHS && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>KHS Semester Lalu</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">IPS</p>
                <p className="text-2xl font-bold">
                  {/* ✅ FIXED: Use toNumber helper */}
                  {lastKHS.ips ? toNumber(lastKHS.ips).toFixed(2) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPK</p>
                <p className="text-2xl font-bold">
                  {/* ✅ FIXED: Use toNumber helper */}
                  {lastKHS.ipk ? toNumber(lastKHS.ipk).toFixed(2) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKS Semester</p>
                <p className="text-2xl font-bold">
                  {lastKHS.totalSKSSemester || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SKS Kumulatif</p>
                <p className="text-2xl font-bold">
                  {lastKHS.totalSKSKumulatif || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KRS Detail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Detail KRS</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <StatusBadge status={krs.status} showIcon />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total SKS</p>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {krs.totalSKS} SKS
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!krs.detail || krs.detail.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Tidak ada mata kuliah dalam KRS</p>
            </div>
          ) : (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {krs.detail.map((detail, index) => (
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
                        <div className="text-sm">
                          <p>{detail.kelasMK?.hari || '-'}</p>
                          <p className="text-muted-foreground">
                            {detail.kelasMK?.jamMulai || ''} -{' '}
                            {detail.kelasMK?.jamSelesai || ''}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paket KRS Info */}
      {krs.paketKRS && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Menggunakan Paket KRS: {krs.paketKRS.namaPaket}
                </p>
                <p className="text-xs text-blue-700">
                  Angkatan {krs.paketKRS.angkatan} • Semester{' '}
                  {krs.paketKRS.semesterPaket}
                  {krs.isModified && ' • Telah dimodifikasi'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Form - Only for SUBMITTED status */}
      {isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>Approval KRS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Catatan{' '}
                <span className="text-muted-foreground">
                  (Opsional untuk approval, wajib untuk penolakan)
                </span>
              </label>
              <Textarea
                placeholder="Tambahkan catatan untuk mahasiswa..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                disabled={isApproving || isRejecting}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={!catatan.trim() || isApproving || isRejecting}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isRejecting ? 'Menolak...' : 'Tolak KRS'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isApproving ? 'Menyetujui...' : 'Setujui KRS'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui KRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyetujui KRS mahasiswa ini? Mahasiswa akan
              dapat melanjutkan perkuliahan dengan mata kuliah yang dipilih.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Menyetujui...' : 'Ya, Setujui'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak KRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menolak KRS mahasiswa ini? Mahasiswa harus
              memperbaiki KRS sesuai catatan yang Anda berikan.
              <span className="block mt-2 font-medium">
                Catatan: {catatan}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? 'Menolak...' : 'Ya, Tolak'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}