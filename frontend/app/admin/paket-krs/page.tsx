/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Eye, Edit, Trash2 } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { paketKRSAPI, semesterAPI } from '@/lib/api';
import { Semester } from '@/types/model';

// TYPES
interface PaketKRS {
  id: number;
  namaPaket: string;
  angkatan: number;
  prodiId: number;
  semesterPaket: number;
  semesterId: number;
  totalSKS: number;
  prodi?: {
    id: number;
    kode: string;
    nama: string;
  };
  semester?: {
    id: number;
    tahunAkademik: string;
    periode: string;
  };
  _count?: {
    detail: number;
  };
}

export default function PaketKRSListPage() {
  const router = useRouter();

  // STATE MANAGEMENT
  const [paketList, setPaketList] = useState<PaketKRS[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSemesterLoading, setIsSemesterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    angkatan: 'ALL',
    prodiId: 'ALL',
    semesterId: 'ALL',
    semesterPaket: 'ALL',
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // FETCH SEMESTER LIST
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setIsSemesterLoading(true);
        const response = await semesterAPI.getAll();
        if (response.success && response.data) {
          setSemesterList(response.data);
        }
      } catch (err) {
        console.error('Fetch semesters error:', err);
      } finally {
        setIsSemesterLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // FETCH PAKET KRS DATA
  const fetchPaketKRS = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (filters.angkatan !== 'ALL')
        params.angkatan = parseInt(filters.angkatan);
      if (filters.prodiId !== 'ALL') params.prodiId = parseInt(filters.prodiId);
      if (filters.semesterId !== 'ALL')
        params.semesterId = parseInt(filters.semesterId);
      if (filters.semesterPaket !== 'ALL')
        params.semesterPaket = parseInt(filters.semesterPaket);

      const response = await paketKRSAPI.getAll(params);

      if (response.success) {
        setPaketList(response.data || []);
      } else {
        setError(response.message || 'Gagal memuat data paket KRS');
      }
    } catch (err: any) {
      console.error('Fetch paket KRS error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data paket KRS'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters.angkatan, filters.prodiId, filters.semesterId, filters.semesterPaket]);

  useEffect(() => {
    fetchPaketKRS();
  }, [fetchPaketKRS]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleView = (id: number) => {
    router.push(`/admin/paket-krs/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/paket-krs/${id}/edit`);
  };

  const handleDelete = (id: number, namaPaket: string) => {
    setDeleteDialog({
      open: true,
      id,
      name: namaPaket,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      setIsDeleting(true);
      const response = await paketKRSAPI.delete(deleteDialog.id);

      if (response.success) {
        toast.success('Paket KRS berhasil dihapus');
        fetchPaketKRS();
      } else {
        toast.error(response.message || 'Gagal menghapus paket KRS');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menghapus paket KRS'
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  };

  const handleCreate = () => {
    router.push('/admin/paket-krs/tambah');
  };

  // ✅ EXPORT HANDLER
  const handleExport = async () => {
    try {
      const response = await paketKRSAPI.exportToExcel({
        angkatan: filters.angkatan !== 'ALL' ? parseInt(filters.angkatan) : undefined,
        prodiId: filters.prodiId !== 'ALL' ? parseInt(filters.prodiId) : undefined,
        semesterId: filters.semesterId !== 'ALL' ? parseInt(filters.semesterId) : undefined,
        semesterPaket: filters.semesterPaket !== 'ALL' ? parseInt(filters.semesterPaket) : undefined,
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `PaketKRS_${timestamp}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data Paket KRS berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data Paket KRS');
    }
  };

  const handleRetry = () => {
    fetchPaketKRS();
  };

  // LOADING STATE
  if (isLoading && paketList.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data paket KRS..." />
      </div>
    );
  }

  // ERROR STATE
  if (error && paketList.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // RENDER
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Paket KRS"
        description="Kelola paket KRS per angkatan dan prodi"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Paket KRS' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Buat Paket Baru
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Filter Angkatan */}
            <div>
              <label className="text-sm font-medium mb-2 block">Angkatan</label>
              <Select
                value={filters.angkatan}
                onValueChange={(value) => handleFilterChange('angkatan', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Angkatan</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Program Studi */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Program Studi
              </label>
              <Select
                value={filters.prodiId}
                onValueChange={(value) => handleFilterChange('prodiId', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Prodi</SelectItem>
                  <SelectItem value="1">PAK</SelectItem>
                  <SelectItem value="2">Teologi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Semester Akademik */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Semester Akademik
              </label>
              <Select
                value={filters.semesterId}
                onValueChange={(value) => handleFilterChange('semesterId', value)}
                disabled={isSemesterLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Semester</SelectItem>
                  {semesterList.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id.toString()}>
                      {sem.tahunAkademik} {sem.periode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Semester Paket */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Semester Paket
              </label>
              <Select
                value={filters.semesterPaket}
                onValueChange={(value) =>
                  handleFilterChange('semesterPaket', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Semester</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paket Cards */}
      {paketList.length === 0 ? (
        <EmptyState
          title="Tidak ada paket KRS"
          description="Tidak ada paket KRS yang sesuai dengan filter yang dipilih"
          action={{
            label: 'Buat Paket Baru',
            onClick: handleCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paketList.map((paket) => (
            <Card key={paket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {paket.namaPaket}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>Angkatan {paket.angkatan}</span>
                      <span>•</span>
                      <span>Semester {paket.semesterPaket}</span>
                    </div>
                    {paket.semester && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {paket.semester.tahunAkademik} {paket.semester.periode}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Badge className="ml-2 shrink-0">
                    {paket.prodi?.kode || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">
                      {paket._count?.detail || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Mata Kuliah
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-2xl font-bold">{paket.totalSKS || 0}</div>
                    <div className="text-xs text-muted-foreground">Total SKS</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(paket.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(paket.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(paket.id, paket.namaPaket)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket KRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket{' '}
              <span className="font-semibold text-foreground">
                {deleteDialog.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua mata
              kuliah dalam paket ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Batal
            </AlertDialogCancel>
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
    </div>
  );
}