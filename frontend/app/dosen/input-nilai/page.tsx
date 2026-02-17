/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

import { kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester } from '@/types/model';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// TYPES
// ============================================
interface KelasMKWithNilai extends KelasMK {
  isNilaiFinalized?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID');
};

const filterKelasBySearch = (kelasList: KelasMKWithNilai[], search: string): KelasMKWithNilai[] => {
  if (!search) return kelasList;
  return kelasList.filter((kelas) =>
    kelas.mataKuliah?.namaMK.toLowerCase().includes(search.toLowerCase())
  );
};

const calculateStats = (kelasList: KelasMKWithNilai[]) => ({
  total: kelasList.length,
  finalized: kelasList.filter(k => k.isNilaiFinalized).length,
  draft: kelasList.filter(k => !k.isNilaiFinalized).length,
});

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ value, label, color }: { value: number; label: string; color?: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

// ============================================
// KELAS ROW COMPONENT
// ============================================
const KelasRow = ({
  kelas,
  onInputNilai,
}: {
  kelas: KelasMKWithNilai;
  onInputNilai: (id: number) => void;
}) => (
  <TableRow>
    <TableCell>
      <div>
        <p className="font-medium">{kelas.mataKuliah?.namaMK || 'N/A'}</p>
        <p className="text-xs text-muted-foreground">
          {kelas.mataKuliah?.kodeMK || '-'} • {kelas.mataKuliah?.sks || 0} SKS
        </p>
      </div>
    </TableCell>
    <TableCell>
      <div className="text-sm">
        <p>{kelas.hari}</p>
        <p className="text-xs text-muted-foreground">
          {kelas.jamMulai} - {kelas.jamSelesai}
        </p>
      </div>
    </TableCell>
    <TableCell className="text-sm">{kelas.ruangan?.nama || '-'}</TableCell>
    <TableCell>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{kelas._count?.krsDetail || 0}</span>
      </div>
    </TableCell>
    <TableCell>
      {kelas.isNilaiFinalized ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
          Finalized
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Draft</Badge>
      )}
    </TableCell>
    <TableCell className="text-right">
      <Button size="sm" onClick={() => onInputNilai(kelas.id)}>
        {kelas.isNilaiFinalized ? 'Lihat' : 'Input'}
      </Button>
    </TableCell>
  </TableRow>
);

export default function InputNilaiPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth('DOSEN');

  const [kelasList, setKelasList] = useState<KelasMKWithNilai[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthLoading) return;

      if (!user?.dosen?.id) {
        setError('Data dosen tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const semesterResponse = await semesterAPI.getAll();
        if (!semesterResponse.success || !semesterResponse.data) {
          throw new Error('Gagal memuat semester');
        }

        const active = semesterResponse.data.find(s => s.isActive);
        if (!active) {
          throw new Error('Tidak ada semester aktif');
        }
        setActiveSemester(active);

        const kelasResponse = await kelasMKAPI.getAll({
          semester_id: active.id,
          dosenId: user.dosen.id,
        });

        if (kelasResponse.success && kelasResponse.data) {
          setKelasList(kelasResponse.data);
        } else {
          setError(kelasResponse.message || 'Gagal memuat daftar kelas');
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading && user?.dosen?.id) {
      fetchData();
    }
  }, [isAuthLoading, user]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const filteredKelas = useMemo(
    () => filterKelasBySearch(kelasList, search),
    [kelasList, search]
  );

  const stats = useMemo(() => calculateStats(kelasList), [kelasList]);

  const semesterInfo = useMemo(() => {
    if (!activeSemester) return null;
    return {
      title: `${activeSemester.tahunAkademik} ${activeSemester.periode}`,
      dateRange: `${formatDate(activeSemester.tanggalMulai)} - ${formatDate(activeSemester.tanggalSelesai)}`,
    };
  }, [activeSemester]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputNilai = useCallback((id: number) => {
    router.push(`/dosen/input-nilai/${id}`);
  }, [router]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

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
  // ERROR STATES
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
        description="Kelola nilai mahasiswa di kelas yang Anda ampu"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Input Nilai' },
        ]}
      />

      {/* Active Semester Info */}
      {semesterInfo && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  Semester Aktif: {semesterInfo.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {semesterInfo.dateRange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <SearchBar
            placeholder="Cari mata kuliah..."
            onSearch={handleSearch}
            defaultValue={search}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard value={stats.total} label="Total Kelas" />
        <StatCard value={stats.finalized} label="Nilai Finalized" color="text-green-600" />
        <StatCard value={stats.draft} label="Belum Finalized" color="text-yellow-600" />
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
                    <KelasRow
                      key={kelas.id}
                      kelas={kelas}
                      onInputNilai={handleInputNilai}
                    />
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
