import React, { useState } from 'react';
import { 
  BeakerIcon, 
  ChartBarIcon,
  CubeIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { phdColors, phdTypography, phdSpacing, phdComponents, combineClasses } from './PhDUIDesignSystem';

interface Methodology {
  id: string;
  name: string;
  category: 'experimental' | 'observational' | 'computational' | 'theoretical' | 'mixed_methods';
  description: string;
  frequency: number;
  papers_using: string[];
  advantages: string[];
  limitations: string[];
  typical_applications: string[];
  statistical_methods?: string[];
  data_requirements?: string[];
  validation_approaches?: string[];
}

interface MethodologyComparison {
  methodology_a: string;
  methodology_b: string;
  similarity_score: number;
  complementary_aspects: string[];
  conflicting_aspects: string[];
}

interface MethodologySynthesisProps {
  methodologies?: Methodology[] | any[]; // More flexible - accept any array structure
  comparisons?: MethodologyComparison[] | any[];
  totalPapersAnalyzed?: number;
  recommendedCombinations?: string[];
  onMethodologyClick?: (methodology: Methodology | any) => void;
  onCompareMethodologies?: (methodA: string, methodB: string) => void;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  // Additional flexible props for different API response structures
  rawData?: any; // Accept raw API response data
  methodologyData?: any; // Accept nested methodology data
}

export default function MethodologySynthesis({
  methodologies,
  comparisons = [],
  totalPapersAnalyzed = 0,
  recommendedCombinations = [],
  onMethodologyClick,
  onCompareMethodologies,
  className = '',
  loading = false,
  error,
  onRetry,
  rawData,
  methodologyData
}: MethodologySynthesisProps) {
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');

  // Flexible data processing - handle different API response structures
  const processMethodologyData = () => {
    let processedMethodologies: any[] = [];
    let processedComparisons = comparisons;
    let processedPapersAnalyzed = totalPapersAnalyzed;
    let processedRecommendations = recommendedCombinations;

    // 1. Direct methodologies prop
    if (methodologies && Array.isArray(methodologies) && methodologies.length > 0) {
      processedMethodologies = methodologies;
    }
    // 2. From methodologyData prop
    else if (methodologyData) {
      processedMethodologies = methodologyData.methodologies || methodologyData.methods || [];
      processedComparisons = methodologyData.comparisons || processedComparisons;
      processedPapersAnalyzed = methodologyData.papers_analyzed || processedPapersAnalyzed;
      processedRecommendations = methodologyData.recommended_combinations || processedRecommendations;
    }
    // 3. From rawData prop
    else if (rawData) {
      // Try different nested structures
      const methodData = rawData.agent_results?.methodology_synthesis ||
                        rawData.phd_outputs?.methodology_synthesis ||
                        rawData.methodology_synthesis ||
                        rawData;

      processedMethodologies = methodData.methodologies ||
                              methodData.methodology_categories ||
                              methodData.methods ||
                              methodData.extracted_methodologies ||
                              [];

      processedComparisons = methodData.comparisons || processedComparisons;
      processedPapersAnalyzed = methodData.papers_analyzed || processedPapersAnalyzed;
      processedRecommendations = methodData.recommended_combinations ||
                                methodData.recommendations ||
                                processedRecommendations;
    }

    // Normalize methodology objects to ensure consistent structure
    processedMethodologies = processedMethodologies.map((method: any, index: number) => {
      if (typeof method === 'string') {
        // Convert string methodologies to objects
        return {
          id: `method_${index}`,
          name: method,
          category: 'mixed_methods',
          description: method,
          frequency: 1,
          papers_using: [],
          advantages: [`Uses ${method} approach`],
          limitations: ['Limitations not specified'],
          typical_applications: ['General research applications']
        };
      }

      // Ensure required fields exist
      return {
        id: method.id || `method_${index}`,
        name: method.name || method.methodology || method.method || `Methodology ${index + 1}`,
        category: method.category || method.type || method.classification || 'mixed_methods',
        description: method.description || method.summary || method.details || 'No description available',
        frequency: method.frequency || method.count || method.usage || 1,
        papers_using: method.papers_using || method.papers || method.references || [],
        advantages: method.advantages || method.benefits || method.strengths || [],
        limitations: method.limitations || method.weaknesses || method.drawbacks || [],
        typical_applications: method.typical_applications || method.applications || method.uses || [],
        statistical_methods: method.statistical_methods || method.statistics || [],
        data_requirements: method.data_requirements || method.data_needs || [],
        validation_approaches: method.validation_approaches || method.validation || []
      };
    });

    return {
      methodologies: processedMethodologies,
      comparisons: processedComparisons,
      papersAnalyzed: processedPapersAnalyzed,
      recommendations: processedRecommendations
    };
  };

  const {
    methodologies: processedMethodologies,
    comparisons: processedComparisons,
    papersAnalyzed,
    recommendations
  } = processMethodologyData();

  const toggleMethod = (methodId: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(methodId)) {
      newExpanded.delete(methodId);
    } else {
      newExpanded.add(methodId);
    }
    setExpandedMethods(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'experimental': return 'bg-green-100 text-green-800';
      case 'observational': return 'bg-blue-100 text-blue-800';
      case 'computational': return 'bg-purple-100 text-purple-800';
      case 'theoretical': return 'bg-orange-100 text-orange-800';
      case 'mixed_methods': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'experimental': return <BeakerIcon className="h-4 w-4" />;
      case 'observational': return <ChartBarIcon className="h-4 w-4" />;
      case 'computational': return <CubeIcon className="h-4 w-4" />;
      case 'theoretical': return <AcademicCapIcon className="h-4 w-4" />;
      default: return <BeakerIcon className="h-4 w-4" />;
    }
  };

  const filteredMethodologies = selectedCategory === 'all'
    ? processedMethodologies
    : processedMethodologies.filter(method => method.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(processedMethodologies.map(method => method.category)))];
  const categoryStats = processedMethodologies.reduce((acc, method) => {
    acc[method.category] = (acc[method.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Loading state
  if (loading) {
    return (
      <div className={combineClasses(phdComponents.card, className)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={combineClasses(phdColors.methodology.bg, 'p-2 rounded-lg')}>
              <BeakerIcon className={combineClasses('h-6 w-6', phdColors.methodology.accent)} />
            </div>
            <div>
              <h3 className={phdTypography.title}>Methodology Synthesis</h3>
              <p className={phdTypography.body}>Analyzing research methodologies...</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded animate-pulse flex-1"></div>
              </div>
              <div className="ml-13 space-y-3">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
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
          <div className={combineClasses(phdColors.methodology.bg, 'p-2 rounded-lg')}>
            <BeakerIcon className={combineClasses('h-6 w-6', phdColors.methodology.accent)} />
          </div>
          <div>
            <h3 className={phdTypography.title}>Methodology Synthesis</h3>
            <p className={phdTypography.body}>Error analyzing methodologies</p>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={combineClasses(phdColors.methodology.bg, 'p-2 rounded-lg')}>
            <BeakerIcon className={combineClasses('h-6 w-6', phdColors.methodology.accent)} />
          </div>
          <div>
            <h3 className={phdTypography.title}>Methodology Synthesis</h3>
            <p className={phdTypography.body}>Comparative analysis of research methods across papers</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={combineClasses(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
            )}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={combineClasses(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              viewMode === 'comparison' ? 'bg-white shadow-sm' : 'text-gray-600'
            )}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{processedMethodologies.length}</div>
          <div className="text-sm text-gray-600">Methodologies</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{categoryStats.experimental || 0}</div>
          <div className="text-sm text-gray-600">Experimental</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{categoryStats.observational || 0}</div>
          <div className="text-sm text-gray-600">Observational</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{papersAnalyzed}</div>
          <div className="text-sm text-gray-600">Papers Analyzed</div>
        </div>
      </div>

      {/* Recommended Combinations */}
      {recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className={combineClasses(phdTypography.sectionHeader, 'mb-2 flex items-center gap-2')}>
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
            Recommended Method Combinations
          </h4>
          <div className="space-y-2">
            {recommendations.map((combination: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-emerald-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {combination}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category: any) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={combineClasses(
                    'px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1',
                    selectedCategory === category
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category !== 'all' && getCategoryIcon(category)}
                  {category === 'all' ? 'All Methods' : category.replace('_', ' ').toUpperCase()}
                  {category !== 'all' && (
                    <span className="text-xs">({categoryStats[category] || 0})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Methodology List */}
          <div className="space-y-3">
            {filteredMethodologies.map((methodology: any) => {
              const isExpanded = expandedMethods.has(methodology.id);
              
              return (
                <div key={methodology.id} className="border border-gray-200 rounded-lg">
                  {/* Method Header */}
                  <div 
                    className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMethod(methodology.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                        <div className={combineClasses(
                          'p-1 rounded',
                          getCategoryColor(methodology.category)
                        )}>
                          {getCategoryIcon(methodology.category)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={phdTypography.sectionHeader}>{methodology.name}</h4>
                          <span className={combineClasses(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getCategoryColor(methodology.category)
                          )}>
                            {methodology.category.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {methodology.frequency} papers
                          </span>
                        </div>
                        <p className={phdTypography.body}>{methodology.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-4 space-y-4">
                        {/* Advantages & Limitations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2 flex items-center gap-2')}>
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              Advantages
                            </h5>
                            <ul className="space-y-1">
                              {methodology.advantages.map((advantage: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></span>
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2 flex items-center gap-2')}>
                              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                              Limitations
                            </h5>
                            <ul className="space-y-1">
                              {methodology.limitations.map((limitation: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2"></span>
                                  {limitation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Applications & Statistical Methods */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2')}>Typical Applications</h5>
                            <div className="flex flex-wrap gap-1">
                              {methodology.typical_applications.slice(0, 4).map((app: any, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {app}
                                </span>
                              ))}
                              {methodology.typical_applications.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{methodology.typical_applications.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {methodology.statistical_methods && methodology.statistical_methods.length > 0 && (
                            <div>
                              <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-2')}>Statistical Methods</h5>
                              <div className="flex flex-wrap gap-1">
                                {methodology.statistical_methods.slice(0, 3).map((method: any, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                    {method}
                                  </span>
                                ))}
                                {methodology.statistical_methods.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{methodology.statistical_methods.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {onMethodologyClick && (
                            <button
                              onClick={() => onMethodologyClick(methodology)}
                              className={phdComponents.button.secondary}
                            >
                              View Details
                            </button>
                          )}
                          {onCompareMethodologies && (
                            <button
                              onClick={() => onCompareMethodologies(methodology.name, '')}
                              className={phdComponents.button.ghost}
                            >
                              Compare
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
        </>
      )}

      {viewMode === 'comparison' && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Methodology comparison view</p>
            <p className="text-gray-500 text-sm mt-1">Select methodologies to compare their approaches</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredMethodologies.length === 0 && !loading && (
        <div className="text-center py-8">
          <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No methodologies analyzed yet</p>
          <p className="text-gray-500 text-sm mt-1">Run the Methodology Synthesis to extract research methods</p>
        </div>
      )}
    </div>
  );
}
