'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        'bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md focus-visible:ring-brand-500',
      secondary:
        'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500',
      danger:
        'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500',
      ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500',
      outline:
        'border-2 border-brand-500 text-brand-600 bg-transparent hover:bg-brand-50 focus-visible:ring-brand-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
