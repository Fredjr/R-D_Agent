'use client';

import React, { ReactNode } from 'react';

/**
 * ErythosTabs - Tab component with badges
 * Used for navigation within pages (e.g., Discover tabs, Project Workspace tabs)
 */

interface Tab {
  id: string;
  label: string;
  badge?: number | string;
  icon?: ReactNode;
}

interface ErythosTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: {
    container: 'bg-gray-900/50 rounded-lg p-1 border border-gray-700/50',
    tab: 'rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
    active: 'bg-red-600 text-white shadow-lg',
    inactive: 'text-gray-400 hover:text-white hover:bg-gray-800/50',
  },
  pills: {
    container: 'flex gap-2',
    tab: 'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border',
    active: 'bg-red-600 text-white border-red-600',
    inactive: 'text-gray-400 hover:text-white bg-gray-800/50 border-gray-700/50 hover:border-gray-600',
  },
  underline: {
    container: 'border-b border-gray-700/50',
    tab: 'px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
    active: 'text-red-500 border-red-500',
    inactive: 'text-gray-400 hover:text-white border-transparent hover:border-gray-600',
  },
};

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export function ErythosTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className = '',
}: ErythosTabsProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${styles.tab} ${sizeStyles[size]} ${
              activeTab === tab.id ? styles.active : styles.inactive
            } flex items-center gap-2`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== 0 && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab content wrapper
interface TabContentProps {
  children: ReactNode;
  tabId: string;
  activeTab: string;
  className?: string;
}

export function ErythosTabContent({
  children,
  tabId,
  activeTab,
  className = '',
}: TabContentProps) {
  if (tabId !== activeTab) return null;
  
  return (
    <div className={`animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}

// Vertical tabs for sidebar navigation
interface VerticalTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ErythosVerticalTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: VerticalTabsProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-red-600/20 text-red-400 border-l-2 border-red-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span className="flex-1 font-medium">{tab.label}</span>
          {tab.badge !== undefined && tab.badge !== 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default ErythosTabs;

