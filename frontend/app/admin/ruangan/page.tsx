/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { ruanganAPI } from '@/lib/api';

export default function RuanganListPage() {
  const router = useRouter();

  const [ruangan, setRuangan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    ruanganId: number | null;
    ruanganNama: string;
  }>({
    open: false,
    ruanganId: null,
    ruanganNama: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRuangan = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 10,
        sortBy: 'nama',
        sortOrder: 'asc',
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filterActive !== 'all') {
        params.isActive = filterActive;
      }

      const response = await ruanganAPI.getAll(params);

      if (response.success && response.data) {
        setRuangan(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response.message || 'Gagal memuat data ruangan');
      }
    } catch (err: any) {
      console.error('Fetch ruangan error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, filterActive]);

  useEffect(() => {
    fetchRuangan();
  }, [fetchRuangan]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterActive(value);
    setPage(1);
  };

  const handleDeleteClick = (ruangan: any) => {
    setDeleteDialog({
      open: true,
      ruanganId: ruangan.id,
      ruanganNama: ruangan.nama,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.ruanganId) return;

    try {
      setIsDeleting(true);

      const response = await ruanganAPI.delete(deleteDialog.ruanganId);

      if (response.success) {
        toast.success('Ruangan berhasil dihapus');
        fetchRuangan();
        setDeleteDialog({ open: false, ruanganId: null, ruanganNama: '' });
      } else {
        toast.error(response.message || 'Gagal menghapus ruangan', {
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Delete error:', err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus ruangan';

      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/ruangan/tambah');
  };

  const handleDetail = (id: number) => {
    router.push(`/admin/ruangan/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/ruangan/${id}/edit`);
  };

  const handleRetry = () => {
    fetchRuangan();
  };

  if (isLoading && ruangan.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data ruangan..." />
      </div>
    );
  }

  if (error && ruangan.length === 0) {
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
        title="Kelola Ruangan"
        description="Manajemen ruangan kelas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Ruangan' },
        ]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Ruangan
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari ruangan..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterActive} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {ruangan.length === 0 ? (
        <EmptyState
          title="Belum ada ruangan"
          description="Mulai dengan menambahkan ruangan kelas pertama"
          action={{
            label: 'Tambah Ruangan',
            onClick: handleCreate,
            icon: Plus,
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Ruangan</TableHead>
                    <TableHead className="text-center">Kapasitas</TableHead>
                    <TableHead className="text-center">Jumlah Kelas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruangan.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.kapasitas || 30}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item._count?.kelasMataKuliah || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={item.isActive ? 'default' : 'secondary'}
                        >
                          {item.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDetail(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ruangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ruangan{' '}
              <span className="font-semibold">{deleteDialog.ruanganNama}</span>?
              <br />
              <span className="text-red-600">
                Ruangan yang masih digunakan kelas aktif tidak dapat dihapus.
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