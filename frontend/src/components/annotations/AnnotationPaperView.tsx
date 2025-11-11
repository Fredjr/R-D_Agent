'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import type { Annotation } from '@/lib/api/annotations';
import AnnotationCard from './AnnotationCard';

interface AnnotationPaperViewProps {
  annotations: Annotation[];
  projectId: string;
  onJumpToSource?: (annotation: Annotation) => void;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotationId: string) => void;
  onReply?: (annotationId: string) => void;
}

interface PaperGroup {
  pmid: string;
  title: string;
  loading: boolean;
  annotations: Annotation[];
}

export default function AnnotationPaperView({
  annotations,
  projectId,
  onJumpToSource,
  onEdit,
  onDelete,
  onReply,
}: AnnotationPaperViewProps) {
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set());
  const [paperTitles, setPaperTitles] = useState<{ [pmid: string]: string }>({});
  const [loadingTitles, setLoadingTitles] = useState<Set<string>>(new Set());

  // Group annotations by paper
  const paperGroups = useMemo(() => {
    const groups: { [pmid: string]: PaperGroup } = {};

    annotations.forEach((annotation) => {
      if (annotation.article_pmid) {
        const pmid = annotation.article_pmid;
        if (!groups[pmid]) {
          groups[pmid] = {
            pmid,
            title: paperTitles[pmid] || `Paper ${pmid}`,
            loading: loadingTitles.has(pmid),
            annotations: [],
          };
        }
        groups[pmid].annotations.push(annotation);
      }
    });

    // Sort by number of annotations (descending)
    return Object.values(groups).sort((a, b) => b.annotations.length - a.annotations.length);
  }, [annotations, paperTitles, loadingTitles]);

  // Fetch paper titles
  useEffect(() => {
    const fetchTitles = async () => {
      const pmidsToFetch = paperGroups
        .map((g) => g.pmid)
        .filter((pmid) => !paperTitles[pmid] && !loadingTitles.has(pmid));

      if (pmidsToFetch.length === 0) return;

      const newLoadingTitles = new Set(loadingTitles);
      pmidsToFetch.forEach((pmid) => newLoadingTitles.add(pmid));
      setLoadingTitles(newLoadingTitles);

      // Fetch titles in parallel
      const titlePromises = pmidsToFetch.map(async (pmid) => {
        try {
          const response = await fetch(`/api/proxy/pubmed/details/${pmid}`, {
            headers: { 'User-ID': 'default_user' },
          });
          if (response.ok) {
            const data = await response.json();
            return { pmid, title: data.title || `Paper ${pmid}` };
          }
        } catch (error) {
          console.error(`Error fetching title for ${pmid}:`, error);
        }
        return { pmid, title: `Paper ${pmid}` };
      });

      const results = await Promise.all(titlePromises);
      const newTitles = { ...paperTitles };
      results.forEach(({ pmid, title }) => {
        newTitles[pmid] = title;
      });
      setPaperTitles(newTitles);

      const updatedLoadingTitles = new Set(loadingTitles);
      pmidsToFetch.forEach((pmid) => updatedLoadingTitles.delete(pmid));
      setLoadingTitles(updatedLoadingTitles);
    };

    fetchTitles();
  }, [paperGroups]);

  const togglePaper = (pmid: string) => {
    const newExpanded = new Set(expandedPapers);
    if (newExpanded.has(pmid)) {
      newExpanded.delete(pmid);
    } else {
      newExpanded.add(pmid);
    }
    setExpandedPapers(newExpanded);
  };

  // Group annotations by page within each paper
  const getPageGroups = (annotations: Annotation[]) => {
    const pageGroups: { [page: number]: Annotation[] } = {};
    annotations.forEach((annotation) => {
      if (annotation.pdf_page) {
        if (!pageGroups[annotation.pdf_page]) {
          pageGroups[annotation.pdf_page] = [];
        }
        pageGroups[annotation.pdf_page].push(annotation);
      }
    });
    return Object.entries(pageGroups).sort(([a], [b]) => Number(a) - Number(b));
  };

  return (
    <div className="space-y-4">
      {paperGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No paper annotations found</p>
        </div>
      ) : (
        paperGroups.map((paper) => {
          const isExpanded = expandedPapers.has(paper.pmid);
          const pageGroups = getPageGroups(paper.annotations);

          return (
            <div key={paper.pmid} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Paper Header */}
              <button
                onClick={() => togglePaper(paper.pmid)}
                className="w-full flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors"
              >
                {/* Paper Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>

                {/* Paper Info */}
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {paper.loading ? 'Loading...' : paper.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>PMID: {paper.pmid}</span>
                    <span>•</span>
                    <span>{paper.annotations.length} notes</span>
                    {pageGroups.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{pageGroups.length} pages</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {paper.annotations.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Paper Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {pageGroups.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {pageGroups.map(([page, pageAnnotations]) => (
                        <div key={page} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Page {page}</span>
                            <span className="text-xs text-gray-500">
                              ({pageAnnotations.length} note{pageAnnotations.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <div className="space-y-3">
                            {pageAnnotations.map((annotation) => (
                              <AnnotationCard
                                key={annotation.annotation_id}
                                annotation={annotation}
                                onJumpToSource={onJumpToSource}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onReply={onReply}
                                projectId={projectId}
                                compact={true}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-3">
                        {paper.annotations.map((annotation) => (
                          <AnnotationCard
                            key={annotation.annotation_id}
                            annotation={annotation}
                            onJumpToSource={onJumpToSource}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onReply={onReply}
                            projectId={projectId}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

