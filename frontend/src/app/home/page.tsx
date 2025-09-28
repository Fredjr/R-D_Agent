'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/Alert';
import { SpotifyRecommendations } from '@/components/ui/SpotifyRecommendations';
import { SpotifyTopBar } from '@/components/ui/SpotifyNavigation';
import { EnhancedHomePage } from '@/components/ui/EnhancedHomePage';
import { Button } from '@/components/ui/Button';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import MeSHAutocompleteSearch from '@/components/MeSHAutocompleteSearch';
import {
  PlusIcon,
  FolderIcon,
  ChartBarIcon,
  MusicalNoteIcon,
  ClockIcon,
  FireIcon,
  BeakerIcon,
  LightBulbIcon,
  SparklesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';

interface RecommendationData {
  papers_for_you: any[];
  trending: any[];
  cross_pollination: any[];
  citation_opportunities: any[];
  user_insights: {
    primary_domains: string[];
    activity_level: string;
    research_velocity: string;
    total_saved_papers: number;
  };
}

// API response structure (what we get from the backend)
interface ApiRecommendationResponse {
  recommendations: {
    papers_for_you: any[];
    trending_in_field: any[];
    cross_pollination: any[];
    citation_opportunities: any[];
  };
  user_insights: {
    primary_domains: string[];
    activity_level: string;
    research_velocity: string;
    total_saved_papers: number;
  };
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Initialize real-time analytics
  const { trackEvent, trackRecommendationInteraction } = useRealTimeAnalytics('home');

  // Removed recommendations state - now handled by Discover page

  const quickActions: QuickAction[] = [
    {
      title: "Create New Project",
      description: "Start a new research project",
      icon: PlusIcon,
      href: "/project/new",
      color: "bg-[var(--spotify-green)]"
    },
    {
      title: "Browse Projects",
      description: "View all your projects",
      icon: FolderIcon,
      href: "/dashboard",
      color: "bg-blue-600"
    },
    {
      title: "Search Papers",
      description: "Find research papers",
      icon: ChartBarIcon,
      href: "/search",
      color: "bg-purple-600"
    },
    {
      title: "Collections",
      description: "Manage your collections",
      icon: MusicalNoteIcon,
      href: "/collections",
      color: "bg-orange-600"
    }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Check if user registration is complete
    if (user.registration_completed === false) {
      console.log('⚠️ User registration incomplete, redirecting to complete profile');
      router.push('/auth/complete-profile');
      return;
    }

    // Home page now focuses on research - recommendations moved to Discover
  }, [user, router]);

  // Handler for MeSH search
  const handleMeSHSearch = async (query: string, suggestions: any) => {
    console.log('🏠 [Home Page] MeSH search triggered:', {
      query,
      mesh_terms: suggestions?.mesh_terms?.length || 0,
      trending_keywords: suggestions?.trending_keywords?.length || 0,
      suggested_queries: suggestions?.suggested_queries?.length || 0,
      total_suggestions: suggestions?.total_suggestions || 0
    });

    // Redirect to search page with query and MeSH data
    const searchParams = new URLSearchParams({
      q: query
    });

    // Store MeSH data in sessionStorage for the search page to use
    if (suggestions) {
      sessionStorage.setItem('meshSearchData', JSON.stringify({
        query,
        mesh_terms: suggestions.mesh_terms || [],
        trending_keywords: suggestions.trending_keywords || [],
        suggested_queries: suggestions.suggested_queries || []
      }));
    }

    console.log('🏠 [Home Page] Redirecting to search page with MeSH-enhanced query:', query);
    router.push(`/search?${searchParams.toString()}`);
  };

  // Handler for generate-review from search
  const handleGenerateReviewFromSearch = async (query: string, optimizedQuery?: any) => {
    console.log('🏠 [Home Page] Generate-review triggered from MeSH search:', {
      query,
      optimizedQuery,
      hasOptimizedQuery: !!optimizedQuery,
      optimizedQueryType: optimizedQuery?.type,
      meshId: optimizedQuery?.mesh_id
    });

    // Use the optimized query if available, otherwise use the original query
    const searchQuery = optimizedQuery?.query || query;
    const objective = optimizedQuery?.description || `Comprehensive review of ${query}`;

    console.log('🏠 [Home Page] Final query parameters:', {
      searchQuery,
      objective,
      originalQuery: query
    });

    // Redirect to project creation with generate-review
    const params = new URLSearchParams({
      action: 'generate-review',
      query: searchQuery,
      objective: objective
    });

    console.log('🏠 [Home Page] Navigating to project creation with params:', params.toString());
    router.push(`/project/new?${params.toString()}`);
  };

  // Removed loadRecommendations function - home page now focuses on research

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <MobileResponsiveLayout>
      {/* Header */}
      <div className="bg-gradient-to-b from-[var(--spotify-dark-gray)] to-[var(--spotify-black)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full max-w-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">
                Good {getTimeOfDay()}, {user.first_name || user.username}
              </h1>
              <p className="text-[var(--spotify-light-text)] text-base sm:text-lg">
                Discover new research tailored to your interests
              </p>
            </div>
            <Button
              onClick={() => router.push('/discover')}
              variant="outline"
              size="sm"
              className="border-[var(--spotify-green)] text-[var(--spotify-green)] hover:bg-[var(--spotify-green)] hover:text-black flex-shrink-0 w-full sm:w-auto"
            >
              Discover →
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Quick Actions */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="group p-4 sm:p-6 bg-[var(--spotify-dark-gray)] rounded-lg hover:bg-[var(--spotify-gray)] transition-all duration-200 text-left w-full"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base truncate">{action.title}</h3>
                <p className="text-[var(--spotify-light-text)] text-xs sm:text-sm line-clamp-2">{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Research Hub Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Start Your Research</h2>
            <p className="text-[var(--spotify-light-text)] mb-6">
              Search medical literature with intelligent autocomplete and semantic discovery
            </p>

            {/* Enhanced Search Interface with MeSH Autocomplete */}
            <div className="space-y-4">
              <MeSHAutocompleteSearch
                onSearch={handleMeSHSearch}
                onGenerateReview={handleGenerateReviewFromSearch}
                placeholder="Search MeSH terms, topics, or enter PMIDs..."
                className="w-full"
              />

              {/* Quick Search Suggestions */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-[var(--spotify-light-text)]">Try:</span>
                {['immune checkpoint inhibitors', 'CRISPR gene editing', 'diabetes treatment', 'cancer immunotherapy'].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="px-3 py-1 bg-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] rounded-full text-sm hover:bg-[var(--spotify-light-gray)] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Search Options */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center text-sm text-[var(--spotify-light-text)]">
                  <input type="checkbox" className="mr-2 rounded" />
                  Recent papers only (2024-2025)
                </label>
                <label className="flex items-center text-sm text-[var(--spotify-light-text)]">
                  <input type="checkbox" className="mr-2 rounded" />
                  High-impact journals
                </label>
                <label className="flex items-center text-sm text-[var(--spotify-light-text)]">
                  <input type="checkbox" className="mr-2 rounded" />
                  Review articles
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Semantic Recommendations Preview */}
        <section className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                <SparklesIcon className="w-6 h-6 mr-2 text-[var(--spotify-green)]" />
                AI-Powered Recommendations
              </h2>
              <p className="text-[var(--spotify-light-text)] text-sm mt-1">
                Semantic analysis of your research interests
              </p>
            </div>
            <Button
              onClick={() => router.push('/discover')}
              variant="outline"
              size="sm"
              className="text-[var(--spotify-light-text)] hover:text-white self-start sm:self-auto"
            >
              Explore More →
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cross-Domain Suggestions */}
            <div
              className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg p-4 sm:p-6 border border-purple-500/30 cursor-pointer hover:border-purple-400/50 transition-colors"
              onClick={() => {
                trackEvent('cross_domain_click', { source: 'home_recommendations' });
                router.push('/discover?mode=cross_domain&query=machine learning biomedical research');
              }}
            >
              <div className="flex items-center mb-3">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-purple-400" />
                <h3 className="text-white font-medium">Cross-Domain</h3>
              </div>
              <p className="text-[var(--spotify-light-text)] text-sm mb-3">
                Discover connections between machine learning and biomedical research
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-purple-500/20 px-2 py-1 rounded text-xs text-purple-300">12 new papers</span>
                <span className="text-xs text-purple-400 hover:text-purple-300">Click to explore →</span>
              </div>
            </div>

            {/* Trending in Your Field */}
            <div
              className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-lg p-4 sm:p-6 border border-orange-500/30 cursor-pointer hover:border-orange-400/50 transition-colors"
              onClick={() => {
                trackEvent('trending_click', { source: 'home_recommendations' });
                router.push('/discover?mode=trending&query=diabetes pharmacology');
              }}
            >
              <div className="flex items-center mb-3">
                <FireIcon className="w-5 h-5 mr-2 text-orange-400" />
                <h3 className="text-white font-medium">Trending Now</h3>
              </div>
              <p className="text-[var(--spotify-light-text)] text-sm mb-3">
                Hot topics in your research domains with semantic similarity
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-orange-500/20 px-2 py-1 rounded text-xs text-orange-300">8 trending papers</span>
                <span className="text-xs text-orange-400 hover:text-orange-300">Click to explore →</span>
              </div>
            </div>

            {/* Personalized Picks */}
            <div
              className="bg-gradient-to-br from-green-600/20 to-teal-600/20 rounded-lg p-4 sm:p-6 border border-green-500/30 cursor-pointer hover:border-green-400/50 transition-colors"
              onClick={() => {
                trackEvent('personalized_click', { source: 'home_recommendations' });
                router.push('/discover?mode=personalized&query=clinical medicine nephrology');
              }}
            >
              <div className="flex items-center mb-3">
                <LightBulbIcon className="w-5 h-5 mr-2 text-green-400" />
                <h3 className="text-white font-medium">For You</h3>
              </div>
              <p className="text-[var(--spotify-light-text)] text-sm mb-3">
                Curated based on your reading history and semantic preferences
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-300">15 personalized</span>
                <span className="text-xs text-green-400 hover:text-green-300">Click to explore →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity Preview */}
        <section className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Activity</h2>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              size="sm"
              className="text-[var(--spotify-light-text)] hover:text-white self-start sm:self-auto"
            >
              View All →
            </Button>
          </div>
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 sm:p-6">
            <div className="flex items-center text-[var(--spotify-light-text)]">
              <ClockIcon className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">Your recent projects and collections will appear here</span>
            </div>
          </div>
        </section>
      </div>
    </MobileResponsiveLayout>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
