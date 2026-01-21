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
import { KHS, Semester, Nilai } from '@/types/model';

export default function KHSPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [khsList, setKhsList] = useState<KHS[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedKHS, setSelectedKHS] = useState<KHS | null>(null);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNilai, setIsLoadingNilai] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch all semesters
        const semesterResponse = await semesterAPI.getAll();
        if (semesterResponse.success && semesterResponse.data) {
          // Sort by newest first
          const sorted = semesterResponse.data.sort((a, b) => {
            return b.tahunAkademik.localeCompare(a.tahunAkademik) || 
                   (b.periode === 'GANJIL' ? -1 : 1);
          });
          setSemesterList(sorted);
        }

        // 2. Fetch KHS history for current user
        const khsResponse = await khsAPI.getAll();
        if (khsResponse.success && khsResponse.data) {
          setKhsList(khsResponse.data);
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
  }, []);

  // ============================================
  // FETCH NILAI WHEN SEMESTER SELECTED
  // ============================================
  useEffect(() => {
    const fetchNilai = async () => {
      if (!selectedSemesterId) {
        setSelectedKHS(null);
        setNilaiList([]);
        return;
      }

      try {
        setIsLoadingNilai(true);

        // Find KHS for selected semester
        const khs = khsList.find(k => k.semesterId === Number(selectedSemesterId));
        
        if (!khs) {
          setSelectedKHS(null);
          setNilaiList([]);
          return;
        }

        setSelectedKHS(khs);

        // Fetch nilai details - backend should return nilai with kelasMK relations
        // For now, we'll use the nilai from KHS if available
        // In real implementation, you might need a separate API call
        setNilaiList([]); // TODO: Fetch from nilai API if needed
        
      } catch (err: any) {
        console.error('Fetch nilai error:', err);
        toast.error('Gagal memuat data nilai');
      } finally {
        setIsLoadingNilai(false);
      }
    };

    fetchNilai();
  }, [selectedSemesterId, khsList]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDownloadPDF = async () => {
    if (!selectedKHS) return;

    try {
      setIsDownloading(true);
      
      const blob = await khsAPI.downloadPDF(selectedKHS.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KHS_${selectedKHS.semester?.tahunAkademik}_${selectedKHS.semester?.periode}.pdf`;
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
  const previousKHS = selectedKHS && khsList.length > 1
    ? khsList.find(k => k.id !== selectedKHS.id && k.semesterId < selectedKHS.semesterId)
    : null;

  const ipsTrend = selectedKHS && previousKHS
    ? selectedKHS.ips - previousKHS.ips
    : null;

  const getNilaiGrade = (bobot: number | null) => {
    if (bobot === null) return 'text-gray-600';
    if (bobot >= 3.5) return 'text-green-600';
    if (bobot >= 3.0) return 'text-blue-600';
    if (bobot >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data KHS..." />
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
  // RENDER
  // ============================================
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

      {/* No KHS Available */}
      {khsList.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Belum ada KHS yang tersedia. KHS akan tersedia setelah nilai difinalisasi oleh dosen.
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
              disabled={semesterList.length === 0}
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
                      {sem.tahunAkademik} {sem.periode}
                      {!hasKHS && ' (Belum tersedia)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!selectedSemesterId ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="Pilih Semester"
              description="Pilih semester untuk melihat KHS"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : !selectedKHS ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="KHS Tidak Tersedia"
              description="KHS untuk semester ini belum tersedia. Nilai sedang diproses atau belum difinalisasi."
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
                    {selectedKHS.ips.toFixed(2)}
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
                  {selectedKHS.ipk.toFixed(2)}
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

          {/* Nilai Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Nilai</CardTitle>
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
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {nilai.kelasMK?.mataKuliah?.sks || 0} SKS
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {nilai.nilaiAngka !== null ? nilai.nilaiAngka : '-'}
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
                            {nilai.bobot !== null ? nilai.bobot.toFixed(2) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
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
                      <strong>{selectedKHS.ips.toFixed(2)}</strong>
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
                      <strong>{selectedKHS.ipk.toFixed(2)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Total SKS Lulus:</span>
                      <strong>{selectedKHS.totalSKSKumulatif}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Sisa SKS:</span>
                      <strong>{144 - selectedKHS.totalSKSKumulatif}</strong>
                    </li>
                    <li className="flex justify-between pt-2 border-t border-blue-200">
                      <span>Predikat:</span>
                      <strong>
                        {selectedKHS.ipk >= 3.5
                          ? 'Cum Laude'
                          : selectedKHS.ipk >= 3.0
                          ? 'Memuaskan'
                          : 'Baik'}
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
