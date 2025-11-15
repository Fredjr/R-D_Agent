'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SpotifyTabButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * SpotifyTabButton - Consistent button component for all project tabs
 * Uses Spotify dark theme colors and styling
 */
export function SpotifyTabButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  fullWidth = false,
  className
}: SpotifyTabButtonProps) {
  const baseStyles = cn(
    "rounded-lg font-semibold transition-all duration-200",
    "inline-flex items-center justify-center gap-2",
    "focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]/50",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  );

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const variantStyles = {
    primary: cn(
      "bg-[var(--spotify-green)] text-[var(--spotify-black)]",
      "hover:scale-105 hover:bg-[var(--spotify-green)]/90",
      "active:scale-95"
    ),
    secondary: cn(
      "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)]",
      "border-2 border-[var(--spotify-border-gray)]",
      "hover:border-[var(--spotify-green)] hover:bg-[var(--spotify-medium-gray)]",
      "active:scale-95"
    ),
    ghost: cn(
      "bg-transparent text-[var(--spotify-white)]",
      "hover:bg-[var(--spotify-dark-gray)]",
      "active:bg-[var(--spotify-medium-gray)]"
    ),
    danger: cn(
      "bg-red-600 text-white",
      "hover:scale-105 hover:bg-red-700",
      "active:scale-95"
    )
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        widthStyles,
        className
      )}
    >
      {icon && iconPosition === 'left' && (
        <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

interface SpotifyTabIconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

/**
 * SpotifyTabIconButton - Icon-only button for actions
 */
export function SpotifyTabIconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className,
  title,
  'aria-label': ariaLabel
}: SpotifyTabIconButtonProps) {
  const baseStyles = cn(
    "rounded-lg transition-all duration-200",
    "inline-flex items-center justify-center",
    "focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]/50",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  );

  const sizeStyles = {
    sm: "w-8 h-8 p-1.5",
    md: "w-10 h-10 p-2",
    lg: "w-12 h-12 p-3"
  };

  const variantStyles = {
    primary: cn(
      "bg-[var(--spotify-green)] text-[var(--spotify-black)]",
      "hover:scale-110 hover:bg-[var(--spotify-green)]/90"
    ),
    secondary: cn(
      "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)]",
      "border border-[var(--spotify-border-gray)]",
      "hover:border-[var(--spotify-green)] hover:bg-[var(--spotify-medium-gray)]"
    ),
    ghost: cn(
      "bg-transparent text-[var(--spotify-light-text)]",
      "hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-dark-gray)]"
    ),
    danger: cn(
      "bg-transparent text-red-500",
      "hover:bg-red-500/10"
    )
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {icon}
    </button>
  );
}

interface SpotifyTabQuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  gradient?: string; // e.g., 'from-blue-500 to-cyan-600'
  disabled?: boolean;
}

/**
 * SpotifyTabQuickAction - Quick action card button
 */
export function SpotifyTabQuickAction({
  icon,
  label,
  description,
  onClick,
  gradient = 'from-blue-500 to-cyan-600',
  disabled = false
}: SpotifyTabQuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative p-4 rounded-lg text-left w-full",
        "bg-gradient-to-br", gradient,
        "hover:scale-105 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-white/50",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
          <div className="w-5 h-5 text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm sm:text-base mb-0.5">
            {label}
          </h4>
          <p className="text-white/80 text-xs sm:text-sm">
            {description}
          </p>
        </div>
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
    </button>
  );
}

interface SpotifyTabToggleGroupProps {
  options: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

/**
 * SpotifyTabToggleGroup - Toggle button group for view modes, filters, etc.
 */
export function SpotifyTabToggleGroup({
  options,
  value,
  onChange,
  size = 'md'
}: SpotifyTabToggleGroupProps) {
  const sizeStyles = {
    sm: "p-0.5 gap-0.5",
    md: "p-1 gap-1"
  };

  const buttonSizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <div className={cn(
      "flex items-center bg-[var(--spotify-dark-gray)] rounded-lg border border-[var(--spotify-border-gray)]",
      sizeStyles[size]
    )}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-md font-medium transition-all inline-flex items-center gap-1.5",
            buttonSizeStyles[size],
            value === option.id
              ? "bg-[var(--spotify-green)] text-[var(--spotify-black)]"
              : "text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]"
          )}
        >
          {option.icon && (
            <span className="w-4 h-4">{option.icon}</span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

