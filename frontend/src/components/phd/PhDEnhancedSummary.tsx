import React, { useState } from 'react';
import { 
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  LightBulbIcon,
  BeakerIcon,
  ShareIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { phdColors, phdTypography, phdSpacing, phdComponents, combineClasses } from './PhDUIDesignSystem';
import ThesisChapterStructure from './ThesisChapterStructure';
import LiteratureGapAnalysis from './LiteratureGapAnalysis';
import MethodologySynthesis from './MethodologySynthesis';

interface PhDEnhancedSummaryData {
  analysis_type: string;
  timestamp: string;
  project_id: string;
  base_analysis?: {
    synthesis?: {
      executive_summary?: string;
      key_achievements?: string[];
      strategic_recommendations?: string[];
    };
  };
  phd_enhancements?: {
    thesis_chapters?: any;
    gap_analysis?: any;
    methodology_synthesis?: any;
    citation_analysis?: any;
    literature_review?: any;
  };
  processing_time_seconds?: number;
  agents_executed?: string[];
  metadata?: {
    total_reports?: number;
    total_deep_dives?: number;
    total_annotations?: number;
    project_duration_days?: number;
  };
}

interface PhDEnhancedSummaryProps {
  data: PhDEnhancedSummaryData;
  onRegenerateSection?: (section: string) => void;
  onExportSummary?: () => void;
  className?: string;
}

export default function PhDEnhancedSummary({
  data,
  onRegenerateSection,
  onExportSummary,
  className = ''
}: PhDEnhancedSummaryProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'thesis' | 'gaps' | 'methodology' | 'citations'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'overview': return <DocumentTextIcon className="h-5 w-5" />;
      case 'thesis': return <AcademicCapIcon className="h-5 w-5" />;
      case 'gaps': return <LightBulbIcon className="h-5 w-5" />;
      case 'methodology': return <BeakerIcon className="h-5 w-5" />;
      case 'citations': return <ShareIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const availableTabs = [
    { id: 'overview', label: 'Overview', available: true },
    { id: 'thesis', label: 'Thesis Structure', available: !!data.phd_enhancements?.thesis_chapters },
    { id: 'gaps', label: 'Gap Analysis', available: !!data.phd_enhancements?.gap_analysis },
    { id: 'methodology', label: 'Methodology', available: !!data.phd_enhancements?.methodology_synthesis },
    { id: 'citations', label: 'Citations', available: !!data.phd_enhancements?.citation_analysis }
  ].filter(tab => tab.available);

  return (
    <div className={combineClasses(phdComponents.card, className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={combineClasses(phdColors.gradient, 'p-2 rounded-lg')}>
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={phdTypography.title}>PhD Enhanced Analysis</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ClockIcon className="h-4 w-4" />
                <span>{new Date(data.timestamp).toLocaleDateString()}</span>
              </div>
              {data.processing_time_seconds && (
                <span className="text-sm text-gray-600">
                  Processed in {data.processing_time_seconds.toFixed(1)}s
                </span>
              )}
              {data.agents_executed && data.agents_executed.length > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {data.agents_executed.length} agents
                </span>
              )}
            </div>
          </div>
        </div>

        {onExportSummary && (
          <button
            onClick={onExportSummary}
            className={phdComponents.button.secondary}
          >
            Export Summary
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={combineClasses(
                'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {getTabIcon(tab.id)}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Summary */}
            {data.base_analysis?.synthesis?.executive_summary && (
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer mb-3"
                  onClick={() => toggleSection('executive')}
                >
                  <h3 className={combineClasses(phdTypography.subtitle, 'flex items-center gap-2')}>
                    {expandedSections.has('executive') ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                    Executive Summary
                  </h3>
                  {onRegenerateSection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegenerateSection('executive');
                      }}
                      className={phdComponents.button.ghost}
                    >
                      Regenerate
                    </button>
                  )}
                </div>
                
                {expandedSections.has('executive') && (
                  <div className={combineClasses(phdColors.thesis.bg, phdColors.thesis.border, 'p-4 rounded-lg')}>
                    <p className={combineClasses(phdColors.thesis.text, phdTypography.body, 'leading-relaxed')}>
                      {data.base_analysis.synthesis.executive_summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Key Achievements */}
            {data.base_analysis?.synthesis?.key_achievements && (
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer mb-3"
                  onClick={() => toggleSection('achievements')}
                >
                  <h3 className={combineClasses(phdTypography.subtitle, 'flex items-center gap-2')}>
                    {expandedSections.has('achievements') ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                    Key Achievements
                  </h3>
                </div>
                
                {expandedSections.has('achievements') && (
                  <ul className="space-y-2">
                    {data.base_analysis.synthesis.key_achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className={phdTypography.body}>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Strategic Recommendations */}
            {data.base_analysis?.synthesis?.strategic_recommendations && (
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer mb-3"
                  onClick={() => toggleSection('recommendations')}
                >
                  <h3 className={combineClasses(phdTypography.subtitle, 'flex items-center gap-2')}>
                    {expandedSections.has('recommendations') ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                    Strategic Recommendations
                  </h3>
                </div>
                
                {expandedSections.has('recommendations') && (
                  <ul className="space-y-2">
                    {data.base_analysis.synthesis.strategic_recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span className={phdTypography.body}>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Project Metrics */}
            {data.metadata && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.metadata.total_reports || 0}</div>
                  <div className="text-sm text-gray-600">Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.metadata.total_deep_dives || 0}</div>
                  <div className="text-sm text-gray-600">Deep Dives</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.metadata.total_annotations || 0}</div>
                  <div className="text-sm text-gray-600">Annotations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.metadata.project_duration_days || 0}</div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'thesis' && data.phd_enhancements?.thesis_chapters && (
          <ThesisChapterStructure
            chapters={data.phd_enhancements.thesis_chapters.chapters || []}
            totalEstimatedWords={data.phd_enhancements.thesis_chapters.total_words}
            completionPercentage={data.phd_enhancements.thesis_chapters.completion_percentage}
          />
        )}

        {activeTab === 'gaps' && data.phd_enhancements?.gap_analysis && (
          <LiteratureGapAnalysis
            gaps={data.phd_enhancements.gap_analysis.identified_gaps || []}
            totalPapersAnalyzed={data.phd_enhancements.gap_analysis.papers_analyzed}
            analysisDate={data.timestamp}
            researchDomains={data.phd_enhancements.gap_analysis.research_domains || []}
          />
        )}

        {activeTab === 'methodology' && data.phd_enhancements?.methodology_synthesis && (
          <MethodologySynthesis
            methodologies={data.phd_enhancements.methodology_synthesis.methodologies || []}
            comparisons={data.phd_enhancements.methodology_synthesis.comparisons || []}
            totalPapersAnalyzed={data.phd_enhancements.methodology_synthesis.papers_analyzed}
            recommendedCombinations={data.phd_enhancements.methodology_synthesis.recommended_combinations || []}
          />
        )}

        {activeTab === 'citations' && data.phd_enhancements?.citation_analysis && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <ShareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Citation network analysis</p>
              <p className="text-gray-500 text-sm mt-1">Detailed citation analysis coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {availableTabs.length === 1 && (
        <div className="text-center py-8 mt-6 border-t border-gray-200">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No PhD enhancements available</p>
          <p className="text-gray-500 text-sm mt-1">
            Enable PhD features in the comprehensive analysis to see enhanced insights
          </p>
        </div>
      )}
    </div>
  );
}
