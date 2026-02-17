/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, Eye, Edit, Trash2, Calendar, Clock, Users, MapPin, BookOpen } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

// ============================================
// CONSTANTS
// ============================================
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ============================================
// HELPER FUNCTIONS
// ============================================
const filterKelas = (kelasList: KelasMK[], search: string): KelasMK[] => {
  if (!search) return kelasList;
  const searchLower = search.toLowerCase();
  return kelasList.filter(
    (kelas) =>
      kelas.mataKuliah?.namaMK.toLowerCase().includes(searchLower) ||
      kelas.mataKuliah?.kodeMK.toLowerCase().includes(searchLower) ||
      kelas.dosen?.namaLengkap.toLowerCase().includes(searchLower)
  );
};

const calculateStats = (kelasList: KelasMK[]) => ({
  total: kelasList.length,
  senin: kelasList.filter((k) => k.hari === 'Senin').length,
  totalMahasiswa: kelasList.reduce((sum, k) => sum + (k._count?.krsDetail || 0), 0),
  uniqueDosen: new Set(kelasList.map((k) => k.dosenId)).size,
});

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
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ value, label, color }: { value: number; label: string; color?: string }) => (
  <Card className={color || 'bg-muted/50'}>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default function KelasMKListPage() {
  const router = useRouter();

  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSemesterLoading, setIsSemesterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    semester_id: 'ALL',
    hari: 'ALL',
  });

  // ============================================
  // FETCH SEMESTER LIST
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setIsSemesterLoading(true);
        const response = await semesterAPI.getAll();

        if (response.success && response.data) {
          setSemesterList(response.data);
          
          const activeSemester = response.data.find((s) => s.isActive);
          if (activeSemester) {
            setFilters((prev) => ({ ...prev, semester_id: activeSemester.id.toString() }));
          }
        }
      } catch (err) {
        console.error('Fetch semesters error:', err);
      } finally {
        setIsSemesterLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH KELAS MK DATA
  // ============================================
  const fetchKelasMK = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      
      if (filters.semester_id !== 'ALL') {
        params.semester_id = parseInt(filters.semester_id);
      }
      
      if (filters.hari !== 'ALL') {
        params.hari = filters.hari;
      }

      const response = await kelasMKAPI.getAll(params);

      if (response.success) {
        setKelasList(response.data || []);
      } else {
        setError(response.message || 'Gagal memuat data kelas');
      }
    } catch (err: any) {
      console.error('Fetch kelas MK error:', err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [filters.semester_id, filters.hari]);

  useEffect(() => {
    if (!isSemesterLoading) {
      fetchKelasMK();
    }
  }, [fetchKelasMK, isSemesterLoading]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const filteredKelas = useMemo(
    () => filterKelas(kelasList, filters.search),
    [kelasList, filters.search]
  );

  const stats = useMemo(() => calculateStats(filteredKelas), [filteredKelas]);

  const semesterName = useMemo(() => {
    const activeSemester = semesterList.find(
      (s) => s.id.toString() === filters.semester_id
    );
    return activeSemester
      ? `${activeSemester.tahunAkademik} ${activeSemester.periode}`
      : 'Semua Semester';
  }, [semesterList, filters.semester_id]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleView = useCallback((id: number) => {
    router.push(`/admin/kelas-mk/${id}`);
  }, [router]);

  const handleEdit = useCallback((id: number) => {
    router.push(`/admin/kelas-mk/${id}/edit`);
  }, [router]);

  const handleDelete = useCallback(async (id: number, namaMK: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${namaMK}"?`)) {
      return;
    }

    try {
      const response = await kelasMKAPI.delete(id);

      if (response.success) {
        toast.success('Kelas berhasil dihapus');
        fetchKelasMK();
      } else {
        toast.error(response.message || 'Gagal menghapus kelas');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    }
  }, [fetchKelasMK]);

  const handleCreate = useCallback(() => {
    router.push('/admin/kelas-mk/tambah');
  }, [router]);

  const handleExport = useCallback(async () => {
    try {
      const response = await kelasMKAPI.exportToExcel({
        semester_id: filters.semester_id !== 'ALL' ? parseInt(filters.semester_id) : undefined,
        hari: filters.hari !== 'ALL' ? filters.hari : undefined,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(response, `KelasMK_${timestamp}.xlsx`);
      
      toast.success('Data Kelas MK berhasil di-export');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Gagal export data Kelas MK');
    }
  }, [filters.semester_id, filters.hari]);

  const handleRetry = useCallback(() => {
    fetchKelasMK();
  }, [fetchKelasMK]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && kelasList.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && kelasList.length === 0) {
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
        title="Kelas Mata Kuliah"
        description={`Kelola kelas mata kuliah - ${semesterName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Kelas MK' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Kelas
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Cari Kelas</label>
              <Input
                placeholder="Nama MK, Kode, Dosen..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select
                value={filters.semester_id}
                onValueChange={(value) => handleFilterChange('semester_id', value)}
                disabled={isSemesterLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Semester</SelectItem>
                  {semesterList.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id.toString()}>
                      {sem.tahunAkademik} {sem.periode}
                      {sem.isActive && ' (Aktif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Hari</label>
              <Select
                value={filters.hari}
                onValueChange={(value) => handleFilterChange('hari', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Hari</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard value={stats.total} label="Total Kelas" color="bg-blue-50 border-blue-200" />
        <StatCard value={stats.senin} label="Kelas Senin" color="bg-green-50 border-green-200" />
        <StatCard value={stats.totalMahasiswa} label="Total Mahasiswa" color="bg-purple-50 border-purple-200" />
        <StatCard value={stats.uniqueDosen} label="Dosen Mengajar" color="bg-orange-50 border-orange-200" />
      </div>

      {/* Table View */}
      {filteredKelas.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="Tidak ada kelas"
              description="Tidak ada kelas yang sesuai dengan filter yang dipilih"
              action={{
                label: 'Tambah Kelas',
                onClick: handleCreate,
                icon: Plus,
              }}
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-center">Mahasiswa</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKelas.map((kelas, index) => (
                    <TableRow
                      key={kelas.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleView(kelas.id)}
                    >
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{kelas.mataKuliah?.namaMK || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {kelas.mataKuliah?.kodeMK || '-'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {kelas.mataKuliah?.sks || 0}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm line-clamp-1">
                            {kelas.dosen?.namaLengkap || 'N/A'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{kelas.hari}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{kelas.jamMulai} - {kelas.jamSelesai}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{kelas.ruangan?.nama || '-'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-sm">
                            {kelas._count?.krsDetail || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {kelas.kuotaMax}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(kelas.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(kelas.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(kelas.id, kelas.mataKuliah?.namaMK || 'N/A');
                            }}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
