'use client';

import React from 'react';
import { SpotifyBottomNavigation } from './SpotifyBottomNavigation';
import { cn } from '@/lib/utils';

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export function MobileResponsiveLayout({ 
  children, 
  className,
  showBottomNav = true 
}: MobileResponsiveLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-[var(--spotify-black)] flex flex-col",
      "w-full max-w-full overflow-x-hidden",
      className
    )}>
      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full max-w-full",
        showBottomNav ? "pb-16" : "pb-0"
      )}>
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      {showBottomNav && <SpotifyBottomNavigation />}
    </div>
  );
}

export default MobileResponsiveLayout;
