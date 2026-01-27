/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { semesterAPI, pembayaranAPI } from '@/lib/api';
import { Semester, JenisPembayaran } from '@/types/model';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================
// TYPES
// ============================================
interface KeuanganStats {
  totalPembayaran: number;
  pending: number;
  approved: number;
  rejected: number;
  totalNominal: number;
  todayStats?: {
    received: number;
    verified: number;
    rejected: number;
  };
  semesterStats?: {
    totalMahasiswa: number;
    sudahBayar: number;
    belumBayar: number;
  };
  recentActivities?: Array<{
    id: number;
    type: 'RECEIVED' | 'APPROVED' | 'REJECTED';
    mahasiswa: {
      nim: string;
      nama: string;
    };
    nominal?: number;
    catatan?: string;
    timestamp: string;
  }>;
}

interface PaymentTypeStats {
  type: JenisPembayaran;
  label: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalNominal: number;
}

// ============================================
// CONSTANTS
// ============================================
const PAYMENT_TYPE_LABELS: Record<JenisPembayaran, string> = {
  KRS: 'Pembayaran KRS',
  TENGAH_SEMESTER: 'Tengah Semester',
  PPL: 'PPL',
  SKRIPSI: 'Skripsi',
  WISUDA: 'Wisuda',
  KOMITMEN_BULANAN: 'Komitmen Bulanan',
};

export default function KeuanganDashboardPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [stats, setStats] = useState<KeuanganStats | null>(null);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [paymentTypeStats, setPaymentTypeStats] = useState<PaymentTypeStats[]>([]);
  const [selectedType, setSelectedType] = useState<JenisPembayaran | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch active semester
        const semesterResponse = await semesterAPI.getAll();
        if (semesterResponse.success && semesterResponse.data) {
          const active = semesterResponse.data.find(s => s.isActive);
          setActiveSemester(active || null);
        }

        // 2. Fetch stats PER JENIS PEMBAYARAN (sumber data utama & akurat)
        const paymentTypes: JenisPembayaran[] = [
          'KRS',
          'TENGAH_SEMESTER',
          'PPL',
          'SKRIPSI',
          'WISUDA',
          'KOMITMEN_BULANAN',
        ];

        const typeStatsPromises = paymentTypes.map(async (type) => {
          try {
            const response = await pembayaranAPI.getStats({
              jenisPembayaran: type,
            });

            if (response.success && response.data) {
              return {
                type,
                label: PAYMENT_TYPE_LABELS[type],
                total: response.data.total,
                pending: response.data.pending,
                approved: response.data.approved,
                rejected: response.data.rejected,
                totalNominal: response.data.totalNominal,
              };
            }
          } catch {
            return null;
          }
          return null;
        });

        const typeStatsResults = await Promise.all(typeStatsPromises);
        const validTypeStats = typeStatsResults.filter(
          (stat): stat is PaymentTypeStats => stat !== null
        );
        setPaymentTypeStats(validTypeStats);

        // 3. Hitung overall stats dari sum per jenis (TIDAK ADA LAGI LEGACY/MOCK)
        const overallStats: KeuanganStats = {
          totalPembayaran: validTypeStats.reduce((sum, s) => sum + s.total, 0),
          pending: validTypeStats.reduce((sum, s) => sum + s.pending, 0),
          approved: validTypeStats.reduce((sum, s) => sum + s.approved, 0),
          rejected: validTypeStats.reduce((sum, s) => sum + s.rejected, 0),
          totalNominal: validTypeStats.reduce((sum, s) => sum + s.totalNominal, 0),
          // Data tambahan (hari ini, semester, recent) sementara null → tampil "tidak ada data"
          todayStats: undefined,
          semesterStats: undefined,
          recentActivities: undefined,
        };

        setStats(overallStats);
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'RECEIVED':
        return <div className="h-2 w-2 rounded-full bg-yellow-600"></div>;
      case 'APPROVED':
        return <div className="h-2 w-2 rounded-full bg-green-600"></div>;
      case 'REJECTED':
        return <div className="h-2 w-2 rounded-full bg-red-600"></div>;
      default:
        return <div className="h-2 w-2 rounded-full bg-gray-400"></div>;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'RECEIVED':
        return 'Pembayaran baru diterima';
      case 'APPROVED':
        return 'Pembayaran disetujui';
      case 'REJECTED':
        return 'Pembayaran ditolak';
      default:
        return 'Aktivitas';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // FILTERED STATS
  // ============================================
  const displayStats =
    selectedType === 'ALL'
      ? stats
      : paymentTypeStats.find((s) => s.type === selectedType) || stats;

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
  const totalPayments = displayStats && 'totalPembayaran' in displayStats 
    ? displayStats.totalPembayaran 
    : displayStats && 'total' in displayStats 
    ? displayStats.total 
    : 0;

  const pendingPercentage =
    displayStats && totalPayments > 0
      ? ((displayStats.pending / totalPayments) * 100).toFixed(1)
      : '0';

  const approvalRate =
    displayStats && totalPayments > 0
      ? ((displayStats.approved / totalPayments) * 100).toFixed(1)
      : '0';

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Keuangan</h1>
        <p className="text-sm text-muted-foreground">
          Sistem Pengelolaan Pembayaran - STT Diakonos
        </p>
      </div>

      {/* Active Semester Info */}
      {activeSemester && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  Semester Aktif: {activeSemester.tahunAkademik}{' '}
                  {activeSemester.periode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(activeSemester.tanggalMulai), 'dd MMMM yyyy', {
                    locale: id,
                  })}{' '}
                  -{' '}
                  {format(new Date(activeSemester.tanggalSelesai), 'dd MMMM yyyy', {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Type Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Banknote className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as JenisPembayaran | 'ALL')
              }
            >
              <SelectTrigger className="w-75">
                <SelectValue placeholder="Filter Jenis Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis Pembayaran</SelectItem>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Alert */}
      {displayStats && displayStats.pending > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            Ada <span className="font-bold">{displayStats.pending}</span> pembayaran{' '}
            {selectedType !== 'ALL' && PAYMENT_TYPE_LABELS[selectedType as JenisPembayaran]}{' '}
            menunggu verifikasi
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {displayStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pembayaran
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                {selectedType !== 'ALL'
                  ? PAYMENT_TYPE_LABELS[selectedType as JenisPembayaran]
                  : 'Seluruh pembayaran'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Menunggu Verifikasi
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {displayStats.pending}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingPercentage}% dari total
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {displayStats.approved}
              </div>
              <p className="text-xs text-muted-foreground">
                {approvalRate}% approval rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {displayStats.rejected}
              </div>
              <p className="text-xs text-muted-foreground">Pembayaran invalid</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nominal</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(displayStats.totalNominal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedType !== 'ALL'
                  ? PAYMENT_TYPE_LABELS[selectedType as JenisPembayaran]
                  : 'Semua jenis'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per Jenis Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentTypeStats.map((stat) => (
              <div
                key={stat.type}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{stat.label}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-yellow-600">
                      Pending: {stat.pending}
                    </span>
                    <span className="text-xs text-green-600">
                      Approved: {stat.approved}
                    </span>
                    <span className="text-xs text-red-600">
                      Rejected: {stat.rejected}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{stat.total} transaksi</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stat.totalNominal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Pembayaran Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tidak ada data untuk hari ini (fitur ini akan ditambahkan nanti)
            </p>
          </CardContent>
        </Card>

        {/* Semester Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Semester Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tidak ada data semester aktif (fitur ini akan ditambahkan nanti)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-8">
            Belum ada aktivitas terbaru (fitur ini akan ditambahkan nanti)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}