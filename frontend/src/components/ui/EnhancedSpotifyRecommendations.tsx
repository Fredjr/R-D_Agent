'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, HeartIcon, ShareIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
import {
  MethodologyBadge,
  ComplexityIndicator,
  NoveltyHighlight,
  DomainTags
} from '@/components/semantic';

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
  // 🎯 Phase 1.1c: Enhanced metadata for visual hierarchy
  reading_status?: 'unread' | 'reading' | 'completed' | 'saved';
  is_trending?: boolean;
  is_new?: boolean;
  is_highly_cited?: boolean;
  publication_date?: string;
  impact_score?: number;

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

interface EnhancedSpotifyCardProps {
  paper: Paper;
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  size?: 'small' | 'medium' | 'large';
  showAuthorPhotos?: boolean;
  showTrendGraph?: boolean;
}

// Enhanced color generation based on research field
const getFieldColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'ai_ml': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'biology': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'physics': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'chemistry': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'medicine': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'engineering': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'mathematics': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'computer_science': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'trending': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'hot': 'linear-gradient(135deg, #ff8a80 0%, #ff5722 100%)',
    'personalized': 'linear-gradient(135deg, #1ed760 0%, #1db954 100%)',
    'cross-pollination': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'getting_started': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'default': 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'
  };

  return colorMap[category.toLowerCase()] || colorMap.default;
};

// Get field-specific accent color for UI elements
const getFieldAccentColor = (category: string): string => {
  const accentMap: Record<string, string> = {
    'ai_ml': '#667eea',
    'biology': '#11998e',
    'physics': '#4facfe',
    'chemistry': '#43e97b',
    'medicine': '#fa709a',
    'engineering': '#a8edea',
    'mathematics': '#ff9a9e',
    'computer_science': '#667eea',
    'trending': '#fcb69f',
    'hot': '#ff5722',
    'personalized': '#1ed760',
    'cross-pollination': '#667eea',
    'getting_started': '#667eea',
    'default': '#1ed760'
  };

  return accentMap[category.toLowerCase()] || accentMap.default;
};

