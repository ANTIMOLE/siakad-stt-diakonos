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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import { mataKuliahAPI } from '@/lib/api';

const mkSchema = z.object({
  kodeMK: z.string().min(3, 'Kode MK minimal 3 karakter').toUpperCase(),
  namaMK: z.string().min(3, 'Nama MK minimal 3 karakter'),
  sks: z.number().min(1, 'SKS minimal 1').max(6, 'SKS maksimal 6'),
  semesterIdeal: z.number().min(1).max(8, 'Semester ideal 1-8'),
  deskripsi: z.string().optional(),
  isLintasProdi: z.boolean(),
});

type MKFormData = z.infer<typeof mkSchema>;

export default function TambahMataKuliahPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MKFormData>({
    resolver: zodResolver(mkSchema),
    defaultValues: {
      isLintasProdi: false,
    },
  });

  const onSubmit = async (data: MKFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        kodeMK: data.kodeMK.toUpperCase(),
        namaMK: data.namaMK,
        sks: data.sks,
        semesterIdeal: data.semesterIdeal,
        deskripsi: data.deskripsi || undefined,
        isLintasProdi: data.isLintasProdi,
        isActive: true,
      };

      const response = await mataKuliahAPI.create(payload);

      if (response.success) {
        toast.success('Mata kuliah berhasil ditambahkan');
        router.push('/admin/mata-kuliah');
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal menambahkan mata kuliah');
        }
      }
    } catch (err: any) {
      console.error('Create mata kuliah error:', err);

      let errorMessage = 'Terjadi kesalahan saat menambahkan mata kuliah';

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Mata Kuliah"
        description="Tambahkan mata kuliah baru ke sistem"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mata Kuliah', href: '/admin/mata-kuliah' },
          { label: 'Tambah' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Data Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="kodeMK">Kode Mata Kuliah *</Label>
                  <Input
                    id="kodeMK"
                    placeholder="PAK201"
                    className="uppercase"
                    {...register('kodeMK')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: PAK201, TEO301
                  </p>
                  {errors.kodeMK && (
                    <p className="text-sm text-red-600">{errors.kodeMK.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="namaMK">Nama Mata Kuliah *</Label>
                  <Input
                    id="namaMK"
                    placeholder="Hermeneutika"
                    {...register('namaMK')}
                  />
                  {errors.namaMK && (
                    <p className="text-sm text-red-600">{errors.namaMK.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sks">Jumlah SKS *</Label>
                    <Input
                      id="sks"
                      type="number"
                      min="1"
                      max="6"
                      placeholder="2"
                      {...register('sks', { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      SKS: 1-6
                    </p>
                    {errors.sks && (
                      <p className="text-sm text-red-600">{errors.sks.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="semesterIdeal">Semester Ideal *</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue('semesterIdeal', parseInt(value))
                      }
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
                      <p className="text-sm text-red-600">
                        {errors.semesterIdeal.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                  <textarea
                    id="deskripsi"
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Deskripsi mata kuliah, silabus, atau tujuan pembelajaran..."
                    {...register('deskripsi')}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isLintasProdi"
                    checked={watch('isLintasProdi')}
                    onCheckedChange={(checked) =>
                      setValue('isLintasProdi', checked as boolean)
                    }
                  />
                  <label
                    htmlFor="isLintasProdi"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Mata kuliah lintas prodi
                  </label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Centang jika mata kuliah ini dapat diambil oleh mahasiswa dari
                  prodi lain
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
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
                    'Simpan Mata Kuliah'
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

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Kode MK akan otomatis diubah ke huruf kapital</p>
                <p>• SKS: 1-6</p>
                <p>• Semester ideal: 1-8</p>
                <p>• Mata kuliah akan otomatis aktif setelah dibuat</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}