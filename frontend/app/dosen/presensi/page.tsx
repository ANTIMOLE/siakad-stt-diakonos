/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { presensiAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';

export default function DosenPresensiDashboard() {
  const router = useRouter();
  
  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH SEMESTERS
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await semesterAPI.getAll();
        
        if (response.success) {
          const semesters = response.data || [];
          setSemesterList(semesters);
          
          // ✅ Auto-select active semester
          const activeSemester = semesters.find((s) => s.isActive);
          if (activeSemester) {
            setSelectedSemesterId(activeSemester.id);
          } else if (semesters.length > 0) {
            // Fallback to most recent
            setSelectedSemesterId(semesters[0].id);
          }
        }
      } catch (err: any) {
        console.error('Fetch semesters error:', err);
        // Don't show error toast, just log it
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH DOSEN CLASSES
  // ============================================
  useEffect(() => {
    if (selectedSemesterId === null) return;

    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // ✅ Pass semesterId as query param
        const response = await presensiAPI.getDosenClasses({
          semesterId: selectedSemesterId,
        });
        
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
  }, [selectedSemesterId]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleOpenKelas = (kelasMKId: number) => {
    router.push(`/dosen/presensi/${kelasMKId}`);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemesterId(parseInt(value));
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
  // RENDER
  // ============================================
  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presensi Mahasiswa"
        description="Kelola kehadiran mahasiswa di kelas Anda"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Presensi' },
        ]}
        actions={
          semesterList.length > 0 && (
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedSemesterId?.toString()}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterList.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>
                          {semester.tahunAkademik} - {semester.periode}
                        </span>
                        {semester.isActive && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Aktif
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      {/* Semester Info */}
      {selectedSemester && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Menampilkan kelas untuk semester
                </p>
                <p className="text-lg font-semibold">
                  {selectedSemester.tahunAkademik} - {selectedSemester.periode}
                </p>
              </div>
              {selectedSemester.isActive && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Semester Aktif
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EMPTY STATE */}
      {kelasList.length === 0 ? (
        <EmptyState
          title="Tidak Ada Kelas"
          description={`Anda tidak mengajar kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`}
        />
      ) : (
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
      )}
    </div>
  );
}