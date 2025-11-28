'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Collection {
  collection_id: string;
  collection_name: string;
  description?: string;
  article_count?: number;
  note_count?: number;
}

interface ErythosProjectCollectionsTabProps {
  projectId: string;
}

export function ErythosProjectCollectionsTab({ projectId }: ErythosProjectCollectionsTabProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, [projectId]);

  const fetchCollections = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(Array.isArray(data) ? data : data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    'from-orange-500 to-red-500',
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500',
    'from-yellow-500 to-orange-500',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">📁 Project Collections</h3>
          <p className="text-sm text-gray-400">Organize your papers into focused collections</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/discover"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            🔍 Go to Discover
          </a>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors">
            ➕ New Collection
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-400 mb-4">No collections yet</p>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Create Your First Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection, index) => (
            <div 
              key={collection.collection_id}
              className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 hover:border-orange-500/50 transition-all group"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center mb-3`}>
                <span className="text-2xl">📁</span>
              </div>
              
              {/* Title */}
              <h4 className="text-white font-medium mb-1 group-hover:text-orange-400 transition-colors">
                {collection.collection_name}
              </h4>
              
              {/* Description */}
              {collection.description && (
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}
              
              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>📄 {collection.article_count || 0} articles</span>
                <span>📝 {collection.note_count || 0} notes</span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <a
                  href={`/collections/${collection.collection_id}`}
                  className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm text-center transition-colors"
                >
                  View
                </a>
                <a
                  href={`/collections/${collection.collection_id}/network`}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  🔗 Network
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

