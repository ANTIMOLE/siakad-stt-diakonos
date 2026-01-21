/**
 * Admin - List Dosen Page
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
import StatusBadge from '@/components/features/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { dosenAPI } from '@/lib/api';
import { Dosen, DosenFilters, PaginatedApiResponse } from '@/types/model';
import { PAGINATION } from '@/lib/constants';

export default function DosenListPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [dosen, setDosen] = useState<Dosen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<DosenFilters>({
    search: '',
    prodiId: undefined,
    status: undefined,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: 'namaLengkap',
    sortOrder: 'asc',
  });

  // ============================================
  // FETCH DOSEN DATA
  // ============================================
  const fetchDosen = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await dosenAPI.getAll(filters);
  

      if (response.success) {
        setDosen(response.data || []);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      } else {
        setError(response.message || 'Gagal memuat data dosen');
      }
    } catch (err: any) {
      console.error('Fetch dosen error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data dosen'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDosen();
  }, [fetchDosen]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  }, []);

  const handleFilterChange = (key: keyof DosenFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleAdd = () => {
    router.push('/admin/dosen/tambah');
  };

  const handleView = (id: number) => {
    router.push(`/admin/dosen/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/dosen/${id}/edit`);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dosen ${nama}?`)) {
      return;
    }

    try {
      const response = await dosenAPI.delete(id);

      if (response.success) {
        toast.success('Dosen berhasil dihapus');
        fetchDosen(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal menghapus dosen');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus dosen'
      );
    }
  };

  const handleExport = () => {
    toast.info('Fitur export akan segera hadir');
  };

  const handleRetry = () => {
    fetchDosen();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && dosen.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data dosen..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && dosen.length === 0) {
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
        title="Data Dosen"
        description="Kelola data dosen STT Diakonos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Dosen' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Dosen
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
                placeholder="Cari NIDN atau Nama..."
                onSearch={handleSearch}
              />
            </div>

            {/* Filter Status */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="NON_AKTIF">Nonaktif</SelectItem>
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
              Daftar Dosen
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalItems} total)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dosen.length === 0 ? (
            <EmptyState
              title="Tidak Ada Data"
              description="Tidak ada dosen yang sesuai dengan filter yang dipilih"
              action={{
                label: 'Tambah Dosen',
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
                      <TableHead>NIDN</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Prodi</TableHead>
                      <TableHead>NUPTK</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dosen.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">
                          {item.nidn}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.namaLengkap}
                        </TableCell>
                        <TableCell>
                          {item.prodi ? (
                            <Badge variant="outline">{item.prodi.kode}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.nuptk}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={item.status} />
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
                              <DropdownMenuItem onClick={() => handleView(item.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(item.id, item.namaLengkap)}
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
                    Halaman {filters.page} dari {totalPages}
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