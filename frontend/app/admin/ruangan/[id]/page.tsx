/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Calendar } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ruanganAPI } from '@/lib/api';

export default function RuanganDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ruanganId = parseInt(params.id as string);

  const [ruangan, setRuangan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await ruanganAPI.getById(ruanganId);

        if (response.success && response.data) {
          setRuangan(response.data);
        } else {
          setError(response.message || 'Gagal memuat data ruangan');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (ruanganId) {
      fetchRuangan();
    }
  }, [ruanganId]);

  const handleBack = () => {
    router.push('/admin/ruangan');
  };

  const handleEdit = () => {
    router.push(`/admin/ruangan/${ruanganId}/edit`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data ruangan..." />
      </div>
    );
  }

  if (error || !ruangan) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Ruangan tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ruangan.nama}
        description="Detail ruangan kelas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Ruangan', href: '/admin/ruangan' },
          { label: 'Detail' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informasi Ruangan */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Ruangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Nama Ruangan
                  </p>
                  <p className="text-lg font-semibold">{ruangan.nama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Kapasitas
                  </p>
                  <p className="text-lg font-semibold">{ruangan.kapasitas || 30} Orang</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </p>
                <Badge variant={ruangan.isActive ? 'default' : 'secondary'}>
                  {ruangan.isActive ? 'Aktif' : 'Non-Aktif'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Daftar Kelas */}
          <Card>
            <CardHeader>
              <CardTitle>
                Kelas yang Menggunakan Ruangan ({ruangan.kelasMataKuliah?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!ruangan.kelasMataKuliah || ruangan.kelasMataKuliah.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Tidak ada kelas yang menggunakan ruangan ini
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Dosen</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Semester</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ruangan.kelasMataKuliah.map((kelas: any, index: number) => (
                        <TableRow key={kelas.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {kelas.mataKuliah?.namaMK || '-'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {kelas.mataKuliah?.kodeMK || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {kelas.dosen?.namaLengkap || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {kelas.hari || '-'}, {kelas.jamMulai || '-'} -{' '}
                                {kelas.jamSelesai || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {kelas.semester?.tahunAkademik || '-'}{' '}
                              {kelas.semester?.periode || ''}
                            </div>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistik */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Kelas</p>
                <p className="text-2xl font-bold">
                  {ruangan._count?.kelasMataKuliah || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kapasitas</p>
                <p className="text-2xl font-bold">{ruangan.kapasitas || 30}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={ruangan.isActive ? 'default' : 'secondary'}>
                  {ruangan.isActive ? 'Aktif' : 'Non-Aktif'}
                </Badge>
              </div>
              {ruangan.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dibuat:</span>
                  <span className="text-sm">
                    {new Date(ruangan.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {ruangan.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Diupdate:</span>
                  <span className="text-sm">
                    {new Date(ruangan.updatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}