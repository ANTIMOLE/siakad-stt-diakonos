/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Eye, Edit, Trash2, BookOpen, GraduationCap } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

// ============================================
// TYPES
// ============================================
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

// ============================================
// CONSTANTS
// ============================================
const SEMESTER_PAKET = [1, 2, 3, 4, 5, 6, 7, 8];
const ANGKATAN_OPTIONS = [2024, 2023, 2022, 2021, 2020];

// ============================================
// HELPER FUNCTIONS
// ============================================
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const calculateStats = (paketList: PaketKRS[]) => ({
  total: paketList.length,
  totalMK: paketList.reduce((sum, p) => sum + (p._count?.detail || 0), 0),
  totalSKS: paketList.reduce((sum, p) => sum + (p.totalSKS || 0), 0),
  uniqueProdi: new Set(paketList.map((p) => p.prodiId)).size,
});

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ value, label, color }: { value: number; label: string; color?: string }) => (
  <Card className={color || 'bg-muted/50'}>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default function PaketKRSListPage() {
  const router = useRouter();

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

  // ============================================
  // FETCH SEMESTER LIST
  // ============================================
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

  // ============================================
  // FETCH PAKET KRS DATA
  // ============================================
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
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [filters.angkatan, filters.prodiId, filters.semesterId, filters.semesterPaket]);

  useEffect(() => {
    fetchPaketKRS();
  }, [fetchPaketKRS]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const stats = useMemo(() => calculateStats(paketList), [paketList]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleView = useCallback((id: number) => {
    router.push(`/admin/paket-krs/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: number) => {
    router.push(`/admin/paket-krs/${id}/edit`);
  }, [router]);

  const handleDelete = useCallback((id: number, namaPaket: string) => {
    setDeleteDialog({
      open: true,
      id,
      name: namaPaket,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
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
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  }, [deleteDialog.id, fetchPaketKRS]);

  const handleCreate = useCallback(() => {
    router.push('/admin/paket-krs/tambah');
  }, [router]);

  const handleExport = useCallback(async () => {
    try {
      const response = await paketKRSAPI.exportToExcel({
        angkatan: filters.angkatan !== 'ALL' ? parseInt(filters.angkatan) : undefined,
        prodiId: filters.prodiId !== 'ALL' ? parseInt(filters.prodiId) : undefined,
        semesterId: filters.semesterId !== 'ALL' ? parseInt(filters.semesterId) : undefined,
        semesterPaket: filters.semesterPaket !== 'ALL' ? parseInt(filters.semesterPaket) : undefined,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(response, `PaketKRS_${timestamp}.xlsx`);
      
      toast.success('Data Paket KRS berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data Paket KRS');
    }
  }, [filters]);

  const handleRetry = useCallback(() => {
    fetchPaketKRS();
  }, [fetchPaketKRS]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && paketList.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data paket KRS..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && paketList.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
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
                  {ANGKATAN_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {SEMESTER_PAKET.map((sem) => (
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard value={stats.total} label="Total Paket" color="bg-blue-50 border-blue-200" />
        <StatCard value={stats.totalMK} label="Total Mata Kuliah" color="bg-green-50 border-green-200" />
        <StatCard value={stats.totalSKS} label="Total SKS" color="bg-purple-50 border-purple-200" />
        <StatCard value={stats.uniqueProdi} label="Program Studi" color="bg-orange-50 border-orange-200" />
      </div>

      {/* Table View */}
      {paketList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="Tidak ada paket KRS"
              description="Tidak ada paket KRS yang sesuai dengan filter yang dipilih"
              action={{
                label: 'Buat Paket Baru',
                onClick: handleCreate,
                icon: Plus,
              }}
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Paket</TableHead>
                    <TableHead className="text-center">Prodi</TableHead>
                    <TableHead className="text-center">Angkatan</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-center">Mata Kuliah</TableHead>
                    <TableHead className="text-center">Total SKS</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paketList.map((paket, index) => (
                    <TableRow
                      key={paket.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleView(paket.id)}
                    >
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{paket.namaPaket}</p>
                          <p className="text-xs text-muted-foreground">
                            {paket.prodi?.nama || 'N/A'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {paket.prodi?.kode || 'N/A'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{paket.angkatan}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          Semester {paket.semesterPaket}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {paket.semester ? (
                            <>
                              <p>{paket.semester.tahunAkademik}</p>
                              <p className="text-xs text-muted-foreground">
                                {paket.semester.periode}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {paket._count?.detail || 0}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="font-medium text-sm">
                          {paket.totalSKS || 0}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(paket.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(paket.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(paket.id, paket.namaPaket);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
