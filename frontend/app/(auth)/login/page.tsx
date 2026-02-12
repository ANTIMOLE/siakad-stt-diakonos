'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// API
import { authAPI } from '@/lib/api';

// ============================================
// VALIDATION SCHEMA
// ============================================
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier wajib diisi')
    .refine((val) => {
      const is10Digits = /^\d{10}$/.test(val);
      const is16Digits = /^\d{16}$/.test(val);
      const isUsername = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(val);
      const isUserID = /^\d{1,9}$/.test(val);
      
      return is10Digits || is16Digits || isUsername || isUserID;
    }, 'Format identifier tidak valid. Gunakan NIM/NIDN (10 digit), NUPTK (16 digit), Username, atau User ID'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;


const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

// ============================================
// LOGIN PAGE COMPONENT
// ============================================
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

    
      const recaptchaToken = recaptchaRef.current?.getValue();
      
      if (!recaptchaToken) {
        throw new Error('Silakan selesaikan verifikasi reCAPTCHA');
      }

      
      const response = await authAPI.login(
        data.identifier, 
        data.password,
        recaptchaToken
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login gagal');
      }

      const { user } = response.data;

      localStorage.setItem('user', JSON.stringify(user));

      const getUserName = () => {
        if (user.mahasiswa) return user.mahasiswa.namaLengkap;
        if (user.dosen) return user.dosen.namaLengkap;
        return user.username || 'User';
      };

      toast.success(`Selamat datang, ${getUserName()}!`);

      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        DOSEN: '/dosen/dashboard',
        MAHASISWA: '/mahasiswa/dashboard',
        KEUANGAN: '/keuangan/dashboard',
      };

      router.push(roleRoutes[user.role] || '/');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login error:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan saat login';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // ✅ RESET RECAPTCHA ON ERROR
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-4">
        <div className="flex justify-center">
          <div className="relative h-20 w-20">
            <Image
              src="/LOGO.png"
              alt="STT Diakonos Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Masukkan Identifier dan password untuk mengakses sistem
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="identifier">Identifier</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier"
                type="text"
                placeholder="NIM / NIDN / NUPTK / Username"
                className="pl-10"
                disabled={isLoading}
                {...register('identifier')}
              />
            </div>
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>

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

          {/* ✅ RECAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={() => setError(null)}
            />
          </div>

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

        <div className="mt-6 rounded-lg bg-muted p-4 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground">
            Contoh Format Login
          </p>
          <div className="space-y-1 text-muted-foreground">
            <p>• Admin → username: <i>admin</i></p>
            <p>• Keuangan → username: <i>keuangan</i></p>
            <p>• Dosen (NIDN) → username: <i>0101018901</i></p>
            <p>• Dosen (NUPTK) → username: <i>1234567890123456</i></p>
            <p>• Mahasiswa (NIM) → username: <i>2024010001</i></p>
            <p className="mt-2 italic">Password contoh: <b>password123</b></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}