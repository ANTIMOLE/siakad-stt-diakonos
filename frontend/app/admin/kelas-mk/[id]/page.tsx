'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, Trash2, ArrowLeft, Calendar, Clock, Users, MapPin, BookOpen, GraduationCap } from 'lucide-react';
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

import { kelasMKAPI } from '@/lib/api';
import { KelasMK } from '@/types/model';
import { formatDate } from '@/lib/utils';

// Extended interface with KRS details
interface KelasMKWithDetails extends KelasMK {
  krsDetail?: Array<{
    id: number;
    krs?: {
      id: number;
      mahasiswa?: {
        nim: string;
        namaLengkap: string;
        prodi?: {
          kode: string;
        };
      };
      status: string;
    };
  }>;
}

export default function DetailKelasMKPage() {
  const params = useParams();
  const router = useRouter();
  const kelasId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [kelas, setKelas] = useState<KelasMKWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // FETCH KELAS DATA
  // ============================================
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await kelasMKAPI.getById(kelasId);

        if (!response.success || !response.data) {
          setError(response.message || 'Kelas tidak ditemukan');
          return;
        }

        setKelas(response.data);
      } catch (err: any) {
        console.error('Fetch kelas error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (kelasId) {
      fetchKelas();
    }
  }, [kelasId]);

  // ============================================
  // DELETE HANDLER
  // ============================================
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await kelasMKAPI.delete(kelasId);

      if (response.success) {
        toast.success('Kelas berhasil dihapus');
        router.push('/admin/kelas-mk');
      } else {
        toast.error(response.message || 'Gagal menghapus kelas');
      }
    } catch (err: any) {
      console.error('Delete kelas error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus kelas'
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
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !kelas) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Kelas tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // CALCULATE STATS
  // ============================================
  const totalMahasiswa = kelas.krsDetail?.length || kelas._count?.krsDetail || 0;
  const percentageFilled = kelas.kuotaMax > 0 
    ? Math.round((totalMahasiswa / kelas.kuotaMax) * 100) 
    : 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title={kelas.mataKuliah?.namaMK || 'Detail Kelas'}
          description={`${kelas.mataKuliah?.kodeMK || ''} • ${kelas.semester?.tahunAkademik} ${kelas.semester?.periode}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Kelas MK', href: '/admin/kelas-mk' },
            { label: kelas.mataKuliah?.namaMK || 'Detail' },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Link href={`/admin/kelas-mk/${kelasId}/edit`}>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{kelas.mataKuliah?.sks || 0}</div>
                <p className="text-xs text-muted-foreground">SKS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {totalMahasiswa} / {kelas.kuotaMax}
                </div>
                <p className="text-xs text-muted-foreground">Mahasiswa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{kelas.hari}</div>
                <p className="text-xs text-muted-foreground">Hari</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold line-clamp-1">
                  {kelas.ruangan?.nama || '-'}
                </div>
                <p className="text-xs text-muted-foreground">Ruangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Kelas */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Kode Mata Kuliah</p>
                  <p className="font-medium">{kelas.mataKuliah?.kodeMK || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama Mata Kuliah</p>
                  <p className="font-medium">{kelas.mataKuliah?.namaMK || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKS</p>
                  <p className="font-medium">{kelas.mataKuliah?.sks || 0} SKS</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester Ideal</p>
                  <p className="font-medium">Semester {kelas.mataKuliah?.semesterIdeal || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jadwal */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Perkuliahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hari</p>
                    <p className="font-medium">{kelas.hari}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Waktu</p>
                    <p className="font-medium">
                      {kelas.jamMulai} - {kelas.jamSelesai}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ruangan</p>
                    <p className="font-medium">{kelas.ruangan?.nama || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kapasitas Ruangan</p>
                    <p className="font-medium">{kelas.ruangan?.kapasitas || 0} orang</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daftar Mahasiswa */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Mahasiswa ({totalMahasiswa})</CardTitle>
                <Badge variant={percentageFilled >= 90 ? 'destructive' : 'default'}>
                  {percentageFilled}% Terisi
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {totalMahasiswa === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada mahasiswa yang mengambil kelas ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>NIM</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Prodi</TableHead>
                        <TableHead>Status KRS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kelas.krsDetail?.map((detail, index) => {
                        const mahasiswa = detail.krs?.mahasiswa;
                        return (
                          <TableRow key={detail.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-mono">
                              {mahasiswa?.nim || '-'}
                            </TableCell>
                            <TableCell>{mahasiswa?.namaLengkap || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {mahasiswa?.prodi?.kode || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  detail.krs?.status === 'APPROVED'
                                    ? 'default'
                                    : detail.krs?.status === 'SUBMITTED'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {detail.krs?.status || '-'}
                              </Badge>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dosen Pengampu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dosen Pengampu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{kelas.dosen?.namaLengkap || '-'}</p>
                  <p className="text-sm text-muted-foreground">
                    NIDN: {kelas.dosen?.nidn || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kuota */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kuota Kelas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Terisi</span>
                  <span className="font-medium">
                    {totalMahasiswa} / {kelas.kuotaMax}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percentageFilled >= 90
                        ? 'bg-red-500'
                        : percentageFilled >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentageFilled, 100)}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Kuota:</span>
                  <span className="font-medium">
                    {Math.max(0, kelas.kuotaMax - totalMahasiswa)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Persentase:</span>
                  <span className="font-medium">{percentageFilled}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Tambahan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informasi Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Semester:</span>
                <span className="font-medium">
                  {kelas.semester?.tahunAkademik} {kelas.semester?.periode}
                </span>
              </div>
              {kelas.keterangan && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground mb-1">Keterangan:</p>
                  <p className="font-medium">{kelas.keterangan}</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-muted-foreground mb-1">Dibuat:</p>
                <p className="font-medium">{formatDate(kelas.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Terakhir diupdate:</p>
                <p className="font-medium">{formatDate(kelas.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kelas "{kelas.mataKuliah?.namaMK}"?
              {totalMahasiswa > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Perhatian: Kelas ini memiliki {totalMahasiswa} mahasiswa!
                </span>
              )}
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
