/**
 * Phase 2A.2: Enhanced Paper Card with Semantic Analysis
 * Paper card component enhanced with semantic analysis visual indicators
 */

'use client';

import React from 'react';
import { MethodologyBadge, ComplexityIndicator, NoveltyHighlight, DomainTags } from './SemanticBadges';

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

interface SemanticPaperCardProps {
  paper: Paper;
  onClick?: () => void;
  showSemanticDetails?: boolean;
  variant?: 'compact' | 'detailed' | 'minimal';
}

export function SemanticPaperCard({ 
  paper, 
  onClick, 
  showSemanticDetails = true, 
  variant = 'detailed' 
}: SemanticPaperCardProps) {
  const semantic = paper.semantic_analysis;
  const hasSemanticData = Boolean(semantic);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const renderSemanticHeader = () => {
    if (!hasSemanticData || !showSemanticDetails) return null;

    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {semantic?.methodology && (
            <MethodologyBadge methodology={semantic.methodology} size="sm" />
          )}
          {semantic?.novelty_type && (
            <NoveltyHighlight noveltyType={semantic.novelty_type} size="sm" variant="badge" />
          )}
        </div>
        {semantic?.novelty_type === 'breakthrough' && (
          <div className="flex items-center gap-1 text-red-600">
            <span className="text-xs">🚀</span>
            <span className="text-xs font-medium">Breakthrough</span>
          </div>
        )}
      </div>
    );
  };

  const renderSemanticFooter = () => {
    if (!hasSemanticData || !showSemanticDetails || variant === 'minimal') return null;

    return (
      <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
        {/* Complexity Indicator */}
        {semantic?.complexity_score !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Technical Complexity</span>
              <span className="text-xs text-gray-500">
                {(semantic.complexity_score * 100).toFixed(0)}%
              </span>
            </div>
            <ComplexityIndicator 
              score={semantic.complexity_score} 
              size="sm" 
              showLabel={false} 
              showScore={false}
            />
          </div>
        )}

        {/* Research Domains */}
        {semantic?.research_domains && semantic.research_domains.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-600">Research Domains</span>
            <DomainTags domains={semantic.research_domains} maxDisplay={4} size="sm" />
          </div>
        )}

        {/* Technical Terms (for detailed variant) */}
        {variant === 'detailed' && semantic?.technical_terms && semantic.technical_terms.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-600">Key Terms</span>
            <div className="flex flex-wrap gap-1">
              {semantic.technical_terms.slice(0, 5).map((term, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                >
                  {term}
                </span>
              ))}
              {semantic.technical_terms.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{semantic.technical_terms.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Confidence Scores (for detailed variant) */}
        {variant === 'detailed' && semantic?.confidence_scores && (
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>Confidence:</span>
            <span>Method {(semantic.confidence_scores.methodology * 100).toFixed(0)}%</span>
            <span>Complexity {(semantic.confidence_scores.complexity * 100).toFixed(0)}%</span>
            <span>Novelty {(semantic.confidence_scores.novelty * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    );
  };

  const cardClasses = `
    bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer
    ${hasSemanticData ? 'border-l-4 border-l-blue-400' : ''}
  `;

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      {/* Semantic Header */}
      {renderSemanticHeader()}

      {/* Paper Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {paper.title}
      </h3>

      {/* Authors */}
      <p className="text-sm text-gray-600 mb-2">
        {paper.authors.slice(0, 3).join(', ')}
        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
      </p>

      {/* Journal and Year */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        {paper.journal && <span>{paper.journal}</span>}
        {paper.journal && paper.year && <span>•</span>}
        {paper.year && <span>{paper.year}</span>}
        {paper.citation_count > 0 && (
          <>
            <span>•</span>
            <span>{paper.citation_count} citations</span>
          </>
        )}
      </div>

      {/* Reason/Category */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
        {paper.reason}
      </p>

      {/* Spotify-style indicators (if present) */}
      {paper.spotify_style && (
        <div className="flex items-center gap-2 mb-2">
          {paper.spotify_style.trend_indicator && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {paper.spotify_style.trend_indicator}
            </span>
          )}
          {paper.spotify_style.discovery_badge && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {paper.spotify_style.discovery_badge}
            </span>
          )}
          {paper.spotify_style.opportunity_badge && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {paper.spotify_style.opportunity_badge}
            </span>
          )}
        </div>
      )}

      {/* Semantic Footer */}
      {renderSemanticFooter()}

      {/* Semantic Analysis Status Indicator */}
      {hasSemanticData && showSemanticDetails && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Semantic analysis available" />
        </div>
      )}
    </div>
  );
}
