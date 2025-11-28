'use client';

import React from 'react';

interface ErythosStatusIndicatorProps {
  /** Status type */
  status: 'active' | 'pending' | 'success' | 'warning' | 'error' | 'inactive';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show pulsing animation for active states */
  pulse?: boolean;
  /** Label text */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const statusColors = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  error: 'bg-red-500',
  inactive: 'bg-gray-500',
};

const statusPulseColors = {
  active: 'bg-green-400',
  pending: 'bg-yellow-400',
  success: 'bg-green-400',
  warning: 'bg-orange-400',
  error: 'bg-red-400',
  inactive: 'bg-gray-400',
};

const labelSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function ErythosStatusIndicator({
  status,
  size = 'md',
  pulse = true,
  label,
  className = '',
}: ErythosStatusIndicatorProps) {
  const shouldPulse = pulse && (status === 'active' || status === 'pending');
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex">
        {shouldPulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${statusPulseColors[status]} opacity-75 animate-ping`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${sizeClasses[size]} ${statusColors[status]}`}
        />
      </span>
      {label && (
        <span className={`text-gray-300 ${labelSizeClasses[size]}`}>
          {label}
        </span>
      )}
    </div>
  );
}

// Badge variant with text
interface ErythosStatusBadgeProps {
  /** Status type */
  status: 'active' | 'pending' | 'success' | 'warning' | 'error' | 'inactive' | 'new';
  /** Badge text */
  text?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const badgeStatusClasses = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  new: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const badgeStatusText = {
  active: 'Active',
  pending: 'Pending',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  inactive: 'Inactive',
  new: 'New',
};

const badgeSizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function ErythosStatusBadge({
  status,
  text,
  size = 'md',
  className = '',
}: ErythosStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${badgeStatusClasses[status]} ${badgeSizeClasses[size]} ${className}`}
    >
      {text || badgeStatusText[status]}
    </span>
  );
}

// Count badge (for notifications, etc.)
interface ErythosCountBadgeProps {
  /** Count value */
  count: number;
  /** Maximum count to display (shows "99+" if exceeded) */
  max?: number;
  /** Color variant */
  variant?: 'red' | 'purple' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const countVariantClasses = {
  red: 'bg-red-600 text-white',
  purple: 'bg-purple-600 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-black',
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  gray: 'bg-gray-600 text-white',
};

const countSizeClasses = {
  sm: 'min-w-4 h-4 text-[10px] px-1',
  md: 'min-w-5 h-5 text-xs px-1.5',
  lg: 'min-w-6 h-6 text-sm px-2',
};

export function ErythosCountBadge({
  count,
  max = 99,
  variant = 'red',
  size = 'md',
  className = '',
}: ErythosCountBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${countVariantClasses[variant]} ${countSizeClasses[size]} ${className}`}
    >
      {displayCount}
    </span>
  );
}

export default ErythosStatusIndicator;

