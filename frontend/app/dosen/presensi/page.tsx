/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle, Filter, ExternalLink, BookOpen } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';

import { presensiAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

// ✅ Helper functions di luar component
const calculateProgress = (pertemuan: number, total = 16): number => {
  return pertemuan > 0 ? Math.round((pertemuan / total) * 100) : 0;
};

const getProgressColor = (progress: number): string => {
  if (progress >= 75) return 'text-green-600';
  if (progress >= 50) return 'text-blue-600';
  if (progress >= 25) return 'text-yellow-600';
  return 'text-gray-600';
};

export default function DosenPresensiDashboard() {
  const router = useRouter();
  
  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH SEMESTERS
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await semesterAPI.getAll();
        
        if (response.success) {
          const semesters = response.data || [];
          setSemesterList(semesters);
          
          const activeSemester = semesters.find((s) => s.isActive);
          if (activeSemester) {
            setSelectedSemesterId(activeSemester.id);
          } else if (semesters.length > 0) {
            setSelectedSemesterId(semesters[0].id);
          }
        }
      } catch (err: any) {
        console.error('Fetch semesters error:', err);
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH DOSEN CLASSES
  // ============================================
  useEffect(() => {
    if (selectedSemesterId === null) return;

    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await presensiAPI.getDosenClasses({
          semesterId: selectedSemesterId,
        });
        
        if (response.success) {
          setKelasList(response.data || []);
        } else {
          setError(response.message || 'Gagal memuat data kelas');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [selectedSemesterId]);

  // ============================================
  // MEMOIZED COMPUTED VALUES
  // ============================================
  const selectedSemester = useMemo(
    () => semesterList.find((s) => s.id === selectedSemesterId),
    [semesterList, selectedSemesterId]
  );

  const totalStats = useMemo(() => {
    return kelasList.reduce(
      (acc, kelas) => {
        acc.totalKelas += 1;
        acc.totalMahasiswa += kelas._count?.krsDetail || 0;
        acc.totalPertemuan += kelas._count?.presensi || 0;
        return acc;
      },
      { totalKelas: 0, totalMahasiswa: 0, totalPertemuan: 0 }
    );
  }, [kelasList]);

  const averageProgress = useMemo(() => {
    if (kelasList.length === 0) return 0;
    const totalProgress = kelasList.reduce((acc, kelas) => {
      return acc + calculateProgress(kelas._count?.presensi || 0);
    }, 0);
    return Math.round(totalProgress / kelasList.length);
  }, [kelasList]);

  // ============================================
  // MEMOIZED HANDLERS
  // ============================================
  const handleOpenKelas = useCallback(
    (kelasMKId: number) => {
      router.push(`/dosen/presensi/${kelasMKId}`);
    },
    [router]
  );

  const handleSemesterChange = useCallback((value: string) => {
    setSelectedSemesterId(parseInt(value));
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat kelas Anda..." />
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
        title="Presensi Mahasiswa"
        description="Kelola kehadiran mahasiswa di kelas Anda"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Presensi' },
        ]}
        actions={
          semesterList.length > 0 && (
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedSemesterId?.toString()}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterList.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>
                          {semester.tahunAkademik} - {semester.periode}
                        </span>
                        {semester.isActive && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Aktif
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      {/* Stats Cards */}
      {selectedSemester && kelasList.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="text-lg font-semibold">
                    {selectedSemester.tahunAkademik}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSemester.periode}
                  </p>
                </div>
                {selectedSemester.isActive && (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Kelas</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalStats.totalKelas}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
                  <p className="text-3xl font-bold text-green-600">
                    {totalStats.totalMahasiswa}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rata-rata Progress</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {averageProgress}%
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EMPTY STATE */}
      {kelasList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="Tidak Ada Kelas"
              description={`Anda tidak mengajar kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`}
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        /* ✅ TABLE VIEW - Lebih optimal */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-center">Mahasiswa</TableHead>
                    <TableHead className="text-center">Pertemuan</TableHead>
                    <TableHead className="text-center w-48">Progress</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasList.map((kelas, index) => {
                    const pertemuanCount = kelas._count?.presensi || 0;
                    const progress = calculateProgress(pertemuanCount);
                    const progressColor = getProgressColor(progress);

                    return (
                      <TableRow
                        key={kelas.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleOpenKelas(kelas.id)}
                      >
                        <TableCell className="text-center font-medium">
                          {index + 1}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-medium">{kelas.mataKuliah?.namaMK}</p>
                            <p className="text-xs text-muted-foreground">
                              {kelas.mataKuliah?.kodeMK}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {kelas.mataKuliah?.sks} SKS
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <p>{kelas.hari}</p>
                              <p className="text-xs text-muted-foreground">
                                {kelas.jamMulai} - {kelas.jamSelesai}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          {kelas.ruangan?.nama || '-'}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {kelas._count?.krsDetail || 0}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {pertemuanCount}/16
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className={`font-medium ${progressColor}`}>
                                {progress}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {pertemuanCount} pertemuan
                              </span>
                            </div>
                            <Progress
                              value={progress}
                              className={`h-2 ${
                                progress >= 75
                                  ? '[&>div]:bg-green-500'
                                  : progress >= 50
                                  ? '[&>div]:bg-blue-500'
                                  : progress >= 25
                                  ? '[&>div]:bg-yellow-500'
                                  : '[&>div]:bg-gray-400'
                              }`}
                            />
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenKelas(kelas.id);
                            }}
                          >
                            Kelola
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
