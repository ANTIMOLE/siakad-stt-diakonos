/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Top Bar
 * Header dengan hamburger menu (mobile), page title, user dropdown, logout
 * ✅ UPDATED: Added Profil for Dosen/Mahasiswa, removed Bell
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Menu, LogOut, KeyRound, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopBarProps {
  user: any;
  onMenuClick: () => void;
}

export default function TopBar({ user, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ============================================
  // GET PAGE TITLE FROM PATHNAME
  // ============================================
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    // Convert kebab-case to Title Case
    return lastSegment
      ? lastSegment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Dashboard';
  };

  // ============================================
  // GET SETTINGS LABEL
  // ============================================
  const getSettingsLabel = () => {
    if (user?.role === 'ADMIN' || user?.role === 'KEUANGAN') {
      return 'Ganti Password/Username';
    }
    return 'Ganti Password';
  };

  // ============================================
  // GET ROUTES
  // ============================================
  const getSettingsRoute = () => {
    const role = user?.role?.toLowerCase();
    return `/${role}/settings`;
  };

  const getProfilRoute = () => {
    const role = user?.role?.toLowerCase();
    return `/${role}/profil`;
  };

  // ============================================
  // CHECK IF USER CAN ACCESS PROFIL
  // ============================================
  const canAccessProfil = () => {
    return user?.role === 'DOSEN' || user?.role === 'MAHASISWA';
  };

  // ============================================
  // LOGOUT HANDLER
  // ============================================
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Show toast
    toast.success('Berhasil logout');

    // Redirect to login
    router.push('/login');
  };

  // ============================================
  // USER INITIALS
  // ============================================
  const getUserInitials = () => {
    let nama = '';
    
    if (user?.dosen?.namaLengkap) nama = user.dosen.namaLengkap;
    else if (user?.mahasiswa?.namaLengkap) nama = user.mahasiswa.namaLengkap;
    else if (user?.admin?.nama) nama = user.admin.nama;
    
    if (nama) {
      // ✅ Clean punctuation + Filter gelar
      const names = nama
        .replace(/[,;]/g, '') // Remove koma, semicolon
        .split(' ')
        .filter(word => 
          !word.includes('.') &&  // No dots (gelar)
          word.length >= 3 &&     // Min 3 chars
          /^[A-Za-z]+$/.test(word) // Only letters (no numbers/symbols)
        );
      
      if (names.length >= 2) {
        return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
      }
      return names[0]?.charAt(0).toUpperCase() || 'U';
    }
    return 'U';
  };

  // ============================================
  // USER IDENTIFIER (NIK/NIM/NIDN)
  // ============================================
  const getUserIdentifier = () => {
    if (user?.mahasiswa?.nim) return user.mahasiswa.nim;
    if (user?.dosen?.nidn) return user.dosen.nidn;
    if (user?.admin?.nik) return user.admin.nik;
    return '-';
  };

  // ============================================
  // USER DISPLAY NAME
  // ============================================
  const getUserDisplayName = () => {
    let nama = '';
    
    if (user?.dosen?.namaLengkap) nama = user.dosen.namaLengkap;
    else if (user?.mahasiswa?.namaLengkap) nama = user.mahasiswa.namaLengkap;
    else if (user?.admin?.nama) nama = user.admin.nama;
    
    if (nama) {
      // ✅ Clean punctuation + Filter gelar (SAMA KAYAK getUserInitials)
      const names = nama
        .replace(/[,;]/g, '') // Remove koma, semicolon
        .split(' ')
        .filter(word => 
          !word.includes('.') &&     // No dots (gelar)
          word.length >= 3 &&        // Min 3 chars
          /^[A-Za-z]+$/.test(word)   // Only letters
        );
      
      // Return first name aja
      return names[0] || getUserIdentifier();
    }
    return getUserIdentifier();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
      {/* Left Section - Menu Button + Title */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h2>
          <p className="hidden text-xs md:text-sm text-muted-foreground sm:block">
            {user?.role === 'ADMIN' && 'Administrator'}
            {user?.role === 'DOSEN' && 'Dosen'}
            {user?.role === 'MAHASISWA' && 'Mahasiswa'}
            {user?.role === 'KEUANGAN' && 'Staff Keuangan'}
          </p>
        </div>
      </div>

      {/* Right Section - User Menu Only */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="gap-2 cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200 h-9 md:h-10"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:block">
                {getUserDisplayName()}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 z-50">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.dosen?.namaLengkap || user?.mahasiswa?.namaLengkap || user?.admin?.nama || 'User'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {getUserIdentifier()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.role === 'ADMIN' && 'Administrator'}
                  {user?.role === 'DOSEN' && 'Dosen'}
                  {user?.role === 'MAHASISWA' && 'Mahasiswa'}
                  {user?.role === 'KEUANGAN' && 'Staff Keuangan'}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* ✅ Profil - Only for Dosen & Mahasiswa */}
            {canAccessProfil() && (
              <>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-gray-100 active:scale-95 transition-all"
                  onClick={() => router.push(getProfilRoute())}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* ✅ Settings - All Roles */}
            <DropdownMenuItem 
              className="cursor-pointer hover:bg-gray-100 active:scale-95 transition-all"
              onClick={() => router.push(getSettingsRoute())}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>{getSettingsLabel()}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50 active:scale-95 transition-all"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}