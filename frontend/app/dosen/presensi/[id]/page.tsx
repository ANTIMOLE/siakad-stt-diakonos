/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Users, Calendar, RefreshCw, Trash2, Info, MessageSquare } from 'lucide-react';
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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPertemuan, setNewPertemuan] = useState<number>(1);
  const [newMateri, setNewMateri] = useState('');
  const [newCatatan, setNewCatatan] = useState('');

  const [attendance, setAttendance] = useState<Record<number, { status: StatusPresensi; keterangan?: string }>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // ✅ NEW: Keterangan Dialog State
  const [isKeteranganDialogOpen, setIsKeteranganDialogOpen] = useState(false);
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState<number | null>(null);
  const [tempKeterangan, setTempKeterangan] = useState('');

  const fetchPresensi = async () => {
    if (!kelasMKId || isNaN(kelasMKId)) {
      setError('ID kelas tidak valid');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
     
      const response = await presensiAPI.getAll({
        kelasMKId: kelasMKId
      });
      if (response.success) {
        setPresensiList(response.data || []);
       
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
  }, [kelasMKId]);

  const loadPresensiDetail = async (presensiId: number) => {
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
  };

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

  // ✅ NEW: Open Keterangan Dialog
  const handleOpenKeteranganDialog = (mahasiswaId: number) => {
    setSelectedMahasiswaId(mahasiswaId);
    setTempKeterangan(attendance[mahasiswaId]?.keterangan || '');
    setIsKeteranganDialogOpen(true);
  };

  // ✅ NEW: Save Keterangan
  const handleSaveKeterangan = () => {
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
  };

  // ✅ NEW: Cancel Keterangan
  const handleCancelKeterangan = () => {
    setIsKeteranganDialogOpen(false);
    setSelectedMahasiswaId(null);
    setTempKeterangan('');
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data presensi..." />
      </div>
    );
  }

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
  
  // ✅ NEW: Get selected mahasiswa name for dialog title
  const selectedMahasiswa = selectedPresensi?.detail?.find(
    (d) => d.mahasiswaId === selectedMahasiswaId
  );

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
              <DialogContent className="bg-white">
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

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 font-semibold">Tips Presensi</AlertTitle>
        <AlertDescription className="text-blue-800 text-sm space-y-1">
          <p>• Pilih pertemuan dari daftar untuk mengisi atau mengubah presensi</p>
          <p>• Klik &quot;Refresh Daftar Mahasiswa&quot; jika ada mahasiswa baru yang KRS-nya baru disetujui</p>
          <p>• Klik tombol &quot;Keterangan&quot; untuk menambahkan catatan per mahasiswa</p>
          <p>• Jangan lupa simpan perubahan setelah mengisi presensi</p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
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
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedPresensi?.id === p.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg ring-4 ring-primary/20'
                      : 'hover:bg-muted hover:border-primary/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-base">Pertemuan {p.pertemuan}</div>
                    {selectedPresensi?.id === p.id && (
                      <Badge variant="secondary" className="bg-primary-foreground/20">
                        Terpilih
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    {new Date(p.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  {p.materi && (
                    <div className="text-sm mt-1 opacity-75 line-clamp-2 font-medium">
                      {p.materi}
                    </div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

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
                    size="sm"
                    onClick={handleRefreshMahasiswa}
                    disabled={isRefreshing || isSaving}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Mahasiswa
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
                        <DialogTitle>Konfirmasi Hapus Pertemuan</DialogTitle>
                        <DialogDescription>
                          Apakah Anda yakin ingin menghapus presensi pertemuan {selectedPresensi.pertemuan}? 
                          Tindakan ini tidak dapat dibatalkan dan semua data presensi akan hilang.
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
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Pilih pertemuan untuk mengisi presensi</p>
                <p className="text-sm mt-1">Klik pertemuan di sebelah kiri untuk mulai mengisi</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {(selectedPresensi.materi || selectedPresensi.catatan) && (
                    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm border">
                      {selectedPresensi.materi && (
                        <div>
                          <strong className="text-primary">Materi:</strong> {selectedPresensi.materi}
                        </div>
                      )}
                      {selectedPresensi.catatan && (
                        <div>
                          <strong className="text-primary">Catatan:</strong> {selectedPresensi.catatan}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {selectedPresensi.detail?.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-base">{detail.mahasiswa?.namaLengkap}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {detail.mahasiswa?.nim}
                          </div>
                          {/* ✅ NEW: Show keterangan if exists */}
                          {(attendance[detail.mahasiswaId]?.keterangan || detail.keterangan) && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              💬 {attendance[detail.mahasiswaId]?.keterangan || detail.keterangan}
                            </div>
                          )}
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
                          
                          {/* ✅ NEW: Keterangan Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenKeteranganDialog(detail.mahasiswaId)}
                            className="gap-1 h-9"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Keterangan
                          </Button>
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

      {/* ✅ NEW: Keterangan Dialog */}
      <Dialog open={isKeteranganDialogOpen} onOpenChange={setIsKeteranganDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Keterangan</DialogTitle>
            <DialogDescription>
              {selectedMahasiswa && (
                <>
                  <span className="font-medium">{selectedMahasiswa.mahasiswa?.namaLengkap}</span>
                  {' '}({selectedMahasiswa.mahasiswa?.nim})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="keterangan-input">Keterangan</Label>
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
            <Button
              variant="outline"
              onClick={handleCancelKeterangan}
            >
              Batal
            </Button>
            <Button onClick={handleSaveKeterangan}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}