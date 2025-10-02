import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { phdColors, phdTypography, phdSpacing, phdComponents, combineClasses } from './PhDUIDesignSystem';

interface ResearchGap {
  id: string;
  title: string;
  description: string;
  gap_type: 'methodological' | 'theoretical' | 'empirical' | 'temporal' | 'geographical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  research_opportunity: string;
  potential_impact: string;
  related_papers?: string[];
  suggested_approaches?: string[];
  timeline_estimate?: string;
}

interface LiteratureGapAnalysisProps {
  gaps: ResearchGap[];
  totalPapersAnalyzed?: number;
  analysisDate?: string;
  researchDomains?: string[];
  onGapClick?: (gap: ResearchGap) => void;
  onExploreOpportunity?: (gap: ResearchGap) => void;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function LiteratureGapAnalysis({
  gaps,
  totalPapersAnalyzed = 0,
  analysisDate,
  researchDomains = [],
  onGapClick,
  onExploreOpportunity,
  className = '',
  loading = false,
  error,
  onRetry
}: LiteratureGapAnalysisProps) {
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());
  const [selectedGapType, setSelectedGapType] = useState<string>('all');

  const toggleGap = (gapId: string) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(gapId)) {
      newExpanded.delete(gapId);
    } else {
      newExpanded.add(gapId);
    }
    setExpandedGaps(newExpanded);
  };

  const getGapTypeColor = (type: string) => {
    switch (type) {
      case 'methodological': return 'bg-emerald-100 text-emerald-800';
      case 'theoretical': return 'bg-purple-100 text-purple-800';
      case 'empirical': return 'bg-blue-100 text-blue-800';
      case 'temporal': return 'bg-orange-100 text-orange-800';
      case 'geographical': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'medium':
        return <LightBulbIcon className="h-4 w-4" />;
      default:
        return <ArrowTrendingUpIcon className="h-4 w-4" />;
    }
  };

  const filteredGaps = selectedGapType === 'all' 
    ? gaps 
    : gaps.filter(gap => gap.gap_type === selectedGapType);

  const gapTypes = ['all', ...Array.from(new Set(gaps.map(gap => gap.gap_type)))];
  const gapCounts = gaps.reduce((acc, gap) => {
    acc[gap.severity] = (acc[gap.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Loading state
  if (loading) {
    return (
      <div className={combineClasses(phdComponents.card, className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className={combineClasses(phdColors.gap.bg, 'p-2 rounded-lg')}>
            <MagnifyingGlassIcon className={combineClasses('h-6 w-6', phdColors.gap.accent)} />
          </div>
          <div className="flex-1">
            <h3 className={phdTypography.title}>Literature Gap Analysis</h3>
            <p className={phdTypography.body}>Analyzing literature for research gaps...</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              </div>
              <div className="ml-13 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={combineClasses(phdComponents.card, className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className={combineClasses(phdColors.gap.bg, 'p-2 rounded-lg')}>
            <MagnifyingGlassIcon className={combineClasses('h-6 w-6', phdColors.gap.accent)} />
          </div>
          <div className="flex-1">
            <h3 className={phdTypography.title}>Literature Gap Analysis</h3>
            <p className={phdTypography.body}>Error analyzing literature gaps</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={combineClasses(phdComponents.card, className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={combineClasses(phdColors.gap.bg, 'p-2 rounded-lg')}>
          <MagnifyingGlassIcon className={combineClasses('h-6 w-6', phdColors.gap.accent)} />
        </div>
        <div className="flex-1">
          <h3 className={phdTypography.title}>Literature Gap Analysis</h3>
          <p className={phdTypography.body}>Identified research opportunities and knowledge gaps</p>
        </div>
        {analysisDate && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>{new Date(analysisDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{gaps.length}</div>
          <div className="text-sm text-gray-600">Total Gaps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{gapCounts.critical || 0}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{gapCounts.high || 0}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalPapersAnalyzed}</div>
          <div className="text-sm text-gray-600">Papers Analyzed</div>
        </div>
      </div>

      {/* Research Domains */}
      {researchDomains.length > 0 && (
        <div className="mb-6">
          <h4 className={combineClasses(phdTypography.sectionHeader, 'mb-2')}>Research Domains</h4>
          <div className="flex flex-wrap gap-2">
            {researchDomains.map((domain, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {gapTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedGapType(type)}
              className={combineClasses(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                selectedGapType === type
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' ? 'All Gaps' : type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== 'all' && (
                <span className="ml-1 text-xs">
                  ({gaps.filter(g => g.gap_type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gap List */}
      <div className="space-y-3">
        {filteredGaps.map((gap) => {
          const isExpanded = expandedGaps.has(gap.id);
          
          return (
            <div key={gap.id} className="border border-gray-200 rounded-lg">
              {/* Gap Header */}
              <div 
                className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGap(gap.id)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <div className={combineClasses(
                      'p-1 rounded border',
                      getSeverityColor(gap.severity)
                    )}>
                      {getSeverityIcon(gap.severity)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={phdTypography.sectionHeader}>{gap.title}</h4>
                      <span className={combineClasses(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getGapTypeColor(gap.gap_type)
                      )}>
                        {gap.gap_type}
                      </span>
                      <span className={combineClasses(
                        'px-2 py-1 rounded text-xs font-medium',
                        getSeverityColor(gap.severity)
                      )}>
                        {gap.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className={phdTypography.body}>{gap.description}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    {/* Research Opportunity */}
                    <div>
                      <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2 flex items-center gap-2')}>
                        <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                        Research Opportunity
                      </h5>
                      <p className={phdTypography.body}>{gap.research_opportunity}</p>
                    </div>

                    {/* Potential Impact */}
                    <div>
                      <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2 flex items-center gap-2')}>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        Potential Impact
                      </h5>
                      <p className={phdTypography.body}>{gap.potential_impact}</p>
                    </div>

                    {/* Suggested Approaches */}
                    {gap.suggested_approaches && gap.suggested_approaches.length > 0 && (
                      <div>
                        <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2')}>Suggested Approaches</h5>
                        <ul className="space-y-1">
                          {gap.suggested_approaches.map((approach, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2"></span>
                              {approach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Timeline & Related Papers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gap.timeline_estimate && (
                        <div>
                          <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-1')}>Timeline Estimate</h5>
                          <p className={phdTypography.caption}>{gap.timeline_estimate}</p>
                        </div>
                      )}
                      
                      {gap.related_papers && gap.related_papers.length > 0 && (
                        <div>
                          <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-1')}>Related Papers</h5>
                          <p className={phdTypography.caption}>
                            {gap.related_papers.length} papers reference this gap
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {onGapClick && (
                        <button
                          onClick={() => onGapClick(gap)}
                          className={phdComponents.button.secondary}
                        >
                          View Details
                        </button>
                      )}
                      {onExploreOpportunity && (
                        <button
                          onClick={() => onExploreOpportunity(gap)}
                          className={phdComponents.button.primary}
                        >
                          Explore Opportunity
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {gaps.length === 0 && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No literature gaps identified yet</p>
          <p className="text-gray-500 text-sm mt-1">Run the Gap Analysis to discover research opportunities</p>
        </div>
      )}
    </div>
  );
}
