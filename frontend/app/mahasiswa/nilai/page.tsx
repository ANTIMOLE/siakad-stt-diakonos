/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Award, Download, TrendingUp, Info, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import { khsAPI } from '@/lib/api';
import { KHS, Nilai } from '@/types/model';

interface TranskripData {
  mahasiswa: {
    nim: string;
    namaLengkap: string;
    prodi: { nama: string };
  };
  khs: KHS[];
  nilai: Nilai[];
  summary: {
    finalIPK: number;
    totalSKS: number;
    predikat: string;
    totalSemester: number;
  };
}

// ✅ Helper functions outside component
const toNumber = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const formatScore = (value: any, decimals: number = 2): string => {
  const num = toNumber(value);
  return num !== null ? num.toFixed(decimals) : '-';
};

const getGradeColor = (huruf: string | null): string => {
  if (!huruf) return 'bg-gray-100 text-gray-700';
  if (['A', 'AB'].includes(huruf)) return 'bg-green-100 text-green-700 border-green-300';
  if (['B', 'BC'].includes(huruf)) return 'bg-blue-100 text-blue-700 border-blue-300';
  if (['C', 'CD'].includes(huruf)) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  if (['D', 'DE'].includes(huruf)) return 'bg-orange-100 text-orange-700 border-orange-300';
  return 'bg-red-100 text-red-700 border-red-300';
};

const sortSemesters = (grouped: Record<string, Nilai[]>): [string, Nilai[]][] => {
  return Object.entries(grouped).sort(([a], [b]) => {
    const parseKey = (key: string) => {
      const parts = key.split(' ');
      return {
        tahunAkademik: parts[0],
        periode: parts[1],
      };
    };
    
    const semA = parseKey(a);
    const semB = parseKey(b);
    
    const yearCompare = semB.tahunAkademik.localeCompare(semA.tahunAkademik);
    if (yearCompare !== 0) return yearCompare;
    
    if (semA.periode === 'Ganjil' && semB.periode === 'Genap') return 1;
    if (semA.periode === 'Genap' && semB.periode === 'Ganjil') return -1;
    
    return 0;
  });
};

const GRADE_LEGEND = [
  { huruf: 'A', bobot: '4.00', desc: 'Sangat Baik' },
  { huruf: 'AB', bobot: '3.50', desc: 'Baik Sekali' },
  { huruf: 'B', bobot: '3.00', desc: 'Baik' },
  { huruf: 'BC', bobot: '2.50', desc: 'Cukup Baik' },
  { huruf: 'C', bobot: '2.00', desc: 'Cukup' },
  { huruf: 'CD', bobot: '1.50', desc: 'Kurang' },
  { huruf: 'D', bobot: '1.00', desc: 'Kurang Sekali' },
  { huruf: 'E', bobot: '0.00', desc: 'Gagal' },
] as const;

export default function TranskripPage() {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (err) {
        console.error('Gagal parse user dari localStorage');
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  const [transkrip, setTranskrip] = useState<TranskripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ============================================
  // FETCH TRANSKRIP
  // ============================================
  useEffect(() => {
    const fetchTranskrip = async () => {
      if (!user?.mahasiswa?.id) {
        setError('Data mahasiswa tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await khsAPI.getTranskrip(user.mahasiswa.id);

        if (response.success && response.data) {
          setTranskrip(response.data as TranskripData);
        } else {
          setTranskrip(null);
        }
      } catch (err: any) {
        console.error('Fetch transkrip error:', err);
        setError(err.response?.data?.message || 'Gagal memuat transkrip nilai');
        toast.error('Gagal memuat data transkrip');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchTranskrip();
    }
  }, [user, isAuthLoading]);

  // ============================================
  // MEMOIZED GROUPED DATA
  // ============================================
  const groupedNilai = useMemo(() => {
    if (!transkrip?.nilai) return [];

    const grouped: Record<string, Nilai[]> = {};
    transkrip.nilai.forEach((n) => {
      if (!n.kelasMK?.semester) return;
      const key = `${n.kelasMK.semester.tahunAkademik} ${n.kelasMK.semester.periode === 'GANJIL' ? 'Ganjil' : 'Genap'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(n);
    });

    return sortSemesters(grouped);
  }, [transkrip?.nilai]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleDownloadTranskrip = useCallback(async () => {
    if (!user?.mahasiswa?.id) return;

    try {
      setIsDownloading(true);
      const blob = await khsAPI.downloadTranskripPDF(user.mahasiswa.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Transkrip_${user.mahasiswa.nim}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Transkrip berhasil didownload');
    } catch (err) {
      toast.error('Gagal mendownload transkrip');
    } finally {
      setIsDownloading(false);
    }
  }, [user?.mahasiswa?.id, user?.mahasiswa?.nim]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleLoginRedirect = useCallback(() => {
    window.location.href = '/login';
  }, []);

  // ============================================
  // RENDER
  // ============================================
  if (isAuthLoading) {
    return <LoadingSpinner size="lg" text="Memuat autentikasi..." />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Akses Ditolak"
        message="Silakan login kembali"
        onRetry={handleLoginRedirect}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Memuat transkrip nilai..." />;
  }

  if (error) {
    return <ErrorState title="Error" message={error} onRetry={handleRetry} />;
  }

  if (!transkrip || transkrip.nilai.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Transkrip Nilai" description="Riwayat nilai kumulatif semua semester" />
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Belum ada data nilai. Transkrip akan tersedia setelah dosen memfinalisasi nilai semester.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Transkrip Nilai"
        description="Riwayat nilai kumulatif semua mata kuliah"
        actions={
          <Button onClick={handleDownloadTranskrip} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        }
      />

      {/* Summary Stats - Compact */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Semester</p>
                <p className="text-3xl font-bold text-blue-600">
                  {transkrip.summary.totalSemester}
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
                <p className="text-sm text-muted-foreground">IPK Akhir</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatScore(transkrip.summary.finalIPK)}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total SKS</p>
                <p className="text-3xl font-bold text-purple-600">
                  {transkrip.summary.totalSKS}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predikat</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {transkrip.summary.predikat || '-'}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nilai per Semester */}
      {groupedNilai.map(([semesterKey, nilaiList]) => (
        <Card key={semesterKey}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>{semesterKey}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {nilaiList.length} MK • {nilaiList.reduce((sum, n) => sum + (n.kelasMK?.mataKuliah?.sks || 0), 0)} SKS
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead className="text-center">Angka</TableHead>
                    <TableHead className="text-center">Huruf</TableHead>
                    <TableHead className="text-center">Bobot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nilaiList.map((nilai, idx) => (
                    <TableRow key={nilai.id}>
                      <TableCell className="text-center">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {nilai.kelasMK?.mataKuliah?.kodeMK || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {nilai.kelasMK?.mataKuliah?.namaMK || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {nilai.kelasMK?.dosen?.namaLengkap || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {nilai.kelasMK?.mataKuliah?.sks || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatScore(nilai.nilaiAngka)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`font-bold text-xs ${getGradeColor(nilai.nilaiHuruf)}`}>
                          {nilai.nilaiHuruf || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatScore(nilai.bobot)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Legend - Compact */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-blue-900 mb-4 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Legenda Nilai
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GRADE_LEGEND.map((item) => (
              <div key={item.huruf} className="flex items-center gap-2">
                <Badge className={`font-bold text-xs ${getGradeColor(item.huruf)}`}>
                  {item.huruf}
                </Badge>
                <span className="text-xs text-blue-700">
                  {item.bobot} - {item.desc}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
