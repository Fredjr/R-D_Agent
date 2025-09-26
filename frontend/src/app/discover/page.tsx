'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { SpotifyCleanSection } from '@/components/ui/SpotifyCleanSection';
import { LoadingSpinner, ErrorAlert } from '@/components/ui';
import { 
  MusicalNoteIcon, 
  FireIcon, 
  BeakerIcon, 
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface WeeklyRecommendations {
  status: string;
  week_of: string;
  user_id: string;
  project_id?: string;
  recommendations: {
    papers_for_you: any;
    trending_in_field: any;
    cross_pollination: any;
    citation_opportunities: any;
  };
  user_insights: {
    research_domains: string[];
    activity_level: string;
    discovery_preference: string;
    collaboration_tendency: number;
  };
  generated_at: string;
  next_update: string;
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<WeeklyRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    fetchWeeklyRecommendations();
  }, [user, selectedProject]);

  const fetchWeeklyRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 DISCOVER PAGE: Starting recommendation load for user:', user.email);
      console.log('🔄 DISCOVER PAGE: Selected project:', selectedProject);
      console.log('🔄 DISCOVER PAGE: User object:', JSON.stringify(user, null, 2));

      // Try enhanced recommendations first, fallback to regular if needed
      let url = selectedProject
        ? `/api/proxy/recommendations/enhanced/${user.email}?project_id=${selectedProject}`
        : `/api/proxy/recommendations/enhanced/${user.email}`;

      console.log('🔄 DISCOVER PAGE: Attempting enhanced recommendations from:', url);
      let response = await fetch(url, {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('⚠️ DISCOVER PAGE: Enhanced recommendations failed with status:', response.status);
        const enhancedErrorText = await response.text();
        console.warn('⚠️ DISCOVER PAGE: Enhanced error details:', enhancedErrorText);

        url = selectedProject
          ? `/api/proxy/recommendations/weekly/${user.email}?project_id=${selectedProject}`
          : `/api/proxy/recommendations/weekly/${user.email}`;

        console.log('🔄 DISCOVER PAGE: Falling back to regular recommendations from:', url);
        response = await fetch(url, {
          headers: {
            'User-ID': user.email,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DISCOVER PAGE: All recommendations APIs failed. Status:', response.status);
        console.error('❌ DISCOVER PAGE: Error details:', errorText);
        throw new Error(`Failed to fetch recommendations: ${response.status} - ${errorText}`);
      }

      console.log('✅ DISCOVER PAGE: API request successful, status:', response.status);

      const data = await response.json();
      console.log('✅ DISCOVER PAGE: Raw API response:', JSON.stringify(data, null, 2));

      if (data.status === 'error') {
        console.error('❌ DISCOVER PAGE: API returned error status:', data.error);
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      // Debug: Analyze the structure of recommendations
      console.log('🔍 DISCOVER PAGE: Analyzing recommendation structure...');
      if (data.recommendations) {
        console.log('📚 papers_for_you structure:', {
          type: typeof data.recommendations.papers_for_you,
          isArray: Array.isArray(data.recommendations.papers_for_you),
          hasTitle: data.recommendations.papers_for_you?.title,
          hasDescription: data.recommendations.papers_for_you?.description,
          hasPapers: data.recommendations.papers_for_you?.papers,
          papersLength: data.recommendations.papers_for_you?.papers?.length || 0,
          content: data.recommendations.papers_for_you
        });

        console.log('🔥 trending_in_field structure:', {
          type: typeof data.recommendations.trending_in_field,
          isArray: Array.isArray(data.recommendations.trending_in_field),
          hasTitle: data.recommendations.trending_in_field?.title,
          hasDescription: data.recommendations.trending_in_field?.description,
          hasPapers: data.recommendations.trending_in_field?.papers,
          papersLength: data.recommendations.trending_in_field?.papers?.length || 0,
          content: data.recommendations.trending_in_field
        });

        console.log('🔬 cross_pollination structure:', {
          type: typeof data.recommendations.cross_pollination,
          isArray: Array.isArray(data.recommendations.cross_pollination),
          hasTitle: data.recommendations.cross_pollination?.title,
          hasDescription: data.recommendations.cross_pollination?.description,
          hasPapers: data.recommendations.cross_pollination?.papers,
          papersLength: data.recommendations.cross_pollination?.papers?.length || 0,
          content: data.recommendations.cross_pollination
        });

        console.log('💡 citation_opportunities structure:', {
          type: typeof data.recommendations.citation_opportunities,
          isArray: Array.isArray(data.recommendations.citation_opportunities),
          hasTitle: data.recommendations.citation_opportunities?.title,
          hasDescription: data.recommendations.citation_opportunities?.description,
          hasPapers: data.recommendations.citation_opportunities?.papers,
          papersLength: data.recommendations.citation_opportunities?.papers?.length || 0,
          content: data.recommendations.citation_opportunities
        });
      }

      // Debug: Sample items from each section
      if (data.recommendations?.papers_for_you?.papers?.length > 0) {
        console.log('🔍 DISCOVER PAGE: Sample Papers for You item:', JSON.stringify(data.recommendations.papers_for_you.papers[0], null, 2));
      }
      if (data.recommendations?.trending_in_field?.papers?.length > 0) {
        console.log('🔍 DISCOVER PAGE: Sample Trending item:', JSON.stringify(data.recommendations.trending_in_field.papers[0], null, 2));
      }
      if (data.recommendations?.cross_pollination?.papers?.length > 0) {
        console.log('🔍 DISCOVER PAGE: Sample Cross-pollination item:', JSON.stringify(data.recommendations.cross_pollination.papers[0], null, 2));
      }
      if (data.recommendations?.citation_opportunities?.papers?.length > 0) {
        console.log('🔍 DISCOVER PAGE: Sample Citation Opportunity item:', JSON.stringify(data.recommendations.citation_opportunities.papers[0], null, 2));
      }

      console.log('📊 DISCOVER PAGE: Total recommendations count:');
      console.log('📚 Papers for You:', data.recommendations?.papers_for_you?.papers?.length || 0);
      console.log('🔥 Trending:', data.recommendations?.trending_in_field?.papers?.length || 0);
      console.log('🔬 Cross-pollination:', data.recommendations?.cross_pollination?.papers?.length || 0);
      console.log('💡 Citation Opportunities:', data.recommendations?.citation_opportunities?.papers?.length || 0);

      console.log('🔄 DISCOVER PAGE: Setting recommendations state with data:', JSON.stringify(data, null, 2));
      setRecommendations(data);
    } catch (err: any) {
      console.error('❌ DISCOVER PAGE: Failed to load recommendations. Error details:', err);
      console.error('❌ DISCOVER PAGE: Error stack:', err?.stack || 'No stack trace');
      console.error('❌ DISCOVER PAGE: Error type:', typeof err);
      console.error('❌ DISCOVER PAGE: Error stringified:', JSON.stringify(err, null, 2));

      const errorMessage = err?.message || 'Failed to load recommendations';
      console.error('❌ DISCOVER PAGE: Setting error state to:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('🏁 DISCOVER PAGE: Recommendation loading completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWeeklyRecommendations();
    setRefreshing(false);
  };

  const handlePlayPaper = (paper: any) => {
    // Navigate to paper details or open in new tab
    if (paper.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
    }
  };

  const handleSavePaper = async (paper: any) => {
    // TODO: Implement save to collection functionality
    console.log('Save paper:', paper);
  };

  const handleSharePaper = (paper: any) => {
    // Copy paper URL to clipboard
    const url = paper.pmid 
      ? `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`
      : '#';
    
    navigator.clipboard.writeText(url).then(() => {
      // TODO: Show toast notification
      console.log('Paper URL copied to clipboard');
    });
  };

  const handleSeeAll = (category: string) => {
    // Navigate to category-specific page
    const categoryMap: { [key: string]: string } = {
      'Papers for You': 'papers-for-you',
      'Trending in Your Field': 'trending',
      'Cross-pollination': 'cross-pollination',
      'Citation Opportunities': 'citation-opportunities'
    };
    
    const route = categoryMap[category];
    if (route) {
      router.push(`/discover/${route}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="text-[var(--spotify-light-text)] mt-4">
            Generating your personalized recommendations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] p-8">
        <div className="max-w-4xl mx-auto">
          <ErrorAlert title="Failed to load recommendations">
            <p className="mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-[var(--spotify-green)] text-black rounded-lg hover:bg-[var(--spotify-green-hover)] transition-colors"
            >
              Try Again
            </button>
          </ErrorAlert>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <div className="text-center text-[var(--spotify-light-text)]">
          <BeakerIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Mobile-friendly header */}
        <div className="mb-6 sm:mb-8 px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Discover</h1>
          <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
            Personalized research recommendations for you
          </p>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-[var(--spotify-green)] text-black rounded-full font-medium hover:scale-105 transition-transform disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Clean Recommendation Sections */}
        <div className="space-y-8">
          {/* Papers for You */}
          {(() => {
            const papersForYou = recommendations.recommendations.papers_for_you;
            const papers = Array.isArray(papersForYou) ? papersForYou : papersForYou?.papers || [];

            if (papers.length > 0) {
              const sectionData = {
                title: "Made for You",
                description: "Personalized recommendations based on your research",
                papers: papers,
                updated: "Today",
                icon: MusicalNoteIcon,
                color: "#1db954",
                category: "papers_for_you"
              };

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                  showPersonalizedGreeting={true}
                  userName={(user as any)?.name || user?.email?.split('@')[0] || 'Researcher'}
                />
              );
            }
            return null;
          })()}

          {/* Trending in Field */}
          {(() => {
            const trendingPapers = recommendations.recommendations.trending_in_field;
            const papers = Array.isArray(trendingPapers) ? trendingPapers : trendingPapers?.papers || [];

            if (papers.length > 0) {
              const sectionData = {
                title: "Trending in Your Field",
                description: "Popular papers in your research area",
                papers: papers,
                updated: "Today",
                icon: FireIcon,
                color: "#ff6b35",
                category: "trending_in_field"
              };

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            }
            return null;
          })()}

          {/* Cross-Pollination */}
          {(() => {
            const crossPollination = recommendations.recommendations.cross_pollination;
            const papers = Array.isArray(crossPollination) ? crossPollination : crossPollination?.papers || [];

            if (papers.length > 0) {
              const sectionData = {
                title: "Cross-Pollination",
                description: "Discover connections across research domains",
                papers: papers,
                updated: "Today",
                icon: BeakerIcon,
                color: "#8b5cf6",
                category: "cross_pollination"
              };

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            }
            return null;
          })()}

          {/* Citation Opportunities */}
          {(() => {
            const citationOpportunities = recommendations.recommendations.citation_opportunities;
            const papers = Array.isArray(citationOpportunities) ? citationOpportunities : citationOpportunities?.papers || [];

            if (papers.length > 0) {
              const sectionData = {
                title: "Citation Opportunities",
                description: "Papers that could enhance your research",
                papers: papers,
                updated: "Today",
                icon: LightBulbIcon,
                color: "#f59e0b",
                category: "citation_opportunities"
              };

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            }
            return null;
          })()}
        </div>


        {/* Refresh Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              Your Research Discovery
            </h2>
            {selectedProject && (
              <span className="px-3 py-1 bg-[var(--spotify-dark-gray)] text-[var(--spotify-light-text)] rounded-full text-sm">
                Project Context
              </span>
            )}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--spotify-dark-gray)] text-white rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Recommendation Sections */}
        <div className="space-y-12">
          {/* Papers for You */}
          {(() => {
            // Handle both enhanced API format (direct array) and backend service format (nested under 'papers')
            const papersForYou = recommendations.recommendations.papers_for_you;
            const papers = Array.isArray(papersForYou) ? papersForYou : papersForYou?.papers || [];

            console.log('🔍 DISCOVER PAGE: Papers for You check - isArray:', Array.isArray(papersForYou), 'papers length:', papers.length);
            console.log('🔍 DISCOVER PAGE: Papers for You data structure:', papersForYou);

            if (papers.length > 0) {
              const sectionData = {
                title: "Papers for You",
                description: "Personalized recommendations based on your research",
                updated: "21/09/2025 • Based on your recent activity and saved papers",
                refresh_reason: "Updated based on your research activity and saved papers",
                papers: papers
              };

              console.log('🎨 DISCOVER PAGE: Rendering Papers for You section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyRecommendationSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            } else {
              console.log('⚠️ DISCOVER PAGE: Papers for You section not rendered - no papers or empty array');
              return null;
            }
          })()}

          {/* Trending in Your Field */}
          {(() => {
            // Handle both enhanced API format (direct array) and backend service format (nested under 'papers')
            const trendingInField = recommendations.recommendations.trending_in_field;
            const papers = Array.isArray(trendingInField) ? trendingInField : trendingInField?.papers || [];

            console.log('🔍 DISCOVER PAGE: Trending check - isArray:', Array.isArray(trendingInField), 'papers length:', papers.length);
            console.log('🔍 DISCOVER PAGE: Trending data structure:', trendingInField);

            if (papers.length > 0) {
              const sectionData = {
                title: "Trending in Your Field",
                description: "Hot topics gaining attention in your research area",
                updated: "21/09/2025 • Latest trends and breakthrough discoveries",
                refresh_reason: "Updated with latest trending research in your field",
                papers: papers
              };

              console.log('🎨 DISCOVER PAGE: Rendering Trending section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyRecommendationSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            } else {
              console.log('⚠️ DISCOVER PAGE: Trending section not rendered - no papers or empty array');
              return null;
            }
          })()}

          {/* Cross-pollination */}
          {(() => {
            // Handle both enhanced API format (direct array) and backend service format (nested under 'papers')
            const crossPollination = recommendations.recommendations.cross_pollination;
            const papers = Array.isArray(crossPollination) ? crossPollination : crossPollination?.papers || [];

            console.log('🔍 DISCOVER PAGE: Cross-pollination check - isArray:', Array.isArray(crossPollination), 'papers length:', papers.length);

            if (papers.length > 0) {
              const sectionData = {
                title: "Cross-pollination",
                description: "Interdisciplinary discoveries and new perspectives",
                updated: "21/09/2025 • Exploring connections across research domains",
                refresh_reason: "Updated with interdisciplinary research opportunities",
                papers: papers
              };

              console.log('🎨 DISCOVER PAGE: Rendering Cross-pollination section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyRecommendationSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            } else {
              console.log('⚠️ DISCOVER PAGE: Cross-pollination section not rendered - no papers or empty array');
              return null;
            }
          })()}

          {/* Citation Opportunities */}
          {(() => {
            // Handle both enhanced API format (direct array) and backend service format (nested under 'papers')
            const citationOpportunities = recommendations.recommendations.citation_opportunities;
            const papers = Array.isArray(citationOpportunities) ? citationOpportunities : citationOpportunities?.papers || [];

            console.log('🔍 DISCOVER PAGE: Citation Opportunities check - isArray:', Array.isArray(citationOpportunities), 'papers length:', papers.length);

            if (papers.length > 0) {
              const sectionData = {
                title: "Citation Opportunities",
                description: "Papers that could benefit from your expertise",
                updated: "21/09/2025 • Recent papers in your field with citation gaps",
                refresh_reason: "Updated with papers that could benefit from your research",
                papers: papers
              };

              console.log('🎨 DISCOVER PAGE: Rendering Citation Opportunities section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyRecommendationSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onSeeAll={handleSeeAll}
                />
              );
            } else {
              console.log('⚠️ DISCOVER PAGE: Citation Opportunities section not rendered - no papers or empty array');
              return null;
            }
          })()}
        </div>

        {/* Next Update Info */}
        <div className="mt-16 p-6 bg-[var(--spotify-dark-gray)] rounded-lg border border-[var(--spotify-border-gray)]">
          <div className="flex items-center gap-3 mb-2">
            <MusicalNoteIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            <h3 className="text-white font-medium">Weekly Updates</h3>
          </div>
          <p className="text-[var(--spotify-light-text)] text-sm">
            Your recommendations refresh every Monday based on your latest research activity.
            Next update: {new Date(recommendations.next_update).toLocaleDateString()}
          </p>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
