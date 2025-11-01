'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  description?: string;
}

interface SpotifyProjectTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function SpotifyProjectTabs({
  tabs,
  activeTab,
  onTabChange,
  className
}: SpotifyProjectTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Tabs - Horizontal Scroll */}
      <div className="block sm:hidden">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-[var(--spotify-border-gray)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              data-tab-id={tab.id}
              data-active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span className="text-base">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id
                      ? "bg-[var(--spotify-green)] text-black"
                      : "bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <div className="flex space-x-8 border-b border-[var(--spotify-border-gray)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              data-tab-id={tab.id}
              data-active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-3 px-1 py-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  activeTab === tab.id
                    ? "bg-[var(--spotify-green)] text-black"
                    : "bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)]"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpotifyProjectTabs;
