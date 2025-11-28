'use client';

import React, { ReactNode } from 'react';

/**
 * ErythosCard - Base card component with gradient backgrounds
 * Used throughout the Erythos design system for consistent styling
 */

export type CardVariant = 'default' | 'gradient-red' | 'gradient-purple' | 'gradient-orange' | 'gradient-yellow' | 'dark';

interface ErythosCardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-gray-900/50 border-gray-700/50',
  'gradient-red': 'bg-gradient-to-br from-red-900/30 to-red-950/20 border-red-700/30',
  'gradient-purple': 'bg-gradient-to-br from-purple-900/30 to-purple-950/20 border-purple-700/30',
  'gradient-orange': 'bg-gradient-to-br from-orange-900/30 to-orange-950/20 border-orange-700/30',
  'gradient-yellow': 'bg-gradient-to-br from-yellow-900/30 to-yellow-950/20 border-yellow-700/30',
  dark: 'bg-gray-950/70 border-gray-800/50',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function ErythosCard({
  children,
  variant = 'default',
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
}: ErythosCardProps) {
  const baseStyles = 'rounded-xl border backdrop-blur-sm transition-all duration-200';
  const hoverStyles = hoverable ? 'hover:border-gray-600/50 hover:shadow-lg hover:shadow-black/20 cursor-pointer' : '';
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Specialized variants for common use cases

interface WorkflowCardProps {
  icon: ReactNode | string;
  title: string;
  description: string;
  stats?: { label: string; value: string | number }[];
  onClick?: () => void;
  variant?: 'red' | 'purple' | 'orange' | 'blue' | 'yellow';
  gradient?: 'red' | 'purple' | 'orange' | 'blue' | 'yellow';
}

const workflowVariants: Record<string, CardVariant> = {
  red: 'gradient-red',
  purple: 'gradient-purple',
  orange: 'gradient-orange',
  blue: 'default',
  yellow: 'gradient-yellow',
};

export function ErythosWorkflowCard({
  icon,
  title,
  description,
  stats = [],
  onClick,
  variant,
  gradient,
}: WorkflowCardProps) {
  // Support both 'variant' and 'gradient' props for flexibility
  const colorVariant = gradient || variant || 'red';

  // Render icon - support both string emojis and React nodes
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <span className="text-2xl">{icon}</span>;
    }
    return icon;
  };

  return (
    <ErythosCard
      variant={workflowVariants[colorVariant]}
      hoverable
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
          {renderIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400 mb-3">{description}</p>
          {stats.length > 0 && (
            <div className="flex gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErythosCard>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function ErythosStatsCard({ title, value, change, trend = 'neutral', icon }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  return (
    <ErythosCard variant="dark" padding="md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change && (
        <div className={`text-sm mt-1 ${trendColors[trend]}`}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {change}
        </div>
      )}
    </ErythosCard>
  );
}

export default ErythosCard;

