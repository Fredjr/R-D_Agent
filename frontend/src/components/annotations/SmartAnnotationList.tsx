'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import AnnotationCard from './AnnotationCard';
import type { Annotation } from '@/lib/api/annotations';

interface AggregatedAnnotation {
  id: string;
  paper_title?: string;
  article_pmid?: string;
  annotation_type: string;
  created_at: string;
  count: number;
  annotations: any[];
  isExpanded?: boolean;
}

interface SmartAnnotationListProps {
  annotations: any[];
  projectId: string;
  onEdit?: (annotation: any) => void;
  onDelete?: (annotationId: string) => void;
  onReply?: (annotationId: string) => void;
  onJumpToSource?: (annotation: any) => void;
  compact?: boolean;
}

type FilterMode = 'all' | 'highlights' | 'notes' | 'important';

const LOW_VALUE_TYPES = ['strikethrough', 'underline'];

export default function SmartAnnotationList({
  annotations,
  projectId,
  onEdit,
  onDelete,
  onReply,
  onJumpToSource,
  compact = false,
}: SmartAnnotationListProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Aggregate annotations
  const aggregatedAnnotations = useMemo(() => {
    // Filter out low-value annotations
    const filtered = annotations.filter(
      (a) => !LOW_VALUE_TYPES.includes(a.annotation_type || '')
    );

    // Apply filter mode
    let modeFiltered = filtered;
    if (filterMode === 'highlights') {
      modeFiltered = filtered.filter((a) => a.annotation_type === 'highlight');
    } else if (filterMode === 'notes') {
      modeFiltered = filtered.filter(
        (a) => a.annotation_type === 'sticky_note' || a.note_type === 'general'
      );
    } else if (filterMode === 'important') {
      modeFiltered = filtered.filter(
        (a) => a.priority === 'high' || a.priority === 'critical'
      );
    }

    // Group annotations by paper and type within 24-hour windows
    const groups = new Map<string, any[]>();

    modeFiltered.forEach((annotation: any) => {
      const time = new Date(annotation.created_at).getTime();
      const timeWindow = Math.floor(time / (24 * 60 * 60 * 1000)); // 24-hour windows

      const key = `${annotation.article_pmid || 'no-paper'}_${annotation.annotation_type}_${timeWindow}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(annotation);
    });

    // Convert groups to aggregated annotations
    const aggregated: AggregatedAnnotation[] = [];

    groups.forEach((groupAnnotations, key) => {
      if (groupAnnotations.length === 1) {
        // Single annotation - don't aggregate
        const annotation: any = groupAnnotations[0];
        aggregated.push({
          id: annotation.annotation_id,
          paper_title: annotation.paper_title || annotation.article_title,
          article_pmid: annotation.article_pmid,
          annotation_type: annotation.annotation_type || 'note',
          created_at: annotation.created_at,
          count: 1,
          annotations: [annotation],
          isExpanded: false,
        });
      } else {
        // Multiple annotations - aggregate
        const first: any = groupAnnotations[0];
        aggregated.push({
          id: key,
          paper_title: first.paper_title || first.article_title,
          article_pmid: first.article_pmid,
          annotation_type: first.annotation_type || 'note',
          created_at: first.created_at,
          count: groupAnnotations.length,
          annotations: groupAnnotations,
          isExpanded: false,
        });
      }
    });

    // Sort by created_at (newest first)
    return aggregated.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [annotations, filterMode]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AggregatedAnnotation[]> = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    aggregatedAnnotations.forEach((annotation) => {
      const annotationDate = new Date(annotation.created_at);

      if (annotationDate >= today) {
        groups['Today'].push(annotation);
      } else if (annotationDate >= yesterday) {
        groups['Yesterday'].push(annotation);
      } else if (annotationDate >= weekAgo) {
        groups['Last 7 Days'].push(annotation);
      } else {
        groups['Older'].push(annotation);
      }
    });

    return groups;
  }, [aggregatedAnnotations]);

  // Get annotation icon
  const getAnnotationIcon = (annotationType: string) => {
    switch (annotationType) {
      case 'highlight':
        return <PencilSquareIcon className="w-5 h-5 text-yellow-600" />;
      case 'sticky_note':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />;
      case 'underline':
        return <PencilIcon className="w-5 h-5 text-green-600" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            Notes ({aggregatedAnnotations.length})
          </h3>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {aggregatedAnnotations.length} groups
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'all'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setFilterMode('highlights')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'highlights'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Highlights
          </button>
          <button
            onClick={() => setFilterMode('notes')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'notes'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sticky Notes
          </button>
          <button
            onClick={() => setFilterMode('important')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterMode === 'important'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Important
          </button>
        </div>
      </div>

      {/* Annotations List */}
      <div className="max-h-[600px] overflow-y-auto">
        {aggregatedAnnotations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="font-medium">No notes yet</p>
            <p className="text-sm mt-1">
              Start highlighting and adding notes to papers
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(groupedByDate).map(([dateLabel, dateAnnotations]) => {
              if (dateAnnotations.length === 0) return null;

              return (
                <div key={dateLabel} className="p-4">
                  {/* Date Header */}
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {dateLabel}
                  </h4>

                  {/* Annotations for this date */}
                  <div className="space-y-3">
                    {dateAnnotations.map((aggAnnotation) => {
                      const isExpanded = expandedGroups.has(aggAnnotation.id);

                      // Debug logging
                      console.log('Rendering annotation:', {
                        id: aggAnnotation.id,
                        count: aggAnnotation.count,
                        type: aggAnnotation.annotation_type,
                        isExpanded,
                        dateLabel
                      });

                      return (
                        <div key={aggAnnotation.id}>
                          {aggAnnotation.count === 1 ? (
                            // Single annotation - show full card
                            <AnnotationCard
                              annotation={aggAnnotation.annotations[0]}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onReply={onReply}
                              onJumpToSource={onJumpToSource}
                              compact={compact}
                              projectId={projectId}
                            />
                          ) : (
                            // Multiple annotations - show aggregated view
                            <div
                              className="rounded-lg p-3 bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                              onClick={() => toggleExpanded(aggAnnotation.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  {getAnnotationIcon(aggAnnotation.annotation_type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-900 font-medium">
                                        {aggAnnotation.count} {aggAnnotation.annotation_type}s
                                        {aggAnnotation.paper_title && (
                                          <span className="text-gray-600 font-normal">
                                            {' '}on {aggAnnotation.paper_title.substring(0, 50)}...
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {getRelativeTime(aggAnnotation.created_at)}
                                      </p>
                                    </div>

                                    {/* Expand button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpanded(aggAnnotation.id);
                                      }}
                                      className="flex-shrink-0 p-1 hover:bg-white rounded transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                                      ) : (
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Expanded details */}
                                  {isExpanded && (
                                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                      {aggAnnotation.annotations.map((annotation) => (
                                        <div key={annotation.annotation_id} className="bg-white rounded-lg p-2 border border-gray-200">
                                          <AnnotationCard
                                            annotation={annotation}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onReply={onReply}
                                            onJumpToSource={onJumpToSource}
                                            compact={true}
                                            projectId={projectId}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

