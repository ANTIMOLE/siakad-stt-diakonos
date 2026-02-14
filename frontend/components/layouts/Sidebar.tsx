/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sidebar Navigation
 * Desktop sidebar dengan logo, navigation menu, dan user info
 * Menu items dynamic based on user role
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_MENU, DOSEN_MENU, MAHASISWA_MENU ,KEUANGAN_MENU } from '@/lib/constants';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Package,
  CheckSquare,
  Calendar,
  FileText,
  DollarSign,
  Award,
  School,
  File,
  DoorOpen,
  CalendarPlus
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Package,
  CheckSquare,
  Calendar,
  FileText,
  DollarSign,
  Award,
  School,
  File,
  DoorOpen,
  CalendarPlus
};

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
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
    if (user?.mahasiswa?.nim) return `NIM: ${user.mahasiswa.nim}`;
    if (user?.dosen?.nidn) return `NIDN: ${user.dosen.nidn}`;
    if (user?.admin?.nik) return `NIK: ${user.admin.nik}`;
    return user?.role || '-';
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo & Title */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
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
          <h1 className="text-sm font-bold leading-tight">SIAKAD</h1>
          <p className="text-xs text-muted-foreground">STT Diakonos</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
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

      {/* User Info Card */}
      <div className="border-t bg-gray-50 p-4 hover:bg-gray-100 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <span className="text-sm font-semibold">
              {getUserInitials()}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.dosen?.namaLengkap || 
              user?.mahasiswa?.namaLengkap || 
              user?.admin?.nama || 
              'User'}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {getUserIdentifier()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}