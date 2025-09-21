'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import SpotifySidebar from './SpotifySidebar';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface SpotifyLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const SpotifyLayout: React.FC<SpotifyLayoutProps> = ({
  children,
  className,
  showSidebar = true,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const sidebarCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Close mobile menu on route change or escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={cn("flex h-screen bg-[var(--spotify-black)] overflow-hidden", className)}>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)] rounded-md border border-[var(--spotify-border-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-75 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex">
            <SpotifySidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={handleSidebarToggle}
            />
          </div>

          {/* Mobile Sidebar */}
          <div
            className={cn(
              "lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <SpotifySidebar
              collapsed={false}
              className="h-full"
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Optional for additional controls */}
        <div className="hidden lg:flex items-center justify-between p-4 bg-[var(--spotify-black)] border-b border-[var(--spotify-border-gray)]">
          <div className="flex items-center space-x-4">
            {showSidebar && (
              <button
                onClick={handleSidebarToggle}
                className="p-2 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)] rounded-md transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Controls - Back/Forward buttons like Spotify */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.history.back()}
              className="p-2 bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Go back"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => window.history.forward()}
              className="p-2 bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Go forward"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[var(--spotify-black)] to-[var(--spotify-dark-gray)]">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Bottom Player Bar - Optional for future features */}
        <div className="hidden bg-[var(--spotify-dark-gray)] border-t border-[var(--spotify-border-gray)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[var(--spotify-medium-gray)] rounded-md"></div>
              <div>
                <p className="text-sm font-medium text-[var(--spotify-white)]">Current Project</p>
                <p className="text-xs text-[var(--spotify-light-text)]">Research in progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyLayout;
