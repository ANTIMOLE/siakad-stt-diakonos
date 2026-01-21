'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, ArrowLeft, AlertCircle } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { kelasMKAPI, mataKuliahAPI, semesterAPI, dosenAPI, ruanganAPI } from '@/lib/api';
import { MataKuliah, Semester, Dosen, Ruangan } from '@/types/model';

// ============================================
// VALIDATION SCHEMA
// ============================================
const kelasMKSchema = z.object({
  mkId: z.number().min(1, 'Pilih mata kuliah'),
  semesterId: z.number().min(1, 'Pilih semester'),
  dosenId: z.number().min(1, 'Pilih dosen'),
  ruanganId: z.number().min(1, 'Pilih ruangan'),
  hari: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], {
    message: 'Pilih hari',
  }),
  jamMulai: z.string().min(1, 'Jam mulai wajib diisi'),
  jamSelesai: z.string().min(1, 'Jam selesai wajib diisi'),
  kuotaMax: z.number().min(1, 'Kuota minimal 1').max(100, 'Kuota maksimal 100'),
  keterangan: z.string().optional(),
});

type KelasMKFormData = z.infer<typeof kelasMKSchema>;

export default function TambahKelasMKPage() {
  const router = useRouter();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);

  const [isLoadingMK, setIsLoadingMK] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [isLoadingDosen, setIsLoadingDosen] = useState(true);
  const [isLoadingRuangan, setIsLoadingRuangan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<KelasMKFormData>({
    resolver: zodResolver(kelasMKSchema),
    defaultValues: {
      kuotaMax: 40,
    },
  });

  const selectedMKId = watch('mkId');
  const selectedSemesterId = watch('semesterId');
  const selectedDosenId = watch('dosenId');
  const selectedRuanganId = watch('ruanganId');
  const selectedHari = watch('hari');
  const jamMulai = watch('jamMulai');
  const jamSelesai = watch('jamSelesai');

  // ============================================
  // FETCH MATA KULIAH LIST
  // ============================================
  useEffect(() => {
    const fetchMataKuliah = async () => {
      try {
        setIsLoadingMK(true);
        const response = await mataKuliahAPI.getAll();

        if (response.success && response.data) {
          setMataKuliahList(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch mata kuliah:', err);
        toast.error('Gagal memuat daftar mata kuliah');
      } finally {
        setIsLoadingMK(false);
      }
    };

    fetchMataKuliah();
  }, []);

  // ============================================
  // FETCH SEMESTER LIST
  // ============================================
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setIsLoadingSemester(true);
        const response = await semesterAPI.getAll();

        if (response.success && response.data) {
          setSemesterList(response.data);

          // Auto-select active semester
          const activeSemester = response.data.find((s) => s.isActive);
          if (activeSemester) {
            setValue('semesterId', activeSemester.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch semesters:', err);
        toast.error('Gagal memuat daftar semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemesters();
  }, [setValue]);

  // ============================================
  // FETCH DOSEN LIST
  // ============================================
  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setIsLoadingDosen(true);
        const response = await dosenAPI.getAll({ status: 'AKTIF' });

        if (response.success && response.data) {
          setDosenList(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch dosen:', err);
        toast.error('Gagal memuat daftar dosen');
      } finally {
        setIsLoadingDosen(false);
      }
    };

    fetchDosen();
  }, []);

  // ============================================
  // FETCH RUANGAN LIST
  // ============================================
  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        setIsLoadingRuangan(true);
        const response = await ruanganAPI.getAll();

        if (response.success && response.data) {
          setRuanganList(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch ruangan:', err);
        toast.error('Gagal memuat daftar ruangan');
      } finally {
        setIsLoadingRuangan(false);
      }
    };

    fetchRuangan();
  }, []);

  // ============================================
  // GET SELECTED DATA
  // ============================================
  const selectedMK = mataKuliahList.find((mk) => mk.id === selectedMKId);
  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);
  const selectedDosen = dosenList.find((d) => d.id === selectedDosenId);
  const selectedRuangan = ruanganList.find((r) => r.id === selectedRuanganId);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: KelasMKFormData) => {
    // Validate time
    if (data.jamMulai >= data.jamSelesai) {
      toast.error('Jam selesai harus lebih besar dari jam mulai');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        mkId: data.mkId,
        semesterId: data.semesterId,
        dosenId: data.dosenId,
        ruanganId: data.ruanganId,
        hari: data.hari,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        kuotaMax: data.kuotaMax,
        keterangan: data.keterangan || null,
      };

      const response = await kelasMKAPI.create(payload);

      if (response.success) {
        toast.success('Kelas berhasil ditambahkan');
        router.push('/admin/kelas-mk');
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal menambahkan kelas');
        }
      }
    } catch (err: any) {
      console.error('Create kelas error:', err);

      let errorMessage = 'Terjadi kesalahan saat menambahkan kelas';

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
  // LOADING STATE
  // ============================================
  const isLoading =
    isLoadingMK || isLoadingSemester || isLoadingDosen || isLoadingRuangan;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data..." />
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Kelas Mata Kuliah"
        description="Buat kelas mata kuliah baru"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Kelas MK', href: '/admin/kelas-mk' },
          { label: 'Tambah' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Mata Kuliah */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Mata Kuliah */}
                  <div className="grid gap-2">
                    <Label>Mata Kuliah *</Label>
                    <Select
                      onValueChange={(value) => setValue('mkId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mata kuliah" />
                      </SelectTrigger>
                      <SelectContent>
                        {mataKuliahList.map((mk) => (
                          <SelectItem key={mk.id} value={mk.id.toString()}>
                            {mk.kodeMK} - {mk.namaMK}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.mkId && (
                      <p className="text-sm text-red-600">{errors.mkId.message}</p>
                    )}
                  </div>

                  {/* Semester */}
                  <div className="grid gap-2">
                    <Label>Semester *</Label>
                    <Select
                      value={selectedSemesterId?.toString()}
                      onValueChange={(value) => setValue('semesterId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesterList.map((sem) => (
                          <SelectItem key={sem.id} value={sem.id.toString()}>
                            {sem.tahunAkademik} {sem.periode}
                            {sem.isActive && ' (Aktif)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.semesterId && (
                      <p className="text-sm text-red-600">{errors.semesterId.message}</p>
                    )}
                  </div>
                </div>

                {selectedMK && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{selectedMK.namaMK}</strong> • {selectedMK.sks} SKS • Semester {selectedMK.semesterIdeal}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Pengampu & Ruangan */}
            <Card>
              <CardHeader>
                <CardTitle>Pengampu & Ruangan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Dosen */}
                  <div className="grid gap-2">
                    <Label>Dosen Pengampu *</Label>
                    <Select
                      onValueChange={(value) => setValue('dosenId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dosen" />
                      </SelectTrigger>
                      <SelectContent>
                        {dosenList.map((dosen) => (
                          <SelectItem key={dosen.id} value={dosen.id.toString()}>
                            {dosen.namaLengkap} ({dosen.nidn})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.dosenId && (
                      <p className="text-sm text-red-600">{errors.dosenId.message}</p>
                    )}
                  </div>

                  {/* Ruangan */}
                  <div className="grid gap-2">
                    <Label>Ruangan *</Label>
                    <Select
                      onValueChange={(value) => setValue('ruanganId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        {ruanganList.map((ruangan) => (
                          <SelectItem key={ruangan.id} value={ruangan.id.toString()}>
                            {ruangan.nama} (Kapasitas: {ruangan.kapasitas})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ruanganId && (
                      <p className="text-sm text-red-600">{errors.ruanganId.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jadwal */}
            <Card>
              <CardHeader>
                <CardTitle>Jadwal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Hari */}
                  <div className="grid gap-2">
                    <Label>Hari *</Label>
                    <Select
                      onValueChange={(value: any) => setValue('hari', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hari" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Senin">Senin</SelectItem>
                        <SelectItem value="Selasa">Selasa</SelectItem>
                        <SelectItem value="Rabu">Rabu</SelectItem>
                        <SelectItem value="Kamis">Kamis</SelectItem>
                        <SelectItem value="Jumat">Jumat</SelectItem>
                        <SelectItem value="Sabtu">Sabtu</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.hari && (
                      <p className="text-sm text-red-600">{errors.hari.message}</p>
                    )}
                  </div>

                  {/* Jam Mulai */}
                  <div className="grid gap-2">
                    <Label htmlFor="jamMulai">Jam Mulai *</Label>
                    <Input
                      id="jamMulai"
                      type="time"
                      {...register('jamMulai')}
                    />
                    {errors.jamMulai && (
                      <p className="text-sm text-red-600">{errors.jamMulai.message}</p>
                    )}
                  </div>

                  {/* Jam Selesai */}
                  <div className="grid gap-2">
                    <Label htmlFor="jamSelesai">Jam Selesai *</Label>
                    <Input
                      id="jamSelesai"
                      type="time"
                      {...register('jamSelesai')}
                    />
                    {errors.jamSelesai && (
                      <p className="text-sm text-red-600">{errors.jamSelesai.message}</p>
                    )}
                  </div>
                </div>

                {/* Kuota */}
                <div className="grid gap-2">
                  <Label htmlFor="kuotaMax">Kuota Maksimal *</Label>
                  <Input
                    id="kuotaMax"
                    type="number"
                    min="1"
                    max="100"
                    {...register('kuotaMax', { valueAsNumber: true })}
                  />
                  {errors.kuotaMax && (
                    <p className="text-sm text-red-600">{errors.kuotaMax.message}</p>
                  )}
                </div>

                {/* Keterangan */}
                <div className="grid gap-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Textarea
                    id="keterangan"
                    placeholder="Tambahkan catatan atau keterangan kelas..."
                    rows={3}
                    {...register('keterangan')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ringkasan */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Kelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mata Kuliah</p>
                  <p className="font-medium line-clamp-2">
                    {selectedMK?.namaMK || '-'}
                  </p>
                  {selectedMK && (
                    <Badge variant="outline" className="mt-1">
                      {selectedMK.sks} SKS
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">
                    {selectedSemester
                      ? `${selectedSemester.tahunAkademik} ${selectedSemester.periode}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dosen</p>
                  <p className="font-medium line-clamp-2">
                    {selectedDosen?.namaLengkap || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Ruangan</p>
                  <p className="font-medium">{selectedRuangan?.nama || '-'}</p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Jadwal</p>
                  <p className="font-medium">
                    {selectedHari || '-'}
                    {jamMulai && jamSelesai && (
                      <>
                        {', '}
                        {jamMulai} - {jamSelesai}
                      </>
                    )}
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
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Kelas
                    </>
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
