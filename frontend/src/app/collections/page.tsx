'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BeakerIcon, PlusIcon, FolderIcon, EyeIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      // TODO: Implement actual API call
      // For now, return mock data
      const mockCollections: Collection[] = [
        {
          id: '1',
          name: 'Machine Learning Papers',
          description: 'Key papers in machine learning and AI research',
          color: '#1db954',
          icon: 'beaker',
          articleCount: 24,
          projectName: 'AI Research Project',
          projectId: 'proj-1',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
          isShared: false
        },
        {
          id: '2',
          name: 'COVID-19 Studies',
          description: 'Comprehensive collection of pandemic research',
          color: '#1e3a8a',
          icon: 'folder',
          articleCount: 18,
          projectName: 'Pandemic Response',
          projectId: 'proj-2',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18',
          isShared: true
        },
        {
          id: '3',
          name: 'Neural Networks',
          description: 'Deep learning and neural network architectures',
          color: '#8b5cf6',
          icon: 'beaker',
          articleCount: 31,
          projectName: 'Deep Learning Research',
          projectId: 'proj-3',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-22',
          isShared: false
        }
      ];
      
      setCollections(mockCollections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
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
    <div className="min-h-screen bg-[var(--spotify-black)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Collections"
          description="Organize and manage your research article collections"
          breadcrumb={[
            { label: 'Research Hub', href: '/' },
            { label: 'Collections', current: true }
          ]}
          actions={
            <div className="flex items-center space-x-3">
              <div className="flex bg-[var(--spotify-dark-gray)] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                      : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
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
                className="inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Collection
              </Button>
            </div>
          }
        />

        {/* Collections Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
            <p className="text-[var(--spotify-light-text)] mt-2">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <BeakerIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">No collections yet</h3>
            <p className="text-[var(--spotify-light-text)] mb-6">
              Create your first collection to organize research articles
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="spotifyPrimary"
              size="spotifyLg"
              className="inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Collection
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                <div className="flex items-center">
                  <BeakerIcon className="h-8 w-8 text-[var(--spotify-green)]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-[var(--spotify-white)]">{collections.length}</p>
                    <p className="text-[var(--spotify-light-text)]">Total Collections</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                <div className="flex items-center">
                  <FolderIcon className="h-8 w-8 text-[var(--spotify-blue)]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-[var(--spotify-white)]">
                      {collections.reduce((sum, col) => sum + col.articleCount, 0)}
                    </p>
                    <p className="text-[var(--spotify-light-text)]">Total Articles</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
                <div className="flex items-center">
                  <ShareIcon className="h-8 w-8 text-[var(--spotify-purple)]" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-[var(--spotify-white)]">
                      {collections.filter(col => col.isShared).length}
                    </p>
                    <p className="text-[var(--spotify-light-text)]">Shared Collections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Collections Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => {
                  const IconComponent = getIconComponent(collection.icon);
                  return (
                    <div
                      key={collection.id}
                      className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)] hover:bg-[var(--spotify-medium-gray)] transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${collection.color}20` }}
                        >
                          <IconComponent 
                            className="h-6 w-6" 
                            style={{ color: collection.color }}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-[var(--spotify-light-text)] hover:text-red-400 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2 group-hover:text-[var(--spotify-green)] transition-colors">
                        {collection.name}
                      </h3>
                      
                      <p className="text-[var(--spotify-light-text)] text-sm mb-4 line-clamp-2">
                        {collection.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-[var(--spotify-muted-text)]">
                        <span>{collection.articleCount} articles</span>
                        <span>Updated {formatDate(collection.updatedAt)}</span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-[var(--spotify-border-gray)]">
                        <Link
                          href={`/project/${collection.projectId}`}
                          className="text-xs text-[var(--spotify-light-text)] hover:text-[var(--spotify-green)] transition-colors"
                        >
                          {collection.projectName}
                        </Link>
                        {collection.isShared && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-[var(--spotify-purple)]/10 text-[var(--spotify-purple)] rounded">
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {collections.map((collection) => {
                  const IconComponent = getIconComponent(collection.icon);
                  return (
                    <div
                      key={collection.id}
                      className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 border border-[var(--spotify-border-gray)] hover:bg-[var(--spotify-medium-gray)] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${collection.color}20` }}
                          >
                            <IconComponent 
                              className="h-5 w-5" 
                              style={{ color: collection.color }}
                            />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--spotify-white)]">
                              {collection.name}
                            </h3>
                            <p className="text-[var(--spotify-light-text)] text-sm">
                              {collection.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-[var(--spotify-muted-text)]">
                          <span>{collection.articleCount} articles</span>
                          <span>Updated {formatDate(collection.updatedAt)}</span>
                          <Link
                            href={`/project/${collection.projectId}`}
                            className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-green)] transition-colors"
                          >
                            {collection.projectName}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
