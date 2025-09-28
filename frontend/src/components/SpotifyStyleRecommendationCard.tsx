import React, { useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  SparklesIcon,
  FireIcon,
  LightBulbIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';

interface RecommendationCardProps {
  paper: {
    pmid: string;
    title: string;
    abstract: string;
    authors: string[];
    journal: string;
    publication_year: number;
    overall_score?: number;
    recommendation_reason?: string;
    research_domain?: string;
    estimated_reading_time?: number;
    difficulty_level?: number;
  };
  type: 'trending' | 'for_you' | 'cross_domain' | 'discovery';
  onPlay?: (pmid: string) => void;
  onLike?: (pmid: string) => void;
  onBookmark?: (pmid: string) => void;
  onShare?: (pmid: string) => void;
  isPlaying?: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export default function SpotifyStyleRecommendationCard({
  paper,
  type,
  onPlay,
  onLike,
  onBookmark,
  onShare,
  isPlaying = false,
  isLiked = false,
  isBookmarked = false
}: RecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullAbstract, setShowFullAbstract] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'trending':
        return <FireIcon className="h-4 w-4 text-red-500" />;
      case 'for_you':
        return <SparklesIcon className="h-4 w-4 text-purple-500" />;
      case 'cross_domain':
        return <GlobeAltIcon className="h-4 w-4 text-green-500" />;
      case 'discovery':
        return <LightBulbIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'trending':
        return 'from-red-500 to-orange-500';
      case 'for_you':
        return 'from-purple-500 to-pink-500';
      case 'cross_domain':
        return 'from-green-500 to-teal-500';
      case 'discovery':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getDifficultyBadge = (level: number) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Specialist'];
    const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return {
      label: levels[level - 1] || 'Unknown',
      color: colors[level - 1] || 'bg-gray-100 text-gray-800'
    };
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const difficultyBadge = getDifficultyBadge(paper.difficulty_level || 3);

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        isHovered ? 'ring-2 ring-indigo-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with gradient and type indicator */}
      <div className={`h-2 bg-gradient-to-r ${getTypeColor()}`} />
      
      <div className="p-6">
        {/* Top row with type and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {type.replace('_', ' ')}
            </span>
            {paper.overall_score && (
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                {Math.round(paper.overall_score * 100)}% match
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Play/Pause button (for deep dive) */}
            <button
              onClick={() => onPlay?.(paper.pmid)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
              }`}
            >
              {isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
            
            {/* Like button */}
            <button
              onClick={() => onLike?.(paper.pmid)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
            >
              {isLiked ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
            </button>
            
            {/* Bookmark button */}
            <button
              onClick={() => onBookmark?.(paper.pmid)}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
          {paper.title}
        </h3>

        {/* Authors and Journal */}
        <div className="text-sm text-gray-600 mb-3">
          <p className="font-medium">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</p>
          <p className="text-xs">{paper.journal} • {paper.publication_year}</p>
        </div>

        {/* Abstract */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {showFullAbstract ? paper.abstract : truncateText(paper.abstract, 200)}
          </p>
          {paper.abstract.length > 200 && (
            <button
              onClick={() => setShowFullAbstract(!showFullAbstract)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
            >
              {showFullAbstract ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {paper.research_domain && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {paper.research_domain}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${difficultyBadge.color}`}>
            {difficultyBadge.label}
          </span>
          {paper.estimated_reading_time && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {paper.estimated_reading_time} min read
            </span>
          )}
        </div>

        {/* Recommendation reason */}
        {paper.recommendation_reason && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <SparklesIcon className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-700 font-medium">
                {paper.recommendation_reason}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay?.(paper.pmid)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
            >
              <PlayIcon className="h-4 w-4" />
              Deep Dive
            </button>
            
            <button
              onClick={() => onShare?.(paper.pmid)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
            >
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
          </div>

          <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hover overlay effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor()} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
    </div>
  );
}
