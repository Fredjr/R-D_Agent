'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  XMarkIcon,
  TagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { 
  CreateAnnotationRequest, 
  NoteType, 
  Priority, 
  Status,
  ActionItem,
} from '../../lib/api/annotations';

interface AnnotationFormProps {
  projectId: string;
  articlePmid?: string;
  reportId?: string;
  analysisId?: string;
  parentAnnotationId?: string;
  onSubmit: (data: CreateAnnotationRequest) => Promise<void>;
  onCancel?: () => void;
  defaultNoteType?: NoteType;
  defaultPriority?: Priority;
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

export default function AnnotationForm({
  projectId,
  articlePmid,
  reportId,
  analysisId,
  parentAnnotationId,
  onSubmit,
  onCancel,
  defaultNoteType = 'general',
  defaultPriority = 'medium',
  placeholder = 'Add a note...',
  compact = false,
  className = '',
}: AnnotationFormProps) {
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>(defaultNoteType);
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [status, setStatus] = useState<Status>('active');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [actionItemInput, setActionItemInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(!compact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setSubmitting(true);
    
    try {
      await onSubmit({
        content: content.trim(),
        article_pmid: articlePmid,
        report_id: reportId,
        analysis_id: analysisId,
        parent_annotation_id: parentAnnotationId,
        note_type: noteType,
        priority,
        status,
        tags,
        action_items: actionItems,
        is_private: isPrivate,
      });
      
      // Reset form
      setContent('');
      setTags([]);
      setActionItems([]);
      setNoteType(defaultNoteType);
      setPriority(defaultPriority);
      setStatus('active');
      setIsPrivate(false);
      setShowAdvanced(!compact);
    } catch (error) {
      console.error('Failed to submit annotation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddActionItem = () => {
    if (actionItemInput.trim()) {
      setActionItems([...actionItems, { text: actionItemInput.trim(), completed: false }]);
      setActionItemInput('');
    }
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      {/* Content */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : 4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={submitting}
        />
      </div>

      {/* Basic Controls */}
      <div className="flex flex-wrap gap-2">
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value as NoteType)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={submitting}
        >
          <option value="general">General</option>
          <option value="finding">Finding</option>
          <option value="hypothesis">Hypothesis</option>
          <option value="question">Question</option>
          <option value="todo">To-Do</option>
          <option value="comparison">Comparison</option>
          <option value="critique">Critique</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          disabled={submitting}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical</option>
        </select>

        {!compact && (
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        )}
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                size="sm"
                variant="outline"
                disabled={submitting}
              >
                <TagIcon className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Items
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={actionItemInput}
                onChange={(e) => setActionItemInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActionItem())}
                placeholder="Add action item..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <Button
                type="button"
                onClick={handleAddActionItem}
                size="sm"
                variant="outline"
                disabled={submitting}
              >
                <PlusIcon className="w-4 h-4" />
              </Button>
            </div>
            {actionItems.length > 0 && (
              <div className="space-y-1">
                {actionItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-gray-200"
                  >
                    <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={submitting}
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Private note (only visible to you)
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            size="sm"
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={!content.trim() || submitting}
        >
          {submitting ? 'Saving...' : parentAnnotationId ? 'Reply' : 'Add Note'}
        </Button>
      </div>
    </form>
  );
}

