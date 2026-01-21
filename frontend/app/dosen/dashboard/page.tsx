/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, BookOpen, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { dashboardAPI } from '@/lib/api';
import { DosenDashboardStats } from '@/types/model';

export default function DosenDashboardPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [stats, setStats] = useState<DosenDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DASHBOARD DATA
  // ============================================
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardAPI.getDosenStats();

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.message || 'Gagal memuat dashboard');
        }
      } catch (err: any) {
        console.error('Fetch dashboard error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat dashboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ============================================
  // RETRY HANDLER
  // ============================================
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
        message={error || 'Terjadi kesalahan'}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Dosen</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di Sistem Informasi Akademik STT Diakonos
        </p>
      </div>

      {/* Semester Aktif Info */}
      {stats.semesterAktif && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  Semester Aktif: {stats.semesterAktif.tahunAkademik}{' '}
                  {stats.semesterAktif.periode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(stats.semesterAktif.tanggalMulai).toLocaleDateString('id-ID')} -{' '}
                  {new Date(stats.semesterAktif.tanggalSelesai).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Mahasiswa Bimbingan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mahasiswa Bimbingan
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMahasiswaBimbingan}
            </div>
            <p className="text-xs text-muted-foreground">
              Total mahasiswa yang dibimbing
            </p>
          </CardContent>
        </Card>

        {/* Mahasiswa Aktif */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mahasiswa Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.mahasiswaAktif}
            </div>
            <p className="text-xs text-muted-foreground">
              Mahasiswa dengan status aktif
            </p>
          </CardContent>
        </Card>

        {/* KRS Pending Approval */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              KRS Pending
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.krsPendingApproval}
            </div>
            <p className="text-xs text-muted-foreground">
              Menunggu approval Anda
            </p>
          </CardContent>
        </Card>

        {/* Kelas Mengajar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kelas Mengajar
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalKelasMengajar}
            </div>
            <p className="text-xs text-muted-foreground">
              Mata kuliah semester ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jadwal Hari Ini */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Jadwal Mengajar Hari Ini</CardTitle>
            </div>
            <Link href="/dosen/jadwal">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Lihat Semua
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.jadwalHariIni && stats.jadwalHariIni.length > 0 ? (
            <div className="space-y-3">
              {stats.jadwalHariIni.map((kelas) => (
                <div
                  key={kelas.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {kelas.mataKuliah?.namaMK || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {kelas.mataKuliah?.kodeMK || '-'} •{' '}
                      {kelas.mataKuliah?.sks || 0} SKS
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {kelas.hari} • {kelas.jamMulai} - {kelas.jamSelesai} •{' '}
                      {kelas.ruangan?.nama || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {kelas._count?.krsDetail || 0} Mahasiswa
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Tidak ada jadwal hari ini"
              description="Anda tidak memiliki jadwal mengajar hari ini"
              className="my-8 border-0"
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* KRS Approval */}
        <Link href="/dosen/krs-approval">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Review KRS Mahasiswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.krsPendingApproval > 0 ? (
                  <>
                    <span className="font-semibold text-yellow-600">
                      {stats.krsPendingApproval} KRS
                    </span>{' '}
                    menunggu approval dari Anda
                  </>
                ) : (
                  'Semua KRS mahasiswa bimbingan sudah diproses'
                )}
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Lihat KRS Pending
                <span className="ml-2">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Input Nilai */}
        <Link href="/dosen/input-nilai">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Input Nilai Mahasiswa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Input dan kelola nilai untuk {stats.totalKelasMengajar} kelas yang Anda
                ampu semester ini
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Input Nilai
                <span className="ml-2">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mahasiswa Bimbingan */}
      <Link href="/dosen/mahasiswa-bimbingan">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mahasiswa Bimbingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total {stats.totalMahasiswaBimbingan} mahasiswa •{' '}
                  {stats.mahasiswaAktif} aktif
                </p>
                <div className="flex items-center text-sm font-medium text-primary">
                  Lihat Daftar Mahasiswa
                  <span className="ml-2">→</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
