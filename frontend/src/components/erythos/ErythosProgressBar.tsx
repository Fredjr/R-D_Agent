'use client';

import React from 'react';

interface ErythosProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'red' | 'purple' | 'orange' | 'yellow' | 'green' | 'blue';
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Animate the progress bar */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantClasses = {
  red: 'bg-gradient-to-r from-red-600 to-red-700',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-700',
  orange: 'bg-gradient-to-r from-orange-400 to-orange-600',
  yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  green: 'bg-gradient-to-r from-green-500 to-green-600',
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
};

export function ErythosProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'red',
  showLabel = false,
  label,
  animated = true,
  className = '',
}: ErythosProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-gray-400">{label}</span>
          )}
          {showLabel && (
            <span className="text-xs text-gray-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div 
        className={`w-full bg-[#2C2C2E] rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full ${
            animated ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular progress variant
interface ErythosCircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: 'red' | 'purple' | 'orange' | 'yellow' | 'green' | 'blue';
  /** Show percentage in center */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const circularVariantColors = {
  red: '#DC2626',
  purple: '#8B5CF6',
  orange: '#FB923C',
  yellow: '#FBBF24',
  green: '#10B981',
  blue: '#3B82F6',
};

export function ErythosCircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  variant = 'red',
  showLabel = true,
  className = '',
}: ErythosCircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2C2C2E"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circularVariantColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-medium text-white">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export default ErythosProgressBar;

