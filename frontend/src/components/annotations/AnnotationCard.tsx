'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  FolderIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { Annotation } from '../../lib/api/annotations';
import {
  formatNoteType,
  formatPriority,
  formatStatus,
  getNoteTypeColor,
  getPriorityColor,
  getStatusColor,
  countIncompleteActionItems,
} from '../../lib/api/annotationUtils';

interface AnnotationCardProps {
  annotation: Annotation;
  onReply?: (annotationId: string) => void;
  onEdit?: (annotation: Annotation) => void;
  onDelete?: (annotationId: string) => void;
  onViewThread?: (annotationId: string) => void;
  onJumpToSource?: (annotation: Annotation) => void; // NEW: Jump to PDF location
  showContext?: boolean;
  compact?: boolean;
  className?: string;
  collectionName?: string; // Optional: Pass collection name to avoid fetching
  projectId?: string; // NEW: For fetching article title
}

export default function AnnotationCard({
  annotation,
  onReply,
  onEdit,
  onDelete,
  onViewThread,
  onJumpToSource, // NEW
  showContext = true,
  compact = false,
  className = '',
  collectionName,
  projectId, // NEW
}: AnnotationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [loadingTitle, setLoadingTitle] = useState(false);

  const noteTypeColor = getNoteTypeColor(annotation.note_type);
  const priorityColor = getPriorityColor(annotation.priority);
  const statusColor = getStatusColor(annotation.status);

  const incompleteActionItems = countIncompleteActionItems(annotation);

  // Determine note scope
  const noteScope = annotation.collection_id
    ? 'collection'
    : annotation.article_pmid
      ? 'article'
      : 'project';

  // NEW: Fetch article title if annotation has article_pmid
  useEffect(() => {
    const fetchArticleTitle = async () => {
      if (!annotation.article_pmid || !projectId) return;

      setLoadingTitle(true);
      try {
        const response = await fetch(`/api/proxy/pubmed/details/${annotation.article_pmid}`, {
          headers: {
            'User-ID': 'default_user',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setArticleTitle(data.title || null);
        }
      } catch (error) {
        console.error('Error fetching article title:', error);
      } finally {
        setLoadingTitle(false);
      }
    };

    fetchArticleTitle();
  }, [annotation.article_pmid, projectId]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // NEW: Get annotation type badge
  const getAnnotationTypeBadge = () => {
    if (!annotation.annotation_type) return null;

    const typeConfig = {
      highlight: { label: 'Highlight', icon: SparklesIcon, color: 'bg-yellow-100 text-yellow-800' },
      sticky_note: { label: 'Sticky Note', icon: DocumentTextIcon, color: 'bg-blue-100 text-blue-800' },
      underline: { label: 'Underline', icon: SparklesIcon, color: 'bg-purple-100 text-purple-800' },
      strikethrough: { label: 'Strikethrough', icon: SparklesIcon, color: 'bg-red-100 text-red-800' },
      drawing: { label: 'Drawing', icon: SparklesIcon, color: 'bg-green-100 text-green-800' },
    };

    const config = typeConfig[annotation.annotation_type as keyof typeof typeConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // NEW: Truncate highlighted text for preview
  const getHighlightPreview = () => {
    if (!annotation.highlight_text) return null;
    const maxLength = 100;
    const text = annotation.highlight_text;
    return text.length > maxLength ? `"${text.substring(0, maxLength)}..."` : `"${text}"`;
  };

  const borderColorClass = {
    gray: 'border-l-gray-400',
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    yellow: 'border-l-yellow-500',
    green: 'border-l-green-500',
    orange: 'border-l-orange-500',
    red: 'border-l-red-500',
  }[noteTypeColor];

  return (
    <div
      className={`
        border-l-4 ${borderColorClass} bg-white rounded-lg shadow-sm p-4
        hover:shadow-md transition-shadow duration-200
        ${className}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Note Type Badge */}
          <span className={`
            px-2 py-0.5 text-xs font-medium rounded-full
            ${noteTypeColor === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
            ${noteTypeColor === 'purple' ? 'bg-purple-100 text-purple-800' : ''}
            ${noteTypeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${noteTypeColor === 'green' ? 'bg-green-100 text-green-800' : ''}
            ${noteTypeColor === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
            ${noteTypeColor === 'red' ? 'bg-red-100 text-red-800' : ''}
            ${noteTypeColor === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {formatNoteType(annotation.note_type)}
          </span>

          {/* NEW: Annotation Type Badge (Highlight, Sticky Note, etc.) */}
          {getAnnotationTypeBadge()}

          {/* Collection Scope Badge */}
          {annotation.collection_id ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              <FolderIcon className="w-3 h-3" />
              {collectionName || `Collection: ${annotation.collection_id.slice(0, 8)}...`}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              <GlobeAltIcon className="w-3 h-3" />
              Project-wide
            </span>
          )}

          {/* Priority Badge */}
          {annotation.priority !== 'medium' && (
            <span className={`
              px-2 py-0.5 text-xs font-medium rounded-full
              ${priorityColor === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
              ${priorityColor === 'red' ? 'bg-red-100 text-red-800' : ''}
              ${priorityColor === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {formatPriority(annotation.priority)}
            </span>
          )}

          {/* Status Badge */}
          {annotation.status !== 'active' && (
            <span className={`
              px-2 py-0.5 text-xs font-medium rounded-full
              ${statusColor === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
              ${statusColor === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {formatStatus(annotation.status)}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            {onReply && (
              <button
                onClick={() => onReply(annotation.annotation_id)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Reply"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(annotation)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(annotation.annotation_id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* NEW: Highlighted Text Preview (for PDF annotations) */}
      {annotation.highlight_text && (
        <div className="mb-3 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
          <div className="text-xs text-yellow-800 font-medium mb-1">Highlighted Text:</div>
          <div className="text-sm text-gray-700 italic">
            {getHighlightPreview()}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`text-gray-800 ${compact ? 'text-sm' : ''} mb-3`}>
        {annotation.content}
      </div>

      {/* NEW: PDF Context (Paper Title + Page Number) */}
      {(articleTitle || annotation.pdf_page) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {articleTitle && (
              <div className="font-medium truncate">{articleTitle}</div>
            )}
            {annotation.pdf_page && (
              <div className="text-gray-500">
                Page {annotation.pdf_page}
              </div>
            )}
          </div>
          {onJumpToSource && annotation.article_pmid && annotation.pdf_page && (
            <button
              onClick={() => onJumpToSource(annotation)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors flex-shrink-0"
              title="Jump to source in PDF"
            >
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              Jump to Source
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {annotation.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {annotation.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Items */}
      {annotation.action_items.length > 0 && (
        <div className="mb-3 space-y-1">
          {annotation.action_items.slice(0, compact ? 2 : undefined).map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {item.completed ? (
                <CheckCircleIconSolid className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                {item.text}
              </span>
            </div>
          ))}
          {compact && annotation.action_items.length > 2 && (
            <div className="text-xs text-gray-500 ml-6">
              +{annotation.action_items.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Author */}
          <div className="flex items-center gap-1">
            <UserCircleIcon className="w-4 h-4" />
            <span>{annotation.author_username || annotation.author_id}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDate(annotation.created_at)}</span>
          </div>

          {/* Incomplete Action Items */}
          {incompleteActionItems > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <CheckCircleIcon className="w-4 h-4" />
              <span>{incompleteActionItems} pending</span>
            </div>
          )}
        </div>

        {/* View Thread */}
        {onViewThread && annotation.parent_annotation_id && (
          <button
            onClick={() => onViewThread(annotation.annotation_id)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View thread
          </button>
        )}
      </div>

      {/* Context Info */}
      {showContext && (annotation.article_pmid || annotation.report_id || annotation.analysis_id) && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          {annotation.article_pmid && <span>Paper: {annotation.article_pmid}</span>}
          {annotation.report_id && <span>Report: {annotation.report_id.slice(0, 8)}...</span>}
          {annotation.analysis_id && <span>Analysis: {annotation.analysis_id.slice(0, 8)}...</span>}
        </div>
      )}
    </div>
  );
}

