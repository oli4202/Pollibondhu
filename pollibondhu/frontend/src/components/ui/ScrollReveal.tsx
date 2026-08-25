import { ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/utils/cn';

interface ScrollRevealProps {
  children: ReactNode;
  /** Animation direction: fade-up (default), fade-left, fade-right, fade-in, scale-in */
  variant?: 'fade-up' | 'fade-left' | 'fade-right' | 'fade-in' | 'scale-in';
  /** Delay in ms before animation starts (for stagger) */
  delay?: number;
  /** Duration in ms */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<string, string> = {
  'fade-up': 'translate-y-8 opacity-0',
  'fade-left': '-translate-x-12 opacity-0',
  'fade-right': 'translate-x-12 opacity-0',
  'fade-in': 'opacity-0',
  'scale-in': 'scale-90 opacity-0',
};

const visibleStyles = 'translate-x-0 translate-y-0 scale-100 opacity-100';

export default function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  className,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out will-change-transform will-change-opacity',
        isVisible ? visibleStyles : variantStyles[variant],
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
}
