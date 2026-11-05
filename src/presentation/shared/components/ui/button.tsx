import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const baseButtonClasses = [
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-bold',
  'transition-colors focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[#140c09]',
  'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

const buttonVariants = cva(baseButtonClasses, {
  variants: {
    variant: {
      default: 'bg-[#d78c47] text-[#180e08] hover:bg-[#ed9847]',
      outline: [
        'border border-[#d78c47] bg-transparent text-[#ed9847]',
        'hover:bg-[#d78c47] hover:text-[#180e08]',
      ].join(' '),
      ghost: 'bg-transparent text-[#f5eee7] hover:bg-[#301b12]',
    },
    size: {
      default: 'min-h-10 px-5 py-2.5 text-sm',
      sm: 'min-h-8 px-3 py-2 text-xs',
      lg: 'min-h-12 px-7 py-3 text-base',
      icon: 'h-10 w-10 p-2',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
