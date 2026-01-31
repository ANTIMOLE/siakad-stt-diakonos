/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { presensiAPI } from '@/lib/api';
import { PresensiStatsMahasiswa, StatusPresensi } from '@/types/model';

const STATUS_CONFIG: Record<
  StatusPresensi,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  HADIR: {
    label: 'Hadir',
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
  },
  ALPHA: {
    label: 'Alpha',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
  },
  IZIN: {
    label: 'Izin',
    icon: Clock,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
  },
  SAKIT: {
    label: 'Sakit',
    icon: AlertCircle,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  TIDAK_HADIR: {
    label: 'Tidak Hadir',
    icon: XCircle,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
  },
};

export default function MahasiswaPresensiDetailPage() {
  const params = useParams();
  const router = useRouter();

  const kelasMKId = parseInt(params.id as string);

  const [stats, setStats] = useState<PresensiStatsMahasiswa | null>(null);
  const [kelasInfo, setKelasInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mahasiswaId, setMahasiswaId] = useState<number | null>(null);

  // ============================================
  // GET MAHASISWA ID FROM LOCALSTORAGE
  // ============================================
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.mahasiswa?.id) {
          setMahasiswaId(user.mahasiswa.id);
        }
      } catch (err) {
        console.error('Failed to parse user:', err);
      }
    }
  }, []);

  // ============================================
  // FETCH PRESENSI STATS
  // ============================================
  useEffect(() => {
    if (!mahasiswaId || !kelasMKId) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await presensiAPI.getStatsMahasiswa(
          mahasiswaId,
          kelasMKId
        );

        if (response.success && response.data) {
          setStats(response.data);

          // Get kelas info from first detail if available
          if (response.data.detail && response.data.detail.length > 0) {
            const firstPresensi = response.data.detail[0].presensi;
            if (firstPresensi) {
              setKelasInfo({
                pertemuan: firstPresensi.pertemuan,
                materi: firstPresensi.materi,
              });
            }
          }
        } else {
          setError(response.message || 'Gagal memuat data presensi');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [mahasiswaId, kelasMKId]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data presensi..." />
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
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // NO DATA STATE
  // ============================================
  if (!stats) {
    return (
      <EmptyState
        title="Data Tidak Ditemukan"
        description="Tidak ada data presensi untuk kelas ini"
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  const persentase = stats.persentaseKehadiran;
  const statusColor =
    persentase >= 80
      ? 'text-green-600'
      : persentase >= 60
      ? 'text-yellow-600'
      : 'text-red-600';

  const progressColor =
    persentase >= 80
      ? 'bg-green-500'
      : persentase >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Presensi"
        description={`Riwayat kehadiran Anda di mata kuliah ini`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/mahasiswa/dashboard' },
          { label: 'Presensi', href: '/mahasiswa/presensi' },
          { label: 'Detail' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pertemuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPertemuan}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pertemuan tercatat
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Hadir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.hadir}</div>
            <p className="text-xs text-green-700 mt-1">Kehadiran tercatat</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Tidak Hadir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.alpha + stats.tidakHadir}
            </div>
            <p className="text-xs text-red-700 mt-1">
              {stats.alpha} Alpha, {stats.tidakHadir} Tidak Hadir
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Izin/Sakit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.izin + stats.sakit}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {stats.izin} Izin, {stats.sakit} Sakit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Percentage */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <TrendingUp className="h-12 w-12 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Persentase Kehadiran
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${statusColor}`}>
                  {persentase.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  ({stats.hadir} dari {stats.totalPertemuan} pertemuan)
                </span>
              </div>
              <Progress
                value={persentase}
                className={`mt-3 h-3 [&>div]:${progressColor}`}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {persentase >= 80
                  ? '✅ Kehadiran Anda sangat baik!'
                  : persentase >= 60
                  ? '⚠️ Tingkatkan kehadiran Anda'
                  : '❌ Kehadiran Anda kurang, segera konsultasi dengan dosen'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Presensi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.detail.length === 0 ? (
            <EmptyState
              title="Belum Ada Presensi"
              description="Belum ada data presensi untuk kelas ini"
              className="my-8 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pertemuan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Materi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.detail.map((detail: any) => {
                    const config = STATUS_CONFIG[detail.status as StatusPresensi];
                    const Icon = config.icon;

                    return (
                      <TableRow key={detail.id}>
                        <TableCell className="font-medium">
                          Pertemuan {detail.presensi.pertemuan}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(detail.presensi.tanggal),
                            'dd MMM yyyy',
                            { locale: id }
                          )}
                        </TableCell>
                        <TableCell>
                          {detail.presensi.materi || (
                            <span className="text-muted-foreground italic">
                              Tidak ada materi
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.bgColor}>
                            <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                            <span className={config.color}>{config.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {detail.keterangan || (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}