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
      // NIM format: XX.YY.ZZZ
      const isNIM = /^\d{2}\.\d{2}\.\d{3}$/.test(val);
      // NIDN: 10 digits
      const isNIDN = /^\d{10}$/.test(val);
      // NUPTK: 16 digits
      const isNUPTK = /^\d{16}$/.test(val);
      // Username: starts with letter
      const isUsername = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(val);
      
      return isNIM || isNIDN || isNUPTK || isUsername;
    }, 'Format tidak valid. Gunakan NIM (XX.YY.ZZZ), NIDN (10 digit), NUPTK (16 digit), atau Username'),
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
  const [identifierValue, setIdentifierValue] = useState('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit', // ✅ ONLY VALIDATE ON SUBMIT, NOT ON CHANGE
  });

  // ============================================
  // SMART AUTO-FORMAT HANDLER
  // ============================================
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if value contains any letters
    const hasLetters = /[a-zA-Z]/.test(value);
    
    // If has letters, it's a username - don't format
    if (hasLetters) {
      setIdentifierValue(value);
      setValue('identifier', value, { shouldValidate: false }); // ✅ Don't trigger validation
      return;
    }
    
    // Only digits - check what type it could be
    const digitsOnly = value.replace(/[.\s-]/g, ''); // Remove dots, spaces, hyphens
    
    // ✅ NIM: Auto-format ONLY if <= 7 digits
    if (digitsOnly.length <= 7) {
      let formatted = digitsOnly;
      
      // Format: XX.YY.ZZZ
      if (digitsOnly.length > 4) {
        formatted = `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
      } else if (digitsOnly.length > 2) {
        formatted = `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
      }
      
      setIdentifierValue(formatted);
      setValue('identifier', formatted, { shouldValidate: false }); // ✅ Don't trigger validation
    }
    // ✅ NIDN (10 digits) or NUPTK (16 digits)
    // Just keep the digits, no formatting
    else if (digitsOnly.length <= 16) {
      setIdentifierValue(digitsOnly);
      setValue('identifier', digitsOnly, { shouldValidate: false }); // ✅ Don't trigger validation
    }
  };

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

          {/* Identifier Input with Smart Auto-Format */}
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
                value={identifierValue}
                onChange={handleIdentifierChange}
              />
            </div>
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mahasiswa: ketik NIM (contoh: 2401001 → 24.01.001)
              <br />
              Dosen: NIDN (10 digit) / NUPTK (16 digit) / Username
            </p>
          </div>

          {/* Password Input */}
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
            <p className="font-medium mt-2">Admin / Keuangan:</p>
            <p className="ml-2">• Username: <span className="font-mono font-semibold">admin</span> atau <span className="font-mono font-semibold">keuangan</span></p>
            
            <p className="font-medium mt-2">Dosen:</p>
            <p className="ml-2">• Username: <span className="font-mono font-semibold">dosen1</span>, <span className="font-mono font-semibold">dosen2</span></p>
            <p className="ml-2">• NIDN: <span className="font-mono font-semibold">0101018901</span> (10 digit, tanpa titik)</p>
            <p className="ml-2">• NUPTK: <span className="font-mono font-semibold">1234567890123456</span> (16 digit)</p>
            
            <p className="font-medium mt-2">Mahasiswa:</p>
            <p className="ml-2">• NIM: Ketik <span className="font-mono font-semibold">2401001</span> → otomatis jadi <span className="font-mono font-semibold">24.01.001</span></p>
            <p className="ml-2">• NIM: Ketik <span className="font-mono font-semibold">2301001</span> → otomatis jadi <span className="font-mono font-semibold">23.01.001</span></p>
            
            <p className="mt-3 italic border-t pt-2">Password default: <span className="font-bold">password123</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
