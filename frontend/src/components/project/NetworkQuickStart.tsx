'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  FireIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface NetworkQuickStartProps {
  projectId: string;
  className?: string;
  onNavigateToExplore?: () => void; // Callback to switch to explore tab
}

export function NetworkQuickStart({ projectId, className, onNavigateToExplore }: NetworkQuickStartProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectPapers, setProjectPapers] = useState<string[]>([]);

  // Fetch all papers from project collections on mount
  useEffect(() => {
    fetchProjectPapers();
  }, [projectId]);

  const fetchProjectPapers = async () => {
    try {
      // Fetch all collections in the project
      const collectionsResponse = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: { 'User-ID': user?.email || 'default_user' }
      });

      if (!collectionsResponse.ok) {
        console.warn('Failed to fetch collections');
        return;
      }

      const collectionsData = await collectionsResponse.json();
      const collections = Array.isArray(collectionsData) ? collectionsData : (collectionsData.collections || []);

      // Fetch articles from all collections
      const allPmids: string[] = [];
      for (const collection of collections) {
        try {
          const articlesResponse = await fetch(
            `/api/proxy/collections/${collection.collection_id}/articles?projectId=${projectId}&limit=100`,
            { headers: { 'User-ID': user?.email || 'default_user' } }
          );

          if (articlesResponse.ok) {
            const articlesData = await articlesResponse.json();
            const articles = articlesData.articles || [];
            const pmids = articles
              .map((article: any) => article.article_pmid)
              .filter((pmid: string) => pmid && /^\d+$/.test(pmid));
            allPmids.push(...pmids);
          }
        } catch (error) {
          console.error(`Error fetching articles from collection ${collection.collection_id}:`, error);
        }
      }

      // Remove duplicates
      const uniquePmids = Array.from(new Set(allPmids));
      setProjectPapers(uniquePmids);
      console.log(`📚 Loaded ${uniquePmids.length} papers from project collections`);
    } catch (error) {
      console.error('Error fetching project papers:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to explore tab within project workspace
      if (onNavigateToExplore) {
        onNavigateToExplore();
      } else {
        // Fallback to external network page
        router.push(`/explore/network?project=${projectId}&query=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleBrowseTrending = async () => {
    setLoading(true);
    try {
      // Navigate to explore tab within project workspace
      if (onNavigateToExplore) {
        onNavigateToExplore();
      } else {
        // Fallback: navigate to external network page
        // If we have project papers, use them to get context-aware trending
        if (projectPapers.length > 0) {
          // Get trending papers that cite or are cited by project papers
          const response = await fetch(`/api/proxy/recommendations/trending/${user?.email}`, {
            headers: { 'User-ID': user?.email || 'default_user' }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.trending?.[0]?.pmid) {
              router.push(`/explore/network?project=${projectId}&pmid=${data.trending[0].pmid}&context=trending`);
              return;
            }
          }
        }

        // Fallback: just navigate to network explorer with trending filter
        router.push(`/explore/network?project=${projectId}&filter=trending`);
      }
    } catch (error) {
      console.error('Error loading trending papers:', error);
      if (!onNavigateToExplore) {
        router.push(`/explore/network?project=${projectId}&filter=trending`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecentPapers = async () => {
    setLoading(true);
    try {
      // Navigate to explore tab within project workspace
      if (onNavigateToExplore) {
        onNavigateToExplore();
      } else {
        // Fallback: navigate to external network page
        // Use "later than" logic on project papers
        if (projectPapers.length > 0) {
          // Get the most recent paper from project as reference
          const randomPmid = projectPapers[Math.floor(Math.random() * projectPapers.length)];
          // Navigate to network view with "later" (citations) mode
          router.push(`/explore/network?project=${projectId}&pmid=${randomPmid}&mode=later&context=recent`);
        } else {
          // No papers in project, navigate to search
          router.push('/search');
        }
      }
    } catch (error) {
      console.error('Error loading recent papers:', error);
      if (!onNavigateToExplore) {
        router.push('/search');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestions = async () => {
    setLoading(true);
    try {
      // Navigate to explore tab within project workspace
      if (onNavigateToExplore) {
        onNavigateToExplore();
      } else {
        // Fallback: navigate to external network page
        // Get AI recommendations based on project papers
        if (projectPapers.length > 0) {
          const response = await fetch(`/api/proxy/recommendations/papers-for-you/${user?.email}`, {
            headers: { 'User-ID': user?.email || 'default_user' }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.papers_for_you?.[0]?.pmid) {
              router.push(`/explore/network?project=${projectId}&pmid=${data.papers_for_you[0].pmid}&context=ai-suggested`);
              return;
            }
          }
        }

        // Fallback: navigate to network explorer
        router.push(`/explore/network?project=${projectId}&filter=ai-suggested`);
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      if (!onNavigateToExplore) {
        router.push(`/explore/network?project=${projectId}&filter=ai-suggested`);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      id: 'browse-trending',
      label: 'Browse Trending',
      description: projectPapers.length > 0 ? 'Trending papers related to your collection' : 'Popular papers this week',
      icon: FireIcon,
      color: 'from-orange-500 to-red-600',
      onClick: handleBrowseTrending,
      disabled: loading
    },
    {
      id: 'recent-papers',
      label: 'Recent Papers',
      description: projectPapers.length > 0 ? 'Recent citations from your papers' : 'Latest publications',
      icon: ClockIcon,
      color: 'from-blue-500 to-cyan-600',
      onClick: handleRecentPapers,
      disabled: loading
    },
    {
      id: 'ai-suggestions',
      label: 'AI Suggestions',
      description: projectPapers.length > 0 ? `Personalized from ${projectPapers.length} papers` : 'Personalized recommendations',
      icon: SparklesIcon,
      color: 'from-purple-500 to-pink-600',
      onClick: handleAISuggestions,
      disabled: loading
    }
  ];

  return (
    <div className={cn("w-full", className)}>
      {/* Section Header */}
      <div className="mb-6 px-4 sm:px-6">
        <h3 className="text-lg sm:text-xl font-bold text-[var(--spotify-white)] mb-2">
          🔍 Start with a paper
        </h3>
        <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
          Search by title, DOI, or keywords to begin exploring the research network
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--spotify-light-text)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, DOI, or keywords..."
              className={cn(
                "w-full pl-12 pr-4 py-4 rounded-lg",
                "bg-[var(--spotify-dark-gray)] text-[var(--spotify-white)]",
                "border-2 border-transparent",
                "focus:border-[var(--spotify-green)] focus:outline-none",
                "placeholder:text-[var(--spotify-light-text)]",
                "text-sm sm:text-base",
                "transition-all duration-200"
              )}
            />
          </div>
          <button
            type="submit"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "px-4 sm:px-6 py-2 rounded-md",
              "bg-[var(--spotify-green)] text-[var(--spotify-black)]",
              "font-semibold text-sm sm:text-base",
              "hover:scale-105 transition-transform",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={!searchQuery.trim()}
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[var(--spotify-light-text)] text-sm">Or try:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "group relative p-4 rounded-lg text-left",
                  "bg-gradient-to-br", action.color,
                  "hover:scale-105 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/50",
                  action.disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-0.5">
                      {action.label}
                    </h4>
                    <p className="text-white/80 text-xs sm:text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-6 px-4 sm:px-6">
        <div className="flex items-start gap-3 p-4 bg-[var(--spotify-dark-gray)]/50 rounded-lg border border-[var(--spotify-green)]/20">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="text-[var(--spotify-light-text)] text-xs sm:text-sm leading-relaxed">
              <span className="font-semibold text-[var(--spotify-white)]">Tip:</span> The network view shows how papers are connected through citations. 
              Click any paper to see its references and citations, or use filters to focus on specific topics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

