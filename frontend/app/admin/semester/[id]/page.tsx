'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, ArrowLeft, Calendar, Clock, BookOpen, Users, GraduationCap, Power, PowerOff } from 'lucide-react';
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

import { semesterAPI } from '@/lib/api';
import { Semester } from '@/types/model';
import { formatDate } from '@/lib/utils';

// Extended interface with relations
interface SemesterWithDetails extends Semester {
  kelasMataKuliah?: Array<{
    id: number;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    kuotaMax: number;
    mataKuliah?: {
      kodeMK: string;
      namaMK: string;
      sks: number;
    };
    dosen?: {
      namaLengkap: string;
      nidn: string;
    };
    ruangan?: {
      nama: string;
    };
    _count?: {
      krsDetail: number;
    };
  }>;
  krs?: Array<{
    id: number;
    mahasiswa?: {
      nim: string;
      namaLengkap: string;
    };
    status: string;
  }>;
  _count?: {
    kelasMataKuliah: number;
    krs: number;
  };
}

export default function DetailSemesterPage() {
  const params = useParams();
  const router = useRouter();
  const semesterId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [semester, setSemester] = useState<SemesterWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // ============================================
  // FETCH SEMESTER DATA
  // ============================================
  useEffect(() => {
    const fetchSemester = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await semesterAPI.getById(semesterId);

        if (!response.success || !response.data) {
          setError(response.message || 'Semester tidak ditemukan');
          return;
        }

        setSemester(response.data);
      } catch (err: any) {
        console.error('Fetch semester error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (semesterId) {
      fetchSemester();
    }
  }, [semesterId]);

  // ============================================
  // ACTIVATE HANDLER
  // ============================================
  const handleActivate = async () => {
    try {
      setIsActivating(true);

      const response = await semesterAPI.activate(semesterId);

      if (response.success) {
        toast.success('Semester berhasil diaktifkan');
        // Refresh data
        window.location.reload();
      } else {
        toast.error(response.message || 'Gagal mengaktifkan semester');
      }
    } catch (err: any) {
      console.error('Activate semester error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat mengaktifkan semester'
      );
    } finally {
      setIsActivating(false);
      setShowActivateDialog(false);
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
        <LoadingSpinner size="lg" text="Memuat data semester..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !semester) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Semester tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // CALCULATE STATS
  // ============================================
  const totalKelas = semester.kelasMataKuliah?.length || semester._count?.kelasMataKuliah || 0;
  const totalKRS = semester.krs?.length || semester._count?.krs || 0;
  
  // Total mahasiswa unik dari KRS
  const uniqueMahasiswa = new Set(
    semester.krs?.map((krs) => krs.mahasiswa?.nim).filter(Boolean)
  ).size;

  // Total dosen unik dari kelas
  const uniqueDosen = new Set(
    semester.kelasMataKuliah?.map((kelas) => kelas.dosen?.nidn).filter(Boolean)
  ).size;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          title={`${semester.tahunAkademik} ${semester.periode}`}
          description={semester.isActive ? 'Semester Aktif' : 'Semester Tidak Aktif'}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Semester', href: '/admin/semester' },
            { label: `${semester.tahunAkademik} ${semester.periode}` },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {!semester.isActive && (
            <Button
              variant="default"
              onClick={() => setShowActivateDialog(true)}
            >
              <Power className="mr-2 h-4 w-4" />
              Aktifkan
            </Button>
          )}
          <Link href={`/admin/semester/${semesterId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      {semester.isActive && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Power className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Semester Aktif</p>
            <p className="text-sm text-green-700">
              Semester ini sedang aktif dan mahasiswa dapat melakukan KRS
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalKelas}</div>
                <p className="text-xs text-muted-foreground">Total Kelas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{uniqueMahasiswa}</div>
                <p className="text-xs text-muted-foreground">Mahasiswa Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{uniqueDosen}</div>
                <p className="text-xs text-muted-foreground">Dosen Mengajar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalKRS}</div>
                <p className="text-xs text-muted-foreground">Total KRS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Semester */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Semester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tahun Akademik</p>
                  <p className="font-medium">{semester.tahunAkademik}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Periode</p>
                  <p className="font-medium">{semester.periode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                  <p className="font-medium">{formatDate(semester.tanggalMulai)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                  <p className="font-medium">{formatDate(semester.tanggalSelesai)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={semester.isActive ? 'default' : 'secondary'}>
                    {semester.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daftar Kelas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Kelas ({totalKelas})</CardTitle>
                <Link href={`/admin/kelas-mk?semester=${semesterId}`}>
                  <Button variant="outline" size="sm">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {totalKelas === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada kelas untuk semester ini</p>
                  <Link href="/admin/kelas-mk/tambah">
                    <Button variant="outline" size="sm" className="mt-4">
                      Tambah Kelas
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Dosen</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Ruangan</TableHead>
                        <TableHead className="text-right">Mahasiswa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semester.kelasMataKuliah?.slice(0, 10).map((kelas) => (
                        <TableRow key={kelas.id}>
                          <TableCell className="font-mono text-sm">
                            {kelas.mataKuliah?.kodeMK}
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`/admin/kelas-mk/${kelas.id}`}
                              className="font-medium hover:underline"
                            >
                              {kelas.mataKuliah?.namaMK}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {kelas.mataKuliah?.sks} SKS
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{kelas.dosen?.namaLengkap}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{kelas.hari}</p>
                            <p className="text-xs text-muted-foreground">
                              {kelas.jamMulai} - {kelas.jamSelesai}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {kelas.ruangan?.nama}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">
                              {kelas._count?.krsDetail || 0}
                            </span>
                            <span className="text-muted-foreground">
                              /{kelas.kuotaMax}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-3 ${
                  semester.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {semester.isActive ? (
                    <Power className="h-6 w-6 text-green-600" />
                  ) : (
                    <PowerOff className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {semester.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {semester.isActive
                      ? 'Mahasiswa dapat melakukan KRS'
                      : 'Mahasiswa tidak dapat melakukan KRS'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Periode Waktu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Periode Waktu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Mulai</p>
                  <p className="font-medium">{formatDate(semester.tanggalMulai)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="font-medium">{formatDate(semester.tanggalSelesai)}</p>
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
                <span className="text-muted-foreground">Dibuat:</span>
                <span className="font-medium">{formatDate(semester.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terakhir diupdate:</span>
                <span className="font-medium">{formatDate(semester.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengaktifkan semester "{semester.tahunAkademik} {semester.periode}"?
              <span className="block mt-2 text-yellow-600 font-medium">
                Semester yang aktif sebelumnya akan dinonaktifkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={isActivating}
            >
              {isActivating ? 'Mengaktifkan...' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
