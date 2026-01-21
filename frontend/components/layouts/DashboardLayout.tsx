/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dashboard Layout
 * Main layout dengan Sidebar + TopBar + Content area
 * ✅ AUTH ENABLED - Protects all authenticated pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ============================================
  // AUTH CHECK - Protect routes
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          // Not logged in, redirect to login
          toast.error('Silakan login terlebih dahulu');
          router.push('/login');
          return;
        }

        // Parse stored user
        let user;
        try {
          user = JSON.parse(userStr);
        } catch (error) {
          console.error('Invalid user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }

        // Verify token with backend
        try {
          const response = await authAPI.getCurrentUser();
          
          if (!response.data) {
            throw new Error('Invalid session');
          }

          // Update user data from backend
          const backendUser = response.data;
          
          // If role is specified, check if user has correct role
          if (role && backendUser.role !== role) {
            // Wrong role, redirect to correct dashboard
            const roleRoutes: Record<string, string> = {
              ADMIN: '/admin/dashboard',
              DOSEN: '/dosen/dashboard',
              MAHASISWA: '/mahasiswa/dashboard',
              KEUANGAN: '/keuangan/dashboard',
            };
            
            toast.error('Anda tidak memiliki akses ke halaman ini');
            router.push(roleRoutes[backendUser.role] || '/login');
            return;
          }

          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(backendUser));
          setCurrentUser(backendUser);
          setIsLoading(false);

        } catch (apiError: any) {
          // Token invalid or expired
          console.error('Auth verification failed:', apiError);
          
          // Check if it's a network error
          if (!apiError.response) {
            toast.error('Tidak dapat terhubung ke server');
            // Still allow access with cached user data for offline mode
            setCurrentUser(user);
            setIsLoading(false);
            return;
          }

          // Clear invalid session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          router.push('/login');
        }

      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, role]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER LAYOUT
  // ============================================
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block">
        <Sidebar user={currentUser} />
      </aside>

      {/* Mobile Navigation */}
      <MobileNav
        user={currentUser}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          user={currentUser}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}