import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Base
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-polli-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-xs min-h-[32px]',
        size === 'md' && 'px-4 py-2 text-sm min-h-[40px]',
        size === 'lg' && 'px-6 py-3 text-base min-h-[48px]',
        // Variants
        variant === 'default' && 'bg-polli-700 text-white hover:bg-polli-800 shadow-sm hover:shadow-md active:bg-polli-900',
        variant === 'outline' && 'border border-earth-200 bg-white text-earth-700 hover:bg-earth-50 hover:border-earth-300',
        variant === 'ghost' && 'text-earth-600 hover:bg-earth-100 hover:text-earth-800',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
