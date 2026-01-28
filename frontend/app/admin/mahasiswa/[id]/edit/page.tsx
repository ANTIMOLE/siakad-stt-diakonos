/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Edit Mahasiswa Page
 * ✅ UPDATED: Dynamic year selector + schema baru
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import { mahasiswaAPI, dosenAPI } from '@/lib/api';
import { Mahasiswa, MahasiswaStatus, Dosen } from '@/types/model';

// ============================================
// VALIDATION SCHEMA
// ============================================
const mahasiswaSchema = z.object({
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter'),
  tempatTanggalLahir: z.string().min(3, 'Tempat/Tanggal Lahir minimal 3 karakter').optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  prodiId: z.number().min(1, 'Prodi wajib dipilih'),
  angkatan: z.number().min(2000, 'Angkatan tidak valid'),
  dosenWaliId: z.number().optional(),
  status: z.enum(['AKTIF', 'CUTI', 'NON_AKTIF', 'LULUS', 'DO']),
});

type MahasiswaFormData = z.infer<typeof mahasiswaSchema>;

export default function EditMahasiswaPage() {
  const router = useRouter();
  const params = useParams();
  const mahasiswaId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa | null>(null);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MahasiswaFormData>({
    resolver: zodResolver(mahasiswaSchema),
  });

  // ✅ DYNAMIC YEAR GENERATION
  const angkatanOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Generate: current year + 10 years back
    for (let i = 0; i <= 10; i++) {
      years.push(currentYear - i);
    }
    
    return years;
  }, []);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch mahasiswa data
        const mhsResponse = await mahasiswaAPI.getById(mahasiswaId);
        
        if (!mhsResponse.success || !mhsResponse.data) {
          setError(mhsResponse.message || 'Mahasiswa tidak ditemukan');
          return;
        }

        const data = mhsResponse.data;
        setMahasiswa(data);

        // Set form values
        reset({
          namaLengkap: data.namaLengkap,
          tempatTanggalLahir: data.tempatTanggalLahir || undefined,
          jenisKelamin: data.jenisKelamin || undefined,
          alamat: data.alamat || undefined,
          prodiId: data.prodiId,
          angkatan: data.angkatan,
          dosenWaliId: data.dosenWaliId || undefined,
          status: data.status,
        });

        // Fetch dosen list for dropdown
        try {
          const dosenResponse = await dosenAPI.getAll({ status: 'AKTIF', limit: 100 });
          if (dosenResponse.success) {
            setDosenList(dosenResponse.data || []);
          }
        } catch (err) {
          console.warn('Failed to fetch dosen list:', err);
        }
      } catch (err: any) {
        console.error('Fetch mahasiswa error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (mahasiswaId) {
      fetchData();
    }
  }, [mahasiswaId, reset]);

  // ============================================
  // HANDLERS
  // ============================================
  const onSubmit = async (data: MahasiswaFormData) => {
    try {
      setIsSubmitting(true);

      const response = await mahasiswaAPI.update(mahasiswaId, data);

      if (response.success) {
        toast.success('Mahasiswa berhasil diperbarui');
        router.push(`/admin/mahasiswa/${mahasiswaId}`);
      } else {
        toast.error(response.message || 'Gagal memperbarui mahasiswa');
      }
    } catch (err: any) {
      console.error('Update mahasiswa error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memperbarui mahasiswa'
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !mahasiswa) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Mahasiswa tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Edit Mahasiswa"
          description={`Perbarui data ${mahasiswa.namaLengkap}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Mahasiswa', href: '/admin/mahasiswa' },
            { label: mahasiswa.namaLengkap, href: `/admin/mahasiswa/${mahasiswaId}` },
            { label: 'Edit' },
          ]}
        />
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Mahasiswa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NIM - Read Only */}
                <div className="grid gap-2">
                  <Label htmlFor="nim">NIM</Label>
                  <Input
                    id="nim"
                    value={mahasiswa.nim}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    NIM tidak dapat diubah
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div className="grid gap-2">
                  <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                  <Input
                    id="namaLengkap"
                    placeholder="Nama lengkap mahasiswa"
                    {...register('namaLengkap')}
                  />
                  {errors.namaLengkap && (
                    <p className="text-sm text-red-600">
                      {errors.namaLengkap.message}
                    </p>
                  )}
                </div>

                {/* Tempat/Tanggal Lahir */}
                <div className="grid gap-2">
                  <Label htmlFor="tempatTanggalLahir">Tempat/Tanggal Lahir</Label>
                  <Input
                    id="tempatTanggalLahir"
                    placeholder="Solo, 15 Januari 2005"
                    {...register('tempatTanggalLahir')}
                  />
                  {errors.tempatTanggalLahir && (
                    <p className="text-sm text-red-600">
                      {errors.tempatTanggalLahir.message}
                    </p>
                  )}
                </div>

                {/* Jenis Kelamin */}
                <div className="grid gap-2">
                  <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                  <Select
                    value={watch('jenisKelamin') || 'none'}
                    onValueChange={(value) => 
                      setValue('jenisKelamin', value === 'none' ? undefined : value as 'L' | 'P')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak diisi</SelectItem>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.jenisKelamin && (
                    <p className="text-sm text-red-600">{errors.jenisKelamin.message}</p>
                  )}
                </div>

                {/* Alamat */}
                <div className="grid gap-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Textarea
                    id="alamat"
                    placeholder="Jl. Contoh No. 123, Kota"
                    rows={3}
                    {...register('alamat')}
                  />
                  {errors.alamat && (
                    <p className="text-sm text-red-600">{errors.alamat.message}</p>
                  )}
                </div>

                {/* Program Studi */}
                <div className="grid gap-2">
                  <Label htmlFor="prodiId">Program Studi *</Label>
                  <Select
                    value={watch('prodiId')?.toString()}
                    onValueChange={(value) => setValue('prodiId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">PAK</SelectItem>
                      <SelectItem value="2">Teologi</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.prodiId && (
                    <p className="text-sm text-red-600">{errors.prodiId.message}</p>
                  )}
                </div>

                {/* ✅ DYNAMIC ANGKATAN */}
                <div className="grid gap-2">
                  <Label htmlFor="angkatan">Angkatan *</Label>
                  <Select
                    value={watch('angkatan')?.toString()}
                    onValueChange={(value) => setValue('angkatan', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {angkatanOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.angkatan && (
                    <p className="text-sm text-red-600">{errors.angkatan.message}</p>
                  )}
                </div>

                {/* Dosen Wali */}
                <div className="grid gap-2">
                  <Label htmlFor="dosenWaliId">Dosen Wali (Opsional)</Label>
                  <Select
                    value={watch('dosenWaliId')?.toString() || 'none'}
                    onValueChange={(value) =>
                      setValue(
                        'dosenWaliId',
                        value === 'none' ? undefined : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dosen wali" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada</SelectItem>
                      {dosenList.map((dosen) => (
                        <SelectItem key={dosen.id} value={dosen.id.toString()}>
                          {dosen.namaLengkap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value: MahasiswaStatus) =>
                      setValue('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="CUTI">Cuti</SelectItem>
                      <SelectItem value="NON_AKTIF">Tidak Aktif</SelectItem>
                      <SelectItem value="LULUS">Lulus</SelectItem>
                      <SelectItem value="DO">Drop Out</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• NIM tidak dapat diubah</p>
                <p>• Field dengan tanda * wajib diisi</p>
                <p>• Field lainnya opsional</p>
                <p>• Perubahan data akan langsung tersimpan</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}