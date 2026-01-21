/**
 * Admin - List Mata Kuliah Page
 * ✅ Full Backend Integration with CRUD Operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Trash2, MoreHorizontal, Download } from 'lucide-react';
import Link from 'next/link';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import { mataKuliahAPI } from '@/lib/api';
import { MataKuliah, PaginatedApiResponse } from '@/types/model';
import { PAGINATION } from '@/lib/constants';

interface MataKuliahFilters {
  search?: string;
  semesterIdeal?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function MataKuliahListPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
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

  // ============================================
  // FETCH MATA KULIAH DATA
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
    setError(
      err.response?.data?.message ||
      err.message ||
      'Terjadi kesalahan saat memuat data mata kuliah'
    );
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
]); // ✅ Individual properties, bukan whole object

useEffect(() => {
  fetchMataKuliah();
}, [fetchMataKuliah]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = (key: keyof MataKuliahFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleAdd = () => {
    router.push('/admin/mata-kuliah/tambah');
  };

  const handleView = (id: number) => {
    router.push(`/admin/mata-kuliah/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/mata-kuliah/${id}/edit`);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata kuliah ${nama}?`)) {
      return;
    }

    try {
      const response = await mataKuliahAPI.delete(id);

      if (response.success) {
        toast.success('Mata kuliah berhasil dihapus');
        fetchMataKuliah(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal menghapus mata kuliah');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus mata kuliah'
      );
    }
  };

  const handleExport = () => {
    toast.info('Fitur export akan segera hadir');
  };

  const handleRetry = () => {
    fetchMataKuliah();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && mataKuliah.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mata kuliah..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
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
      {/* Page Header */}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <SearchBar
                placeholder="Cari kode atau nama mata kuliah..."
                onSearch={handleSearch}
              />
            </div>

            {/* Filter Semester */}
            <Select
              value={filters.semesterIdeal?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('semesterIdeal', value === 'all' ? undefined : parseInt(value))
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
                <SelectItem value="3">Semester 3</SelectItem>
                <SelectItem value="4">Semester 4</SelectItem>
                <SelectItem value="5">Semester 5</SelectItem>
                <SelectItem value="6">Semester 6</SelectItem>
                <SelectItem value="7">Semester 7</SelectItem>
                <SelectItem value="8">Semester 8</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select
              value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
              onValueChange={(value) =>
                handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Items per page */}
            <Select
              value={filters.limit?.toString() || '10'}
              onValueChange={(value) =>
                handleFilterChange('limit', parseInt(value))
              }
            >
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / hal</SelectItem>
                <SelectItem value="25">25 / hal</SelectItem>
                <SelectItem value="50">50 / hal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
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
              {/* Table */}
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
                          {mk.isLintasProdi ? (
                            <Badge variant="secondary">Ya</Badge>
                          ) : (
                            <Badge variant="outline">Tidak</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {mk.isActive ? (
                            <Badge variant="default" className="bg-green-600">Aktif</Badge>
                          ) : (
                            <Badge variant="secondary">Nonaktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(mk.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(mk.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(mk.id, mk.namaMK)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Halaman {filters.page} dari {totalPages} • Total {totalItems} data
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange((filters.page || 1) - 1)}
                      disabled={filters.page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange((filters.page || 1) + 1)}
                      disabled={filters.page === totalPages}
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