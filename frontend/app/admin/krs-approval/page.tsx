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
import { CheckSquare, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { krsAPI, semesterAPI } from '@/lib/api';
import { KRS, Semester, KRSStatus } from '@/types/model';

export default function KRSApprovalListPage() {
  const router = useRouter();

  // STATE
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KRSStatus | 'ALL'>('SUBMITTED');
  const [semesterFilter, setSemesterFilter] = useState<string>('ACTIVE');

  // ✅ PAGINATION STATE
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const limit = 50;

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

  // ✅ RESET PAGE when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, semesterFilter]);

  // FETCH KRS LIST
  useEffect(() => {
    const fetchKRS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine semester ID
        let semesterId: number | undefined;
        if (semesterFilter === 'ACTIVE') {
          const activeSemester = semesterList.find((s) => s.isActive);
          semesterId = activeSemester?.id;
        } else if (semesterFilter !== 'ALL') {
          semesterId = parseInt(semesterFilter);
        }

        // Determine status
        const status = statusFilter === 'ALL' ? undefined : statusFilter;

        // ✅ FIXED: Send pagination parameters
        const response = await krsAPI.getAll({
          page,
          limit,
          semesterId: semesterId,
          status,
        });

        if (response.success && response.data) {
          setKrsList(response.data);
          
          // ✅ Set pagination info
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
      mahasiswa?.nim.includes(search)
    );
  });

  // STATS
  const pendingCount = filteredKRS.filter((krs) => krs.status === 'SUBMITTED').length;
  const approvedCount = filteredKRS.filter((krs) => krs.status === 'APPROVED').length;
  const rejectedCount = filteredKRS.filter((krs) => krs.status === 'REJECTED').length;

  // HANDLERS
  const handleReview = (id: number) => {
    router.push(`/dosen/krs-approval/${id}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ✅ PAGINATION HANDLERS
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // LOADING STATE
  if (isLoading || isLoadingSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat daftar KRS..." />
      </div>
    );
  }

  // ERROR STATE
  if (error) {
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
      <PageHeader
        title="Approval KRS"
        description="Review dan setujui KRS mahasiswa bimbingan"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Approval KRS' },
        ]}
      />

      {/* Alert for pending KRS */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                Ada {pendingCount} KRS menunggu approval dari Anda
              </p>
              <p className="text-sm text-yellow-700">
                Segera review dan berikan approval untuk KRS mahasiswa bimbingan Anda
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
              placeholder="Cari berdasarkan nama atau NIM..."
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
                <SelectItem value="SUBMITTED">Menunggu Approval</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
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
              icon={CheckSquare}
              title={search ? 'Tidak Ditemukan' : 'Tidak Ada KRS'}
              description={
                search
                  ? 'Tidak ada KRS yang sesuai dengan pencarian'
                  : 'Tidak ada KRS yang sesuai dengan filter'
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
                      <TableHead>Semester</TableHead>
                      <TableHead>Total SKS</TableHead>
                      <TableHead>Tanggal Submit</TableHead>
                      <TableHead>Status</TableHead>
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
                          {krs.semester?.tahunAkademik || '-'} -{' '}
                          {krs.semester?.periode || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{krs.totalSKS}</span> SKS
                        </TableCell>
                        <TableCell>
                          {krs.tanggalSubmit
                            ? format(new Date(krs.tanggalSubmit), 'dd MMM yyyy', {
                                locale: id,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={krs.status} showIcon />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={
                              krs.status === 'SUBMITTED' ? 'default' : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleReview(krs.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {krs.status === 'SUBMITTED' ? 'Review' : 'Detail'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ PAGINATION CONTROLS */}
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
              <p className="text-sm text-muted-foreground">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}