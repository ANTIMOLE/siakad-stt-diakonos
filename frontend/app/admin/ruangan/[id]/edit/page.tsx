/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { ruanganAPI } from '@/lib/api';

export default function EditRuanganPage() {
  const router = useRouter();
  const params = useParams();
  const ruanganId = parseInt(params.id as string);

  const [formData, setFormData] = useState({
    nama: '',
    kapasitas: '30',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await ruanganAPI.getById(ruanganId);

        if (response.success && response.data) {
          const ruangan = response.data;
          setFormData({
            nama: ruangan.nama || '',
            kapasitas: (ruangan.kapasitas || 30).toString(),
            isActive: ruangan.isActive ?? true,
          });
        } else {
          setError(response.message || 'Gagal memuat data ruangan');
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

    if (ruanganId) {
      fetchRuangan();
    }
  }, [ruanganId]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama ruangan harus diisi';
    } else if (formData.nama.trim().length < 2) {
      newErrors.nama = 'Nama ruangan minimal 2 karakter';
    }

    const kapasitas = parseInt(formData.kapasitas);
    if (!formData.kapasitas) {
      newErrors.kapasitas = 'Kapasitas harus diisi';
    } else if (isNaN(kapasitas) || kapasitas < 1) {
      newErrors.kapasitas = 'Kapasitas minimal 1';
    } else if (kapasitas > 200) {
      newErrors.kapasitas = 'Kapasitas maksimal 200';
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
      setIsSubmitting(true);

      const payload = {
        nama: formData.nama.trim(),
        kapasitas: parseInt(formData.kapasitas),
        isActive: formData.isActive,
      };

      const response = await ruanganAPI.update(ruanganId, payload);

      if (response.success) {
        toast.success('Ruangan berhasil diupdate');
        router.push('/admin/ruangan');
      } else {
        toast.error(response.message || 'Gagal mengupdate ruangan');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat menyimpan data'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/ruangan');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data ruangan..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Ruangan"
        description="Update informasi ruangan kelas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Ruangan', href: '/admin/ruangan' },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Ruangan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">
                    Nama Ruangan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => handleChange('nama', e.target.value)}
                    placeholder="Contoh: Lab Komputer 1"
                    className={errors.nama ? 'border-red-500' : ''}
                  />
                  {errors.nama && (
                    <p className="text-sm text-red-500">{errors.nama}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kapasitas">
                    Kapasitas <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="kapasitas"
                    type="number"
                    value={formData.kapasitas}
                    onChange={(e) => handleChange('kapasitas', e.target.value)}
                    placeholder="30"
                    min="1"
                    max="200"
                    className={errors.kapasitas ? 'border-red-500' : ''}
                  />
                  {errors.kapasitas && (
                    <p className="text-sm text-red-500">{errors.kapasitas}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Jumlah maksimal mahasiswa yang dapat menempati ruangan (1-200)
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Status Aktif</Label>
                    <p className="text-sm text-muted-foreground">
                      Ruangan non-aktif tidak dapat digunakan untuk kelas baru
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleChange('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Menyimpan...</>
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
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Batal
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informasi</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>Nama ruangan harus unik</li>
                  <li>Ruangan non-aktif tidak bisa digunakan kelas baru</li>
                  <li>Kelas yang sudah ada tetap menggunakan ruangan</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}