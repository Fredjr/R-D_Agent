import React, { useState } from 'react';
import { 
  BookOpenIcon, 
  DocumentTextIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ClockIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { phdColors, phdTypography, phdSpacing, phdComponents, combineClasses } from './PhDUIDesignSystem';

interface ThesisChapter {
  chapter_number: number;
  title: string;
  sections: string[];
  estimated_pages: number;
  estimated_words?: number;
  key_content?: {
    research_objective?: string;
    context_papers?: any[];
    methodologies?: string[];
    key_findings?: string[];
  };
  completion_status?: 'not_started' | 'in_progress' | 'completed';
  last_updated?: string;
}

interface ThesisChapterStructureProps {
  chapters?: ThesisChapter[] | any[]; // More flexible - accept any array structure
  totalEstimatedWords?: number;
  completionPercentage?: number;
  onChapterClick?: (chapter: ThesisChapter | any) => void;
  onEditChapter?: (chapter: ThesisChapter | any) => void;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  // Additional flexible props for different API response structures
  rawData?: any; // Accept raw API response data
  thesisData?: any; // Accept nested thesis data
}

export default function ThesisChapterStructure({
  chapters,
  totalEstimatedWords = 0,
  completionPercentage = 0,
  onChapterClick,
  onEditChapter,
  className = '',
  loading = false,
  error,
  onRetry,
  rawData,
  thesisData
}: ThesisChapterStructureProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Flexible data processing - handle different API response structures
  const processThesisData = () => {
    let processedChapters: any[] = [];
    let processedWords = totalEstimatedWords;
    let processedCompletion = completionPercentage;

    // 1. Direct chapters prop
    if (chapters && Array.isArray(chapters) && chapters.length > 0) {
      processedChapters = chapters;
    }
    // 2. From thesisData prop
    else if (thesisData) {
      processedChapters = thesisData.chapters || thesisData.thesis_structure?.chapters || [];
      processedWords = thesisData.total_estimated_words || processedWords;
      processedCompletion = thesisData.completion_percentage || processedCompletion;
    }
    // 3. From rawData prop - CHECK AGENT_RESULTS FIRST (where the API actually puts it)
    else if (rawData) {
      // Try different nested structures - prioritize agent_results
      const thesisStructure = rawData.agent_results?.thesis_structure ||  // API puts it here!
                             rawData.phd_outputs?.thesis_structure ||
                             rawData.thesis_structure ||
                             rawData;

      processedChapters = thesisStructure.thesis_chapters ||  // API uses this field name!
                         thesisStructure.chapters ||
                         [];

      processedWords = thesisStructure.total_estimated_words ||
                      thesisStructure.estimated_words ||
                      processedWords;

      processedCompletion = thesisStructure.completion_percentage ||
                           thesisStructure.overall_progress ||
                           processedCompletion;
    }

    // Normalize chapter objects to ensure consistent structure
    processedChapters = processedChapters.map((chapter: any, index: number) => {
      if (typeof chapter === 'string') {
        // Convert string chapters to objects
        return {
          chapter_number: index + 1,
          title: chapter,
          sections: [],
          estimated_pages: 10,
          estimated_words: 2500,
          completion_status: 'not_started'
        };
      }

      // Ensure required fields exist with robust fallbacks
      return {
        chapter_number: chapter.chapter_number || chapter.chapter || index + 1,
        title: chapter.title || chapter.chapter_title || chapter.name || `Chapter ${index + 1}`,
        sections: chapter.sections || chapter.section_titles || [],
        estimated_pages: chapter.estimated_pages || chapter.pages || 15,
        estimated_words: chapter.estimated_words || chapter.words || (chapter.estimated_pages || 15) * 250, // Estimate 250 words per page
        key_content: chapter.key_content || {
          research_objective: chapter.research_objective || chapter.objective || 'Research objective to be defined',
          context_papers: chapter.context_papers || chapter.papers || [],
          methodologies: chapter.methodologies || chapter.methods || [],
          key_findings: chapter.key_findings || chapter.findings || [],
          // Extract additional content from key_content if it exists
          ...(chapter.key_content || {})
        },
        completion_status: chapter.completion_status || chapter.status || 'not_started',
        last_updated: chapter.last_updated || chapter.updated_at,
        // Add description from key_content fields
        description: chapter.description ||
                    chapter.key_content?.research_objective ||
                    chapter.key_content?.problem_statement ||
                    chapter.key_content?.analysis_framework ||
                    chapter.key_content?.research_contributions ||
                    `Chapter ${index + 1}: ${chapter.title || 'Untitled Chapter'}`
      };
    });

    return {
      chapters: processedChapters,
      totalWords: processedWords,
      completion: processedCompletion
    };
  };

  const { chapters: processedChapters, totalWords, completion } = processThesisData();

  const toggleChapter = (chapterNumber: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterNumber)) {
      newExpanded.delete(chapterNumber);
    } else {
      newExpanded.add(chapterNumber);
    }
    setExpandedChapters(newExpanded);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed': return 'Complete';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={combineClasses(phdComponents.card, className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className={combineClasses(phdColors.thesis.bg, 'p-2 rounded-lg')}>
            <BookOpenIcon className={combineClasses('h-6 w-6', phdColors.thesis.accent)} />
          </div>
          <div>
            <h3 className={phdTypography.title}>Thesis Structure</h3>
            <p className={phdTypography.body}>Generating thesis chapter structure...</p>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              </div>
              <div className="ml-12 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
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
          <div className={combineClasses(phdColors.thesis.bg, 'p-2 rounded-lg')}>
            <BookOpenIcon className={combineClasses('h-6 w-6', phdColors.thesis.accent)} />
          </div>
          <div>
            <h3 className={phdTypography.title}>Thesis Structure</h3>
            <p className={phdTypography.body}>Error generating thesis structure</p>
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
        <div className={combineClasses(phdColors.thesis.bg, 'p-2 rounded-lg')}>
          <BookOpenIcon className={combineClasses('h-6 w-6', phdColors.thesis.accent)} />
        </div>
        <div>
          <h3 className={phdTypography.title}>Thesis Structure</h3>
          <p className={phdTypography.body}>Organized chapter outline with progress tracking</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className={phdTypography.sectionHeader}>Overall Progress</span>
          <span className={combineClasses(phdTypography.body, 'font-semibold')}>{completion}%</span>
        </div>
        <div className={phdComponents.progressBar.container}>
          <div
            className={phdComponents.progressBar.fill}
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className={phdTypography.caption}>{totalWords.toLocaleString()} words estimated</span>
          <span className={phdTypography.caption}>{processedChapters.length} chapters</span>
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-3">
        {processedChapters.map((chapter: any) => {
          const isExpanded = expandedChapters.has(chapter.chapter_number);
          
          return (
            <div key={chapter.chapter_number} className="border border-gray-200 rounded-lg">
              {/* Chapter Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleChapter(chapter.chapter_number)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                    )}
                    <DocumentTextIcon className="h-5 w-5 text-purple-500" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={phdTypography.sectionHeader}>
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </span>
                      <span className={combineClasses(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(chapter.completion_status)
                      )}>
                        {getStatusText(chapter.completion_status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{chapter.sections.length} sections</span>
                      <span>{chapter.estimated_pages} pages</span>
                      {chapter.estimated_words && (
                        <span>{chapter.estimated_words.toLocaleString()} words</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {chapter.last_updated && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      <span>{new Date(chapter.last_updated).toLocaleDateString()}</span>
                    </div>
                  )}
                  {onEditChapter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditChapter(chapter);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    {/* Sections */}
                    <div>
                      <h4 className={combineClasses(phdTypography.sectionHeader, 'mb-2')}>Sections</h4>
                      <ul className="space-y-1">
                        {chapter.sections.map((section: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                            {section}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Content */}
                    {chapter.key_content && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {chapter.key_content.research_objective && (
                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-1')}>Research Objective</h5>
                            <p className={phdTypography.caption}>{chapter.key_content.research_objective}</p>
                          </div>
                        )}
                        
                        {chapter.key_content.context_papers && chapter.key_content.context_papers.length > 0 && (
                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-1')}>Key Papers</h5>
                            <p className={phdTypography.caption}>
                              {chapter.key_content.context_papers.length} foundational papers referenced
                            </p>
                          </div>
                        )}
                        
                        {chapter.key_content.methodologies && chapter.key_content.methodologies.length > 0 && (
                          <div>
                            <h5 className={combineClasses(phdTypography.body, 'font-semibold mb-1')}>Methodologies</h5>
                            <div className="flex flex-wrap gap-1">
                              {chapter.key_content.methodologies.slice(0, 3).map((method: any, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">
                                  {method}
                                </span>
                              ))}
                              {chapter.key_content.methodologies.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{chapter.key_content.methodologies.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {onChapterClick && (
                      <div className="pt-2">
                        <button
                          onClick={() => onChapterClick(chapter)}
                          className={phdComponents.button.secondary}
                        >
                          View Chapter Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {processedChapters.length === 0 && !loading && (
        <div className="text-center py-8">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No thesis structure generated yet</p>
          <p className="text-gray-500 text-sm mt-1">Run the Thesis Chapter Generator to create your structure</p>
        </div>
      )}
    </div>
  );
}
