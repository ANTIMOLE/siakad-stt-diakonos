/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { dosenAPI } from '@/lib/api';
import { Dosen } from '@/types/model';

// ============================================
// VALIDATION SCHEMA (tanpa password)
// ============================================
const dosenSchema = z.object({
  nidn: z.string().length(10, 'NIDN harus 10 digit'),
  nuptk: z.string().min(1, 'NUPTK wajib diisi'),
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter'),
  prodiId: z.string().optional(),
  posisi: z.string().optional(),
  jafung: z.string().optional(),
  alumni: z.string().optional(),
  lamaMengajar: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
});

type DosenFormData = z.infer<typeof dosenSchema>;

export default function EditDosenPage() {
  const params = useParams();
  const router = useRouter();
  const dosenId = parseInt(params.id as string);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dosenData, setDosenData] = useState<Dosen | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DosenFormData>({
    resolver: zodResolver(dosenSchema),
  });

  // ============================================
  // FETCH DOSEN DATA
  // ============================================
  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await dosenAPI.getById(dosenId);

        if (!response.success || !response.data) {
          setError('Dosen tidak ditemukan');
          return;
        }

        const dosen = response.data;
        setDosenData(dosen);

        // Format tanggal untuk input type="date"
        const formatDateForInput = (dateString: string | null) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // Populate form
        reset({
          nidn: dosen.nidn,
          nuptk: dosen.nuptk,
          namaLengkap: dosen.namaLengkap,
          prodiId: dosen.prodiId?.toString() || '',
          posisi: dosen.posisi || '',
          jafung: dosen.jafung || '',
          alumni: dosen.alumni || '',
          lamaMengajar: dosen.lamaMengajar || '',
          tempatLahir: dosen.tempatLahir || '',
          tanggalLahir: formatDateForInput(dosen.tanggalLahir),
        });
      } catch (err: any) {
        console.error('Fetch dosen error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (dosenId) {
      fetchDosen();
    }
  }, [dosenId, reset]);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: DosenFormData) => {
    try {
      setIsSubmitting(true);

      // Prepare data for API
      const payload = {
        nidn: data.nidn,
        nuptk: data.nuptk,
        namaLengkap: data.namaLengkap,
        prodiId: data.prodiId ? parseInt(data.prodiId) : undefined,
        posisi: data.posisi || undefined,
        jafung: data.jafung || undefined,
        alumni: data.alumni || undefined,
        lamaMengajar: data.lamaMengajar || undefined,
        tempatLahir: data.tempatLahir || undefined,
        tanggalLahir: data.tanggalLahir || undefined,
      };

      const response = await dosenAPI.update(dosenId, payload);

      if (response.success) {
        toast.success('Data dosen berhasil diupdate');
        router.push(`/admin/dosen/${dosenId}`);
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal mengupdate dosen');
        }
      }
    } catch (err: any) {
      console.error('Update dosen error:', err);
      
      let errorMessage = 'Terjadi kesalahan saat mengupdate dosen';
      
      if (err.response?.data) {
        if (err.response.data.errors) {
          Object.entries(err.response.data.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
          return;
        }
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
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
        <LoadingSpinner size="lg" text="Memuat data dosen..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !dosenData) {
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
      <PageHeader
        title="Edit Dosen"
        description={`Update data dosen ${dosenData.namaLengkap}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Dosen', href: '/admin/dosen' },
          { label: dosenData.namaLengkap, href: `/admin/dosen/${dosenId}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Utama */}
            <Card>
              <CardHeader>
                <CardTitle>Data Utama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="nidn">NIDN *</Label>
                    <Input
                      id="nidn"
                      placeholder="0815087301"
                      maxLength={10}
                      {...register('nidn')}
                    />
                    {errors.nidn && (
                      <p className="text-sm text-red-600">{errors.nidn.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nuptk">NUPTK *</Label>
                    <Input
                      id="nuptk"
                      placeholder="1234567890123456"
                      {...register('nuptk')}
                    />
                    {errors.nuptk && (
                      <p className="text-sm text-red-600">{errors.nuptk.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                  <Input
                    id="namaLengkap"
                    placeholder="Dr. Paulus Hartono, M.Th"
                    {...register('namaLengkap')}
                  />
                  {errors.namaLengkap && (
                    <p className="text-sm text-red-600">{errors.namaLengkap.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                    <Input
                      id="tempatLahir"
                      placeholder="Jakarta"
                      {...register('tempatLahir')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggalLahir"
                      type="date"
                      {...register('tanggalLahir')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Akademik */}
            <Card>
              <CardHeader>
                <CardTitle>Data Akademik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="prodiId">Program Studi</Label>
                    <Select 
                      onValueChange={(value) => setValue('prodiId', value)}
                      defaultValue={dosenData.prodiId?.toString() || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih prodi (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">PAK</SelectItem>
                        <SelectItem value="2">Teologi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="posisi">Posisi</Label>
                    <Input
                      id="posisi"
                      placeholder="Dosen Tetap"
                      {...register('posisi')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="jafung">Jabatan Fungsional</Label>
                    <Input
                      id="jafung"
                      placeholder="Lektor"
                      {...register('jafung')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lamaMengajar">Lama Mengajar</Label>
                    <Input
                      id="lamaMengajar"
                      placeholder="10 tahun"
                      {...register('lamaMengajar')}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="alumni">Alumni</Label>
                  <Input
                    id="alumni"
                    placeholder="STT Diakonos, Universitas XYZ"
                    {...register('alumni')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Dosen</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={dosenData.status === 'AKTIF' ? 'default' : 'secondary'}>
                  {dosenData.status}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Status dosen tidak dapat diubah melalui form edit.
                </p>
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Password tidak dapat diubah melalui form edit</p>
                <p>• Gunakan menu ubah password untuk reset password</p>
                <p>• Field bertanda * wajib diisi</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Batal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
