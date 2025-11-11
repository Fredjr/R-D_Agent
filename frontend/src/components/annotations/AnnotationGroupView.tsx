'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { Annotation } from '@/lib/api/annotations';
import AnnotationCard from './AnnotationCard';

interface AnnotationGroupViewProps {
  annotations: Annotation[];
  projectId: string;
  groupBy: 'paper' | 'date' | 'type' | 'none';
  onJumpToSource?: (annotation: Annotation) => void;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotationId: string) => void;
  onReply?: (annotationId: string) => void;
}

interface GroupedAnnotations {
  [key: string]: {
    title: string;
    count: number;
    annotations: Annotation[];
    metadata?: any;
  };
}

export default function AnnotationGroupView({
  annotations,
  projectId,
  groupBy,
  onJumpToSource,
  onEdit,
  onDelete,
  onReply,
}: AnnotationGroupViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group annotations based on groupBy prop
  const groupedAnnotations = useMemo(() => {
    const groups: GroupedAnnotations = {};

    if (groupBy === 'none') {
      return {
        all: {
          title: 'All Notes',
          count: annotations.length,
          annotations,
        },
      };
    }

    annotations.forEach((annotation) => {
      let groupKey: string;
      let groupTitle: string;

      switch (groupBy) {
        case 'paper':
          if (annotation.article_pmid) {
            groupKey = annotation.article_pmid;
            groupTitle = `Paper: ${annotation.article_pmid}`;
          } else {
            groupKey = 'no-paper';
            groupTitle = 'General Notes (No Paper)';
          }
          break;

        case 'date':
          const date = new Date(annotation.created_at);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);

          if (date.toDateString() === today.toDateString()) {
            groupKey = 'today';
            groupTitle = 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'yesterday';
            groupTitle = 'Yesterday';
          } else if (date > weekAgo) {
            groupKey = 'this-week';
            groupTitle = 'This Week';
          } else {
            groupKey = 'older';
            groupTitle = 'Older';
          }
          break;

        case 'type':
          if (annotation.annotation_type) {
            groupKey = annotation.annotation_type;
            groupTitle = formatAnnotationType(annotation.annotation_type);
          } else {
            groupKey = 'general';
            groupTitle = 'General Notes';
          }
          break;

        default:
          groupKey = 'all';
          groupTitle = 'All Notes';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          count: 0,
          annotations: [],
        };
      }

      groups[groupKey].annotations.push(annotation);
      groups[groupKey].count++;
    });

    return groups;
  }, [annotations, groupBy]);

  const formatAnnotationType = (type: string): string => {
    const typeMap: Record<string, string> = {
      highlight: '🟡 Highlights',
      sticky_note: '📝 Sticky Notes',
      underline: '📏 Underlines',
      strikethrough: '❌ Strikethroughs',
      drawing: '🎨 Drawings',
    };
    return typeMap[type] || type;
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupIcon = () => {
    switch (groupBy) {
      case 'paper':
        return DocumentTextIcon;
      case 'date':
        return CalendarIcon;
      case 'type':
        return SparklesIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const GroupIcon = getGroupIcon();

  // If no grouping, just show flat list
  if (groupBy === 'none') {
    return (
      <div className="space-y-3">
        {annotations.map((annotation) => (
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
    );
  }

  // Render grouped view
  return (
    <div className="space-y-4">
      {Object.entries(groupedAnnotations).map(([groupKey, group]) => {
        const isExpanded = expandedGroups.has(groupKey);

        return (
          <div key={groupKey} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GroupIcon className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{group.title}</div>
                  <div className="text-xs text-gray-500">
                    {group.count} note{group.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {group.count}
                </span>
                {isExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Group Content */}
            {isExpanded && (
              <div className="p-4 space-y-3 bg-white">
                {group.annotations.map((annotation) => (
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
            )}
          </div>
        );
      })}
    </div>
  );
}

