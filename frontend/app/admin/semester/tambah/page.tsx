'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CalendarIcon } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

import { semesterAPI } from '@/lib/api';

// ============================================
// VALIDATION SCHEMA
// ============================================
const semesterSchema = z.object({
  tahunAkademik: z.string()
    .min(1, 'Tahun akademik wajib diisi')
    .regex(/^\d{4}\/\d{4}$/, 'Format: YYYY/YYYY (contoh: 2024/2025)'),
  periode: z.enum(['GANJIL', 'GENAP'], { message: 'Pilih periode' }),
  tanggalMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
  periodeKRSMulai: z.string().min(1, 'Periode KRS mulai wajib diisi'),
  periodeKRSSelesai: z.string().min(1, 'Periode KRS selesai wajib diisi'),
  periodePerbaikanKRSMulai: z.string().min(1, 'Periode perbaikan KRS mulai wajib diisi'),
  periodePerbaikanKRSSelesai: z.string().min(1, 'Periode perbaikan KRS selesai wajib diisi'),
  isActive: z.boolean(),
}).refine((data) => new Date(data.tanggalSelesai) > new Date(data.tanggalMulai), {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["tanggalSelesai"],
}).refine((data) => new Date(data.periodeKRSSelesai) > new Date(data.periodeKRSMulai), {
  message: "Periode KRS selesai harus setelah periode KRS mulai",
  path: ["periodeKRSSelesai"],
}).refine((data) => new Date(data.periodePerbaikanKRSSelesai) > new Date(data.periodePerbaikanKRSMulai), {
  message: "Periode perbaikan selesai harus setelah periode perbaikan mulai",
  path: ["periodePerbaikanKRSSelesai"],
});

type SemesterFormData = z.infer<typeof semesterSchema>;

export default function BuatSemesterPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      isActive: false,
    },
  });

  const isActive = watch('isActive');

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: SemesterFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        tahunAkademik: data.tahunAkademik,
        periode: data.periode,
        tanggalMulai: new Date(data.tanggalMulai).toISOString(),
        tanggalSelesai: new Date(data.tanggalSelesai).toISOString(),
        periodeKRSMulai: new Date(data.periodeKRSMulai).toISOString(),
        periodeKRSSelesai: new Date(data.periodeKRSSelesai).toISOString(),
        periodePerbaikanKRSMulai: new Date(data.periodePerbaikanKRSMulai).toISOString(),
        periodePerbaikanKRSSelesai: new Date(data.periodePerbaikanKRSSelesai).toISOString(),
        isActive: data.isActive,
      };

      const response = await semesterAPI.create(payload);

      if (response.success) {
        toast.success('Semester berhasil dibuat');
        router.push('/admin/semester');
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal membuat semester');
        }
      }
    } catch (err: any) {
      console.error('Create semester error:', err);

      let errorMessage = 'Terjadi kesalahan saat membuat semester';

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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Semester Baru"
        description="Tambahkan semester akademik baru"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Semester', href: '/admin/semester' },
          { label: 'Buat' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Semester */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Semester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tahun Akademik */}
                  <div className="grid gap-2">
                    <Label htmlFor="tahunAkademik">Tahun Akademik *</Label>
                    <Input
                      id="tahunAkademik"
                      placeholder="2024/2025"
                      {...register('tahunAkademik')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: YYYY/YYYY
                    </p>
                    {errors.tahunAkademik && (
                      <p className="text-sm text-red-600">
                        {errors.tahunAkademik.message}
                      </p>
                    )}
                  </div>

                  {/* Periode */}
                  <div className="grid gap-2">
                    <Label>Periode *</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue('periode', value as 'GANJIL' | 'GENAP')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GANJIL">Ganjil</SelectItem>
                        <SelectItem value="GENAP">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.periode && (
                      <p className="text-sm text-red-600">{errors.periode.message}</p>
                    )}
                  </div>
                </div>

                {/* Tanggal Semester */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="tanggalMulai">Tanggal Mulai Semester *</Label>
                    <Input id="tanggalMulai" type="date" {...register('tanggalMulai')} />
                    {errors.tanggalMulai && (
                      <p className="text-sm text-red-600">
                        {errors.tanggalMulai.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tanggalSelesai">
                      Tanggal Selesai Semester *
                    </Label>
                    <Input
                      id="tanggalSelesai"
                      type="date"
                      {...register('tanggalSelesai')}
                    />
                    {errors.tanggalSelesai && (
                      <p className="text-sm text-red-600">
                        {errors.tanggalSelesai.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Periode KRS */}
            <Card>
              <CardHeader>
                <CardTitle>Periode KRS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="periodeKRSMulai">Periode KRS Mulai *</Label>
                    <Input
                      id="periodeKRSMulai"
                      type="date"
                      {...register('periodeKRSMulai')}
                    />
                    {errors.periodeKRSMulai && (
                      <p className="text-sm text-red-600">
                        {errors.periodeKRSMulai.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="periodeKRSSelesai">Periode KRS Selesai *</Label>
                    <Input
                      id="periodeKRSSelesai"
                      type="date"
                      {...register('periodeKRSSelesai')}
                    />
                    {errors.periodeKRSSelesai && (
                      <p className="text-sm text-red-600">
                        {errors.periodeKRSSelesai.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="periodePerbaikanKRSMulai">
                      Perbaikan KRS Mulai *
                    </Label>
                    <Input
                      id="periodePerbaikanKRSMulai"
                      type="date"
                      {...register('periodePerbaikanKRSMulai')}
                    />
                    {errors.periodePerbaikanKRSMulai && (
                      <p className="text-sm text-red-600">
                        {errors.periodePerbaikanKRSMulai.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="periodePerbaikanKRSSelesai">
                      Perbaikan KRS Selesai *
                    </Label>
                    <Input
                      id="periodePerbaikanKRSSelesai"
                      type="date"
                      {...register('periodePerbaikanKRSSelesai')}
                    />
                    {errors.periodePerbaikanKRSSelesai && (
                      <p className="text-sm text-red-600">
                        {errors.periodePerbaikanKRSSelesai.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Semester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setValue('isActive', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Aktifkan semester ini
                  </label>
                </div>

                {isActive && (
                  <Alert>
                    <CalendarIcon className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Semester lain yang aktif akan dinonaktifkan secara otomatis
                    </AlertDescription>
                  </Alert>
                )}
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
                    'Buat Semester'
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

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Format tahun akademik: YYYY/YYYY</p>
                <p>• Periode: Ganjil atau Genap</p>
                <p>• Tanggal selesai harus setelah tanggal mulai</p>
                <p>• Hanya satu semester yang bisa aktif</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
