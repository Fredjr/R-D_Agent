'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  RectangleStackIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon,
  MusicalNoteIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  RectangleStackIcon as RectangleStackSolidIcon,
  UserGroupIcon as UserGroupSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  MusicalNoteIcon as MusicalNoteSolidIcon,
  FolderIcon as FolderSolidIcon
} from '@heroicons/react/24/solid';

interface SpotifyTopBarProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  title?: string;
}

export const SpotifyTopBar: React.FC<SpotifyTopBarProps> = ({
  onSearch,
  showSearch = true,
  title
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    // Check if we can go back/forward
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      router.forward();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--spotify-black)] border-b border-[var(--spotify-border-gray)]">
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            canGoBack 
              ? 'bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)] text-white' 
              : 'bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleForward}
          disabled={!canGoForward}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            canGoForward 
              ? 'bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)] text-white' 
              : 'bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        
        {title && (
          <h1 className="ml-4 text-white text-xl font-bold">
            {title}
          </h1>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="spotify-search-enhanced">
            <input
              type="text"
              placeholder="Search for projects, collections, or articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <MagnifyingGlassIcon className="search-icon" />
          </form>
        </div>
      )}

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-medium-gray)] flex items-center justify-center transition-colors">
          <BellIcon className="w-5 h-5 text-white" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--spotify-green)] flex items-center justify-center">
          <span className="text-black text-sm font-semibold">U</span>
        </div>
      </div>
    </div>
  );
};

interface SpotifyQuickNavProps {
  currentPath: string;
}

export const SpotifyQuickNav: React.FC<SpotifyQuickNavProps> = ({ currentPath }) => {
  const router = useRouter();

  const navItems = [
    {
      path: '/home',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeSolidIcon
    },
    {
      path: '/dashboard',
      label: 'Projects',
      icon: FolderIcon,
      activeIcon: FolderSolidIcon
    },
    {
      path: '/discover',
      label: 'Discover',
      icon: MusicalNoteIcon,
      activeIcon: MusicalNoteSolidIcon
    },
    {
      path: '/search',
      label: 'Search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIcon
    },
    {
      path: '/collections',
      label: 'Collections',
      icon: RectangleStackIcon,
      activeIcon: RectangleStackSolidIcon
    },
    {
      path: '/shared',
      label: 'Shared',
      icon: UserGroupIcon,
      activeIcon: UserGroupSolidIcon
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      activeIcon: Cog6ToothSolidIcon
    }
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--spotify-black)] border-b border-[var(--spotify-border-gray)]">
      {navItems.map((item) => {
        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
        const Icon = isActive ? item.activeIcon : item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-[var(--spotify-white)] text-[var(--spotify-black)]'
                : 'text-[var(--spotify-light-text)] hover:text-white hover:bg-[var(--spotify-dark-gray)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

interface SpotifyBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

export const SpotifyBreadcrumb: React.FC<SpotifyBreadcrumbProps> = ({ items }) => {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-2 px-4 py-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRightIcon className="w-4 h-4 text-[var(--spotify-light-text)]" />
          )}
          {item.href ? (
            <button
              onClick={() => router.push(item.href!)}
              className="text-[var(--spotify-light-text)] hover:text-white transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-white font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

interface SpotifyTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SpotifyTabs: React.FC<SpotifyTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="spotify-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`spotify-tab ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 px-2 py-1 bg-[var(--spotify-medium-gray)] text-xs rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Progress indicator for long operations
export const SpotifyProgress: React.FC<{
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}> = ({ progress, label, showPercentage = true }) => {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--spotify-light-text)]">{label}</span>
          {showPercentage && (
            <span className="text-sm text-[var(--spotify-light-text)]">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="spotify-progress-container">
        <div 
          className="spotify-progress-bar"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default {
  SpotifyTopBar,
  SpotifyQuickNav,
  SpotifyBreadcrumb,
  SpotifyTabs,
  SpotifyProgress
};
