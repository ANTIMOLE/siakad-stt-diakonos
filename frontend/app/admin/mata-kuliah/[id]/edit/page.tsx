'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { mataKuliahAPI } from '@/lib/api';
import { MataKuliah } from '@/types/model';

// ============================================
// VALIDATION SCHEMA (FIXED - removed jenisMK)
// ============================================
const mataKuliahSchema = z.object({
  kodeMK: z.string().min(3, 'Kode MK minimal 3 karakter').max(10, 'Kode MK maksimal 10 karakter'),
  namaMK: z.string().min(3, 'Nama MK minimal 3 karakter').max(100, 'Nama MK maksimal 100 karakter'),
  sks: z.number().min(1, 'SKS minimal 1').max(6, 'SKS maksimal 6'),
  semesterIdeal: z.number().min(1, 'Semester minimal 1').max(8, 'Semester maksimal 8'),
  deskripsi: z.string().optional(),
  isLintasProdi: z.boolean(),
  isActive: z.boolean(),
});

type MataKuliahFormData = z.infer<typeof mataKuliahSchema>;

export default function EditMataKuliahPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mataKuliah, setMataKuliah] = useState<MataKuliah | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MataKuliahFormData>({
    resolver: zodResolver(mataKuliahSchema),
  });

  const isLintasProdi = watch('isLintasProdi');
  const isActive = watch('isActive');

  // ============================================
  // FETCH MATA KULIAH DATA
  // ============================================
  useEffect(() => {
    const fetchMataKuliah = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await mataKuliahAPI.getById(id);

        if (response.success && response.data) {
          const mk = response.data;
          setMataKuliah(mk);

          // Set form values
          setValue('kodeMK', mk.kodeMK);
          setValue('namaMK', mk.namaMK);
          setValue('sks', mk.sks);
          setValue('semesterIdeal', mk.semesterIdeal);
          setValue('deskripsi', mk.deskripsi || '');
          setValue('isLintasProdi', mk.isLintasProdi);
          setValue('isActive', mk.isActive);
        } else {
          setError(response.message || 'Gagal memuat data mata kuliah');
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

    fetchMataKuliah();
  }, [id, setValue]);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: MataKuliahFormData) => {
    try {
      setIsSubmitting(true);

      const response = await mataKuliahAPI.update(id, data);

      if (response.success) {
        toast.success('Mata kuliah berhasil diupdate');
        router.push('/admin/mata-kuliah');
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal mengupdate mata kuliah');
        }
      }
    } catch (err: any) {
      console.error('Update error:', err);

      let errorMessage = 'Terjadi kesalahan saat mengupdate mata kuliah';

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

  const handleCancel = () => {
    router.back();
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
        <LoadingSpinner size="lg" text="Memuat data mata kuliah..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
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
      {/* Page Header */}
      <PageHeader
        title="Edit Mata Kuliah"
        description={`Edit data mata kuliah: ${mataKuliah?.namaMK || ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mata Kuliah', href: '/admin/mata-kuliah' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Dasar */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Kode MK */}
                <div className="grid gap-2">
                  <Label htmlFor="kodeMK">Kode Mata Kuliah *</Label>
                  <Input
                    id="kodeMK"
                    placeholder="Contoh: PAK101"
                    {...register('kodeMK')}
                    disabled={isSubmitting}
                  />
                  {errors.kodeMK && (
                    <p className="text-sm text-red-600">{errors.kodeMK.message}</p>
                  )}
                </div>

                {/* Nama MK */}
                <div className="grid gap-2">
                  <Label htmlFor="namaMK">Nama Mata Kuliah *</Label>
                  <Input
                    id="namaMK"
                    placeholder="Contoh: Pengantar Teologi"
                    {...register('namaMK')}
                    disabled={isSubmitting}
                  />
                  {errors.namaMK && (
                    <p className="text-sm text-red-600">{errors.namaMK.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* SKS */}
                  <div className="grid gap-2">
                    <Label htmlFor="sks">SKS *</Label>
                    <Input
                      id="sks"
                      type="number"
                      min="1"
                      max="6"
                      {...register('sks', { valueAsNumber: true })}
                      disabled={isSubmitting}
                    />
                    {errors.sks && (
                      <p className="text-sm text-red-600">{errors.sks.message}</p>
                    )}
                  </div>

                  {/* Semester Ideal */}
                  <div className="grid gap-2">
                    <Label>Semester Ideal *</Label>
                    <Select
                      value={watch('semesterIdeal')?.toString()}
                      onValueChange={(value) => setValue('semesterIdeal', parseInt(value))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={s.toString()}>
                            Semester {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.semesterIdeal && (
                      <p className="text-sm text-red-600">{errors.semesterIdeal.message}</p>
                    )}
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="grid gap-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    placeholder="Deskripsi mata kuliah (opsional)"
                    rows={4}
                    {...register('deskripsi')}
                    disabled={isSubmitting}
                  />
                  {errors.deskripsi && (
                    <p className="text-sm text-red-600">{errors.deskripsi.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pengaturan */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lintas Prodi */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lintas Prodi</Label>
                    <p className="text-sm text-muted-foreground">
                      Mata kuliah bisa diambil lintas program studi
                    </p>
                  </div>
                  <Switch
                    checked={isLintasProdi}
                    onCheckedChange={(checked) => setValue('isLintasProdi', checked)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Status Aktif */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status Aktif</Label>
                    <p className="text-sm text-muted-foreground">
                      Mata kuliah tersedia untuk semester aktif
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                    disabled={isSubmitting}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Dibuat</p>
                  <p className="font-medium">
                    {mataKuliah?.createdAt 
                      ? new Date(mataKuliah.createdAt).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Terakhir Diupdate</p>
                  <p className="font-medium">
                    {mataKuliah?.updatedAt
                      ? new Date(mataKuliah.updatedAt).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
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
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCancel}
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
