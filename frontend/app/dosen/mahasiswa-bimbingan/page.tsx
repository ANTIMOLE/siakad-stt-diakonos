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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, MahasiswaStatus } from '@/types/model';

// Extended type with KRS info (backend might return this)
interface MahasiswaWithKRS extends Mahasiswa {
  currentKRSStatus?: string | null;
  semester?: number; // Current semester calculation
}

export default function MahasiswaBimbinganPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaWithKRS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<MahasiswaStatus | 'ALL'>('ALL');

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Backend akan auto filter by dosenWaliId dari JWT token
        const response = await mahasiswaAPI.getAll({
          search: search || undefined,
          angkatan: angkatanFilter !== 'ALL' ? parseInt(angkatanFilter) : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          limit: 100, // Get all bimbingan students
        });

        if (response.success && response.data) {
          // Calculate current semester for each mahasiswa
          const currentYear = new Date().getFullYear();
          const mahasiswaWithSemester = response.data.map(mhs => ({
            ...mhs,
            semester: currentYear - mhs.angkatan + 1,
          }));
          
          setMahasiswaList(mahasiswaWithSemester);
        } else {
          setError(response.message || 'Gagal memuat daftar mahasiswa');
        }
      } catch (err: any) {
        console.error('Fetch mahasiswa error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data mahasiswa'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMahasiswa();
  }, [search, angkatanFilter, statusFilter]);

  // ============================================
  // GET UNIQUE ANGKATAN
  // ============================================
  const angkatanList = Array.from(
    new Set(mahasiswaList.map(mhs => mhs.angkatan))
  ).sort((a, b) => b - a);

  // ============================================
  // STATS
  // ============================================
  const totalMahasiswa = mahasiswaList.length;
  const mahasiswaAktif = mahasiswaList.filter(mhs => mhs.status === 'AKTIF').length;
  const krsPending = mahasiswaList.filter(
    mhs => mhs.currentKRSStatus === 'SUBMITTED'
  ).length;

  // ============================================
  // HANDLERS
  // ============================================
  const handleView = (id: number) => {
    router.push(`/dosen/mahasiswa-bimbingan/${id}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat daftar mahasiswa..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
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
        title="Mahasiswa Bimbingan"
        description="Daftar mahasiswa yang Anda bimbing"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Mahasiswa Bimbingan' },
        ]}
      />

      {/* Alert for pending KRS */}
      {krsPending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                Ada {krsPending} KRS menunggu approval dari Anda
              </p>
              <p className="text-sm text-yellow-700">
                <Button
                  variant="link"
                  className="h-auto p-0 text-yellow-700 underline"
                  onClick={() => router.push('/dosen/krs-approval')}
                >
                  Klik di sini untuk review KRS
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
                <p className="text-2xl font-bold">{totalMahasiswa}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mahasiswa Aktif</p>
                <p className="text-2xl font-bold">{mahasiswaAktif}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KRS Pending</p>
                <p className="text-2xl font-bold">{krsPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              placeholder="Cari berdasarkan nama atau NIM..."
              onSearch={setSearch}
              defaultValue={search}
            />

            <Select value={angkatanFilter} onValueChange={setAngkatanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Angkatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Angkatan</SelectItem>
                {angkatanList.map(angkatan => (
                  <SelectItem key={angkatan} value={angkatan.toString()}>
                    Angkatan {angkatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as MahasiswaStatus | 'ALL')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="CUTI">Cuti</SelectItem>
                <SelectItem value="NON_AKTIF">Non-Aktif</SelectItem>
                <SelectItem value="LULUS">Lulus</SelectItem>
                <SelectItem value="DO">DO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {mahasiswaList.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'Tidak Ditemukan' : 'Tidak Ada Mahasiswa Bimbingan'}
              description={
                search
                  ? 'Tidak ada mahasiswa yang sesuai dengan pencarian'
                  : 'Anda belum memiliki mahasiswa bimbingan'
              }
              className="my-8 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead>Angkatan</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KRS Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mahasiswaList.map((mhs) => (
                    <TableRow key={mhs.id}>
                      <TableCell className="font-mono font-medium">
                        {mhs.nim}
                      </TableCell>
                      <TableCell className="font-medium">
                        {mhs.namaLengkap}
                      </TableCell>
                      <TableCell>{mhs.prodi?.nama || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mhs.angkatan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Semester {mhs.semester}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={mhs.status} showIcon />
                      </TableCell>
                      <TableCell>
                        {mhs.currentKRSStatus ? (
                          <StatusBadge status={mhs.currentKRSStatus} showIcon />
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(mhs.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution by Angkatan */}
      {mahasiswaList.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-4">Distribusi per Angkatan</h3>
            <div className="grid gap-4 md:grid-cols-4">
              {angkatanList.map(angkatan => {
                const count = mahasiswaList.filter(
                  mhs => mhs.angkatan === angkatan
                ).length;
                return (
                  <div
                    key={angkatan}
                    className="rounded-lg border p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setAngkatanFilter(angkatan.toString())}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      Angkatan {angkatan}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
