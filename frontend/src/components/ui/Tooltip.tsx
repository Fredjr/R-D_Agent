'use client';

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <InformationCircleIcon className="w-4 h-4 text-[var(--spotify-light-text)]" />}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white bg-[var(--spotify-black)] border border-[var(--spotify-border-gray)] rounded-lg shadow-lg whitespace-nowrap",
            positionClasses[position],
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-[var(--spotify-black)] border-[var(--spotify-border-gray)] transform rotate-45",
              position === 'top' && "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r",
              position === 'bottom' && "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l",
              position === 'left' && "right-[-5px] top-1/2 -translate-y-1/2 border-r border-t",
              position === 'right' && "left-[-5px] top-1/2 -translate-y-1/2 border-l border-b"
            )}
          />
        </div>
      )}
    </div>
  );
}

// Contextual Help Tooltip with Icon
export function HelpTooltip({
  content,
  position = 'top'
}: {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <Tooltip content={content} position={position}>
      <InformationCircleIcon className="w-4 h-4 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors" />
    </Tooltip>
  );
}

// Field Label with Tooltip
export function LabelWithTooltip({
  label,
  tooltip,
  required = false
}: {
  label: string;
  tooltip: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <label className="text-sm font-medium text-[var(--spotify-white)]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <HelpTooltip content={tooltip} />
    </div>
  );
}

export default Tooltip;

