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
import { Eye, Users } from 'lucide-react';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, MahasiswaStatus } from '@/types/model';
import { useAuth } from '@/hooks/useAuth';

interface MahasiswaWithKRS extends Mahasiswa {
  semester?: number;
}

export default function MahasiswaBimbinganPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth('DOSEN');

  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaWithKRS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<MahasiswaStatus | 'ALL'>('ALL');

  useEffect(() => {
    const fetchMahasiswa = async () => {
      if (isAuthLoading || !user?.dosen?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await mahasiswaAPI.getAll({
          search: search || undefined,
          angkatan: angkatanFilter !== 'ALL' ? parseInt(angkatanFilter) : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          dosenWaliId: user.dosen.id,
          limit: 100,
        });

        if (response.success && response.data) {
          const currentYear = new Date().getFullYear();
          const withSemester = response.data.map(mhs => ({
            ...mhs,
            semester: currentYear - mhs.angkatan + 1,
          }));
          setMahasiswaList(withSemester);
        } else {
          setError(response.message || 'Gagal memuat data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.dosen?.id) fetchMahasiswa();
  }, [search, angkatanFilter, statusFilter, isAuthLoading, user]);

  const angkatanList = Array.from(new Set(mahasiswaList.map(m => m.angkatan))).sort((a, b) => b - a);

  const totalMahasiswa = mahasiswaList.length;
  const mahasiswaAktif = mahasiswaList.filter(m => m.status === 'AKTIF').length;

  const handleView = (id: number) => router.push(`/dosen/mahasiswa-bimbingan/${id}`);
  const handleRetry = () => window.location.reload();

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat daftar mahasiswa..." />
      </div>
    );
  }

  if (!user?.dosen?.id) {
    return <ErrorState title="Data Dosen Tidak Ditemukan" message="Data dosen tidak tersedia." onRetry={handleRetry} />;
  }

  if (error && mahasiswaList.length === 0) {
    return <ErrorState title="Gagal Memuat Data" message={error} onRetry={handleRetry} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mahasiswa Bimbingan"
        description={`Mahasiswa yang dibimbing oleh ${user.dosen.namaLengkap}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Mahasiswa Bimbingan' },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
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
                {angkatanList.map(a => (
                  <SelectItem key={a} value={a.toString()}>
                    Angkatan {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as MahasiswaStatus | 'ALL')}>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {mahasiswaList.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'Tidak Ditemukan' : 'Tidak Ada Mahasiswa Bimbingan'}
              description={search ? 'Tidak ada mahasiswa yang sesuai' : 'Anda belum memiliki mahasiswa bimbingan'}
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
                    <TableHead className="text-right w-[130px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mahasiswaList.map(mhs => (
                    <TableRow key={mhs.id}>
                      <TableCell className="font-mono font-medium">{mhs.nim}</TableCell>
                      <TableCell className="font-medium">{mhs.namaLengkap}</TableCell>
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
                      <TableCell className="text-right w-[130px]">
                        <Button variant="ghost" size="sm" onClick={() => handleView(mhs.id)}>
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

      {/* Distribusi per Angkatan */}
      {mahasiswaList.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-4">Distribusi per Angkatan</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {angkatanList.map(angkatan => {
                const count = mahasiswaList.filter(m => m.angkatan === angkatan).length;
                return (
                  <div
                    key={angkatan}
                    className="rounded-lg border p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setAngkatanFilter(angkatan.toString())}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">Angkatan {angkatan}</p>
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