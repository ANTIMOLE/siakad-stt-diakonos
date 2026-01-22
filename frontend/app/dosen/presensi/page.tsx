/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { presensiAPI } from '@/lib/api';
import { KelasMK } from '@/types/model';

export default function DosenPresensiDashboard() {
  const router = useRouter();
  
  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DOSEN CLASSES
  // ============================================
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await presensiAPI.getDosenClasses();
        
        if (response.success) {
          setKelasList(response.data || []);
        } else {
          setError(response.message || 'Gagal memuat data kelas');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleOpenKelas = (kelasMKId: number) => {
    router.push(`/dosen/presensi/${kelasMKId}`);
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat kelas Anda..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && kelasList.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (kelasList.length === 0) {
    return (
      <div>
        <PageHeader
          title="Presensi Mahasiswa"
          description="Kelola kehadiran mahasiswa di kelas Anda"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dosen/dashboard' },
            { label: 'Presensi' },
          ]}
        />
        <EmptyState
          title="Tidak Ada Kelas"
          description="Anda belum mengajar kelas di semester ini"
        />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Presensi Mahasiswa"
        description="Kelola kehadiran mahasiswa di kelas Anda"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Presensi' },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kelasList.map((kelas) => (
          <Card
            key={kelas.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleOpenKelas(kelas.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {kelas.mataKuliah?.namaMK}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {kelas.mataKuliah?.kodeMK} • {kelas.mataKuliah?.sks} SKS
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 ml-2">
                  {kelas.semester?.periode}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Class Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {kelas.hari}, {kelas.jamMulai} - {kelas.jamSelesai}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {kelas._count?.krsDetail || 0} Mahasiswa
                  </span>
                </div>
                {kelas.ruangan && (
                  <div className="text-muted-foreground">
                    📍 {kelas.ruangan.nama}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {kelas._count?.presensi || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pertemuan
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {kelas._count?.presensi
                      ? Math.round(((kelas._count.presensi || 0) / 16) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Progress
                  </div>
                </div>
              </div>

              {/* Action */}
              <Button className="w-full gap-2" variant="outline">
                <CheckCircle className="h-4 w-4" />
                Kelola Presensi
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
