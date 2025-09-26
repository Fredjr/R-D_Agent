'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ChartBarIcon,
  MusicalNoteIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  FolderIcon as FolderIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  activeIcon: React.ComponentType<any>;
  label: string;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Home',
    href: '/home',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    label: 'Home'
  },
  {
    name: 'Search',
    href: '/search',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
    label: 'Search'
  },
  {
    name: 'Discover',
    href: '/discover',
    icon: MusicalNoteIcon,
    activeIcon: MusicalNoteIconSolid,
    label: 'Discover'
  },
  {
    name: 'Collections',
    href: '/collections',
    icon: FolderIcon,
    activeIcon: FolderIconSolid,
    label: 'Collections'
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
    label: 'Dashboard'
  }
];

export function SpotifyBottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--spotify-black)] border-t border-[var(--spotify-border-gray)] safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const IconComponent = active ? item.activeIcon : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors duration-200 min-w-0",
                  active 
                    ? "text-[var(--spotify-white)]" 
                    : "text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]"
                )}
              >
                <IconComponent className="w-6 h-6 mb-1 flex-shrink-0" />
                <span className={cn(
                  "text-xs font-medium truncate w-full text-center",
                  active ? "text-[var(--spotify-white)]" : "text-[var(--spotify-light-text)]"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Bottom padding to prevent content from being hidden behind navigation */}
      <div className="h-16 flex-shrink-0" />
    </>
  );
}

export default SpotifyBottomNavigation;
