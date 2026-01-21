/**
 * Login Page
 * Form login dengan Nomor Induk (NIM/NIP/NIK) + password
 * Submit ke API, save token, redirect berdasarkan role
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// API & Utils
import { authAPI } from '@/lib/api';
import { ROLES } from '@/lib/constants';

// ============================================
// VALIDATION SCHEMA
// ============================================
const loginSchema = z.object({
  Identifier: z
    .string()
    .min(1, 'Nomor Identifier wajib diisi')
    .min(1, 'Nomor Identifier minimal 1 karakter')
    .regex(/^[a-zA-Z0-9]+$/, 'Nomor Identifier hanya boleh berisi huruf dan angka'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// LOGIN PAGE COMPONENT
// ============================================
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      Identifier: '',
      password: '',
    },
  });

  // ============================================
  // SUBMIT HANDLER
  // ============================================
const onSubmit = async (data: LoginFormData) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await authAPI.login(
      data.Identifier,
      data.password
    );

    console.log('FULL RESPONSE:', response);
    console.log('USER DATA:', response.data?.user);  // ✅ Debug user

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Data login tidak lengkap');
    }

    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error('Data login tidak lengkap');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // ✅ Fix: Pakai property yang ada di response
    const getUserName = () => {
      if (user.role === 'MAHASISWA' && user.mahasiswa) {
        return user.mahasiswa.namaLengkap;
      }
      if (user.role === 'DOSEN' && user.dosen) {
        return user.dosen.namaLengkap;
      }
      if (user.role === 'ADMIN' && user.admin) {
        return user.admin.nama || 'Admin';
      }
      return 'User';
    };

    toast.success(`Selamat datang, ${getUserName()}!`);

    const roleRoutes: Record<string, string> = {
      ADMIN: '/admin/dashboard',
      DOSEN: '/dosen/dashboard',
      MAHASISWA: '/mahasiswa/dashboard',
      KEUANGAN: '/keuangan/dashboard',
    };

    router.push(roleRoutes[user.role as string] || '/');

  } catch (err: any) {
    console.error('Login error:', err);
    console.error('Error response:', err.response);  // ✅ Debug error

    let errorMessage = 'Terjadi kesalahan saat login';

    // ✅ Fix: Interceptor sudah unwrap error.response
    if (err.response?.data) {
      errorMessage = err.response.data.message || err.response.data.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }

    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};



  // ============================================
  // RENDER
  // ============================================
  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>
          Masukkan Identifier dan password untuk mengakses sistem
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Identifier Field */}
          <div className="space-y-2">
            <Label htmlFor="identifier">Identifier</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                type="text"
                placeholder="NIM / NIP / NIK"
                className="pl-10"
                disabled={isLoading}
                {...register('Identifier')}
              />
            </div>
            {errors.Identifier && (
              <p className="text-sm text-destructive">{errors.Identifier.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                disabled={isLoading}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Ingat saya
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Lupa password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        {/* Demo Accounts Info (Optional - Remove in production) */}
        <div className="mt-6 rounded-lg bg-muted p-4 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground">Demo Accounts:</p>
          <div className="space-y-1 text-muted-foreground">
            <p>• Admin: ADM001 / admin123</p>
            <p>• Dosen: DSN001 / dosen123</p>
            <p>• Mahasiswa: 220101001 / mhs123</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}