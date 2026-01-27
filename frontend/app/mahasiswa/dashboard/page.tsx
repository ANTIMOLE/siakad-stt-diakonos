/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Award, 
  Calendar, 
  BookOpen, 
  AlertCircle,
  Clock,
  CheckCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';

import { dashboardAPI } from '@/lib/api';
import { MahasiswaDashboardStats } from '@/types/model';

export default function MahasiswaDashboardPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [stats, setStats] = useState<MahasiswaDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('');

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

  const formatScore = (value: any): string => {
    const num = toNumber(value);
    return num !== null ? num.toFixed(2) : '-';
  };

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    // Get current day in Indonesian
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = new Date().getDay();
    setCurrentDay(days[today]);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardAPI.getMahasiswaStats();
        
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          throw new Error(response.message || 'Gagal memuat data dashboard');
        }
      } catch (err: any) {
        console.error('Fetch dashboard error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data dashboard'
        );
        toast.error('Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const getKRSStatusInfo = (status?: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'KRS Belum Disubmit',
          description: 'Lengkapi dan submit KRS Anda',
          variant: 'warning' as const,
        };
      case 'SUBMITTED':
        return {
          label: 'Menunggu Approval',
          description: 'KRS sedang ditinjau dosen wali',
          variant: 'info' as const,
        };
      case 'APPROVED':
        return {
          label: 'KRS Disetujui',
          description: 'KRS Anda sudah disetujui',
          variant: 'success' as const,
        };
      case 'REJECTED':
        return {
          label: 'KRS Ditolak',
          description: 'Revisi KRS Anda',
          variant: 'error' as const,
        };
      default:
        return {
          label: 'Belum Ada KRS',
          description: 'Buat KRS untuk semester ini',
          variant: 'default' as const,
        };
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat dashboard..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !stats) {
    return (
      <ErrorState
        title="Gagal Memuat Dashboard"
        message={error || 'Data tidak tersedia'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const krsInfo = getKRSStatusInfo(stats.krsStatus);
  const hasJadwalToday = stats.jadwalHariIni && stats.jadwalHariIni.length > 0;
  const ipsNum = toNumber(stats.ips);
  const ipkNum = toNumber(stats.ipk);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang, {stats.nama}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stats.nim} • {stats.prodi} • Angkatan {stats.angkatan}
        </p>
      </div>

      {/* KRS Status Alert */}
      {stats.krsStatus === 'DRAFT' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            KRS Anda belum disubmit. Segera lengkapi dan submit KRS untuk semester ini.
            <Link href="/mahasiswa/krs">
              <Button variant="link" className="h-auto p-0 ml-1 text-yellow-700 underline">
                Submit sekarang
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {stats.krsStatus === 'REJECTED' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            KRS Anda ditolak. Silakan perbaiki dan submit ulang.
            <Link href="/mahasiswa/krs">
              <Button variant="link" className="h-auto p-0 ml-1 text-red-700 underline">
                Lihat detail
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card */}
      <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Dosen Wali</p>
              <p className="font-medium">{stats.dosenWali || 'Belum ditentukan'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total SKS Lulus</p>
              <p className="font-medium">{stats.totalSKSLulus} SKS</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status KRS</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <StatusBadge status={stats.krsStatus || 'DRAFT'} showIcon />
            <p className="text-xs text-muted-foreground mt-2">
              {krsInfo.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKS</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSKSLulus}</div>
            <p className="text-xs text-muted-foreground">SKS yang telah lulus</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPS</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatScore(stats.ips)}
            </div>
            <p className="text-xs text-muted-foreground">Indeks Prestasi Semester</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPK</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatScore(stats.ipk)}
            </div>
            <p className="text-xs text-muted-foreground">Indeks Prestasi Kumulatif</p>
          </CardContent>
        </Card>
      </div>

      {/* Jadwal Hari Ini */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Jadwal Hari Ini</CardTitle>
            </div>
            <Badge variant="outline">{currentDay}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {hasJadwalToday ? (
            <div className="space-y-3">
              {stats.jadwalHariIni!.map((kelas) => (
                <div
                  key={kelas.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {kelas.mataKuliah?.namaMK}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {kelas.jamMulai} - {kelas.jamSelesai}
                        </Badge>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {kelas.ruangan?.nama}
                        </span>
                      </div>
                      {kelas.dosen && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {kelas.dosen.namaLengkap}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                Tidak ada jadwal kuliah hari ini
              </p>
              <Link href="/mahasiswa/jadwal">
                <Button variant="link" className="mt-2">
                  Lihat jadwal lengkap →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Kartu Rencana Studi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.krsStatus === 'APPROVED' 
                ? 'Lihat detail KRS yang sudah disetujui'
                : 'Buat atau edit KRS semester ini'}
            </p>
            <Link href="/mahasiswa/krs">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                {stats.krsStatus === 'DRAFT' ? 'Buat KRS' : 'Lihat KRS'} →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Kartu Hasil Studi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lihat nilai dan transkrip akademik
            </p>
            <Link href="/mahasiswa/khs">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Lihat KHS →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Jadwal Kuliah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lihat jadwal kuliah mingguan lengkap
            </p>
            <Link href="/mahasiswa/jadwal">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Lihat Jadwal →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Academic Progress */}
      {(ipkNum !== null || ipsNum !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Progress Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <p className="text-sm text-muted-foreground mb-1">SKS Lulus</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalSKSLulus}
                </p>
                <p className="text-xs text-muted-foreground mt-1">dari ~144 SKS</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <p className="text-sm text-muted-foreground mb-1">IPK</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatScore(stats.ipk)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Kumulatif</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50">
                <p className="text-sm text-muted-foreground mb-1">Predikat</p>
                <p className="text-2xl font-bold text-purple-600">
                  {ipkNum !== null
                    ? ipkNum >= 3.5
                      ? 'Cum Laude'
                      : ipkNum >= 3.0
                      ? 'Memuaskan'
                      : 'Baik'
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Berdasarkan IPK
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}