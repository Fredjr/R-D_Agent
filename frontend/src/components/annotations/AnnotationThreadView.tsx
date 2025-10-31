'use client';

import React, { useState } from 'react';
import AnnotationCard from './AnnotationCard';
import AnnotationForm from './AnnotationForm';
import { useAnnotationThread } from '../../hooks/useAnnotations';
import { Button } from '@/components/ui/Button';
import {
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { AnnotationThread } from '../../lib/api/annotations';
import { countThreadAnnotations } from '../../lib/api/annotationUtils';

interface AnnotationThreadViewProps {
  projectId: string;
  annotationId: string;
  userId?: string;
  onClose?: () => void;
  onReply?: (data: any) => Promise<void>;
  className?: string;
}

export default function AnnotationThreadView({
  projectId,
  annotationId,
  userId,
  onClose,
  onReply,
  className = '',
}: AnnotationThreadViewProps) {
  const [replyToId, setReplyToId] = useState<string | null>(null);
  
  const { thread, loading, error, refresh } = useAnnotationThread(
    projectId,
    annotationId,
    userId
  );

  const renderThread = (threadNode: AnnotationThread, depth: number = 0) => {
    const isRoot = depth === 0;
    const hasChildren = threadNode.children.length > 0;

    return (
      <div key={threadNode.annotation_id} className={depth > 0 ? 'ml-8 mt-3' : ''}>
        {/* Thread Line */}
        {depth > 0 && (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="absolute left-0 top-6 w-4 h-0.5 bg-gray-200" />
          </div>
        )}

        {/* Annotation Card */}
        <div className={depth > 0 ? 'pl-6' : ''}>
          <AnnotationCard
            annotation={threadNode}
            onReply={() => setReplyToId(threadNode.annotation_id)}
            compact={depth > 2}
          />

          {/* Reply Form */}
          {replyToId === threadNode.annotation_id && onReply && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Reply</h4>
              <AnnotationForm
                projectId={projectId}
                articlePmid={threadNode.article_pmid}
                reportId={threadNode.report_id}
                analysisId={threadNode.analysis_id}
                parentAnnotationId={threadNode.annotation_id}
                onSubmit={async (data) => {
                  await onReply(data);
                  setReplyToId(null);
                  refresh();
                }}
                onCancel={() => setReplyToId(null)}
                placeholder="Write a reply..."
                compact={true}
              />
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="mt-3">
            {threadNode.children.map((child) => renderThread(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-gray-500">Loading thread...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-800">Error loading thread: {error}</p>
        <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        Thread not found
      </div>
    );
  }

  const totalAnnotations = countThreadAnnotations(thread);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Thread ({totalAnnotations} {totalAnnotations === 1 ? 'note' : 'notes'})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              <XMarkIcon className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-4">
        {renderThread(thread)}
      </div>
    </div>
  );
}

