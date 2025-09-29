import React, { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  FireIcon, 
  SparklesIcon,
  ArrowPathIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useWeeklyMixIntegration } from '@/hooks/useWeeklyMixIntegration';

interface SemanticPaper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  relevance_score: number;
  reason: string;
  category: string;
  semantic_analysis?: {
    methodology?: string;
    complexity_score?: number;
    novelty_type?: string;
    research_domains?: string[];
    technical_terms?: string[];
  };
}

interface SemanticSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  papers: SemanticPaper[];
  queryType: 'cross_domain' | 'trending_semantic' | 'semantic_personalized';
  loading?: boolean;
  onPaperClick?: (paper: SemanticPaper) => void;
  onSeeAll?: (queryType: string) => void;
}

function SemanticSection({ 
  title, 
  description, 
  icon: Icon, 
  papers, 
  queryType, 
  loading = false,
  onPaperClick,
  onSeeAll 
}: SemanticSectionProps) {
  const { trackSemanticDiscovery, trackPaperView } = useWeeklyMixIntegration();

  const handlePaperClick = (paper: SemanticPaper) => {
    // Track paper view for weekly mix
    trackPaperView(paper.pmid, paper.title, 'semantic_discovery', { queryType });
    
    if (onPaperClick) {
      onPaperClick(paper);
    }
  };

  const handleSeeAll = () => {
    // Track semantic discovery interaction
    trackSemanticDiscovery('', title, queryType);

    if (onSeeAll) {
      onSeeAll(queryType);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-64 h-4 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-3/4 h-3 bg-gray-100 rounded mb-2"></div>
              <div className="w-1/2 h-3 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        
        {papers.length > 0 && (
          <button
            onClick={handleSeeAll}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            <span>See all</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Papers Grid */}
      {papers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.slice(0, 6).map((paper) => (
            <div
              key={paper.pmid}
              onClick={() => handlePaperClick(paper)}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300"
            >
              <div className="mb-3">
                <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                  {paper.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {paper.authors.slice(0, 2).join(', ')}
                  {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{paper.journal}</span>
                  <span>{paper.year}</span>
                </div>
              </div>
              
              {/* Semantic Analysis Badges */}
              {paper.semantic_analysis && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {paper.semantic_analysis.methodology && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {paper.semantic_analysis.methodology}
                    </span>
                  )}
                  {paper.semantic_analysis.novelty_type && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {paper.semantic_analysis.novelty_type}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {paper.citation_count} citations
                </span>
                <span className="text-xs font-medium text-blue-600">
                  {Math.round(paper.relevance_score * 100)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No papers found for this category yet.</p>
          <p className="text-sm">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
}

interface SemanticRecommendationSectionsProps {
  crossDomainPapers?: SemanticPaper[];
  trendingPapers?: SemanticPaper[];
  personalizedPapers?: SemanticPaper[];
  loading?: boolean;
  onPaperClick?: (paper: SemanticPaper) => void;
  onSeeAll?: (queryType: string) => void;
}

export default function SemanticRecommendationSections({
  crossDomainPapers = [],
  trendingPapers = [],
  personalizedPapers = [],
  loading = false,
  onPaperClick,
  onSeeAll
}: SemanticRecommendationSectionsProps) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize sections after component mount
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cross-Domain Insights Section */}
      <SemanticSection
        title="🌐 Cross-Domain Insights"
        description="Discover unexpected connections across research fields"
        icon={GlobeAltIcon}
        papers={crossDomainPapers}
        queryType="cross_domain"
        loading={loading}
        onPaperClick={onPaperClick}
        onSeeAll={onSeeAll}
      />

      {/* Trending Discoveries Section */}
      <SemanticSection
        title="🔥 Trending Discoveries"
        description="Hot papers emerging in related research areas"
        icon={FireIcon}
        papers={trendingPapers}
        queryType="trending_semantic"
        loading={loading}
        onPaperClick={onPaperClick}
        onSeeAll={onSeeAll}
      />

      {/* Semantic Matches Section */}
      <SemanticSection
        title="🎯 Semantic Matches"
        description="Papers semantically similar to your research interests"
        icon={SparklesIcon}
        papers={personalizedPapers}
        queryType="semantic_personalized"
        loading={loading}
        onPaperClick={onPaperClick}
        onSeeAll={onSeeAll}
      />
    </div>
  );
}

export { SemanticSection };
export type { SemanticPaper, SemanticSectionProps, SemanticRecommendationSectionsProps };
