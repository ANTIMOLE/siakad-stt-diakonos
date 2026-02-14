/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Save, Lock, AlertCircle, ArrowLeft, Unlock, Download } from 'lucide-react';
import { toast } from 'sonner';

import { nilaiAPI, kelasMKAPI } from '@/lib/api';
import { KelasMK } from '@/types/model';
import { getNilaiHuruf, NILAI_BOBOT } from '@/lib/constants';

// ============================================
// TYPES
// ============================================
interface NilaiInput {
  mahasiswaId: number;
  nilaiAngka: number | null;
}

interface MahasiswaWithNilai {
  id: number;
  nim: string;
  namaLengkap: string;
  nilaiAngka: number | null;
  nilaiHuruf: string | null;
  bobot: number | null;
  isFinalized?: boolean;
}

export default function InputNilaiFormPage() {
  const params = useParams();
  const router = useRouter();
  const kelasId = Number(params.id);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [kelas, setKelas] = useState<KelasMK | null>(null);
  const [mahasiswaList, setMahasiswaList] = useState<MahasiswaWithNilai[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [isDownloadPDF, setIsDownloadPDF] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch kelas detail
        const kelasResponse = await kelasMKAPI.getById(kelasId);
        if (!kelasResponse.success || !kelasResponse.data) {
          throw new Error('Kelas tidak ditemukan');
        }
        setKelas(kelasResponse.data);

        // 2. Fetch nilai list (includes mahasiswa data)
        const nilaiResponse = await nilaiAPI.getByKelas(kelasId);
        if (nilaiResponse.success && nilaiResponse.data) {
          // Backend return object, bukan array langsung
          // Ambil array mahasiswa dari data.mahasiswa
          const mahasiswaData: MahasiswaWithNilai[] = nilaiResponse.data.mahasiswa.map((m: any) => ({
            id: m.mahasiswaId,
            nim: m.nim,
            namaLengkap: m.namaLengkap,
            nilaiAngka: m.nilaiAngka,
            nilaiHuruf: m.nilaiHuruf,
            // Convert bobot to number (handles Decimal/string from backend)
            bobot: m.bobot != null ? Number(m.bobot) : null,
            isFinalized: m.isFinalized,
          }));

          setMahasiswaList(mahasiswaData);

          // Check finalized dari backend's isAllFinalized
          const allFinalized = nilaiResponse.data.isAllFinalized || false;
          setIsFinalized(allFinalized);
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
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
  // HANDLERS
  // ============================================
  const handleNilaiChange = (mahasiswaId: number, value: string) => {
    const nilaiAngka = value === '' ? null : Number(value);

    // Validate range
    if (nilaiAngka !== null && (nilaiAngka < 0 || nilaiAngka > 100)) {
      toast.error('Nilai harus antara 0-100');
      return;
    }

    setMahasiswaList(prev =>
      prev.map(mhs => {
        if (mhs.id === mahasiswaId) {
          const nilaiHuruf = nilaiAngka !== null ? getNilaiHuruf(nilaiAngka) : null;
          const bobot = nilaiHuruf ? NILAI_BOBOT[nilaiHuruf] : null;
          return {
            ...mhs,
            nilaiAngka,
            nilaiHuruf,
            bobot,
          };
        }
        return mhs;
      })
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare payload
      const nilaiData = mahasiswaList
        .filter(mhs => mhs.nilaiAngka !== null)
        .map(mhs => ({
          mahasiswaId: mhs.id,
          nilaiAngka: mhs.nilaiAngka!,
        }));

      if (nilaiData.length === 0) {
        toast.error('Belum ada nilai yang diinput');
        return;
      }

      const response = await nilaiAPI.saveNilai(kelasId, nilaiData);

      if (response.success) {
        toast.success(`${nilaiData.length} nilai berhasil disimpan`);
        // Refresh data
        window.location.reload();
      } else {
        toast.error(response.message || 'Gagal menyimpan nilai');
      }
    } catch (err: any) {
      console.error('Save nilai error:', err);
      
      // Check if error is due to finalized status
      const errorMessage = err.response?.data?.message || err.message || '';
      
      if (errorMessage.includes('difinalisasi') || errorMessage.includes('unlock')) {
        // Show unlock dialog instead of just error
        toast.error('Nilai sudah difinalisasi', {
          description: 'Klik tombol "Buka Kembali" untuk mengedit nilai',
          duration: 5000,
        });
        setIsFinalized(true); // Update UI state
      } else {
        toast.error(errorMessage || 'Terjadi kesalahan saat menyimpan nilai');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);

      // Validate all students have nilai
      const missingNilai = mahasiswaList.filter(mhs => mhs.nilaiAngka === null);
      if (missingNilai.length > 0) {
        toast.error(
          `${missingNilai.length} mahasiswa belum memiliki nilai. Pastikan semua nilai sudah diinput.`
        );
        setShowFinalizeDialog(false);
        return;
      }

      const response = await nilaiAPI.finalize(kelasId);

      if (response.success) {
        toast.success('Nilai berhasil difinalisasi');
        setTimeout(() => router.push('/dosen/input-nilai'), 1000);
      } else {
        toast.error(response.message || 'Gagal memfinalisasi nilai');
      }
    } catch (err: any) {
      console.error('Finalize error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat memfinalisasi nilai'
      );
    } finally {
      setIsFinalizing(false);
      setShowFinalizeDialog(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);

      const response = await nilaiAPI.unlock(kelasId);

      if (response.success) {
        toast.success('Nilai berhasil dibuka kembali untuk diedit');
        setIsFinalized(false);
        window.location.reload();
      } else {
        toast.error(response.message || 'Gagal membuka nilai');
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat membuka nilai'
      );
    } finally {
      setIsUnlocking(false);
      setShowUnlockDialog(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleExportPDF = async () => {
    if (!kelas) {
      toast.error('Data kelas tidak tersedia');
      return;
    }
    setIsDownloadPDF(true);
    try {
      
      const blob = await nilaiAPI.exportNilaiKelasPDF(kelasId);

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const fileName = `Nilai_${kelas.mataKuliah?.kodeMK || 'kelas'}_${kelas.hari}_${kelas.jamMulai}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

       toast.success('PDF berhasil diunduh');

  }catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal download PDF');
    } finally {
      setIsDownloadPDF(false);
    }
}

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
  if (error || !kelas) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Kelas tidak ditemukan'}
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Nilai Mahasiswa"
        description={`${kelas.mataKuliah?.namaMK} (${kelas.mataKuliah?.kodeMK})`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Input Nilai', href: '/dosen/input-nilai' },
          { label: kelas.mataKuliah?.kodeMK || 'Kelas' },
        ]}

        actions={
          <>


            <Button
              onClick={handleExportPDF}
              disabled={isDownloadPDF || !kelas}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloadPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          </>
        }
      />

      {/* Kelas Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Mata Kuliah</p>
              <p className="font-medium">{kelas.mataKuliah?.namaMK}</p>
              <p className="text-sm text-muted-foreground">
                {kelas.mataKuliah?.sks} SKS
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jadwal</p>
              <p className="font-medium">{kelas.hari}</p>
              <p className="text-sm text-muted-foreground">
                {kelas.jamMulai} - {kelas.jamSelesai}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ruangan</p>
              <p className="font-medium">{kelas.ruangan?.nama || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Mahasiswa</p>
              <p className="font-medium">{mahasiswaList.length} orang</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Finalized */}
      {isFinalized && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Nilai sudah difinalisasi. Klik tombol &quot;Buka Kembali&quot; untuk mengedit nilai.
          </AlertDescription>
        </Alert>
      )}

      {/* Nilai Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Nilai Mahasiswa</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving || isFinalizing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              {isFinalized ? (
                <Button
                  variant="outline"
                  onClick={() => setShowUnlockDialog(true)}
                  disabled={isUnlocking}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  {isUnlocking ? 'Membuka...' : 'Buka Kembali'}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={isSaving || isFinalizing}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
                  </Button>
                  <Button
                    onClick={() => setShowFinalizeDialog(true)}
                    disabled={isSaving || isFinalizing}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Finalisasi
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead className="w-32">Nilai Angka</TableHead>
                  <TableHead className="w-24">Nilai Huruf</TableHead>
                  <TableHead className="w-24">Bobot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mahasiswaList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Belum ada mahasiswa yang mengambil kelas ini
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  mahasiswaList.map((mhs, idx) => (
                     <TableRow key={`${mhs.id}-${mhs.nim}`}>
                      <TableCell className="text-center">{idx + 1}</TableCell>
                      <TableCell className="font-mono">{mhs.nim}</TableCell>
                      <TableCell>{mhs.namaLengkap}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={mhs.nilaiAngka === null ? '' : mhs.nilaiAngka}
                          onChange={(e) => handleNilaiChange(mhs.id, e.target.value)}
                          className="w-28"
                          disabled={isFinalized}
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell>
                        {mhs.nilaiHuruf ? (
                          <Badge variant="outline">{mhs.nilaiHuruf}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mhs.bobot != null ? (
                          <span className="font-medium">{Number(mhs.bobot).toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Nilai?</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah difinalisasi, nilai tidak dapat diubah lagi. Pastikan semua nilai sudah benar. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="bg-primary hover:bg-primary/90"
            >
              {isFinalizing ? 'Memfinalisasi...' : 'Ya, Finalisasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka Nilai Kembali?</AlertDialogTitle>
            <AlertDialogDescription>
              Nilai yang sudah difinalisasi akan dibuka kembali untuk diedit. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlocking}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isUnlocking ? 'Membuka...' : 'Ya, Buka Kembali'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}