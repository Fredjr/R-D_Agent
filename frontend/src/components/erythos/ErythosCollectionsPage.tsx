'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon, FunnelIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { ErythosCollectionCard } from './ErythosCollectionCard';
import { ErythosButton } from './ErythosButton';
import { ErythosCreateProjectModal } from './ErythosCreateProjectModal';
import { ErythosAnalyzeModal } from './ErythosAnalyzeModal';

interface Project {
  project_id: string;
  project_name: string;
}

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
  projects: { id: string; name: string }[];  // All projects this collection belongs to
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all'); // 'all' | 'standalone' | project_id
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [selectedCollectionForAnalysis, setSelectedCollectionForAnalysis] = useState<{
    collection_id: string;
    collection_name: string;
    article_count: number;
  } | undefined>(undefined);

  // Fetch collections and projects
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
      const projectsList = projectsData.projects || [];
      setProjects(projectsList);

      // Fetch collections from all projects
      const allCollections: Collection[] = [];
      const collectionProjectMap = new Map<string, { id: string; name: string }[]>();

      for (const project of projectsList) {
        try {
          const response = await fetch(`/api/proxy/projects/${project.project_id}/collections`, {
            headers: {
              'User-ID': user?.email || 'default_user',
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const projectCollections = await response.json();
            for (const c of projectCollections) {
              const collId = c.collection_id;
              // Track which projects this collection belongs to
              if (!collectionProjectMap.has(collId)) {
                collectionProjectMap.set(collId, []);
              }
              collectionProjectMap.get(collId)!.push({
                id: project.project_id,
                name: project.project_name,
              });

              // Only add collection once (avoid duplicates)
              if (!allCollections.find(col => col.id === collId)) {
                allCollections.push({
                  id: collId,
                  name: c.collection_name,
                  description: c.description || '',
                  color: c.color || '#FB923C',
                  icon: c.icon || 'folder',
                  articleCount: c.article_count || 0,
                  noteCount: c.note_count || 0,
                  projectName: project.project_name,
                  projectId: project.project_id,
                  projects: [], // Will be filled below
                  createdAt: c.created_at,
                  updatedAt: c.updated_at,
                });
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch collections for ${project.project_name}:`, err);
        }
      }

      // Fill in the projects array for each collection
      const collectionsWithProjects = allCollections.map(c => ({
        ...c,
        projects: collectionProjectMap.get(c.id) || [],
      }));

      setCollections(collectionsWithProjects);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle project created from modal
  const handleProjectCreated = (project: { project_id: string; project_name: string }) => {
    setProjects(prev => [...prev, { project_id: project.project_id, project_name: project.project_name }]);
  };

  // Filter collections by search and project
  const filteredCollections = collections.filter(c => {
    // Search filter
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Project filter
    let matchesProject = true;
    if (projectFilter === 'standalone') {
      matchesProject = c.projects.length === 0;
    } else if (projectFilter !== 'all') {
      matchesProject = c.projects.some(p => p.id === projectFilter);
    }

    return matchesSearch && matchesProject;
  });

  // Get selected project name for breadcrumb
  const selectedProject = projectFilter !== 'all' && projectFilter !== 'standalone'
    ? projects.find(p => p.project_id === projectFilter)
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        {selectedProject && (
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link
              href={`/project/${selectedProject.project_id}`}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to {selectedProject.project_name}</span>
            </Link>
            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            <span className="text-orange-400">Collections</span>
          </nav>
        )}

        {/* Page Header - Simplified */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📁 Collections</h1>
          <p className="text-gray-400">
            {selectedProject
              ? `Collections in ${selectedProject.project_name}`
              : 'Organize and manage your research article collections'
            }
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search + Filter */}
          <div className="flex items-center gap-3 flex-1">
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

            {/* Project Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-gray-900/70 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Projects</option>
                <option value="standalone">Standalone (No Project)</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle + Create Buttons */}
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

            {/* New Project Button */}
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Project
            </button>

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
                  projects={collection.projects}
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
                    router.push(`/project/${collection.projectId}?tab=collections&collection=${collection.id}&view=network`);
                  }}
                  onAnalyze={() => {
                    trackCollectionAction('view', collection.id, { action_type: 'analyze' });
                    setSelectedCollectionForAnalysis({
                      collection_id: collection.id,
                      collection_name: collection.name,
                      article_count: collection.articleCount,
                    });
                    setShowAnalyzeModal(true);
                  }}
                  onAddToProject={() => {
                    // TODO: Open add to project modal
                    console.log('Add to project:', collection.id);
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
            {searchQuery || projectFilter !== 'all' ? (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">No collections found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery
                    ? `No collections match "${searchQuery}"`
                    : projectFilter === 'standalone'
                      ? 'No standalone collections found'
                      : 'No collections in this project'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setProjectFilter('all');
                  }}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                >
                  Clear filters
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

      {/* Create Project Modal */}
      <ErythosCreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Analyze Collection Modal */}
      <ErythosAnalyzeModal
        isOpen={showAnalyzeModal}
        onClose={() => {
          setShowAnalyzeModal(false);
          setSelectedCollectionForAnalysis(undefined);
        }}
        collection={selectedCollectionForAnalysis}
        onSuccess={(result) => {
          if (result.projectId) {
            router.push(`/project/${result.projectId}?tab=reports`);
          }
        }}
      />
    </div>
  );
}

export default ErythosCollectionsPage;

