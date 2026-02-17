/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import SearchBar from '@/components/shared/SearchBar';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Eye, FileText, AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { pembayaranAPI } from '@/lib/api';
import { Pembayaran, PembayaranStatus, JenisPembayaran } from '@/types/model';

// ============================================
// TYPES
// ============================================
type StatusFilter = PembayaranStatus | 'ALL';
type TypeFilter = JenisPembayaran | 'ALL';

// ============================================
// CONSTANTS
// ============================================
const ITEMS_PER_PAGE = 10;

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

const STATUS_CONFIG = {
  PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
  APPROVED: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Disetujui' },
  REJECTED: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Ditolak' },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (date: string, formatStr = 'dd MMM yyyy HH:mm'): string => {
  return format(new Date(date), formatStr, { locale: id });
};

const getBuktiUrl = (pembayaranId: number): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  return `${baseUrl}/pembayaran/bukti/${pembayaranId}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const calculateStats = (pembayaranList: Pembayaran[]) => ({
  pending: pembayaranList.filter((p) => p.status === 'PENDING').length,
  approved: pembayaranList.filter((p) => p.status === 'APPROVED').length,
  rejected: pembayaranList.filter((p) => p.status === 'REJECTED').length,
});

const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  }

  return pages;
};

const getPeriodText = (pembayaran: Pembayaran): string => {
  if (pembayaran.jenisPembayaran === 'KOMITMEN_BULANAN' && pembayaran.bulanPembayaran) {
    return formatDateTime(pembayaran.bulanPembayaran, 'MMMM yyyy');
  }
  if (pembayaran.semester) {
    return `${pembayaran.semester.tahunAkademik} ${pembayaran.semester.periode}`;
  }
  return '-';
};

const getPeriodLabel = (pembayaran: Pembayaran): string => {
  return pembayaran.jenisPembayaran === 'KOMITMEN_BULANAN' ? 'Bulan' : 'Semester';
};

// ============================================
// BADGE COMPONENTS
// ============================================
const StatusBadge = ({ status }: { status: PembayaranStatus }) => {
  const config = STATUS_CONFIG[status] || { color: '', label: status };
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

const TypeBadge = ({ type }: { type: JenisPembayaran }) => (
  <Badge variant="outline" className={PAYMENT_TYPE_COLORS[type]}>
    {PAYMENT_TYPE_LABELS[type]}
  </Badge>
);

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string;
}) => (
  <Card className={`border-${color}-200`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-${color}-600`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
      <p className="text-xs text-muted-foreground">Halaman ini</p>
    </CardContent>
  </Card>
);

