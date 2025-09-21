'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  FolderIcon,
  BeakerIcon,
  UsersIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
}

interface SpotifySidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SpotifySidebar: React.FC<SpotifySidebarProps> = ({
  className,
  collapsed = false,
  onToggleCollapse
}) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['projects']));

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const mainNavItems: SidebarItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: HomeIcon
    },
    {
      id: 'search',
      label: 'Search',
      href: '/search',
      icon: MagnifyingGlassIcon
    },
    {
      id: 'dashboard',
      label: 'Your Projects',
      href: '/dashboard',
      icon: FolderIcon
    }
  ];

  const libraryItems: SidebarItem[] = [
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderIcon,
      children: [
        { id: 'recent-projects', label: 'Recently Viewed', href: '/dashboard?filter=recent', icon: ClockIcon },
        { id: 'favorite-projects', label: 'Favorites', href: '/dashboard?filter=favorites', icon: HeartIcon }
      ]
    },
    {
      id: 'collections',
      label: 'Collections',
      href: '/collections',
      icon: BeakerIcon,
      badge: '12'
    },
    {
      id: 'collaborations',
      label: 'Shared with me',
      href: '/shared',
      icon: UsersIcon,
      badge: '3'
    }
  ];

  const renderNavItem = (item: SidebarItem, level = 0) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    const itemContent = (
      <div
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
          level === 0 ? "mx-2" : "mx-4 ml-6",
          isActive 
            ? "bg-[var(--spotify-light-gray)] text-[var(--spotify-white)]" 
            : "text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]",
          collapsed && level === 0 && "justify-center px-2"
        )}
      >
        <div className="flex items-center">
          <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--spotify-green)] text-[var(--spotify-black)] rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>
        {!collapsed && hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded(item.id);
            }}
            className="p-1 hover:bg-[var(--spotify-light-gray)] rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );

    return (
      <div key={item.id}>
        {item.href ? (
          <Link href={item.href} className="block">
            {itemContent}
          </Link>
        ) : item.onClick ? (
          <button onClick={item.onClick} className="w-full text-left">
            {itemContent}
          </button>
        ) : (
          <div className="cursor-pointer" onClick={() => hasChildren && toggleExpanded(item.id)}>
            {itemContent}
          </div>
        )}
        
        {!collapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-[var(--spotify-black)] border-r border-[var(--spotify-border-gray)] transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex items-center p-4 border-b border-[var(--spotify-border-gray)]">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[var(--spotify-green)] rounded-full flex items-center justify-center mr-3">
              <BeakerIcon className="h-5 w-5 text-[var(--spotify-black)]" />
            </div>
            <span className="text-[var(--spotify-white)] font-bold text-lg">R&D Agent</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-[var(--spotify-green)] rounded-full flex items-center justify-center mx-auto">
            <BeakerIcon className="h-5 w-5 text-[var(--spotify-black)]" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1">
          {mainNavItems.map(item => renderNavItem(item))}
        </nav>

        {/* Library Section */}
        <div className="mt-8">
          {!collapsed && (
            <div className="px-6 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--spotify-muted-text)] uppercase tracking-wider">
                  Your Library
                </h3>
                <button className="p-1 hover:bg-[var(--spotify-medium-gray)] rounded">
                  <PlusIcon className="h-4 w-4 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]" />
                </button>
              </div>
            </div>
          )}
          <nav className="space-y-1">
            {libraryItems.map(item => renderNavItem(item))}
          </nav>
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-[var(--spotify-border-gray)] p-2">
        <Link href="/settings" className="block">
          <div className={cn(
            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]",
            collapsed && "justify-center"
          )}>
            <Cog6ToothIcon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SpotifySidebar;
