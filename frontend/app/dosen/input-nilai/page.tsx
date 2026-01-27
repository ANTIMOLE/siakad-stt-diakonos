/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// EXTENDED TYPE
// ============================================
interface KelasMKWithNilai extends KelasMK {
  isNilaiFinalized?: boolean;
}

export default function InputNilaiPage() {
  const router = useRouter();
  
  // ✅ GET LOGGED-IN DOSEN
  const { user, isLoading: isAuthLoading } = useAuth('DOSEN');

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [kelasList, setKelasList] = useState<KelasMKWithNilai[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  // ============================================
  // FETCH ACTIVE SEMESTER & KELAS
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
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

        // 1. Get active semester
        const semesterResponse = await semesterAPI.getAll();
        if (!semesterResponse.success || !semesterResponse.data) {
          throw new Error('Gagal memuat semester');
        }

        const active = semesterResponse.data.find(s => s.isActive);
        if (!active) {
          throw new Error('Tidak ada semester aktif');
        }
        setActiveSemester(active);

        // 2. Get kelas for this dosen in active semester
        const kelasResponse = await kelasMKAPI.getAll({
          semester_id: active.id,     // ✅ ONLY ACTIVE SEMESTER
          dosenId: user.dosen.id,    // ✅ ONLY THIS DOSEN
        });

        if (kelasResponse.success && kelasResponse.data) {
          setKelasList(kelasResponse.data);
        } else {
          setError(kelasResponse.message || 'Gagal memuat daftar kelas');
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.dosen?.id) {
      fetchData();
    }
  }, [isAuthLoading, user]);

  // ============================================
  // FILTER KELAS BY SEARCH
  // ============================================
  const filteredKelas = kelasList.filter((kelas) =>
    kelas.mataKuliah?.namaMK.toLowerCase().includes(search.toLowerCase())
  );

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputNilai = (id: number) => {
    router.push(`/dosen/input-nilai/${id}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Nilai Mahasiswa"
        description={`Kelola nilai mahasiswa di kelas yang Anda ampu`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Input Nilai' },
        ]}
      />

      {/* Active Semester Info */}
      {activeSemester && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  Semester Aktif: {activeSemester.tahunAkademik}{' '}
                  {activeSemester.periode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(activeSemester.tanggalMulai).toLocaleDateString('id-ID')} -{' '}
                  {new Date(activeSemester.tanggalSelesai).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Filter */}
      <Card>
        <CardContent className="pt-6">
          <SearchBar
            placeholder="Cari mata kuliah..."
            onSearch={setSearch}
            defaultValue={search}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{kelasList.length}</div>
            <p className="text-sm text-muted-foreground">Total Kelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {kelasList.filter(k => k.isNilaiFinalized).length}
            </div>
            <p className="text-sm text-muted-foreground">Nilai Finalized</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {kelasList.filter(k => !k.isNilaiFinalized).length}
            </div>
            <p className="text-sm text-muted-foreground">Belum Finalized</p>
          </CardContent>
        </Card>
      </div>

      {/* Kelas List */}
      <Card>
        <CardContent className="p-0">
          {filteredKelas.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={search ? 'Tidak Ditemukan' : 'Tidak Ada Kelas'}
              description={
                search
                  ? 'Tidak ada kelas yang sesuai dengan pencarian'
                  : 'Anda belum mengampu kelas pada semester aktif'
              }
              className="my-8 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKelas.map((kelas) => (
                    <TableRow key={kelas.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {kelas.mataKuliah?.namaMK || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {kelas.mataKuliah?.kodeMK || '-'} •{' '}
                            {kelas.mataKuliah?.sks || 0} SKS
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{kelas.hari}</p>
                          <p className="text-muted-foreground">
                            {kelas.jamMulai} - {kelas.jamSelesai}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{kelas.ruangan?.nama || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {kelas._count?.krsDetail || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {kelas.isNilaiFinalized ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Finalized
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleInputNilai(kelas.id)}
                        >
                          {kelas.isNilaiFinalized ? 'Lihat Nilai' : 'Input Nilai'}
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