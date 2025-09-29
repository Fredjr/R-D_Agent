'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { SpotifyCleanSection } from '@/components/ui/SpotifyCleanSection';
import { LoadingSpinner, ErrorAlert } from '@/components/ui';
import {
  MusicalNoteIcon,
  FireIcon,
  BeakerIcon,
  LightBulbIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

// Import semantic systems
import { SemanticPaperFilter, FilterCriteria } from '@/lib/semantic-filtering';
import { SemanticSearchEngine, SemanticSearchQuery } from '@/lib/semantic-search';
import { PersonalizedRecommendationEngine, RecommendationContext } from '@/lib/recommendation-engine';
import { CrossDomainDiscoveryEngine } from '@/lib/cross-domain-discovery';
import SemanticDiscoveryInterface from '@/components/SemanticDiscoveryInterface';
import SemanticRecommendationSections from '@/components/SemanticRecommendationSections';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { weeklyMixAutomation } from '@/lib/weekly-mix-automation';
import { useWeeklyMixIntegration } from '@/hooks/useWeeklyMixIntegration';

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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function DiscoverPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recommendations, setRecommendations] = useState<WeeklyRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Enhanced semantic discovery state with 3 recommendation types
  const [activeDiscoveryMode, setActiveDiscoveryMode] = useState<'recommendations' | 'semantic_search' | 'cross_domain' | 'smart_filters' | 'trending' | 'for_you' | 'cross_domain_discoveries'>('recommendations');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});
  const [crossDomainOpportunities, setCrossDomainOpportunities] = useState<any[]>([]);
  const [semanticResults, setSemanticResults] = useState<any[]>([]);

  // Separate states for the 3 semantic recommendation types
  const [semanticRecommendations, setSemanticRecommendations] = useState<{
    crossDomain: { papers: any[], loading: boolean, error: string | null };
    trending: { papers: any[], loading: boolean, error: string | null };
    personalized: { papers: any[], loading: boolean, error: string | null };
  }>({
    crossDomain: { papers: [], loading: false, error: null },
    trending: { papers: [], loading: false, error: null },
    personalized: { papers: [], loading: false, error: null }
  });

  // Initialize semantic engines
  const [semanticFilter] = useState(() => new SemanticPaperFilter());
  const [semanticSearch] = useState(() => new SemanticSearchEngine());
  const [recommendationEngine] = useState(() => new PersonalizedRecommendationEngine());
  const [crossDomainEngine] = useState(() => new CrossDomainDiscoveryEngine());

  // Initialize real-time analytics
  const {
    trackEvent,
    trackPaperView,
    trackSearch,
    trackSemanticFeatureUsage,
    trackRecommendationInteraction
  } = useRealTimeAnalytics('discover');

  // Initialize weekly mix integration
  const {
    trackDiscoverSearch,
    trackSemanticSearch,
    trackPaperView: trackPaperViewWeeklyMix,
    forceWeeklyMixUpdate
  } = useWeeklyMixIntegration();

  // Handle URL parameters from Home page navigation
  useEffect(() => {
    const mode = searchParams.get('mode');
    const query = searchParams.get('query');
    const category = searchParams.get('category');

    console.log('🔍 DISCOVER: URL params detected:', { mode, query, category });

    if (mode && query) {
      // Set the discovery mode based on URL parameter
      if (mode === 'semantic_search') {
        setActiveDiscoveryMode('semantic_search');
        setSemanticQuery(query);

        // Automatically trigger semantic search
        handleSemanticSearch(query, category);
      } else if (mode === 'cross_domain') {
        setActiveDiscoveryMode('cross_domain');
        setSemanticQuery(query);
      } else if (mode === 'trending' || mode === 'personalized') {
        setActiveDiscoveryMode('semantic_search');
        setSemanticQuery(query);
        handleSemanticSearch(query, category);
      }

      // Track the navigation from Home page
      trackEvent('home_navigation', {
        mode,
        query,
        category,
        source: 'home_page_recommendations'
      });
    }

    // Handle specific recommendation section navigation from Home page
    if (category) {
      if (category === 'trending') {
        setActiveDiscoveryMode('trending');
        loadTrendingRecommendations();
      } else if (category === 'for_you') {
        setActiveDiscoveryMode('for_you');
        loadForYouRecommendations();
      } else if (category === 'cross_domain_discoveries') {
        setActiveDiscoveryMode('cross_domain_discoveries');
        loadCrossDomainRecommendations();
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Initialize semantic systems
    initializeSemanticSystems();

    // Fetch recommendations
    fetchWeeklyRecommendations();
    fetchSemanticRecommendations();
  }, [user, selectedProject]);

  const initializeSemanticSystems = async () => {
    try {
      // Initialize vector database
      const { vectorDB } = await import('@/lib/vector-database');
      await vectorDB.initialize();

      // Initialize user profile system
      const { userProfileSystem } = await import('@/lib/user-profile-system');
      await userProfileSystem.initialize();

      console.log('Semantic systems initialized successfully');
    } catch (error) {
      console.error('Failed to initialize semantic systems:', error);
    }
  };

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

    // NEW: Force update weekly mix with latest user context
    await forceWeeklyMixUpdate();

    await fetchWeeklyRecommendations();
    await fetchSemanticRecommendations();
    setRefreshing(false);
  };

  // Fetch semantic recommendations for the 3 sections
  const fetchSemanticRecommendations = async () => {
    if (!user?.email) return;

    console.log('🧠 Fetching semantic recommendations...');

    // Set loading states
    setSemanticRecommendations(prev => ({
      crossDomain: { ...prev.crossDomain, loading: true },
      trending: { ...prev.trending, loading: true },
      personalized: { ...prev.personalized, loading: true }
    }));

    try {
      // For now, use demo data until semantic API endpoints are ready
      const demoSemanticPapers = [
        {
          pmid: "semantic_001",
          title: "Cross-Domain Applications of Machine Learning in Biological Systems",
          authors: ["Chen, L.", "Rodriguez, M.", "Kim, S."],
          journal: "Nature Machine Intelligence",
          year: 2024,
          citation_count: 89,
          relevance_score: 0.88,
          reason: "Bridges machine learning and biology domains",
          category: "Cross-Domain",
          semantic_analysis: {
            methodology: 'computational',
            complexity_score: 0.75,
            novelty_type: 'breakthrough',
            research_domains: ['machine_learning', 'biology', 'computer_science'],
            technical_terms: ['neural networks', 'protein folding', 'deep learning']
          }
        }
      ];

      setSemanticRecommendations({
        crossDomain: {
          papers: demoSemanticPapers,
          loading: false,
          error: null
        },
        trending: {
          papers: demoSemanticPapers,
          loading: false,
          error: null
        },
        personalized: {
          papers: demoSemanticPapers,
          loading: false,
          error: null
        }
      });

      console.log('✅ Semantic recommendations loaded (demo data)');

    } catch (error) {
      console.error('❌ Error fetching semantic recommendations:', error);

      setSemanticRecommendations(prev => ({
        crossDomain: { ...prev.crossDomain, loading: false, error: 'Failed to load' },
        trending: { ...prev.trending, loading: false, error: 'Failed to load' },
        personalized: { ...prev.personalized, loading: false, error: 'Failed to load' }
      }));
    }
  };

  const handlePlayPaper = (paper: any) => {
    // Track paper view
    trackPaperView(paper.pmid, paper.title);
    trackRecommendationInteraction('click', paper.pmid, paper.category || 'unknown');

    // Track for weekly mix automation
    trackPaperViewWeeklyMix(paper.pmid, paper.title, 'discover', { category: paper.category });

    // Navigate to paper details or open in new tab
    if (paper.pmid) {
      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
    }
  };

  const handleSavePaper = async (paper: any) => {
    // Track save action
    trackRecommendationInteraction('save', paper.pmid, paper.category || 'unknown');

    // TODO: Implement save to collection functionality
    console.log('Save paper:', paper);
  };

  const handleSharePaper = (paper: any) => {
    // Track share action
    trackRecommendationInteraction('share', paper.pmid, paper.category || 'unknown');

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

  // Semantic discovery handlers
  const handleSemanticSearch = async (query: string, options: any = {}, category?: string) => {
    console.log('🔍 Semantic search initiated with query:', query);
    console.log('🎯 Search options:', options);
    console.log('📂 Category context:', category);

    try {
      setLoading(true);

      // Configure search parameters based on category
      let searchConfig = {
        semantic_expansion: true,
        domain_focus: [],
        similarity_threshold: 0.3,
        include_related_concepts: true,
        max_results: 20,
        ...options
      };

      // Customize search based on category from Home page
      if (category === 'cross_domain') {
        searchConfig.domain_focus = ['machine learning', 'biomedical research', 'drug discovery'];
        searchConfig.similarity_threshold = 0.25; // Lower threshold for cross-domain
        console.log('🌐 CROSS-DOMAIN search configuration applied');
      } else if (category === 'trending') {
        searchConfig.domain_focus = ['diabetes', 'pharmacology', 'clinical trials'];
        searchConfig.similarity_threshold = 0.3;
        console.log('🔥 TRENDING search configuration applied');
      } else if (category === 'personalized') {
        searchConfig.domain_focus = ['clinical medicine', 'nephrology', 'kidney disease'];
        searchConfig.similarity_threshold = 0.3;
        console.log('💡 PERSONALIZED search configuration applied');
      }

      // Track semantic search usage
      trackSemanticFeatureUsage('semantic_search', { query, options: searchConfig, category });

      const searchQuery: SemanticSearchQuery = {
        query,
        semantic_expansion: searchConfig.semantic_expansion,
        domain_focus: searchConfig.domain_focus,
        similarity_threshold: searchConfig.similarity_threshold,
        include_related_concepts: searchConfig.include_related_concepts,
        max_results: searchConfig.max_results
      };

      console.log('📊 Executing semantic search with query object:', searchQuery);
      const results = await semanticSearch.performSemanticSearch(searchQuery, user);
      setSemanticResults(results);

      // Track search completion
      trackSearch(query, results.length, Object.keys(options).filter(key => options[key]));

      console.log('📊 Search results:', results.length, 'papers found');
      console.log('🎯 First result sample:', results[0]);
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      setError('Semantic search failed. Please try again.');
    } finally {
      setLoading(false);
      console.log('✅ Semantic search completed');
    }
  };

  const handleFilterChange = async (criteria: FilterCriteria) => {
    try {
      setFilterCriteria(criteria);

      // Track semantic filter usage
      trackSemanticFeatureUsage('smart_filters', { criteria });

      // Apply filters to current recommendations
      if (recommendations) {
        const allPapers = [
          ...(Array.isArray(recommendations.recommendations.papers_for_you)
            ? recommendations.recommendations.papers_for_you
            : recommendations.recommendations.papers_for_you?.papers || []),
          ...(Array.isArray(recommendations.recommendations.trending_in_field)
            ? recommendations.recommendations.trending_in_field
            : recommendations.recommendations.trending_in_field?.papers || []),
          ...(Array.isArray(recommendations.recommendations.cross_pollination)
            ? recommendations.recommendations.cross_pollination
            : recommendations.recommendations.cross_pollination?.papers || []),
          ...(Array.isArray(recommendations.recommendations.citation_opportunities)
            ? recommendations.recommendations.citation_opportunities
            : recommendations.recommendations.citation_opportunities?.papers || [])
        ];

        const filteredPapers = semanticFilter.filterPapers(allPapers, criteria);
        setSemanticResults(filteredPapers);
        console.log('🎯 Filtered papers:', filteredPapers);
      }
    } catch (error) {
      console.error('Filter application failed:', error);
    }
  };

  const handleCrossDomainExplore = async (domains: string[]) => {
    try {
      setLoading(true);

      // Track cross-domain exploration usage
      trackSemanticFeatureUsage('cross_domain_discovery', { domains });

      const opportunities = await crossDomainEngine.discoverCrossDomainOpportunities(
        domains,
        ['research', 'discovery'], // Default interests
        2
      );
      setCrossDomainOpportunities(opportunities);
      console.log('🌐 Cross-domain opportunities:', opportunities);
    } catch (error) {
      console.error('Cross-domain exploration failed:', error);
      setError('Cross-domain exploration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated functions for the 3 recommendation types from Home page
  const loadTrendingRecommendations = async () => {
    if (!user) return;

    setSemanticRecommendations(prev => ({
      ...prev,
      trending: { ...prev.trending, loading: true, error: null }
    }));

    try {
      console.log('🔥 Loading trending recommendations for user:', user.email);

      const response = await fetch(`/api/proxy/recommendations/trending/${user.email}`, {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trending recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔥 Trending recommendations loaded:', data);

      setSemanticRecommendations(prev => ({
        ...prev,
        trending: {
          papers: data.papers || data.recommendations || [],
          loading: false,
          error: null
        }
      }));

      // Track the interaction
      trackRecommendationInteraction('view', 'trending_section', 'discover_page');

    } catch (error) {
      console.error('❌ Failed to load trending recommendations:', error);
      setSemanticRecommendations(prev => ({
        ...prev,
        trending: {
          papers: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load trending recommendations'
        }
      }));
    }
  };

  const loadForYouRecommendations = async () => {
    if (!user) return;

    setSemanticRecommendations(prev => ({
      ...prev,
      personalized: { ...prev.personalized, loading: true, error: null }
    }));

    try {
      console.log('💡 Loading personalized recommendations for user:', user.email);

      const response = await fetch(`/api/proxy/recommendations/papers-for-you/${user.email}`, {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch personalized recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log('💡 Personalized recommendations loaded:', data);

      setSemanticRecommendations(prev => ({
        ...prev,
        personalized: {
          papers: data.papers || data.recommendations || [],
          loading: false,
          error: null
        }
      }));

      // Track the interaction
      trackRecommendationInteraction('view', 'for_you_section', 'discover_page');

    } catch (error) {
      console.error('❌ Failed to load personalized recommendations:', error);
      setSemanticRecommendations(prev => ({
        ...prev,
        personalized: {
          papers: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load personalized recommendations'
        }
      }));
    }
  };

  const loadCrossDomainRecommendations = async () => {
    if (!user) return;

    setSemanticRecommendations(prev => ({
      ...prev,
      crossDomain: { ...prev.crossDomain, loading: true, error: null }
    }));

    try {
      console.log('🌐 Loading cross-domain recommendations for user:', user.email);

      const response = await fetch(`/api/proxy/recommendations/cross-pollination/${user.email}`, {
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cross-domain recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌐 Cross-domain recommendations loaded:', data);

      setSemanticRecommendations(prev => ({
        ...prev,
        crossDomain: {
          papers: data.papers || data.recommendations || [],
          loading: false,
          error: null
        }
      }));

      // Track the interaction
      trackRecommendationInteraction('view', 'cross_domain_section', 'discover_page');

    } catch (error) {
      console.error('❌ Failed to load cross-domain recommendations:', error);
      setSemanticRecommendations(prev => ({
        ...prev,
        crossDomain: {
          papers: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load cross-domain recommendations'
        }
      }));
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Discover</h1>
              <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
                Personalized research recommendations for you
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-[var(--spotify-green)] text-black rounded-full font-medium hover:scale-105 transition-transform disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Semantic Discovery Interface */}
        <div className="mb-8 px-4 sm:px-6">
          <SemanticDiscoveryInterface
            activeMode={activeDiscoveryMode}
            onModeChange={setActiveDiscoveryMode}
            onSemanticSearch={handleSemanticSearch}
            onFilterChange={handleFilterChange}
            onCrossDomainExplore={handleCrossDomainExplore}
            loading={loading}
          />
        </div>

        {/* NEW: Semantic Recommendation Sections */}
        <div className="mb-8 px-4 sm:px-6">
          <SemanticRecommendationSections
            crossDomainPapers={semanticRecommendations.crossDomain.papers}
            trendingPapers={semanticRecommendations.trending.papers}
            personalizedPapers={semanticRecommendations.personalized.papers}
            loading={semanticRecommendations.crossDomain.loading || semanticRecommendations.trending.loading || semanticRecommendations.personalized.loading}
            onPaperClick={handlePlayPaper}
            onSeeAll={(queryType) => {
              console.log(`🔍 See all clicked for: ${queryType}`);
              // Handle see all navigation
            }}
          />
        </div>

        {/* Section Header */}
        <div className="mb-8 px-4 sm:px-6">
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
        </div>

        {/* Recommendation Sections */}
        <div className="space-y-12">
          {/* Smart Recommendations (Semantic Search Results) */}
          {semanticResults.length > 0 && (
            <SpotifyCleanSection
              section={{
                title: "Smart Recommendations",
                description: "AI-powered research discoveries based on your semantic search",
                papers: semanticResults.map(result => ({
                  pmid: result.pmid,
                  title: result.title,
                  authors: result.authors,
                  journal: result.journal,
                  year: result.publication_year,
                  citation_count: result.citation_count,
                  relevance_score: result.relevance_score,
                  reason: `Semantic similarity: ${(result.semantic_similarity * 100).toFixed(0)}%`,
                  category: result.research_domain,
                  spotify_style: {
                    discovery_badge: "🧠",
                    cover_color: '#1db954'
                  }
                })),
                updated: new Date().toISOString(),
                icon: SparklesIcon,
                color: '#1db954',
                category: 'Smart Recommendations'
              }}
              onPlay={handlePlayPaper}
              onSave={handleSavePaper}
              onShare={handleSharePaper}
              onClick={(paper) => {
                if (paper.pmid) {
                  window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                }
              }}
              onSeeAll={handleSeeAll}
            />
          )}

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
                papers: papers,
                icon: MusicalNoteIcon,
                color: "#1db954",
                category: "papers_for_you"
              };

              console.log('🎨 DISCOVER PAGE: Rendering Papers for You section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onClick={(paper) => {
                    // Open PubMed article in new tab
                    if (paper.pmid) {
                      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                    }
                  }}
                  onSeeAll={handleSeeAll}
                  showPersonalizedGreeting={true}
                  userName={(user as any)?.name || user?.email?.split('@')[0] || 'Researcher'}
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
                papers: papers,
                icon: FireIcon,
                color: "#ff6b35",
                category: "trending_in_field"
              };

              console.log('🎨 DISCOVER PAGE: Rendering Trending section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onClick={(paper) => {
                    // Open PubMed article in new tab
                    if (paper.pmid) {
                      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                    }
                  }}
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
                papers: papers,
                icon: BeakerIcon,
                color: "#8b5cf6",
                category: "cross_pollination"
              };

              console.log('🎨 DISCOVER PAGE: Rendering Cross-pollination section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onClick={(paper) => {
                    // Open PubMed article in new tab
                    if (paper.pmid) {
                      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                    }
                  }}
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
                papers: papers,
                icon: LightBulbIcon,
                color: "#f59e0b",
                category: "citation_opportunities"
              };

              console.log('🎨 DISCOVER PAGE: Rendering Citation Opportunities section with:', JSON.stringify(sectionData, null, 2));

              return (
                <SpotifyCleanSection
                  section={sectionData}
                  onPlay={handlePlayPaper}
                  onSave={handleSavePaper}
                  onShare={handleSharePaper}
                  onClick={(paper) => {
                    // Open PubMed article in new tab
                    if (paper.pmid) {
                      window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                    }
                  }}
                  onSeeAll={handleSeeAll}
                />
              );
            } else {
              console.log('⚠️ DISCOVER PAGE: Citation Opportunities section not rendered - no papers or empty array');
              return null;
            }
          })()}

          {/* Trending Now Section */}
          {activeDiscoveryMode === 'trending' && semanticRecommendations.trending.papers.length > 0 && (
            <SpotifyCleanSection
              section={{
                title: "Trending Now",
                description: "Hot papers trending in your research field",
                papers: semanticRecommendations.trending.papers,
                updated: new Date().toISOString(),
                icon: BeakerIcon,
                color: '#ef4444',
                category: 'trending'
              }}
              onPlay={handlePlayPaper}
              onSave={handleSavePaper}
              onShare={handleSharePaper}
              onClick={(paper) => {
                if (paper.pmid) {
                  window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                }
              }}
              onSeeAll={handleSeeAll}
            />
          )}

          {/* For You Section */}
          {activeDiscoveryMode === 'for_you' && semanticRecommendations.personalized.papers.length > 0 && (
            <SpotifyCleanSection
              section={{
                title: "For You",
                description: "Personalized recommendations based on your search history",
                papers: semanticRecommendations.personalized.papers,
                updated: new Date().toISOString(),
                icon: LightBulbIcon,
                color: '#16a34a',
                category: 'for_you'
              }}
              onPlay={handlePlayPaper}
              onSave={handleSavePaper}
              onShare={handleSharePaper}
              onClick={(paper) => {
                if (paper.pmid) {
                  window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                }
              }}
              onSeeAll={handleSeeAll}
            />
          )}

          {/* Cross-Domain Discoveries Section */}
          {activeDiscoveryMode === 'cross_domain_discoveries' && semanticRecommendations.crossDomain.papers.length > 0 && (
            <SpotifyCleanSection
              section={{
                title: "Cross-Domain Discoveries",
                description: "Interdisciplinary research opportunities",
                papers: semanticRecommendations.crossDomain.papers,
                updated: new Date().toISOString(),
                icon: ArrowPathIcon,
                color: '#6366f1',
                category: 'cross_domain_discoveries'
              }}
              onPlay={handlePlayPaper}
              onSave={handleSavePaper}
              onShare={handleSharePaper}
              onClick={(paper) => {
                if (paper.pmid) {
                  window.open(`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`, '_blank');
                }
              }}
              onSeeAll={handleSeeAll}
            />
          )}

          {/* Loading states for recommendation sections */}
          {activeDiscoveryMode === 'trending' && semanticRecommendations.trending.loading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-[var(--spotify-light-text)] mt-4">Loading trending recommendations...</p>
            </div>
          )}

          {activeDiscoveryMode === 'for_you' && semanticRecommendations.personalized.loading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-[var(--spotify-light-text)] mt-4">Loading personalized recommendations...</p>
            </div>
          )}

          {activeDiscoveryMode === 'cross_domain_discoveries' && semanticRecommendations.crossDomain.loading && (
            <div className="text-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-[var(--spotify-light-text)] mt-4">Loading cross-domain discoveries...</p>
            </div>
          )}

          {/* Error states for recommendation sections */}
          {activeDiscoveryMode === 'trending' && semanticRecommendations.trending.error && (
            <ErrorAlert>{semanticRecommendations.trending.error}</ErrorAlert>
          )}

          {activeDiscoveryMode === 'for_you' && semanticRecommendations.personalized.error && (
            <ErrorAlert>{semanticRecommendations.personalized.error}</ErrorAlert>
          )}

          {activeDiscoveryMode === 'cross_domain_discoveries' && semanticRecommendations.crossDomain.error && (
            <ErrorAlert>{semanticRecommendations.crossDomain.error}</ErrorAlert>
          )}
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

// Main component with Suspense boundary
export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <MobileResponsiveLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--spotify-green)] mx-auto mb-4"></div>
            <p className="text-[var(--spotify-light-text)]">Loading Discover page...</p>
          </div>
        </div>
      </MobileResponsiveLayout>
    }>
      <DiscoverPageContent />
    </Suspense>
  );
}
