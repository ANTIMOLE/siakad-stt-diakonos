/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, FileText, MoreHorizontal, Eye, Edit, Trash2, UserX } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, MahasiswaFilters } from '@/types/model';
import { PAGINATION } from '@/lib/constants';

// ============================================
// CONSTANTS
// ============================================
const GENDER_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

const PRODI_OPTIONS = [
  { value: 'all', label: 'Semua Prodi' },
  { value: '1', label: 'PAK' },
  { value: '2', label: 'Teologi' },
];

const ANGKATAN_OPTIONS = [2025, 2024, 2023, 2022, 2021, 2020];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'NON_AKTIF', label: 'Nonaktif' },
  { value: 'CUTI', label: 'Cuti' },
  { value: 'LULUS', label: 'Lulus' },
  { value: 'DO', label: 'DO' },
];

const LIMIT_OPTIONS = [
  { value: '10', label: '10 / hal' },
  { value: '25', label: '25 / hal' },
  { value: '50', label: '50 / hal' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const getGenderLabel = (gender: string | null): string => {
  return gender === 'L' ? 'Laki-laki' : gender === 'P' ? 'Perempuan' : '-';
};

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
// MAHASISWA ROW ACTIONS COMPONENT
// ============================================
const MahasiswaActions = ({
  mahasiswa,
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  mahasiswa: Mahasiswa;
  onView: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
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
      {mahasiswa.status === 'AKTIF' && (
        <DropdownMenuItem onClick={onDeactivate}>
          <UserX className="mr-2 h-4 w-4" />
          Nonaktifkan
        </DropdownMenuItem>
      )}
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
export default function MahasiswaPage() {
  const router = useRouter();

  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<MahasiswaFilters>({
    search: '',
    jenisKelamin: undefined,
    prodiId: undefined,
    angkatan: undefined,
    status: undefined,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: 'nim',
    sortOrder: 'asc',
  });

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await mahasiswaAPI.getAll(filters);
        
        if (response.success) {
          setMahasiswa(response.data || []);
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.total);
        } else {
          setError(response.message || 'Gagal memuat data mahasiswa');
        }
      } catch (err: any) {
        console.error('Fetch mahasiswa error:', err);
        setError(err.response?.message || err.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMahasiswa();
  }, [
    filters.search,
    filters.jenisKelamin,
    filters.prodiId,
    filters.angkatan,
    filters.status,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
  ]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const angkatanOptions = useMemo(() => [
    { value: 'all', label: 'Semua Angkatan' },
    ...ANGKATAN_OPTIONS.map(year => ({ value: year.toString(), label: year.toString() }))
  ], []);

  const paginationInfo = useMemo(() => ({
    current: filters.page || 1,
    total: totalPages,
    items: totalItems,
  }), [filters.page, totalPages, totalItems]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof MahasiswaFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleAdd = useCallback(() => {
    router.push('/admin/mahasiswa/tambah');
  }, [router]);

  const handleView = useCallback((id: number) => {
    router.push(`/admin/mahasiswa/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: number) => {
    router.push(`/admin/mahasiswa/${id}/edit`);
  }, [router]);

  const handleDelete = useCallback(async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mahasiswa ${nama}?`)) {
      return;
    }

    try {
      const response = await mahasiswaAPI.delete(id);

      if (response.success) {
        toast.success('Mahasiswa berhasil dihapus');
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        toast.error(response.message || 'Gagal menghapus mahasiswa');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.message || 'Terjadi kesalahan');
    }
  }, []);

  const handleDeactivate = useCallback(async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan mahasiswa ${nama}?`)) {
      return;
    }

    try {
      const response = await mahasiswaAPI.update(id, { status: 'NON_AKTIF' });

      if (response.success) {
        toast.success('Mahasiswa berhasil dinonaktifkan');
        setFilters(prev => ({ ...prev, page: prev.page }));
      } else {
        toast.error(response.message || 'Gagal menonaktifkan mahasiswa');
      }
    } catch (err: any) {
      console.error('Deactivate error:', err);
      toast.error(err.response?.message || 'Terjadi kesalahan');
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const response = await mahasiswaAPI.exportToExcel({
        search: filters.search,
        prodiId: filters.prodiId,
        angkatan: filters.angkatan,
        status: filters.status,
        jenisKelamin: filters.jenisKelamin,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(response, `Mahasiswa_${timestamp}.xlsx`);
      
      toast.success('Data mahasiswa berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data mahasiswa');
    }
  }, [filters]);

  const handleRetry = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading && mahasiswa.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

  if (error && mahasiswa.length === 0) {
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
        title="Data Mahasiswa"
        description="Kelola data mahasiswa STT Diakonos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mahasiswa' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Mahasiswa
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchBar
                placeholder="Cari berdasarkan nama, NIM, atau alamat..."
                onSearch={handleSearch}
              />
            </div>

            <FilterSelect
              value={filters.jenisKelamin || 'all'}
              onValueChange={(value) =>
                handleFilterChange('jenisKelamin', value === 'all' ? undefined : value as 'L' | 'P')
              }
              options={GENDER_OPTIONS}
              placeholder="Jenis Kelamin"
              className="w-full md:w-40"
            />

            <FilterSelect
              value={filters.prodiId?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('prodiId', value === 'all' ? undefined : parseInt(value))
              }
              options={PRODI_OPTIONS}
              placeholder="Semua Prodi"
              className="w-full md:w-48"
            />

            <FilterSelect
              value={filters.angkatan?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('angkatan', value === 'all' ? undefined : parseInt(value))
              }
              options={angkatanOptions}
              placeholder="Angkatan"
              className="w-full md:w-40"
            />

            <FilterSelect
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
              options={STATUS_OPTIONS}
              placeholder="Status"
              className="w-full md:w-40"
            />

            <FilterSelect
              value={filters.limit?.toString() || '10'}
              onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              options={LIMIT_OPTIONS}
              className="w-full md:w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {mahasiswa.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak Ada Data"
              description="Tidak ada mahasiswa yang sesuai dengan filter yang dipilih"
              action={{
                label: 'Tambah Mahasiswa',
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
                      <TableHead>NIM</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jenis Kelamin</TableHead>
                      <TableHead>Program Studi</TableHead>
                      <TableHead>Angkatan</TableHead>
                      <TableHead>Dosen Wali</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mahasiswa.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">
                          {item.nim}
                        </TableCell>
                        <TableCell className="font-medium">{item.namaLengkap}</TableCell>
                        <TableCell>{getGenderLabel(item.jenisKelamin || null)}</TableCell>
                        <TableCell>{item.prodi ? item.prodi.kode : '-'}</TableCell>
                        <TableCell>{item.angkatan}</TableCell>
                        <TableCell className="text-sm">
                          {item.dosenWali ? item.dosenWali.namaLengkap : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <MahasiswaActions
                            mahasiswa={item}
                            onView={() => handleView(item.id)}
                            onEdit={() => handleEdit(item.id)}
                            onDeactivate={() => handleDeactivate(item.id, item.namaLengkap)}
                            onDelete={() => handleDelete(item.id, item.namaLengkap)}
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
    </div>
  );
}
