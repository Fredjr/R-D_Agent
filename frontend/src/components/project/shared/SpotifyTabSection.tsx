'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SpotifyTabSectionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SpotifyTabSection - Container for tab content sections
 * Provides consistent spacing and layout
 */
export function SpotifyTabSection({
  children,
  className
}: SpotifyTabSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

interface SpotifyTabSectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode | string;
}

/**
 * SpotifyTabSectionHeader - Header for sections within tabs
 */
export function SpotifyTabSectionHeader({
  title,
  description,
  action,
  icon
}: SpotifyTabSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3 flex-1">
        {icon && (
          <div className="flex-shrink-0">
            {typeof icon === 'string' ? (
              <span className="text-xl">{icon}</span>
            ) : (
              <div className="w-6 h-6 text-[var(--spotify-green)]">
                {icon}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[var(--spotify-white)] mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-[var(--spotify-light-text)]">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="ml-4 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

interface SpotifyTabGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * SpotifyTabGrid - Responsive grid layout for tab content
 */
export function SpotifyTabGrid({
  children,
  columns = 3,
  gap = 'md',
  className
}: SpotifyTabGridProps) {
  const columnStyles = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  };

  const gapStyles = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6"
  };

  return (
    <div className={cn(
      "grid",
      columnStyles[columns],
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
}

interface SpotifyTabListProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * SpotifyTabList - Vertical list layout for tab content
 */
export function SpotifyTabList({
  children,
  gap = 'md',
  className
}: SpotifyTabListProps) {
  const gapStyles = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6"
  };

  return (
    <div className={cn(gapStyles[gap], className)}>
      {children}
    </div>
  );
}

interface SpotifyTabDividerProps {
  label?: string;
  className?: string;
}

/**
 * SpotifyTabDivider - Visual divider between sections
 */
export function SpotifyTabDivider({
  label,
  className
}: SpotifyTabDividerProps) {
  if (label) {
    return (
      <div className={cn("relative flex items-center py-4", className)}>
        <div className="flex-grow border-t border-[var(--spotify-border-gray)]"></div>
        <span className="flex-shrink mx-4 text-sm font-medium text-[var(--spotify-light-text)]">
          {label}
        </span>
        <div className="flex-grow border-t border-[var(--spotify-border-gray)]"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border-t border-[var(--spotify-border-gray)] my-6",
      className
    )} />
  );
}

interface SpotifyTabSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  onSubmit?: () => void;
  className?: string;
}

/**
 * SpotifyTabSearchBar - Search input for filtering tab content
 */
export function SpotifyTabSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  icon,
  onSubmit,
  className
}: SpotifyTabSearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--spotify-light-text)]">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full py-3 rounded-lg",
          "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)]",
          "border-2 border-transparent",
          "focus:border-[var(--spotify-green)] focus:outline-none",
          "placeholder:text-[var(--spotify-light-text)]",
          "transition-all duration-200",
          icon ? "pl-12 pr-4" : "px-4"
        )}
      />
    </form>
  );
}

interface SpotifyTabBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * SpotifyTabBadge - Badge for labels, counts, status indicators
 */
export function SpotifyTabBadge({
  children,
  variant = 'default',
  size = 'md',
  className
}: SpotifyTabBadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm"
  };

  const variantStyles = {
    default: "bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] border border-[var(--spotify-border-gray)]",
    success: "bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] border border-[var(--spotify-green)]/30",
    warning: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    error: "bg-red-500/20 text-red-400 border border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      sizeStyles[size],
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}

interface SpotifyTabLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SpotifyTabLoading - Loading spinner for tab content
 */
export function SpotifyTabLoading({
  message = "Loading...",
  size = 'md'
}: SpotifyTabLoadingProps) {
  const sizeStyles = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-2",
    lg: "h-16 w-16 border-4"
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={cn(
        "animate-spin rounded-full border-[var(--spotify-green)] border-t-transparent",
        sizeStyles[size]
      )} />
      <p className="mt-4 text-[var(--spotify-light-text)]">{message}</p>
    </div>
  );
}

