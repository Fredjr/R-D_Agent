'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { SpotifyCleanArticleCard } from './SpotifyCleanArticleCard';
import { cn } from '@/lib/utils';

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
  semantic_analysis?: {
    methodology?: 'experimental' | 'theoretical' | 'computational' | 'review' | 'meta_analysis' | 'case_study' | 'survey';
    complexity_score?: number;
    novelty_type?: 'breakthrough' | 'incremental' | 'replication' | 'review';
    research_domains?: string[];
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
  icon: React.ComponentType<any>;
  color: string;
  category: string;
}

interface SpotifyCleanSectionProps {
  section: RecommendationSection;
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  onSeeAll?: (category: string) => void;
  showPersonalizedGreeting?: boolean;
  userName?: string;
  isLoading?: boolean;
}

export const SpotifyCleanSection: React.FC<SpotifyCleanSectionProps> = ({
  section,
  onPlay,
  onSave,
  onShare,
  onSeeAll,
  showPersonalizedGreeting = false,
  userName = 'Researcher',
  isLoading = false
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

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userName}`;
    if (hour < 17) return `Good afternoon, ${userName}`;
    return `Good evening, ${userName}`;
  };

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--spotify-white)] mb-1">
            {showPersonalizedGreeting ? getTimeBasedGreeting() : section.title}
          </h2>
          {section.description && (
            <p className="text-[var(--spotify-light-text)] text-sm">
              {section.description}
            </p>
          )}
        </div>
        
        {section.papers.length > 0 && (
          <button
            onClick={() => onSeeAll?.(section.category)}
            className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] text-sm font-medium transition-colors flex-shrink-0"
          >
            Show all
          </button>
        )}
      </div>

      {/* Cards Container */}
      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--spotify-black)]/80 hover:bg-[var(--spotify-black)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[var(--spotify-white)]" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-[var(--spotify-black)]/80 hover:bg-[var(--spotify-black)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          >
            <ChevronRightIcon className="w-5 h-5 text-[var(--spotify-white)]" />
          </button>
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-40">
                <div className="h-40 bg-[var(--spotify-dark-gray)] rounded-lg animate-pulse mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--spotify-dark-gray)] rounded animate-pulse"></div>
                  <div className="h-3 bg-[var(--spotify-dark-gray)] rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-[var(--spotify-dark-gray)] rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            section.papers.map((paper, index) => (
              <div key={paper.pmid || index} className="flex-shrink-0">
                <SpotifyCleanArticleCard
                  paper={paper}
                  onPlay={onPlay}
                  onSave={onSave}
                  onShare={onShare}
                  size="md"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && section.papers.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--spotify-dark-gray)] rounded-full flex items-center justify-center">
            <section.icon className="w-8 h-8 text-[var(--spotify-light-text)]" />
          </div>
          <p className="text-[var(--spotify-light-text)] text-sm">
            No papers available in this section yet.
          </p>
        </div>
      )}
    </section>
  );
};

export default SpotifyCleanSection;
