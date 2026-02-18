import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white hover:from-[#C5A028] hover:to-[#B5952F] shadow-lg shadow-[#D4AF37]/20 border-0 hover:shadow-xl hover:shadow-[#D4AF37]/30',
        secondary:
          'bg-[#FAF9F6] text-[#2C2825] border border-[#E5E0D8] hover:bg-white hover:border-[#D4AF37]/30 shadow-sm hover:shadow-md',
        outline:
          'border border-[#E5E0D8] bg-transparent hover:bg-[#FAF9F6] text-[#5C5855] hover:text-[#2C2825] hover:border-[#D4AF37]/50 shadow-sm hover:shadow-md',
        ghost:
          'text-[#8A847C] hover:bg-[#FAF9F6] hover:text-[#D4AF37]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md focus-visible:ring-red-500',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md focus-visible:ring-emerald-500',
        link:
          'text-[#D4AF37] underline-offset-4 hover:underline hover:text-[#B5952F] p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
