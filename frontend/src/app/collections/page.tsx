'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BeakerIcon,
  PlusIcon,
  FolderIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { DeletableCollectionCard } from '@/components/ui/DeletableCard';
import { SpotifyTopBar, SpotifyTabs } from '@/components/ui/SpotifyNavigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { UnifiedHeroSection, HeroAction } from '@/components/ui/UnifiedHeroSection';
import { QuickActionsFAB } from '@/components/ui/QuickActionsFAB';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import { SuggestedNextSteps } from '@/components/ui/SuggestedNextSteps';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import EnhancedCollectionNavigation from '@/components/EnhancedCollectionNavigation';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';

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
  linkedHypothesisIds?: string[];  // Week 24
}

export default function CollectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 🔧 NEW: State for article selection and network view
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showNetworkView, setShowNetworkView] = useState(false);

  // Week 24: State for hypotheses
  const [hypothesesByProject, setHypothesesByProject] = useState<Record<string, Record<string, string>>>({});

  // State for creating new collection
  const [newCollection, setNewCollection] = useState({
    collection_name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder'
  });
  const [creatingCollection, setCreatingCollection] = useState(false);

  console.log('📚 Collections page loaded');

  // Initialize real-time analytics
  const { trackCollectionAction } = useRealTimeAnalytics('collections');

  // 🔧 FIX: Wait for user to be loaded before fetching collections
  useEffect(() => {
    if (user?.email) {
      console.log('✅ User loaded, fetching collections for:', user.email);
      fetchCollections();
    } else {
      console.log('⏳ Waiting for user session to load...');
    }
  }, [user?.email]); // Re-fetch when user changes

  // REMOVED: Demo collections - should not be shown to real users

  const fetchCollections = async () => {
    try {
      console.log('🔄 Fetching all collections from all projects...');
      console.log('🔐 Current user:', user);
      console.log('🔐 User email:', user?.email);

      // First, get all user projects
      const projectsResponse = await fetch(`/api/proxy/projects?user_id=${user?.email}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Projects response status:', projectsResponse.status);

      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();
        console.error('❌ Failed to fetch projects:', projectsResponse.status, errorText);
        throw new Error(`Projects fetch failed: ${projectsResponse.status}`);
      }

      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];
      console.log('✅ Found projects:', projects.length);

      // Fetch collections from all projects
      const allCollections: Collection[] = [];

      for (const project of projects) {
        try {
          console.log(`🔄 Fetching collections for project: ${project.project_name} (${project.project_id})`);

          const collectionsResponse = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
            headers: {
              'User-ID': user?.email || 'default_user',
              'Content-Type': 'application/json',
            },
          });

          console.log(`📊 Collections response for ${project.project_name}:`, collectionsResponse.status);

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
              isShared: false, // TODO: Add sharing logic
              linkedHypothesisIds: collection.linked_hypothesis_ids || []  // Week 24
            }));

            allCollections.push(...transformedCollections);
            console.log(`✅ Found ${transformedCollections.length} collections in project: ${project.project_name}`);
          } else {
            const errorText = await collectionsResponse.text();
            console.error(`❌ Failed to fetch collections for project ${project.project_name}:`, {
              status: collectionsResponse.status,
              statusText: collectionsResponse.statusText,
              error: errorText
            });
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch collections for project ${project.project_name}:`, error);
        }
      }

      console.log('✅ Total collections loaded:', allCollections.length);
      setCollections(allCollections);

      // Week 24: Fetch hypotheses for all projects
      const hypothesesData: Record<string, Record<string, string>> = {};
      for (const project of projects) {
        try {
          const hypothesesResponse = await fetch(`/api/proxy/hypotheses/project/${project.project_id}`, {
            headers: {
              'User-ID': user?.email || 'default_user',
              'Content-Type': 'application/json',
            },
          });

          if (hypothesesResponse.ok) {
            const hypotheses = await hypothesesResponse.json();
            const hypothesesMap = hypotheses.reduce((acc: Record<string, string>, h: any) => {
              acc[h.hypothesis_id] = h.hypothesis_text;
              return acc;
            }, {});
            hypothesesData[project.project_id] = hypothesesMap;
            console.log(`✅ Loaded ${hypotheses.length} hypotheses for project: ${project.project_name}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch hypotheses for project ${project.project_name}:`, error);
        }
      }
      setHypothesesByProject(hypothesesData);

    } catch (error) {
      console.error('❌ Failed to fetch collections:', error);
      // Don't use demo collections - show the real error
      setError(`Failed to load collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Handle creating a new collection
  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCollection.collection_name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    // Get the first project ID (or create a default project)
    const projectId = 'default_project'; // TODO: Get from user's projects

    setCreatingCollection(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(newCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      // Reset form and close modal
      setNewCollection({
        collection_name: '',
        description: '',
        color: '#3B82F6',
        icon: 'folder'
      });
      setShowCreateModal(false);

      // Refresh collections
      fetchCollections();

      alert('✅ Collection created successfully!');
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('❌ Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Hero actions for collections page
  const heroActions: HeroAction[] = [
    {
      id: 'new-collection',
      title: 'New Collection',
      description: 'Create a new paper collection',
      icon: PlusIcon,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => setShowCreateModal(true),
      badge: 'Quick Action'
    },
    {
      id: 'explore-network',
      title: 'Explore Network',
      description: 'Discover connected papers',
      icon: GlobeAltIcon,
      gradient: 'from-purple-500 to-indigo-600',
      onClick: () => router.push('/explore/network')
    },
    {
      id: 'search-papers',
      title: 'Search Papers',
      description: 'Find papers to add',
      icon: MagnifyingGlassIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => router.push('/search')
    }
  ];

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {/* Unified Hero Section */}
        <UnifiedHeroSection
          emoji="📚"
          title="Your Collections"
          description="Organize and manage your curated paper collections"
          actions={heroActions}
          proTip="Collections help you organize papers by topic, project, or research question"
        />

        {/* View Mode Toggle */}
        <div className="mb-6 px-4 sm:px-6 flex justify-end">
          <div className="flex bg-[var(--spotify-dark-gray)] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                  : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                  : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Authentication Error</h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>{error}</p>
                  <p className="mt-2">Please try signing out and signing back in with proper credentials.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto mb-4"></div>
              <p className="text-[var(--spotify-light-text)]">Loading your collections...</p>
            </div>
          </div>
        )}

        {/* Enhanced Collections Navigation - Show collections from all projects */}
        {!isLoading && !error && collections.length > 0 && (
          <div className="min-h-[600px]">
            <div className="space-y-8">
              {/* Group collections by project */}
              {Object.entries(
                collections.reduce((acc, collection) => {
                  const projectName = collection.projectName || 'Unknown Project';
                  if (!acc[projectName]) acc[projectName] = [];
                  acc[projectName].push(collection);
                  return acc;
                }, {} as Record<string, typeof collections>)
              ).map(([projectName, projectCollections]) => (
                <div key={projectName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">{projectName}</h2>
                    <span className="text-sm text-gray-400">{projectCollections.length} collections</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectCollections.map((collection) => {
                      // Get the first project ID from the collections to find hypotheses
                      const projectId = projectCollections[0]?.projectId;
                      const hypothesesMap = projectId ? hypothesesByProject[projectId] || {} : {};

                      return (
                        <DeletableCollectionCard
                          key={collection.id}
                          title={collection.name}
                          description={collection.description}
                          articleCount={collection.articleCount}
                          lastUpdated={collection.updatedAt}
                          color={collection.color}
                          linkedHypothesisIds={collection.linkedHypothesisIds}
                          hypothesesMap={hypothesesMap}
                          onClick={() => {
                            console.log('Selected collection:', collection);
                            trackCollectionAction('view', collection.id);
                            // Navigate to project page with collections tab active
                            router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}`);
                          }}
                          onExplore={() => {
                            console.log('Explore collection:', collection);
                            trackCollectionAction('view', collection.id);
                            // Navigate to project page with collections tab and articles view
                            router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}&view=articles`);
                          }}
                          onNetworkView={() => {
                            console.log('🔵 Network view button clicked for collection:', collection);
                            trackCollectionAction('network_view', collection.id);
                            // 🔧 NEW: Show article selector modal instead of navigating
                            setSelectedCollection(collection);
                            setShowArticleSelector(true);
                          }}
                          onDelete={async () => {
                            console.log('🗑️ Delete collection:', collection);
                            trackCollectionAction('delete', collection.id);
                            // TODO: Implement delete functionality
                            alert(`Delete collection: ${collection.name}`);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No Collections */}
        {!isLoading && !error && collections.length === 0 && (
          <div className="mt-8 text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--spotify-medium-gray)] mb-4">
              <FolderIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No collections yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create your first collection to organize and manage your research articles.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-[var(--spotify-green)] hover:bg-[#1ed760] text-black font-semibold rounded-full transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Collection
            </button>
          </div>
        )}

        {/* 🔧 NEW: Article Selector Modal */}
        {showArticleSelector && selectedCollection && (
          <ArticleSelectorModal
            collection={selectedCollection}
            onClose={() => {
              setShowArticleSelector(false);
              setSelectedCollection(null);
            }}
            onArticleSelect={(article) => {
              console.log('📄 Article selected:', article);
              setSelectedArticle(article);
              setShowArticleSelector(false);
              setShowNetworkView(true);
            }}
          />
        )}

        {/* 🔧 NEW: Network View Modal */}
        {showNetworkView && selectedArticle && selectedCollection && (
          <NetworkViewModal
            article={selectedArticle}
            collection={selectedCollection}
            onClose={() => {
              setShowNetworkView(false);
              setSelectedArticle(null);
              setSelectedCollection(null);
            }}
          />
        )}

        {/* Suggested Next Steps for empty state */}
        {collections.length === 0 && !isLoading && (
          <div className="px-4 sm:px-6 mt-8">
            <SuggestedNextSteps context="after-create-collection" />
          </div>
        )}

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Collection</h3>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newCollection.collection_name}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, collection_name: e.target.value }))}
                    placeholder="Enter collection name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newCollection.description}
                    onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newCollection.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCollection({
                        collection_name: '',
                        description: '',
                        color: '#3B82F6',
                        icon: 'folder'
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={creatingCollection}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCollection.collection_name.trim() || creatingCollection}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingCollection ? 'Creating...' : 'Create Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions FAB */}
      <QuickActionsFAB onCreateCollection={() => setShowCreateModal(true)} />

      {/* Contextual Help */}
      <ContextualHelp />
    </MobileResponsiveLayout>
  );
}

// 🔧 NEW: Article Selector Modal Component
function ArticleSelectorModal({
  collection,
  onClose,
  onArticleSelect
}: {
  collection: Collection;
  onClose: () => void;
  onArticleSelect: (article: any) => void;
}) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `/api/proxy/collections/${collection.id}/articles?projectId=${collection.projectId}`,
          {
            headers: {
              'User-ID': user?.email || 'default_user',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [collection.id, collection.projectId, user?.email]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Select an Article</h2>
              <p className="text-purple-100">{collection.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading articles...</p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No articles in this collection</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => onArticleSelect(article)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {article.article_title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {article.article_authors && (
                      <span>👥 {article.article_authors}</span>
                    )}
                    {article.article_journal && (
                      <span>📚 {article.article_journal}</span>
                    )}
                    {article.article_year && (
                      <span>📅 {article.article_year}</span>
                    )}
                  </div>
                  {article.article_pmid && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        PMID: {article.article_pmid}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🔧 NEW: Network View Modal Component
function NetworkViewModal({
  article,
  collection,
  onClose
}: {
  article: any;
  collection: Collection;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold">Network View</h2>
                <p className="text-sm text-purple-100 truncate max-w-2xl">
                  {article.article_title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Network View Content */}
        <div className="flex-1 overflow-hidden">
          <MultiColumnNetworkView
            sourceType="article"
            sourceId={article.article_pmid}
            projectId={collection.projectId}
            onDeepDiveCreated={() => {}}
            onArticleSaved={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
