'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SubTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: 'new' | 'beta';
}

interface SpotifySubTabsProps {
  subTabs: SubTab[];
  activeSubTab: string;
  onSubTabChange: (subTabId: string) => void;
  className?: string;
}

export function SpotifySubTabs({
  subTabs,
  activeSubTab,
  onSubTabChange,
  className
}: SpotifySubTabsProps) {
  return (
    <div className={cn("w-full bg-[var(--spotify-dark-gray)]/50 border-b border-[var(--spotify-border-gray)]", className)}>
      {/* Mobile Sub-Tabs - Horizontal Scroll */}
      <div className="block sm:hidden">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {subTabs.map((subTab) => (
            <button
              key={subTab.id}
              data-testid={`subtab-${subTab.id}`}
              onClick={() => onSubTabChange(subTab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeSubTab === subTab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              <div className="flex items-center space-x-2">
                {subTab.icon && <span className="text-lg">{subTab.icon}</span>}
                <span>{subTab.label}</span>
                {subTab.count !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs font-medium",
                    activeSubTab === subTab.id
                      ? "bg-[var(--spotify-green)] text-black"
                      : "bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)]"
                  )}>
                    {subTab.count}
                  </span>
                )}
                {subTab.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-[var(--spotify-green)] text-black uppercase">
                    {subTab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sub-Tabs */}
      <div className="hidden sm:block">
        <div className="flex space-x-6 px-6">
          {subTabs.map((subTab) => (
            <button
              key={subTab.id}
              data-testid={`subtab-${subTab.id}`}
              onClick={() => onSubTabChange(subTab.id)}
              className={cn(
                "flex items-center space-x-2 px-2 py-3 text-sm font-medium border-b-2 transition-colors",
                activeSubTab === subTab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              {subTab.icon && <span className="text-xl">{subTab.icon}</span>}
              <span>{subTab.label}</span>
              {subTab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  activeSubTab === subTab.id
                    ? "bg-[var(--spotify-green)] text-black"
                    : "bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)]"
                )}>
                  {subTab.count}
                </span>
              )}
              {subTab.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--spotify-green)] text-black uppercase">
                  {subTab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpotifySubTabs;

