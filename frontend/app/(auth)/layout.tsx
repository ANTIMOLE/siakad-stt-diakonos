/**
 * Auth Layout
 * Layout untuk halaman authentication (login, register, forgot password)
 * Simple center layout tanpa sidebar/navbar
 */

import { GraduationCap } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern (Optional) */}
      <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <GraduationCap className="h-10 w-10" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              SIAKAD STT Diakonos
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sistem Informasi Akademik
            </p>
          </div>

          {/* Children (Login Form, etc) */}
          {children}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 STT Diakonos Banyumas</p>
            <p className="mt-1">Sekolah Tinggi Teologi Diakonos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
