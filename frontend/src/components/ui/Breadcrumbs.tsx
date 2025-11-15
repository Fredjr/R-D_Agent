'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {/* Home Icon */}
      <button
        onClick={() => router.push('/home')}
        className="text-[var(--spotify-light-text)] hover:text-white transition-colors"
        aria-label="Home"
      >
        <HomeIcon className="w-4 h-4" />
      </button>

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.href}>
          <ChevronRightIcon className="w-4 h-4 text-[var(--spotify-light-text)]" />
          {index === breadcrumbItems.length - 1 ? (
            // Current page - not clickable
            <span className="text-white font-medium flex items-center gap-1">
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </span>
          ) : (
            // Previous pages - clickable
            <button
              onClick={() => router.push(item.href)}
              className="text-[var(--spotify-light-text)] hover:text-white transition-colors flex items-center gap-1"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Don't show breadcrumbs on home page
  if (pathname === '/home' || pathname === '/') {
    return [];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Map of route segments to labels
  const labelMap: Record<string, string> = {
    search: 'Search',
    collections: 'Collections',
    dashboard: 'Projects',
    project: 'Project',
    explore: 'Explore',
    network: 'Network',
    settings: 'Settings',
    auth: 'Authentication',
    signin: 'Sign In',
    signup: 'Sign Up',
    report: 'Report'
  };

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip dynamic segments (IDs)
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // UUID - skip or use generic label
      return;
    }

    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      href: currentPath
    });
  });

  return breadcrumbs;
}

export default Breadcrumbs;

