/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import StatusBadge from '@/components/features/status/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, FileText, Award, Mail, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { mahasiswaAPI } from '@/lib/api';
import { Mahasiswa, KRS, KHS } from '@/types/model';

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (dateString: string, formatStr = 'dd MMM yyyy'): string => {
  return format(new Date(dateString), formatStr, { locale: id });
};

const calculateIPKTrend = (current: number, previous: number): { trend: number; isPositive: boolean } => {
  const trend = current - previous;
  return { trend, isPositive: trend > 0 };
};

// ============================================
// SUMMARY CARD COMPONENT
// ============================================
const SummaryCard = ({
  title,
  icon: Icon,
  value,
  description,
}: {
  title: string;
  icon?: any;
  value: string | React.ReactNode;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      {typeof value === 'string' ? (
        <div className="text-2xl font-bold">{value}</div>
      ) : (
        value
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

// ============================================
// BIODATA ROW COMPONENT
// ============================================
const BiodataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    {typeof value === 'string' ? <p className="font-medium">{value}</p> : value}
  </div>
);

// ============================================
// IPK TREND ROW COMPONENT
// ============================================
const IPKTrendRow = ({ khs, prevKHS }: { khs: KHS; prevKHS?: KHS }) => {
  const currentIPK = Number(khs.ipk);
  const prevIPK = prevKHS ? Number(prevKHS.ipk) : 0;
  const { trend, isPositive } = prevKHS
    ? calculateIPKTrend(currentIPK, prevIPK)
    : { trend: 0, isPositive: false };

  return (
    <div className="flex items-center justify-between border-b pb-2">
      <span className="text-sm">
        {khs.semester?.tahunAkademik} {khs.semester?.periode}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{currentIPK.toFixed(2)}</span>
        {trend !== 0 && (
          <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyHistoryState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="py-12 text-center text-muted-foreground">
    <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
    <p>{message}</p>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
export default function MahasiswaBimbinganDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mahasiswaId = Number(params.id);

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

        const mhsResponse = await mahasiswaAPI.getById(mahasiswaId);
        if (!mhsResponse.success || !mhsResponse.data) {
          throw new Error('Mahasiswa tidak ditemukan');
        }
        setMahasiswa(mhsResponse.data);

        try {
          const krsResponse = await mahasiswaAPI.getKRS(mahasiswaId);
          if (krsResponse.success && krsResponse.data) {
            const sorted = krsResponse.data.sort((a, b) => {
              const semA = `${a.semester?.tahunAkademik}-${a.semester?.periode}`;
              const semB = `${b.semester?.tahunAkademik}-${b.semester?.periode}`;
              return semB.localeCompare(semA);
            });
            setKrsHistory(sorted);
          }
        } catch (krsError) {
          console.warn('Failed to fetch KRS:', krsError);
        }

        try {
          const khsResponse = await mahasiswaAPI.getKHS(mahasiswaId);
          if (khsResponse.success && khsResponse.data) {
            const sorted = khsResponse.data.sort((a, b) => {
              const semA = `${a.semester?.tahunAkademik}-${a.semester?.periode}`;
              const semB = `${b.semester?.tahunAkademik}-${b.semester?.periode}`;
              return semB.localeCompare(semA);
            });
            setKhsHistory(sorted);
          }
        } catch (khsError) {
          console.warn('Failed to fetch KHS:', khsError);
        }
      } catch (err: any) {
        console.error('Fetch data error:', err);
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (mahasiswaId) {
      fetchData();
    }
  }, [mahasiswaId]);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const latestKHS = useMemo(() => (khsHistory.length > 0 ? khsHistory[0] : null), [khsHistory]);

  const currentSemester = useMemo(() => {
    if (!mahasiswa) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - mahasiswa.angkatan + 1;
  }, [mahasiswa]);

  const emailAddress = useMemo(
    () => (mahasiswa ? `${mahasiswa.nim}@student.university.ac.id` : ''),
    [mahasiswa]
  );

  // ============================================
  // HANDLERS
  // ============================================
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleViewKRS = useCallback(
    (krsId: number) => {
      router.push(`/dosen/krs-approval/${krsId}`);
    },
    [router]
  );

  const handleBack = useCallback(() => {
    router.push('/dosen/mahasiswa-bimbingan');
  }, [router]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mahasiswa..." />
      </div>
    );
  }

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
      <PageHeader
        title={mahasiswa.namaLengkap}
        description={`NIM: ${mahasiswa.nim} • ${mahasiswa.prodi?.nama || 'N/A'} • Angkatan ${mahasiswa.angkatan}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dosen/dashboard' },
          { label: 'Mahasiswa Bimbingan', href: '/dosen/mahasiswa-bimbingan' },
          { label: mahasiswa.namaLengkap },
        ]}
        actions={
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          title="Status Mahasiswa"
          value={<StatusBadge status={mahasiswa.status} showIcon />}
        />
        <SummaryCard
          title="IPK"
          icon={Award}
          value={latestKHS?.ipk ? Number(latestKHS.ipk).toFixed(2) : '-'}
          description={`IPS: ${latestKHS?.ips ? Number(latestKHS.ips).toFixed(2) : '-'}`}
        />
        <SummaryCard
          title="Total SKS"
          value={latestKHS?.totalSKSKumulatif || 0}
          description="SKS kumulatif"
        />
        <SummaryCard
          title="Semester"
          icon={Calendar}
          value={currentSemester}
          description={`Angkatan ${mahasiswa.angkatan}`}
        />
      </div>

      {/* Biodata */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Biodata Mahasiswa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <BiodataRow label="NIM" value={<p className="font-mono font-medium">{mahasiswa.nim}</p>} />
              <BiodataRow label="Nama Lengkap" value={mahasiswa.namaLengkap} />
              <BiodataRow label="Program Studi" value={mahasiswa.prodi?.nama || '-'} />
              <BiodataRow label="Angkatan" value={<Badge variant="outline">{mahasiswa.angkatan}</Badge>} />
              <BiodataRow label="Status" value={<StatusBadge status={mahasiswa.status} showIcon />} />
            </div>

            <div className="space-y-4">
              <BiodataRow
                label="Dosen Wali"
                value={
                  <>
                    <p className="font-medium">{mahasiswa.dosenWali?.namaLengkap || 'Anda'}</p>
                    {mahasiswa.dosenWali?.nidn && (
                      <p className="text-sm text-muted-foreground">NIDN: {mahasiswa.dosenWali.nidn}</p>
                    )}
                  </>
                }
              />

              <div className="flex items-center gap-2 text-muted-foreground pt-2">
                <Mail className="h-4 w-4" />
                <div>
                  <p className="text-sm">Email</p>
                  <a
                    href={`mailto:${emailAddress}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {emailAddress}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
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

        {/* KRS History */}
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
                              <p className="font-medium">{krs.semester?.tahunAkademik || '-'}</p>
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
                            {krs.tanggalSubmit ? formatDate(krs.tanggalSubmit) : '-'}
                          </TableCell>
                          <TableCell>
                            {krs.tanggalApproval ? formatDate(krs.tanggalApproval) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewKRS(krs.id)}>
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyHistoryState icon={FileText} message="Belum ada riwayat KRS" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KHS History */}
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
                              <p className="font-medium">{khs.semester?.tahunAkademik || '-'}</p>
                              <p className="text-sm text-muted-foreground">
                                {khs.semester?.periode || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-lg">{Number(khs.ips).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-lg">{Number(khs.ipk).toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{khs.totalSKSSemester} SKS</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{khs.totalSKSKumulatif} SKS</Badge>
                          </TableCell>
                          <TableCell>{formatDate(khs.tanggalGenerate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyHistoryState icon={Award} message="Belum ada riwayat KHS" />
              )}
            </CardContent>
          </Card>

          {/* IPK Trend */}
          {khsHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Tren IPK</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {khsHistory.map((khs, index) => (
                    <IPKTrendRow key={khs.id} khs={khs} prevKHS={khsHistory[index + 1]} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
