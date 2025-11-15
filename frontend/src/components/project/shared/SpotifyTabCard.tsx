'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SpotifyTabCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'highlight';
  gradient?: string; // e.g., 'from-blue-500/10 to-purple-500/10'
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * SpotifyTabCard - Consistent card component for all project tabs
 * Uses Spotify dark theme colors and styling
 */
export function SpotifyTabCard({
  children,
  className,
  variant = 'default',
  gradient,
  onClick,
  hoverable = false
}: SpotifyTabCardProps) {
  const baseStyles = cn(
    "rounded-lg p-6 transition-all duration-200",
    "border border-[var(--spotify-border-gray)]"
  );

  const variantStyles = {
    default: "bg-[var(--spotify-dark-gray)]",
    gradient: gradient 
      ? `bg-gradient-to-br ${gradient}` 
      : "bg-gradient-to-br from-purple-500/10 to-blue-500/10",
    highlight: "bg-[var(--spotify-dark-gray)] border-[var(--spotify-green)]"
  };

  const interactiveStyles = onClick || hoverable
    ? "cursor-pointer hover:bg-[var(--spotify-medium-gray)] hover:border-[var(--spotify-green)]/50 hover:scale-[1.01]"
    : "";

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface SpotifyTabCardHeaderProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  stat?: {
    value: string | number;
    label: string;
  };
}

/**
 * SpotifyTabCardHeader - Consistent header for tab cards
 */
export function SpotifyTabCardHeader({
  icon,
  title,
  description,
  action,
  stat
}: SpotifyTabCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3 flex-1">
        {icon && (
          <div className="w-12 h-12 bg-[var(--spotify-green)]/20 rounded-full flex items-center justify-center flex-shrink-0">
            {typeof icon === 'string' ? (
              <span className="text-2xl">{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--spotify-white)] mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-[var(--spotify-light-text)]">
              {description}
            </p>
          )}
        </div>
      </div>
      {stat && (
        <div className="text-right ml-4">
          <div className="text-3xl font-bold text-[var(--spotify-green)]">
            {stat.value}
          </div>
          <div className="text-sm text-[var(--spotify-light-text)]">
            {stat.label}
          </div>
        </div>
      )}
      {action && (
        <div className="ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

interface SpotifyTabCardContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SpotifyTabCardContent - Content area for tab cards
 */
export function SpotifyTabCardContent({
  children,
  className
}: SpotifyTabCardContentProps) {
  return (
    <div className={cn("text-[var(--spotify-white)]", className)}>
      {children}
    </div>
  );
}

interface SpotifyTabStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string; // e.g., 'blue', 'green', 'purple', 'orange'
  onClick?: () => void;
}

/**
 * SpotifyTabStatCard - Small stat card for displaying metrics
 */
export function SpotifyTabStatCard({
  icon,
  label,
  value,
  subtext,
  color = 'green',
  onClick
}: SpotifyTabStatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-[var(--spotify-green)]',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    cyan: 'text-cyan-500'
  };

  const iconColor = colorMap[color] || colorMap.green;

  return (
    <SpotifyTabCard
      hoverable={!!onClick}
      onClick={onClick}
      className="p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-5 h-5", iconColor)}>
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--spotify-light-text)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--spotify-white)]">
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-[var(--spotify-light-text)] mt-1">
          {subtext}
        </p>
      )}
    </SpotifyTabCard>
  );
}

interface SpotifyTabEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

/**
 * SpotifyTabEmptyState - Consistent empty state for tabs
 */
export function SpotifyTabEmptyState({
  icon,
  title,
  description,
  action
}: SpotifyTabEmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-[var(--spotify-dark-gray)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--spotify-border-gray)]">
        <div className="w-8 h-8 text-[var(--spotify-light-text)]">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--spotify-light-text)] mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "px-6 py-3 rounded-lg transition-all",
            "bg-[var(--spotify-green)] text-[var(--spotify-black)]",
            "hover:scale-105 hover:bg-[var(--spotify-green)]/90",
            "font-semibold inline-flex items-center gap-2"
          )}
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
}

