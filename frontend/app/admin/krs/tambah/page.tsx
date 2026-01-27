/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, ArrowLeft, AlertCircle, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { krsAPI, mahasiswaAPI, semesterAPI, paketKRSAPI } from '@/lib/api';
import { Mahasiswa, Semester, PaketKRS } from '@/types/model';

export default function AssignKRSPage() {
  const router = useRouter();

  // STATE
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [paketKRSList, setPaketKRSList] = useState<PaketKRS[]>([]);

  const [isLoadingMahasiswa, setIsLoadingMahasiswa] = useState(true);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [isLoadingPaket, setIsLoadingPaket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Form values
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState<number | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [selectedPaketId, setSelectedPaketId] = useState<number | null>(null);

  // Mahasiswa search states
  const [mahasiswaOpen, setMahasiswaOpen] = useState(false);
  const [mahasiswaQuery, setMahasiswaQuery] = useState('');
  const mahasiswaRef = useRef<HTMLDivElement>(null);

  // COMPUTED
  const selectedMahasiswa = mahasiswaList.find((m) => m.id === selectedMahasiswaId);
  const selectedSemester = semesterList.find((s) => s.id === selectedSemesterId);
  const selectedPaket = paketKRSList.find((p) => p.id === selectedPaketId);

  const canSubmit = !!selectedMahasiswaId && !!selectedSemesterId && !!selectedPaketId && !isSubmitting;

  const mahasiswaDisplayValue = selectedMahasiswa ? `${selectedMahasiswa.nim} - ${selectedMahasiswa.namaLengkap}` : '';

  const filteredMahasiswa = mahasiswaList.filter((m) => {
    const search = mahasiswaQuery.toLowerCase();
    return m.namaLengkap.toLowerCase().includes(search) || m.nim.includes(search);
  });

  // FETCH MAHASISWA
  useEffect(() => {
    const fetchMahasiswa = async () => {
      try {
        setIsLoadingMahasiswa(true);
        const response = await mahasiswaAPI.getAll({
          search: '',
          prodi: undefined,
          angkatan: undefined,
          status: undefined,
          page: 1,
          limit: 50, // naikkan sedikit biar lebih banyak opsi langsung
        });

        if (response.success && response.data) {
          setMahasiswaList(response.data);
        }
      } catch (err) {
        console.error('Fetch mahasiswa error:', err);
        toast.error('Gagal memuat daftar mahasiswa');
      } finally {
        setIsLoadingMahasiswa(false);
      }
    };

    fetchMahasiswa();
  }, []);

  // FETCH SEMESTER
  useEffect(() => {
    const fetchSemester = async () => {
      try {
        setIsLoadingSemester(true);
        const response = await semesterAPI.getAll();

        if (response.success && response.data) {
          setSemesterList(response.data);
          const active = response.data.find((s) => s.isActive);
          if (active) setSelectedSemesterId(active.id);
        }
      } catch (err) {
        console.error('Fetch semester error:', err);
        toast.error('Gagal memuat daftar semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchSemester();
  }, []);

  // FETCH PAKET KRS
  useEffect(() => {
    if (!selectedMahasiswaId || !selectedSemesterId) {
      setPaketKRSList([]);
      setSelectedPaketId(null);
      return;
    }

    const fetchPaketKRS = async () => {
      try {
        setIsLoadingPaket(true);
        const mahasiswa = mahasiswaList.find((m) => m.id === selectedMahasiswaId);
        if (!mahasiswa) return;

        const response = await paketKRSAPI.getAll({
        });

        if (response.success && response.data) {
          setPaketKRSList(response.data);
          if (response.data.length === 1) {
            setSelectedPaketId(response.data[0].id);
          }
        }
      } catch (err) {
        console.error('Fetch paket KRS error:', err);
        toast.error('Gagal memuat daftar paket KRS');
      } finally {
        setIsLoadingPaket(false);
      }
    };

    fetchPaketKRS();
  }, [selectedMahasiswaId, selectedSemesterId, mahasiswaList]);

  // Click outside for mahasiswa
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mahasiswaRef.current && !mahasiswaRef.current.contains(event.target as Node)) {
        setMahasiswaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle select mahasiswa
  const handleSelectMahasiswa = (m: Mahasiswa) => {
    setSelectedMahasiswaId(m.id);
    setMahasiswaOpen(false);
    setMahasiswaQuery('');
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      const response = await krsAPI.create({
        mahasiswaId: selectedMahasiswaId!,
        semesterId: selectedSemesterId!,
        paketKRSId: selectedPaketId!,
      });

      if (response.success) {
        toast.success('KRS berhasil di-assign!');
        router.push('/admin/krs');
      } else {
        toast.error(response.message || 'Gagal meng-assign KRS');
      }
    } catch (err: any) {
      console.error('Assign KRS error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePaket = () => {
    router.push('/admin/paket-krs/tambah');
  };

  if (isLoadingMahasiswa || isLoadingSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Data" message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign KRS Baru"
        description="Assign KRS mahasiswa menggunakan paket yang sudah tersedia"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'KRS', href: '/admin/krs' },
          { label: 'Assign KRS Baru' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.push('/admin/krs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Catatan Penting:</strong> Assign KRS hanya menggunakan{' '}
          <strong>Paket KRS yang sudah ada</strong>. Jika perlu modifikasi, buat paket baru dulu.
        </AlertDescription>
      </Alert>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Form Assign KRS</CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible space-y-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pilih Mahasiswa */}
            <div className="space-y-2">
              <Label htmlFor="mahasiswa" className="required">
                Pilih Mahasiswa
              </Label>
              <div className="relative" ref={mahasiswaRef}>
                <Input
                  placeholder="Cari mahasiswa..."
                  value={mahasiswaOpen ? mahasiswaQuery : mahasiswaDisplayValue}
                  onChange={(e) => setMahasiswaQuery(e.target.value)}
                  onFocus={() => {
                    setMahasiswaOpen(true);
                    if (!mahasiswaOpen) setMahasiswaQuery('');
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground flex items-center"
                  onClick={() => setMahasiswaOpen(!mahasiswaOpen)}
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </button>
                {mahasiswaOpen && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto mt-1">
                    {filteredMahasiswa.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">Tidak ditemukan</div>
                    ) : (
                      filteredMahasiswa.map((mahasiswa) => (
                        <div
                          key={mahasiswa.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                          onClick={() => handleSelectMahasiswa(mahasiswa)}
                        >
                          <div className="font-medium">
                            <span className="font-mono">{mahasiswa.nim}</span> - {mahasiswa.namaLengkap}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mahasiswa.prodi?.nama} • Angkatan {mahasiswa.angkatan}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {selectedMahasiswa && (
                <p className="text-sm text-muted-foreground">
                  {selectedMahasiswa.prodi?.nama} • Angkatan {selectedMahasiswa.angkatan}
                </p>
              )}
            </div>

            {/* Pilih Semester */}
            <div className="space-y-2">
              <Label htmlFor="semester" className="required">
                Pilih Semester
              </Label>
              <Select
                value={selectedSemesterId?.toString() ?? ''}
                onValueChange={(v) => setSelectedSemesterId(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester..." />
                </SelectTrigger>
                <SelectContent>
                  {semesterList.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id.toString()}>
                      {sem.tahunAkademik} - {sem.periode}
                      {sem.isActive && <span className="ml-2 text-xs text-green-600">(Aktif)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Paket KRS */}
            {selectedMahasiswaId && selectedSemesterId && (
              <div className="space-y-2">
                <Label htmlFor="paket" className="required">
                  Pilih Paket KRS
                </Label>

                {isLoadingPaket ? (
                  <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
                    <LoadingSpinner size="sm" text="Memuat paket..." />
                  </div>
                ) : paketKRSList.length === 0 ? (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-900">
                      <strong>Tidak ada paket KRS tersedia</strong> untuk angkatan{' '}
                      {selectedMahasiswa?.angkatan} • {selectedMahasiswa?.prodi?.nama}.
                      <br />
                      Silakan buat paket baru terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={selectedPaketId?.toString() ?? ''}
                    onValueChange={(v) => setSelectedPaketId(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket KRS..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paketKRSList.map((paket) => (
                        <SelectItem key={paket.id} value={paket.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{paket.namaPaket}</div>
                              <div className="text-xs text-muted-foreground">
                                Semester {paket.semesterPaket} • {paket.totalSKS} SKS •{' '}
                                {paket._count?.detail || 0} Mata Kuliah
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedPaket && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">
                          Paket terpilih: {selectedPaket.namaPaket}
                        </p>
                        <p className="text-green-700">
                          Total SKS: {selectedPaket.totalSKS} • {selectedPaket._count?.detail || 0} Mata Kuliah
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreatePaket}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat Paket Baru
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Meng-assign...' : 'Assign KRS'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}