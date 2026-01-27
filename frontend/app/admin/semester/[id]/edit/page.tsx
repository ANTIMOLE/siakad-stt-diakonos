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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { semesterAPI } from '@/lib/api';

const PERIODE_OPTIONS = ['GANJIL', 'GENAP'];

export default function EditSemesterPage() {
  const params = useParams();
  const router = useRouter();
  const semesterId = parseInt(params.id as string);

  // STATE
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data - ALL FIELDS EDITABLE
  const [formData, setFormData] = useState({
    tahunAkademik: '',
    periode: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    periodeKRSMulai: '',
    periodeKRSSelesai: '',
    periodePerbaikanKRSMulai: '',
    periodePerbaikanKRSSelesai: '',
  });

  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await semesterAPI.getById(semesterId);
        if (!response.success || !response.data) {
          setError('Semester tidak ditemukan');
          return;
        }

        const semester = response.data;
        setIsActive(semester.isActive);

        // Convert dates to YYYY-MM-DD format
        const formatDateForInput = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };

        // ✅ Set ALL fields editable
        setFormData({
          tahunAkademik: semester.tahunAkademik || '',
          periode: semester.periode || '',
          tanggalMulai: formatDateForInput(semester.tanggalMulai),
          tanggalSelesai: formatDateForInput(semester.tanggalSelesai),
          periodeKRSMulai: formatDateForInput(semester.periodeKRSMulai),
          periodeKRSSelesai: formatDateForInput(semester.periodeKRSSelesai),
          periodePerbaikanKRSMulai: formatDateForInput(semester.periodePerbaikanKRSMulai),
          periodePerbaikanKRSSelesai: formatDateForInput(semester.periodePerbaikanKRSSelesai),
        });
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

    if (semesterId) {
      fetchData();
    }
  }, [semesterId]);

  // FORM HANDLERS
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tahunAkademik.trim()) {
      newErrors.tahunAkademik = 'Tahun Akademik harus diisi';
    } else if (!/^\d{4}\/\d{4}$/.test(formData.tahunAkademik.trim())) {
      newErrors.tahunAkademik = 'Format harus YYYY/YYYY (contoh: 2024/2025)';
    }

    if (!formData.periode) {
      newErrors.periode = 'Periode harus dipilih';
    }

    if (!formData.tanggalMulai) {
      newErrors.tanggalMulai = 'Tanggal mulai harus diisi';
    }

    if (!formData.tanggalSelesai) {
      newErrors.tanggalSelesai = 'Tanggal selesai harus diisi';
    }

    if (!formData.periodeKRSMulai) {
      newErrors.periodeKRSMulai = 'Periode KRS mulai harus diisi';
    }

    if (!formData.periodeKRSSelesai) {
      newErrors.periodeKRSSelesai = 'Periode KRS selesai harus diisi';
    }

    if (!formData.periodePerbaikanKRSMulai) {
      newErrors.periodePerbaikanKRSMulai = 'Periode perbaikan mulai harus diisi';
    }

    if (!formData.periodePerbaikanKRSSelesai) {
      newErrors.periodePerbaikanKRSSelesai = 'Periode perbaikan selesai harus diisi';
    }

    // Validate date ranges
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      if (new Date(formData.tanggalMulai) >= new Date(formData.tanggalSelesai)) {
        newErrors.tanggalSelesai = 'Tanggal selesai harus lebih besar dari tanggal mulai';
      }
    }

    if (formData.periodeKRSMulai && formData.periodeKRSSelesai) {
      if (new Date(formData.periodeKRSMulai) >= new Date(formData.periodeKRSSelesai)) {
        newErrors.periodeKRSSelesai = 'Periode KRS selesai harus lebih besar dari periode KRS mulai';
      }
    }

    if (formData.periodePerbaikanKRSMulai && formData.periodePerbaikanKRSSelesai) {
      if (new Date(formData.periodePerbaikanKRSMulai) >= new Date(formData.periodePerbaikanKRSSelesai)) {
        newErrors.periodePerbaikanKRSSelesai = 'Periode perbaikan selesai harus lebih besar dari periode perbaikan mulai';
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

      // ✅ Send ALL fields
      const payload = {
        tahunAkademik: formData.tahunAkademik.trim(),
        periode: formData.periode,
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
        periodeKRSMulai: formData.periodeKRSMulai,
        periodeKRSSelesai: formData.periodeKRSSelesai,
        periodePerbaikanKRSMulai: formData.periodePerbaikanKRSMulai,
        periodePerbaikanKRSSelesai: formData.periodePerbaikanKRSSelesai,
      };

      const response = await semesterAPI.update(semesterId, payload);

      if (response.success) {
        toast.success('Semester berhasil diupdate');
        router.push('/admin/semester');
      } else {
        toast.error(response.message || 'Gagal mengupdate semester');
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

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data semester..." />
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  // RENDER
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Semester"
        description="Update informasi semester"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Semester', href: '/admin/semester' },
          { label: 'Edit' },
        ]}
      />

      {isActive && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Badge variant="default">Semester Aktif</Badge>
            <p className="text-sm text-yellow-800">
              Ini adalah semester yang sedang aktif. Perubahan akan langsung mempengaruhi sistem KRS.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Semester */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Semester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tahun Akademik */}
                  <div className="space-y-2">
                    <Label htmlFor="tahunAkademik">
                      Tahun Akademik <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tahunAkademik"
                      value={formData.tahunAkademik}
                      onChange={(e) => handleChange('tahunAkademik', e.target.value)}
                      placeholder="Contoh: 2024/2025"
                      className={errors.tahunAkademik ? 'border-red-500' : ''}
                    />
                    {errors.tahunAkademik && (
                      <p className="text-sm text-red-500">{errors.tahunAkademik}</p>
                    )}
                  </div>

                  {/* Periode */}
                  <div className="space-y-2">
                    <Label htmlFor="periode">
                      Periode <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.periode}
                      onValueChange={(value) => handleChange('periode', value)}
                    >
                      <SelectTrigger className={errors.periode ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODE_OPTIONS.map((periode) => (
                          <SelectItem key={periode} value={periode}>
                            {periode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.periode && (
                      <p className="text-sm text-red-500">{errors.periode}</p>
                    )}
                  </div>
                </div>

                {/* Tanggal Semester */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tanggalMulai">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tanggalMulai"
                      type="date"
                      value={formData.tanggalMulai}
                      onChange={(e) => handleChange('tanggalMulai', e.target.value)}
                      className={errors.tanggalMulai ? 'border-red-500' : ''}
                    />
                    {errors.tanggalMulai && (
                      <p className="text-sm text-red-500">{errors.tanggalMulai}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggalSelesai">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tanggalSelesai"
                      type="date"
                      value={formData.tanggalSelesai}
                      onChange={(e) => handleChange('tanggalSelesai', e.target.value)}
                      className={errors.tanggalSelesai ? 'border-red-500' : ''}
                    />
                    {errors.tanggalSelesai && (
                      <p className="text-sm text-red-500">{errors.tanggalSelesai}</p>
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
                  <div className="space-y-2">
                    <Label htmlFor="periodeKRSMulai">
                      Periode KRS Mulai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="periodeKRSMulai"
                      type="date"
                      value={formData.periodeKRSMulai}
                      onChange={(e) => handleChange('periodeKRSMulai', e.target.value)}
                      className={errors.periodeKRSMulai ? 'border-red-500' : ''}
                    />
                    {errors.periodeKRSMulai && (
                      <p className="text-sm text-red-500">{errors.periodeKRSMulai}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodeKRSSelesai">
                      Periode KRS Selesai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="periodeKRSSelesai"
                      type="date"
                      value={formData.periodeKRSSelesai}
                      onChange={(e) => handleChange('periodeKRSSelesai', e.target.value)}
                      className={errors.periodeKRSSelesai ? 'border-red-500' : ''}
                    />
                    {errors.periodeKRSSelesai && (
                      <p className="text-sm text-red-500">{errors.periodeKRSSelesai}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="periodePerbaikanKRSMulai">
                      Perbaikan KRS Mulai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="periodePerbaikanKRSMulai"
                      type="date"
                      value={formData.periodePerbaikanKRSMulai}
                      onChange={(e) => handleChange('periodePerbaikanKRSMulai', e.target.value)}
                      className={errors.periodePerbaikanKRSMulai ? 'border-red-500' : ''}
                    />
                    {errors.periodePerbaikanKRSMulai && (
                      <p className="text-sm text-red-500">{errors.periodePerbaikanKRSMulai}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodePerbaikanKRSSelesai">
                      Perbaikan KRS Selesai <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="periodePerbaikanKRSSelesai"
                      type="date"
                      value={formData.periodePerbaikanKRSSelesai}
                      onChange={(e) => handleChange('periodePerbaikanKRSSelesai', e.target.value)}
                      className={errors.periodePerbaikanKRSSelesai ? 'border-red-500' : ''}
                    />
                    {errors.periodePerbaikanKRSSelesai && (
                      <p className="text-sm text-red-500">{errors.periodePerbaikanKRSSelesai}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Semester</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isActive ? 'default' : 'secondary'}>
                  {isActive ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Gunakan tombol &quot;Aktifkan&quot; di halaman list untuk mengaktifkan semester.
                </p>
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