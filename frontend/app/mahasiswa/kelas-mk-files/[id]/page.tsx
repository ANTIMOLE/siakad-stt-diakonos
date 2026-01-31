/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  FileText,
  Download,
  Clock,
  Calendar,
  BookOpen,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { kelasMKAPI, kelasMKFileAPI } from '@/lib/api';
import { KelasMK } from '@/types/model';

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

export default function MahasiswaMateriKelasDetailPage({
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

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [fileWeekFilter, setFileWeekFilter] = useState<string>('ALL');

  const fetchKelas = useCallback(async () => {
    try {
      const response = await kelasMKAPI.getById(kelasMKId);
      if (response.success && response.data) {
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


      const response = await kelasMKFileAPI.getFilesByKelasForMahasiswa(kelasMKId, {
        tipeFile: typeFilter !== 'ALL' ? typeFilter : undefined,
        mingguKe: fileWeekFilter === 'ALL' ? undefined : fileWeekFilter,
      });

      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        setError(response.message || 'Gagal memuat data file');
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

  const handleDownload = (fileId: number) => {
    const url = kelasMKFileAPI.getFileUrl(fileId);
    window.open(url, '_blank');
  };

  const handleRetry = () => {
    fetchFiles();
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
      {/* Header */}
      <div>
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
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>
              {kelas?.mataKuliah?.kodeMK} • {kelas?.mataKuliah?.sks} SKS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{kelas?.dosen?.namaLengkap}</span>
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

          {/* Filter Minggu Ke */}
          {typeFilter === 'MATERI' && (
          <Select value={fileWeekFilter} onValueChange={setFileWeekFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter minggu ke" />
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
              description="Dosen belum mengupload RPS, RPP, atau materi untuk kelas ini"
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
                      <Card
                        key={file.id}
                        className="hover:shadow-sm transition-shadow"
                      >
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
                                  <Badge variant="outline">
                                    Minggu {file.mingguKe}
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium">{file.namaFile}</p>
                              <p className="text-sm text-muted-foreground">
                                Upload:{' '}
                                {format(
                                  new Date(file.uploadedAt),
                                  'dd MMM yyyy HH:mm',
                                  { locale: idLocale }
                                )}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(file.id)}
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
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
    </div>
  );
}