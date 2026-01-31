/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

import { presensiAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

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

          // ✅ Auto-select active semester
          const activeSemester = semesters.find((s) => s.isActive);
          if (activeSemester) {
            setSelectedSemesterId(activeSemester.id);
          } else if (semesters.length > 0) {
            // Fallback to most recent
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

        // ✅ Call mahasiswa-specific endpoint
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
  // HANDLERS
  // ============================================
  const handleOpenKelas = (kelasMKId: number) => {
    router.push(`/mahasiswa/presensi/${kelasMKId}`);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemesterId(parseInt(value));
  };

  // ============================================
  // CALCULATE OVERALL STATS
  // ============================================
  const overallStats = kelasList.reduce(
    (acc, kelas) => {
      const stats = kelas.presensiStats || { totalPertemuan: 0, hadir: 0 };
      acc.totalPertemuan += stats.totalPertemuan;
      acc.hadir += stats.hadir;
      return acc;
    },
    { totalPertemuan: 0, hadir: 0 }
  );

  const overallPersentase =
    overallStats.totalPertemuan > 0
      ? (overallStats.hadir / overallStats.totalPertemuan) * 100
      : 0;

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
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);

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

      {/* Semester Info + Overall Stats */}
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
        <EmptyState
          title="Tidak Ada Kelas"
          description={`Anda belum mengambil kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas: any) => {
            const stats = kelas.presensiStats || {
              totalPertemuan: 0,
              hadir: 0,
              persentase: 0,
            };

            const statusColor =
              stats.persentase >= 80
                ? 'text-green-600 bg-green-50 border-green-200'
                : stats.persentase >= 60
                ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                : 'text-red-600 bg-red-50 border-red-200';

            const statusIcon =
              stats.persentase >= 80 ? '✅' : stats.persentase >= 60 ? '⚠️' : '❌';

            return (
              <Card
                key={kelas.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOpenKelas(kelas.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {kelas.mataKuliah?.namaMK}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {kelas.mataKuliah?.kodeMK} • {kelas.mataKuliah?.sks} SKS
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {kelas.semester?.periode}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Class Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {kelas.hari}, {kelas.jamMulai} - {kelas.jamSelesai}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{kelas.dosen?.namaLengkap}</span>
                    </div>
                    {kelas.ruangan && (
                      <div className="text-muted-foreground">📍 {kelas.ruangan.nama}</div>
                    )}
                  </div>

                  {/* Attendance Stats */}
                  <div className={`p-4 rounded-lg border ${statusColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Kehadiran</span>
                      <span className="text-2xl">{statusIcon}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {stats.persentase.toFixed(1)}%
                      </span>
                      <span className="text-sm opacity-75">
                        {stats.hadir}/{stats.totalPertemuan} hadir
                      </span>
                    </div>
                    <Progress
                      value={stats.persentase}
                      className={`mt-3 ${
                        stats.persentase >= 80
                          ? '[&>div]:bg-green-500'
                          : stats.persentase >= 60
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>

                  {/* Action */}
                  <Button className="w-full gap-2" variant="outline">
                    <Calendar className="h-4 w-4" />
                    Lihat Detail Presensi
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}