/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Download, FileText, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { toast } from 'sonner';

import { khsAPI, semesterAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth'; // Adjust path sesuai lokasi hook
import { KHS, Semester, Nilai } from '@/types/model';

interface KHSWithDetails extends KHS {
  nilai?: Nilai[];
  predikat?: string;
}

export default function KHSPage() {
  // ============================================
  // AUTH & USER MANAGEMENT
  // ============================================
  const { user, isLoading: authLoading } = useAuth('MAHASISWA');

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [khsList, setKhsList] = useState<KHS[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedKHS, setSelectedKHS] = useState<KHSWithDetails | null>(null);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNilai, setIsLoadingNilai] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    if (authLoading || !user?.mahasiswa?.id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      const mahasiswaId = user.mahasiswa.id;

      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch all semesters
        const semesterResponse = await semesterAPI.getAll();
        if (semesterResponse.success && semesterResponse.data) {
          const sorted = semesterResponse.data.sort((a, b) => {
            return b.tahunAkademik.localeCompare(a.tahunAkademik) || 
                   (b.periode === 'GANJIL' ? -1 : 1);
          });
          setSemesterList(sorted);
        } else {
          throw new Error('Gagal memuat data semester');
        }

        // 2. Fetch KHS history untuk mahasiswa ini
        const khsResponse = await khsAPI.getAll({ mahasiswaId: mahasiswaId });

        if (khsResponse.success && khsResponse.data) {
          const khsData = khsResponse.data;
          setKhsList(khsData);

          // Auto-select semester terbaru yang punya KHS
          if (khsData.length > 0) {
            const latestKHS = khsData[0]; // backend sudah order desc
            setSelectedSemesterId(latestKHS.semesterId.toString());
          }
        } else {
          setKhsList([]);
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data KHS'
        );
        toast.error('Gagal memuat data KHS');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

  // ============================================
  // FETCH DETAIL KHS + NILAI + PREDIKAT KETIKA SEMESTER DIPILIH
  // ============================================
  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedSemesterId) {
        setSelectedKHS(null);
        setNilaiList([]);
        return;
      }

      try {
        setIsLoadingNilai(true);

        // Cari KHS berdasarkan semesterId
        const khs = khsList.find(k => k.semesterId === Number(selectedSemesterId));
        
        if (!khs) {
          setSelectedKHS(null);
          setNilaiList([]);
          return;
        }

        // Fetch detail lengkap (termasuk nilai & predikat)
        const detailResponse = await khsAPI.getById(khs.id);
        
        if (detailResponse.success && detailResponse.data) {
          const data = detailResponse.data as KHSWithDetails;
          setSelectedKHS(data);
          setNilaiList(data.nilai || []);
        } else {
          setSelectedKHS(null);
          setNilaiList([]);
        }
        
      } catch (err: any) {
        console.error('Fetch detail error:', err);
        toast.error('Gagal memuat detail KHS');
        setNilaiList([]);
      } finally {
        setIsLoadingNilai(false);
      }
    };

    fetchDetail();
  }, [selectedSemesterId, khsList]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDownloadPDF = async () => {
    if (!selectedKHS) return;

    try {
      setIsDownloading(true);
      
      const blob = await khsAPI.downloadPDF(selectedKHS.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const semester = selectedKHS.semester;
      link.download = `KHS_${user?.mahasiswa?.nim}_${semester?.tahunAkademik?.replace('/', '-') ?? 'unknown'}_${semester?.periode ?? 'unknown'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('KHS berhasil didownload');
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Gagal mendownload KHS');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  // khsList sudah di-order desc oleh backend (terbaru dulu)
  const previousKHS = selectedKHS && khsList.length > 1 && khsList[0].id === selectedKHS.id
    ? khsList[1]
    : null;

  const ipsTrend = selectedKHS && previousKHS
    ? Number(selectedKHS.ips) - Number(previousKHS.ips)
    : null;

  const getNilaiGrade = (bobot: number | null) => {
    if (bobot === null) return 'text-gray-600';
    if (bobot >= 3.5) return 'text-green-600';
    if (bobot >= 3.0) return 'text-blue-600';
    if (bobot >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ============================================
  // RENDER
  // ============================================
  if (authLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data autentikasi..." />
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorState
        title="Akses Ditolak"
        message="Anda belum login atau session telah berakhir. Silakan login kembali."
        onRetry={() => (window.location.href = '/login')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data KHS..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kartu Hasil Studi (KHS)"
        description="Lihat hasil studi Anda per semester"
        actions={
          selectedKHS && (
            <Button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          )
        }
      />

      {/* Belum ada KHS */}
      {khsList.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Belum ada KHS yang tersedia. KHS akan muncul setelah semua nilai semester tersebut difinalisasi oleh dosen.
          </AlertDescription>
        </Alert>
      )}

      {/* Semester Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm">
            <label className="text-sm font-medium mb-2 block">
              Pilih Semester
            </label>
            <Select 
              value={selectedSemesterId} 
              onValueChange={setSelectedSemesterId}
              disabled={khsList.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih semester..." />
              </SelectTrigger>
              <SelectContent>
                {semesterList.map((sem) => {
                  const hasKHS = khsList.some(k => k.semesterId === sem.id);
                  return (
                    <SelectItem 
                      key={sem.id} 
                      value={sem.id.toString()}
                      disabled={!hasKHS}
                    >
                      {sem.tahunAkademik} {sem.periode === 'GANJIL' ? 'Ganjil' : 'Genap'}
                      {!hasKHS && ' (Belum tersedia)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Konten utama */}
      {!selectedSemesterId ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="Pilih Semester"
              description="Pilih semester di atas untuk melihat KHS"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : !selectedKHS ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="KHS Belum Tersedia"
              description="KHS untuk semester ini belum digenerate. Tunggu hingga semua nilai difinalisasi."
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IPS</CardTitle>
                <Award className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {Number(selectedKHS.ips).toFixed(2)}
                  </div>
                  {ipsTrend !== null && (
                    <div className={`flex items-center text-xs ${ipsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {ipsTrend >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(ipsTrend).toFixed(2)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Indeks Prestasi Semester
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IPK</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Number(selectedKHS.ipk).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Indeks Prestasi Kumulatif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SKS Semester</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedKHS.totalSKSSemester}
                </div>
                <p className="text-xs text-muted-foreground">SKS semester ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SKS Kumulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedKHS.totalSKSKumulatif}
                </div>
                <p className="text-xs text-muted-foreground">Total SKS lulus</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabel Nilai */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Nilai Semester Ini</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingNilai ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Memuat nilai..." />
                </div>
              ) : nilaiList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Data nilai belum tersedia</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Kode MK</TableHead>
                        <TableHead>Nama Mata Kuliah</TableHead>
                        <TableHead>Dosen Pengampu</TableHead>
                        <TableHead className="text-center">SKS</TableHead>
                        <TableHead className="text-center">Nilai Angka</TableHead>
                        <TableHead className="text-center">Nilai Huruf</TableHead>
                        <TableHead className="text-center">Bobot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nilaiList.map((nilai, index) => (
                        <TableRow key={nilai.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">
                            {nilai.kelasMK?.mataKuliah?.kodeMK || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {nilai.kelasMK?.mataKuliah?.namaMK || '-'}
                          </TableCell>
                          <TableCell>
                            {nilai.kelasMK?.dosen?.namaLengkap || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {nilai.kelasMK?.mataKuliah?.sks || 0} SKS
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {nilai.nilaiAngka !== null ? Number(nilai.nilaiAngka).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="secondary" 
                              className={`font-bold ${getNilaiGrade(nilai.bobot)}`}
                            >
                              {nilai.nilaiHuruf || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {nilai.bobot !== null ? Number(nilai.bobot).toFixed(2) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary dengan predikat dari backend */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Prestasi Semester Ini
                  </p>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex justify-between">
                      <span>IPS:</span>
                      <strong>{Number(selectedKHS.ips).toFixed(2)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Total SKS:</span>
                      <strong>{selectedKHS.totalSKSSemester}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Jumlah MK:</span>
                      <strong>{nilaiList.length}</strong>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Prestasi Kumulatif
                  </p>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex justify-between">
                      <span>IPK:</span>
                      <strong>{Number(selectedKHS.ipk).toFixed(2)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Total SKS Lulus:</span>
                      <strong>{selectedKHS.totalSKSKumulatif}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Sisa SKS (estimasi):</span>
                      <strong>{144 - selectedKHS.totalSKSKumulatif}</strong>
                    </li>
                    <li className="flex justify-between pt-2 border-t border-blue-200">
                      <span>Predikat:</span>
                      <strong className="capitalize">
                        {selectedKHS.predikat || 'Belum tersedia'}
                      </strong>
                    </li>
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