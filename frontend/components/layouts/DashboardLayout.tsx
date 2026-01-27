/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dashboard Layout
 * Main layout dengan Sidebar + TopBar + Content area
 * ✅ AUTH ENABLED - Protects all authenticated pages
 * ✅ UPDATED: Integrated with useAuth hook for cookie-based auth
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Adjust path sesuai lokasi hook

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const { user: currentUser, isLoading, isAuthenticated } = useAuth(role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ============================================
  // REDIRECT EFFECT
  // ============================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // ============================================
  // LOADING OR UNAUTH STATE
  // ============================================
  if (isLoading || !isAuthenticated) {
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