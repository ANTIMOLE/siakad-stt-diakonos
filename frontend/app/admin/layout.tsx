/**
 * Admin Layout Wrapper
 * Wraps all admin pages dengan DashboardLayout
 */

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="ADMIN">{children}</DashboardLayout>;
}
