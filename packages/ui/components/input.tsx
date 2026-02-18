import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-12 w-full rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] px-4 py-2 text-sm text-[#2C2825] transition-all duration-300',
            'placeholder:text-[#A8A49D]',
            'focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10 focus:bg-white',
            'disabled:cursor-not-allowed disabled:bg-[#F0EBE0] disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
