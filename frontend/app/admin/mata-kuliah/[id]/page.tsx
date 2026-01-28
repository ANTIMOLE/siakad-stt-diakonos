/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

import { mataKuliahAPI } from '@/lib/api';

export default function MataKuliahDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [mataKuliah, setMataKuliah] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMataKuliah = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await mataKuliahAPI.getById(id);

        if (response.success && response.data) {
          setMataKuliah(response.data);
        } else {
          setError(response.message || 'Gagal memuat data mata kuliah');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMataKuliah();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/admin/mata-kuliah/${id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      const response = await mataKuliahAPI.delete(id);

      if (response.success) {
        toast.success('Mata kuliah berhasil dihapus');
        router.push('/admin/mata-kuliah');
      } else {
        toast.error(response.message || 'Gagal menghapus mata kuliah');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus mata kuliah'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mata kuliah..." />
      </div>
    );
  }

  if (error || !mataKuliah) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Data mata kuliah tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ✅ Extract dual statistics
  const activeStats = mataKuliah.statistics?.active || {
    classes: 0,
    students: 0,
    semester: null,
  };

  const totalStats = mataKuliah.statistics?.total || {
    classes: 0,
    students: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Mata Kuliah"
        description={`Informasi lengkap mata kuliah ${mataKuliah.kodeMK}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mata Kuliah', href: '/admin/mata-kuliah' },
          { label: mataKuliah.kodeMK },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Dasar */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{mataKuliah.namaMK}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kode: {mataKuliah.kodeMK}
                  </p>
                </div>
                {mataKuliah.isActive ? (
                  <Badge className="bg-green-600">Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Nonaktif</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">SKS</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">{mataKuliah.sks} SKS</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Semester Ideal</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-semibold">Semester {mataKuliah.semesterIdeal}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lintas Prodi</p>
                  <div>
                    {mataKuliah.isLintasProdi ? (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        Ya
                      </Badge>
                    ) : (
                      <Badge variant="outline">Tidak</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>
                    {mataKuliah.isActive ? (
                      <Badge className="bg-green-600">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </div>
                </div>
              </div>

              {mataKuliah.deskripsi && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Deskripsi</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mataKuliah.deskripsi}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Kelas Aktif */}
          {mataKuliah.kelasMataKuliah && mataKuliah.kelasMataKuliah.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kelas Aktif Semester Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mataKuliah.kelasMataKuliah.map((kelas: any) => (
                    <div
                      key={kelas.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {kelas.semester?.tahunAkademik} {kelas.semester?.periode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {kelas.dosen?.namaLengkap} • {kelas.hari} {kelas.jamMulai}-
                          {kelas.jamSelesai}
                        </p>
                        {kelas.ruangan && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {kelas.ruangan.nama}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {kelas._count?.krsDetail || 0} mahasiswa
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* ✅ Statistik Semester Aktif */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Semester Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeStats.semester ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Semester</span>
                    <Badge variant="default">
                      {activeStats.semester.tahunAkademik} {activeStats.semester.periode}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kelas</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {activeStats.classes}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mahasiswa</span>
                    <span className="text-2xl font-bold text-green-600">
                      {activeStats.students}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada kelas aktif di semester ini
                </p>
              )}
            </CardContent>
          </Card>

          {/* ✅ Statistik Total (All Time) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Total (Semua Semester)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Kelas</span>
                </div>
                <span className="font-semibold">{totalStats.classes}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Mahasiswa</span>
                </div>
                <span className="font-semibold">{totalStats.students}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono">{mataKuliah.id}</p>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground">Dibuat</p>
                <p className="font-medium">
                  {new Date(mataKuliah.createdAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground">Terakhir Diupdate</p>
                <p className="font-medium">
                  {new Date(mataKuliah.updatedAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                variant="default"
                className="w-full"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Mata Kuliah
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Mata Kuliah
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus mata kuliah{' '}
              <span className="font-semibold">{mataKuliah.namaMK}</span>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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