/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Trash2, MoreHorizontal, Download } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { mataKuliahAPI } from '@/lib/api';
import { MataKuliah } from '@/types/model';
import { PAGINATION } from '@/lib/constants';

// ============================================
// TYPES
// ============================================
interface MataKuliahFilters {
  search?: string;
  semesterIdeal?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// CONSTANTS
// ============================================
const SEMESTER_OPTIONS = [
  { value: 'all', label: 'Semua Semester' },
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 / hal' },
  { value: '25', label: '25 / hal' },
  { value: '50', label: '50 / hal' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================
// FILTER SELECT COMPONENT
// ============================================
const FilterSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const ActiveStatusBadge = ({ isActive }: { isActive: boolean }) => (
  isActive ? (
    <Badge variant="default" className="bg-green-600">Aktif</Badge>
  ) : (
    <Badge variant="secondary">Nonaktif</Badge>
  )
);

const LintasProdiaBadge = ({ isLintasProdi }: { isLintasProdi: boolean }) => (
  isLintasProdi ? (
    <Badge variant="secondary">Ya</Badge>
  ) : (
    <Badge variant="outline">Tidak</Badge>
  )
);

// ============================================
// MATA KULIAH ACTIONS COMPONENT
// ============================================
const MataKuliahActions = ({
  mk,
  onView,
  onEdit,
  onDelete,
}: {
  mk: MataKuliah;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onView}>
        <Eye className="mr-2 h-4 w-4" />
        Lihat Detail
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onEdit}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onDelete} className="text-red-600">
        <Trash2 className="mr-2 h-4 w-4" />
        Hapus
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function MataKuliahListPage() {
  const router = useRouter();

  const [mataKuliah, setMataKuliah] = useState<MataKuliah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<MataKuliahFilters>({
    search: '',
    semesterIdeal: undefined,
    isActive: true,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: 'kodeMK',
    sortOrder: 'asc',
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mkId: number | null;
    mkNama: string;
  }>({
    open: false,
    mkId: null,
    mkNama: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchMataKuliah = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await mataKuliahAPI.getAll(filters);

      if (response.success) {
        setMataKuliah(response.data || []);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        setError(response.message || 'Gagal memuat data mata kuliah');
      }
    } catch (err: any) {
      console.error('Fetch mata kuliah error:', err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.search,
    filters.semesterIdeal,
    filters.isActive,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
  ]);

  useEffect(() => {
    fetchMataKuliah();
  }, [fetchMataKuliah]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const paginationInfo = useMemo(() => ({
    current: filters.page || 1,
    total: totalPages,
    items: totalItems,
  }), [filters.page, totalPages, totalItems]);

  const activeStatusValue = useMemo(() => {
    return filters.isActive === undefined ? 'all' : filters.isActive.toString();
  }, [filters.isActive]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof MataKuliahFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleAdd = useCallback(() => {
    router.push('/admin/mata-kuliah/tambah');
  }, [router]);

  const handleView = useCallback((id: number) => {
    router.push(`/admin/mata-kuliah/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: number) => {
    router.push(`/admin/mata-kuliah/${id}/edit`);
  }, [router]);

  const handleDeleteClick = useCallback((mk: MataKuliah) => {
    setDeleteDialog({
      open: true,
      mkId: mk.id,
      mkNama: mk.namaMK,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.mkId) return;

    try {
      setIsDeleting(true);

      const response = await mataKuliahAPI.delete(deleteDialog.mkId);

      if (response.success) {
        toast.success('Mata kuliah berhasil dihapus');
        fetchMataKuliah();
        setDeleteDialog({ open: false, mkId: null, mkNama: '' });
      } else {
        toast.error(response.message || 'Gagal menghapus mata kuliah');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog.mkId, fetchMataKuliah]);

  const handleExport = useCallback(async () => {
    try {
      toast.loading('Mengekspor data...');
      
      const blob = await mataKuliahAPI.exportToExcel({
        search: filters.search,
        semesterIdeal: filters.semesterIdeal,
        isActive: filters.isActive,
      });
      
      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `MataKuliah_${timestamp}.xlsx`);
      
      toast.dismiss();
      toast.success('Data berhasil diekspor');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Gagal mengekspor data');
    }
  }, [filters]);

  const handleRetry = useCallback(() => {
    fetchMataKuliah();
  }, [fetchMataKuliah]);

  const handleSemesterChange = useCallback((value: string) => {
    handleFilterChange('semesterIdeal', value === 'all' ? undefined : parseInt(value));
  }, [handleFilterChange]);

  const handleStatusChange = useCallback((value: string) => {
    handleFilterChange('isActive', value === 'all' ? undefined : value === 'true');
  }, [handleFilterChange]);

  const handleLimitChange = useCallback((value: string) => {
    handleFilterChange('limit', parseInt(value));
  }, [handleFilterChange]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading && mataKuliah.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mata kuliah..." />
      </div>
    );
  }

  if (error && mataKuliah.length === 0) {
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
        title="Mata Kuliah"
        description="Kelola mata kuliah dan kurikulum STT Diakonos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mata Kuliah' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Mata Kuliah
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchBar
                placeholder="Cari kode atau nama mata kuliah..."
                onSearch={handleSearch}
              />
            </div>

            <FilterSelect
              value={filters.semesterIdeal?.toString() || 'all'}
              onValueChange={handleSemesterChange}
              options={SEMESTER_OPTIONS}
              placeholder="Semester"
              className="w-full md:w-40"
            />

            <FilterSelect
              value={activeStatusValue}
              onValueChange={handleStatusChange}
              options={STATUS_OPTIONS}
              placeholder="Status"
              className="w-full md:w-40"
            />

            <FilterSelect
              value={filters.limit?.toString() || '10'}
              onValueChange={handleLimitChange}
              options={LIMIT_OPTIONS}
              className="w-full md:w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Daftar Mata Kuliah
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalItems} total)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mataKuliah.length === 0 ? (
            <EmptyState
              title="Tidak Ada Data"
              description="Tidak ada mata kuliah yang sesuai dengan filter yang dipilih"
              action={{
                label: 'Tambah Mata Kuliah',
                onClick: handleAdd,
                icon: Plus,
              }}
              className="my-8 border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode MK</TableHead>
                      <TableHead>Nama Mata Kuliah</TableHead>
                      <TableHead className="text-center">SKS</TableHead>
                      <TableHead className="text-center">Semester</TableHead>
                      <TableHead className="text-center">Lintas Prodi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mataKuliah.map((mk) => (
                      <TableRow key={mk.id}>
                        <TableCell className="font-mono font-medium">
                          {mk.kodeMK}
                        </TableCell>
                        <TableCell className="font-medium">{mk.namaMK}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{mk.sks}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {mk.semesterIdeal}
                        </TableCell>
                        <TableCell className="text-center">
                          <LintasProdiaBadge isLintasProdi={mk.isLintasProdi} />
                        </TableCell>
                        <TableCell className="text-center">
                          <ActiveStatusBadge isActive={mk.isActive} />
                        </TableCell>
                        <TableCell className="text-right">
                          <MataKuliahActions
                            mk={mk}
                            onView={() => handleView(mk.id)}
                            onEdit={() => handleEdit(mk.id)}
                            onDelete={() => handleDeleteClick(mk)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Halaman {paginationInfo.current} dari {paginationInfo.total} • Total {paginationInfo.items} data
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationInfo.current - 1)}
                      disabled={paginationInfo.current === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginationInfo.current + 1)}
                      disabled={paginationInfo.current === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus mata kuliah{' '}
              <span className="font-semibold">{deleteDialog.mkNama}</span>?
              <br />
              <span className="text-red-600">
                Mata kuliah yang memiliki kelas aktif tidak dapat dihapus.
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
    </div>
  );
}
