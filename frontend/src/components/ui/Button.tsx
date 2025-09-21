'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-palantir",
  {
    variants: {
      variant: {
        // Primary - Palantir blue
        default: "bg-[var(--palantir-accent-blue)] text-white hover:bg-[var(--palantir-primary-700)] focus-visible:ring-[var(--palantir-accent-blue)] shadow-palantir-sm hover:shadow-palantir-md",

        // Destructive - Palantir red
        destructive: "bg-[var(--palantir-error)] text-white hover:bg-red-700 focus-visible:ring-[var(--palantir-error)] shadow-palantir-sm hover:shadow-palantir-md",

        // Outline - Palantir style borders
        outline: "border border-[var(--palantir-primary-300)] bg-white text-[var(--palantir-primary-800)] hover:bg-[var(--palantir-primary-50)] hover:border-[var(--palantir-primary-400)] focus-visible:ring-[var(--palantir-accent-blue)]",

        // Secondary - Palantir gray
        secondary: "bg-[var(--palantir-gray-600)] text-white hover:bg-[var(--palantir-gray-700)] focus-visible:ring-[var(--palantir-gray-500)] shadow-palantir-sm hover:shadow-palantir-md",

        // Ghost - Subtle hover
        ghost: "text-[var(--palantir-primary-700)] hover:bg-[var(--palantir-primary-100)] focus-visible:ring-[var(--palantir-accent-blue)]",

        // Link - Palantir accent
        link: "text-[var(--palantir-accent-blue)] underline-offset-4 hover:underline focus-visible:ring-[var(--palantir-accent-blue)]",

        // Success - Palantir green
        success: "bg-[var(--palantir-success)] text-white hover:bg-green-700 focus-visible:ring-[var(--palantir-success)] shadow-palantir-sm hover:shadow-palantir-md",

        // Warning - Palantir orange
        warning: "bg-[var(--palantir-warning)] text-white hover:bg-orange-700 focus-visible:ring-[var(--palantir-warning)] shadow-palantir-sm hover:shadow-palantir-md",

        // Palantir specific variants
        palantir: "bg-[var(--palantir-primary-800)] text-white hover:bg-[var(--palantir-primary-700)] focus-visible:ring-[var(--palantir-accent-blue)] shadow-palantir-md hover:shadow-palantir-lg",

        palantirOutline: "border-2 border-[var(--palantir-primary-600)] bg-transparent text-[var(--palantir-primary-800)] hover:bg-[var(--palantir-primary-600)] hover:text-white focus-visible:ring-[var(--palantir-accent-blue)]",

        // Spotify specific variants
        spotifyPrimary: "bg-[var(--spotify-green)] text-[var(--spotify-black)] hover:bg-[var(--spotify-green-hover)] focus-visible:ring-[var(--spotify-green)] font-bold uppercase tracking-wider transform hover:scale-105 transition-all duration-150",

        spotifySecondary: "bg-transparent text-[var(--spotify-white)] border border-[var(--spotify-light-text)] hover:border-[var(--spotify-white)] hover:bg-[var(--spotify-white)] hover:text-[var(--spotify-black)] transition-all duration-150",

        spotifyGhost: "bg-transparent text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-light-gray)] transition-all duration-150",

        spotifyDark: "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] transition-all duration-200",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[var(--palantir-radius-md)]",
        default: "h-10 px-4 py-2 rounded-[var(--palantir-radius-lg)]",
        lg: "h-12 px-6 py-3 text-lg rounded-[var(--palantir-radius-xl)]",
        icon: "h-10 w-10 rounded-[var(--palantir-radius-lg)]",
        iconSm: "h-8 w-8 rounded-[var(--palantir-radius-md)]",
        iconLg: "h-12 w-12 rounded-[var(--palantir-radius-xl)]",

        // Spotify-style fully rounded buttons
        spotifySm: "h-8 px-4 text-sm rounded-full",
        spotifyDefault: "h-10 px-6 py-2 rounded-full",
        spotifyLg: "h-12 px-8 py-3 text-lg rounded-full",
        spotifyIcon: "h-10 w-10 rounded-full",
        spotifyIconSm: "h-8 w-8 rounded-full",
        spotifyIconLg: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        )}
        {loading ? loadingText || 'Loading...' : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
