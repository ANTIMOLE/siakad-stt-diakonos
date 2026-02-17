/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { KeyRound, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { authAPI } from '@/lib/api';

// ✅ Helper functions outside component
const validatePassword = (form: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    return 'Semua field password harus diisi';
  }
  if (form.newPassword.length < 8) {
    return 'Password baru minimal 8 karakter';
  }
  if (form.newPassword !== form.confirmPassword) {
    return 'Password baru dan konfirmasi tidak cocok';
  }
  if (form.oldPassword === form.newPassword) {
    return 'Password baru harus berbeda dengan password lama';
  }
  return null;
};

const validateUsername = (newUsername: string, currentUsername: string): string | null => {
  if (!newUsername) {
    return 'Username baru harus diisi';
  }
  if (newUsername === currentUsername) {
    return 'Username baru harus berbeda dengan username saat ini';
  }
  if (newUsername.length < 3) {
    return 'Username minimal 3 karakter';
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(newUsername)) {
    return 'Username harus diawali huruf dan hanya boleh berisi huruf, angka, underscore, atau hyphen';
  }
  return null;
};

const getRoleDashboard = (role: string): string => {
  const dashboards: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    DOSEN: '/dosen/dashboard',
    MAHASISWA: '/mahasiswa/dashboard',
    KEUANGAN: '/keuangan/dashboard',
  };
  return dashboards[role] || '/';
};

const getLoginIdentity = (user: any): string => {
  return user?.mahasiswa?.nim || user?.dosen?.nidn || user?.admin?.nik || '-';
};

const getLoginLabel = (role: string): string => {
  if (role === 'MAHASISWA') return 'Gunakan NIM untuk login';
  if (role === 'DOSEN') return 'Gunakan NIDN untuk login';
  return '-';
};

const getAccountNote = (role: string): string => {
  if (role === 'MAHASISWA') {
    return 'Mahasiswa tidak dapat mengubah NIM. Jika ada kesalahan data, hubungi bagian akademik.';
  }
  if (role === 'DOSEN') {
    return 'Dosen tidak dapat mengubah NIDN. Jika ada kesalahan data, hubungi bagian akademik.';
  }
  return '';
};

// ✅ Password visibility toggle component
const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  show,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  show: boolean;
  onToggle: () => void;
}) => (
  <div className="relative">
    <Input
      id={id}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="pr-10"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
      onClick={onToggle}
      disabled={disabled}
    >
      {show ? (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Eye className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  </div>
);

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Gagal parse user dari localStorage');
        localStorage.removeItem('user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameForm, setUsernameForm] = useState({
    currentUsername: '',
    newUsername: '',
  });
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  // ============================================
  // MEMOIZED VALUES
  // ============================================
  const canChangeUsername = useMemo(
    () => user?.role === 'ADMIN' || user?.role === 'KEUANGAN',
    [user?.role]
  );

  const dashboardLink = useMemo(
    () => getRoleDashboard(user?.role),
    [user?.role]
  );

  const loginIdentity = useMemo(
    () => getLoginIdentity(user),
    [user]
  );

  const loginLabel = useMemo(
    () => getLoginLabel(user?.role),
    [user?.role]
  );

  const accountNote = useMemo(
    () => getAccountNote(user?.role),
    [user?.role]
  );

  // ============================================
  // EFFECTS
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
  // HANDLERS
  // ============================================
  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePassword(passwordForm);
    if (error) {
      toast.error(error);
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
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        toast.error(response.message || 'Gagal mengubah password');
      }
    } catch (err: any) {
      console.error('Change password error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordForm]);

  const handleUsernameChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateUsername(usernameForm.newUsername, usernameForm.currentUsername);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsChangingUsername(true);
      toast.error('Fitur ganti username akan segera tersedia');
    } catch (err: any) {
      console.error('Change username error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsChangingUsername(false);
    }
  }, [usernameForm]);

  const handleLoginRedirect = useCallback(() => {
    router.push('/login');
  }, [router]);

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (isAuthLoading) {
    return <LoadingSpinner size="lg" text="Memuat pengaturan..." />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Akses Ditolak"
        message="Silakan login kembali"
        onRetry={handleLoginRedirect}
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
          { label: 'Dashboard', href: dashboardLink },
          { label: 'Pengaturan' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ganti Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Ganti Password</CardTitle>
                <CardDescription className="text-xs">
                  Ubah password untuk meningkatkan keamanan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-sm">Password Lama</Label>
                <PasswordInput
                  id="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={(value) =>
                    setPasswordForm({ ...passwordForm, oldPassword: value })
                  }
                  placeholder="Masukkan password lama"
                  disabled={isChangingPassword}
                  show={showOldPassword}
                  onToggle={() => setShowOldPassword(!showOldPassword)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm">Password Baru</Label>
                <PasswordInput
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(value) =>
                    setPasswordForm({ ...passwordForm, newPassword: value })
                  }
                  placeholder="Min. 6 karakter"
                  disabled={isChangingPassword}
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword(!showNewPassword)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">
                  Konfirmasi Password
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(value) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: value })
                  }
                  placeholder="Ulangi password baru"
                  disabled={isChangingPassword}
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900">
                  <strong>Tips:</strong> Gunakan min. 6 karakter dengan kombinasi huruf besar, kecil, dan angka
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Mengubah...
                  </>
                ) : (
                  'Ubah Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ganti Username (Admin/Keuangan) */}
        {canChangeUsername && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2.5">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Ganti Username</CardTitle>
                  <CardDescription className="text-xs">
                    Ubah username untuk login
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentUsername" className="text-sm">
                    Username Saat Ini
                  </Label>
                  <Input
                    id="currentUsername"
                    value={usernameForm.currentUsername}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newUsername" className="text-sm">Username Baru</Label>
                  <Input
                    id="newUsername"
                    placeholder="Masukkan username baru"
                    value={usernameForm.newUsername}
                    onChange={(e) =>
                      setUsernameForm({ ...usernameForm, newUsername: e.target.value })
                    }
                    disabled={isChangingUsername}
                  />
                  <p className="text-xs text-muted-foreground">
                    Harus diawali huruf, boleh berisi huruf, angka, _ atau -
                  </p>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-xs text-yellow-900">
                    Setelah mengubah username, login menggunakan username baru
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
                      Mengubah...
                    </>
                  ) : (
                    'Ubah Username'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Informasi Akun (Mahasiswa/Dosen) */}
        {!canChangeUsername && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informasi Akun</CardTitle>
                  <CardDescription className="text-xs">Detail identitas login</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Identitas Login</Label>
                <Input
                  value={loginIdentity}
                  disabled
                  className="bg-gray-50 font-mono"
                />
                <p className="text-xs text-muted-foreground">{loginLabel}</p>
              </div>

              <Separator />

              <Alert className="border-gray-200 bg-gray-50">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-xs text-gray-700">
                  {accountNote}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary mb-1">
                  Keamanan Akun
                </p>
                <p className="text-xs text-muted-foreground">
                  Ubah password secara berkala dan jangan bagikan ke siapapun
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
