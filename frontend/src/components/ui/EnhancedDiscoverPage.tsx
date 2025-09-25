'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedScrollableSection } from './EnhancedSpotifyRecommendations';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface Paper {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  citation_count: number;
  relevance_score?: number;
  reason: string;
  category: string;
  spotify_style?: {
    cover_color?: string;
    subtitle?: string;
    play_count?: number;
    trend_indicator?: string;
    discovery_badge?: string;
    opportunity_badge?: string;
  };

  // 🧠 Phase 2A.2: Semantic Analysis Fields
  semantic_analysis?: {
    methodology?: 'experimental' | 'theoretical' | 'computational' | 'review' | 'meta_analysis' | 'case_study' | 'survey';
    complexity_score?: number; // 0.0-1.0 scale
    novelty_type?: 'breakthrough' | 'incremental' | 'replication' | 'review';
    research_domains?: string[]; // ['machine_learning', 'biology', 'chemistry', etc.]
    technical_terms?: string[];
    confidence_scores?: {
      methodology: number;
      complexity: number;
      novelty: number;
    };
    analysis_metadata?: {
      analysis_time_seconds?: number;
      service_initialized?: boolean;
      embedding_dimensions?: number;
    };
  };
}

interface RecommendationSection {
  title: string;
  description: string;
  papers: Paper[];
  updated: string;
  refresh_reason: string;
}

interface EnhancedDiscoverPageProps {
  recommendations?: {
    papers_for_you?: Paper[];
    trending_in_field?: Paper[];
    cross_pollination?: Paper[];
    citation_opportunities?: Paper[];
  };
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  onSeeAll?: (category: string) => void;
  onSearch?: (query: string) => void;
}

// 🧠 Demo papers with semantic analysis data for testing
const demoSemanticPapers: Paper[] = [
  {
    pmid: "demo_001",
    title: "Deep Learning Approaches for Protein Structure Prediction: A Comprehensive Review",
    authors: ["Smith, J.", "Johnson, A.", "Williams, R."],
    journal: "Nature Machine Intelligence",
    year: 2024,
    citation_count: 127,
    relevance_score: 0.95,
    reason: "This paper presents novel deep learning architectures for protein folding prediction, achieving state-of-the-art results on benchmark datasets.",
    category: "Machine Learning",
    semantic_analysis: {
      methodology: 'computational' as const,
      complexity_score: 0.75,
      novelty_type: 'breakthrough' as const,
      research_domains: ['machine_learning', 'biology', 'computer_science'],
      technical_terms: ['deep learning', 'protein folding', 'neural networks', 'AlphaFold', 'transformer architecture'],
      confidence_scores: {
        methodology: 0.92,
        complexity: 0.88,
        novelty: 0.85,
      },
      analysis_metadata: {
        analysis_time_seconds: 0.003,
        service_initialized: true,
        embedding_dimensions: 384,
      },
    },
  },
  {
    pmid: "demo_002",
    title: "Experimental Validation of CRISPR-Cas9 Gene Editing in Human Embryos",
    authors: ["Chen, L.", "Rodriguez, M.", "Kim, S."],
    journal: "Cell",
    year: 2024,
    citation_count: 89,
    relevance_score: 0.88,
    reason: "Groundbreaking experimental study demonstrating safe and effective gene editing in human embryos using CRISPR technology.",
    category: "Biology",
    semantic_analysis: {
      methodology: 'experimental' as const,
      complexity_score: 0.45,
      novelty_type: 'breakthrough' as const,
      research_domains: ['biology', 'medicine', 'genetics'],
      technical_terms: ['CRISPR-Cas9', 'gene editing', 'embryos', 'genetic modification', 'bioethics'],
      confidence_scores: {
        methodology: 0.95,
        complexity: 0.82,
        novelty: 0.91,
      },
      analysis_metadata: {
        analysis_time_seconds: 0.002,
        service_initialized: true,
        embedding_dimensions: 384,
      },
    },
  },
  {
    pmid: "demo_003",
    title: "Theoretical Framework for Quantum Computing Applications in Drug Discovery",
    authors: ["Patel, R.", "Thompson, K.", "Liu, X."],
    journal: "Nature Quantum Information",
    year: 2024,
    citation_count: 34,
    relevance_score: 0.72,
    reason: "Novel theoretical approach combining quantum computing principles with pharmaceutical research methodologies.",
    category: "Physics",
    semantic_analysis: {
      methodology: 'theoretical' as const,
      complexity_score: 0.92,
      novelty_type: 'incremental' as const,
      research_domains: ['physics', 'computer_science', 'chemistry'],
      technical_terms: ['quantum computing', 'drug discovery', 'quantum algorithms', 'molecular simulation', 'quantum advantage'],
      confidence_scores: {
        methodology: 0.89,
        complexity: 0.94,
        novelty: 0.76,
      },
      analysis_metadata: {
        analysis_time_seconds: 0.004,
        service_initialized: true,
        embedding_dimensions: 384,
      },
    },
  },
];

