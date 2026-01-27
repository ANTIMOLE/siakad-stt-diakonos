/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, AlertCircle, ArrowLeft } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

import { paketKRSAPI, kelasMKAPI, semesterAPI } from '@/lib/api';
import { KelasMK, Semester, PaketKRS } from '@/types/model';

// ============================================
// VALIDATION SCHEMA
// ============================================
const paketKRSSchema = z.object({
  namaPaket: z.string().min(5, 'Nama paket minimal 5 karakter'),
  angkatan: z.number().min(2020, 'Angkatan tidak valid'),
  prodiId: z.number().min(1, 'Pilih program studi'),
  semesterId: z.number().min(1, 'Pilih semester akademik'),
  semesterPaket: z.number().min(1).max(8, 'Semester 1-8'),
  selectedKelasMKIds: z.array(z.number()).min(1, 'Pilih minimal 1 mata kuliah'),
});

type PaketKRSFormData = z.infer<typeof paketKRSSchema>;

export default function EditPaketKRSPage() {
  const params = useParams();
  const router = useRouter();
  const paketId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [paket, setPaket] = useState<PaketKRS | null>(null);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [kelasMKList, setKelasMKList] = useState<KelasMK[]>([]);
  const [isLoadingPaket, setIsLoadingPaket] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMK, setSelectedMK] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaketKRSFormData>({
    resolver: zodResolver(paketKRSSchema),
  });

  const angkatan = watch('angkatan');
  const prodiId = watch('prodiId');
  const semesterId = watch('semesterId');
  const semesterPaket = watch('semesterPaket');

  // ============================================
  // FETCH PAKET DATA
  // ============================================
  useEffect(() => {
    const fetchPaket = async () => {
      try {
        setIsLoadingPaket(true);
        setError(null);

        const response = await paketKRSAPI.getById(paketId);

        if (!response.success || !response.data) {
          setError(response.message || 'Paket KRS tidak ditemukan');
          return;
        }

        const paketData = response.data;
        setPaket(paketData);

        // Pre-fill form
        setValue('namaPaket', paketData.namaPaket);
        setValue('angkatan', paketData.angkatan);
        setValue('prodiId', paketData.prodiId);
        setValue('semesterId', paketData.semesterId);
        setValue('semesterPaket', paketData.semesterPaket);

        // Pre-select mata kuliah
        const existingMKIds = paketData.detail?.map((d: { kelasMKId: any; }) => d.kelasMKId) || [];
        setSelectedMK(existingMKIds);
      } catch (err: any) {
        console.error('Fetch paket error:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data'
        );
      } finally {
        setIsLoadingPaket(false);
      }
    };

    if (paketId) {
      fetchPaket();
    }
  }, [paketId, setValue]);

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
        }
      } catch (err) {
        console.error('Failed to fetch semesters:', err);
        toast.error('Gagal memuat daftar semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemesters();
  }, []);

  // ============================================
  // FETCH KELAS MK (FILTERED BY SEMESTER)
  // ============================================
  useEffect(() => {
    if (!semesterId) {
      setKelasMKList([]);
      return;
    }

    const fetchKelasMK = async () => {
      try {
        setIsLoadingKelas(true);
        const response = await kelasMKAPI.getAll({ semester_id: semesterId });

        if (response.success) {
          setKelasMKList(response.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch kelas MK:', err);
        toast.error('Gagal memuat daftar kelas');
      } finally {
        setIsLoadingKelas(false);
      }
    };

    fetchKelasMK();
  }, [semesterId]);

  // ============================================
  // AUTO-GENERATE NAMA PAKET
  // ============================================
  useEffect(() => {
    if (angkatan && prodiId && semesterPaket && semesterId) {
      const prodiName = prodiId === 3 ? 'PAK' : 'Teologi';
      const semester = semesterList.find((s) => s.id === semesterId);
      const semesterName = semester
        ? `${semester.tahunAkademik} ${semester.periode}`
        : '';
      const namaPaket = `Paket Semester ${semesterPaket} ${prodiName} Angkatan ${angkatan} (${semesterName})`;
      setValue('namaPaket', namaPaket);
    }
  }, [angkatan, prodiId, semesterPaket, semesterId, semesterList, setValue]);

  // ============================================
  // CALCULATE TOTAL SKS
  // ============================================
  const totalSKS = kelasMKList
    .filter((mk) => selectedMK.includes(mk.id))
    .reduce((sum, mk) => sum + (mk.mataKuliah?.sks || 0), 0);

  // Update form value
  useEffect(() => {
    setValue('selectedKelasMKIds', selectedMK);
  }, [selectedMK, setValue]);

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: PaketKRSFormData) => {
    if (totalSKS > 24) {
      toast.error('Total SKS melebihi batas maksimal (24 SKS)');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        namaPaket: data.namaPaket,
        angkatan: data.angkatan,
        prodiId: data.prodiId,
        semesterId: data.semesterId,
        semesterPaket: data.semesterPaket,
        totalSKS: totalSKS,
        kelasMKIds: data.selectedKelasMKIds,
      };

      const response = await paketKRSAPI.update(paketId, payload);

      if (response.success) {
        toast.success('Paket KRS berhasil diupdate');
        router.push(`/admin/paket-krs/${paketId}`);
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(response.message || 'Gagal mengupdate paket KRS');
        }
      }
    } catch (err: any) {
      console.error('Update paket KRS error:', err);

      let errorMessage = 'Terjadi kesalahan saat mengupdate paket KRS';

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
  if (isLoadingPaket || isLoadingSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data paket KRS..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !paket) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Paket KRS tidak ditemukan'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Paket KRS"
        description={`Edit paket KRS: ${paket.namaPaket}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Paket KRS', href: '/admin/paket-krs' },
          { label: paket.namaPaket, href: `/admin/paket-krs/${paketId}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Paket */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Paket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nama Paket */}
                <div className="grid gap-2">
                  <Label htmlFor="namaPaket">Nama Paket *</Label>
                  <Input
                    id="namaPaket"
                    placeholder="Paket Semester 1 PAK Angkatan 2024"
                    {...register('namaPaket')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Otomatis terisi, bisa diedit
                  </p>
                  {errors.namaPaket && (
                    <p className="text-sm text-red-600">{errors.namaPaket.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Angkatan */}
                  <div className="grid gap-2">
                    <Label>Angkatan *</Label>
                    <Select
                      value={angkatan?.toString()}
                      onValueChange={(value) => setValue('angkatan', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih angkatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 1 - i).map((year) => (
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

                  {/* Program Studi */}
                  <div className="grid gap-2">
                    <Label>Program Studi *</Label>
                    <Select
                      value={prodiId?.toString()}
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Semester Akademik */}
                  <div className="grid gap-2">
                    <Label>Semester Akademik *</Label>
                    <Select
                      value={semesterId?.toString()}
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

                  {/* Semester Paket */}
                  <div className="grid gap-2">
                    <Label>Semester Paket *</Label>
                    <Select
                      value={semesterPaket?.toString()}
                      onValueChange={(value) =>
                        setValue('semesterPaket', parseInt(value))
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
                    {errors.semesterPaket && (
                      <p className="text-sm text-red-600">
                        {errors.semesterPaket.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pilih Mata Kuliah */}
            <Card>
              <CardHeader>
                <CardTitle>Pilih Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent>
                {!semesterId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pilih semester akademik terlebih dahulu untuk melihat kelas yang tersedia.
                    </AlertDescription>
                  </Alert>
                ) : isLoadingKelas ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Memuat kelas..." />
                  </div>
                ) : kelasMKList.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tidak ada kelas tersedia untuk semester ini.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {kelasMKList.map((kelas) => (
                      <div
                        key={kelas.id}
                        className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`mk-${kelas.id}`}
                          checked={selectedMK.includes(kelas.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMK([...selectedMK, kelas.id]);
                            } else {
                              setSelectedMK(selectedMK.filter((id) => id !== kelas.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`mk-${kelas.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {kelas.mataKuliah?.namaMK || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {kelas.mataKuliah?.kodeMK} •{' '}
                                {kelas.dosen?.namaLengkap || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {kelas.hari} {kelas.jamMulai}-{kelas.jamSelesai} •{' '}
                                {kelas.ruangan?.nama || 'N/A'}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {kelas.mataKuliah?.sks || 0} SKS
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {errors.selectedKelasMKIds && (
                  <p className="text-sm text-red-600 mt-2">
                    {errors.selectedKelasMKIds.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ringkasan */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Paket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Angkatan</p>
                  <p className="text-lg font-semibold">{angkatan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program Studi</p>
                  <p className="text-lg font-semibold">
                    {prodiId === 3 ? 'PAK' : prodiId === 4 ? 'Teologi' : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester Akademik</p>
                  <p className="text-lg font-semibold">
                    {semesterId
                      ? semesterList.find((s) => s.id === semesterId)?.tahunAkademik +
                        ' ' +
                        semesterList.find((s) => s.id === semesterId)?.periode
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester Paket</p>
                  <p className="text-lg font-semibold">{semesterPaket || '-'}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total Mata Kuliah</p>
                  <p className="text-2xl font-bold">{selectedMK.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total SKS</p>
                  <p className="text-2xl font-bold">{totalSKS}</p>
                </div>

                {/* Validation Alerts */}
                {totalSKS > 24 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Total SKS melebihi batas maksimal (24 SKS)
                    </AlertDescription>
                  </Alert>
                )}

                {totalSKS < 12 && selectedMK.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Total SKS kurang dari minimum normal (12 SKS)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSubmitting || selectedMK.length === 0 || totalSKS > 24
                  }
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
