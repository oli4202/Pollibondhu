import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-polli-500 focus:ring-offset-2',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variant === 'default'
          ? 'bg-polli-700 text-white shadow-sm hover:bg-polli-800 hover:-translate-y-0.5 hover:shadow-md'
          : 'border border-earth-200 bg-white/90 text-earth-700 hover:border-polli-200 hover:bg-polli-50',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
