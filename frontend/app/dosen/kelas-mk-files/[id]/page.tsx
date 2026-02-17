/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Pencil,
  Trash2,
  BookOpen,
  Calendar,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

import { kelasMKAPI, kelasMKFileAPI } from '@/lib/api';

interface KelasMK {
  id: number;
  mataKuliah?: {
    kodeMK: string;
    namaMK: string;
    sks: number;
  };
  semester?: {
    tahunAkademik: string;
    periode: string;
  };
  hari?: string;
  jamMulai?: string;
  jamSelesai?: string;
  ruangan?: {
    nama: string;
  };
}

interface KelasMKFile {
  id: number;
  tipeFile: 'RPS' | 'RPP' | 'MATERI';
  namaFile: string;
  fileUrl: string;
  mingguKe?: number;
  keterangan?: string;
  uploadedAt: string;
  uploadedBy: {
    namaLengkap: string;
  };
}

// ✅ Constants outside component
const FILE_TYPE_LABELS = {
  RPS: 'RPS',
  RPP: 'RPP',
  MATERI: 'Materi',
} as const;

const FILE_TYPE_COLORS = {
  RPS: 'default' as const,
  RPP: 'secondary' as const,
  MATERI: 'outline' as const,
};

export default function DosenMateriKelasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const kelasMKId = parseInt(resolvedParams.id);

  const [kelas, setKelas] = useState<KelasMK | null>(null);
  const [files, setFiles] = useState<KelasMKFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<KelasMKFile | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [fileWeekFilter, setFileWeekFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    tipeFile: 'MATERI' as 'RPS' | 'RPP' | 'MATERI',
    mingguKe: '',
    keterangan: '',
    file: null as File | null,
  });

  const [renameForm, setRenameForm] = useState('');

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchKelas = useCallback(async () => {
    try {
      const response = await kelasMKAPI.getById(kelasMKId);
      if (response?.data) {
        setKelas(response.data);
      }
    } catch (err: any) {
      console.error('Fetch kelas error:', err);
      setError('Gagal memuat data kelas');
    }
  }, [kelasMKId]);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await kelasMKFileAPI.getFilesByKelasForDosen(kelasMKId, {
        tipeFile: typeFilter !== 'ALL' ? typeFilter : undefined,
        mingguKe: fileWeekFilter === 'ALL' ? undefined : fileWeekFilter,
      });

      if (response?.data) {
        setFiles(response.data);
      } else {
        setError('Gagal memuat data file');
      }
    } catch (err: any) {
      console.error('Fetch files error:', err);
      setError(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [kelasMKId, typeFilter, fileWeekFilter]);

  useEffect(() => {
    fetchKelas();
    fetchFiles();
  }, [fetchKelas, fetchFiles]);

  useEffect(() => {
    if (typeFilter !== 'MATERI') {
      setFileWeekFilter('ALL');
    }
  }, [typeFilter]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleUpload = useCallback(async () => {
    if (!uploadForm.file) {
      toast.error('File harus dipilih');
      return;
    }

    if (uploadForm.tipeFile === 'MATERI' && !uploadForm.mingguKe) {
      toast.error('Minggu ke harus diisi untuk MATERI');
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('kelasMKId', kelasMKId.toString());
      formData.append('tipeFile', uploadForm.tipeFile);
      formData.append('file', uploadForm.file);

      let namaFile = `${uploadForm.tipeFile} ${kelas?.mataKuliah?.namaMK ?? ''}`;
      if (uploadForm.tipeFile === 'MATERI' && uploadForm.mingguKe) {
        namaFile += ` Minggu ${uploadForm.mingguKe}`;
        formData.append('mingguKe', uploadForm.mingguKe);
      }
      if (uploadForm.keterangan) {
        namaFile += ` - ${uploadForm.keterangan}`;
        formData.append('keterangan', uploadForm.keterangan);
      }
      formData.append('namaFile', namaFile);

      const response = await kelasMKFileAPI.uploadFile(formData);

      if (response?.success) {
        toast.success('File berhasil diupload');
        setShowUploadDialog(false);
        setUploadForm({
          tipeFile: 'MATERI',
          mingguKe: '',
          keterangan: '',
          file: null,
        });
        fetchFiles();
      } else {
        toast.error('Gagal upload file');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadForm, kelasMKId, kelas, fetchFiles]);

  const handleRename = useCallback(async () => {
    if (!selectedFile || !renameForm.trim()) {
      toast.error('Nama file harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await kelasMKFileAPI.renameFile(selectedFile.id, renameForm.trim());

      if (response?.success) {
        toast.success('Nama file berhasil diubah');
        setShowRenameDialog(false);
        setSelectedFile(null);
        setRenameForm('');
        fetchFiles();
      } else {
        toast.error('Gagal mengubah nama file');
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, renameForm, fetchFiles]);

  const handleDelete = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);

      const response = await kelasMKFileAPI.deleteFile(selectedFile.id);

      if (response?.success) {
        toast.success('File berhasil dihapus');
        setShowDeleteDialog(false);
        setSelectedFile(null);
        fetchFiles();
      } else {
        toast.error('Gagal menghapus file');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, fetchFiles]);

  const handleDownload = useCallback((fileId: number) => {
    const url = kelasMKFileAPI.getFileUrl(fileId);
    window.open(url, '_blank');
  }, []);

  const handleRetry = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  const openUploadDialog = useCallback(() => {
    setUploadForm({
      tipeFile: 'MATERI',
      mingguKe: '',
      keterangan: '',
      file: null,
    });
    setShowUploadDialog(true);
  }, []);

  const openRenameDialog = useCallback((file: KelasMKFile) => {
    setSelectedFile(file);
    setRenameForm(file.namaFile);
    setShowRenameDialog(true);
  }, []);

  const openDeleteDialog = useCallback((file: KelasMKFile) => {
    setSelectedFile(file);
    setShowDeleteDialog(true);
  }, []);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading && !kelas) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data..." />
      </div>
    );
  }

  if (error && !kelas) {
    return <ErrorState title="Gagal Memuat Data" message={error} onRetry={handleRetry} />;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header - Compact */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{kelas?.mataKuliah?.namaMK}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {kelas?.mataKuliah?.kodeMK} • {kelas?.mataKuliah?.sks} SKS
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {kelas?.semester?.tahunAkademik} {kelas?.semester?.periode}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {kelas?.hari}, {kelas?.jamMulai}-{kelas?.jamSelesai}
              </div>
            </div>
          </div>
          <Button onClick={openUploadDialog} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filter + Table */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="RPS">RPS</SelectItem>
              <SelectItem value="RPP">RPP</SelectItem>
              <SelectItem value="MATERI">MATERI</SelectItem>
            </SelectContent>
          </Select>

          {typeFilter === 'MATERI' && (
            <Select value={fileWeekFilter} onValueChange={setFileWeekFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Minggu</SelectItem>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Minggu {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="Belum Ada File"
                description="Upload RPS, RPP, atau materi pembelajaran"
                className="border-0"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead className="text-center">Minggu</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead className="text-center w-40">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file, index) => (
                    <TableRow key={file.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <Badge variant={FILE_TYPE_COLORS[file.tipeFile]}>
                          {FILE_TYPE_LABELS[file.tipeFile]}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium max-w-sm truncate">
                        {file.namaFile}
                      </TableCell>

                      <TableCell className="text-center">
                        {file.mingguKe ? (
                          <Badge variant="outline">Minggu {file.mingguKe}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(file.uploadedAt), 'dd MMM yyyy', {
                          locale: idLocale,
                        })}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openRenameDialog(file)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openDeleteDialog(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - Same as before */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload RPS, RPP, atau materi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipe File *</Label>
              <Select
                value={uploadForm.tipeFile}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, tipeFile: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RPS">RPS</SelectItem>
                  <SelectItem value="RPP">RPP</SelectItem>
                  <SelectItem value="MATERI">MATERI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {uploadForm.tipeFile === 'MATERI' && (
              <div className="space-y-2">
                <Label>Minggu Ke *</Label>
                <Select
                  value={uploadForm.mingguKe}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, mingguKe: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih minggu" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        Minggu {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Keterangan (Opsional)</Label>
              <Input
                placeholder="Revisi, Tambahan, dll"
                value={uploadForm.keterangan}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, keterangan: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>File (PDF/DOC/DOCX, Max 10MB) *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? 'Mengupload...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Ubah Nama File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama File *</Label>
              <Input
                value={renameForm}
                onChange={(e) => setRenameForm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleRename} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Hapus File</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="py-4">
              <p className="font-medium">{selectedFile.namaFile}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
