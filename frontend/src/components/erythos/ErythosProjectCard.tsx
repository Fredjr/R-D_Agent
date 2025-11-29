'use client';

import React from 'react';
import { FolderIcon, DocumentTextIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ErythosProjectCardProps {
  id: string;
  name: string;
  description?: string;
  collectionCount: number;
  lastActivity?: string;
  onClick: () => void;
}

export function ErythosProjectCard({
  id,
  name,
  description,
  collectionCount,
  lastActivity,
  onClick,
}: ErythosProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/80 
        rounded-xl border border-gray-700/50 hover:border-orange-500/50 
        hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
          <FolderIcon className="w-5 h-5 text-orange-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
            {name}
          </h3>
          
          {description && (
            <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">
              {description}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3.5 h-3.5" />
              {collectionCount} collection{collectionCount !== 1 ? 's' : ''}
            </span>
            {lastActivity && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />
                {lastActivity}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// New Project Card (the "+ New Project" button styled as a card)
export function ErythosNewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 bg-gray-800/30 rounded-xl 
        border-2 border-dashed border-gray-700 hover:border-orange-500/50 
        hover:bg-gray-800/50 transition-all duration-300 flex items-center justify-center gap-2"
    >
      <div className="p-1.5 bg-gray-700/50 rounded-lg group-hover:bg-orange-500/20 transition-colors">
        <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
      </div>
      <span className="text-sm font-medium text-gray-400 group-hover:text-orange-400 transition-colors">
        New Project
      </span>
    </button>
  );
}

export default ErythosProjectCard;

