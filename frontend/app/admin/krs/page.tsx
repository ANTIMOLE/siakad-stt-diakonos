/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { FileText, Plus, Download, Eye, Edit, Trash2, AlertCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { krsAPI, semesterAPI } from '@/lib/api';
import { KRS, Semester, KRSStatus } from '@/types/model';

export default function AdminKRSListPage() {
  const router = useRouter();

  // STATE
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KRSStatus | 'ALL'>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ACTIVE');

  // PAGINATION STATE
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const limit = 50;

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    krsId: number | null;
    mahasiswaNama: string;
  }>({
    open: false,
    krsId: null,
    mahasiswaNama: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // FETCH SEMESTER LIST
  useEffect(() => {
    const fetchSemester = async () => {
      try {
        setIsLoadingSemester(true);
        const response = await semesterAPI.getAll();

        if (response.success && response.data) {
          setSemesterList(response.data);
        }
      } catch (err: any) {
        console.error('Fetch semester error:', err);
        toast.error('Gagal memuat daftar semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemester();
  }, []);

  // FETCH KRS LIST
  const fetchKRS = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let semesterId: number | undefined;
      if (semesterFilter === 'ACTIVE') {
        const activeSemester = semesterList.find((s) => s.isActive);
        semesterId = activeSemester?.id;
      } else if (semesterFilter !== 'ALL') {
        semesterId = parseInt(semesterFilter);
      }

      const status = statusFilter === 'ALL' ? undefined : statusFilter;

      const response = await krsAPI.getAll({
        page,
        limit,
        semesterId: semesterId,
        status,
      });

      if (response.success && response.data) {
        setKrsList(response.data);
        
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalData(response.pagination.total || 0);
        }
      } else {
        setError(response.message || 'Gagal memuat daftar KRS');
      }
    } catch (err: any) {
      console.error('Fetch KRS error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data KRS'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, semesterFilter]);

  useEffect(() => {
    if (!isLoadingSemester) {
      fetchKRS();
    }
  }, [page, statusFilter, semesterFilter, semesterList, isLoadingSemester]);

  // FILTER KRS BY SEARCH (client-side)
  const filteredKRS = krsList.filter((krs) => {
    if (search === '') return true;
    const mahasiswa = krs.mahasiswa;
    return (
      mahasiswa?.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      mahasiswa?.nim.includes(search) ||
      mahasiswa?.prodi?.nama.toLowerCase().includes(search.toLowerCase())
    );
  });

  // STATS (from filtered data)
  const draftCount = filteredKRS.filter((krs) => krs.status === 'DRAFT').length;
  const submittedCount = filteredKRS.filter(
    (krs) => krs.status === 'SUBMITTED'
  ).length;
  const approvedCount = filteredKRS.filter(
    (krs) => krs.status === 'APPROVED'
  ).length;
  const rejectedCount = filteredKRS.filter(
    (krs) => krs.status === 'REJECTED'
  ).length;

  // HANDLERS
  const handleAssignNew = () => {
    router.push('/admin/krs/tambah'); 
  };

  const handleView = (id: number) => {
    router.push(`/admin/krs/${id}`); 
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/krs/${id}/edit`); 
  };

  const handleSubmit = async (id: number) => {
    try {
      const response = await krsAPI.submit(id);

      if (response.success) {
        toast.success('KRS berhasil disubmit untuk approval');
        fetchKRS();
      } else {
        toast.error(response.message || 'Gagal submit KRS');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat submit KRS'
      );
    }
  };

  const handleDeleteClick = (krs: KRS) => {
    setDeleteDialog({
      open: true,
      krsId: krs.id,
      mahasiswaNama: krs.mahasiswa?.namaLengkap || 'Mahasiswa',
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.krsId) return;

    try {
      setIsDeleting(true);

      const response = await krsAPI.delete(deleteDialog.krsId);

      if (response.success) {
        toast.success('KRS berhasil dihapus');
        fetchKRS();
        setDeleteDialog({ open: false, krsId: null, mahasiswaNama: '' });
      } else {
        toast.error(response.message || 'Gagal menghapus KRS');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menghapus KRS'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = () => {
    fetchKRS();
  };

  // ✅ EXPORT HANDLER
  const handleExport = async () => {
    try {
      let semesterId: number | undefined;
      if (semesterFilter === 'ACTIVE') {
        const activeSemester = semesterList.find((s) => s.isActive);
        semesterId = activeSemester?.id;
      } else if (semesterFilter !== 'ALL') {
        semesterId = parseInt(semesterFilter);
      }

      const response = await krsAPI.exportToExcel({
        semesterId: semesterId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `KRS_${timestamp}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data KRS berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data KRS');
    }
  };

  // PAGINATION HANDLERS
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  if (isLoading && isLoadingSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat daftar KRS..." />
      </div>
    );
  }

  if (error) {
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
        title="Manajemen KRS"
        description="Kelola KRS mahasiswa untuk setiap semester"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'KRS' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleAssignNew}>
              <Plus className="mr-2 h-4 w-4" />
              Assign KRS Baru
            </Button>
          </>
        }
      />

      {/* Alert for DRAFT */}
      {draftCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Ada {draftCount} KRS dalam status DRAFT
              </p>
              <p className="text-sm text-blue-700">
                KRS dengan status DRAFT belum disubmit untuk approval dosen
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert for REJECTED */}
      {rejectedCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">
                Ada {rejectedCount} KRS yang DITOLAK
              </p>
              <p className="text-sm text-red-700">
                KRS yang ditolak perlu diedit dan disubmit ulang
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              placeholder="Cari berdasarkan nama, NIM, atau prodi..."
              onSearch={setSearch}
              defaultValue={search}
            />

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as KRSStatus | 'ALL')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Semester Aktif</SelectItem>
                <SelectItem value="ALL">Semua Semester</SelectItem>
                {semesterList.map((sem) => (
                  <SelectItem key={sem.id} value={sem.id.toString()}>
                    {sem.tahunAkademik} - {sem.periode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {filteredKRS.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={search ? 'Tidak Ditemukan' : 'Belum Ada KRS'}
              description={
                search
                  ? 'Tidak ada KRS yang sesuai dengan pencarian'
                  : 'Belum ada KRS yang dibuat. Klik tombol "Assign KRS Baru" untuk memulai.'
              }
              action={
                !search
                  ? {
                      label: 'Assign KRS Baru',
                      onClick: handleAssignNew,
                      icon: Plus,
                    }
                  : undefined
              }
              className="my-8 border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIM</TableHead>
                      <TableHead>Nama Mahasiswa</TableHead>
                      <TableHead>Prodi</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Total SKS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKRS.map((krs) => (
                      <TableRow key={krs.id}>
                        <TableCell className="font-mono font-medium">
                          {krs.mahasiswa?.nim || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {krs.mahasiswa?.namaLengkap || '-'}
                        </TableCell>
                        <TableCell>
                          {krs.mahasiswa?.prodi?.nama || '-'}
                        </TableCell>
                        <TableCell>
                          {krs.semester?.tahunAkademik || '-'} -{' '}
                          {krs.semester?.periode || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{krs.totalSKS}</span> SKS
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={krs.status} showIcon />
                        </TableCell>
                        <TableCell>
                          {format(new Date(krs.createdAt), 'dd MMM yyyy', {
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* DRAFT - Edit, Submit, Delete */}
                            {krs.status === 'DRAFT' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(krs.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSubmit(krs.id)}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Submit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(krs)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </Button>
                              </>
                            )}

                            {/* REJECTED - Edit, Submit lagi */}
                            {krs.status === 'REJECTED' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(krs.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSubmit(krs.id)}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Submit Ulang
                                </Button>
                              </>
                            )}

                            {/* SUBMITTED/APPROVED - View only */}
                            {(krs.status === 'SUBMITTED' || krs.status === 'APPROVED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(krs.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, totalData)} dari {totalData} KRS
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Halaman {page} dari {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total KRS</p>
              <p className="text-2xl font-bold">{totalData}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold text-yellow-600">
                {submittedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus KRS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus KRS untuk{' '}
              <span className="font-semibold">{deleteDialog.mahasiswaNama}</span>?
              <br />
              <span className="text-red-600">
                Aksi ini tidak dapat dibatalkan.
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