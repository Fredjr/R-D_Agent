'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, HeartIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

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
    cover_color: string;
    subtitle: string;
    play_count?: number;
    trend_indicator?: string;
    discovery_badge?: string;
    opportunity_badge?: string;
  };

  // 🧠 Phase 2A.2: Semantic Analysis Fields (Updated to match backend)
  semantic_analysis?: {
    methodology?: 'experimental' | 'theoretical' | 'computational' | 'review' | 'meta_analysis' | 'case_study' | 'survey';
    complexity_score?: number; // 0.0-1.0 scale
    novelty_classification?: 'breakthrough' | 'incremental' | 'replication' | 'review';
    research_domains?: string[]; // ['machine_learning', 'biology', 'chemistry', etc.]
    technical_terms?: string[];
    confidence_scores?: {
      methodology: number;
      complexity: number;
      novelty: number;
      domains: number;
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

interface SpotifyRecommendationCardProps {
  paper: Paper;
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  size?: 'small' | 'medium' | 'large';
}

export const SpotifyRecommendationCard: React.FC<SpotifyRecommendationCardProps> = ({
  paper,
  onPlay,
  onSave,
  onShare,
  size = 'medium'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const sizeClasses = {
    small: 'w-40 h-56',
    medium: 'w-48 h-64', 
    large: 'w-56 h-72'
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(paper);
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-[var(--spotify-dark-gray)] rounded-lg p-4 hover:bg-[var(--spotify-medium-gray)] transition-all duration-300 cursor-pointer group relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Art */}
      <div 
        className="w-full aspect-square rounded-lg mb-4 relative overflow-hidden"
        style={{ backgroundColor: paper.spotify_style?.cover_color || '#1db954' }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
        
        {/* Category badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white font-medium">
          {paper.category.replace('_', ' ').toUpperCase()}
        </div>

        {/* Special indicators */}
        {paper.spotify_style?.trend_indicator && (
          <div className="absolute top-2 right-2 text-lg">
            {paper.spotify_style.trend_indicator}
          </div>
        )}
        
        {paper.spotify_style?.discovery_badge && (
          <div className="absolute top-2 right-2 text-lg">
            {paper.spotify_style.discovery_badge}
          </div>
        )}

        {paper.spotify_style?.opportunity_badge && (
          <div className="absolute top-2 right-2 text-lg">
            {paper.spotify_style.opportunity_badge}
          </div>
        )}

        {/* 🧠 Semantic Analysis Visual Indicators */}
        {paper.semantic_analysis && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            {/* Methodology Badge */}
            {paper.semantic_analysis.methodology && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                paper.semantic_analysis.methodology === 'experimental' ? 'bg-blue-500/80 text-white' :
                paper.semantic_analysis.methodology === 'theoretical' ? 'bg-purple-500/80 text-white' :
                paper.semantic_analysis.methodology === 'computational' ? 'bg-green-500/80 text-white' :
                'bg-gray-500/80 text-white'
              }`}>
                {paper.semantic_analysis.methodology === 'experimental' ? '🧪' :
                 paper.semantic_analysis.methodology === 'theoretical' ? '📐' :
                 paper.semantic_analysis.methodology === 'computational' ? '💻' : '📄'}
              </div>
            )}

            {/* Novelty Indicator */}
            {paper.semantic_analysis.novelty_classification === 'breakthrough' && (
              <div className="px-2 py-1 bg-yellow-500/80 text-white rounded text-xs font-medium animate-pulse">
                🚀
              </div>
            )}
          </div>
        )}

        {/* Play button overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={() => onPlay?.(paper)}
            className="w-12 h-12 bg-[var(--spotify-green)] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <PlayIcon className="w-6 h-6 text-black ml-1" />
          </button>
        </div>

        {/* Citation count */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
          {paper.citation_count} citations
        </div>
      </div>

      {/* Paper Info */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">
          {paper.title}
        </h3>
        
        <p className="text-[var(--spotify-light-text)] text-xs">
          {paper.spotify_style?.subtitle || paper.reason}
        </p>

        <div className="text-[var(--spotify-muted-text)] text-xs">
          {paper.authors.slice(0, 2).join(', ')}
          {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
        </div>

        {paper.year && (
          <div className="text-[var(--spotify-muted-text)] text-xs">
            {paper.year} • {paper.journal}
          </div>
        )}

        {/* 🧠 Semantic Analysis Info */}
        {paper.semantic_analysis && (
          <div className="space-y-1">
            {/* Complexity Score */}
            {paper.semantic_analysis.complexity_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--spotify-muted-text)] text-xs">Complexity:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      paper.semantic_analysis.complexity_score < 0.3 ? 'bg-green-500' :
                      paper.semantic_analysis.complexity_score < 0.7 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${paper.semantic_analysis.complexity_score * 100}%` }}
                  />
                </div>
                <span className="text-[var(--spotify-muted-text)] text-xs">
                  {Math.round(paper.semantic_analysis.complexity_score * 100)}%
                </span>
              </div>
            )}

            {/* Research Domains */}
            {paper.semantic_analysis.research_domains && paper.semantic_analysis.research_domains.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {paper.semantic_analysis.research_domains.slice(0, 2).map((domain, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] text-xs rounded-full"
                  >
                    {domain.replace('_', ' ')}
                  </span>
                ))}
                {paper.semantic_analysis.research_domains.length > 2 && (
                  <span className="text-[var(--spotify-muted-text)] text-xs">
                    +{paper.semantic_analysis.research_domains.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={`absolute bottom-4 right-4 flex gap-2 transition-opacity duration-200 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          onClick={handleSave}
          className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {isSaved ? (
            <HeartSolidIcon className="w-4 h-4 text-[var(--spotify-green)]" />
          ) : (
            <HeartIcon className="w-4 h-4 text-white" />
          )}
        </button>
        
        <button
          onClick={() => onShare?.(paper)}
          className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ShareIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

interface SpotifyRecommendationSectionProps {
  section: RecommendationSection;
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  onSeeAll?: (category: string) => void;
}

export const SpotifyRecommendationSection: React.FC<SpotifyRecommendationSectionProps> = ({
  section,
  onPlay,
  onSave,
  onShare,
  onSeeAll
}) => {
  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {section.title}
          </h2>
          <p className="text-[var(--spotify-light-text)] text-sm">
            {section.description}
          </p>
        </div>
        
        {section.papers.length > 6 && (
          <button
            onClick={() => onSeeAll?.(section.title)}
            className="text-[var(--spotify-light-text)] hover:text-white text-sm font-medium transition-colors"
          >
            See all
          </button>
        )}
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {section.papers.slice(0, 6).map((paper) => (
          <SpotifyRecommendationCard
            key={paper.pmid}
            paper={paper}
            onPlay={onPlay}
            onSave={onSave}
            onShare={onShare}
            size="medium"
          />
        ))}
      </div>

      {/* Refresh info */}
      <div className="mt-4 text-xs text-[var(--spotify-muted-text)]">
        Updated {new Date(section.updated).toLocaleDateString()} • {section.refresh_reason}
      </div>
    </div>
  );
};

interface WeeklyMixHeaderProps {
  weekOf: string;
  userInsights?: {
    research_domains: string[];
    activity_level: string;
    discovery_preference: string;
    collaboration_tendency: number;
  };
}

export const WeeklyMixHeader: React.FC<WeeklyMixHeaderProps> = ({
  weekOf,
  userInsights
}) => {
  const formatWeekOf = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-[var(--spotify-green)]/20 to-[var(--spotify-green)]/5 rounded-lg border border-[var(--spotify-green)]/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-[var(--spotify-green)] rounded-lg flex items-center justify-center">
          <span className="text-2xl">🎵</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Your Weekly Research Mix
          </h1>
          <p className="text-[var(--spotify-light-text)]">
            Week of {formatWeekOf(weekOf)}
          </p>
        </div>
      </div>

      {userInsights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[var(--spotify-muted-text)]">Research Areas</span>
            <p className="text-white font-medium">
              {userInsights.research_domains.slice(0, 2).join(', ')}
            </p>
          </div>
          <div>
            <span className="text-[var(--spotify-muted-text)]">Activity Level</span>
            <p className="text-white font-medium capitalize">
              {userInsights.activity_level}
            </p>
          </div>
          <div>
            <span className="text-[var(--spotify-muted-text)]">Discovery Style</span>
            <p className="text-white font-medium capitalize">
              {userInsights.discovery_preference}
            </p>
          </div>
          <div>
            <span className="text-[var(--spotify-muted-text)]">Collaboration</span>
            <p className="text-white font-medium">
              {Math.round(userInsights.collaboration_tendency * 100)}% tendency
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component that combines all recommendation sections
interface SpotifyRecommendationsProps {
  recommendations: {
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
  };
  onRefresh?: () => void;
}

export const SpotifyRecommendations: React.FC<SpotifyRecommendationsProps> = ({
  recommendations,
  onRefresh
}) => {
  const handlePlay = (paper: any) => {
    // Navigate to paper details or open paper
    console.log('Playing paper:', paper);
  };

  const handleSave = (paper: any) => {
    // Save paper to collection
    console.log('Saving paper:', paper);
  };

  const handleShare = (paper: any) => {
    // Share paper
    console.log('Sharing paper:', paper);
  };

  const handleSeeAll = (category: string) => {
    // Navigate to category page
    console.log('See all for category:', category);
  };

  const sections: RecommendationSection[] = [
    {
      title: "Papers for You",
      description: "Personalized recommendations based on your research",
      papers: recommendations.papers_for_you || [],
      updated: new Date().toISOString(),
      refresh_reason: "Based on your recent activity and saved papers"
    },
    {
      title: "Trending in Your Field",
      description: "Hot topics gaining attention in your research area",
      papers: recommendations.trending || [],
      updated: new Date().toISOString(),
      refresh_reason: "Updated with latest citation trends"
    },
    {
      title: "Cross-pollination",
      description: "Interdisciplinary discoveries and new perspectives",
      papers: recommendations.cross_pollination || [],
      updated: new Date().toISOString(),
      refresh_reason: "Exploring connections across research domains"
    },
    {
      title: "Citation Opportunities",
      description: "Papers that could benefit from your expertise",
      papers: recommendations.citation_opportunities || [],
      updated: new Date().toISOString(),
      refresh_reason: "Recent papers in your field with citation gaps"
    }
  ];

  return (
    <div className="space-y-12">
      {/* Weekly Mix Header */}
      <WeeklyMixHeader
        weekOf={new Date().toISOString()}
        userInsights={{
          research_domains: recommendations.user_insights?.primary_domains || [],
          activity_level: recommendations.user_insights?.activity_level || 'moderate',
          discovery_preference: 'balanced',
          collaboration_tendency: 0.5
        }}
      />

      {/* Recommendation Sections */}
      {sections.map((section, index) => (
        <SpotifyRecommendationSection
          key={index}
          section={section}
          onPlay={handlePlay}
          onSave={handleSave}
          onShare={handleShare}
          onSeeAll={handleSeeAll}
        />
      ))}
    </div>
  );
};
