/**
 * Keuangan Layout Wrapper
 * Wraps all keuangan pages dengan DashboardLayout
 */

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function KeuanganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="KEUANGAN">{children}</DashboardLayout>;
}
