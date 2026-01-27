/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// CONSTANTS
// ============================================
const HARI_OPTIONS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
] as const;

const HARI_ORDER: Record<string, number> = HARI_OPTIONS.reduce(
  (acc, item, index) => {
    acc[item.value] = index;
    return acc;
  },
  {} as Record<string, number>
);

interface JadwalGroup {
  hari: string;
  jadwal: KelasMK[];
}

export default function JadwalDosenPage() {
  // ============================================
  // AUTH
  // ============================================
  const { user, isLoading: isAuthLoading } = useAuth('DOSEN');

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [jadwalList, setJadwalList] = useState<KelasMK[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  // FETCH JADWAL (FILTERED BY DOSEN)
  // ============================================
  useEffect(() => {
    const fetchJadwal = async () => {
      // ✅ WAIT FOR AUTH & USER DATA
      if (isAuthLoading) {
        return;
      }

      // ✅ CHECK IF DOSEN DATA EXISTS
      if (!user?.dosen?.id) {
        setError('Data dosen tidak ditemukan');
        setIsLoading(false);
        return;
      }

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

        // ✅ FETCH ONLY FOR THIS DOSEN
        const response = await kelasMKAPI.getAll({
          semester_id: semesterId,
          dosenId: user.dosen.id,
        });

        if (response.success && response.data) {
          setJadwalList(response.data);
        } else {
          setError(response.message || 'Gagal memuat jadwal');
        }
      } catch (err: any) {
        console.error('Fetch jadwal error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat jadwal'
        );
      } finally {
        setIsLoading(false);
      }
    };

    // ✅ ONLY FETCH WHEN ALL DEPENDENCIES ARE READY
    if (!isLoadingSemester && !isAuthLoading && user?.dosen?.id) {
      fetchJadwal();
    }
  }, [semesterFilter, semesterList, isLoadingSemester, isAuthLoading, user]);

  // ============================================
  // SORT & GROUP JADWAL
  // ============================================
  const sortedJadwal = [...jadwalList].sort((a, b) => {
    const hariCompare = HARI_ORDER[a.hari] - HARI_ORDER[b.hari];
    if (hariCompare !== 0) return hariCompare;
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  const jadwalByHari: JadwalGroup[] = HARI_OPTIONS.map((hari) => ({
    hari: hari.value,
    jadwal: sortedJadwal.filter((j) => j.hari === hari.value),
  })).filter((group) => group.jadwal.length > 0);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isAuthLoading || isLoadingSemester || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat jadwal mengajar..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE - NO DOSEN DATA
  // ============================================
  if (!user?.dosen?.id) {
    return (
      <ErrorState
        title="Data Dosen Tidak Ditemukan"
        message="Tidak dapat memuat jadwal. Data dosen tidak tersedia."
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // ERROR STATE - FETCH ERROR
  // ============================================
  if (error && jadwalList.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Jadwal"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // GET ACTIVE SEMESTER
  // ============================================
  const activeSemester = semesterList.find((s) => s.isActive);
  const selectedSemester =
    semesterFilter === 'ACTIVE'
      ? activeSemester
      : semesterList.find((s) => s.id === parseInt(semesterFilter));

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Mengajar"
        description={`Jadwal mengajar ${user.dosen.namaLengkap}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Jadwal' },
        ]}
      />

      {/* Semester Info & Filter */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active Semester Info */}
        {selectedSemester && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">
                    {selectedSemester.tahunAkademik} {selectedSemester.periode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      selectedSemester.tanggalMulai
                    ).toLocaleDateString('id-ID')}{' '}
                    -{' '}
                    {new Date(
                      selectedSemester.tanggalSelesai
                    ).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Semester Filter */}
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Kelas</p>
              <p className="text-2xl font-bold">{jadwalList.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hari Mengajar</p>
              <p className="text-2xl font-bold">{jadwalByHari.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
              <p className="text-2xl font-bold">
                {jadwalList.reduce(
                  (sum, j) => sum + (j._count?.krsDetail || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jadwal by Hari */}
      {jadwalList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="Tidak Ada Jadwal"
              description="Anda tidak memiliki jadwal mengajar pada semester ini"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        jadwalByHari.map((group) => (
          <Card key={group.hari}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>{group.hari}</CardTitle>
                </div>
                <Badge variant="secondary">{group.jadwal.length} kelas</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>SKS</TableHead>
                      <TableHead>Ruangan</TableHead>
                      <TableHead>Mahasiswa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.jadwal.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {j.jamMulai} - {j.jamSelesai}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {j.mataKuliah?.namaMK || 'N/A'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {j.mataKuliah?.kodeMK || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {j.mataKuliah?.sks || 0} SKS
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {j.ruangan?.nama || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {j._count?.krsDetail || 0} / {j.kuotaMax || '-'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}