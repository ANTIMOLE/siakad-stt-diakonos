/**
 * Status Badge Component
 * Color-coded badges for various status types
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle, Info } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  showIcon?: boolean;
  className?: string;
}

// Status mapping untuk automasi
const statusMap: Record<string, StatusVariant> = {
  // Success states
  active: 'success',
  aktif: 'success',
  approved: 'success',
  disetujui: 'success',
  completed: 'success',
  selesai: 'success',
  success: 'success',
  berhasil: 'success',
  lulus: 'success',
  
  // Warning states
  pending: 'warning',
  menunggu: 'warning',
  waiting: 'warning',
  draft: 'warning',
  review: 'warning',
  
  // Danger states
  inactive: 'danger',
  nonaktif: 'danger',
  rejected: 'danger',
  ditolak: 'danger',
  failed: 'danger',
  gagal: 'danger',
  expired: 'danger',
  
  // Info states
  info: 'info',
  informasi: 'info',
  new: 'info',
  baru: 'info',
};

// Variant styles
const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
  danger: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  info: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  default: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
};

// Icons for each variant
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const variantIcons: Record<StatusVariant, React.ComponentType<any>> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: Info,
  default: AlertCircle,
};

export default function StatusBadge({
  status,
  variant,
  showIcon = false,
  className,
}: StatusBadgeProps) {
  // Auto-detect variant from status string if not provided
  const detectedVariant = variant || statusMap[status.toLowerCase()] || 'default';
  
  const Icon = variantIcons[detectedVariant];

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium',
        variantStyles[detectedVariant],
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {status}
    </Badge>
  );
}

/**
 * Dot Status Badge
 * Badge with colored dot indicator
 */
export function StatusBadgeDot({
  status,
  variant,
}: {
  status: string;
  variant?: StatusVariant;
}) {
  const detectedVariant = variant || statusMap[status.toLowerCase()] || 'default';
  
  const dotColors: Record<StatusVariant, string> = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', dotColors[detectedVariant])} />
      <span className="text-sm font-medium text-gray-900">{status}</span>
    </div>
  );
}

/**
 * Simple Status Text
 * Just colored text without badge
 */
export function StatusText({
  status,
  variant,
}: {
  status: string;
  variant?: StatusVariant;
}) {
  const detectedVariant = variant || statusMap[status.toLowerCase()] || 'default';
  
  const textColors: Record<StatusVariant, string> = {
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
    default: 'text-gray-700',
  };

  return (
    <span className={cn('text-sm font-medium', textColors[detectedVariant])}>
      {status}
    </span>
  );
}