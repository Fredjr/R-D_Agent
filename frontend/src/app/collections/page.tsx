'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BeakerIcon, PlusIcon, FolderIcon, EyeIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { SpotifyCollectionCard } from '@/components/ui/SpotifyCard';
import { SpotifyTopBar, SpotifyTabs } from '@/components/ui/SpotifyNavigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import EnhancedCollectionNavigation from '@/components/EnhancedCollectionNavigation';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  articleCount: number;
  projectName: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
}

export default function CollectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  console.log('📚 Collections page loaded');

  // Initialize real-time analytics
  const { trackCollectionAction } = useRealTimeAnalytics('collections');

  useEffect(() => {
    fetchCollections();
  }, []);

  // Demo collections for testing semantic features
  const demoCollections: Collection[] = [
    {
      id: 'demo-1',
      name: 'Machine Learning in Drug Discovery',
      description: 'Semantic analysis of ML applications in pharmaceutical research',
      color: '#3B82F6',
      icon: '🧠',
      articleCount: 24,
      projectName: 'AI Research Project',
      projectId: 'project-1',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      isShared: false
    },
    {
      id: 'demo-2',
      name: 'Cross-Domain Biomedical Research',
      description: 'Interdisciplinary papers with semantic connections',
      color: '#10B981',
      icon: '🌐',
      articleCount: 18,
      projectName: 'Cross-Domain Analysis',
      projectId: 'project-2',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isShared: true
    },
    {
      id: 'demo-3',
      name: 'Semantic Literature Review',
      description: 'AI-curated papers for systematic review',
      color: '#8B5CF6',
      icon: '📚',
      articleCount: 31,
      projectName: 'Literature Analysis',
      projectId: 'project-3',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isShared: false
    }
  ];

  const fetchCollections = async () => {
    try {
      console.log('🔄 Fetching all collections from all projects...');

      // First, get all user projects
      const projectsResponse = await fetch(`/api/proxy/projects?user_id=${user?.email}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        console.warn('⚠️ Failed to fetch projects, using demo collections');
        setCollections(demoCollections);
        setIsLoading(false);
        return;
      }

      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];
      console.log('✅ Found projects:', projects.length);

      // Fetch collections from all projects
      const allCollections: Collection[] = [];

      for (const project of projects) {
        try {
          const collectionsResponse = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
            headers: {
              'User-ID': user?.email || 'default_user',
              'Content-Type': 'application/json',
            },
          });

          if (collectionsResponse.ok) {
            const projectCollections = await collectionsResponse.json();

            // Transform backend collections to frontend format
            const transformedCollections = projectCollections.map((collection: any) => ({
              id: collection.collection_id,
              name: collection.collection_name,
              description: collection.description || '',
              color: collection.color || '#3B82F6',
              icon: collection.icon || 'folder',
              articleCount: collection.article_count || 0,
              projectName: project.project_name,
              projectId: project.project_id,
              createdAt: collection.created_at,
              updatedAt: collection.updated_at,
              isShared: false // TODO: Add sharing logic
            }));

            allCollections.push(...transformedCollections);
            console.log(`✅ Found ${transformedCollections.length} collections in project: ${project.project_name}`);
          } else {
            console.warn(`⚠️ Failed to fetch collections for project ${project.project_name}: ${collectionsResponse.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch collections for project ${project.project_name}:`, error);
        }
      }

      console.log('✅ Total collections loaded:', allCollections.length);

      // If no collections found, use demo collections
      if (allCollections.length === 0) {
        console.log('📚 No backend collections found, using demo collections');
        setCollections(demoCollections);
      } else {
        setCollections(allCollections);
      }
    } catch (error) {
      console.error('❌ Failed to fetch collections:', error);
      console.log('📚 Using demo collections as fallback');
      setCollections(demoCollections);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'beaker': return BeakerIcon;
      case 'folder': return FolderIcon;
      default: return BeakerIcon;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Mobile-friendly header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Collections</h1>
              <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
                Organize and manage your research article collections
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex bg-[var(--spotify-dark-gray)] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-sm rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                      : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-sm rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                      : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
                  }`}
                >
                  List
                </button>
              </div>

              <Button
                onClick={() => setShowCreateModal(true)}
                variant="spotifyPrimary"
                size="spotifyDefault"
                className="inline-flex items-center justify-center w-full sm:w-auto"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                New Collection
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Collections Navigation */}
        <div className="min-h-[600px]">
          <EnhancedCollectionNavigation
            projectId="demo-project"
            onCollectionSelect={(collection) => {
              console.log('Selected collection:', collection);
              trackCollectionAction('view', collection.collection_id);
              // Navigate to collection details or handle selection
            }}
            onNetworkView={(collection) => {
              console.log('Network view for collection:', collection);
              trackCollectionAction('view', collection.collection_id);
              // Navigate to network view
            }}
            onArticlesList={(collection) => {
              console.log('Articles list for collection:', collection);
              trackCollectionAction('view', collection.collection_id);
              // Navigate to articles list
            }}
            className="w-full"
          />
        </div>

        {/* Demo Collections Display (if no real collections) */}
        {collections.length === 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Demo Collections</h2>
              <span className="text-sm text-gray-400">Semantic features preview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)] hover:border-[var(--spotify-green)] transition-colors cursor-pointer"
                  onClick={() => {
                    trackCollectionAction('view', collection.id);
                    // Navigate to discover page with semantic search for demo collections
                    router.push(`/discover?mode=semantic_search&query=${encodeURIComponent(collection.name)}&collection_demo=${collection.id}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{collection.icon}</span>
                      <div>
                        <h3 className="text-white font-medium">{collection.name}</h3>
                        <p className="text-sm text-gray-400">{collection.articleCount} articles</p>
                      </div>
                    </div>
                    {collection.isShared && (
                      <span className="px-2 py-1 bg-[var(--spotify-green)] text-black text-xs rounded-full">
                        Shared
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{collection.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-[var(--spotify-medium-gray)] rounded">
                      {collection.projectName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileResponsiveLayout>
  );
}
