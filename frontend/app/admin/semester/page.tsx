'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, CheckCircle } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

import { semesterAPI } from '@/lib/api';
import { Semester } from '@/types/model';

export default function SemesterManagePage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH SEMESTER DATA
  // ============================================
  const fetchSemesters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await semesterAPI.getAll();

      // ✅ response SUDAH auto-unwrapped
      if (response.success) {
        // Sort by tahunAkademik descending
        const sorted = (response.data || []).sort((a: Semester, b: Semester) => {
          return b.tahunAkademik.localeCompare(a.tahunAkademik);
        });
        setSemesters(sorted);
      } else {
        setError(response.message || 'Gagal memuat data semester');
      }
    } catch (err: any) {
      console.error('Fetch semester error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data semester'
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Empty array - ga ada external dependency

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleActivate = async (id: number, tahunAkademik: string) => {
    if (!confirm(`Aktifkan semester ${tahunAkademik}? Semester lain akan otomatis dinonaktifkan.`)) {
      return;
    }

    try {
      const response = await semesterAPI.activate(id);

      // ✅ response SUDAH auto-unwrapped
      if (response.success) {
        toast.success('Semester berhasil diaktifkan');
        fetchSemesters(); // Refresh data
      } else {
        toast.error(response.message || 'Gagal mengaktifkan semester');
      }
    } catch (err: any) {
      console.error('Activate error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat mengaktifkan semester'
      );
    }
  };

  const handleCreate = () => {
    router.push('/admin/semester/tambah');
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/semester/${id}/edit`);
  };

  const handleRetry = () => {
    fetchSemesters();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading && semesters.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data semester..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && semesters.length === 0) {
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
        title="Kelola Semester"
        description="Manajemen semester akademik"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Semester' },
        ]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Semester Baru
          </Button>
        }
      />

      {semesters.length === 0 ? (
        <EmptyState
          title="Belum ada semester"
          description="Mulai dengan membuat semester akademik pertama"
          action={{
            label: 'Buat Semester Baru',
            onClick: handleCreate,
            icon: Plus,
          }}
        />
      ) : (
        <div className="space-y-4">
          {semesters.map((semester) => (
            <Card key={semester.id} className={semester.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 flex-wrap">
                      {semester.tahunAkademik}
                      <Badge variant={semester.periode === 'GANJIL' ? 'default' : 'secondary'}>
                        {semester.periode}
                      </Badge>
                      {semester.isActive && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aktif
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(semester.tanggalMulai)} - {formatDate(semester.tanggalSelesai)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!semester.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivate(semester.id, semester.tahunAkademik)}
                      >
                        Aktifkan
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(semester.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Periode KRS</p>
                    <p className="text-sm">
                      {formatDate(semester.periodeKRSMulai)} - {formatDate(semester.periodeKRSSelesai)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Periode Perbaikan KRS</p>
                    <p className="text-sm">
                      {formatDate(semester.periodePerbaikanKRSMulai)} - {formatDate(semester.periodePerbaikanKRSSelesai)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
