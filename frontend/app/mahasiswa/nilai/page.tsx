/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BookOpen, Award, TrendingUp, Info } from 'lucide-react';
import { toast } from 'sonner';

import { khsAPI } from '@/lib/api';
import { KHS, Nilai } from '@/types/model';

interface NilaiGroup {
  semester: {
    tahunAkademik: string;
    periode: string;
  };
  nilai: Nilai[];
  ips: number;
  totalSKS: number;
}

export default function NilaiPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [khsList, setKhsList] = useState<KHS[]>([]);
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

        // Fetch all KHS (which should include nilai data)
        const response = await khsAPI.getAll();

        if (response.success && response.data) {
          // Sort by newest first
          const sorted = response.data.sort((a, b) => {
            return (
              b.semester?.tahunAkademik.localeCompare(a.semester?.tahunAkademik || '') ||
              (b.semester?.periode === 'GANJIL' ? -1 : 1)
            );
          });
          setKhsList(sorted);
        }
      } catch (err: any) {
        console.error('Fetch nilai error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data nilai'
        );
        toast.error('Gagal memuat data nilai');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const getGradeColor = (nilaiHuruf: string | null) => {
    if (!nilaiHuruf) return 'bg-gray-100 text-gray-700';
    
    if (['A', 'AB'].includes(nilaiHuruf)) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (['B', 'BC'].includes(nilaiHuruf)) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    } else if (['C', 'CD'].includes(nilaiHuruf)) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    } else if (['D', 'DE'].includes(nilaiHuruf)) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    } else {
      return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  // Note: Since nilai data might not be available in KHS response,
  // we'll need a separate API call to get nilai details
  // For now, we'll work with available KHS data
  
  const totalMataKuliah = khsList.reduce((sum, khs) => sum + khs.totalSKSSemester, 0) / 3; // Rough estimate
  const totalLulus = khsList.reduce((sum, khs) => sum + khs.totalSKSKumulatif, 0);
  const latestIPK = khsList.length > 0 ? khsList[0].ipk : 0;

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data nilai..." />
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
        title="Daftar Nilai"
        description="Riwayat nilai semua mata kuliah yang telah Anda ambil"
      />

      {/* No Data Alert */}
      {khsList.length === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Belum ada nilai yang tersedia. Nilai akan muncul setelah dosen menginput dan memfinalisasi nilai.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      {khsList.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Semester</p>
                  <p className="text-2xl font-bold">{khsList.length}</p>
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
                  <p className="text-sm text-muted-foreground">Total SKS Lulus</p>
                  <p className="text-2xl font-bold">
                    {khsList[0]?.totalSKSKumulatif || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IPK Terakhir</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {latestIPK.toFixed(2)}
                  </p>
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
                  <p className="text-lg font-bold text-yellow-700">
                    {latestIPK >= 3.5
                      ? 'Cum Laude'
                      : latestIPK >= 3.0
                      ? 'Memuaskan'
                      : 'Baik'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nilai by Semester */}
      {khsList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={BookOpen}
              title="Belum Ada Nilai"
              description="Nilai Anda akan muncul setelah dosen menginput dan memfinalisasi nilai"
              className="border-0"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {khsList.map((khs) => (
            <Card key={khs.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {khs.semester?.tahunAkademik || '-'} {khs.semester?.periode || '-'}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">IPS</p>
                      <p className="text-lg font-bold text-blue-600">
                        {khs.ips.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">SKS</p>
                      <p className="text-lg font-bold text-green-600">
                        {khs.totalSKSSemester}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900 text-sm">
                    Detail nilai per mata kuliah akan tersedia setelah sistem diintegrasikan dengan data nilai.
                    Saat ini hanya menampilkan ringkasan per semester.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">IPS Semester</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {khs.ips.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">IPK Kumulatif</p>
                    <p className="text-2xl font-bold text-green-600">
                      {khs.ipk.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total SKS</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {khs.totalSKSKumulatif}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Grade Legend */}
      {khsList.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sistem Penilaian STT Diakonos
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200">A</Badge>
                <span className="text-blue-700">: 4.00 (Sangat Baik)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200">AB</Badge>
                <span className="text-blue-700">: 3.50 (Baik)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">B</Badge>
                <span className="text-blue-700">: 3.00 (Cukup Baik)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">BC</Badge>
                <span className="text-blue-700">: 2.50 (Cukup)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">C</Badge>
                <span className="text-blue-700">: 2.00 (Kurang)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">CD</Badge>
                <span className="text-blue-700">: 1.50 (Kurang)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">D</Badge>
                <span className="text-blue-700">: 1.00 (Sangat Kurang)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 border-red-200">E</Badge>
                <span className="text-blue-700">: 0.00 (Gagal)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Progress */}
      {khsList.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Perkembangan Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {khsList.map((khs, index) => {
                const prevKHS = khsList[index + 1];
                const trend = prevKHS ? khs.ips - prevKHS.ips : null;
                
                return (
                  <div
                    key={khs.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {khs.semester?.tahunAkademik} {khs.semester?.periode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {khs.totalSKSSemester} SKS
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">IPS</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold">{khs.ips.toFixed(2)}</p>
                          {trend !== null && (
                            <Badge
                              variant="outline"
                              className={
                                trend >= 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">IPK</p>
                        <p className="text-lg font-bold">{khs.ipk.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
