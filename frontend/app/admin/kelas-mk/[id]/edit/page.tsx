/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { kelasMKAPI, mataKuliahAPI, dosenAPI, semesterAPI, ruanganAPI } from '@/lib/api';

const HARI_OPTIONS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export default function EditKelasMKPage() {
  const params = useParams();
  const router = useRouter();
  const kelasId = parseInt(params.id as string);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    mataKuliahId: '',
    dosenId: '',
    semesterId: '',
    ruanganId: '',
    hari: '',
    jamMulai: '',
    jamSelesai: '',
    kuotaMax: '',
    keterangan: '',
  });

  // Options
  const [mataKuliahList, setMataKuliahList] = useState<any[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [semesterList, setSemesterList] = useState<any[]>([]);
  const [ruanganList, setRuanganList] = useState<any[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch existing kelas data
        const kelasResponse = await kelasMKAPI.getById(kelasId);
        if (!kelasResponse.success || !kelasResponse.data) {
          setError('Kelas tidak ditemukan');
          return;
        }

        const kelas = kelasResponse.data;

        // Set form data from existing kelas
        setFormData({
          mataKuliahId: kelas.mataKuliah?.id?.toString() || '',
          dosenId: kelas.dosen?.id?.toString() || '',
          semesterId: kelas.semester?.id?.toString() || '',
          ruanganId: kelas.ruangan?.id?.toString() || '',
          hari: kelas.hari || '',
          jamMulai: kelas.jamMulai || '',
          jamSelesai: kelas.jamSelesai || '',
          kuotaMax: kelas.kuotaMax?.toString() || '',
          keterangan: kelas.keterangan || '',
        });

        // Fetch options in parallel
       const [mkResponse, dosenResponse, semesterResponse, ruanganResponse] = await Promise.all([
  mataKuliahAPI.getAll({ limit: 100 }),  // Reduce further
  dosenAPI.getAll({ limit: 100 }),
  semesterAPI.getAll(),
  ruanganAPI.getAll({ limit: 100, isActive: 'true' }),
]);

        if (mkResponse.success && mkResponse.data) {
          setMataKuliahList(mkResponse.data);
        }

        if (dosenResponse.success && dosenResponse.data) {
          setDosenList(dosenResponse.data);
        }

        if (semesterResponse.success && semesterResponse.data) {
          setSemesterList(semesterResponse.data);
        }

        if (ruanganResponse.success && ruanganResponse.data) {
          setRuanganList(ruanganResponse.data);
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

    if (kelasId) {
      fetchData();
    }
  }, [kelasId]);

  // ============================================
  // FORM HANDLERS
  // ============================================
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.mataKuliahId) {
      newErrors.mataKuliahId = 'Mata Kuliah harus dipilih';
    }
    if (!formData.dosenId) {
      newErrors.dosenId = 'Dosen harus dipilih';
    }
    if (!formData.semesterId) {
      newErrors.semesterId = 'Semester harus dipilih';
    }
    if (!formData.ruanganId) {
      newErrors.ruanganId = 'Ruangan harus dipilih';
    }
    if (!formData.hari) {
      newErrors.hari = 'Hari harus dipilih';
    }
    if (!formData.jamMulai) {
      newErrors.jamMulai = 'Jam mulai harus diisi';
    }
    if (!formData.jamSelesai) {
      newErrors.jamSelesai = 'Jam selesai harus diisi';
    }
    if (!formData.kuotaMax || parseInt(formData.kuotaMax) <= 0) {
      newErrors.kuotaMax = 'Kuota maksimal harus lebih dari 0';
    }

    // Validate time
    if (formData.jamMulai && formData.jamSelesai) {
      if (formData.jamMulai >= formData.jamSelesai) {
        newErrors.jamSelesai = 'Jam selesai harus lebih besar dari jam mulai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error('Mohon lengkapi semua field yang wajib diisi');
    return;
  }

  try {
    setIsSaving(true);

    // ✅ FIX: Use correct field names matching backend
    const payload = {
      mkId: parseInt(formData.mataKuliahId),          // ✅ mkId not mata_kuliah_id
      dosenId: parseInt(formData.dosenId),            // ✅ dosenId not dosen_id
      semesterId: parseInt(formData.semesterId),      // ✅ semesterId not semester_id
      ruanganId: parseInt(formData.ruanganId),        // ✅ ruanganId not ruangan_id
      hari: formData.hari,
      jamMulai: formData.jamMulai,                    // ✅ jamMulai not jam_mulai
      jamSelesai: formData.jamSelesai,                // ✅ jamSelesai not jam_selesai
      kuotaMax: parseInt(formData.kuotaMax),          // ✅ kuotaMax not kuota_max
      keterangan: formData.keterangan || '',
    };

    const response = await kelasMKAPI.update(kelasId, payload);

    if (response.success) {
      toast.success('Kelas berhasil diupdate');
      router.push(`/admin/kelas-mk/${kelasId}`);
    } else {
      toast.error(response.message || 'Gagal mengupdate kelas');
    }
  } catch (err: any) {
    console.error('Submit error:', err);
    toast.error(
      err.response?.data?.message ||
      err.message ||
      'Terjadi kesalahan saat menyimpan data'
    );
  } finally {
    setIsSaving(false);
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
        <LoadingSpinner size="lg" text="Memuat data kelas..." />
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
      {/* Header */}
      <PageHeader
        title="Edit Kelas"
        description="Update informasi kelas mata kuliah"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Kelas MK', href: '/admin/kelas-mk' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Mata Kuliah */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mata Kuliah */}
                <div className="space-y-2">
                  <Label htmlFor="mataKuliahId">
                    Mata Kuliah <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.mataKuliahId}
                    onValueChange={(value) => handleChange('mataKuliahId', value)}
                  >
                    <SelectTrigger
                      id="mataKuliahId"
                      className={errors.mataKuliahId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Pilih Mata Kuliah" />
                    </SelectTrigger>
                    <SelectContent>
                      {mataKuliahList.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id.toString()}>
                          {mk.kodeMK} - {mk.namaMK} ({mk.sks} SKS)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.mataKuliahId && (
                    <p className="text-sm text-red-500">{errors.mataKuliahId}</p>
                  )}
                </div>

                {/* Dosen */}
                <div className="space-y-2">
                  <Label htmlFor="dosenId">
                    Dosen Pengampu <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.dosenId}
                    onValueChange={(value) => handleChange('dosenId', value)}
                  >
                    <SelectTrigger
                      id="dosenId"
                      className={errors.dosenId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Pilih Dosen" />
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
                    <p className="text-sm text-red-500">{errors.dosenId}</p>
                  )}
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semesterId">
                    Semester <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.semesterId}
                    onValueChange={(value) => handleChange('semesterId', value)}
                  >
                    <SelectTrigger
                      id="semesterId"
                      className={errors.semesterId ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Pilih Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterList.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id.toString()}>
                          {semester.tahunAkademik} {semester.periode}
                          {semester.isActive && ' (Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.semesterId && (
                    <p className="text-sm text-red-500">{errors.semesterId}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Jadwal Perkuliahan */}
            <Card>
              <CardHeader>
                <CardTitle>Jadwal Perkuliahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Hari */}
                  <div className="space-y-2">
                    <Label htmlFor="hari">
                      Hari <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.hari}
                      onValueChange={(value) => handleChange('hari', value)}
                    >
                      <SelectTrigger
                        id="hari"
                        className={errors.hari ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Pilih Hari" />
                      </SelectTrigger>
                      <SelectContent>
                        {HARI_OPTIONS.map((hari) => (
                          <SelectItem key={hari} value={hari}>
                            {hari}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.hari && (
                      <p className="text-sm text-red-500">{errors.hari}</p>
                    )}
                  </div>

                  {/* Ruangan */}
                  <div className="space-y-2">
                    <Label htmlFor="ruanganId">
                      Ruangan <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.ruanganId}
                      onValueChange={(value) => handleChange('ruanganId', value)}
                    >
                      <SelectTrigger
                        id="ruanganId"
                        className={errors.ruanganId ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Pilih Ruangan" />
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
                      <p className="text-sm text-red-500">{errors.ruanganId}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Jam Mulai */}
                  <div className="space-y-2">
                    <Label htmlFor="jamMulai">
                      Jam Mulai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="jamMulai"
                      type="time"
                      value={formData.jamMulai}
                      onChange={(e) => handleChange('jamMulai', e.target.value)}
                      className={errors.jamMulai ? 'border-red-500' : ''}
                    />
                    {errors.jamMulai && (
                      <p className="text-sm text-red-500">{errors.jamMulai}</p>
                    )}
                  </div>

                  {/* Jam Selesai */}
                  <div className="space-y-2">
                    <Label htmlFor="jamSelesai">
                      Jam Selesai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="jamSelesai"
                      type="time"
                      value={formData.jamSelesai}
                      onChange={(e) => handleChange('jamSelesai', e.target.value)}
                      className={errors.jamSelesai ? 'border-red-500' : ''}
                    />
                    {errors.jamSelesai && (
                      <p className="text-sm text-red-500">{errors.jamSelesai}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Kuota */}
            <Card>
              <CardHeader>
                <CardTitle>Kuota Kelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kuotaMax">
                    Kuota Maksimal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="kuotaMax"
                    type="number"
                    min="1"
                    value={formData.kuotaMax}
                    onChange={(e) => handleChange('kuotaMax', e.target.value)}
                    placeholder="Contoh: 40"
                    className={errors.kuotaMax ? 'border-red-500' : ''}
                  />
                  {errors.kuotaMax && (
                    <p className="text-sm text-red-500">{errors.kuotaMax}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Jumlah maksimal mahasiswa yang dapat mengambil kelas ini
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Keterangan */}
            <Card>
              <CardHeader>
                <CardTitle>Keterangan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => handleChange('keterangan', e.target.value)}
                    placeholder="Keterangan tambahan (opsional)"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
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
                  disabled={isSaving}
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
