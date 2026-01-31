/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, FileText, Calendar, Clock, Users, ArrowRight, Filter, CheckCircle } from 'lucide-react';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { useAuth } from '@/hooks/useAuth'; // ✅ ADDED

export default function DosenMateriKelasPage() {
  const router = useRouter();
  
  // ✅ GET LOGGED-IN DOSEN
  const { user, isLoading: isAuthLoading } = useAuth('DOSEN');
  
  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // ============================================
  // FETCH SEMESTERS
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await semesterAPI.getAll();
        
        if (response && response.data) {
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
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH KELAS BY SEMESTER & DOSEN
  // ============================================
  const fetchKelas = useCallback(async () => {
    if (selectedSemesterId === null) return;

    // ✅ WAIT FOR AUTH
    if (isAuthLoading) {
      return;
    }

    // ✅ CHECK IF DOSEN DATA EXISTS
    if (!user?.dosen?.id) {
      setError('Data dosen tidak ditemukan');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ✅ FIXED: Filter by BOTH semester_id AND dosenId
      const response = await kelasMKAPI.getAll({
        semester_id: selectedSemesterId, // ✅ Filter semester
        dosenId: user.dosen.id,          // ✅ CRITICAL: Filter by dosen!
        limit: 1000,
      });

      if (response && response.data) {
        setKelasList(response.data);
      } else {
        setError('Gagal memuat data kelas');
      }
    } catch (err: any) {
      console.error('Fetch kelas error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data kelas'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemesterId, isAuthLoading, user]);

  useEffect(() => {
    if (!isAuthLoading && user?.dosen?.id) {
      fetchKelas();
    }
  }, [fetchKelas, isAuthLoading, user]);

  const handleRetry = () => {
    fetchKelas();
  };

  const handleViewKelas = (kelasId: number) => {
    router.push(`/dosen/kelas-mk-files/${kelasId}`);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemesterId(parseInt(value));
  };

  // Filter by search only (semester & dosen already filtered by API)
  const filteredKelas = kelasList.filter((kelas) => {
    if (!searchQuery) return true;
    
    const matchSearch =
      kelas.mataKuliah?.namaMK.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kelas.mataKuliah?.kodeMK.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSearch;
  });

  // ============================================
  // LOADING STATE
  // ============================================
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE - NO DOSEN DATA
  // ============================================
  if (!user?.dosen?.id) {
    return (
      <ErrorState
        title="Data Dosen Tidak Ditemukan"
        message="Tidak dapat memuat data kelas. Data dosen tidak tersedia."
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // ERROR STATE - FETCH ERROR
  // ============================================
  if (error && kelasList.length === 0) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materi & Dokumen Kelas</h1>
          <p className="text-sm text-muted-foreground">
            Kelola RPS, RPP, dan materi pembelajaran untuk kelas Anda
          </p>
        </div>
        
        {/* Semester Filter */}
        {semesterList.length > 0 && (
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
        )}
      </div>

      {/* Semester Info Card */}
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

      <Card>
        <CardHeader>
          <SearchBar
            placeholder="Cari mata kuliah..."
            onSearch={setSearchQuery}
            defaultValue={searchQuery}
          />
        </CardHeader>
        <CardContent>
          {filteredKelas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak Ada Kelas"
              description={
                searchQuery
                  ? 'Tidak ada kelas yang sesuai dengan pencarian'
                  : `Anda tidak mengajar kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`
              }
              className="my-8 border-0"
            />
          ) : (
            <div className="grid gap-4">
              {filteredKelas.map((kelas) => (
                <Card key={kelas.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {kelas.mataKuliah?.namaMK}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {kelas.mataKuliah?.kodeMK} • {kelas.mataKuliah?.sks} SKS
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {kelas.semester?.tahunAkademik} {kelas.semester?.periode}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {kelas.hari}, {kelas.jamMulai}-{kelas.jamSelesai}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{kelas.ruangan?.nama}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {kelas._count?.krsDetail || 0} mahasiswa
                          </Badge>
                        </div>
                      </div>

                      <Button onClick={() => handleViewKelas(kelas.id)} className="gap-2">
                        Kelola Materi
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}