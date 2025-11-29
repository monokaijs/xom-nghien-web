import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, size = 'md', variant = 'default', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs pr-7',
      md: 'px-3 py-2 text-sm pr-9',
      lg: 'px-4 py-3 text-base pr-10',
    };

    const variantClasses = {
      default: 'bg-white/10 border-white/20 hover:bg-white/15',
      outline: 'bg-transparent border-white/30 hover:border-white/50',
    };

    return (
      <select
        ref={ref}
        className={cn(
          'border rounded-lg text-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'appearance-none cursor-pointer',
          '[&>option]:bg-bg-panel [&>option]:text-white',
          '[&>option:checked]:bg-accent-primary [&>option:checked]:text-white',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '12px 12px',
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;

