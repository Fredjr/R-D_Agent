'use client';

import React, { useMemo } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { Annotation } from '@/lib/api/annotations';
import AnnotationCard from './AnnotationCard';

interface AnnotationTimelineViewProps {
  annotations: Annotation[];
  projectId: string;
  onJumpToSource?: (annotation: Annotation) => void;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotationId: string) => void;
  onReply?: (annotationId: string) => void;
}

interface TimelineGroup {
  date: string;
  displayDate: string;
  annotations: Annotation[];
}

export default function AnnotationTimelineView({
  annotations,
  projectId,
  onJumpToSource,
  onEdit,
  onDelete,
  onReply,
}: AnnotationTimelineViewProps) {
  // Group annotations by date
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: TimelineGroup } = {};

    // Sort annotations by created_at (newest first)
    const sortedAnnotations = [...annotations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sortedAnnotations.forEach((annotation) => {
      const date = new Date(annotation.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: formatDateHeader(date),
          annotations: [],
        };
      }

      groups[dateKey].annotations.push(annotation);
    });

    return Object.values(groups);
  }, [annotations]);

  const formatDateHeader = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />

      {/* Timeline Groups */}
      <div className="space-y-8">
        {timelineGroups.map((group, groupIndex) => (
          <div key={group.date} className="relative">
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{group.displayDate}</h3>
                <p className="text-sm text-gray-500">
                  {group.annotations.length} note{group.annotations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Annotations for this date */}
            <div className="ml-24 space-y-4">
              {group.annotations.map((annotation, index) => (
                <div key={annotation.annotation_id} className="relative">
                  {/* Timeline Connector */}
                  <div className="absolute -left-16 top-6 w-12 h-0.5 bg-gray-300" />
                  <div className="absolute -left-[68px] top-4 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />

                  {/* Time Badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {formatTime(annotation.created_at)}
                    </span>
                    {annotation.annotation_type && (
                      <span className="text-xs text-gray-400">•</span>
                    )}
                    {annotation.annotation_type && (
                      <span className="text-xs text-gray-500 capitalize">
                        {annotation.annotation_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Annotation Card */}
                  <div className="transform transition-all hover:scale-[1.02]">
                    <AnnotationCard
                      annotation={annotation}
                      onJumpToSource={onJumpToSource}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReply={onReply}
                      projectId={projectId}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* End of Timeline */}
      {timelineGroups.length > 0 && (
        <div className="relative mt-8 ml-8">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
          </div>
          <p className="mt-2 text-sm text-gray-500 text-center">
            {annotations.length} total note{annotations.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

