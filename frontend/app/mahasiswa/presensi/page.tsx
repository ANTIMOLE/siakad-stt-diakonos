/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle, Filter, TrendingUp, ExternalLink } from 'lucide-react';

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
import { Semester } from '@/types/model';

// ✅ Helper functions di luar component
const getStatusConfig = (persentase: number) => {
  if (persentase >= 80) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '✅',
      label: 'Baik',
      variant: 'default' as const,
    };
  }
  if (persentase >= 60) {
    return {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: '⚠️',
      label: 'Cukup',
      variant: 'secondary' as const,
    };
  }
  return {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: '❌',
    label: 'Kurang',
    variant: 'destructive' as const,
  };
};

export default function MahasiswaPresensiDashboard() {
  const router = useRouter();

  const [kelasList, setKelasList] = useState<any[]>([]);
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
  // FETCH MAHASISWA CLASSES
  // ============================================
  useEffect(() => {
    if (selectedSemesterId === null) return;

    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await presensiAPI.getMahasiswaClasses({
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

  const overallStats = useMemo(() => {
    return kelasList.reduce(
      (acc, kelas) => {
        const stats = kelas.presensiStats || { totalPertemuan: 0, hadir: 0 };
        acc.totalPertemuan += stats.totalPertemuan;
        acc.hadir += stats.hadir;
        return acc;
      },
      { totalPertemuan: 0, hadir: 0 }
    );
  }, [kelasList]);

  const overallPersentase = useMemo(() => {
    return overallStats.totalPertemuan > 0
      ? (overallStats.hadir / overallStats.totalPertemuan) * 100
      : 0;
  }, [overallStats]);

  // ============================================
  // MEMOIZED HANDLERS
  // ============================================
  const handleOpenKelas = useCallback(
    (kelasMKId: number) => {
      router.push(`/mahasiswa/presensi/${kelasMKId}`);
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
        <LoadingSpinner size="lg" text="Memuat data presensi Anda..." />
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
        title="Presensi Saya"
        description="Lihat kehadiran Anda di setiap mata kuliah"
        breadcrumbs={[
          { label: 'Dashboard', href: '/mahasiswa/dashboard' },
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

      {/* Stats Cards - Keep this for overview */}
      {selectedSemester && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Semester Aktif</p>
                  <p className="text-lg font-semibold">
                    {selectedSemester.tahunAkademik} - {selectedSemester.periode}
                  </p>
                </div>
                {selectedSemester.isActive && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Aktif
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Kehadiran Keseluruhan
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {overallPersentase.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({overallStats.hadir}/{overallStats.totalPertemuan} pertemuan)
                    </span>
                  </div>
                  <Progress value={overallPersentase} className="mt-3" />
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-50" />
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
              description={`Anda belum mengambil kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`}
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        /* ✅ TABLE VIEW - Lebih optimal daripada cards */
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
                    <TableHead className="text-center w-48">Kehadiran</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kelasList.map((kelas: any, index: number) => {
                    const stats = kelas.presensiStats || {
                      totalPertemuan: 0,
                      hadir: 0,
                      persentase: 0,
                    };

                    const statusConfig = getStatusConfig(stats.persentase);

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
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {kelas.dosen?.namaLengkap}
                            </span>
                          </div>
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

                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {stats.persentase.toFixed(1)}%
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {stats.hadir}/{stats.totalPertemuan}
                              </span>
                            </div>
                            <Progress
                              value={stats.persentase}
                              className={`h-2 ${
                                stats.persentase >= 80
                                  ? '[&>div]:bg-green-500'
                                  : stats.persentase >= 60
                                  ? '[&>div]:bg-yellow-500'
                                  : '[&>div]:bg-red-500'
                              }`}
                            />
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
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
                            Detail
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