// ============================================
// DIALOG INFO ROW COMPONENT
// ============================================
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">{label}:</span>
    {typeof value === 'string' ? <span className="text-sm font-medium">{value}</span> : value}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function PembayaranPage() {
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPembayaran, setSelectedPembayaran] = useState<Pembayaran | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  const [catatan, setCatatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchPembayaran = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await pembayaranAPI.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        jenisPembayaran: typeFilter !== 'ALL' ? typeFilter : undefined,
      });

      if (response.success && response.data) {
        setPembayaranList(response.data);
        
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalData(response.pagination.total);
        }
      } else {
        setError(response.message || 'Gagal memuat data pembayaran');
      }
    } catch (err: any) {
      console.error('Fetch pembayaran error:', err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPembayaran();
  }, [fetchPembayaran]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const stats = useMemo(() => calculateStats(pembayaranList), [pembayaranList]);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const paginationInfo = useMemo(() => ({
    start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
    end: Math.min(currentPage * ITEMS_PER_PAGE, totalData),
  }), [currentPage, totalData]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleApprove = useCallback((pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setShowApproveDialog(true);
  }, []);

  const handleReject = useCallback((pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setCatatan('');
    setShowRejectDialog(true);
  }, []);

  const handleViewDetail = useCallback((pembayaran: Pembayaran) => {
    setSelectedPembayaran(pembayaran);
    setShowDetailDialog(true);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (!selectedPembayaran) return;

    try {
      setIsSubmitting(true);
      const response = await pembayaranAPI.approve(selectedPembayaran.id);

      if (response.success) {
        toast.success('Pembayaran berhasil disetujui');
        await fetchPembayaran();
        setShowApproveDialog(false);
        setSelectedPembayaran(null);
      } else {
        toast.error(response.message || 'Gagal menyetujui pembayaran');
      }
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPembayaran, fetchPembayaran]);

  const confirmReject = useCallback(async () => {
    if (!selectedPembayaran || !catatan.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await pembayaranAPI.reject(selectedPembayaran.id, catatan.trim());

      if (response.success) {
        toast.success('Pembayaran berhasil ditolak');
        await fetchPembayaran();
        setShowRejectDialog(false);
        setSelectedPembayaran(null);
        setCatatan('');
      } else {
        toast.error(response.message || 'Gagal menolak pembayaran');
      }
    } catch (err: any) {
      console.error('Reject error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPembayaran, catatan, fetchPembayaran]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsDownloadingPDF(true);

      const blob = await pembayaranAPI.downloadPDFReport({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        jenisPembayaran: typeFilter !== 'ALL' ? typeFilter : undefined,
      });

      const timestamp = new Date().getTime();
      const filterSuffix = typeFilter !== 'ALL' 
        ? `_${typeFilter}` 
        : statusFilter !== 'ALL' 
        ? `_${statusFilter}` 
        : '';
      
      downloadBlob(blob, `laporan-pembayaran${filterSuffix}_${timestamp}.pdf`);
      toast.success('PDF berhasil didownload');
    } catch (err: any) {
      console.error('Download PDF error:', err);
      toast.error('Gagal mendownload PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  }, [searchQuery, statusFilter, typeFilter]);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }, [currentPage, totalPages]);

  const handleRetry = useCallback(() => {
    fetchPembayaran();
  }, [fetchPembayaran]);

  const handleDetailToApprove = useCallback(() => {
    if (selectedPembayaran) {
      setShowDetailDialog(false);
      handleApprove(selectedPembayaran);
    }
  }, [selectedPembayaran, handleApprove]);

  const handleDetailToReject = useCallback(() => {
    if (selectedPembayaran) {
      setShowDetailDialog(false);
      handleReject(selectedPembayaran);
    }
  }, [selectedPembayaran, handleReject]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data pembayaran..." />
      </div>
    );
  }

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Verifikasi dan approval pembayaran mahasiswa (semua jenis)
        </p>
      </div>

      {stats.pending > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            Ada <span className="font-bold">{stats.pending}</span> pembayaran pada halaman ini menunggu verifikasi Anda
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloadingPDF ? 'Mengunduh...' : 'Download PDF'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending" value={stats.pending} icon={FileText} color="yellow" />
        <StatCard title="Disetujui" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Ditolak" value={stats.rejected} icon={XCircle} color="red" />
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchBar
              placeholder="Cari NIM atau nama..."
              onSearch={setSearchQuery}
              defaultValue={searchQuery}
            />

            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter jenis" />
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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIM</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Semester/Bulan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pembayaranList.map((pembayaran) => (
                      <TableRow key={pembayaran.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">
                          {pembayaran.mahasiswa?.nim || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {pembayaran.mahasiswa?.namaLengkap || '-'}
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={pembayaran.jenisPembayaran} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {getPeriodText(pembayaran)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(pembayaran.nominal)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(pembayaran.uploadedAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={pembayaran.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDetail(pembayaran)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {pembayaran.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(pembayaran)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan <span className="font-medium">{paginationInfo.start}</span> -{' '}
                    <span className="font-medium">{paginationInfo.end}</span> dari{' '}
                    <span className="font-medium">{totalData}</span> data
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {pageNumbers.map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageClick(page as number)}
                            className="w-9"
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* APPROVE DIALOG */}
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
              <InfoRow 
                label="Jenis" 
                value={<TypeBadge type={selectedPembayaran.jenisPembayaran} />} 
              />
              <InfoRow 
                label="NIM" 
                value={selectedPembayaran.mahasiswa?.nim || '-'} 
              />
              <InfoRow 
                label="Nama" 
                value={selectedPembayaran.mahasiswa?.namaLengkap || '-'} 
              />
              <InfoRow 
                label={getPeriodLabel(selectedPembayaran)} 
                value={getPeriodText(selectedPembayaran)} 
              />
              <InfoRow 
                label="Nominal" 
                value={formatCurrency(selectedPembayaran.nominal)} 
              />
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

      {/* REJECT DIALOG */}
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
                  <div className="mt-1">
                    <TypeBadge type={selectedPembayaran.jenisPembayaran} />
                  </div>
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

      {/* DETAIL DIALOG */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedPembayaran && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Pembayaran</p>
                  <div className="mt-1">
                    <TypeBadge type={selectedPembayaran.jenisPembayaran} />
                  </div>
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
                    {getPeriodLabel(selectedPembayaran)}
                  </p>
                  <p className="font-medium">
                    {getPeriodText(selectedPembayaran)}
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
                    {formatDateTime(selectedPembayaran.uploadedAt, 'dd MMMM yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedPembayaran.status} />
                  </div>
                </div>
                {selectedPembayaran.verifiedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Verifikasi</p>
                    <p className="font-medium">
                      {formatDateTime(selectedPembayaran.verifiedAt, 'dd MMMM yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              {selectedPembayaran.catatan && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Alasan Penolakan</p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{selectedPembayaran.catatan}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Bukti Pembayaran</p>
                <div className="border rounded-lg p-4 bg-muted/30">
                  {!selectedPembayaran.id ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Bukti pembayaran tidak tersedia
                    </p>
                  ) : selectedPembayaran.buktiUrl?.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-[600px]">
                      <iframe
                        src={getBuktiUrl(selectedPembayaran.id)}
                        className="w-full h-full rounded-lg border-0"
                        title="Bukti Pembayaran PDF"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="relative w-full flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBuktiUrl(selectedPembayaran.id)}
                        alt="Bukti Pembayaran"
                        crossOrigin="use-credentials"
                        className="max-w-full h-auto rounded-lg object-contain max-h-[600px]"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== '/placeholder-bukti.jpg') {
                            target.src = '/placeholder-bukti.jpg';
                            target.alt = 'Gagal memuat bukti pembayaran';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {selectedPembayaran.status === 'PENDING' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleDetailToApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button
                    onClick={handleDetailToReject}
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
