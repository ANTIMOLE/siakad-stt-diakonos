/**
 * Admin - Detail Dosen Page
 * ✅ Full Backend Integration - View Dosen Detail
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

import { dosenAPI } from '@/lib/api';
import { Dosen } from '@/types/model';

export default function DetailDosenPage() {
  const params = useParams();
  const router = useRouter();
  const dosenId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [dosen, setDosen] = useState<Dosen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DOSEN DATA
  // ============================================
  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dosenAPI.getById(dosenId);

        if (response.success && response.data) {
          setDosen(response.data);
        } else {
          setError(response.message || 'Gagal memuat data dosen');
        }
      } catch (err: any) {
        console.error('Fetch dosen error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data dosen'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (dosenId) {
      fetchDosen();
    }
  }, [dosenId]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleEdit = () => {
    router.push(`/admin/dosen/${dosenId}/edit`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data dosen..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !dosen) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Dosen tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          title={dosen.namaLengkap}
          description={`NIDN: ${dosen.nidn}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Dosen', href: '/admin/dosen' },
            { label: dosen.namaLengkap },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biodata */}
          <Card>
            <CardHeader>
              <CardTitle>Biodata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">NIDN</dt>
                  <dd className="mt-1 text-sm font-mono">{dosen.nidn}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">NUPTK</dt>
                  <dd className="mt-1 text-sm font-mono">{dosen.nuptk}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Nama Lengkap</dt>
                  <dd className="mt-1 text-sm">{dosen.namaLengkap}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={dosen.status} />
                  </dd>
                </div>
                {dosen.tempatLahir && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Tempat Lahir</dt>
                    <dd className="mt-1 text-sm">{dosen.tempatLahir}</dd>
                  </div>
                )}
                {dosen.tanggalLahir && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Tanggal Lahir</dt>
                    <dd className="mt-1 text-sm">{formatDate(dosen.tanggalLahir)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Data Akademik */}
          <Card>
            <CardHeader>
              <CardTitle>Data Akademik</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Program Studi</dt>
                  <dd className="mt-1">
                    {dosen.prodi ? (
                      <Badge variant="outline">{dosen.prodi.kode}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </dd>
                </div>
                {dosen.posisi && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Posisi</dt>
                    <dd className="mt-1 text-sm">{dosen.posisi}</dd>
                  </div>
                )}
                {dosen.jafung && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Jabatan Fungsional</dt>
                    <dd className="mt-1 text-sm">{dosen.jafung}</dd>
                  </div>
                )}
                {dosen.lamaMengajar && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Lama Mengajar</dt>
                    <dd className="mt-1 text-sm">{dosen.lamaMengajar}</dd>
                  </div>
                )}
                {dosen.alumni && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Alumni</dt>
                    <dd className="mt-1 text-sm">{dosen.alumni}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Mata Kuliah yang Diampu */}
          {dosen._count && dosen._count.kelasMataKuliah > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Mata Kuliah yang Diampu
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({dosen._count.kelasMataKuliah} kelas)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dosen ini mengampu {dosen._count.kelasMataKuliah} kelas mata kuliah.
                </p>
                {/* TODO: Display actual kelas list if needed */}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mahasiswa Bimbingan */}
          <Card>
            <CardHeader>
              <CardTitle>
                Mahasiswa Bimbingan
                {dosen._count && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({dosen._count.mahasiswaBimbingan || 0})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dosen._count && dosen._count.mahasiswaBimbingan > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Dosen ini membimbing {dosen._count.mahasiswaBimbingan} mahasiswa.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada mahasiswa bimbingan.
                </p>
              )}
              {/* TODO: Display actual mahasiswa list if needed */}
            </CardContent>
          </Card>

          {/* Info Tambahan */}
          <Card>
            <CardHeader>
              <CardTitle>Info Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Terdaftar Sejak</dt>
                <dd className="mt-1 text-sm">{formatDate(dosen.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</dt>
                <dd className="mt-1 text-sm">{formatDate(dosen.updatedAt)}</dd>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
