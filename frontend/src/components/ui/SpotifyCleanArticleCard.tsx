'use client';

import React, { useState } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon, 
  ShareIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface SpotifyCleanArticleCardProps {
  paper: {
    pmid: string;
    title: string;
    authors: string[];
    journal?: string;
    year?: number;
    abstract?: string;
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
  };
  onPlay?: (paper: any) => void;
  onSave?: (paper: any) => void;
  onShare?: (paper: any) => void;
  onClick?: (paper: any) => void;
  isPlaying?: boolean;
  isSaved?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SpotifyCleanArticleCard({
  paper,
  onPlay,
  onSave,
  onShare,
  onClick,
  isPlaying = false,
  isSaved = false,
  size = 'md'
}: SpotifyCleanArticleCardProps) {
  const [showSemanticDetails, setShowSemanticDetails] = useState(false);

  const sizeClasses = {
    sm: 'w-32',
    md: 'w-40',
    lg: 'w-48'
  };

  const imageSizeClasses = {
    sm: 'h-32',
    md: 'h-40',
    lg: 'h-48'
  };

  // Generate a visual representation for the paper
  const getArticleVisual = () => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500'
    ];
    
    const colorIndex = parseInt(paper.pmid.slice(-1)) % colors.length;
    const gradient = colors[colorIndex];
    
    return (
      <div className={cn(
        "relative rounded-lg bg-gradient-to-br overflow-hidden group-hover:shadow-lg transition-all duration-300",
        gradient,
        imageSizeClasses[size]
      )}>
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-full"></div>
          <div className="absolute top-6 right-3 w-4 h-4 border border-white rounded"></div>
          <div className="absolute bottom-4 left-3 w-12 h-1 bg-white rounded"></div>
          <div className="absolute bottom-6 left-3 w-8 h-1 bg-white rounded"></div>
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(paper);
            }}
            className="w-12 h-12 bg-[var(--spotify-green)] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 text-black" />
            ) : (
              <PlayIcon className="w-6 h-6 text-black ml-0.5" />
            )}
          </button>
        </div>
        
        {/* Journal badge */}
        {paper.year && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs font-medium">
            {paper.year}
          </div>
        )}
      </div>
    );
  };

  const primaryAuthor = (paper.authors && paper.authors.length > 0) ? paper.authors[0] : 'Unknown Author';
  const additionalAuthors = (paper.authors && paper.authors.length > 1) ? ` +${paper.authors.length - 1}` : '';

  return (
    <div
      className={cn("group cursor-pointer", sizeClasses[size])}
      onClick={() => onClick?.(paper)}
    >
      {/* Article Visual */}
      {getArticleVisual()}
      
      {/* Article Info */}
      <div className="mt-3 space-y-1">
        {/* Title */}
        <h3 className="text-[var(--spotify-white)] font-medium text-sm line-clamp-2 group-hover:text-[var(--spotify-green)] transition-colors">
          {paper.title}
        </h3>
        
        {/* Authors */}
        <p className="text-[var(--spotify-light-text)] text-xs">
          {primaryAuthor}{additionalAuthors}
        </p>
        
        {/* Journal */}
        {paper.journal && (
          <p className="text-[var(--spotify-muted-text)] text-xs">
            {paper.journal}
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(paper);
            }}
            className="p-1 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            {isSaved ? (
              <BookmarkIconSolid className="w-4 h-4 text-[var(--spotify-green)]" />
            ) : (
              <BookmarkIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(paper);
            }}
            className="p-1 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Semantic Analysis Toggle */}
        {paper.semantic_analysis && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSemanticDetails(!showSemanticDetails);
            }}
            className="p-1 text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] transition-colors"
          >
            <InformationCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Semantic Analysis Details - Clean Overlay */}
      {showSemanticDetails && paper.semantic_analysis && (
        <div className="mt-3 p-3 bg-[var(--spotify-dark-gray)] rounded-lg border border-[var(--spotify-border-gray)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[var(--spotify-white)] text-xs font-medium">Analysis</span>
            <button
              onClick={() => setShowSemanticDetails(false)}
              className="text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)]"
            >
              <ChevronUpIcon className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            {paper.semantic_analysis.complexity_score !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--spotify-light-text)]">Complexity:</span>
                <span className="text-[var(--spotify-white)]">{paper.semantic_analysis.complexity_score}/10</span>
              </div>
            )}
            
            {paper.semantic_analysis.methodology && (
              <div className="flex justify-between">
                <span className="text-[var(--spotify-light-text)]">Method:</span>
                <span className="text-[var(--spotify-white)] capitalize">{paper.semantic_analysis.methodology}</span>
              </div>
            )}
            
            {paper.semantic_analysis.novelty_type && (
              <div className="flex justify-between">
                <span className="text-[var(--spotify-light-text)]">Novelty:</span>
                <span className="text-[var(--spotify-white)] capitalize">{paper.semantic_analysis.novelty_type}</span>
              </div>
            )}
            
            {paper.semantic_analysis.research_domains && paper.semantic_analysis.research_domains.length > 0 && (
              <div>
                <span className="text-[var(--spotify-light-text)]">Domains:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {paper.semantic_analysis.research_domains.slice(0, 2).map((domain, index) => (
                    <span key={index} className="px-2 py-0.5 bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] rounded text-xs">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpotifyCleanArticleCard;
