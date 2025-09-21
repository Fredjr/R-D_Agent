'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UsersIcon, ShareIcon, EyeIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface SharedItem {
  id: string;
  type: 'project' | 'collection' | 'report';
  name: string;
  description: string;
  owner: {
    name: string;
    email: string;
    avatar?: string;
  };
  sharedAt: string;
  lastAccessed?: string;
  permissions: 'view' | 'edit' | 'admin';
  isActive: boolean;
  metadata: {
    itemCount?: number;
    projectName?: string;
    tags?: string[];
  };
}

export default function SharedPage() {
  const { user } = useAuth();
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'project' | 'collection' | 'report'>('all');

  useEffect(() => {
    fetchSharedItems();
  }, []);

  const fetchSharedItems = async () => {
    try {
      // TODO: Implement actual API call
      // For now, return mock data
      const mockSharedItems: SharedItem[] = [
        {
          id: '1',
          type: 'project',
          name: 'AI Ethics Research',
          description: 'Collaborative research on ethical implications of artificial intelligence',
          owner: {
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@university.edu'
          },
          sharedAt: '2024-01-15',
          lastAccessed: '2024-01-20',
          permissions: 'edit',
          isActive: true,
          metadata: {
            itemCount: 15,
            tags: ['ethics', 'ai', 'collaboration']
          }
        },
        {
          id: '2',
          type: 'collection',
          name: 'Climate Change Papers',
          description: 'Curated collection of climate research papers',
          owner: {
            name: 'Prof. Michael Chen',
            email: 'mchen@research.org'
          },
          sharedAt: '2024-01-10',
          lastAccessed: '2024-01-18',
          permissions: 'view',
          isActive: true,
          metadata: {
            itemCount: 42,
            projectName: 'Environmental Studies',
            tags: ['climate', 'environment']
          }
        },
        {
          id: '3',
          type: 'report',
          name: 'Machine Learning Survey 2024',
          description: 'Comprehensive survey of recent ML developments',
          owner: {
            name: 'Research Team Alpha',
            email: 'team-alpha@company.com'
          },
          sharedAt: '2024-01-08',
          permissions: 'view',
          isActive: false,
          metadata: {
            projectName: 'ML Research Initiative',
            tags: ['machine-learning', 'survey']
          }
        }
      ];
      
      setSharedItems(mockSharedItems);
    } catch (error) {
      console.error('Failed to fetch shared items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = filter === 'all' 
    ? sharedItems 
    : sharedItems.filter(item => item.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return '📁';
      case 'collection': return '📚';
      case 'report': return '📄';
      default: return '📄';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-red-500/10 text-red-400';
      case 'edit': return 'bg-[var(--spotify-green)]/10 text-[var(--spotify-green)]';
      case 'view': return 'bg-[var(--spotify-blue)]/10 text-[var(--spotify-blue)]';
      default: return 'bg-[var(--spotify-medium-gray)]/10 text-[var(--spotify-light-text)]';
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
          title="Shared with me"
          description="Projects, collections, and reports shared by your collaborators"
          breadcrumb={[
            { label: 'Research Hub', href: '/' },
            { label: 'Shared with me', current: true }
          ]}
        />

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-[var(--spotify-dark-gray)] rounded-lg p-1">
            {[
              { key: 'all', label: 'All', count: sharedItems.length },
              { key: 'project', label: 'Projects', count: sharedItems.filter(i => i.type === 'project').length },
              { key: 'collection', label: 'Collections', count: sharedItems.filter(i => i.type === 'collection').length },
              { key: 'report', label: 'Reports', count: sharedItems.filter(i => i.type === 'report').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                    : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Shared Items Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto"></div>
            <p className="text-[var(--spotify-light-text)] mt-2">Loading shared items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 text-[var(--spotify-muted-text)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--spotify-white)] mb-2">
              {filter === 'all' ? 'Nothing shared yet' : `No shared ${filter}s`}
            </h3>
            <p className="text-[var(--spotify-light-text)]">
              When collaborators share {filter === 'all' ? 'content' : filter + 's'} with you, they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-[var(--spotify-dark-gray)] rounded-lg p-6 border transition-all duration-200 hover:bg-[var(--spotify-medium-gray)] ${
                  item.isActive 
                    ? 'border-[var(--spotify-border-gray)]' 
                    : 'border-[var(--spotify-muted-text)]/20 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Type Icon */}
                    <div className="text-3xl">
                      {getTypeIcon(item.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--spotify-white)]">
                          {item.name}
                        </h3>
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(item.permissions)}`}>
                          {item.permissions}
                        </span>
                        
                        {!item.isActive && (
                          <span className="px-2 py-1 text-xs bg-[var(--spotify-muted-text)]/10 text-[var(--spotify-muted-text)] rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[var(--spotify-light-text)] mb-3">
                        {item.description}
                      </p>
                      
                      {/* Owner Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <UserIcon className="h-4 w-4 text-[var(--spotify-muted-text)]" />
                        <span className="text-sm text-[var(--spotify-light-text)]">
                          Shared by {item.owner.name}
                        </span>
                        <span className="text-[var(--spotify-muted-text)]">•</span>
                        <span className="text-sm text-[var(--spotify-muted-text)]">
                          {formatDate(item.sharedAt)}
                        </span>
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-[var(--spotify-muted-text)]">
                        {item.metadata.itemCount && (
                          <span>{item.metadata.itemCount} items</span>
                        )}
                        {item.metadata.projectName && (
                          <span>in {item.metadata.projectName}</span>
                        )}
                        {item.lastAccessed && (
                          <span>Last accessed {formatDate(item.lastAccessed)}</span>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {item.metadata.tags && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="spotifySm"
                      className="inline-flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                    
                    {item.permissions !== 'view' && (
                      <Button
                        variant="spotifySecondary"
                        size="spotifySm"
                        className="inline-flex items-center"
                      >
                        <ShareIcon className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {filteredItems.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 border border-[var(--spotify-border-gray)]">
              <div className="flex items-center">
                <ShareIcon className="h-6 w-6 text-[var(--spotify-green)]" />
                <div className="ml-3">
                  <p className="text-lg font-semibold text-[var(--spotify-white)]">
                    {filteredItems.length}
                  </p>
                  <p className="text-sm text-[var(--spotify-light-text)]">
                    Shared {filter === 'all' ? 'items' : filter + 's'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 border border-[var(--spotify-border-gray)]">
              <div className="flex items-center">
                <UsersIcon className="h-6 w-6 text-[var(--spotify-blue)]" />
                <div className="ml-3">
                  <p className="text-lg font-semibold text-[var(--spotify-white)]">
                    {new Set(filteredItems.map(item => item.owner.email)).size}
                  </p>
                  <p className="text-sm text-[var(--spotify-light-text)]">
                    Collaborators
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 border border-[var(--spotify-border-gray)]">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-[var(--spotify-purple)]" />
                <div className="ml-3">
                  <p className="text-lg font-semibold text-[var(--spotify-white)]">
                    {filteredItems.filter(item => item.isActive).length}
                  </p>
                  <p className="text-sm text-[var(--spotify-light-text)]">
                    Active items
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
