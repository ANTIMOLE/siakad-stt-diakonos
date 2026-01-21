'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit, Trash2, Calendar, Clock, Users, MapPin } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

export default function KelasMKListPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
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
          
          // Auto-select active semester
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
      if (filters.semester_id !== 'ALL') params.semester_id = parseInt(filters.semester_id);
      if (filters.hari !== 'ALL') params.hari = filters.hari;

      const response = await kelasMKAPI.getAll(params);

      if (response.success) {
        let data = response.data || [];

        // Client-side search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          data = data.filter(
            (kelas) =>
              kelas.mataKuliah?.namaMK.toLowerCase().includes(searchLower) ||
              kelas.mataKuliah?.kodeMK.toLowerCase().includes(searchLower) ||
              kelas.dosen?.namaLengkap.toLowerCase().includes(searchLower)
          );
        }

        setKelasList(data);
      } else {
        setError(response.message || 'Gagal memuat data kelas');
      }
    } catch (err: any) {
      console.error('Fetch kelas MK error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data kelas'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters.semester_id, filters.hari, filters.search]);

  useEffect(() => {
    if (!isSemesterLoading) {
      fetchKelasMK();
    }
  }, [fetchKelasMK, isSemesterLoading]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleView = (id: number) => {
    router.push(`/admin/kelas-mk/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/kelas-mk/${id}/edit`);
  };

  const handleDelete = async (id: number, namaMK: string) => {
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
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menghapus kelas'
      );
    }
  };

  const handleCreate = () => {
    router.push('/admin/kelas-mk/tambah');
  };

  const handleRetry = () => {
    fetchKelasMK();
  };

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

  // Get active semester name
  const activeSemester = semesterList.find(
    (s) => s.id.toString() === filters.semester_id
  );
  const semesterName = activeSemester
    ? `${activeSemester.tahunAkademik} ${activeSemester.periode}`
    : 'Semua Semester';

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
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Kelas
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cari Kelas</label>
              <Input
                placeholder="Nama MK, Kode, Dosen..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Filter Semester */}
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

            {/* Filter Hari */}
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
                  <SelectItem value="Senin">Senin</SelectItem>
                  <SelectItem value="Selasa">Selasa</SelectItem>
                  <SelectItem value="Rabu">Rabu</SelectItem>
                  <SelectItem value="Kamis">Kamis</SelectItem>
                  <SelectItem value="Jumat">Jumat</SelectItem>
                  <SelectItem value="Sabtu">Sabtu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{kelasList.length}</div>
            <p className="text-xs text-muted-foreground">Total Kelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {kelasList.filter((k) => k.hari === 'Senin').length}
            </div>
            <p className="text-xs text-muted-foreground">Kelas Senin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {kelasList.reduce((sum, k) => sum + (k._count?.krsDetail || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Mahasiswa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {new Set(kelasList.map((k) => k.dosenId)).size}
            </div>
            <p className="text-xs text-muted-foreground">Dosen Mengajar</p>
          </CardContent>
        </Card>
      </div>

      {/* Kelas Cards */}
      {kelasList.length === 0 ? (
        <EmptyState
          title="Tidak ada kelas"
          description="Tidak ada kelas yang sesuai dengan filter yang dipilih"
          action={{
            label: 'Tambah Kelas',
            onClick: handleCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => (
            <Card key={kelas.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {kelas.mataKuliah?.namaMK || 'N/A'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {kelas.mataKuliah?.kodeMK || 'N/A'}
                    </p>
                  </div>
                  <Badge>{kelas.mataKuliah?.sks || 0} SKS</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dosen */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-1">
                    {kelas.dosen?.namaLengkap || 'N/A'}
                  </span>
                </div>

                {/* Jadwal */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{kelas.hari}</span>
                </div>

                {/* Waktu */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {kelas.jamMulai} - {kelas.jamSelesai}
                  </span>
                </div>

                {/* Ruangan */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{kelas.ruangan?.nama || 'N/A'}</span>
                </div>

                {/* Kuota */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mahasiswa:</span>
                    <span className="font-medium">
                      {kelas._count?.krsDetail || 0} / {kelas.kuotaMax}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(kelas.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(kelas.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() =>
                      handleDelete(kelas.id, kelas.mataKuliah?.namaMK || 'N/A')
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
