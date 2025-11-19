'use client';

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function MobileOptimizedModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className
}: MobileOptimizedModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    full: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Modal Content */}
        <div
          className={cn(
            "relative w-full bg-[var(--spotify-dark-gray)] shadow-2xl overflow-hidden",
            // Mobile: Full screen bottom sheet
            "h-[90vh] rounded-t-2xl sm:rounded-2xl",
            // Desktop: Centered modal
            "sm:h-auto sm:max-h-[90vh]",
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[var(--spotify-dark-gray)] border-b border-[var(--spotify-border-gray)] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--spotify-white)]">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors rounded-full hover:bg-[var(--spotify-border-gray)]"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="sticky bottom-0 z-10 bg-[var(--spotify-dark-gray)] border-t border-[var(--spotify-border-gray)] px-6 py-4">
              {footer}
            </div>
          )}

          {/* Mobile: Drag indicator */}
          <div className="sm:hidden absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-[var(--spotify-border-gray)] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Bottom Sheet variant for mobile
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer
}: Omit<MobileOptimizedModalProps, 'size' | 'className'>) {
  return (
    <MobileOptimizedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="full"
      className="sm:max-w-2xl"
    >
      {children}
    </MobileOptimizedModal>
  );
}

export default MobileOptimizedModal;

