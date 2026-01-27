/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, AlertCircle, Trash2, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { krsAPI, kelasMKAPI } from '@/lib/api';
import { KRS, KelasMK } from '@/types/model';

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

export default function AdminKRSEditPage() {
  const router = useRouter();
  const params = useParams();
  const krsId = params?.id ? parseInt(params.id as string) : null;

  // STATE
  const [krs, setKrs] = useState<KRS | null>(null);
  const [availableKelas, setAvailableKelas] = useState<KelasMK[]>([]);
  const [selectedKelasMKIds, setSelectedKelasMKIds] = useState<number[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKelas, setIsLoadingKelas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FETCH KRS DATA
  useEffect(() => {
    if (!krsId) {
      setError('ID KRS tidak valid');
      setIsLoading(false);
      return;
    }

    const fetchKRS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await krsAPI.getById(krsId);

        if (response.success && response.data) {
          const krsData = response.data;
          setKrs(krsData);

          // Check if editable
          if (krsData.status !== 'DRAFT' && krsData.status !== 'REJECTED') {
            setError(`KRS dengan status ${krsData.status} tidak dapat diedit`);
            return;
          }

          // Extract selected kelas IDs
          const currentKelasMKIds = krsData.detail?.map((d) => d.kelasMKId) || [];
          setSelectedKelasMKIds(currentKelasMKIds);
        } else {
          setError(response.message || 'Gagal memuat detail KRS');
        }
      } catch (err: any) {
        console.error('Fetch KRS error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data KRS'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchKRS();
  }, [krsId]);

  // FETCH AVAILABLE KELAS MK
  useEffect(() => {
    if (!krs) return;

    const fetchAvailableKelas = async () => {
      try {
        setIsLoadingKelas(true);

        const response = await kelasMKAPI.getAll({
          semester_id: krs.semesterId,
        });

        if (response.success && response.data) {
          setAvailableKelas(response.data);
        }
      } catch (err: any) {
        console.error('Fetch kelas error:', err);
        toast.error('Gagal memuat daftar kelas');
      } finally {
        setIsLoadingKelas(false);
      }
    };

    fetchAvailableKelas();
  }, [krs]);

  // HANDLERS
  const handleBack = () => {
    router.push('/admin/krs');
  };

  const handleToggleKelas = (kelasId: number) => {
    setSelectedKelasMKIds((prev) => {
      if (prev.includes(kelasId)) {
        return prev.filter((id) => id !== kelasId);
      } else {
        return [...prev, kelasId];
      }
    });
  };

  const handleRemoveKelas = (kelasId: number) => {
    setSelectedKelasMKIds((prev) => prev.filter((id) => id !== kelasId));
  };

  const handleSubmit = async () => {
    if (!krs) return;

    if (selectedKelasMKIds.length === 0) {
      toast.error('Pilih minimal 1 mata kuliah');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await krsAPI.update(krs.id, {
        kelasMKIds: selectedKelasMKIds,
      });

      if (response.success) {
        toast.success('KRS berhasil diupdate');
        router.push('/admin/krs');
      } else {
        toast.error(response.message || 'Gagal update KRS');
      }
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat update KRS'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // COMPUTED
  const selectedKelas = availableKelas.filter((k) =>
    selectedKelasMKIds.includes(k.id)
  );

  const sortedSelectedKelas = [...selectedKelas].sort((a, b) => {
    const hariA = a.hari || '';
    const hariB = b.hari || '';
    const hariCompare = HARI_ORDER[hariA] - HARI_ORDER[hariB];
    if (hariCompare !== 0) return hariCompare;
    return (a.jamMulai || '').localeCompare(b.jamMulai || '');
  });

  const totalSKS = selectedKelas.reduce(
    (sum, k) => sum + (k.mataKuliah?.sks || 0),
    0
  );

  const hasChanges =
    JSON.stringify([...selectedKelasMKIds].sort()) !==
    JSON.stringify(
      [...(krs?.detail?.map((d) => d.kelasMKId) || [])].sort()
    );

  // Group available kelas by mata kuliah
  const groupedKelas = availableKelas.reduce((acc, kelas) => {
    const mkId = kelas.mataKuliah?.id;
    if (!mkId) return acc;
    
    if (!acc[mkId]) {
      acc[mkId] = [];
    }
    acc[mkId].push(kelas);
    return acc;
  }, {} as Record<number, KelasMK[]>);

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data KRS..." />
      </div>
    );
  }

  // ERROR STATE
  if (error || !krs) {
    return (
      <ErrorState
        title="Gagal Memuat Data KRS"
        message={error || 'KRS tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Edit KRS"
        description={`Edit KRS ${krs.mahasiswa?.namaLengkap} - ${krs.semester?.tahunAkademik} ${krs.semester?.periode}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'KRS', href: '/admin/krs' },
          { label: `Detail`, href: `/admin/krs/${krs.id}` },
          { label: 'Edit' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges || selectedKelasMKIds.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        }
      />

      {/* Warning if REJECTED */}
      {krs.status === 'REJECTED' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>KRS Ditolak</strong>
            {krs.catatanAdmin && (
              <>
                <br />
                <strong>Alasan:</strong> {krs.catatanAdmin}
              </>
            )}
            <br />
            Silakan edit KRS sesuai catatan dosen wali, lalu submit ulang.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Pilih mata kuliah dari daftar di bawah untuk menambah/mengurangi mata kuliah di KRS.
        </AlertDescription>
      </Alert>

      {/* KRS Info Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Mahasiswa</p>
              <p className="font-medium">{krs.mahasiswa?.namaLengkap}</p>
              <p className="text-sm text-muted-foreground">
                NIM: {krs.mahasiswa?.nim}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Semester</p>
              <Badge variant="outline">
                {krs.semester?.tahunAkademik} {krs.semester?.periode}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total SKS</p>
              <p className="text-2xl font-bold text-blue-600">{totalSKS}</p>
              {totalSKS < 12 && (
                <p className="text-xs text-red-600">Minimal 12 SKS</p>
              )}
              {totalSKS > 24 && (
                <p className="text-xs text-red-600">Maksimal 24 SKS</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Jumlah Mata Kuliah
              </p>
              <p className="text-2xl font-bold text-green-600">
                {selectedKelasMKIds.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Mata Kuliah */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mata Kuliah Terpilih ({selectedKelasMKIds.length})</CardTitle>
            <Badge variant={hasChanges ? 'default' : 'secondary'}>
              {hasChanges ? 'Ada Perubahan' : 'Tidak Ada Perubahan'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedSelectedKelas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Belum ada mata kuliah terpilih. Pilih dari daftar di bawah.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Kode MK</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead className="text-center w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSelectedKelas.map((kelas, index) => (
                    <TableRow key={kelas.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono">
                        {kelas.mataKuliah?.kodeMK || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {kelas.mataKuliah?.namaMK || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {kelas.mataKuliah?.sks || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{kelas.dosen?.namaLengkap || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {kelas.hari || '-'}, {kelas.jamMulai || '-'} -{' '}
                            {kelas.jamSelesai || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{kelas.ruangan?.nama || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKelas(kelas.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={3} className="text-right">
                      Total:
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default">{totalSKS}</Badge>
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Mata Kuliah */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Plus className="inline h-4 w-4 mr-2" />
            Tambah Mata Kuliah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingKelas ? (
            <div className="flex h-48 items-center justify-center">
              <LoadingSpinner size="md" text="Memuat daftar kelas..." />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedKelas).map(([mkId, kelasList]) => {
                const mk = kelasList[0]?.mataKuliah;
                if (!mk) return null;

                return (
                  <div key={mkId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{mk.namaMK}</p>
                        <p className="text-sm text-muted-foreground">
                          {mk.kodeMK} • {mk.sks} SKS
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {kelasList.map((kelas) => {
                        const isSelected = selectedKelasMKIds.includes(kelas.id);
                        return (
                          <div
                            key={kelas.id}
                            className={`flex items-center space-x-3 p-3 rounded border ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              id={`kelas-${kelas.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleKelas(kelas.id)}
                            />
                            <label
                              htmlFor={`kelas-${kelas.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">
                                    {kelas.dosen?.namaLengkap || '-'}
                                  </span>
                                </div>
                                <div>
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  {kelas.hari}, {kelas.jamMulai}-{kelas.jamSelesai}
                                </div>
                                <div className="text-muted-foreground">
                                  {kelas.ruangan?.nama || '-'}
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons Bottom */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                Total: {selectedKelasMKIds.length} Mata Kuliah ({totalSKS} SKS)
              </p>
              {hasChanges ? (
                <p className="text-sm text-blue-700">
                  Anda memiliki perubahan yang belum disimpan
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  Tidak ada perubahan
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !hasChanges || selectedKelasMKIds.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}