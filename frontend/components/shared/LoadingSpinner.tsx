/**
 * Loading Spinner Component
 * Reusable loading indicator with multiple sizes
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export default function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {text && (
        <p className={cn('text-muted-foreground', textSizeMap[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Fullscreen Loading Spinner
 * Covers entire viewport
 */
export function LoadingScreen({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Inline Loading Spinner
 * For inline use (e.g., inside buttons)
 */
export function LoadingInline({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <Loader2 className={cn('animate-spin', sizeMap[size])} />;
}