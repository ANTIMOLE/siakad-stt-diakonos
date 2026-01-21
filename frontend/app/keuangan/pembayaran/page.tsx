/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Eye, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { pembayaranAPI } from '@/lib/api';
import { Pembayaran, PembayaranStatus, JenisPembayaran } from '@/types/model';

type StatusFilter = PembayaranStatus | 'ALL';
type TypeFilter = JenisPembayaran | 'ALL';

export default function PembayaranPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPembayaran, setSelectedPembayaran] = useState<Pembayaran | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  // ============================================
  // PAYMENT TYPE LABELS
  // ============================================
  const PAYMENT_TYPE_LABELS: Record<JenisPembayaran, string> = {
    KRS: 'Pembayaran KRS',
    TENGAH_SEMESTER: 'Tengah Semester',
    PPL: 'PPL',
    SKRIPSI: 'Skripsi',
    WISUDA: 'Wisuda',
    KOMITMEN_BULANAN: 'Komitmen Bulanan',
  };

  const PAYMENT_TYPE_COLORS: Record<JenisPembayaran, string> = {
    KRS: 'bg-blue-100 text-blue-700 border-blue-200',
    TENGAH_SEMESTER: 'bg-purple-100 text-purple-700 border-purple-200',
    PPL: 'bg-orange-100 text-orange-700 border-orange-200',
    SKRIPSI: 'bg-pink-100 text-pink-700 border-pink-200',
    WISUDA: 'bg-green-100 text-green-700 border-green-200',
    KOMITMEN_BULANAN: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchPembayaran = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await pembayaranAPI.getAll({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        jenisPembayaran: typeFilter !== 'ALL' ? typeFilter : undefined,
        limit: 100,
      });

      if (response.success && response.data) {
        // Sort by upload date (newest first)
        const sortedData = response.data.sort((a, b) => {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
        setPembayaranList(sortedData);
      } else {
        setError(response.message || 'Gagal memuat data pembayaran');
      }
    } catch (err: any) {
      console.error('Fetch pembayaran error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat memuat data pembayaran'
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPembayaran();
  }, [fetchPembayaran]);

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

  const getStatusBadge = (status: PembayaranStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Disetujui
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: JenisPembayaran) => {
    return (
      <Badge variant="outline" className={PAYMENT_TYPE_COLORS[type]}>
        {PAYMENT_TYPE_LABELS[type]}
      </Badge>
    );
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleApprove = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setShowApproveDialog(true);
  };

  const handleReject = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setCatatan('');
    setShowRejectDialog(true);
  };

  const handleViewDetail = (pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setShowDetailDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedPembayaran) return;

    try {
      setIsSubmitting(true);

      const response = await pembayaranAPI.approve(selectedPembayaran.id);

      if (response.success) {
        toast.success('Pembayaran berhasil disetujui');
        
        // Update local state
        setPembayaranList((prev) =>
          prev.map((p) =>
            p.id === selectedPembayaran.id
              ? { ...p, status: 'APPROVED' as const, verifiedAt: new Date().toISOString() }
              : p
          )
        );

        setShowApproveDialog(false);
        setSelectedPembayaran(null);
      } else {
        toast.error(response.message || 'Gagal menyetujui pembayaran');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menyetujui pembayaran'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedPembayaran || !catatan.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await pembayaranAPI.reject(selectedPembayaran.id, catatan.trim());

      if (response.success) {
        toast.success('Pembayaran berhasil ditolak');

        // Update local state
        setPembayaranList((prev) =>
          prev.map((p) =>
            p.id === selectedPembayaran.id
              ? {
                  ...p,
                  status: 'REJECTED' as const,
                  catatan: catatan.trim(),
                  verifiedAt: new Date().toISOString(),
                }
              : p
          )
        );

        setShowRejectDialog(false);
        setSelectedPembayaran(null);
        setCatatan('');
      } else {
        toast.error(response.message || 'Gagal menolak pembayaran');
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Terjadi kesalahan saat menolak pembayaran'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    fetchPembayaran();
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const stats = {
    pending: pembayaranList.filter((p) => p.status === 'PENDING').length,
    approved: pembayaranList.filter((p) => p.status === 'APPROVED').length,
    rejected: pembayaranList.filter((p) => p.status === 'REJECTED').length,
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Verifikasi dan approval pembayaran mahasiswa (semua jenis)
        </p>
      </div>

      {/* Alert for pending payments */}
      {stats.pending > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            Ada <span className="font-bold">{stats.pending}</span> pembayaran menunggu
            verifikasi Anda
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Perlu verifikasi</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Pembayaran valid</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Pembayaran invalid</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              placeholder="Cari berdasarkan NIM atau nama mahasiswa..."
              onSearch={setSearchQuery}
              defaultValue={searchQuery}
            />

            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter jenis pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis</SelectItem>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pembayaranList.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak Ada Data"
              description={
                searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Tidak ada pembayaran yang sesuai dengan filter'
                  : 'Belum ada pembayaran yang masuk'
              }
              className="my-8 border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Semester/Bulan</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Tanggal Upload</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pembayaranList.map((pembayaran) => (
                    <TableRow key={pembayaran.id}>
                      <TableCell className="font-mono font-medium">
                        {pembayaran.mahasiswa?.nim || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {pembayaran.mahasiswa?.namaLengkap || '-'}
                      </TableCell>
                      <TableCell>{getTypeBadge(pembayaran.jenisPembayaran)}</TableCell>
                      <TableCell>
                        {pembayaran.jenisPembayaran === 'KOMITMEN_BULANAN' && pembayaran.bulanPembayaran ? (
                          format(new Date(pembayaran.bulanPembayaran), 'MMMM yyyy', {
                            locale: id,
                          })
                        ) : pembayaran.semester ? (
                          `${pembayaran.semester.tahunAkademik} ${pembayaran.semester.periode}`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(pembayaran.nominal)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pembayaran.uploadedAt), 'dd MMM yyyy HH:mm', {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(pembayaran.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(pembayaran)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {pembayaran.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(pembayaran)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(pembayaran)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Setujui Pembayaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui pembayaran ini?
            </DialogDescription>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Jenis:</span>
                {getTypeBadge(selectedPembayaran.jenisPembayaran)}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">NIM:</span>
                <span className="text-sm font-medium">
                  {selectedPembayaran.mahasiswa?.nim}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama:</span>
                <span className="text-sm font-medium">
                  {selectedPembayaran.mahasiswa?.namaLengkap}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedPembayaran.jenisPembayaran === 'KOMITMEN_BULANAN'
                    ? 'Bulan:'
                    : 'Semester:'}
                </span>
                <span className="text-sm font-medium">
                  {selectedPembayaran.jenisPembayaran === 'KOMITMEN_BULANAN' &&
                  selectedPembayaran.bulanPembayaran
                    ? format(new Date(selectedPembayaran.bulanPembayaran), 'MMMM yyyy', {
                        locale: id,
                      })
                    : selectedPembayaran.semester
                    ? `${selectedPembayaran.semester.tahunAkademik} ${selectedPembayaran.semester.periode}`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nominal:</span>
                <span className="text-sm font-medium">
                  {formatCurrency(selectedPembayaran.nominal)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Memproses...' : 'Ya, Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan pembayaran
            </DialogDescription>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-muted-foreground">Jenis:</span>
                  <div className="mt-1">{getTypeBadge(selectedPembayaran.jenisPembayaran)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">NIM:</span>
                  <p className="text-sm font-medium">
                    {selectedPembayaran.mahasiswa?.nim}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="catatan"
                  placeholder="Contoh: Bukti pembayaran tidak jelas, nominal tidak sesuai, dll."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!catatan.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Memproses...' : 'Ya, Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-6 py-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Pembayaran</p>
                  <div className="mt-1">{getTypeBadge(selectedPembayaran.jenisPembayaran)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIM</p>
                  <p className="font-mono font-medium">
                    {selectedPembayaran.mahasiswa?.nim}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">
                    {selectedPembayaran.mahasiswa?.namaLengkap}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPembayaran.jenisPembayaran === 'KOMITMEN_BULANAN'
                      ? 'Bulan Pembayaran'
                      : 'Semester'}
                  </p>
                  <p className="font-medium">
                    {selectedPembayaran.jenisPembayaran === 'KOMITMEN_BULANAN' &&
                    selectedPembayaran.bulanPembayaran
                      ? format(new Date(selectedPembayaran.bulanPembayaran), 'MMMM yyyy', {
                          locale: id,
                        })
                      : selectedPembayaran.semester
                      ? `${selectedPembayaran.semester.tahunAkademik} ${selectedPembayaran.semester.periode}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nominal</p>
                  <p className="font-medium">
                    {formatCurrency(selectedPembayaran.nominal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Upload</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedPembayaran.uploadedAt),
                      'dd MMMM yyyy HH:mm',
                      { locale: id }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPembayaran.status)}</div>
                </div>
                {selectedPembayaran.verifiedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Verifikasi</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedPembayaran.verifiedAt),
                        'dd MMMM yyyy HH:mm',
                        { locale: id }
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Catatan (if rejected) */}
              {selectedPembayaran.catatan && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Alasan Penolakan</p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{selectedPembayaran.catatan}</p>
                  </div>
                </div>
              )}

              {/* Bukti Pembayaran */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran</p>
                <div className="border rounded-md p-4 bg-gray-50">
                  {selectedPembayaran.buktiUrl ? (
                    <div className="relative w-full min-h-100">
                      <Image
                        src={selectedPembayaran.buktiUrl}
                        alt="Bukti Pembayaran"
                        width={800}
                        height={600}
                        className="rounded object-contain w-full h-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Bukti pembayaran tidak tersedia
                    </p>
                  )}
                </div>
              </div>

              {/* Actions for pending */}
              {selectedPembayaran.status === 'PENDING' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleApprove(selectedPembayaran);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleReject(selectedPembayaran);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </div>
              )}
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