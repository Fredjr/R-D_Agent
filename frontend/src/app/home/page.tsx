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
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    loadRecommendations();
  }, [user, router]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 HOME PAGE: Starting recommendation load for user:', user.user_id);
      console.log('🔄 HOME PAGE: User object:', JSON.stringify(user, null, 2));

      // Try enhanced recommendations first, fallback to regular if needed
      const enhancedUrl = `/api/proxy/recommendations/enhanced/${user.user_id}`;
      console.log('🔄 HOME PAGE: Attempting enhanced recommendations from:', enhancedUrl);
      let response = await fetch(enhancedUrl);

      if (!response.ok) {
        console.warn('⚠️ HOME PAGE: Enhanced recommendations failed with status:', response.status);
        const enhancedErrorText = await response.text();
        console.warn('⚠️ HOME PAGE: Enhanced error details:', enhancedErrorText);

        const fallbackUrl = `/api/proxy/recommendations/weekly/${user.user_id}`;
        console.log('🔄 HOME PAGE: Falling back to regular recommendations from:', fallbackUrl);
        response = await fetch(fallbackUrl);
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
    <div className="min-h-screen bg-[var(--spotify-black)]">
      {/* Top Navigation */}
      <SpotifyTopBar
        title="Home"
        showSearch={true}
        onSearch={(query) => {
          // Navigate to search page with query
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-[var(--spotify-dark-gray)] to-[var(--spotify-black)] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Good {getTimeOfDay()}, {user.first_name || user.username}
              </h1>
              <p className="text-[var(--spotify-light-text)] text-lg">
                Discover new research tailored to your interests
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-[var(--spotify-green)] text-[var(--spotify-green)] hover:bg-[var(--spotify-green)] hover:text-black"
            >
              Refresh Recommendations
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="group p-6 bg-[var(--spotify-dark-gray)] rounded-lg hover:bg-[var(--spotify-gray)] transition-all duration-200 text-left"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                <p className="text-[var(--spotify-light-text)] text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-[var(--spotify-light-text)] mt-4 text-lg">
                Generating your personalized recommendations...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="py-20">
            <ErrorAlert title="Failed to load recommendations">
              <p className="mb-4">{error}</p>
              <Button
                onClick={handleRefresh}
                className="bg-[var(--spotify-green)] text-black hover:bg-[var(--spotify-green-hover)]"
              >
                Try Again
              </Button>
            </ErrorAlert>
          </div>
        ) : recommendations ? (
          (() => {
            console.log('🎨 HOME PAGE: Rendering Enhanced Home Page with data:', JSON.stringify(recommendations, null, 2));
            return (
              <EnhancedHomePage
                recommendations={recommendations}
                onPlay={(paper) => console.log('Playing paper:', paper)}
                onSave={(paper) => console.log('Saving paper:', paper)}
                onShare={(paper) => console.log('Sharing paper:', paper)}
                onSeeAll={(category) => console.log('See all for category:', category)}
              />
            );
          })()
        ) : (
          (() => {
            console.log('⚠️ HOME PAGE: No recommendations to render, recommendations state is:', recommendations);
            return (
              <div className="py-20 text-center">
                <p className="text-[var(--spotify-light-text)] text-lg">
                  No recommendations available at the moment.
                </p>
              </div>
            );
          })()
        )}

        {/* Recent Activity Preview */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="text-[var(--spotify-light-text)] hover:text-white"
            >
              View All →
            </Button>
          </div>
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6">
            <div className="flex items-center text-[var(--spotify-light-text)]">
              <ClockIcon className="w-5 h-5 mr-2" />
              <span>Your recent projects and collections will appear here</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
