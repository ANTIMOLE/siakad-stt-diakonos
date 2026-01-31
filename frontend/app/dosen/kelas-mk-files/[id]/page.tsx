/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { use, useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  BookOpen,
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

const FILE_TYPE_LABELS = {
  RPS: 'Rencana Pembelajaran Semester',
  RPP: 'Rencana Pelaksanaan Pembelajaran',
  MATERI: 'Materi Pembelajaran',
};

const FILE_TYPE_COLORS = {
  RPS: 'bg-blue-100 text-blue-700 border-blue-200',
  RPP: 'bg-purple-100 text-purple-700 border-purple-200',
  MATERI: 'bg-green-100 text-green-700 border-green-200',
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

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    tipeFile: 'MATERI' as 'RPS' | 'RPP' | 'MATERI',
    mingguKe: '',
    keterangan: '',
    file: null as File | null,
  });

  // Rename form
  const [renameForm, setRenameForm] = useState('');

  const fetchKelas = useCallback(async () => {
    try {
      const response = await kelasMKAPI.getById(kelasMKId);
      if (response && response.data) {
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

      if (response && response.data) {
        setFiles(response.data);
      } else {
        setError('Gagal memuat data file');
      }
    } catch (err: any) {
      console.error('Fetch files error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data file'
      );
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

  const handleUpload = async () => {
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

      // Auto-generate namaFile
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

      if (response && response.success) {
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
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat upload file'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !renameForm.trim()) {
      toast.error('Nama file harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await kelasMKFileAPI.renameFile(selectedFile.id, renameForm.trim());

      if (response && response.success) {
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
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat mengubah nama file'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);

      const response = await kelasMKFileAPI.deleteFile(selectedFile.id);

      if (response && response.success) {
        toast.success('File berhasil dihapus');
        setShowDeleteDialog(false);
        setSelectedFile(null);
        fetchFiles();
      } else {
        toast.error('Gagal menghapus file');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menghapus file'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (fileId: number) => {
    const url = kelasMKFileAPI.getFileUrl(fileId);
    window.open(url, '_blank');
  };

  const handleRetry = () => {
    fetchFiles();
  };

  const openUploadDialog = () => {
    setUploadForm({
      tipeFile: 'MATERI',
      mingguKe: '',
      keterangan: '',
      file: null,
    });
    setShowUploadDialog(true);
  };

  const openRenameDialog = (file: KelasMKFile) => {
    setSelectedFile(file);
    setRenameForm(file.namaFile);
    setShowRenameDialog(true);
  };

  const openDeleteDialog = (file: KelasMKFile) => {
    setSelectedFile(file);
    setShowDeleteDialog(true);
  };

  // Group files by type
  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.tipeFile]) {
      acc[file.tipeFile] = [];
    }
    acc[file.tipeFile].push(file);
    return acc;
  }, {} as Record<string, KelasMKFile[]>);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {kelas?.mataKuliah?.namaMK}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>
                {kelas?.mataKuliah?.kodeMK} • {kelas?.mataKuliah?.sks} SKS
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {kelas?.semester?.tahunAkademik} {kelas?.semester?.periode}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {kelas?.hari}, {kelas?.jamMulai}-{kelas?.jamSelesai}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={openUploadDialog} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="RPS">RPS</SelectItem>
              <SelectItem value="RPP">RPP</SelectItem>
              <SelectItem value="MATERI">MATERI</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {typeFilter === 'MATERI' && (
            <Select value={fileWeekFilter} onValueChange={setFileWeekFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter minggu" />
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
        <CardContent>
          {files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum Ada File"
              description="Upload RPS, RPP, atau materi pembelajaran untuk kelas ini"
              className="my-8 border-0"
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFiles).map(([type, typeFiles]) => (
                <div key={type}>
                  <h3 className="font-semibold mb-3">
                    {FILE_TYPE_LABELS[type as keyof typeof FILE_TYPE_LABELS]}
                  </h3>
                  <div className="space-y-2">
                    {typeFiles.map((file) => (
                      <Card key={file.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={FILE_TYPE_COLORS[file.tipeFile]}
                                >
                                  {file.tipeFile}
                                </Badge>
                                {file.mingguKe && (
                                  <Badge variant="outline">Minggu {file.mingguKe}</Badge>
                                )}
                              </div>
                              <p className="font-medium">{file.namaFile}</p>
                              <p className="text-sm text-muted-foreground">
                                Upload:{' '}
                                {format(new Date(file.uploadedAt), 'dd MMM yyyy HH:mm', {
                                  locale: idLocale,
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(file)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload RPS, RPP, atau materi pembelajaran</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipeFile">Tipe File *</Label>
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
                <Label htmlFor="mingguKe">Minggu Ke *</Label>
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
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Revisi, Tambahan, dll"
                value={uploadForm.keterangan}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, keterangan: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File (PDF/DOC/DOCX, Max 10MB) *</Label>
              <Input
                id="file"
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

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Ubah Nama File</DialogTitle>
            <DialogDescription>
              Ubah nama tampilan file (tidak mengubah file asli)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="namaFile">Nama File *</Label>
              <Input
                id="namaFile"
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Hapus File</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus file ini? Tindakan ini tidak dapat
              dibatalkan.
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