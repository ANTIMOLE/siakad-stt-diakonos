import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'relative overflow-hidden',
          'cursor-pointer select-none',
          'font-semibold tracking-wide',
          
          // Smooth transitions
          'transition-all duration-300 ease-out',
          
          // Transform on hover and active
          'hover:scale-[1.03] hover:shadow-lg',
          'active:scale-[0.98]',
          
          // Gradient overlay effect on hover
          'before:absolute before:inset-0',
          'before:bg-linear-to-r before:from-white/0 before:via-white/20 before:to-white/0',
          'before:translate-x-[-200%] before:transition-transform before:duration-700',
          'hover:before:translate-x-[200%]',
          
          // Focus styles
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary focus-visible:ring-offset-2',
          
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50',
          'disabled:hover:scale-100 disabled:hover:shadow-none',
          
          // Loading state
          isLoading && 'cursor-wait',
          
          className
        )}
        {...props}
      >
        <span  className={cn(
          'relative z-10 flex items-center justify-center gap-2',
          isLoading && 'opacity-0'
        )}>
          {children}
        </span>
        
        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="h-5 w-5 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </Button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

export { PrimaryButton };