// Enhanced card with improved animations and visual hierarchy
export const EnhancedSpotifyCard: React.FC<EnhancedSpotifyCardProps> = ({
  paper,
  onPlay,
  onSave,
  onShare,
  size = 'medium',
  showAuthorPhotos = true,
  showTrendGraph = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSemanticExpanded, setIsSemanticExpanded] = useState(false);

  const sizeClasses = {
    small: 'w-44 h-60',
    medium: 'w-52 h-72', 
    large: 'w-60 h-80'
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(paper);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.(paper);
    // Reset playing state after animation
    setTimeout(() => setIsPlaying(false), 2000);
  };

  // Generate reading time estimate
  const estimatedReadTime = Math.max(3, Math.floor(paper.title.length / 10));

  const accentColor = getFieldAccentColor(paper.category);

  return (
    <div
      className={`${sizeClasses[size]} bg-[var(--spotify-card-bg)] rounded-xl p-4 hover:bg-[var(--spotify-card-hover)] transition-all duration-500 cursor-pointer group relative transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--spotify-card-bg': '#181818',
        '--spotify-card-hover': '#282828',
        '--accent-color': accentColor,
        boxShadow: isHovered ? `0 8px 32px ${accentColor}20` : '0 4px 16px rgba(0,0,0,0.2)'
      } as React.CSSProperties}
    >
      {/* Enhanced Cover Art with Dynamic Gradients */}
      <div
        className="w-full aspect-square rounded-xl mb-4 relative overflow-hidden shadow-lg"
        style={{
          background: getFieldColor(paper.category),
          boxShadow: isHovered ? `0 12px 40px ${accentColor}30` : '0 6px 20px rgba(0,0,0,0.15)'
        }}
      >
        {/* Animated gradient overlay with shimmer effect */}
        <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/40 transition-all duration-500 ${
          isHovered ? 'opacity-70' : 'opacity-40'
        }`} />

        {/* Subtle animated shimmer effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-1000 ${
          isHovered ? 'translate-x-full' : '-translate-x-full'
        }`} />
        
        {/* Enhanced category badge with icon and glow effect */}
        <div
          className="absolute top-3 left-3 px-3 py-1.5 backdrop-blur-sm rounded-full text-xs text-white font-semibold flex items-center gap-1 border border-white/20"
          style={{
            background: `linear-gradient(135deg, ${accentColor}80, ${accentColor}60)`,
            boxShadow: `0 4px 12px ${accentColor}40`
          }}
        >
          {paper.category === 'ai_ml' && <SparklesIcon className="w-3 h-3" />}
          {paper.category === 'trending' && <FireIcon className="w-3 h-3" />}
          {paper.category === 'hot' && <FireIcon className="w-3 h-3" />}
          {paper.category === 'personalized' && <SparklesIcon className="w-3 h-3" />}
          {paper.category.replace('_', ' ').toUpperCase()}
        </div>

        {/* 🎯 Phase 1.1c: Enhanced Visual Indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {/* Trending indicator */}
          {(paper.is_trending || paper.category === 'trending') && (
            <div className="w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-xs">🔥</span>
            </div>
          )}

          {/* New paper indicator */}
          {paper.is_new && (
            <div className="w-6 h-6 bg-blue-500/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-xs">✨</span>
            </div>
          )}

          {/* Highly cited indicator */}
          {(paper.is_highly_cited || paper.citation_count > 100) && (
            <div className="w-6 h-6 bg-yellow-500/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-xs font-bold text-black">⭐</span>
            </div>
          )}

          {/* 🧠 Phase 2A.2: Semantic Analysis Indicators */}
          {paper.semantic_analysis?.novelty_type === 'breakthrough' && (
            <div className="w-6 h-6 bg-red-600/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 animate-pulse">
              <span className="text-xs">🚀</span>
            </div>
          )}
        </div>
        
        {/* Enhanced play button with ripple effect and field-specific color */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}>
          <button
            onClick={handlePlay}
            className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-2xl relative overflow-hidden ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              background: isPlaying ?
                `radial-gradient(circle, ${accentColor} 0%, ${accentColor}dd 70%)` :
                `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              boxShadow: `0 8px 24px ${accentColor}60`
            }}
          >
            {/* Ripple effect background */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isPlaying ? 'animate-ping' : ''
            }`} style={{ background: `${accentColor}40` }} />

            <PlayIcon className="w-8 h-8 text-white ml-0.5 relative z-10" />
          </button>
        </div>

        {/* Citation count with trend indicator */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white font-medium flex items-center gap-1">
          <span>{paper.citation_count}</span>
          <span className="text-gray-300">citations</span>
          {showTrendGraph && (
            <div className="w-4 h-2 ml-1">
              <svg viewBox="0 0 16 8" className="w-full h-full">
                <polyline
                  points="0,6 4,4 8,2 12,3 16,1"
                  fill="none"
                  stroke="#1ed760"
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Reading time estimate */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white">
          {estimatedReadTime}m read
        </div>
      </div>

      {/* Enhanced Paper Info */}
      <div className="space-y-3">
        {/* 🎯 Phase 1.1c: Title with enhanced typography hierarchy */}
        <div className="flex items-start gap-2">
          {/* Reading status indicator */}
          {paper.reading_status && (
            <div
              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                paper.reading_status === 'unread' ? 'bg-gray-500' :
                paper.reading_status === 'reading' ? 'bg-blue-500' :
                paper.reading_status === 'completed' ? 'bg-green-500' :
                'bg-purple-500'
              }`}
              title={`Status: ${paper.reading_status}`}
            />
          )}

          <h3
            className="text-white font-bold text-sm leading-tight line-clamp-2 transition-colors duration-300"
            style={{
              color: isHovered ? accentColor : 'white',
              fontWeight: paper.is_highly_cited || paper.citation_count > 100 ? '700' : '600'
            }}
          >
            {paper.title}
          </h3>
        </div>
        
        {/* Authors with enhanced photos and styling */}
        <div className="flex items-center gap-2">
          {showAuthorPhotos && paper.authors.slice(0, 3).map((author, index) => (
            <div
              key={index}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-medium border border-white/20 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${accentColor}60, ${accentColor}40)`
              }}
            >
              {author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          ))}
          <p className="text-gray-400 text-xs truncate flex-1 group-hover:text-gray-300 transition-colors duration-200">
            {paper.authors.slice(0, 2).join(', ')}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
          </p>
        </div>

        {/* 🎯 Phase 1.1c: Enhanced metadata with visual hierarchy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-gray-500 text-xs font-medium group-hover:text-gray-400 transition-colors duration-200">
              {paper.journal}
            </p>
            <span className="text-gray-600 text-xs">•</span>
            <p className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors duration-200">
              {paper.year}
            </p>
            {/* Publication recency indicator */}
            {paper.year && paper.year >= new Date().getFullYear() - 1 && (
              <span className="text-green-400 text-xs font-bold" title="Recent publication">NEW</span>
            )}
          </div>

          {/* Enhanced quality indicators */}
          <div className="flex items-center gap-1">
            {paper.impact_score && paper.impact_score > 8 && (
              <span className="text-purple-400 text-xs" title="High impact">💎</span>
            )}
            {paper.citation_count > 200 && <span className="text-yellow-400 text-xs" title="Highly cited">⭐</span>}
            {paper.citation_count > 100 && <span className="text-blue-400 text-xs" title="Well cited">🔥</span>}
            <span className="text-gray-500 text-xs font-medium">{paper.citation_count}</span>
          </div>
        </div>

        {/* 🎯 Phase 1.1c: Enhanced reason with better typography */}
        <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed group-hover:text-gray-300 transition-colors duration-200"
           style={{ fontStyle: 'italic', fontSize: '11px' }}>
          "{paper.reason}"
        </p>

        {/* 🧠 Phase 2A.2: Enhanced Expandable Semantic Analysis Features */}
        {paper.semantic_analysis && (
          <div className="space-y-2 pt-2 border-t border-gray-700/50">
            {/* Compact View - Always Visible */}
            <div className="flex items-center gap-2 flex-wrap">
              {paper.semantic_analysis.methodology && (
                <MethodologyBadge methodology={paper.semantic_analysis.methodology} size="sm" />
              )}
              {paper.semantic_analysis.novelty_type && (
                <NoveltyHighlight
                  noveltyType={paper.semantic_analysis.novelty_type}
                  size="sm"
                  variant={paper.semantic_analysis.novelty_type === 'breakthrough' ? 'glow' : 'badge'}
                />
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSemanticExpanded(!isSemanticExpanded);
                }}
                className="ml-auto flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-700/50"
                title={isSemanticExpanded ? "Hide details" : "Show full semantic analysis"}
              >
                <InformationCircleIcon className="w-3 h-3" />
                {isSemanticExpanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
              </button>
            </div>

            {/* Quick complexity preview when collapsed */}
            {!isSemanticExpanded && paper.semantic_analysis.complexity_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Complexity</span>
                <div className="flex-1">
                  <ComplexityIndicator
                    score={paper.semantic_analysis.complexity_score}
                    size="sm"
                    showLabel={false}
                    showScore={false}
                  />
                </div>
                <span className="text-gray-400 text-xs">
                  {(paper.semantic_analysis.complexity_score * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {/* Research domains preview when collapsed */}
            {!isSemanticExpanded && paper.semantic_analysis.research_domains && paper.semantic_analysis.research_domains.length > 0 && (
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">Domains</span>
                <DomainTags domains={paper.semantic_analysis.research_domains} maxDisplay={3} size="sm" />
              </div>
            )}

            {/* Expanded View - Toggleable */}
            {isSemanticExpanded && (
              <div className="space-y-3 pt-2 border-t border-gray-600/30 bg-gray-800/30 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                {/* Complexity indicator with full details */}
                {paper.semantic_analysis.complexity_score !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-medium">Technical Complexity</span>
                      <span className="text-white text-sm font-semibold">
                        {(paper.semantic_analysis.complexity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <ComplexityIndicator
                      score={paper.semantic_analysis.complexity_score}
                      size="md"
                      showLabel={false}
                      showScore={false}
                    />
                    <p className="text-gray-400 text-xs">
                      {paper.semantic_analysis.complexity_score < 0.3 ? "Beginner-friendly content" :
                       paper.semantic_analysis.complexity_score < 0.7 ? "Intermediate technical depth" :
                       "Advanced technical complexity"}
                    </p>
                  </div>
                )}

                {/* Research domains with full list */}
                {paper.semantic_analysis.research_domains && paper.semantic_analysis.research_domains.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-300 text-sm font-medium">Research Domains</span>
                    <DomainTags domains={paper.semantic_analysis.research_domains} maxDisplay={10} size="sm" />
                  </div>
                )}

                {/* Technical terms if available */}
                {paper.semantic_analysis.technical_terms && paper.semantic_analysis.technical_terms.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-gray-300 text-sm font-medium">Key Technical Terms</span>
                    <div className="flex flex-wrap gap-1">
                      {paper.semantic_analysis.technical_terms.slice(0, 8).map((term, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-md border border-blue-500/30"
                        >
                          {term}
                        </span>
                      ))}
                      {paper.semantic_analysis.technical_terms.length > 8 && (
                        <span className="px-2 py-1 text-gray-400 text-xs">
                          +{paper.semantic_analysis.technical_terms.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Confidence scores */}
                {paper.semantic_analysis.confidence_scores && (
                  <div className="space-y-2">
                    <span className="text-gray-300 text-sm font-medium">Analysis Confidence</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {Object.entries(paper.semantic_analysis.confidence_scores).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-gray-400 capitalize">{key}</div>
                          <div className="text-white font-semibold">{(value * 100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis metadata */}
                {paper.semantic_analysis.analysis_metadata && (
                  <div className="pt-2 border-t border-gray-600/30">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Analysis: {paper.semantic_analysis.analysis_metadata.service_initialized ? 'AI-powered' : 'Rule-based'}
                      </span>
                      {paper.semantic_analysis.analysis_metadata.analysis_time_seconds && (
                        <span>
                          {(paper.semantic_analysis.analysis_metadata.analysis_time_seconds * 1000).toFixed(0)}ms
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced action buttons */}
      <div className={`absolute top-4 right-4 flex gap-2 transition-all duration-200 ${
        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        <button
          onClick={handleSave}
          className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          {isSaved ? (
            <HeartSolidIcon className="w-4 h-4 text-[var(--spotify-green)]" />
          ) : (
            <HeartIcon className="w-4 h-4 text-white" />
          )}
        </button>
        
        <button
          onClick={() => onShare?.(paper)}
          className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <ShareIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

interface EnhancedScrollableSectionProps {
  section: RecommendationSection;
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  onSeeAll?: (category: string) => void;
  showPersonalizedGreeting?: boolean;
  userName?: string;
  isLoading?: boolean;
  showProgress?: boolean;
}

// Enhanced scrollable section with improved navigation and momentum scrolling
export const EnhancedScrollableSection: React.FC<EnhancedScrollableSectionProps> = ({
  section,
  onPlay,
  onSave,
  onShare,
  onSeeAll,
  showPersonalizedGreeting = false,
  userName = 'Researcher',
  isLoading = false,
  showProgress = false
}) => {
  // 🚨 IMMEDIATE TEST LOG
  console.log('🚨 SCROLLABLE SECTION LOADED! If you see this, the component is working!');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 🧪 TESTING LOGS: Component initialization
  useEffect(() => {
    console.log(`🧪 [EnhancedScrollableSection] Initialized section: "${section.title}"`);
    console.log(`📊 Papers count: ${section.papers.length}`);
    console.log(`🎯 Progress indicator threshold: Papers > 2 (adjusted for testing)`);
    console.log(`📋 Papers:`, section.papers.map(p => ({
      title: p.title.substring(0, 50) + '...',
      category: p.category,
      pmid: p.pmid
    })));
  }, [section]);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const newCanScrollLeft = scrollLeft > 0;
      const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 10;

      // 🧪 TESTING LOGS: Scroll button visibility
      if (newCanScrollLeft !== canScrollLeft || newCanScrollRight !== canScrollRight) {
        console.log(`🖱️ [ScrollButtons] Section: "${section.title}"`);
        console.log(`   📐 Dimensions: scrollLeft=${scrollLeft}, scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
        console.log(`   ⬅️ Can scroll left: ${newCanScrollLeft} (was: ${canScrollLeft})`);
        console.log(`   ➡️ Can scroll right: ${newCanScrollRight} (was: ${canScrollRight})`);
      }

      setCanScrollLeft(newCanScrollLeft);
      setCanScrollRight(newCanScrollRight);

      // Calculate scroll progress for progress indicator
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;

      // 🧪 TESTING LOGS: Progress indicator
      if (Math.abs(progress - scrollProgress) > 5) { // Log significant changes
        console.log(`📊 [ProgressIndicator] Section: "${section.title}"`);
        console.log(`   📈 Progress: ${Math.round(progress)}% (was: ${Math.round(scrollProgress)}%)`);
        console.log(`   🎯 Show progress: ${showProgress && section.papers.length > 2}`);
      }

      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      // 🧪 TESTING LOGS: Scroll event listener setup
      console.log(`🔧 [Setup] Adding scroll listener for section: "${section.title}"`);

      const handleScroll = () => {
        checkScrollButtons();

        // 🧪 TESTING LOGS: Snap-to-grid behavior
        const { scrollLeft } = container;
        const cardWidth = 208 + 24; // card width + gap
        const nearestSnapPoint = Math.round(scrollLeft / cardWidth) * cardWidth;
        const snapDistance = Math.abs(scrollLeft - nearestSnapPoint);

        if (snapDistance < 5) { // Close to snap point
          console.log(`📐 [SnapToGrid] Section: "${section.title}"`);
          console.log(`   📍 ScrollLeft: ${scrollLeft}px`);
          console.log(`   🎯 Nearest snap point: ${nearestSnapPoint}px`);
          console.log(`   📏 Snap distance: ${snapDistance}px`);
          console.log(`   ✅ Snapped to grid!`);
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        console.log(`🔧 [Cleanup] Removing scroll listener for section: "${section.title}"`);
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [section.papers]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // 🧪 TESTING LOGS: Button scroll functionality
      console.log(`🖱️ [ButtonScroll] Section: "${section.title}"`);
      console.log(`   🎯 Direction: ${direction}`);
      console.log(`   📍 Current scrollLeft: ${scrollContainerRef.current.scrollLeft}`);

      setIsScrolling(true);

      // Enhanced scroll amount calculation - scroll by 2-3 cards
      const cardWidth = 320; // Increased for testing - force scrollable content
      const gap = 24; // gap-6 = 24px
      const scrollAmount = (cardWidth + gap) * 2.5; // Scroll by 2.5 cards for better UX

      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      console.log(`   📐 Scroll amount: ${scrollAmount}px`);
      console.log(`   🎯 Target scrollLeft: ${newScrollLeft}`);
      console.log(`   ⚡ Animation: smooth scrolling enabled`);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      // Reset scrolling state after animation
      setTimeout(() => {
        setIsScrolling(false);
        console.log(`   ✅ [ButtonScroll] Animation completed for "${section.title}"`);
      }, 500);
    }
  };

  // Enhanced scroll with momentum (for mouse wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // 🧪 TESTING LOGS: Mouse wheel scrolling
      console.log(`🖱️ [WheelScroll] Section: "${section.title}"`);
      console.log(`   📍 Current scrollLeft: ${scrollContainerRef.current.scrollLeft}`);
      console.log(`   🎯 Delta X: ${e.deltaX}, Delta Y: ${e.deltaY}`);
      console.log(`   ✅ Horizontal scroll detected (|deltaX| > |deltaY|)`);

      e.preventDefault();
      setIsScrolling(true);

      const oldScrollLeft = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollLeft += e.deltaX;

      console.log(`   📐 Scroll change: ${scrollContainerRef.current.scrollLeft - oldScrollLeft}px`);
      console.log(`   ⚡ Momentum scrolling active`);

      setTimeout(() => {
        setIsScrolling(false);
        console.log(`   ✅ [WheelScroll] Momentum completed for "${section.title}"`);
      }, 300);
    } else if (scrollContainerRef.current) {
      // 🧪 TESTING LOGS: Vertical scroll ignored
      console.log(`🖱️ [WheelScroll] Section: "${section.title}" - Vertical scroll ignored`);
      console.log(`   📊 Delta X: ${e.deltaX}, Delta Y: ${e.deltaY}`);
    }
  };

  return (
    <div className="mb-12">
      {/* Enhanced section header with personalization */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">
              {showPersonalizedGreeting ? `Good ${getTimeOfDay()}, ${userName}` : section.title}
            </h2>

            {/* Section icon based on category */}
            {section.title.toLowerCase().includes('trending') && (
              <FireIcon className="w-6 h-6 text-orange-400" />
            )}
            {section.title.toLowerCase().includes('personalized') && (
              <SparklesIcon className="w-6 h-6 text-green-400" />
            )}
            {section.title.toLowerCase().includes('cross') && (
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            )}
          </div>

          <p className="text-gray-400 text-sm mb-1">{section.description}</p>

          {/* Enhanced metadata with loading state */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Updated {new Date(section.updated).toLocaleDateString()}</span>
            <span>•</span>
            <span>{section.papers.length} papers</span>
            {isLoading && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          {showProgress && section.papers.length > 2 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(scrollProgress)}%
              </span>
            </div>
          )}

          <button
            onClick={() => onSeeAll?.(section.title)}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-1 rounded-full hover:bg-white/10"
          >
            Show all
          </button>
        </div>
      </div>

      {/* Enhanced scrollable container with improved controls */}
      <div
        className="relative group"
        onMouseEnter={() => {
          console.log(`🖱️ [HoverDetection] Mouse entered section: "${section.title}"`);
          console.log(`   👁️ Scroll buttons should become visible on hover`);
          console.log(`   ⬅️ Left button visible: ${canScrollLeft}`);
          console.log(`   ➡️ Right button visible: ${canScrollRight}`);
        }}
        onMouseLeave={() => {
          console.log(`🖱️ [HoverDetection] Mouse left section: "${section.title}"`);
          console.log(`   👁️ Scroll buttons should fade out`);
        }}
      >
        {/* Enhanced left scroll button */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-black/90 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border border-white/10 ${
            canScrollLeft
              ? 'opacity-0 group-hover:opacity-100 hover:bg-black hover:scale-110 hover:shadow-2xl'
              : 'opacity-0 pointer-events-none'
          } ${isScrolling ? 'animate-pulse' : ''}`}
        >
          <ChevronLeftIcon className="w-7 h-7 text-white" />
        </button>

        {/* Enhanced right scroll button */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-black/90 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border border-white/10 ${
            canScrollRight
              ? 'opacity-0 group-hover:opacity-100 hover:bg-black hover:scale-110 hover:shadow-2xl'
              : 'opacity-0 pointer-events-none'
          } ${isScrolling ? 'animate-pulse' : ''}`}
        >
          <ChevronRightIcon className="w-7 h-7 text-white" />
        </button>

        {/* Cards container with enhanced scrolling and momentum */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className={`flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-2 transition-all duration-300 ${
            isScrolling ? 'scroll-smooth' : ''
          }`}
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth'
          }}
        >
          {section.papers.map((paper, index) => (
            <div
              key={paper.pmid || index}
              className="flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <EnhancedSpotifyCard
                paper={paper}
                onPlay={onPlay}
                onSave={onSave}
                onShare={onShare}
                size="medium"
                showAuthorPhotos={true}
                showTrendGraph={section.title.includes('Trending')}
              />
            </div>
          ))}

          {/* Loading skeleton cards */}
          {isLoading && Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="flex-shrink-0">
              <div className="w-52 h-72 bg-gray-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>

        {/* Gradient fade effects on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

// Enhanced helper function for personalized greeting
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
};

// Get contextual greeting based on time and day
const getContextualGreeting = (userName: string): string => {
  const timeOfDay = getTimeOfDay();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  const greetings = {
    morning: isWeekend ? `Good morning, ${userName}! Ready for some weekend research?` : `Good morning, ${userName}!`,
    afternoon: isWeekend ? `Good afternoon, ${userName}! Hope you're having a productive weekend.` : `Good afternoon, ${userName}!`,
    evening: `Good evening, ${userName}! Time for some evening discoveries.`,
    night: `Working late, ${userName}? Here's what's new.`
  };

  return greetings[timeOfDay as keyof typeof greetings] || `Hello, ${userName}!`;
};

export default EnhancedScrollableSection;
