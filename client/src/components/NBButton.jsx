/**
 * @fileoverview Neo-Brutalist button component
 */

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-nb text-sm font-medium transition-all duration-200 ease-out border-2 border-nb-ink shadow-nb hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nb-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-nb-accent text-nb-ink hover:bg-nb-accent/90',
        secondary: 'bg-nb-accent-2 text-nb-ink hover:bg-nb-accent-2/90',
        ghost: 'bg-transparent text-nb-ink hover:bg-nb-ink hover:text-nb-card shadow-none border-none',
        destructive: 'bg-nb-error text-white hover:bg-nb-error/90'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-12 rounded-nb px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
);

/**
 * Neo-Brutalist button component
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'destructive'} [props.variant='primary'] - Button style variant
 * @param {'default'|'sm'|'lg'|'icon'} [props.size='default'] - Button size
 * @param {React.ReactNode} [props.icon] - Icon element
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const NBButton = forwardRef(({ 
  className, 
  variant, 
  size, 
  icon,
  children,
  ...props 
}, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
});

NBButton.displayName = 'NBButton';

export { NBButton, buttonVariants };
