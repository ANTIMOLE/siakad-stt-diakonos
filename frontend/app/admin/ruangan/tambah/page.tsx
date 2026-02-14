/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { ruanganAPI } from '@/lib/api';

export default function TambahRuanganPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nama: '',
    kapasitas: '30',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
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
      };

      const response = await ruanganAPI.create(payload);

      if (response.success) {
        toast.success('Ruangan berhasil ditambahkan');
        router.push('/admin/ruangan');
      } else {
        toast.error(response.message || 'Gagal menambahkan ruangan');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Ruangan"
        description="Tambah ruangan kelas baru"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Ruangan', href: '/admin/ruangan' },
          { label: 'Tambah' },
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
                      Simpan
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
                  <li>Kapasitas default: 30 mahasiswa</li>
                  <li>Ruangan baru otomatis aktif</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}