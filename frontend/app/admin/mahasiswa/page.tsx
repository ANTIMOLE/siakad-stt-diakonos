/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin - List Mahasiswa Page
 * ✅ UPDATED: Sesuai schema baru (tempatTanggalLahir, jenisKelamin, alamat)
 * ✅ FIXED: Excel export functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Download,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserX,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, MahasiswaFilters } from '@/types/model';
import { PAGINATION } from '@/lib/constants';

export default function MahasiswaPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
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
  // FETCH MAHASISWA DATA
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
        setError(
          err.response?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data mahasiswa'
        );
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
  // MEMOIZED HANDLERS
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
      toast.error(
        err.response?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus mahasiswa'
      );
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
      toast.error(
        err.response?.message ||
        err.message ||
        'Terjadi kesalahan saat menonaktifkan mahasiswa'
      );
    }
  }, []);


  const handleExport = async () => {
    try {
      const response = await mahasiswaAPI.exportToExcel({
        search: filters.search,
        prodiId: filters.prodiId,
        angkatan: filters.angkatan,
        status: filters.status,
        jenisKelamin: filters.jenisKelamin,
      });

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Mahasiswa_${timestamp}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data mahasiswa berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data mahasiswa');
    }
  };

  const handleRetry = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && mahasiswa.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
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
      {/* Page Header */}
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
            {/* Search */}
            <div className="flex-1">
              <SearchBar
                placeholder="Cari berdasarkan nama, NIM, atau alamat..."
                onSearch={handleSearch}
              />
            </div>

            {/* Filter Jenis Kelamin */}
            <Select
              value={filters.jenisKelamin || 'all'}
              onValueChange={(value) =>
                handleFilterChange('jenisKelamin', value === 'all' ? undefined : value as 'L' | 'P')
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Prodi */}
            <Select
              value={filters.prodiId?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('prodiId', value === 'all' ? undefined : parseInt(value))
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Semua Prodi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Prodi</SelectItem>
                <SelectItem value="1">PAK</SelectItem>
                <SelectItem value="2">Teologi</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Angkatan */}
            <Select
              value={filters.angkatan?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('angkatan', value === 'all' ? undefined : parseInt(value))
              }
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Angkatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Angkatan</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="CUTI">Cuti</SelectItem>
                <SelectItem value="LULUS">Lulus</SelectItem>
                <SelectItem value="DO">DO</SelectItem>
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
              {/* Table */}
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
                        <TableCell>
                          {item.jenisKelamin === 'L' ? 'Laki-laki' : item.jenisKelamin === 'P' ? 'Perempuan' : '-'}
                        </TableCell>
                        <TableCell>
                          {item.prodi ? item.prodi.kode : '-'}
                        </TableCell>
                        <TableCell>{item.angkatan}</TableCell>
                        <TableCell className="text-sm">
                          {item.dosenWali ? item.dosenWali.namaLengkap : '-'}
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
                              {item.status === 'AKTIF' && (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivate(item.id, item.namaLengkap)}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Nonaktifkan
                                </DropdownMenuItem>
                              )}
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