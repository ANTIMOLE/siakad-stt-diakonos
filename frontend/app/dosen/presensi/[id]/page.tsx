/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Users, Calendar, RefreshCw, Trash2, Info, MessageSquare, Edit, Download } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { presensiAPI } from '@/lib/api';
import { Presensi, StatusPresensi } from '@/types/model';

// ✅ Constants outside component
const STATUS_OPTIONS: { value: StatusPresensi; label: string; color: string }[] = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500' },
  { value: 'ALPHA', label: 'Alpha', color: 'bg-red-500' },
  { value: 'IZIN', label: 'Izin', color: 'bg-yellow-500' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-blue-500' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir', color: 'bg-gray-500' },
];

const PERTEMUAN_ARRAY = Array.from({ length: 16 }, (_, i) => i + 1);

// ✅ Helper functions outside
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ✅ Extracted Components
const PertemuanCard = ({
  presensi,
  isSelected,
  onClick,
}: {
  presensi: Presensi;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
      isSelected
        ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/20 scale-[1.02]'
        : 'border-gray-200 hover:bg-primary/5 hover:border-primary/50 hover:shadow-md active:scale-[0.98]'
    }`}
  >
    {isSelected && (
      <Badge
        variant="secondary"
        className="absolute right-3 top-3 bg-primary-foreground/20 text-primary-foreground text-[11px] px-2 py-0.5"
      >
        ✓ Terpilih
      </Badge>
    )}
    <div className="mb-2">
      <div className="font-semibold text-base pr-16">Pertemuan {presensi.pertemuan}</div>
    </div>
    <div className="text-sm opacity-90">{formatDate(presensi.tanggal)}</div>
    {presensi.materi && (
      <div className="text-sm mt-1 opacity-75 line-clamp-2 font-medium">
        {presensi.materi}
      </div>
    )}
  </button>
);

const MahasiswaRow = ({
  detail,
  attendance,
  onStatusChange,
  onKeteranganClick,
}: {
  detail: any;
  attendance: Record<number, { status: StatusPresensi; keterangan?: string }>;
  onStatusChange: (mahasiswaId: number, status: StatusPresensi) => void;
  onKeteranganClick: (mahasiswaId: number) => void;
}) => {
  const currentStatus = attendance[detail.mahasiswaId]?.status || detail.status;
  const currentKeterangan = attendance[detail.mahasiswaId]?.keterangan || detail.keterangan;

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium text-base">{detail.mahasiswa?.namaLengkap}</div>
        <div className="text-sm text-muted-foreground font-mono">{detail.mahasiswa?.nim}</div>
        {currentKeterangan && (
          <div className="text-xs text-muted-foreground mt-1 italic">
            💬 {currentKeterangan}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={currentStatus} onValueChange={(v: StatusPresensi) => onStatusChange(detail.mahasiswaId, v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onKeteranganClick(detail.mahasiswaId)}
          className="gap-1 h-9"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Keterangan
        </Button>
      </div>
    </div>
  );
};

export default function PresensiKelasPage() {
  const params = useParams();
  const router = useRouter();

  const kelasMKId = parseInt((params.kelasMKId || params.id) as string);

  // State
  const [presensiList, setPresensiList] = useState<Presensi[]>([]);
  const [selectedPresensi, setSelectedPresensi] = useState<Presensi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPertemuan, setNewPertemuan] = useState<number>(1);
  const [newMateri, setNewMateri] = useState('');
  const [newCatatan, setNewCatatan] = useState('');

  const [attendance, setAttendance] = useState<Record<number, { status: StatusPresensi; keterangan?: string }>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isKeteranganDialogOpen, setIsKeteranganDialogOpen] = useState(false);
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState<number | null>(null);
  const [tempKeterangan, setTempKeterangan] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editMateri, setEditMateri] = useState('');
  const [editCatatan, setEditCatatan] = useState('');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingPertemuan, setIsDownloadingPertemuan] = useState(false);
  const [isDownloadingBeritaAcara, setIsDownloadingBeritaAcara] = useState(false);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const kelasInfo = useMemo(() => presensiList[0]?.kelasMK, [presensiList]);

  const selectedMahasiswa = useMemo(
    () => selectedPresensi?.detail?.find((d) => d.mahasiswaId === selectedMahasiswaId),
    [selectedPresensi, selectedMahasiswaId]
  );

  const hasMateriOrCatatan = useMemo(
    () => !!(selectedPresensi?.materi || selectedPresensi?.catatan),
    [selectedPresensi]
  );

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchPresensi = useCallback(async () => {
    if (!kelasMKId || isNaN(kelasMKId)) {
      setError('ID kelas tidak valid');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await presensiAPI.getAll({ kelasMKId });

      if (response.success) {
        setPresensiList(response.data || []);
        const maxPertemuan = Math.max(0, ...(response.data?.map((p) => p.pertemuan) || []));
        setNewPertemuan(Math.min(16, maxPertemuan + 1));
      } else {
        setError(response.message || 'Gagal memuat data presensi');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [kelasMKId]);

  useEffect(() => {
    fetchPresensi();
  }, [fetchPresensi]);

  // ============================================
  // LOAD DETAIL
  // ============================================
  const loadPresensiDetail = useCallback(async (presensiId: number) => {
    try {
      const response = await presensiAPI.getById(presensiId);

      if (response.success && response.data) {
        setSelectedPresensi(response.data);

        const initialAttendance: Record<number, { status: StatusPresensi; keterangan?: string }> = {};
        response.data.detail?.forEach((detail) => {
          initialAttendance[detail.mahasiswaId] = {
            status: detail.status,
            keterangan: detail.keterangan || undefined,
          };
        });
        setAttendance(initialAttendance);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat detail presensi');
    }
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCreatePresensi = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await presensiAPI.create({
        kelasMKId,
        pertemuan: newPertemuan,
        materi: newMateri || undefined,
        catatan: newCatatan || undefined,
      });

      if (response.success) {
        toast.success(`Presensi pertemuan ${newPertemuan} berhasil dibuat`);
        setIsCreateDialogOpen(false);
        setNewMateri('');
        setNewCatatan('');
        await fetchPresensi();

        if (response.data) {
          loadPresensiDetail(response.data.id);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat presensi');
    } finally {
      setIsSaving(false);
    }
  }, [kelasMKId, newPertemuan, newMateri, newCatatan, fetchPresensi, loadPresensiDetail]);

  const handleSaveAttendance = useCallback(async () => {
    if (!selectedPresensi) return;

    try {
      setIsSaving(true);
      const updates = Object.entries(attendance).map(([mahasiswaId, data]) => ({
        mahasiswaId: parseInt(mahasiswaId),
        status: data.status,
        keterangan: data.keterangan,
      }));

      const response = await presensiAPI.update(selectedPresensi.id, { updates });

      if (response.success) {
        toast.success('Presensi berhasil disimpan');
        await fetchPresensi();
        setSelectedPresensi(response.data || null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan presensi');
    } finally {
      setIsSaving(false);
    }
  }, [selectedPresensi, attendance, fetchPresensi]);

  const handleRefreshMahasiswa = useCallback(async () => {
    if (!selectedPresensi) return;

    try {
      setIsRefreshing(true);
      const response = await presensiAPI.refreshMahasiswaList(selectedPresensi.id);

      if (response.success && response.data) {
        const { added, total } = response.data;

        if (added > 0) {
          toast.success(`${added} mahasiswa baru ditambahkan`, {
            description: `Total mahasiswa sekarang: ${total}`,
          });
          await loadPresensiDetail(selectedPresensi.id);
        } else {
          toast.info('Daftar mahasiswa sudah lengkap');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal refresh daftar mahasiswa');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedPresensi, loadPresensiDetail]);

  const handleDeletePresensi = useCallback(async () => {
    if (!selectedPresensi) return;

    try {
      setIsDeleting(true);
      const response = await presensiAPI.delete(selectedPresensi.id);

      if (response.success) {
        toast.success(`Presensi pertemuan ${selectedPresensi.pertemuan} berhasil dihapus`);
        setSelectedPresensi(null);
        setAttendance({});
        await fetchPresensi();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus presensi');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedPresensi, fetchPresensi]);

  const handleStatusChange = useCallback((mahasiswaId: number, status: StatusPresensi) => {
    setAttendance((prev) => ({
      ...prev,
      [mahasiswaId]: {
        ...prev[mahasiswaId],
        status,
      },
    }));
  }, []);

  const handleOpenKeteranganDialog = useCallback((mahasiswaId: number) => {
    setSelectedMahasiswaId(mahasiswaId);
    setTempKeterangan(attendance[mahasiswaId]?.keterangan || '');
    setIsKeteranganDialogOpen(true);
  }, [attendance]);

  const handleSaveKeterangan = useCallback(() => {
    if (selectedMahasiswaId === null) return;

    setAttendance((prev) => ({
      ...prev,
      [selectedMahasiswaId]: {
        ...prev[selectedMahasiswaId],
        keterangan: tempKeterangan || undefined,
      },
    }));

    toast.success('Keterangan berhasil diubah', {
      description: 'Jangan lupa klik "Simpan" untuk menyimpan perubahan',
    });

    setIsKeteranganDialogOpen(false);
    setSelectedMahasiswaId(null);
    setTempKeterangan('');
  }, [selectedMahasiswaId, tempKeterangan]);

  const handleOpenEditDialog = useCallback(() => {
    if (!selectedPresensi) return;
    setEditMateri(selectedPresensi.materi || '');
    setEditCatatan(selectedPresensi.catatan || '');
    setIsEditDialogOpen(true);
  }, [selectedPresensi]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedPresensi) return;

    try {
      setIsSaving(true);

      const updates = Object.entries(attendance).map(([mahasiswaId, data]) => ({
        mahasiswaId: parseInt(mahasiswaId),
        status: data.status,
        keterangan: data.keterangan,
      }));

      const response = await presensiAPI.update(selectedPresensi.id, {
        updates,
        materi: editMateri || undefined,
        catatan: editCatatan || undefined,
      });

      if (response.success) {
        toast.success('Materi dan catatan berhasil diupdate');
        setIsEditDialogOpen(false);
        await fetchPresensi();
        await loadPresensiDetail(selectedPresensi.id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal update materi/catatan');
    } finally {
      setIsSaving(false);
    }
  }, [selectedPresensi, attendance, editMateri, editCatatan, fetchPresensi, loadPresensiDetail]);

  const handleDownloadPertemuan = useCallback(async () => {
    if (!selectedPresensi) {
      toast.error('Tidak ada presensi yang dipilih');
      return;
    }

    setIsDownloadingPertemuan(true);
    try {
      const blob = await presensiAPI.exportPresensiPertemuanPDF(selectedPresensi.id);
      downloadBlob(blob, `Presensi-Pertemuan-${selectedPresensi.pertemuan}.pdf`);
      toast.success('PDF presensi berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh PDF presensi');
    } finally {
      setIsDownloadingPertemuan(false);
    }
  }, [selectedPresensi]);

  const handleDownloadBeritaAcara = useCallback(async () => {
    setIsDownloadingBeritaAcara(true);
    try {
      const blob = await presensiAPI.exportBeritaAcaraPDF(kelasMKId);
      downloadBlob(blob, `Berita-Acara-Kelas-${kelasMKId}.pdf`);
      toast.success('PDF berita acara berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh PDF berita acara');
    } finally {
      setIsDownloadingBeritaAcara(false);
    }
  }, [kelasMKId]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data presensi..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Data" message={error} onRetry={fetchPresensi} />;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title={kelasInfo?.mataKuliah?.namaMK || 'Presensi Kelas'}
        description={`${kelasInfo?.mataKuliah?.kodeMK || ''} • ${kelasInfo?.hari || ''}, ${kelasInfo?.jamMulai || ''} - ${kelasInfo?.jamSelesai || ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Presensi', href: '/dosen/presensi' },
          { label: kelasInfo?.mataKuliah?.kodeMK || 'Kelas' },
        ]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Button
              onClick={handleDownloadPertemuan}
              disabled={isDownloadingPertemuan || !selectedPresensi}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingPertemuan ? 'Downloading...' : 'PDF Pertemuan'}
            </Button>
            <Button
              onClick={handleDownloadBeritaAcara}
              disabled={isDownloadingBeritaAcara}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadingBeritaAcara ? 'Downloading...' : 'PDF Berita Acara'}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Pertemuan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Buat Presensi Baru</DialogTitle>
                  <DialogDescription>
                    Buat sesi presensi untuk pertemuan berikutnya
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-sm">Pertemuan Ke-</Label>
                    <Select
                      value={newPertemuan.toString()}
                      onValueChange={(v) => setNewPertemuan(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERTEMUAN_ARRAY.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Pertemuan {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Materi (Opsional)</Label>
                    <Input
                      placeholder="Contoh: Pengenalan Database"
                      value={newMateri}
                      onChange={(e) => setNewMateri(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Catatan (Opsional)</Label>
                    <Textarea
                      placeholder="Catatan tambahan..."
                      value={newCatatan}
                      onChange={(e) => setNewCatatan(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleCreatePresensi} disabled={isSaving}>
                    {isSaving ? 'Membuat...' : 'Buat Presensi'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 font-semibold text-sm">Tips Presensi</AlertTitle>
        <AlertDescription className="text-blue-800 text-xs space-y-0.5">
          <p>• Pilih pertemuan dari daftar untuk mengisi presensi</p>
          <p>• Klik &quot;Refresh&quot; jika ada mahasiswa baru yang KRS-nya baru disetujui</p>
          <p>• Klik &quot;Keterangan&quot; untuk menambahkan catatan per mahasiswa</p>
          <p>• Klik ikon edit untuk mengubah materi dan catatan pertemuan</p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daftar Pertemuan */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Daftar Pertemuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {presensiList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada pertemuan. Klik tombol di atas untuk membuat pertemuan baru.
              </p>
            ) : (
              presensiList.map((p) => (
                <PertemuanCard
                  key={p.id}
                  presensi={p}
                  isSelected={selectedPresensi?.id === p.id}
                  onClick={() => loadPresensiDetail(p.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Detail Presensi */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedPresensi ? `Pertemuan ${selectedPresensi.pertemuan}` : 'Pilih Pertemuan'}
              </div>
              {selectedPresensi && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshMahasiswa}
                    disabled={isRefreshing || isSaving}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                          Yakin ingin menghapus presensi pertemuan {selectedPresensi.pertemuan}?
                          Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          disabled={isDeleting}
                        >
                          Batal
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeletePresensi}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPresensi ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Pilih pertemuan untuk mengisi presensi</p>
                <p className="text-sm mt-1">Klik pertemuan di sebelah kiri untuk mulai</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hasMateriOrCatatan ? (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm border relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-8 gap-1"
                      onClick={handleOpenEditDialog}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {selectedPresensi.materi && (
                      <div className="pr-16">
                        <strong className="text-primary">Materi:</strong> {selectedPresensi.materi}
                      </div>
                    )}
                    {selectedPresensi.catatan && (
                      <div className="pr-16">
                        <strong className="text-primary">Catatan:</strong> {selectedPresensi.catatan}
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert className="border-dashed">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between text-sm">
                      <span>Belum ada materi atau catatan</span>
                      <Button variant="outline" size="sm" onClick={handleOpenEditDialog} className="gap-1">
                        <Edit className="h-3.5 w-3.5" />
                        Tambah
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {selectedPresensi.detail?.map((detail) => (
                    <MahasiswaRow
                      key={detail.id}
                      detail={detail}
                      attendance={attendance}
                      onStatusChange={handleStatusChange}
                      onKeteranganClick={handleOpenKeteranganDialog}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keterangan Dialog */}
      <Dialog open={isKeteranganDialogOpen} onOpenChange={setIsKeteranganDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Keterangan</DialogTitle>
            <DialogDescription>
              {selectedMahasiswa && (
                <>
                  <span className="font-medium">{selectedMahasiswa.mahasiswa?.namaLengkap}</span> (
                  {selectedMahasiswa.mahasiswa?.nim})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="keterangan-input" className="text-sm">
              Keterangan
            </Label>
            <Textarea
              id="keterangan-input"
              placeholder="Contoh: Sakit demam, Izin keperluan keluarga, dll..."
              value={tempKeterangan}
              onChange={(e) => setTempKeterangan(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Kosongkan jika tidak ada keterangan khusus
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKeteranganDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveKeterangan}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Materi & Catatan</DialogTitle>
            <DialogDescription>Pertemuan {selectedPresensi?.pertemuan}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-materi" className="text-sm">
                Materi
              </Label>
              <Input
                id="edit-materi"
                placeholder="Contoh: Pengenalan Database"
                value={editMateri}
                onChange={(e) => setEditMateri(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-catatan" className="text-sm">
                Catatan
              </Label>
              <Textarea
                id="edit-catatan"
                placeholder="Catatan tambahan..."
                value={editCatatan}
                onChange={(e) => setEditCatatan(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
