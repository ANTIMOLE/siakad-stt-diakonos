/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, ArrowLeft, AlertCircle, ChevronsUpDown } from 'lucide-react';

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

  // ✅ Search states for Mata Kuliah
  const [mkOpen, setMkOpen] = useState(false);
  const [mkQuery, setMkQuery] = useState('');
  const mkRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Search states for Dosen
  const [dosenOpen, setDosenOpen] = useState(false);
  const [dosenQuery, setDosenQuery] = useState('');
  const dosenRef = useRef<HTMLDivElement>(null);

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

  // ✅ Filtered mata kuliah based on search query
  const filteredMataKuliah = mataKuliahList.filter((mk) => {
    const search = mkQuery.toLowerCase();
    return (
      mk.namaMK.toLowerCase().includes(search) ||
      mk.kodeMK.toLowerCase().includes(search)
    );
  });

  // ✅ NEW: Filtered dosen based on search query
  const filteredDosen = dosenList.filter((dosen) => {
    const search = dosenQuery.toLowerCase();
    return (
      dosen.namaLengkap.toLowerCase().includes(search) ||
      dosen.nidn.includes(search)
    );
  });

  // ============================================
  // FETCH MATA KULIAH LIST
  // ============================================
  useEffect(() => {
    const fetchMataKuliah = async () => {
      try {
        setIsLoadingMK(true);
        const response = await mataKuliahAPI.getAll({ limit: 500 });

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
        const response = await dosenAPI.getAll({
          status: 'AKTIF',
          limit: 500,
        });

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
        const response = await ruanganAPI.getAll({
          isActive: 'true',
          limit: 500,
        });

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

  // ✅ Click outside handler for Mata Kuliah dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mkRef.current && !mkRef.current.contains(event.target as Node)) {
        setMkOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ NEW: Click outside handler for Dosen dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dosenRef.current && !dosenRef.current.contains(event.target as Node)) {
        setDosenOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // GET SELECTED DATA
  // ============================================
  const selectedMK = mataKuliahList.find((mk) => mk.id === selectedMKId);
  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);
  const selectedDosen = dosenList.find((d) => d.id === selectedDosenId);
  const selectedRuangan = ruanganList.find((r) => r.id === selectedRuanganId);

  // ✅ Display value for MK input
  const mkDisplayValue = selectedMK ? `${selectedMK.kodeMK} - ${selectedMK.namaMK}` : '';

  // ✅ NEW: Display value for Dosen input
  const dosenDisplayValue = selectedDosen ? `${selectedDosen.namaLengkap} (${selectedDosen.nidn})` : '';

  // ✅ Handle select mata kuliah
  const handleSelectMK = (mk: MataKuliah) => {
    setValue('mkId', mk.id);
    setMkOpen(false);
    setMkQuery('');
  };

  // ✅ NEW: Handle select dosen
  const handleSelectDosen = (dosen: Dosen) => {
    setValue('dosenId', dosen.id);
    setDosenOpen(false);
    setDosenQuery('');
  };

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
        keterangan: data.keterangan || '',
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
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Informasi Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-visible">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* ✅ Mata Kuliah with Search */}
                  <div className="grid gap-2">
                    <Label>Mata Kuliah *</Label>
                    <div className="relative" ref={mkRef}>
                      <Input
                        placeholder="Cari mata kuliah..."
                        value={mkOpen ? mkQuery : mkDisplayValue}
                        onChange={(e) => setMkQuery(e.target.value)}
                        onFocus={() => {
                          setMkOpen(true);
                          if (!mkOpen) setMkQuery('');
                        }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground flex items-center"
                        onClick={() => setMkOpen(!mkOpen)}
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </button>
                      {mkOpen && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto mt-1">
                          {filteredMataKuliah.length === 0 ? (
                            <div className="p-2 text-center text-gray-500">
                              Tidak ditemukan
                            </div>
                          ) : (
                            filteredMataKuliah.map((mk) => (
                              <div
                                key={mk.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                                onClick={() => handleSelectMK(mk)}
                              >
                                <div className="font-medium">
                                  <span className="font-mono text-blue-600">{mk.kodeMK}</span> - {mk.namaMK}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {mk.sks} SKS • Semester {mk.semesterIdeal}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
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
                      <strong>{selectedMK.namaMK}</strong> • {selectedMK.sks} SKS • Semester{' '}
                      {selectedMK.semesterIdeal}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Pengampu & Ruangan */}
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Pengampu & Ruangan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-visible">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* ✅ NEW: Dosen with Search */}
                  <div className="grid gap-2">
                    <Label>Dosen Pengampu *</Label>
                    <div className="relative" ref={dosenRef}>
                      <Input
                        placeholder="Cari dosen..."
                        value={dosenOpen ? dosenQuery : dosenDisplayValue}
                        onChange={(e) => setDosenQuery(e.target.value)}
                        onFocus={() => {
                          setDosenOpen(true);
                          if (!dosenOpen) setDosenQuery('');
                        }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground flex items-center"
                        onClick={() => setDosenOpen(!dosenOpen)}
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </button>
                      {dosenOpen && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto mt-1">
                          {filteredDosen.length === 0 ? (
                            <div className="p-2 text-center text-gray-500">
                              Tidak ditemukan
                            </div>
                          ) : (
                            filteredDosen.map((dosen) => (
                              <div
                                key={dosen.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                                onClick={() => handleSelectDosen(dosen)}
                              >
                                <div className="font-medium">{dosen.namaLengkap}</div>
                                <div className="text-xs text-muted-foreground">
                                  NIDN: {dosen.nidn}
                                  {dosen.prodi && ` • ${dosen.prodi.nama}`}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {errors.dosenId && (
                      <p className="text-sm text-red-600">{errors.dosenId.message}</p>
                    )}
                  </div>

                  {/* Ruangan */}
                  <div className="grid gap-2">
                    <Label>Ruangan *</Label>
                    <Select onValueChange={(value) => setValue('ruanganId', parseInt(value))}>
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
                    <Select onValueChange={(value: any) => setValue('hari', value)}>
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
                    <Input id="jamMulai" type="time" {...register('jamMulai')} />
                    {errors.jamMulai && (
                      <p className="text-sm text-red-600">{errors.jamMulai.message}</p>
                    )}
                  </div>

                  {/* Jam Selesai */}
                  <div className="grid gap-2">
                    <Label htmlFor="jamSelesai">Jam Selesai *</Label>
                    <Input id="jamSelesai" type="time" {...register('jamSelesai')} />
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
                  <p className="font-medium line-clamp-2">{selectedMK?.namaMK || '-'}</p>
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
