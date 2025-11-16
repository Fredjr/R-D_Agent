'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import MeSHAutocompleteSearch from '@/components/MeSHAutocompleteSearch';
import { Button, LoadingSpinner } from '@/components/ui';
import { UnifiedHeroSection, HeroAction } from '@/components/ui/UnifiedHeroSection';
import { QuickActionsFAB } from '@/components/ui/QuickActionsFAB';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import {
  MagnifyingGlassIcon,
  FireIcon,
  ClockIcon,
  BookmarkIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

function NetworkExplorerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedPMID, setSelectedPMID] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if this is first-time onboarding or if PMID is provided in URL
  useEffect(() => {
    const onboarding = searchParams.get('onboarding');
    const pmidParam = searchParams.get('pmid');
    const filterParam = searchParams.get('filter');
    const contextParam = searchParams.get('context');

    if (onboarding === 'true') {
      setShowOnboardingTooltip(true);
      // Store that user has seen onboarding
      localStorage.setItem('network_explorer_onboarding_seen', 'true');
    }

    if (pmidParam) {
      setSelectedPMID(pmidParam);
      setShowSearch(false);

      // Log context for analytics
      if (contextParam) {
        console.log(`📊 Network loaded from context: ${contextParam}`);
      }
    } else if (filterParam) {
      // Handle filter parameters from project workspace quick actions
      if (filterParam === 'trending') {
        handleBrowseTrending();
      }
      // Note: 'recent' and 'ai-suggested' are handled by the quick action buttons
      // which navigate with a specific PMID
    }
  }, [searchParams]);

  const handlePaperSelected = (pmid: string) => {
    console.log('📄 Paper selected:', pmid);
    setSelectedPMID(pmid);
    setShowSearch(false);
    setError(null);
  };

  const handleBrowseTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/recommendations/trending/${user?.email}`, {
        headers: { 'User-ID': user?.email || 'default_user' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending papers');
      }
      
      const data = await response.json();
      console.log('📊 Trending papers:', data);
      
      if (data.trending?.[0]?.pmid) {
        handlePaperSelected(data.trending[0].pmid);
      } else {
        setError('No trending papers found. Try searching for a specific paper.');
      }
    } catch (err) {
      console.error('Error fetching trending papers:', err);
      setError('Failed to load trending papers. Try searching for a specific paper.');
    } finally {
      setLoading(false);
    }
  };

  const handleMeSHSearch = async (query: string, meshData: any) => {
    console.log('🔍 MeSH search:', query, meshData);
    setLoading(true);
    setError(null);
    
    try {
      // Check if query is a PMID (numeric only)
      if (/^\d+$/.test(query.trim())) {
        handlePaperSelected(query.trim());
        return;
      }

      // Otherwise, perform PubMed search
      const searchQuery = meshData?.meshTerms?.length > 0 
        ? meshData.meshTerms.join(' OR ')
        : query;

      const response = await fetch(`/api/proxy/pubmed/search?query=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { 'User-ID': user?.email || 'default_user' }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log('🔍 Search results:', data);

      if (data.results?.[0]?.pmid) {
        handlePaperSelected(data.results[0].pmid);
      } else {
        setError('No papers found. Try a different search term or PMID.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Hero actions for network explorer
  const heroActions: HeroAction[] = [
    {
      id: 'browse-trending',
      title: 'Browse Trending',
      description: 'Auto-load a trending paper and visualize its network',
      icon: FireIcon,
      gradient: 'from-orange-500 to-red-600',
      onClick: handleBrowseTrending,
      disabled: loading,
      badge: 'Popular'
    },
    {
      id: 'recent-papers',
      title: 'Recent Papers',
      description: 'Search for recently published research',
      icon: ClockIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => router.push('/search')
    },
    {
      id: 'my-collections',
      title: 'My Collections',
      description: 'Explore networks from your saved papers',
      icon: BookmarkIcon,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => router.push('/collections')
    }
  ];

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen bg-[var(--spotify-black)]">
        {/* Unified Hero Section - Only show when no paper is selected */}
        {!selectedPMID && (
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumbs */}
            <div className="mb-4">
              <Breadcrumbs />
            </div>

            <UnifiedHeroSection
              emoji="🌐"
              title="Network Explorer"
              description="Discover how research papers connect through citations, references, and authors"
              actions={heroActions}
              proTip="Click 'Browse Trending' to instantly visualize a popular paper's network, or use the search bar below to find a specific paper by title, PMID, or topic"
            />
          </div>
        )}

        {/* Compact Header (when viewing a network) */}
        {selectedPMID && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedPMID(null);
                    setShowSearch(true);
                  }}
                  className="text-[var(--spotify-light-text)] hover:text-white transition-colors"
                >
                  ← Back to Explorer
                </button>
                <div className="h-4 w-px bg-gray-700"></div>
                <h2 className="text-lg font-semibold text-white">Network View</h2>
              </div>
              <Button
                onClick={() => setShowSearch(!showSearch)}
                variant="outline"
                className="border-[var(--spotify-green)] text-[var(--spotify-green)] hover:bg-[var(--spotify-green)] hover:text-black"
              >
                {showSearch ? 'Hide Search' : 'New Search'}
              </Button>
            </div>
          </div>
        )}

        {/* Search Section */}
        {showSearch && (
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-4">
                Start with a paper
              </h2>
              
              {/* Search Input */}
              <div className="mb-6">
                <MeSHAutocompleteSearch
                  onSearch={handleMeSHSearch}
                  placeholder="Search by PMID, title, DOI, or keywords..."
                  className="w-full"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="md" />
                  <span className="ml-3 text-[var(--spotify-light-text)]">Searching...</span>
                </div>
              )}

              {/* Helper Text */}
              <div className="mt-4 text-sm text-[var(--spotify-light-text)]">
                💡 <strong>Tip:</strong> Enter a PMID (e.g., 12345678) for direct access, or search by keywords to find papers. Use the quick actions above to browse trending or recent papers.
              </div>
            </div>
          </div>
        )}

        {/* Network View */}
        {selectedPMID && !loading && (
          <div className="h-[calc(100vh-250px)] px-4 sm:px-6 lg:px-8 pb-6">
            <MultiColumnNetworkView
              sourceType="article"
              sourceId={selectedPMID}
              projectId={undefined} // No project context - standalone mode
              onArticleSaved={() => {
                console.log('✅ Article saved!');
                // TODO: Show success toast
              }}
              className="h-full"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="xl" />
          </div>
        )}

        {/* Empty State */}
        {!selectedPMID && !loading && !showSearch && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-[var(--spotify-light-text)] mb-4">
                No paper selected. Use the search above to get started.
              </p>
              <Button
                onClick={() => setShowSearch(true)}
                className="bg-[var(--spotify-green)] text-black"
              >
                Show Search
              </Button>
            </div>
          </div>
        )}

        {/* Onboarding Tooltip */}
        {showOnboardingTooltip && selectedPMID && (
          <div className="fixed bottom-20 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-2xl max-w-sm animate-bounce z-50">
            <button
              onClick={() => setShowOnboardingTooltip(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-200"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
            <div className="pr-6">
              <p className="font-semibold mb-2">👋 Welcome to Network Explorer!</p>
              <p className="text-sm mb-3">
                Click on any paper in the network to see its details, citations, references, and similar work.
              </p>
              <Button
                onClick={() => setShowOnboardingTooltip(false)}
                size="sm"
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                Got it!
              </Button>
            </div>
          </div>
        )}

        {/* Floating Save Button - TODO: Implement in next step */}
        {selectedPMID && (
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              onClick={() => {
                // TODO: Open SaveToProjectModal
                console.log('💾 Save to project/collection');
                alert('Save to Project feature coming soon! For now, use the sidebar to add papers to collections.');
              }}
              className="bg-[var(--spotify-green)] text-black hover:bg-[var(--spotify-green)]/90 shadow-2xl px-6 py-3 rounded-full font-semibold"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Save to Project
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions FAB */}
      <QuickActionsFAB />

      {/* Contextual Help */}
      <ContextualHelp />
    </MobileResponsiveLayout>
  );
}

export default function NetworkExplorerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    }>
      <NetworkExplorerContent />
    </Suspense>
  );
}

