/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, CheckCircle, Trash2, Eye } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

import { semesterAPI } from '@/lib/api';
import { Semester } from '@/types/model';

export default function SemesterManagePage() {
  const router = useRouter();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    semesterId: number | null;
    semesterName: string;
  }>({
    open: false,
    semesterId: null,
    semesterName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [activateDialog, setActivateDialog] = useState<{
    open: boolean;
    semesterId: number | null;
    semesterName: string;
  }>({
    open: false,
    semesterId: null,
    semesterName: '',
  });
  const [isActivating, setIsActivating] = useState(false);

  const fetchSemesters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await semesterAPI.getAll();

      if (response.success) {
        const sorted = (response.data || []).sort((a: Semester, b: Semester) => {
          return b.tahunAkademik.localeCompare(a.tahunAkademik);
        });
        setSemesters(sorted);
      } else {
        setError(response.message || 'Gagal memuat data semester');
      }
    } catch (err: any) {
      console.error('Fetch semester error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data semester'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleActivateClick = (id: number, tahunAkademik: string, periode: string) => {
    setActivateDialog({
      open: true,
      semesterId: id,
      semesterName: `${tahunAkademik} ${periode}`,
    });
  };

  const confirmActivate = async () => {
    if (!activateDialog.semesterId) return;

    try {
      setIsActivating(true);

      const response = await semesterAPI.activate(activateDialog.semesterId);
      
      if (response.success) {
        toast.success('Semester berhasil diaktifkan');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchSemesters();
        
        setActivateDialog({ open: false, semesterId: null, semesterName: '' });
      } else {
        toast.error(response.message || 'Gagal mengaktifkan semester');
      }
    } catch (err: any) {
      console.error('Activate error:', err);
      
      const errorMessage = 
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat mengaktifkan semester';
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteClick = (semester: Semester) => {
    setDeleteDialog({
      open: true,
      semesterId: semester.id,
      semesterName: `${semester.tahunAkademik} ${semester.periode}`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.semesterId) return;

    try {
      setIsDeleting(true);

      const response = await semesterAPI.delete(deleteDialog.semesterId);

      if (response.success) {
        toast.success('Semester berhasil dihapus');
        fetchSemesters();
        setDeleteDialog({ open: false, semesterId: null, semesterName: '' });
      } else {
        toast.error(response.message || 'Gagal menghapus semester', {
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      
      const errorMessage = 
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus semester';
      
      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/semester/tambah');
  };

  const handleDetail = (id: number) => {
    router.push(`/admin/semester/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/semester/${id}/edit`);
  };

  const handleRetry = () => {
    fetchSemesters();
  };

  if (isLoading && semesters.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data semester..." />
      </div>
    );
  }

  if (error && semesters.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Semester"
        description="Manajemen semester akademik"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Semester' },
        ]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Semester Baru
          </Button>
        }
      />

      {semesters.length === 0 ? (
        <EmptyState
          title="Belum ada semester"
          description="Mulai dengan membuat semester akademik pertama"
          action={{
            label: 'Buat Semester Baru',
            onClick: handleCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="space-y-4">
          {semesters.map((semester) => (
            <Card key={semester.id} className={semester.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {semester.tahunAkademik}
                      <Badge variant={semester.periode === 'GANJIL' ? 'default' : 'secondary'}>
                        {semester.periode}
                      </Badge>
                      {semester.isActive && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aktif
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(semester.tanggalMulai)} - {formatDate(semester.tanggalSelesai)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDetail(semester.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {!semester.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateClick(semester.id, semester.tahunAkademik, semester.periode)}
                      >
                        Aktifkan
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(semester.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {!semester.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(semester)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Periode KRS</p>
                    <p className="text-sm">
                      {formatDate(semester.periodeKRSMulai)} - {formatDate(semester.periodeKRSSelesai)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Periode Perbaikan KRS</p>
                    <p className="text-sm">
                      {formatDate(semester.periodePerbaikanKRSMulai)} - {formatDate(semester.periodePerbaikanKRSSelesai)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus semester{' '}
              <span className="font-semibold">{deleteDialog.semesterName}</span>?
              <br />
              <span className="text-red-600">
                Aksi ini tidak dapat dibatalkan. Semester yang aktif tidak dapat dihapus.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activateDialog.open}
        onOpenChange={(open) =>
          setActivateDialog({ ...activateDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan Semester?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengaktifkan semester{' '}
              <span className="font-semibold">{activateDialog.semesterName}</span>?
              <br />
              <span className="text-primary font-medium">
                Semester lain yang sedang aktif akan dinonaktifkan secara otomatis.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              disabled={isActivating}
            >
              {isActivating ? 'Mengaktifkan...' : 'Ya, Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}