/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, MapPin, Info, BookOpen, Download } from 'lucide-react';
import { toast } from 'sonner';

import { kelasMKAPI, mahasiswaAPI, semesterAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { KRS, KelasMK, Semester } from '@/types/model';
import { fi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

const HARI_OPTIONS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
];

interface JadwalByHari {
  hari: string;
  jadwal: KelasMK[];
}

export default function JadwalPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const { user, isLoading: authLoading } = useAuth('MAHASISWA');
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [krs, setKrs] = useState<KRS | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(''); // ✅ NEW
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    // Get current day
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = new Date().getDay();
    setCurrentDay(days[today]);
  }, []);

  useEffect(() => {
    if (authLoading || !user || !user.mahasiswa?.id) {
      return;
    }

    const mahasiswaId = user.mahasiswa.id;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all semesters
        const semestersResponse = await semesterAPI.getAll();
        if (semestersResponse.success && semestersResponse.data) {
          const sorted = semestersResponse.data.sort((a, b) => {
            return b.tahunAkademik.localeCompare(a.tahunAkademik) || 
                   (b.periode === 'GANJIL' ? -1 : 1);
          });
          setSemesters(sorted);
          
          // ✅ Auto-select active semester
          const active = sorted.find(s => s.isActive);
          if (active) {
            setSelectedSemesterId(active.id.toString());
          }
        } else {
          throw new Error('Gagal memuat data semester');
        }

        // Fetch all KRS for current mahasiswa
        const krsResponse = await mahasiswaAPI.getKRS(mahasiswaId);

        if (krsResponse.success && krsResponse.data) {
          setKrsList(krsResponse.data);
        } else {
          setKrsList([]);
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat jadwal'
        );
        toast.error('Gagal memuat jadwal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  // ✅ NEW: Update KRS when semester changes
  useEffect(() => {
    if (!selectedSemesterId || krsList.length === 0) {
      setKrs(null);
      return;
    }

    const currentKRS = krsList.find(
      k => k.semesterId === parseInt(selectedSemesterId) && 
           (k.status === 'APPROVED' || k.status === 'SUBMITTED')
    );

    setKrs(currentKRS || null);
  }, [selectedSemesterId, krsList]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const selectedSemester = semesters.find(s => s.id === parseInt(selectedSemesterId));
  
  const jadwalList: KelasMK[] = (krs?.detail
    ?.map((d) => d.kelasMK)
    .filter((kelasMK): kelasMK is KelasMK => kelasMK !== undefined) || []);

  // Sort by day and time
  const sortedJadwal = [...jadwalList].sort((a, b) => {
    const hariCompare = HARI_ORDER[a.hari] - HARI_ORDER[b.hari];
    if (hariCompare !== 0) return hariCompare;
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  // Group by day
  const jadwalByHari: JadwalByHari[] = HARI_OPTIONS.map((hari) => ({
    hari: hari.value,
    jadwal: sortedJadwal.filter((j) => j.hari === hari.value),
  })).filter((group) => group.jadwal.length > 0);

  const totalKelas = jadwalList.length;
  const totalSKS = jadwalList.reduce((sum, j) => sum + (j.mataKuliah?.sks || 0), 0);
  const uniqueDays = new Set(jadwalList.map((j) => j.hari)).size;

  // Get today's schedule
  const jadwalHariIni = sortedJadwal.filter((j) => j.hari === currentDay);

  // ============================================
  // HANDLERS
  // ============================================
  const handleRetry = () => {
    window.location.reload();
  };

  // const handleExportExcel = async () => {
  //   if (!selectedSemester || !selectedSemester.id || !user?.mahasiswa?.id) {
  //     toast.error('Pilih semester terlebih dahulu');
  //     return;
  //   }

  //   setIsExportingExcel(true);
  //   try{
  //     const blob = await kelasMKAPI.exportToExcel({
  //       semester_id: selectedSemester.id,
  //       mahasiswaId: user.mahasiswa.id,
  //     });

  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');

  //     const semester = semesters.find(s => s.id === selectedSemester.id);
  //     const timestamp = new Date().toISOString().split('T')[0];
  //     const filename = `jadwal_kuliah-${user.mahasiswa?.nim || 'mahasiswa'}-${semester ? semester.tahunAkademik + '-' + semester.periode.toLowerCase() : 'semester'}-${timestamp}.xlsx`;
      
  //     a.download = filename;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     window.URL.revokeObjectURL(url);

  //     toast.success('Jadwal Berhasil di export ke Excel');
  //   }catch(error){
  //     console.error('Error exporting to Excel:', error);
  //     toast.error('Gagal export ke Excel');
  //   } finally {
  //     setIsExportingExcel(false);
  //   }
  // }

  const handleDownloadPDF = async () => {
  if (!selectedSemester || !user?.mahasiswa?.id) {
    toast.error('Data tidak lengkap');
    return;
  }

  setIsDownloadingPDF(true);
  try {
    const blob = await kelasMKAPI.exportJadwalMahasiswaPDF({
      mahasiswaId: user.mahasiswa.id,
      semesterId: selectedSemester.id,
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const filename = `Jadwal-${user.mahasiswa.nim}-${selectedSemester.periode}-${selectedSemester.tahunAkademik}.pdf`;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Jadwal berhasil didownload');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.error('Gagal download jadwal');
  } finally {
    setIsDownloadingPDF(false);
  }
};

  // ============================================
  // LOADING STATE
  // ============================================
  if (authLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat jadwal..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Jadwal"
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
        title="Jadwal Kuliah"
        description="Jadwal kuliah Anda per semester"
       actions={
          <>

            {/* <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel || !selectedSemester}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExportingExcel ? 'Exporting...' : 'Export'}
            </Button> */}

            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF || !selectedSemester}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm">
            <label className="text-sm font-medium mb-2 block">
              Pilih Semester
            </label>
            <Select 
              value={selectedSemesterId} 
              onValueChange={setSelectedSemesterId}
              disabled={krsList.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih semester..." />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => {
                  const hasKRS = krsList.some(k => 
                    k.semesterId === sem.id && 
                    (k.status === 'APPROVED' || k.status === 'SUBMITTED')
                  );
                  return (
                    <SelectItem 
                      key={sem.id} 
                      value={sem.id.toString()}
                      disabled={!hasKRS}
                    >
                      {sem.tahunAkademik} {sem.periode === 'GANJIL' ? 'Ganjil' : 'Genap'}
                      {sem.isActive && ' (Aktif)'}
                      {!hasKRS && ' (Belum ada KRS)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty state if no semester selected */}
      {!selectedSemesterId ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="Pilih Semester"
              description="Pilih semester di atas untuk melihat jadwal"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : !krs || !krs.detail || krs.detail.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="Belum Ada Jadwal"
              description={
                krs?.status === 'DRAFT'
                  ? 'Lengkapi dan submit KRS Anda terlebih dahulu'
                  : krs?.status === 'SUBMITTED'
                  ? 'Menunggu KRS Anda disetujui dosen wali'
                  : 'Jadwal akan muncul setelah KRS Anda disetujui'
              }
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's Schedule Alert */}
          {jadwalHariIni.length > 0 && selectedSemester?.isActive && (
            <Alert className="border-blue-200 bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Anda memiliki <span className="font-bold">{jadwalHariIni.length}</span> kelas
                hari ini ({currentDay})
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Kelas</p>
                    <p className="text-2xl font-bold">{totalKelas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total SKS</p>
                    <p className="text-2xl font-bold">{totalSKS}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hari Kuliah</p>
                    <p className="text-2xl font-bold">{uniqueDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Per Hari & Weekly Summary */}
          <Tabs defaultValue="perhari" className="space-y-4">
            <TabsList>
              <TabsTrigger value="perhari">Per Hari</TabsTrigger>
              <TabsTrigger value="summary">Ringkasan Mingguan</TabsTrigger>
            </TabsList>

            {/* Per Hari Tab */}
            <TabsContent value="perhari" className="space-y-4">
              {jadwalByHari.map((group) => (
                <Card key={group.hari}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <CardTitle>{group.hari}</CardTitle>
                      <Badge
                        variant={group.hari === currentDay && selectedSemester?.isActive ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {group.jadwal.length} kelas
                      </Badge>
                      {group.hari === currentDay && selectedSemester?.isActive && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Hari Ini
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Waktu</TableHead>
                            <TableHead>Mata Kuliah</TableHead>
                            <TableHead className="text-center w-20">SKS</TableHead>
                            <TableHead>Dosen</TableHead>
                            <TableHead>Ruangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.jadwal.map((jadwal) => (
                            <TableRow key={jadwal.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {jadwal.jamMulai} - {jadwal.jamSelesai}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {jadwal.mataKuliah?.namaMK || '-'}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {jadwal.mataKuliah?.kodeMK || '-'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {jadwal.mataKuliah?.sks || 0} SKS
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {jadwal.dosen?.namaLengkap || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{jadwal.ruangan?.nama || '-'}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Weekly Summary Tab */}
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Jadwal Mingguan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jadwalByHari.map((group) => (
                      <div
                        key={group.hari}
                        className="flex items-start gap-4 pb-4 border-b last:border-0"
                      >
                        <div className="min-w-24">
                          <Badge
                            variant={group.hari === currentDay && selectedSemester?.isActive ? 'default' : 'secondary'}
                            className="font-medium"
                          >
                            {group.hari}
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-2">
                          {group.jadwal.map((jadwal) => (
                            <div
                              key={jadwal.id}
                              className="flex items-center gap-4 text-sm p-2 rounded hover:bg-accent/50"
                            >
                              <span className="text-muted-foreground font-mono min-w-28">
                                {jadwal.jamMulai} - {jadwal.jamSelesai}
                              </span>
                              <span className="font-medium flex-1">
                                {jadwal.mataKuliah?.namaMK}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {jadwal.mataKuliah?.sks} SKS
                              </Badge>
                              <span className="text-muted-foreground text-xs min-w-32 text-right">
                                {jadwal.ruangan?.nama}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Stats */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Jam Kuliah per Minggu
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.floor((totalSKS * 50) / 60)} jam {(totalSKS * 50) % 60} menit
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50">
                        <p className="text-sm text-muted-foreground mb-1">
                          Rata-rata Kelas per Hari
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {uniqueDays > 0 ? (totalKelas / uniqueDays).toFixed(1) : 0} kelas
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Catatan Penting:</p>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Jadwal ini berdasarkan KRS yang telah disetujui</li>
                    <li>Pastikan Anda hadir tepat waktu sesuai jadwal</li>
                    <li>Jika ada perubahan jadwal, akan diinformasikan oleh dosen</li>
                    <li>
                      Total beban kuliah: {totalSKS} SKS = {totalSKS * 50} menit per minggu
                    </li>
                    <li>Toleransi keterlambatan maksimal 15 menit</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
