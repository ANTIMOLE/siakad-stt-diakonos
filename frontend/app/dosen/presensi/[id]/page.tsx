/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Users, Calendar, RefreshCw, Trash2 } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { presensiAPI } from '@/lib/api';
import { Presensi, PresensiDetail, StatusPresensi } from '@/types/model';
const STATUS_OPTIONS: { value: StatusPresensi; label: string; color: string }[] = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-green-500' },
  { value: 'ALPHA', label: 'Alpha', color: 'bg-red-500' },
  { value: 'IZIN', label: 'Izin', color: 'bg-yellow-500' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-blue-500' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir', color: 'bg-gray-500' },
];
export default function PresensiKelasPage() {
  const params = useParams();
  const router = useRouter();
 
  const kelasMKId = parseInt((params.kelasMKId || params.id) as string);
  const [presensiList, setPresensiList] = useState<Presensi[]>([]);
  const [selectedPresensi, setSelectedPresensi] = useState<Presensi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPertemuan, setNewPertemuan] = useState<number>(1);
  const [newMateri, setNewMateri] = useState('');
  const [newCatatan, setNewCatatan] = useState('');
  // Edit states
  const [attendance, setAttendance] = useState<Record<number, { status: StatusPresensi; keterangan?: string }>>({});
  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // ============================================
  // FETCH PRESENSI LIST
  // ============================================
  const fetchPresensi = async () => {
    if (!kelasMKId || isNaN(kelasMKId)) {
      setError('ID kelas tidak valid');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching presensi for kelasMKId:', kelasMKId);
     
      const response = await presensiAPI.getAll({
        kelasMKId: kelasMKId
      });
      if (response.success) {
        setPresensiList(response.data || []);
       
        // Auto-calculate next pertemuan
        const maxPertemuan = Math.max(0, ...(response.data?.map(p => p.pertemuan) || []));
        setNewPertemuan(Math.min(16, maxPertemuan + 1));
      } else {
        setError(response.message || 'Gagal memuat data presensi');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memuat data presensi'
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPresensi();
  }, [kelasMKId]); // Re-fetch if kelasMKId changes
  // ============================================
  // LOAD PRESENSI DETAIL
  // ============================================
  const loadPresensiDetail = async (presensiId: number) => {
    try {
      const response = await presensiAPI.getById(presensiId);
     
      if (response.success && response.data) {
        setSelectedPresensi(response.data);
       
        // Initialize attendance state
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
  };
  // ============================================
  // CREATE NEW PRESENSI
  // ============================================
  const handleCreatePresensi = async () => {
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
       
        // Auto-open newly created presensi
        if (response.data) {
          loadPresensiDetail(response.data.id);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat presensi');
    } finally {
      setIsSaving(false);
    }
  };
  // ============================================
  // UPDATE ATTENDANCE
  // ============================================
  const handleSaveAttendance = async () => {
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
  };
  // ============================================
  // REFRESH MAHASISWA LIST
  // ============================================
  const handleRefreshMahasiswa = async () => {
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
          // Refresh presensi data
          await loadPresensiDetail(selectedPresensi.id);
        } else {
          toast.info('Daftar mahasiswa sudah lengkap', {
            description: 'Tidak ada mahasiswa baru yang perlu ditambahkan',
          });
        }
      }
    } catch (err: any) {
      console.error('Refresh error:', err);
      toast.error(
        err.response?.data?.message || 'Gagal refresh daftar mahasiswa'
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  // ============================================
  // DELETE PRESENSI
  // ============================================
  const handleDeletePresensi = async () => {
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
  };
  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data presensi..." />
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
        onRetry={fetchPresensi}
      />
    );
  }
  const kelasInfo = presensiList[0]?.kelasMK;
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Pertemuan Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Presensi Baru</DialogTitle>
                  <DialogDescription>
                    Buat sesi presensi untuk pertemuan berikutnya
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Pertemuan Ke-</Label>
                    <Select
                      value={newPertemuan.toString()}
                      onValueChange={(v) => setNewPertemuan(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Pertemuan {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Materi (Opsional)</Label>
                    <Input
                      placeholder="Contoh: Pengenalan Database"
                      value={newMateri}
                      onChange={(e) => setNewMateri(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Catatan (Opsional)</Label>
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Pertemuan List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                <button
                  key={p.id}
                  onClick={() => loadPresensiDetail(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPresensi?.id === p.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/50'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">Pertemuan {p.pertemuan}</div>
                  <div className="text-xs mt-1 opacity-80">
                    {new Date(p.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  {p.materi && (
                    <div className="text-xs mt-1 opacity-70 line-clamp-1">
                      {p.materi}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>
        {/* RIGHT: Attendance Input */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedPresensi
                  ? `Pertemuan ${selectedPresensi.pertemuan}`
                  : 'Pilih Pertemuan'}
              </div>
              {selectedPresensi && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefreshMahasiswa}
                    disabled={isRefreshing || isSaving}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Daftar Mahasiswa'}
                  </Button>
                  <Button onClick={handleSaveAttendance} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Pertemuan</DialogTitle>
                        <DialogDescription>
                          Apakah Anda yakin ingin menghapus presensi pertemuan {selectedPresensi.pertemuan}? Tindakan ini tidak dapat dibatalkan dan semua data presensi akan hilang.
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
                        <Button variant="destructive" onClick={handleDeletePresensi} disabled={isDeleting}>
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
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Pilih pertemuan di sebelah kiri untuk mengisi presensi</p>
              </div>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    💡 <strong>Tips:</strong> Jika ada mahasiswa baru yang terdaftar setelah presensi dibuat,
                    klik tombol <strong>&quot;Refresh Daftar Mahasiswa&quot;</strong> untuk menambahkan mereka ke daftar presensi.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4 mt-4">
                  {/* Materi & Catatan */}
                  {(selectedPresensi.materi || selectedPresensi.catatan) && (
                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                      {selectedPresensi.materi && (
                        <div>
                          <strong>Materi:</strong> {selectedPresensi.materi}
                        </div>
                      )}
                      {selectedPresensi.catatan && (
                        <div>
                          <strong>Catatan:</strong> {selectedPresensi.catatan}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Mahasiswa List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {selectedPresensi.detail?.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{detail.mahasiswa?.namaLengkap}</div>
                          <div className="text-sm text-muted-foreground">
                            {detail.mahasiswa?.nim}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={attendance[detail.mahasiswaId]?.status || detail.status}
                            onValueChange={(value: StatusPresensi) =>
                              setAttendance((prev) => ({
                                ...prev,
                                [detail.mahasiswaId]: {
                                  ...prev[detail.mahasiswaId],
                                  status: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                    {opt.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Badge
                            variant="outline"
                            className={
                              STATUS_OPTIONS.find(
                                (s) =>
                                  s.value ===
                                  (attendance[detail.mahasiswaId]?.status || detail.status)
                              )?.color.replace('bg-', 'border-') || ''
                            }
                          >
                            {
                              STATUS_OPTIONS.find(
                                (s) =>
                                  s.value ===
                                  (attendance[detail.mahasiswaId]?.status || detail.status)
                              )?.label
                            }
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}