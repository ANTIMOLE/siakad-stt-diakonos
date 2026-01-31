/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, FileText, Award, Phone, Mail, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, KRS, KHS } from '@/types/model';

export default function MahasiswaBimbinganDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mahasiswaId = Number(params.id);

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa | null>(null);
  const [krsHistory, setKrsHistory] = useState<KRS[]>([]);
  const [khsHistory, setKhsHistory] = useState<KHS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch mahasiswa detail
        const mhsResponse = await mahasiswaAPI.getById(mahasiswaId);
        if (!mhsResponse.success || !mhsResponse.data) {
          throw new Error('Mahasiswa tidak ditemukan');
        }
        setMahasiswa(mhsResponse.data);

        // 2. Fetch KRS history
        try {
          const krsResponse = await mahasiswaAPI.getKRS(mahasiswaId);
          if (krsResponse.success && krsResponse.data) {
            // Sort by semester (newest first)
            const sortedKRS = krsResponse.data.sort((a, b) => {
              const semesterA = `${a.semester?.tahunAkademik}-${a.semester?.periode}`;
              const semesterB = `${b.semester?.tahunAkademik}-${b.semester?.periode}`;
              return semesterB.localeCompare(semesterA);
            });
            setKrsHistory(sortedKRS);
          }
        } catch (krsError) {
          console.warn('Failed to fetch KRS:', krsError);
        }

        // 3. Fetch KHS history
        try {
          const khsResponse = await mahasiswaAPI.getKHS(mahasiswaId);
          if (khsResponse.success && khsResponse.data) {
            // Sort by semester (newest first)
            const sortedKHS = khsResponse.data.sort((a, b) => {
              const semesterA = `${a.semester?.tahunAkademik}-${a.semester?.periode}`;
              const semesterB = `${b.semester?.tahunAkademik}-${b.semester?.periode}`;
              return semesterB.localeCompare(semesterA);
            });
            setKhsHistory(sortedKHS);
          }
        } catch (khsError) {
          console.warn('Failed to fetch KHS:', khsError);
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Terjadi kesalahan saat memuat data mahasiswa'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (mahasiswaId) {
      fetchData();
    }
  }, [mahasiswaId]);

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const latestKHS = khsHistory.length > 0 ? khsHistory[0] : null;
  const currentYear = new Date().getFullYear();
  const currentSemester = mahasiswa ? currentYear - mahasiswa.angkatan + 1 : 0;

  // ============================================
  // HANDLERS
  // ============================================
  const handleRetry = () => {
    window.location.reload();
  };

  const handleViewKRS = (krsId: number) => {
    router.push(`/dosen/krs-approval/${krsId}`);
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error || !mahasiswa) {
    return (
      <ErrorState
        title="Gagal Memuat Data"
        message={error || 'Mahasiswa tidak ditemukan'}
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
        title={mahasiswa.namaLengkap}
        description={`NIM: ${mahasiswa.nim} • ${mahasiswa.prodi?.nama || 'N/A'} • Angkatan ${mahasiswa.angkatan}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Mahasiswa Bimbingan', href: '/dosen/mahasiswa-bimbingan' },
          { label: mahasiswa.namaLengkap },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/dosen/mahasiswa-bimbingan')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={mahasiswa.status} showIcon />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPK</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestKHS?.ipk ? Number(latestKHS.ipk).toFixed(2) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              IPS: {latestKHS?.ips ? Number(latestKHS.ips).toFixed(2) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestKHS?.totalSKSKumulatif || 0}
            </div>
            <p className="text-xs text-muted-foreground">SKS kumulatif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semester</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentSemester}</div>
            <p className="text-xs text-muted-foreground">
              Angkatan {mahasiswa.angkatan}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Biodata Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Biodata Mahasiswa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">NIM</p>
                <p className="font-mono font-medium">{mahasiswa.nim}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nama Lengkap</p>
                <p className="font-medium">{mahasiswa.namaLengkap}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Program Studi</p>
                <p className="font-medium">{mahasiswa.prodi?.nama || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Angkatan</p>
                <Badge variant="outline">{mahasiswa.angkatan}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <StatusBadge status={mahasiswa.status} showIcon />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dosen Wali</p>
                <p className="font-medium">
                  {mahasiswa.dosenWali?.namaLengkap || 'Anda'}
                </p>
                {mahasiswa.dosenWali?.nidn && (
                  <p className="text-sm text-muted-foreground">
                    NIDN: {mahasiswa.dosenWali.nidn}
                  </p>
                )}
              </div>

              {/* Contact Info - These fields might not exist in base schema */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <div>
                    <p className="text-sm">Email</p>
                    <p className="text-sm font-medium text-foreground">
                      {mahasiswa.nim}@student.university.ac.id
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: KRS & KHS History */}
      <Tabs defaultValue="krs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="krs">
            Riwayat KRS
            {krsHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {krsHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="khs">
            Riwayat KHS
            {khsHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {khsHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* KRS History Tab */}
        <TabsContent value="krs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Riwayat Kartu Rencana Studi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {krsHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semester</TableHead>
                        <TableHead>Total SKS</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Submit</TableHead>
                        <TableHead>Tanggal Approval</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {krsHistory.map((krs) => (
                        <TableRow key={krs.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {krs.semester?.tahunAkademik || '-'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {krs.semester?.periode || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{krs.totalSKS} SKS</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={krs.status} showIcon />
                          </TableCell>
                          <TableCell>
                            {krs.tanggalSubmit
                              ? format(new Date(krs.tanggalSubmit), 'dd MMM yyyy', {
                                  locale: id,
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {krs.tanggalApproval
                              ? format(
                                  new Date(krs.tanggalApproval),
                                  'dd MMM yyyy',
                                  { locale: id }
                                )
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewKRS(krs.id)}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat KRS</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KHS History Tab */}
        <TabsContent value="khs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <CardTitle>Riwayat Kartu Hasil Studi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {khsHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semester</TableHead>
                        <TableHead>IPS</TableHead>
                        <TableHead>IPK</TableHead>
                        <TableHead>SKS Semester</TableHead>
                        <TableHead>SKS Kumulatif</TableHead>
                        <TableHead>Tanggal Generate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {khsHistory.map((khs) => (
                        <TableRow key={khs.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {khs.semester?.tahunAkademik || '-'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {khs.semester?.periode || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-lg">
                              {Number(khs.ips).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-lg">
                              {Number(khs.ipk).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {khs.totalSKSSemester} SKS
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {khs.totalSKSKumulatif} SKS
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(khs.tanggalGenerate), 'dd MMM yyyy', {
                              locale: id,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat KHS</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IPK Trend Chart - Optional */}
          {khsHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Tren IPK</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {khsHistory.map((khs, index) => {
                    const prevKHS = khsHistory[index + 1];
                    const currentIPK = Number(khs.ipk);
                    const prevIPK = prevKHS ? Number(prevKHS.ipk) : 0;
                    const trend = prevKHS ? currentIPK - prevIPK : 0;
                    
                    return (
                      <div
                        key={khs.id}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <span className="text-sm">
                          {khs.semester?.tahunAkademik} {khs.semester?.periode}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currentIPK.toFixed(2)}</span>
                          {trend !== 0 && (
                            <span
                              className={`text-xs ${
                                trend > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}