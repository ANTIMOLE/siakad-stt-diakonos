/**
 * Dosen Layout Wrapper
 */

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="DOSEN">{children}</DashboardLayout>;
}