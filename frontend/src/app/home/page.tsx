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
import { 
  PlusIcon, 
  FolderIcon, 
  ChartBarIcon,
  MusicalNoteIcon,
  ClockIcon,
  FireIcon,
  BeakerIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

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

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 HOME PAGE: Starting recommendation load for user:', user.user_id);
      console.log('🔄 HOME PAGE: User object:', JSON.stringify(user, null, 2));

      // Try enhanced recommendations first, fallback to regular if needed
      const enhancedUrl = `/api/proxy/recommendations/enhanced/${user.user_id}?t=${Date.now()}`;
      console.log('🔄 HOME PAGE: Attempting enhanced recommendations from:', enhancedUrl);
      let response = await fetch(enhancedUrl, {
        headers: {
          'User-ID': user.user_id,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ HOME PAGE: Enhanced recommendations failed with status:', response.status);
        const enhancedErrorText = await response.text();
        console.warn('⚠️ HOME PAGE: Enhanced error details:', enhancedErrorText);

        const fallbackUrl = `/api/proxy/recommendations/weekly/${user.user_id}`;
        console.log('🔄 HOME PAGE: Falling back to regular recommendations from:', fallbackUrl);
        response = await fetch(fallbackUrl, {
          headers: {
            'User-ID': user.user_id,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HOME PAGE: All recommendations APIs failed. Status:', response.status);
        console.error('❌ HOME PAGE: Error details:', errorText);
        throw new Error(`Failed to load recommendations: ${response.status} - ${errorText}`);
      }

      console.log('✅ HOME PAGE: API request successful, status:', response.status);

      const data = await response.json();
      console.log('✅ HOME PAGE: Raw API response:', JSON.stringify(data, null, 2));

      // Debug: Check the structure of each recommendation section
      console.log('🔍 HOME PAGE: Analyzing recommendation structure...');
      console.log('📚 papers_for_you type:', typeof data.recommendations?.papers_for_you, 'isArray:', Array.isArray(data.recommendations?.papers_for_you));
      console.log('📚 papers_for_you content:', data.recommendations?.papers_for_you);
      console.log('🔥 trending_in_field type:', typeof data.recommendations?.trending_in_field, 'isArray:', Array.isArray(data.recommendations?.trending_in_field));
      console.log('🔥 trending_in_field content:', data.recommendations?.trending_in_field);
      console.log('🔬 cross_pollination type:', typeof data.recommendations?.cross_pollination, 'isArray:', Array.isArray(data.recommendations?.cross_pollination));
      console.log('🔬 cross_pollination content:', data.recommendations?.cross_pollination);
      console.log('💡 citation_opportunities type:', typeof data.recommendations?.citation_opportunities, 'isArray:', Array.isArray(data.recommendations?.citation_opportunities));
      console.log('💡 citation_opportunities content:', data.recommendations?.citation_opportunities);

      // Transform the data structure to match what SpotifyRecommendations expects
      // Handle both enhanced API format (direct arrays) and backend service format (nested under 'papers')
      const transformedData = {
        papers_for_you: Array.isArray(data.recommendations?.papers_for_you)
          ? data.recommendations.papers_for_you
          : data.recommendations?.papers_for_you?.papers || [],
        trending: Array.isArray(data.recommendations?.trending_in_field)
          ? data.recommendations.trending_in_field
          : data.recommendations?.trending_in_field?.papers || [],
        cross_pollination: Array.isArray(data.recommendations?.cross_pollination)
          ? data.recommendations.cross_pollination
          : data.recommendations?.cross_pollination?.papers || [],
        citation_opportunities: Array.isArray(data.recommendations?.citation_opportunities)
          ? data.recommendations.citation_opportunities
          : data.recommendations?.citation_opportunities?.papers || [],
        user_insights: data.user_insights || {
          primary_domains: [],
          activity_level: 'moderate',
          research_velocity: 'steady',
          total_saved_papers: 0
        }
      };

      // Check if we got empty recommendations
      const totalRecommendations = transformedData.papers_for_you.length +
                                  transformedData.trending.length +
                                  transformedData.cross_pollination.length +
                                  transformedData.citation_opportunities.length;

      console.log('📊 HOME PAGE: Recommendation counts after transformation:');
      console.log('📚 Papers for You:', transformedData.papers_for_you.length, 'items');
      console.log('🔥 Trending:', transformedData.trending.length, 'items');
      console.log('🔬 Cross-pollination:', transformedData.cross_pollination.length, 'items');
      console.log('💡 Citation Opportunities:', transformedData.citation_opportunities.length, 'items');
      console.log('📈 Total recommendations:', totalRecommendations);

      if (totalRecommendations === 0) {
        console.warn('⚠️ HOME PAGE: No recommendations returned. User profile may be incomplete or no saved articles found.');
      }

      // Debug: Sample the first item from each section to verify structure
      if (transformedData.papers_for_you.length > 0) {
        console.log('🔍 HOME PAGE: Sample Papers for You item:', JSON.stringify(transformedData.papers_for_you[0], null, 2));
      }
      if (transformedData.trending.length > 0) {
        console.log('🔍 HOME PAGE: Sample Trending item:', JSON.stringify(transformedData.trending[0], null, 2));
      }
      if (transformedData.cross_pollination.length > 0) {
        console.log('🔍 HOME PAGE: Sample Cross-pollination item:', JSON.stringify(transformedData.cross_pollination[0], null, 2));
      }
      if (transformedData.citation_opportunities.length > 0) {
        console.log('🔍 HOME PAGE: Sample Citation Opportunity item:', JSON.stringify(transformedData.citation_opportunities[0], null, 2));
      }

      console.log('🔄 HOME PAGE: Final transformed data for SpotifyRecommendations:', JSON.stringify(transformedData, null, 2));
      setRecommendations(transformedData);
    } catch (err) {
      console.error('❌ HOME PAGE: Failed to load recommendations. Error details:', err);
      console.error('❌ HOME PAGE: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      console.error('❌ HOME PAGE: Error type:', typeof err);
      console.error('❌ HOME PAGE: Error stringified:', JSON.stringify(err, null, 2));

      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
      console.error('❌ HOME PAGE: Setting error state to:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('🏁 HOME PAGE: Recommendation loading completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

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

            {/* Enhanced Search Interface */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search MeSH terms, topics, or enter PMIDs..."
                  className="w-full bg-[var(--spotify-black)] border border-[var(--spotify-border-gray)] rounded-lg px-4 py-3 text-white placeholder-[var(--spotify-muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)] focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <ChartBarIcon className="w-5 h-5 text-[var(--spotify-muted-text)]" />
                </div>
              </div>

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
