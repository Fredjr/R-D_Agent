'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { ErythosCollectionCard } from './ErythosCollectionCard';
import { ErythosButton } from './ErythosButton';

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  articleCount: number;
  noteCount: number;
  projectName: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface ErythosCollectionsPageProps {
  onCreateCollection?: () => void;
}

export function ErythosCollectionsPage({ onCreateCollection }: ErythosCollectionsPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { trackCollectionAction } = useRealTimeAnalytics('collections');

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch collections
  useEffect(() => {
    if (user?.email) {
      fetchCollections();
    }
  }, [user?.email]);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all user projects
      const projectsResponse = await fetch(`/api/proxy/projects?user_id=${user?.email}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects');
      }

      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];

      // Fetch collections from all projects
      const allCollections: Collection[] = [];

      for (const project of projects) {
        try {
          const response = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
            headers: {
              'User-ID': user?.email || 'default_user',
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const projectCollections = await response.json();
            const transformed = projectCollections.map((c: any) => ({
              id: c.collection_id,
              name: c.collection_name,
              description: c.description || '',
              color: c.color || '#FB923C',
              icon: c.icon || 'folder',
              articleCount: c.article_count || 0,
              noteCount: c.note_count || 0,
              projectName: project.project_name,
              projectId: project.project_id,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            }));
            allCollections.push(...transformed);
          }
        } catch (err) {
          console.warn(`Failed to fetch collections for ${project.project_name}:`, err);
        }
      }

      setCollections(allCollections);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter collections by search
  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header - Simplified */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📁 Collections</h1>
          <p className="text-gray-400">Organize and manage your research article collections</p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/70 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            />
          </div>

          {/* View Toggle + Create Button */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-900/70 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
                title="Grid view"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
                title="List view"
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            {/* New Collection Button */}
            <ErythosButton variant="primary" onClick={onCreateCollection} className="bg-orange-500 hover:bg-orange-600">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Collection
            </ErythosButton>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchCollections}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading your collections...</p>
            </div>
          </div>
        )}

        {/* Collections Grid - Flat List */}
        {!isLoading && !error && filteredCollections.length > 0 && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
            : 'space-y-4'
          }>
            {filteredCollections.map((collection, index) => (
              <div
                key={collection.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ErythosCollectionCard
                  id={collection.id}
                  name={collection.name}
                  description={collection.description}
                  icon={collection.icon}
                  color={collection.color}
                  articleCount={collection.articleCount}
                  noteCount={collection.noteCount}
                  onClick={() => {
                    trackCollectionAction('view', collection.id);
                    router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}`);
                  }}
                  onExplore={() => {
                    trackCollectionAction('view', collection.id);
                    router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}&view=articles`);
                  }}
                  onNetworkView={() => {
                    trackCollectionAction('network_view', collection.id);
                    // TODO: Show network view modal
                    router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}&view=network`);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCollections.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-900/70 mb-6">
              <span className="text-4xl">📁</span>
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">No collections found</h3>
                <p className="text-gray-400 mb-6">
                  No collections match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">No collections yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first collection to organize and manage your research articles.
                </p>
                <ErythosButton variant="primary" onClick={onCreateCollection} className="bg-orange-500 hover:bg-orange-600">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Collection
                </ErythosButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ErythosCollectionsPage;

