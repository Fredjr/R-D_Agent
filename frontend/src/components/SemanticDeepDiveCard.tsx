import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface SemanticDeepDiveCardProps {
  semanticAnalysis?: {
    paper_concepts: string[];
    research_domain: string;
    methodology_type: string;
    related_concepts: string[];
    cross_domain_connections: string[];
    semantic_keywords: string[];
  };
  relatedPapers?: {
    similar_methodology: any[];
    similar_domain: any[];
    citing_papers: any[];
    referenced_papers: any[];
    cross_domain_applications: any[];
  };
  userInsights?: {
    relevance_to_user: number;
    connection_to_user_research: string[];
    potential_applications: string[];
    follow_up_opportunities: string[];
    collaboration_suggestions: string[];
  };
  recommendations?: {
    next_papers_to_read: any[];
    related_methodologies: string[];
    potential_collaborations: string[];
    research_directions: string[];
  };
  contentAnalysis?: {
    extraction_quality: string;
    semantic_completeness: number;
    concept_coverage: number;
    methodology_clarity: number;
    results_interpretability: number;
  };
  className?: string;
}

export function SemanticDeepDiveCard({
  semanticAnalysis,
  relatedPapers,
  userInsights,
  recommendations,
  contentAnalysis,
  className = ''
}: SemanticDeepDiveCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!semanticAnalysis && !relatedPapers && !userInsights && !recommendations) {
    return null;
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent':
      case 'full_text':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
      case 'abstract_only':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Semantic Deep Dive</h3>
            <p className="text-sm text-gray-600">Enhanced analysis with AI insights</p>
          </div>
        </div>

        {/* Content Quality Overview */}
        {contentAnalysis && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${getQualityColor(contentAnalysis.extraction_quality)}`}>
                  {contentAnalysis.extraction_quality}
                </div>
                <div className="text-xs text-gray-600 mt-1">Extraction</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(contentAnalysis.semantic_completeness * 100)}%
                </div>
                <div className="text-xs text-gray-600">Complete</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-purple-600">
                  {Math.round(contentAnalysis.concept_coverage * 100)}%
                </div>
                <div className="text-xs text-gray-600">Concepts</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-indigo-600">
                  {Math.round(contentAnalysis.methodology_clarity * 100)}%
                </div>
                <div className="text-xs text-gray-600">Methods</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-green-600">
                  {Math.round(contentAnalysis.results_interpretability * 100)}%
                </div>
                <div className="text-xs text-gray-600">Results</div>
              </div>
            </div>
          </div>
        )}

        {/* User Relevance */}
        {userInsights && userInsights.relevance_to_user > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">Relevance to Your Research</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${userInsights.relevance_to_user * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRelevanceColor(userInsights.relevance_to_user)}`}>
                    {Math.round(userInsights.relevance_to_user * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paper Analysis Section */}
        {semanticAnalysis && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Paper Analysis</span>
                <span className="text-sm text-gray-500">
                  ({semanticAnalysis.paper_concepts.length} concepts, {semanticAnalysis.research_domain})
                </span>
              </div>
              {expandedSection === 'analysis' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'analysis' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* Research Domain & Methodology */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Research Domain</h4>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {semanticAnalysis.research_domain}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {semanticAnalysis.methodology_type}
                    </span>
                  </div>
                </div>

                {/* Key Concepts */}
                {semanticAnalysis.paper_concepts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {semanticAnalysis.paper_concepts.slice(0, 8).map((concept, index) => (
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

                {/* Cross-Domain Connections */}
                {semanticAnalysis.cross_domain_connections.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cross-Domain Connections</h4>
                    <div className="space-y-2">
                      {semanticAnalysis.cross_domain_connections.slice(0, 3).map((connection, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
                        >
                          <ArrowPathIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">{connection}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Related Papers Section */}
        {relatedPapers && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('related')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Related Papers</span>
                <span className="text-sm text-gray-500">
                  ({Object.values(relatedPapers).flat().length} papers found)
                </span>
              </div>
              {expandedSection === 'related' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'related' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPapers.similar_methodology.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Similar Methodology</h4>
                      <div className="space-y-2">
                        {relatedPapers.similar_methodology.slice(0, 3).map((paper, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                            <div className="font-medium text-blue-900">{paper.title?.substring(0, 60)}...</div>
                            <div className="text-blue-700 text-xs">{paper.authors?.[0]} et al.</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedPapers.similar_domain.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Similar Domain</h4>
                      <div className="space-y-2">
                        {relatedPapers.similar_domain.slice(0, 3).map((paper, index) => (
                          <div key={index} className="p-2 bg-purple-50 rounded text-sm">
                            <div className="font-medium text-purple-900">{paper.title?.substring(0, 60)}...</div>
                            <div className="text-purple-700 text-xs">{paper.authors?.[0]} et al.</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('recommendations')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LightBulbIcon className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">AI Recommendations</span>
                <span className="text-sm text-gray-500">
                  ({recommendations.next_papers_to_read.length} papers, {recommendations.research_directions.length} directions)
                </span>
              </div>
              {expandedSection === 'recommendations' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'recommendations' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* Next Papers */}
                {recommendations.next_papers_to_read.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Next Papers</h4>
                    <div className="space-y-2">
                      {recommendations.next_papers_to_read.slice(0, 4).map((paper, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-900 text-sm">{paper.title?.substring(0, 80)}...</div>
                          <div className="text-green-700 text-xs mt-1">{paper.authors?.[0]} et al. • {paper.year}</div>
                          {paper.relevance_score && (
                            <div className="text-green-600 text-xs mt-1">
                              Relevance: {Math.round(paper.relevance_score * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Directions */}
                {recommendations.research_directions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Research Directions</h4>
                    <div className="space-y-2">
                      {recommendations.research_directions.slice(0, 4).map((direction, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg"
                        >
                          <LightBulbIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-yellow-800">{direction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Insights Section */}
        {userInsights && userInsights.connection_to_user_research.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => toggleSection('insights')}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Personal Insights</span>
                <span className="text-sm text-gray-500">
                  ({userInsights.connection_to_user_research.length} connections)
                </span>
              </div>
              {expandedSection === 'insights' ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === 'insights' && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
                {/* Research Connections */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Connections to Your Research</h4>
                  <div className="space-y-2">
                    {userInsights.connection_to_user_research.map((connection, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-indigo-50 rounded-lg"
                      >
                        <ArrowPathIcon className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-indigo-800">{connection}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potential Applications */}
                {userInsights.potential_applications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Potential Applications</h4>
                    <div className="space-y-2">
                      {userInsights.potential_applications.map((application, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg"
                        >
                          <LightBulbIcon className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-orange-800">{application}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-200">
          <span>Enhanced with semantic AI</span>
          <div className="flex items-center gap-4">
            {contentAnalysis && (
              <span>{Math.round(contentAnalysis.semantic_completeness * 100)}% complete</span>
            )}
            {userInsights && (
              <span>{Math.round(userInsights.relevance_to_user * 100)}% relevant</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
