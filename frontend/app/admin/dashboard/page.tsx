/**
 * Admin Dashboard Page
 * ✅ Full Backend Integration - Real Stats from API
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { dashboardAPI } from '@/lib/api';
import { AdminDashboardStats } from '@/types/model';

export default function AdminDashboardPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DASHBOARD STATS
  // ============================================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dashboardAPI.getAdminStats();
        // ✅ response SUDAH ApiResponse (auto-unwrap dari interceptor)

       if (response.success && response.data) {  // ✅ Check data exists
          setStats(response.data);
        } else {
          setError(response.message || 'Gagal memuat data dashboard');
        }
      } catch (err: any) {
        console.error('Fetch dashboard stats error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data dashboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Dashboard"
        message={error}
        onRetry={() => window.location.reload()}
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di Sistem Informasi Akademik STT Diakonos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Mahasiswa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mahasiswa
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMahasiswa || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.mahasiswaAktif || 0} mahasiswa aktif
            </p>
          </CardContent>
        </Card>

        {/* Total Dosen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dosen
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDosen || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.dosenAktif || 0} dosen aktif
            </p>
          </CardContent>
        </Card>

        {/* Mata Kuliah */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mata Kuliah
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMataKuliah || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.mataKuliahAktif || 0} mata kuliah aktif
            </p>
          </CardContent>
        </Card>

        {/* KRS Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              KRS Pending
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.krsPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Semester Aktif */}
      {stats?.semesterAktif && (
        <Card>
          <CardHeader>
            <CardTitle>Semester Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tahun Akademik:</span>
                <span className="text-sm">{stats.semesterAktif.tahunAkademik}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Periode:</span>
                <span className="text-sm">{stats.semesterAktif.periode}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user} • {new Date(activity.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas terbaru.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}