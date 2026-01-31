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
import { BookOpen, FileText, Calendar, Clock, Users, ArrowRight, User } from 'lucide-react';

import { presensiAPI } from '@/lib/api';
import { KelasMK } from '@/types/model';

export default function MahasiswaMateriKelasPage() {
  const router = useRouter();
  const [kelasList, setKelasList] = useState<KelasMK[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');

  const fetchKelas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ FIXED: Use presensi API to get enrolled classes
      const response = await presensiAPI.getMahasiswaClasses();

      if (response.success && response.data) {
        setKelasList(response.data);
      } else {
        setError(response.message || 'Gagal memuat data kelas');
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
  }, []);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  const handleRetry = () => {
    fetchKelas();
  };

  const handleViewKelas = (kelasId: number) => {
    router.push(`/mahasiswa/kelas-mk-files/${kelasId}`);
  };

  // Filter by search and semester
  const filteredKelas = kelasList.filter((kelas) => {
    const matchSearch = searchQuery
      ? kelas.mataKuliah?.namaMK.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kelas.mataKuliah?.kodeMK.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchSemester =
      semesterFilter === 'ALL' ||
      (kelas.semester &&
        `${kelas.semester.tahunAkademik}-${kelas.semester.periode}` === semesterFilter);

    return matchSearch && matchSemester;
  });

  // Get unique semesters for filter
  const uniqueSemesters = Array.from(
    new Set(
      kelasList
        .filter((kelas) => kelas.semester)
        .map((kelas) => `${kelas.semester!.tahunAkademik}-${kelas.semester!.periode}`)
    )
  ).map((key) => {
    const [tahun, periode] = key.split('-');
    return { key, label: `${tahun} ${periode}` };
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Materi & Dokumen Kelas</h1>
        <p className="text-sm text-muted-foreground">
          Akses RPS, RPP, dan materi pembelajaran untuk kelas Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <SearchBar
              placeholder="Cari mata kuliah..."
              onSearch={setSearchQuery}
              defaultValue={searchQuery}
            />

            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Semester</SelectItem>
                {uniqueSemesters.map((sem) => (
                  <SelectItem key={sem.key} value={sem.key}>
                    {sem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKelas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak Ada Kelas"
              description={
                searchQuery || semesterFilter !== 'ALL'
                  ? 'Tidak ada kelas yang sesuai dengan filter'
                  : 'Anda belum terdaftar di kelas apapun'
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
                            <User className="h-4 w-4" />
                            <span>{kelas.dosen?.namaLengkap}</span>
                          </div>
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
                            Lihat materi
                          </Badge>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleViewKelas(kelas.id)}
                        variant="outline"
                        className="gap-2"
                      >
                        Lihat Materi
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