'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AnnotationCard from './AnnotationCard';
import AnnotationForm from './AnnotationForm';
import { useAnnotations } from '../../hooks/useAnnotations';
import { useAnnotationWebSocket } from '../../hooks/useAnnotationWebSocket';
import { Button } from '@/components/ui/Button';
import {
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import type {
  Annotation,
  AnnotationFilters,
  NoteType,
  Priority,
  Status,
} from '../../lib/api/annotations';

interface AnnotationListProps {
  projectId: string;
  userId?: string;
  articlePmid?: string;
  reportId?: string;
  analysisId?: string;
  collectionId?: string | null;
  initialFilters?: AnnotationFilters;
  showForm?: boolean;
  compact?: boolean;
  className?: string;
  showCollectionSelector?: boolean; // NEW: Pass to AnnotationForm
}

export default function AnnotationList({
  projectId,
  userId,
  articlePmid,
  reportId,
  analysisId,
  collectionId,
  initialFilters,
  showForm = true,
  compact = false,
  className = '',
  showCollectionSelector = false,
}: AnnotationListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const {
    annotations,
    loading,
    error,
    create,
    update,
    refresh,
  } = useAnnotations({
    projectId,
    userId,
    autoFetch: true,
    filters: {
      ...initialFilters,
      article_pmid: articlePmid,
      collection_id: collectionId === null ? undefined : collectionId,
    },
  });

  // WebSocket for real-time updates
  const { connected: wsConnected } = useAnnotationWebSocket({
    projectId,
    userId,
    onNewAnnotation: (annotation) => {
      console.log('📥 New annotation received via WebSocket:', annotation);
      // Refresh to get the latest annotations
      refresh();
    },
    onUpdateAnnotation: (annotation) => {
      console.log('📥 Updated annotation received via WebSocket:', annotation);
      refresh();
    },
    onDeleteAnnotation: (annotationId) => {
      console.log('📥 Deleted annotation received via WebSocket:', annotationId);
      refresh();
    },
    enabled: true,
  });

  const handleCreate = async (data: any) => {
    await create(data);
    setShowNewForm(false);
    setReplyToId(null);
  };

  const handleUpdate = async (annotationId: string, data: any) => {
    await update(annotationId, data);
    setEditingAnnotation(null);
  };

  const handleReply = (annotationId: string) => {
    setReplyToId(annotationId);
    setShowNewForm(false);
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setShowNewForm(false);
    setReplyToId(null);
  };

  const handleDelete = async (annotationId: string) => {
    if (confirm('Are you sure you want to delete this annotation?')) {
      // TODO: Implement delete functionality
      console.log('Delete annotation:', annotationId);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Cmd+N or Ctrl+N: New note
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      setShowNewForm(true);
      setReplyToId(null);
      setEditingAnnotation(null);
    }

    // Cmd+R or Ctrl+R: Refresh
    if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
      event.preventDefault();
      refresh();
    }

    // Escape: Close forms
    if (event.key === 'Escape') {
      setShowNewForm(false);
      setReplyToId(null);
      setEditingAnnotation(null);
    }
  }, [refresh]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (loading && annotations.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-gray-500">Loading annotations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-800">Error loading annotations: {error}</p>
        <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Notes {annotations.length > 0 && `(${annotations.length})`}
          </h3>

          {/* WebSocket connection indicator */}
          <div
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={wsConnected ? 'Real-time updates active' : 'Connecting...'}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
          >
            <FunnelIcon className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={refresh}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {showForm && (
            <Button
              onClick={() => {
                setShowNewForm(!showNewForm);
                setReplyToId(null);
                setEditingAnnotation(null);
              }}
              variant="default"
              size="sm"
              title="New Note (Cmd+N)"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Note
            </Button>
          )}

          <button
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Keyboard shortcuts"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <h4 className="font-semibold text-blue-900 mb-2">Keyboard Shortcuts</h4>
          <div className="space-y-1 text-blue-800">
            <div className="flex justify-between">
              <span>New note</span>
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded">Cmd+N</kbd>
            </div>
            <div className="flex justify-between">
              <span>Refresh</span>
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded">Cmd+R</kbd>
            </div>
            <div className="flex justify-between">
              <span>Close forms</span>
              <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded">Esc</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Types</option>
                <option value="finding">Finding</option>
                <option value="hypothesis">Hypothesis</option>
                <option value="question">Question</option>
                <option value="todo">To-Do</option>
                <option value="comparison">Comparison</option>
                <option value="critique">Critique</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* New Annotation Form */}
      {showNewForm && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">New Note</h4>
          <AnnotationForm
            projectId={projectId}
            articlePmid={articlePmid}
            reportId={reportId}
            analysisId={analysisId}
            collectionId={collectionId || undefined}
            onSubmit={handleCreate}
            onCancel={() => setShowNewForm(false)}
            compact={compact}
            showCollectionSelector={showCollectionSelector}
          />
        </div>
      )}

      {/* Annotations List */}
      {annotations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No notes yet.</p>
          {showForm && (
            <Button
              onClick={() => setShowNewForm(true)}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Add your first note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {annotations.map((annotation) => (
            <div key={annotation.annotation_id}>
              {/* Annotation Card */}
              {editingAnnotation?.annotation_id === annotation.annotation_id ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Note</h4>
                  <AnnotationForm
                    projectId={projectId}
                    articlePmid={annotation.article_pmid}
                    reportId={annotation.report_id}
                    analysisId={annotation.analysis_id}
                    collectionId={annotation.collection_id || undefined}
                    onSubmit={(data) => handleUpdate(annotation.annotation_id, data)}
                    onCancel={() => setEditingAnnotation(null)}
                    defaultNoteType={annotation.note_type}
                    defaultPriority={annotation.priority}
                    compact={compact}
                    showCollectionSelector={showCollectionSelector}
                  />
                </div>
              ) : (
                <AnnotationCard
                  annotation={annotation}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onJumpToSource={(ann) => {
                    // Open PDF viewer at specific page
                    if (ann.article_pmid && ann.pdf_page) {
                      window.open(`/project/${projectId}/pdf/${ann.article_pmid}?page=${ann.pdf_page}`, '_blank');
                    }
                  }}
                  compact={compact}
                  projectId={projectId}
                />
              )}

              {/* Reply Form */}
              {replyToId === annotation.annotation_id && (
                <div className="ml-8 mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Reply</h4>
                  <AnnotationForm
                    projectId={projectId}
                    articlePmid={annotation.article_pmid}
                    reportId={annotation.report_id}
                    analysisId={annotation.analysis_id}
                    collectionId={annotation.collection_id || undefined}
                    parentAnnotationId={annotation.annotation_id}
                    onSubmit={handleCreate}
                    onCancel={() => setReplyToId(null)}
                    placeholder="Write a reply..."
                    compact={true}
                    showCollectionSelector={showCollectionSelector}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