export const EnhancedDiscoverPage: React.FC<EnhancedDiscoverPageProps> = ({
  recommendations,
  onPlay,
  onSave,
  onShare,
  onSeeAll,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions = [
    { id: 'recent', label: 'Recent (2024)', color: 'bg-blue-500' },
    { id: 'highly_cited', label: 'Highly Cited', color: 'bg-yellow-500' },
    { id: 'open_access', label: 'Open Access', color: 'bg-green-500' },
    { id: 'review', label: 'Review Papers', color: 'bg-purple-500' },
    { id: 'experimental', label: 'Experimental', color: 'bg-red-500' },
    { id: 'theoretical', label: 'Theoretical', color: 'bg-indigo-500' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Transform recommendations into sections with enhanced data
  const sections: RecommendationSection[] = [];

  if (recommendations?.papers_for_you?.length) {
    sections.push({
      title: "Discover Weekly",
      description: "Fresh research picks curated just for you",
      papers: recommendations.papers_for_you.map(paper => ({
        ...paper,
        spotify_style: {
          ...paper.spotify_style,
          discovery_badge: "🎯",
          cover_color: paper.spotify_style?.cover_color || '#1db954'
        }
      })),
      updated: `Updated every Monday`,
      refresh_reason: "Your personal research discovery mix"
    });
  } else {
    // 🧠 Demo section with semantic analysis data
    sections.push({
      title: "Discover Weekly",
      description: "Fresh research picks curated just for you",
      papers: demoSemanticPapers.map(paper => ({
        ...paper,
        spotify_style: {
          discovery_badge: "🧠",
          cover_color: '#1db954'
        }
      })),
      updated: `Updated every Monday`,
      refresh_reason: "🧠 Demo: Papers with semantic analysis features enabled"
    });
  }

  if (recommendations?.trending_in_field?.length) {
    sections.push({
      title: "Trending Now",
      description: "What's hot in research right now",
      papers: recommendations.trending_in_field.map(paper => ({
        ...paper,
        spotify_style: {
          ...paper.spotify_style,
          trend_indicator: "🔥",
          cover_color: paper.spotify_style?.cover_color || '#ff6b6b'
        }
      })),
      updated: `Updated hourly`,
      refresh_reason: "Based on global research activity"
    });
  }

  if (recommendations?.cross_pollination?.length) {
    sections.push({
      title: "Research Radar",
      description: "Discover connections across disciplines",
      papers: recommendations.cross_pollination.map(paper => ({
        ...paper,
        spotify_style: {
          ...paper.spotify_style,
          discovery_badge: "🌐",
          cover_color: paper.spotify_style?.cover_color || '#4ecdc4'
        }
      })),
      updated: `Updated daily`,
      refresh_reason: "Interdisciplinary discovery engine"
    });
  }

  if (recommendations?.citation_opportunities?.length) {
    sections.push({
      title: "Citation Mix",
      description: "Papers that could benefit from your expertise",
      papers: recommendations.citation_opportunities.map(paper => ({
        ...paper,
        spotify_style: {
          ...paper.spotify_style,
          opportunity_badge: "💡",
          cover_color: paper.spotify_style?.cover_color || '#ffd93d'
        }
      })),
      updated: `Updated weekly`,
      refresh_reason: "Based on your publication profile"
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#000000] text-white">
      {/* Enhanced Header with Search */}
      <div className="pt-8 pb-6 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1db954] to-[#1ed760] rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Discover</h1>
              <p className="text-gray-400">Explore the frontiers of research</p>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for papers, authors, topics..."
                className="w-full bg-[#282828] border border-gray-600 rounded-full py-3 pl-12 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-[var(--spotify-green)] focus:ring-2 focus:ring-[var(--spotify-green)]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600 rounded-full transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </form>

          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-[#282828] rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">Filter by:</h3>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedFilters.includes(filter.id)
                        ? `${filter.color} text-white shadow-lg`
                        : 'bg-[#383838] text-gray-300 hover:bg-[#484848]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  className="mt-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Browse Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[
              { name: 'AI & ML', color: 'from-purple-500 to-pink-500', emoji: '🤖' },
              { name: 'Biology', color: 'from-green-500 to-teal-500', emoji: '🧬' },
              { name: 'Physics', color: 'from-blue-500 to-cyan-500', emoji: '⚛️' },
              { name: 'Medicine', color: 'from-red-500 to-pink-500', emoji: '🏥' },
              { name: 'Chemistry', color: 'from-yellow-500 to-orange-500', emoji: '⚗️' },
              { name: 'Engineering', color: 'from-gray-500 to-slate-500', emoji: '⚙️' }
            ].map((category, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${category.color} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform group`}
                onClick={() => onSeeAll?.(category.name)}
              >
                <div className="text-2xl mb-2">{category.emoji}</div>
                <h3 className="text-white font-semibold text-sm">{category.name}</h3>
                <p className="text-white/80 text-xs">Explore</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Recommendation Sections */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <EnhancedScrollableSection
              key={section.title}
              section={section}
              onPlay={onPlay}
              onSave={onSave}
              onShare={onShare}
              onSeeAll={onSeeAll}
            />
          ))}

          {/* Empty state */}
          {sections.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1db954] to-[#1ed760] rounded-full flex items-center justify-center">
                <SparklesIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Start Discovering</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Use the search bar above or browse categories to discover amazing research papers.
              </p>
              <button 
                onClick={() => setShowFilters(true)}
                className="bg-[var(--spotify-green)] text-black px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform"
              >
                Explore Categories
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDiscoverPage;
