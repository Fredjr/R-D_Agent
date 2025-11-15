'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// CONTEXT
// ============================================================================

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(undefined);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('Dropdown components must be used within DropdownMenu');
  }
  return context;
};

// ============================================================================
// DROPDOWN MENU (ROOT)
// ============================================================================

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

// ============================================================================
// DROPDOWN MENU TRIGGER
// ============================================================================

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className,
}: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        // Call original onClick if it exists
        if (childProps.onClick) {
          childProps.onClick(e);
        }
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================================================
// DROPDOWN MENU CONTENT
// ============================================================================

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  align = 'start',
  sideOffset = 4,
}: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border shadow-lg',
        'bg-[var(--spotify-dark-gray)] border-[var(--spotify-medium-gray)]',
        'animate-in fade-in-0 zoom-in-95',
        alignmentClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

// ============================================================================
// DROPDOWN MENU ITEM
// ============================================================================

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors',
        'text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)] focus:bg-[var(--spotify-medium-gray)]',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// DROPDOWN MENU SEPARATOR
// ============================================================================

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div
      className={cn(
        'my-1 h-px bg-[var(--spotify-medium-gray)]',
        className
      )}
    />
  );
}

// ============================================================================
// DROPDOWN MENU LABEL
// ============================================================================

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        'px-3 py-2 text-xs font-semibold text-[var(--spotify-light-text)]',
        className
      )}
    >
      {children}
    </div>
  );
}

