/**
 * Error State Component
 * Displays error message with retry option
 */

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline';
}

export default function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
  className,
  variant = 'default',
}: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 gap-2 border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="h-3 w-3" />
              Coba Lagi
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center md:p-12',
        className
      )}
    >
      {/* Error Icon */}
      <div className="mb-4 rounded-full bg-red-100 p-3">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-red-900">
        {title}
      </h3>

      {/* Message */}
      <p className="mb-6 max-w-sm text-sm text-red-700">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 border-red-300 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

/**
 * Error Toast Alternative
 * For use with toast notifications
 */
export function ErrorToastContent({
  title = 'Error',
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-900">{title}</p>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}