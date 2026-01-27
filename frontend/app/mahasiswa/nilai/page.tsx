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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Award, Download, FileText, TrendingUp, Info, BookOpen } from 'lucide-react';
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

export default function TranskripPage() {
  // ============================================
  // HELPERS - Convert Decimal to Number
  // ============================================
  const toNumber = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    // Handle Prisma Decimal
    if (typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    // Try to convert to number
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const formatScore = (value: any, decimals: number = 2): string => {
    const num = toNumber(value);
    return num !== null ? num.toFixed(decimals) : '-';
  };

  // ============================================
  // AMBIL USER DARI LOCALSTORAGE
  // ============================================
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

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [transkrip, setTranskrip] = useState<TranskripData | null>(null);
  const [groupedNilai, setGroupedNilai] = useState<Record<string, Nilai[]>>({});
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
          const data = response.data as TranskripData;

          // Group nilai by semester (tahunAkademik + periode)
          const grouped: Record<string, Nilai[]> = {};
          data.nilai.forEach((n) => {
            if (!n.kelasMK?.semester) return;
            const key = `${n.kelasMK.semester.tahunAkademik} ${n.kelasMK.semester.periode === 'GANJIL' ? 'Ganjil' : 'Genap'}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(n);
          });

          // Sort groups by semester (newest first)
          const sortedGroups = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

          setTranskrip(data);
          setGroupedNilai(Object.fromEntries(sortedGroups));
        } else {
          setTranskrip(null);
          setGroupedNilai({});
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
  // DOWNLOAD PDF TRANSKRIP
  // ============================================
  const handleDownloadTranskrip = async () => {
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
  };

  // ============================================
  // GRADE COLOR
  // ============================================
  const getGradeColor = (huruf: string | null) => {
    if (!huruf) return 'bg-gray-100 text-gray-700';
    if (['A', 'AB'].includes(huruf)) return 'bg-green-100 text-green-700 border-green-300';
    if (['B', 'BC'].includes(huruf)) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (['C', 'CD'].includes(huruf)) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    if (['D', 'DE'].includes(huruf)) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

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
        onRetry={() => (window.location.href = '/login')}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Memuat transkrip nilai..." />;
  }

  if (error) {
    return <ErrorState title="Error" message={error} onRetry={() => window.location.reload()} />;
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Semester</p>
                <p className="text-2xl font-bold">{transkrip.summary.totalSemester}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPK Akhir</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatScore(transkrip.summary.finalIPK)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total SKS Lulus</p>
                <p className="text-2xl font-bold">{transkrip.summary.totalSKS}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Predikat</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {transkrip.summary.predikat || 'Belum tersedia'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daftar Nilai per Semester */}
      {Object.entries(groupedNilai).map(([semesterKey, nilaiList]) => (
        <Card key={semesterKey}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{semesterKey}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {nilaiList.length} mata kuliah •{' '}
                {nilaiList.reduce((sum, n) => sum + (n.kelasMK?.mataKuliah?.sks || 0), 0)} SKS
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
                    <TableHead className="text-center">Nilai Angka</TableHead>
                    <TableHead className="text-center">Huruf</TableHead>
                    <TableHead className="text-center">Bobot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nilaiList.map((nilai, idx) => (
                    <TableRow key={nilai.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-mono">
                        {nilai.kelasMK?.mataKuliah?.kodeMK || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {nilai.kelasMK?.mataKuliah?.namaMK || '-'}
                      </TableCell>
                      <TableCell>{nilai.kelasMK?.dosen?.namaLengkap || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {nilai.kelasMK?.mataKuliah?.sks || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatScore(nilai.nilaiAngka)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`font-bold ${getGradeColor(nilai.nilaiHuruf)}`}>
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

      {/* Legend Nilai */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-blue-900 mb-4 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Legenda Nilai Huruf
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { huruf: 'A', bobot: '4.00', desc: 'Sangat Baik' },
              { huruf: 'AB', bobot: '3.50', desc: 'Baik Sekali' },
              { huruf: 'B', bobot: '3.00', desc: 'Baik' },
              { huruf: 'BC', bobot: '2.50', desc: 'Cukup Baik' },
              { huruf: 'C', bobot: '2.00', desc: 'Cukup' },
              { huruf: 'CD', bobot: '1.50', desc: 'Kurang' },
              { huruf: 'D', bobot: '1.00', desc: 'Kurang Sekali' },
              { huruf: 'E', bobot: '0.00', desc: 'Gagal' },
            ].map((item) => (
              <div key={item.huruf} className="flex items-center gap-3">
                <Badge className={`font-bold ${getGradeColor(item.huruf)}`}>
                  {item.huruf}
                </Badge>
                <div className="text-sm text-blue-700">
                  <span className="font-medium">{item.bobot}</span> - {item.desc}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}