'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

import { paketKRSAPI } from '@/lib/api';
import { PaketKRS } from '@/types/model';
import { formatDate } from '@/lib/utils';

export default function DetailPaketKRSPage() {
  const params = useParams();
  const router = useRouter();
  const paketId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [paket, setPaket] = useState<PaketKRS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // FETCH PAKET DATA
  // ============================================
  useEffect(() => {
    const fetchPaket = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await paketKRSAPI.getById(paketId);

        if (!response.success || !response.data) {
          setError(response.message || 'Paket KRS tidak ditemukan');
          return;
        }

        setPaket(response.data);
      } catch (err: any) {
        console.error('Fetch paket error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (paketId) {
      fetchPaket();
    }
  }, [paketId]);

  // ============================================
  // DELETE HANDLER
  // ============================================
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await paketKRSAPI.delete(paketId);

      if (response.success) {
        toast.success('Paket KRS berhasil dihapus');
        router.push('/admin/paket-krs');
      } else {
        toast.error(response.message || 'Gagal menghapus paket KRS');
      }
    } catch (err: any) {
      console.error('Delete paket error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus paket KRS'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data paket KRS..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !paket) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Paket KRS tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // CALCULATE STATS
  // ============================================
  const totalMK = paket.detail?.length || 0;
  const prodiName = paket.prodi?.kode || '-';
  const semesterAkademik = paket.semester 
    ? `${paket.semester.tahunAkademik} ${paket.semester.periode}`
    : '-';

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title={paket.namaPaket}
          description={`${prodiName} • Semester ${paket.semesterPaket} • Angkatan ${paket.angkatan} • ${semesterAkademik}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Paket KRS', href: '/admin/paket-krs' },
            { label: paket.namaPaket },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Link href={`/admin/paket-krs/${paketId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalMK}</div>
            <p className="text-xs text-muted-foreground">Total Mata Kuliah</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{paket.totalSKS}</div>
            <p className="text-xs text-muted-foreground">Total SKS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant="outline" className="text-sm">{prodiName}</Badge>
            <p className="text-xs text-muted-foreground mt-2">Program Studi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{paket.semesterPaket}</div>
            <p className="text-xs text-muted-foreground">Semester Paket</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-semibold line-clamp-2">{semesterAkademik}</div>
            <p className="text-xs text-muted-foreground mt-2">Semester Akademik</p>
          </CardContent>
        </Card>
      </div>

      {/* Mata Kuliah List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Kuliah ({totalMK})</CardTitle>
        </CardHeader>
        <CardContent>
          {totalMK === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Tidak ada mata kuliah</p>
              <p className="text-sm text-muted-foreground">
                Paket KRS ini belum memiliki mata kuliah
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode MK</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paket.detail?.map((detail) => {
                    const kelasMK = detail.kelasMK;
                    if (!kelasMK) return null;

                    return (
                      <TableRow key={detail.id}>
                        <TableCell className="font-mono font-medium">
                          {kelasMK.mataKuliah?.kodeMK || '-'}
                        </TableCell>
                        <TableCell>
                          {kelasMK.mataKuliah?.namaMK || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {kelasMK.mataKuliah?.sks || 0} SKS
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {kelasMK.dosen?.namaLengkap || '-'}
                        </TableCell>
                        <TableCell>
                          {kelasMK.hari} {kelasMK.jamMulai}-{kelasMK.jamSelesai}
                        </TableCell>
                        <TableCell>
                          {kelasMK.ruangan?.nama || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Angkatan:</span>
            <span className="font-medium">{paket.angkatan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Semester Akademik:</span>
            <span className="font-medium">{semesterAkademik}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dibuat pada:</span>
            <span className="font-medium">{formatDate(paket.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terakhir diupdate:</span>
            <span className="font-medium">{formatDate(paket.updatedAt)}</span>
          </div>
          {paket.createdBy && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibuat oleh:</span>
              <span className="font-medium">Admin</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket KRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket KRS "{paket.namaPaket}"?
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data
              terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
