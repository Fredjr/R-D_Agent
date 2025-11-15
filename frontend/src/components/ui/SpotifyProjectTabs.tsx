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
                "flex-shrink-0 px-6 py-4 text-base font-medium border-b-4 transition-colors whitespace-nowrap min-h-[56px]",
                activeTab === tab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              <div className="flex items-center space-x-3">
                {tab.icon && <span className="text-2xl">{tab.icon}</span>}
                <span className="text-base">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
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
                "flex items-center space-x-4 px-2 py-5 text-base font-medium border-b-4 transition-colors min-h-[60px] lg:text-lg xl:text-xl",
                activeTab === tab.id
                  ? "text-[var(--spotify-white)] border-[var(--spotify-green)]"
                  : "text-[var(--spotify-light-text)] border-transparent hover:text-[var(--spotify-white)]"
              )}
            >
              {tab.icon && <span className="text-3xl lg:text-4xl">{tab.icon}</span>}
              <span className="lg:text-lg xl:text-xl">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium lg:text-sm",
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
