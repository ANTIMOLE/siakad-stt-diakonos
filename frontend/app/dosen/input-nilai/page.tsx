'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
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
import { Badge } from '@/components/ui/badge';
import { FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

// ============================================
// EXTENDED TYPE - Backend might return this
// ============================================
interface KelasMKWithNilai extends KelasMK {
  isNilaiFinalized?: boolean;
}

export default function InputNilaiPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [kelasList, setKelasList] = useState<KelasMKWithNilai[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoadingKelas, setIsLoadingKelas] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ACTIVE');

  // ============================================
  // FETCH SEMESTER LIST
  // ============================================
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

  // ============================================
  // FETCH KELAS LIST (by current dosen)
  // ============================================
  useEffect(() => {
    const fetchKelas = async () => {
      try {
        setIsLoadingKelas(true);
        setError(null);

        // Get active semester or selected semester
        let semesterId: number | undefined;
        
        if (semesterFilter === 'ACTIVE') {
          const activeSemester = semesterList.find(s => s.isActive);
          semesterId = activeSemester?.id;
        } else if (semesterFilter !== 'ALL') {
          semesterId = parseInt(semesterFilter);
        }

        // Backend akan auto filter by dosen yang login dari JWT token
        const response = await kelasMKAPI.getAll({
          semester_id: semesterId,
        });

        if (response.success && response.data) {
          setKelasList(response.data);
        } else {
          setError(response.message || 'Gagal memuat daftar kelas');
        }
      } catch (err: any) {
        console.error('Fetch kelas error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data kelas'
        );
      } finally {
        setIsLoadingKelas(false);
      }
    };

    // Only fetch if semester list is loaded
    if (!isLoadingSemester) {
      fetchKelas();
    }
  }, [semesterFilter, semesterList, isLoadingSemester]);

  // ============================================
  // FILTER KELAS BY SEARCH
  // ============================================
  const filteredKelas = kelasList.filter((kelas) =>
    kelas.mataKuliah?.namaMK.toLowerCase().includes(search.toLowerCase())
  );

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputNilai = (kelasId: number) => {
    router.push(`/dosen/input-nilai/${kelasId}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoadingKelas || isLoadingSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
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
  // GET ACTIVE SEMESTER INFO
  // ============================================
  const activeSemester = semesterList.find(s => s.isActive);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Nilai Mahasiswa"
        description="Pilih kelas untuk input atau edit nilai mahasiswa"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Input Nilai' },
        ]}
      />

      {/* Active Semester Info */}
      {activeSemester && semesterFilter === 'ACTIVE' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-primary">
              Semester Aktif: {activeSemester.tahunAkademik}{' '}
              {activeSemester.periode}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(activeSemester.tanggalMulai).toLocaleDateString('id-ID')} -{' '}
              {new Date(activeSemester.tanggalSelesai).toLocaleDateString('id-ID')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <SearchBar
              placeholder="Cari mata kuliah..."
              onSearch={setSearch}
              defaultValue={search}
            />
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{kelasList.length}</div>
            <p className="text-xs text-muted-foreground">Total Kelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {kelasList.filter(k => k.isNilaiFinalized).length}
            </div>
            <p className="text-xs text-muted-foreground">Nilai Finalized</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {kelasList.filter(k => !k.isNilaiFinalized).length}
            </div>
            <p className="text-xs text-muted-foreground">Belum Finalized</p>
          </CardContent>
        </Card>
      </div>

      {/* Kelas List */}
      <Card>
        <CardContent className="p-0">
          {filteredKelas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={search ? 'Tidak Ditemukan' : 'Tidak Ada Kelas'}
              description={
                search
                  ? 'Tidak ada kelas yang sesuai dengan pencarian'
                  : 'Anda belum mengampu kelas pada semester ini'
              }
              className="my-8 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKelas.map((kelas) => (
                    <TableRow key={kelas.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {kelas.mataKuliah?.namaMK || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {kelas.mataKuliah?.kodeMK || '-'} •{' '}
                            {kelas.mataKuliah?.sks || 0} SKS
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{kelas.hari}</p>
                          <p className="text-muted-foreground">
                            {kelas.jamMulai} - {kelas.jamSelesai}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{kelas.ruangan?.nama || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {kelas._count?.krsDetail || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {kelas.isNilaiFinalized ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Finalized
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleInputNilai(kelas.id)}
                        >
                          {kelas.isNilaiFinalized ? 'Lihat Nilai' : 'Input Nilai'}
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
    </div>
  );
}
