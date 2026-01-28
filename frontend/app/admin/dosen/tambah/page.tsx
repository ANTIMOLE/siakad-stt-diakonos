/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { dosenAPI } from '@/lib/api';

// ============================================
// VALIDATION SCHEMA
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
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type DosenFormData = z.infer<typeof dosenSchema>;

export default function TambahDosenPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DosenFormData>({
    resolver: zodResolver(dosenSchema),
  });

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
        password: data.password,
      };

      const response = await dosenAPI.create(payload);

      // ✅ response SUDAH auto-unwrapped
      if (response.success) {
        toast.success('Dosen berhasil ditambahkan');
        router.push('/admin/dosen');
      } else {
        // ✅ Handle validation errors dari backend
        if (response.errors) {
          // Display field-specific errors
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal menambahkan dosen');
        }
      }
    } catch (err: any) {
      console.error('Create dosen error:', err);
      
      // ✅ Error handling dengan auto-unwrap
      let errorMessage = 'Terjadi kesalahan saat menambahkan dosen';
      
      if (err.response?.data) {
        // Backend validation errors
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Dosen"
        description="Tambahkan dosen baru ke sistem"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Dosen', href: '/admin/dosen' },
          { label: 'Tambah' },
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
                    <Select onValueChange={(value) => setValue('prodiId', value)}>
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

            {/* Akun & Password */}
            <Card>
              <CardHeader>
                <CardTitle>Akun & Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Dosen'
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
          </div>
        </div>
      </form>
    </div>
  );
}
