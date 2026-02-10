/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Mobile Navigation
 * Drawer/Sheet navigation untuk mobile devices
 * Same menu items as Sidebar
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_MENU, DOSEN_MENU, MAHASISWA_MENU , KEUANGAN_MENU } from '@/lib/constants';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Package,
  CheckSquare,
  Calendar,
  FileText,
  Award,
  School
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Icon mapping (same as Sidebar)
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Package,
  CheckSquare,
  Calendar,
  FileText,
  Award,
  School
};

interface MobileNavProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ user, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Get menu items based on user role
  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return ADMIN_MENU;
      case 'DOSEN':
        return DOSEN_MENU;
      case 'MAHASISWA':
        return MAHASISWA_MENU;
      case 'KEUANGAN':
        return KEUANGAN_MENU;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

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
    if (user?.profile?.nim) return `NIM: ${user.profile.nim}`;
    if (user?.profile?.nidn) return `NIDN: ${user.profile.nidn}`;
    if (user?.profile?.nik) return `NIK: ${user.profile.nik}`;
    return user?.username || user?.role || '-';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 sm:w-80">
        {/* Header */}
        <SheetHeader className="border-b p-4 bg-white">
          <div className="flex items-center gap-3">
            {/* ✅ LOGO IMAGE */}
            <div className='relative h-10 w-10 shrink-0'>
              <Image
                src="/LOGO.png"
                alt="STT Diakonos Logo"
                fill
                className='object-contain'
                priority
              />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base font-bold leading-tight">
                SIAKAD
              </SheetTitle>
              <p className="text-xs text-muted-foreground">STT Diakonos</p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose} // Close drawer after navigation
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1 active:scale-[0.98]'
                  )}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info (Bottom) */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-semibold">
                {getUserInitials()}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.profile?.nama || 'User'}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {getUserIdentifier()}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}