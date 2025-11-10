'use client';

import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowDownTrayIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { Highlight } from '@/types/pdf-annotations';
import { HIGHLIGHT_COLORS } from '@/types/pdf-annotations';

interface AnnotationsSidebarProps {
  highlights: Highlight[];
  currentPage: number;
  onHighlightClick: (highlight: Highlight) => void;
  onHighlightDelete: (annotationId: string) => void;
  onHighlightColorChange: (annotationId: string, newColor: string) => void;
  onNoteAdd: (annotationId: string, note: string) => void;
  onNoteUpdate: (annotationId: string, note: string) => void;
  onClose?: () => void;
}

export default function AnnotationsSidebar({
  highlights,
  currentPage,
  onHighlightClick,
  onHighlightDelete,
  onHighlightColorChange,
  onNoteAdd,
  onNoteUpdate,
  onClose,
}: AnnotationsSidebarProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  // Phase 5: Organization features
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // all, highlight, underline, strikethrough, sticky_note
  const [filterTag, setFilterTag] = useState<string>('all'); // all, or specific tag
  const [sortBy, setSortBy] = useState<string>('page'); // page, date, type
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Extract all unique tags from highlights
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    highlights.forEach(h => {
      if (h.tags && Array.isArray(h.tags)) {
        h.tags.forEach(tag => {
          // ✅ FIX: Filter out null/undefined tags
          if (tag && typeof tag === 'string') {
            tagSet.add(tag);
          }
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [highlights]);

  // Filter, search, and sort highlights
  const filteredAndSortedHighlights = useMemo(() => {
    let filtered = [...highlights];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(h => h.annotation_type === filterType);
    }

    // Apply tag filter
    if (filterTag !== 'all') {
      filtered = filtered.filter(h => h.tags && h.tags.includes(filterTag));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        (h.content && h.content.toLowerCase().includes(query)) ||
        (h.highlight_text && h.highlight_text.toLowerCase().includes(query)) ||
        // ✅ FIX: Filter out null/undefined tags before calling toLowerCase()
        (h.tags && h.tags.some(tag => tag && typeof tag === 'string' && tag.toLowerCase().includes(query)))
      );
    }

    // Apply sorting
    if (sortBy === 'page') {
      filtered.sort((a, b) => a.pdf_page - b.pdf_page);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'type') {
      filtered.sort((a, b) => a.annotation_type.localeCompare(b.annotation_type));
    }

    return filtered;
  }, [highlights, filterType, filterTag, searchQuery, sortBy]);

  // Group filtered highlights by page
  const highlightsByPage = filteredAndSortedHighlights.reduce((acc, highlight) => {
    const page = highlight.pdf_page;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(highlight);
    return acc;
  }, {} as Record<number, Highlight[]>);

  // Sort pages
  const sortedPages = Object.keys(highlightsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  const handleNoteSubmit = (annotationId: string, existingNote?: string) => {
    if (!noteText.trim()) return;

    if (existingNote) {
      onNoteUpdate(annotationId, noteText);
    } else {
      onNoteAdd(annotationId, noteText);
    }

    setEditingNoteId(null);
    setNoteText('');
  };

  const handleColorChange = (annotationId: string, newColor: string) => {
    onHighlightColorChange(annotationId, newColor);
    setEditingColorId(null);
  };

  // Export to Markdown
  const exportToMarkdown = () => {
    let markdown = '# PDF Annotations\n\n';
    markdown += `**Total Annotations:** ${filteredAndSortedHighlights.length}\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += '---\n\n';

    sortedPages.forEach(page => {
      markdown += `## Page ${page}\n\n`;
      highlightsByPage[page].forEach(h => {
        const typeEmoji = h.annotation_type === 'highlight' ? '🖍️' :
                         h.annotation_type === 'underline' ? '📏' :
                         h.annotation_type === 'strikethrough' ? '❌' :
                         h.annotation_type === 'sticky_note' ? '📝' : '✏️';

        markdown += `### ${typeEmoji} ${h.annotation_type.charAt(0).toUpperCase() + h.annotation_type.slice(1)}\n\n`;

        if (h.highlight_text) {
          markdown += `**Selected Text:** "${h.highlight_text}"\n\n`;
        }

        if (h.content) {
          // Strip HTML tags for markdown
          const plainContent = h.content.replace(/<[^>]*>/g, '');
          markdown += `**Note:** ${plainContent}\n\n`;
        }

        if (h.tags && h.tags.length > 0) {
          markdown += `**Tags:** ${h.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
        }

        markdown += `**Created:** ${new Date(h.created_at).toLocaleString()}\n\n`;
        markdown += '---\n\n';
      });
    });

    // Download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Page', 'Type', 'Selected Text', 'Note', 'Tags', 'Color', 'Created', 'Updated'];
    const rows = filteredAndSortedHighlights.map(h => [
      h.pdf_page,
      h.annotation_type,
      h.highlight_text || '',
      h.content ? h.content.replace(/<[^>]*>/g, '').replace(/"/g, '""') : '',
      h.tags ? h.tags.join('; ') : '',
      h.highlight_color || h.sticky_note_color || '',
      new Date(h.created_at).toLocaleString(),
      new Date(h.updated_at).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Annotations</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {filteredAndSortedHighlights.length} of {highlights.length} • Page {currentPage}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Close sidebar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search annotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Toolbar: Filters, Sort, Export */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showFilters ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title="Toggle filters"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            title="Sort by"
          >
            <option value="page">Sort by Page</option>
            <option value="date">Sort by Date</option>
            <option value="type">Sort by Type</option>
          </select>

          <button
            onClick={exportToMarkdown}
            className="p-1.5 text-gray-700 hover:bg-white rounded-lg transition-colors"
            title="Export to Markdown"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>

          <button
            onClick={exportToCSV}
            className="p-1.5 text-gray-700 hover:bg-white rounded-lg transition-colors"
            title="Export to CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-2 bg-white border-t border-gray-200 pt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="highlight">Highlights</option>
                <option value="underline">Underlines</option>
                <option value="strikethrough">Strikethroughs</option>
                <option value="sticky_note">Sticky Notes</option>
              </select>
            </div>

            {allTags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {highlights.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PencilIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No annotations yet</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Enable highlight mode (pencil icon) and select text to create your first annotation
            </p>
          </div>
        ) : filteredAndSortedHighlights.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FunnelIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No matching annotations</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          sortedPages.map((page) => (
            <div key={page} className="space-y-3">
              {/* Page Header */}
              <div className="flex items-center gap-2 sticky top-0 bg-white py-2 z-10">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-medium text-gray-500 px-2">
                  Page {page}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Highlights for this page */}
              {highlightsByPage[page].map((highlight) => (
                <div
                  key={highlight.annotation_id}
                  className={`group relative bg-white border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer ${
                    page === currentPage ? 'border-purple-300' : 'border-gray-200'
                  }`}
                  onClick={() => onHighlightClick(highlight)}
                >
                  {/* Color indicator */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: highlight.highlight_color || '#FFEB3B' }}
                  />

                  {/* Highlighted text */}
                  <div className="ml-2">
                    <div
                      className="text-sm text-gray-900 mb-2 p-2 rounded"
                      style={{
                        backgroundColor: `${highlight.highlight_color || '#FFEB3B'}20`,
                        borderLeft: `3px solid ${highlight.highlight_color || '#FFEB3B'}`,
                      }}
                    >
                      "{highlight.highlight_text}"
                    </div>

                    {/* Note section */}
                    {editingNoteId === highlight.annotation_id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add your note..."
                          className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNoteSubmit(highlight.annotation_id, highlight.content);
                            }}
                            className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNoteId(null);
                              setNoteText('');
                            }}
                            className="flex-1 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : highlight.content && highlight.content !== `Highlight: ${highlight.highlight_text}` ? (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div
                            className="flex-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: highlight.content }}
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Tags */}
                    {highlight.tags && highlight.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {highlight.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full"
                          >
                            <TagIcon className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(highlight.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        {highlight.annotation_type}
                      </span>
                    </div>

                    {/* Action buttons (show on hover) */}
                    <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Add/Edit Note */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNoteId(highlight.annotation_id);
                          setNoteText(
                            highlight.content && highlight.content !== `Highlight: ${highlight.highlight_text}`
                              ? highlight.content
                              : ''
                          );
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                        title={highlight.content ? 'Edit note' : 'Add note'}
                      >
                        <ChatBubbleLeftIcon className="w-3 h-3" />
                        {highlight.content && highlight.content !== `Highlight: ${highlight.highlight_text}`
                          ? 'Edit Note'
                          : 'Add Note'}
                      </button>

                      {/* Change Color */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingColorId(
                              editingColorId === highlight.annotation_id ? null : highlight.annotation_id
                            );
                          }}
                          className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors flex items-center gap-1"
                          title="Change color"
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: highlight.highlight_color || '#FFEB3B' }}
                          />
                        </button>

                        {/* Color picker dropdown */}
                        {editingColorId === highlight.annotation_id && (
                          <div
                            className="absolute bottom-full mb-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {HIGHLIGHT_COLORS.map((color) => (
                              <button
                                key={color.hex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleColorChange(highlight.annotation_id, color.hex);
                                }}
                                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-colors"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this highlight?')) {
                            onHighlightDelete(highlight.annotation_id);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                        title="Delete highlight"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

