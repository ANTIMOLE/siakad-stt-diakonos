/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
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
import { Dosen } from '@/types/model';

// ============================================
// VALIDATION SCHEMA
// ============================================
const mahasiswaSchema = z.object({
  nim: z.string().length(10, 'NIM harus 10 digit'),
  namaLengkap: z.string().min(3, 'Nama minimal 3 karakter'),
  tempatTanggalLahir: z.string().min(3, 'Tempat/Tanggal Lahir minimal 3 karakter').optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
  prodiId: z.number().min(1, 'Pilih program studi'),
  angkatan: z.number().min(2000, 'Angkatan tidak valid'),
  dosenWaliId: z.number().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type MahasiswaFormData = z.infer<typeof mahasiswaSchema>;

export default function TambahMahasiswaPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [isLoadingDosen, setIsLoadingDosen] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MahasiswaFormData>({
    resolver: zodResolver(mahasiswaSchema),
  });

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
  // FETCH DOSEN LIST
  // ============================================
  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setIsLoadingDosen(true);
        const response = await dosenAPI.getAll({ status: 'AKTIF', limit: 100 });
        
        if (response.success) {
          setDosenList(response.data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch dosen list:', err);
        toast.error('Gagal memuat daftar dosen');
      } finally {
        setIsLoadingDosen(false);
      }
    };

    fetchDosen();
  }, []);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: MahasiswaFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        nim: data.nim,
        namaLengkap: data.namaLengkap,
        tempatTanggalLahir: data.tempatTanggalLahir,
        jenisKelamin: data.jenisKelamin,
        alamat: data.alamat,
        prodiId: data.prodiId,
        angkatan: data.angkatan,
        dosenWaliId: data.dosenWaliId || undefined,
        password: data.password,
      };

      const response = await mahasiswaAPI.create(payload);

      if (response.success) {
        toast.success('Mahasiswa berhasil ditambahkan');
        router.push('/admin/mahasiswa');
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal menambahkan mahasiswa');
        }
      }
    } catch (err: any) {
      console.error('Create mahasiswa error:', err);

      let errorMessage = 'Terjadi kesalahan saat menambahkan mahasiswa';

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
        title="Tambah Mahasiswa"
        description="Tambahkan data mahasiswa baru"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Mahasiswa', href: '/admin/mahasiswa' },
          { label: 'Tambah' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Mahasiswa */}
            <Card>
              <CardHeader>
                <CardTitle>Data Mahasiswa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NIM */}
                <div className="grid gap-2">
                  <Label htmlFor="nim">NIM *</Label>
                  <Input
                    id="nim"
                    placeholder="2207118333"
                    maxLength={10}
                    {...register('nim')}
                  />
                  {errors.nim && (
                    <p className="text-sm text-red-600">{errors.nim.message}</p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div className="grid gap-2">
                  <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                  <Input
                    id="namaLengkap"
                    placeholder="Joko Budianto"
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
                    onValueChange={(value) => setValue('jenisKelamin', value as 'L' | 'P')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
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
              </CardContent>
            </Card>

            {/* Akun & Password */}
            <Card>
              <CardHeader>
                <CardTitle>Akun & Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Akademik */}
            <Card>
              <CardHeader>
                <CardTitle>Data Akademik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Program Studi */}
                <div className="grid gap-2">
                  <Label htmlFor="prodiId">Program Studi *</Label>
                  <Select
                    onValueChange={(value) => setValue('prodiId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih prodi" />
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
                    onValueChange={(value) => setValue('angkatan', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih angkatan" />
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
                  <p className="text-xs text-muted-foreground">
                    Menampilkan {angkatanOptions.length} tahun terakhir
                  </p>
                </div>

                {/* Dosen Wali */}
                <div className="grid gap-2">
                  <Label htmlFor="dosenWaliId">Dosen Wali (Opsional)</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue(
                        'dosenWaliId',
                        value === 'none' ? undefined : parseInt(value)
                      )
                    }
                    disabled={isLoadingDosen}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingDosen ? 'Memuat...' : 'Pilih dosen wali'
                      } />
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
              </CardContent>
            </Card>

            {/* Action Buttons */}
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
                    'Simpan Mahasiswa'
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