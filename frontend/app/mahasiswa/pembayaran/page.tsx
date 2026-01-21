/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Upload Pembayaran Page
 * ✅ UPDATED: Sesuai schema baru (JenisPembayaran enum)
 */

'use client';

import { useState, useEffect } from 'react';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { pembayaranAPI } from '@/lib/api';
import { Pembayaran, JenisPembayaran } from '@/types/model';

type PembayaranStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ✅ UPDATED: Mapping label untuk enum JenisPembayaran
const JENIS_PEMBAYARAN_OPTIONS: Array<{ value: JenisPembayaran; label: string }> = [
  { value: 'KRS', label: 'Pembayaran KRS' },
  { value: 'TENGAH_SEMESTER', label: 'Pembayaran Tengah Semester' },
  { value: 'PPL', label: 'Pembayaran PPL' },
  { value: 'SKRIPSI', label: 'Pembayaran Skripsi' },
  { value: 'WISUDA', label: 'Pembayaran Wisuda' },
  { value: 'KOMITMEN_BULANAN', label: 'Komitmen Bulanan' },
];

export default function UploadPembayaranPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaran>('KRS'); // ✅ UPDATED
  const [nominal, setNominal] = useState('');
  const [bulanPembayaran, setBulanPembayaran] = useState(''); // ✅ ADDED for KOMITMEN_BULANAN
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<Pembayaran[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState<Pembayaran | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH HISTORY
  // ============================================
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await pembayaranAPI.getHistory();

      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (err: any) {
      console.error('Fetch history error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat riwayat pembayaran'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ ADDED: Get label for jenis pembayaran
  const getJenisPembayaranLabel = (jenis: JenisPembayaran) => {
    return JENIS_PEMBAYARAN_OPTIONS.find(opt => opt.value === jenis)?.label || jenis;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file harus JPG, PNG, atau PDF');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jenisPembayaran || !nominal || !selectedFile) {
      toast.error('Semua field harus diisi');
      return;
    }

    // ✅ ADDED: Validate bulanPembayaran for KOMITMEN_BULANAN
    if (jenisPembayaran === 'KOMITMEN_BULANAN' && !bulanPembayaran) {
      toast.error('Bulan pembayaran harus diisi untuk komitmen bulanan');
      return;
    }

    const nominalValue = parseInt(nominal);
    if (isNaN(nominalValue) || nominalValue <= 0) {
      toast.error('Nominal harus berupa angka yang valid');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('jenisPembayaran', jenisPembayaran); // ✅ Now using enum value
      formData.append('nominal', nominalValue.toString());
      
      // ✅ ADDED: Include bulanPembayaran if KOMITMEN_BULANAN
      if (jenisPembayaran === 'KOMITMEN_BULANAN' && bulanPembayaran) {
        formData.append('bulanPembayaran', bulanPembayaran);
      }

      // Simulate progress (since we can't track real progress with current API)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload
      const response = await pembayaranAPI.uploadBukti(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        toast.success('Bukti pembayaran berhasil diupload!');
        
        // Reset form
        setJenisPembayaran('KRS');
        setNominal('');
        setBulanPembayaran(''); // ✅ ADDED
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Refresh history
        fetchHistory();
      } else {
        throw new Error(response.message || 'Upload gagal');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(
        err.response?.data?.message || err.message || 'Gagal mengupload bukti pembayaran'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDetail = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: PembayaranStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu Verifikasi
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data pembayaran..." />
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
        onRetry={handleRetry}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Upload Pembayaran"
        description="Upload bukti pembayaran untuk verifikasi"
      />

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Bukti Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ UPDATED: Jenis Pembayaran dengan enum */}
            <div className="space-y-2">
              <Label htmlFor="jenis-pembayaran">
                Jenis Pembayaran <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={jenisPembayaran} 
                onValueChange={(value) => setJenisPembayaran(value as JenisPembayaran)}
                disabled={isUploading}
              >
                <SelectTrigger id="jenis-pembayaran">
                  <SelectValue placeholder="Pilih jenis pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_PEMBAYARAN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ✅ ADDED: Bulan Pembayaran (only for KOMITMEN_BULANAN) */}
            {jenisPembayaran === 'KOMITMEN_BULANAN' && (
              <div className="space-y-2">
                <Label htmlFor="bulan-pembayaran">
                  Bulan Pembayaran <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bulan-pembayaran"
                  type="month"
                  value={bulanPembayaran}
                  onChange={(e) => setBulanPembayaran(e.target.value)}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Pilih bulan untuk pembayaran komitmen bulanan
                </p>
              </div>
            )}

            {/* Nominal */}
            <div className="space-y-2">
              <Label htmlFor="nominal">
                Nominal Pembayaran <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="nominal"
                  type="number"
                  placeholder="0"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="pl-10"
                  disabled={isUploading}
                  min="0"
                  step="1000"
                />
              </div>
              {nominal && !isNaN(parseInt(nominal)) && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(parseInt(nominal))}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="bukti">
                Bukti Pembayaran <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                {!selectedFile ? (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-primary hover:underline font-medium"
                      >
                        Klik untuk upload
                      </label>
                      <span className="text-muted-foreground"> atau drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG, atau PDF (Max. 5MB)
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Preview for images */}
                    {previewUrl && (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full h-auto rounded-lg border max-h-64 mx-auto object-contain"
                        />
                        {!isUploading && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveFile}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* File info */}
                    <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedFile.type.startsWith('image/') ? (
                          <ImageIcon className="h-8 w-8 text-primary" />
                        ) : (
                          <FileText className="h-8 w-8 text-primary" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>

                    {/* Change file button */}
                    {!isUploading && !previewUrl && (
                      <div className="text-center">
                        <label
                          htmlFor="file-upload-change"
                          className="cursor-pointer text-sm text-primary hover:underline"
                        >
                          Ganti file
                        </label>
                        <Input
                          id="file-upload-change"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pastikan bukti pembayaran yang diupload jelas dan dapat terbaca. File akan
                diverifikasi oleh bagian keuangan dalam 1-3 hari kerja.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setJenisPembayaran('KRS');
                  setNominal('');
                  setBulanPembayaran(''); // ✅ ADDED
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                disabled={isUploading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Bukti Pembayaran
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum Ada Riwayat"
              description="Belum ada riwayat pembayaran. Upload bukti pembayaran Anda untuk memulai."
              className="border-0 py-12"
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Pembayaran</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Bulan</TableHead> {/* ✅ ADDED */}
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Tanggal Upload</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {getJenisPembayaranLabel(item.jenisPembayaran)} {/* ✅ UPDATED */}
                        </TableCell>
                        <TableCell>
                          {item.semester ? `${item.semester.tahunAkademik} ${item.semester.periode}` : '-'}
                        </TableCell>
                        {/* ✅ ADDED: Bulan column */}
                        <TableCell>
                          {item.bulanPembayaran 
                            ? format(new Date(item.bulanPembayaran), 'MMMM yyyy', { locale: id })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.nominal)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: id,
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Pembayaran</p>
                  <p className="font-medium">
                    {getJenisPembayaranLabel(selectedPembayaran.jenisPembayaran)} {/* ✅ UPDATED */}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">
                    {selectedPembayaran.semester 
                      ? `${selectedPembayaran.semester.tahunAkademik} ${selectedPembayaran.semester.periode}`
                      : '-'}
                  </p>
                </div>
                {/* ✅ ADDED: Bulan Pembayaran */}
                {selectedPembayaran.bulanPembayaran && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bulan Pembayaran</p>
                    <p className="font-medium">
                      {format(new Date(selectedPembayaran.bulanPembayaran), 'MMMM yyyy', {
                        locale: id,
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Nominal</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedPembayaran.nominal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Upload</p>
                  <p className="font-medium">
                    {format(new Date(selectedPembayaran.createdAt), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  {getStatusBadge(selectedPembayaran.status)}
                </div>
              </div>

              {selectedPembayaran.catatan && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    <strong>Catatan:</strong> {selectedPembayaran.catatan}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran</p>
                <div className="border rounded-lg p-4 bg-muted/30">
                  {selectedPembayaran.buktiUrl.endsWith('.pdf') ? (
                    <div className="flex items-center justify-center p-8">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <div className="ml-4">
                        <p className="font-medium">PDF Document</p>
                        <a
                          href={selectedPembayaran.buktiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Buka PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedPembayaran.buktiUrl}
                      alt="Bukti Pembayaran"
                      className="max-w-full h-auto rounded object-contain max-h-96 mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}