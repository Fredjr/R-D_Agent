'use client';

import React, { useState } from 'react';

interface Collection {
  collection_id: string;
  collection_name: string;
  article_count: number;
  color?: string;
  icon?: string;
}

interface WriteCollectionSelectorProps {
  collections: Collection[];
  loading: boolean;
  onSelect: (collection: Collection) => void;
}

export function WriteCollectionSelector({ collections, loading, onSelect }: WriteCollectionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = collections.filter(col =>
    col.collection_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 mb-4">
            <span className="text-3xl">✍️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Start Writing</h1>
          <p className="text-gray-400">Select a collection to pull references from</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-[#1C1C1E] rounded-xl border border-[#2C2C2E]">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-400 mb-2">No collections found</p>
            <p className="text-gray-500 text-sm">Create a collection first and add papers to it</p>
            <a
              href="/collections"
              className="inline-block mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
            >
              Go to Collections
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCollections.map((collection) => (
              <button
                key={collection.collection_id}
                onClick={() => onSelect(collection)}
                className="p-6 bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl text-left hover:border-yellow-500 hover:bg-yellow-500/5 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ 
                      background: collection.color 
                        ? `linear-gradient(135deg, ${collection.color}, ${collection.color}88)` 
                        : 'linear-gradient(135deg, #FBBF24, #F59E0B)' 
                    }}
                  >
                    {collection.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                      {collection.collection_name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {collection.article_count} {collection.article_count === 1 ? 'paper' : 'papers'}
                    </p>
                  </div>
                  <div className="text-gray-500 group-hover:text-yellow-500 transition-colors">
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-yellow-400 font-medium">How it works</p>
              <p className="text-sm text-gray-400 mt-1">
                Select a collection with papers you want to cite. We&apos;ll automatically extract 
                key findings and quotes as draggable sources for your document.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

