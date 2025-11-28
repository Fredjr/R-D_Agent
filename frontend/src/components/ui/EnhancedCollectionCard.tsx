/**
 * EnhancedCollectionCard Component
 * 
 * Phase 0: Component Shell (Empty)
 * Phase 3: Implementation (Week 4)
 * 
 * Purpose: Large collection card for the redesigned Collections page
 * Features:
 * - Large card with colored icon on left
 * - Collection name (bold, large)
 * - Article count + notes count
 * - Description (2-3 lines, truncated)
 * - Two prominent buttons: "📄 Explore" and "🌐 Network"
 * 
 * Design:
 * - 2-column grid layout
 * - Hover effects and transitions
 * - Responsive (1 column on mobile)
 * 
 * Created: 2025-11-27
 */

'use client';

import React from 'react';

interface EnhancedCollectionCardProps {
  collection: {
    collection_id: string;
    collection_name: string;
    description?: string;
    color: string;
    icon: string;
    article_count: number;
    notes_count: number;
  };
  onExplore?: () => void;
  onNetwork?: () => void;
}

export default function EnhancedCollectionCard({
  collection,
  onExplore,
  onNetwork,
}: EnhancedCollectionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4"
         style={{ borderLeftColor: collection.color }}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
             style={{ backgroundColor: `${collection.color}20` }}>
          {collection.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {collection.collection_name}
          </h3>
          
          {/* Counts */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span>📄 {collection.article_count} articles</span>
            <span>📝 {collection.notes_count} notes</span>
          </div>
          
          {/* Description */}
          {collection.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {collection.description}
            </p>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onExplore}
              className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              📄 Explore
            </button>
            <button
              onClick={onNetwork}
              className="flex-1 py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              🌐 Network
            </button>
          </div>
        </div>
      </div>
      
      {/* Phase 0 indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Phase 0: Component Shell - Will be implemented in Phase 3 (Week 4)
        </p>
      </div>
    </div>
  );
}

