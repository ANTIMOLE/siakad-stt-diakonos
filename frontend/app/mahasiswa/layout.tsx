/**
 * Mahasiswa Layout Wrapper
 */

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="MAHASISWA">{children}</DashboardLayout>;
}
