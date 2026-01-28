/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { KeyRound, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { authAPI } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();

  // ============================================
  // GET USER FROM LOCALSTORAGE
  // ============================================
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (err) {
        console.error('Gagal parse user dari localStorage');
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  // ============================================
  // DETERMINE USER CAPABILITIES
  // ============================================
  const canChangeUsername = user?.role === 'ADMIN' || user?.role === 'KEUANGAN';

  // ============================================
  // STATE MANAGEMENT - PASSWORD
  // ============================================
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // ============================================
  // STATE MANAGEMENT - USERNAME
  // ============================================
  const [usernameForm, setUsernameForm] = useState({
    currentUsername: '',
    newUsername: '',
  });
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  // ============================================
  // LOAD CURRENT USERNAME
  // ============================================
  useEffect(() => {
    if (user && canChangeUsername) {
      setUsernameForm({
        currentUsername: user.username || '',
        newUsername: '',
      });
    }
  }, [user, canChangeUsername]);

  // ============================================
  // PASSWORD CHANGE HANDLER
  // ============================================
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Semua field password harus diisi');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      toast.error('Password baru harus berbeda dengan password lama');
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await authAPI.changePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      if (response.success) {
        toast.success('Password berhasil diubah');
        
        // Reset form
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Optional: Logout user and redirect to login
        // setTimeout(() => {
        //   localStorage.removeItem('user');
        //   router.push('/login');
        // }, 1500);
      } else {
        toast.error(response.message || 'Gagal mengubah password');
      }
    } catch (err: any) {
      console.error('Change password error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat mengubah password'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ============================================
  // USERNAME CHANGE HANDLER
  // ============================================
  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!usernameForm.newUsername) {
      toast.error('Username baru harus diisi');
      return;
    }

    if (usernameForm.newUsername === usernameForm.currentUsername) {
      toast.error('Username baru harus berbeda dengan username saat ini');
      return;
    }

    if (usernameForm.newUsername.length < 3) {
      toast.error('Username minimal 3 karakter');
      return;
    }

    // Validate username format (alphanumeric + underscore + hyphen, must start with letter)
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(usernameForm.newUsername)) {
      toast.error('Username harus diawali huruf dan hanya boleh berisi huruf, angka, underscore, atau hyphen');
      return;
    }

    try {
      setIsChangingUsername(true);

      // ⚠️ TODO: Add API endpoint for changing username
      // const response = await authAPI.changeUsername(usernameForm.newUsername);
      
      // For now, show not implemented
      toast.error('Fitur ganti username akan segera tersedia');
      
      // When implemented:
      // if (response.success) {
      //   toast.success('Username berhasil diubah');
      //   const updatedUser = { ...user, username: usernameForm.newUsername };
      //   localStorage.setItem('user', JSON.stringify(updatedUser));
      //   setUser(updatedUser);
      //   setUsernameForm({
      //     currentUsername: usernameForm.newUsername,
      //     newUsername: '',
      //   });
      // } else {
      //   toast.error(response.message || 'Gagal mengubah username');
      // }
    } catch (err: any) {
      console.error('Change username error:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        'Terjadi kesalahan saat mengubah username'
      );
    } finally {
      setIsChangingUsername(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isAuthLoading) {
    return <LoadingSpinner size="lg" text="Memuat pengaturan..." />;
  }

  // ============================================
  // NOT LOGGED IN
  // ============================================
  if (!user) {
    return (
      <ErrorState
        title="Akses Ditolak"
        message="Silakan login kembali"
        onRetry={() => router.push('/login')}
      />
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola keamanan dan informasi akun Anda"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${user.role.toLowerCase()}/dashboard` },
          { label: 'Pengaturan' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* PASSWORD CHANGE SECTION */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Ganti Password</CardTitle>
                <CardDescription>
                  Ubah password Anda untuk meningkatkan keamanan akun
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Password Lama</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="Masukkan password lama"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                  }
                  disabled={isChangingPassword}
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  disabled={isChangingPassword}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  disabled={isChangingPassword}
                />
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Tips Keamanan:</strong>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
                    <li>Gunakan minimal 6 karakter</li>
                    <li>Kombinasi huruf besar, kecil, dan angka</li>
                    <li>Jangan gunakan password yang mudah ditebak</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Mengubah Password...
                  </>
                ) : (
                  'Ubah Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* USERNAME CHANGE SECTION (Admin & Keuangan only) */}
        {canChangeUsername && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-2">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Ganti Username</CardTitle>
                  <CardDescription>
                    Ubah username untuk login (khusus Admin & Keuangan)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameChange} className="space-y-4">
                {/* Current Username */}
                <div className="space-y-2">
                  <Label htmlFor="currentUsername">Username Saat Ini</Label>
                  <Input
                    id="currentUsername"
                    type="text"
                    value={usernameForm.currentUsername}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* New Username */}
                <div className="space-y-2">
                  <Label htmlFor="newUsername">Username Baru</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    placeholder="Masukkan username baru"
                    value={usernameForm.newUsername}
                    onChange={(e) =>
                      setUsernameForm({ ...usernameForm, newUsername: e.target.value })
                    }
                    disabled={isChangingUsername}
                  />
                  <p className="text-xs text-muted-foreground">
                    Harus diawali huruf, boleh berisi huruf, angka, underscore, atau hyphen
                  </p>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm text-yellow-900">
                    <strong>Perhatian:</strong> Setelah mengubah username, Anda harus login menggunakan username yang baru.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isChangingUsername}
                >
                  {isChangingUsername ? (
                    <>
                      <LoadingSpinner className="mr-2" size="sm" />
                      Mengubah Username...
                    </>
                  ) : (
                    'Ubah Username'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* INFO CARD (for Dosen & Mahasiswa) */}
        {!canChangeUsername && (
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gray-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle>Informasi Akun</CardTitle>
                  <CardDescription>
                    Detail identitas login Anda
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Identitas Login</Label>
                <Input
                  type="text"
                  value={
                    user?.mahasiswa?.nim ||
                    user?.dosen?.nidn ||
                    user?.admin?.nik ||
                    '-'
                  }
                  disabled
                  className="bg-gray-50 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'MAHASISWA' && 'Gunakan NIM untuk login'}
                  {user?.role === 'DOSEN' && 'Gunakan NIDN untuk login'}
                </p>
              </div>

              <Separator />

              <Alert className="border-gray-200 bg-gray-50">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Catatan:</p>
                  <p>
                    {user?.role === 'MAHASISWA' && 'Mahasiswa tidak dapat mengubah NIM. Jika ada kesalahan data, hubungi bagian akademik.'}
                    {user?.role === 'DOSEN' && 'Dosen tidak dapat mengubah NIDN. Jika ada kesalahan data, hubungi bagian akademik.'}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary mb-2">
                  Keamanan Akun Anda
                </p>
                <p className="text-xs text-muted-foreground">
                  Untuk menjaga keamanan akun, pastikan Anda mengubah password secara berkala dan jangan membagikan password Anda kepada siapapun.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}