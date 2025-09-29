import React, { useState } from 'react';
import { 
  SparklesIcon, 
  BeakerIcon, 
  AcademicCapIcon,
  LightBulbIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface SemanticEnhancedResultsCardProps {
  semanticAnalysis?: {
    expanded_queries: string[];
    concept_mappings: { [key: string]: string[] };
    domain_bridges: string[];
    semantic_clusters: any[];
    related_concepts: string[];
  };
  personalization?: {
    relevance_scores: { [pmid: string]: number };
    user_interest_alignment: { [pmid: string]: number };
    recommendation_reasons: { [pmid: string]: string };
    follow_up_suggestions: string[];
  };
  contentQuality?: {
    semantic_coverage: number;
    concept_completeness: number;
    cross_domain_insights: number;
    novelty_score: number;
  };
  className?: string;
}

export function SemanticEnhancedResultsCard({
  semanticAnalysis,
  personalization,
  contentQuality,
  className = ''
}: SemanticEnhancedResultsCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!semanticAnalysis && !personalization && !contentQuality) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Semantic Intelligence</h3>
            <p className="text-sm text-gray-600">AI-powered insights and enhancements</p>
          </div>
        </div>

        {/* Content Quality Metrics */}
        {contentQuality && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(contentQuality.semantic_coverage * 100)}%
                </div>
                <div className="text-xs text-gray-600">Semantic Coverage</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(contentQuality.concept_completeness * 100)}%
                </div>
                <div className="text-xs text-gray-600">Concept Complete</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">
                  {contentQuality.cross_domain_insights}
                </div>
                <div className="text-xs text-gray-600">Cross-Domain</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(contentQuality.novelty_score * 100)}%
                </div>
                <div className="text-xs text-gray-600">Novelty Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Semantic Analysis Section */}
        {semanticAnalysis && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('semantic')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BeakerIcon className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Semantic Analysis</span>
                <span className="text-sm text-gray-500">
                  ({semanticAnalysis.expanded_queries.length} expanded queries, {semanticAnalysis.related_concepts.length} concepts)
                </span>
              </div>
              {expandedSection === 'semantic' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'semantic' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* Expanded Queries */}
                {semanticAnalysis.expanded_queries.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Expanded Search Queries</h4>
                    <div className="flex flex-wrap gap-2">
                      {semanticAnalysis.expanded_queries.map((query, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {query}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Concepts */}
                {semanticAnalysis.related_concepts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Related Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {semanticAnalysis.related_concepts.slice(0, 10).map((concept, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domain Bridges */}
                {semanticAnalysis.domain_bridges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cross-Domain Connections</h4>
                    <div className="space-y-2">
                      {semanticAnalysis.domain_bridges.slice(0, 5).map((bridge, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800">{bridge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Personalization Section */}
        {personalization && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('personalization')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Personalized Insights</span>
                <span className="text-sm text-gray-500">
                  ({personalization.follow_up_suggestions.length} suggestions)
                </span>
              </div>
              {expandedSection === 'personalization' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'personalization' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* Follow-up Suggestions */}
                {personalization.follow_up_suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Next Steps</h4>
                    <div className="space-y-2">
                      {personalization.follow_up_suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
                        >
                          <LightBulbIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
          <span>Enhanced with semantic AI</span>
          <div className="flex items-center gap-4">
            {semanticAnalysis && (
              <span>{semanticAnalysis.expanded_queries.length} queries expanded</span>
            )}
            {contentQuality && (
              <span>{Math.round(contentQuality.semantic_coverage * 100)}% coverage</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
