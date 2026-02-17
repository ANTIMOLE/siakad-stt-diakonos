/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, Calendar, Clock, Users, ExternalLink, Filter, CheckCircle } from 'lucide-react';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { useAuth } from '@/hooks/useAuth';

export default function DosenMateriKelasPage() {
  const router = useRouter();
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
        
        if (response?.data) {
          const semesters = response.data || [];
          setSemesterList(semesters);
          
          const activeSemester = semesters.find((s) => s.isActive);
          if (activeSemester) {
            setSelectedSemesterId(activeSemester.id);
          } else if (semesters.length > 0) {
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
  // FETCH KELAS
  // ============================================
  const fetchKelas = useCallback(async () => {
    if (selectedSemesterId === null || isAuthLoading || !user?.dosen?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await kelasMKAPI.getAll({
        semester_id: selectedSemesterId,
        dosenId: user.dosen.id,
        limit: 1000,
      });

      if (response?.data) {
        setKelasList(response.data);
      } else {
        setError('Gagal memuat data kelas');
      }
    } catch (err: any) {
      console.error('Fetch kelas error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemesterId, isAuthLoading, user]);

  useEffect(() => {
    if (!isAuthLoading && user?.dosen?.id) {
      fetchKelas();
    }
  }, [fetchKelas, isAuthLoading, user]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const selectedSemester = useMemo(
    () => semesterList.find((s) => s.id === selectedSemesterId),
    [semesterList, selectedSemesterId]
  );

  const filteredKelas = useMemo(() => {
    if (!searchQuery) return kelasList;
    
    return kelasList.filter((kelas) => {
      const namaMK = kelas.mataKuliah?.namaMK.toLowerCase() || '';
      const kodeMK = kelas.mataKuliah?.kodeMK.toLowerCase() || '';
      return namaMK.includes(searchQuery.toLowerCase()) || 
             kodeMK.includes(searchQuery.toLowerCase());
    });
  }, [kelasList, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleViewKelas = useCallback(
    (kelasId: number) => {
      router.push(`/dosen/kelas-mk-files/${kelasId}`);
    },
    [router]
  );

  const handleSemesterChange = useCallback((value: string) => {
    setSelectedSemesterId(parseInt(value));
  }, []);

  const handleRetry = useCallback(() => {
    fetchKelas();
  }, [fetchKelas]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
      </div>
    );
  }

  if (!user?.dosen?.id) {
    return (
      <ErrorState
        title="Data Dosen Tidak Ditemukan"
        message="Tidak dapat memuat data kelas. Data dosen tidak tersedia."
        onRetry={handleRetry}
      />
    );
  }

  if (error && kelasList.length === 0) {
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materi & Dokumen Kelas</h1>
          <p className="text-sm text-muted-foreground">
            Kelola RPS, RPP, dan materi pembelajaran untuk kelas Anda
          </p>
        </div>
        
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

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <SearchBar
            placeholder="Cari mata kuliah..."
            onSearch={setSearchQuery}
            defaultValue={searchQuery}
          />
        </CardHeader>
        <CardContent className="p-0">
          {filteredKelas.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={BookOpen}
                title="Tidak Ada Kelas"
                description={
                  searchQuery
                    ? 'Tidak ada kelas yang sesuai dengan pencarian'
                    : `Anda tidak mengajar kelas di semester ${selectedSemester?.tahunAkademik} ${selectedSemester?.periode}`
                }
                className="border-0"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-center">Mahasiswa</TableHead>
                    <TableHead className="text-center w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKelas.map((kelas, index) => (
                    <TableRow
                      key={kelas.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewKelas(kelas.id)}
                    >
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">{kelas.mataKuliah?.namaMK}</p>
                          <p className="text-xs text-muted-foreground">
                            {kelas.mataKuliah?.kodeMK}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {kelas.mataKuliah?.sks} SKS
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p>{kelas.hari}</p>
                            <p className="text-xs text-muted-foreground">
                              {kelas.jamMulai}-{kelas.jamSelesai}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {kelas.ruangan?.nama || '-'}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {kelas._count?.krsDetail || 0}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewKelas(kelas.id);
                          }}
                        >
                          Kelola
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
