'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, HeartIcon, ShareIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';

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
    'biology': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'physics': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'chemistry': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'medicine': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'engineering': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'mathematics': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'computer_science': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'default': 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'
  };
  
  return colorMap[category.toLowerCase()] || colorMap.default;
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

  return (
    <div 
      className={`${sizeClasses[size]} bg-[var(--spotify-card-bg)] rounded-xl p-4 hover:bg-[var(--spotify-card-hover)] transition-all duration-300 cursor-pointer group relative transform hover:scale-105 hover:shadow-2xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--spotify-card-bg': '#181818',
        '--spotify-card-hover': '#282828'
      } as React.CSSProperties}
    >
      {/* Enhanced Cover Art with Dynamic Gradients */}
      <div 
        className="w-full aspect-square rounded-xl mb-4 relative overflow-hidden shadow-lg"
        style={{ 
          background: getFieldColor(paper.category),
          boxShadow: isHovered ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)'
        }}
      >
        {/* Animated gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 transition-opacity duration-300 ${
          isHovered ? 'opacity-60' : 'opacity-30'
        }`} />
        
        {/* Enhanced category badge with icon */}
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-semibold flex items-center gap-1">
          {paper.category === 'ai_ml' && <SparklesIcon className="w-3 h-3" />}
          {paper.category === 'trending' && <FireIcon className="w-3 h-3" />}
          {paper.category === 'hot' && <FireIcon className="w-3 h-3" />}
          {paper.category.replace('_', ' ').toUpperCase()}
        </div>

        {/* Impact indicators */}
        {paper.citation_count > 100 && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">🏆</span>
          </div>
        )}
        
        {/* Enhanced play button with ripple effect */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}>
          <button
            onClick={handlePlay}
            className={`w-14 h-14 bg-[var(--spotify-green)] rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-xl ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              background: isPlaying ? 
                'radial-gradient(circle, #1ed760 0%, #1db954 70%)' : 
                'linear-gradient(135deg, #1ed760 0%, #1db954 100%)'
            }}
          >
            <PlayIcon className="w-7 h-7 text-black ml-0.5" />
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
      <div className="space-y-2">
        {/* Title with better typography */}
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-[var(--spotify-green)] transition-colors duration-200">
          {paper.title}
        </h3>
        
        {/* Authors with photos */}
        <div className="flex items-center gap-2">
          {showAuthorPhotos && paper.authors.slice(0, 3).map((author, index) => (
            <div key={index} className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xs text-white font-medium">
              {author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          ))}
          <p className="text-gray-400 text-xs truncate flex-1">
            {paper.authors.slice(0, 2).join(', ')}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
          </p>
        </div>

        {/* Journal and year */}
        <p className="text-gray-500 text-xs">
          {paper.journal} • {paper.year}
        </p>

        {/* Reason with better styling */}
        <p className="text-gray-400 text-xs line-clamp-2 italic">
          "{paper.reason}"
        </p>
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
}

// Enhanced scrollable section with improved navigation
export const EnhancedScrollableSection: React.FC<EnhancedScrollableSectionProps> = ({
  section,
  onPlay,
  onSave,
  onShare,
  onSeeAll,
  showPersonalizedGreeting = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [section.papers]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of card + gap
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-12">
      {/* Enhanced section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {showPersonalizedGreeting ? `Good ${getTimeOfDay()}, Researcher` : section.title}
          </h2>
          <p className="text-gray-400 text-sm">{section.description}</p>
          <p className="text-gray-500 text-xs mt-1">{section.updated}</p>
        </div>
        
        <button
          onClick={() => onSeeAll?.(section.title)}
          className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
        >
          Show all
        </button>
      </div>

      {/* Enhanced scrollable container */}
      <div className="relative group">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 ${
            canScrollLeft ? 'opacity-100 hover:bg-black/90' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 ${
            canScrollRight ? 'opacity-100 hover:bg-black/90' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRightIcon className="w-6 h-6 text-white" />
        </button>

        {/* Cards container with enhanced scrolling */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        >
          {section.papers.map((paper, index) => (
            <div key={paper.pmid || index} className="flex-shrink-0">
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
        </div>
      </div>
    </div>
  );
};

// Helper function for personalized greeting
const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export default EnhancedScrollableSection;
