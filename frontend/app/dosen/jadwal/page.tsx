'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen,
  Download,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// ✅ Constants outside
const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ✅ Helper functions outside
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const generateFilename = (
  type: 'excel' | 'pdf',
  nidn: string,
  semester: Semester | undefined,
  timestamp?: string
): string => {
  const base = `Jadwal-Dosen-${nidn}-${semester?.periode}-${semester?.tahunAkademik}`;
  const ext = type === 'excel' ? 'xlsx' : 'pdf';
  return timestamp ? `${base}-${timestamp}.${ext}` : `${base}.${ext}`;
};

const groupJadwalByDay = (jadwal: KelasMK[]): Record<string, KelasMK[]> => {
  return jadwal.reduce((acc, kelas) => {
    const day = kelas.hari || 'Tidak ada jadwal';
    if (!acc[day]) acc[day] = [];
    acc[day].push(kelas);
    return acc;
  }, {} as Record<string, KelasMK[]>);
};

export default function JadwalDosenPage() {
  const { user } = useAuth();
  const [jadwal, setJadwal] = useState<KelasMK[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // ============================================
  // FETCH SEMESTERS
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await semesterAPI.getAll();
        if (response.success && response.data) {
          setSemesters(response.data);
          
          const activeSemester = response.data.find((s: Semester) => s.isActive);
          if (activeSemester) {
            setSelectedSemester(activeSemester.id);
          }
        }
      } catch (error) {
        console.error('Error fetching semesters:', error);
        toast.error('Gagal memuat data semester');
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH JADWAL
  // ============================================
  useEffect(() => {
    if (!selectedSemester || !user?.dosen?.id) return;

    const fetchJadwal = async () => {
      setIsLoading(true);
      try {
        const response = await kelasMKAPI.getAll({
          semester_id: selectedSemester,
          dosenId: user.dosen.id,
        });

        if (response.success && response.data) {
          setJadwal(response.data);
        }
      } catch (error) {
        console.error('Error fetching jadwal:', error);
        toast.error('Gagal memuat jadwal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJadwal();
  }, [selectedSemester, user?.dosen?.id]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const groupedJadwal = useMemo(() => groupJadwalByDay(jadwal), [jadwal]);

  const sortedDays = useMemo(
    () => DAYS_ORDER.filter(day => groupedJadwal[day]),
    [groupedJadwal]
  );

  const selectedSemesterData = useMemo(
    () => semesters.find(s => s.id === selectedSemester),
    [semesters, selectedSemester]
  );

  const totalStats = useMemo(() => ({
    totalKelas: jadwal.length,
    totalMahasiswa: jadwal.reduce((sum, k) => sum + (k._count?.krsDetail || 0), 0),
  }), [jadwal]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleExportExcel = useCallback(async () => {
    if (!selectedSemester || !user?.dosen?.id || !user?.dosen?.nidn) {
      toast.error('Pilih semester terlebih dahulu');
      return;
    }

    setIsExportingExcel(true);
    try {
      const blob = await kelasMKAPI.exportToExcel({
        semester_id: selectedSemester,
        dosenId: user.dosen.id,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = generateFilename('excel', user.dosen.nidn, selectedSemesterData, timestamp);
      
      downloadBlob(blob, filename);
      toast.success('Jadwal berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Gagal export ke Excel');
    } finally {
      setIsExportingExcel(false);
    }
  }, [selectedSemester, user?.dosen?.id, user?.dosen?.nidn, selectedSemesterData]);

  const handleExportPDF = useCallback(async () => {
    if (!selectedSemester || !user?.dosen?.id || !user?.dosen?.nidn) {
      toast.error('Pilih semester terlebih dahulu');
      return;
    }

    setIsExportingPDF(true);
    try {
      const blob = await kelasMKAPI.exportJadwalDosenPDF({
        dosenId: user.dosen.id,
        semesterId: selectedSemester,
      });

      const filename = generateFilename('pdf', user.dosen.nidn, selectedSemesterData);
      
      downloadBlob(blob, filename);
      toast.success('Jadwal berhasil didownload');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal download PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [selectedSemester, user?.dosen?.id, user?.dosen?.nidn, selectedSemesterData]);

  const handleSemesterChange = useCallback((value: string) => {
    setSelectedSemester(parseInt(value));
  }, []);

  const navigateToPresensi = useCallback((kelasId: number) => {
    window.location.href = `/dosen/presensi?kelasId=${kelasId}`;
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && jadwal.length === 0 && !selectedSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat jadwal..." />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Mengajar"
        description="Lihat jadwal mengajar Anda untuk semester ini"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Jadwal' },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel || !selectedSemester}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExportingExcel ? 'Exporting...' : 'Export'}
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExportingPDF || !selectedSemester}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExportingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          </>
        }
      />

      {/* Filter & Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">
                Pilih Semester
              </label>
              <Select
                value={selectedSemester?.toString() || ''}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>
                          {semester.tahunAkademik} - {semester.periode}
                        </span>
                        {semester.isActive && (
                          <Badge variant="default">Aktif</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {totalStats.totalKelas > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalStats.totalKelas} Kelas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{totalStats.totalMahasiswa} Mahasiswa</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jadwal Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ) : jadwal.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="Tidak ada jadwal mengajar"
              description="Belum ada kelas yang ditugaskan untuk semester ini"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  {day}
                </CardTitle>
                <CardDescription className="text-xs">
                  {groupedJadwal[day].length} kelas pada hari ini
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Ruangan</TableHead>
                        <TableHead>Mahasiswa</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedJadwal[day]
                        .sort((a, b) => (a.jamMulai || '').localeCompare(b.jamMulai || ''))
                        .map((kelas) => (
                          <TableRow key={kelas.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {kelas.jamMulai} - {kelas.jamSelesai}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{kelas.mataKuliah?.namaMK}</p>
                                <p className="text-xs text-muted-foreground">
                                  {kelas.mataKuliah?.kodeMK} • {kelas.mataKuliah?.sks} SKS
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{kelas.ruangan?.nama}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {kelas._count?.krsDetail || 0} / {kelas.kuotaMax}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateToPresensi(kelas.id)}
                              >
                                Presensi
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
