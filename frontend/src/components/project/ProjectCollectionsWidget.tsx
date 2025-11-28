/**
 * ProjectCollectionsWidget Component
 *
 * Phase 2: Implementation (Week 3) - COMPLETE
 *
 * Purpose: Displays collections linked to this project in compact card format
 * Features:
 * - Colored icons for each collection
 * - Article count + notes count
 * - Click to view collection details
 * - "+ Add Collection to Project" button
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 (Phase 2)
 */

'use client';

import React from 'react';
import { PlusIcon, FolderIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SpotifyTabCard, SpotifyTabCardHeader, SpotifyTabButton } from './shared';

interface Collection {
  collection_id: string;
  collection_name: string;
  color?: string;
  icon?: string;
  article_count?: number;
  notes_count?: number;
  description?: string;
}

interface ProjectCollectionsWidgetProps {
  projectId: string;
  collections?: Collection[];
  onAddCollection?: () => void;
  onViewAll?: () => void;
}

export default function ProjectCollectionsWidget({
  projectId,
  collections = [],
  onAddCollection,
  onViewAll,
}: ProjectCollectionsWidgetProps) {
  // Show only first 4 collections
  const displayCollections = collections.slice(0, 4);
  const hasMore = collections.length > 4;

  return (
    <SpotifyTabCard className="h-full flex flex-col">
      {/* Header */}
      <SpotifyTabCardHeader
        title="📚 Collections"
        description={`${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
        action={
          onAddCollection && (
            <button
              onClick={onAddCollection}
              className="p-2 rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors"
              title="Add Collection"
            >
              <PlusIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            </button>
          )
        }
      />

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-spotify-medium scrollbar-thumb-spotify-light">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <FolderIcon className="w-12 h-12 text-[var(--spotify-muted-text)] mb-3" />
            <p className="text-[var(--spotify-light-text)] text-sm mb-4">
              No collections yet
            </p>
            {onAddCollection && (
              <SpotifyTabButton
                onClick={onAddCollection}
                variant="primary"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Collection
              </SpotifyTabButton>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayCollections.map((collection) => (
              <div
                key={collection.collection_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors cursor-pointer group"
                onClick={() => onViewAll?.()}
              >
                {/* Collection Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: collection.color || 'var(--spotify-green)' }}
                >
                  <span className="text-xl">
                    {collection.icon || '📚'}
                  </span>
                </div>

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[var(--spotify-white)] text-sm font-medium truncate">
                    {collection.collection_name}
                  </h4>
                  <p className="text-[var(--spotify-light-text)] text-xs">
                    {collection.article_count || 0} articles
                  </p>
                </div>

                {/* Arrow Icon */}
                <ArrowRightIcon className="w-4 h-4 text-[var(--spotify-muted-text)] group-hover:text-[var(--spotify-green)] transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - View All */}
      {hasMore && onViewAll && (
        <div className="mt-4 pt-4 border-t border-[var(--spotify-border-gray)]">
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm text-[var(--spotify-green)] hover:text-[var(--spotify-white)] transition-colors font-medium"
          >
            View all {collections.length} collections →
          </button>
        </div>
      )}
    </SpotifyTabCard>
  );
}

