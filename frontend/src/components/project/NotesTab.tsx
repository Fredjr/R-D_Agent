'use client';

// CACHE BUSTER: Force new bundle hash - v2.0.3 - 2025-11-05T12:00:00Z
import React, { useState, useMemo, useEffect } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import AnnotationList from '@/components/annotations/AnnotationList';
import AnnotationGroupView from '@/components/annotations/AnnotationGroupView';
import AnnotationTimelineView from '@/components/annotations/AnnotationTimelineView';
import AnnotationPaperView from '@/components/annotations/AnnotationPaperView';
import CollectionScopeFilter from '@/components/annotations/CollectionScopeFilter';
import type { NoteType, Priority, Status } from '@/lib/api/annotations';
import FilterPanel, { type FilterSection } from '@/components/filters/FilterPanel';
import FilterChips, { type FilterChip } from '@/components/filters/FilterChips';

interface NotesTabProps {
  project: any;
  onRefresh: () => void;
}

type NoteTypeFilter = 'all' | NoteType;
type PriorityFilter = 'all' | Priority;
type StatusFilter = 'all' | Status;
type ViewMode = 'all' | 'project' | 'collection' | 'paper';
type GroupByMode = 'none' | 'paper' | 'date' | 'type';
type DisplayMode = 'list' | 'group' | 'timeline' | 'paper';

export function NotesTab({ project, onRefresh }: NotesTabProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NoteTypeFilter>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 Week 6 Day 4-5: Enhanced filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [hasActionItems, setHasActionItems] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  // 📚 Collection scope filter
  const [selectedCollectionScope, setSelectedCollectionScope] = useState<string | 'all' | 'unlinked'>('all');

  // 🆕 PHASE 2: Grouping and view mode
  const [groupBy, setGroupBy] = useState<GroupByMode>('none');
  const [useGroupView, setUseGroupView] = useState(false);

  // 🆕 PHASE 3: Display mode (list, group, timeline, paper)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('list');

  // Fetch annotations when component mounts or project changes
  useEffect(() => {
    const fetchAnnotations = async () => {
      if (!project?.project_id || !user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('📡 Fetching annotations with User-ID:', user.email); // DEBUG: Verify correct header
        const response = await fetch(`/api/proxy/projects/${project.project_id}/annotations`, {
          headers: {
            'User-ID': user.email, // CRITICAL: Must use user.email, not user.user_id
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch annotations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Handle both {annotations: [...]} and [...] response formats
        const annotationsData = data.annotations || data || [];
        setAnnotations(annotationsData);
      } catch (err) {
        console.error('❌ Error fetching annotations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load annotations');
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnotations();
  }, [project?.project_id, user?.email]);

  // Get all annotations
  const allAnnotations = annotations;

  // Filter annotations based on criteria
  const filteredAnnotations = useMemo(() => {
    return allAnnotations.filter((note: any) => {
      // 📚 Collection scope filter (NEW - highest priority)
      if (selectedCollectionScope !== 'all') {
        if (selectedCollectionScope === 'unlinked') {
          // Show only notes with no collection_id
          if (note.collection_id) return false;
        } else {
          // Show only notes linked to the selected collection
          if (note.collection_id !== selectedCollectionScope) return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          note.content?.toLowerCase().includes(query) ||
          note.note_type?.toLowerCase().includes(query) ||
          note.tags?.some((tag: string) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType !== 'all' && note.note_type !== selectedType) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && note.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && note.status !== selectedStatus) {
        return false;
      }

      // View mode filter
      if (viewMode === 'project' && (note.collection_id || note.article_pmid)) {
        return false;
      }
      if (viewMode === 'collection' && (!note.collection_id || note.article_pmid)) {
        return false;
      }
      if (viewMode === 'paper' && !note.article_pmid) {
        return false;
      }

      // 🔍 Week 6: Tags filter
      if (selectedTags.length > 0) {
        const noteTags = note.tags || [];
        const hasSelectedTag = selectedTags.some(tag => noteTags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      // 🔍 Week 6: Date range filter
      if (dateRange) {
        const noteDate = new Date(note.created_at).getTime();
        const [startDate, endDate] = dateRange;
        if (noteDate < startDate || noteDate > endDate) return false;
      }

      // 🔍 Week 6: Has action items filter
      if (hasActionItems) {
        const content = note.content?.toLowerCase() || '';
        const hasActionItem =
          content.includes('todo') ||
          content.includes('action:') ||
          content.includes('[ ]') ||
          note.note_type === 'todo';
        if (!hasActionItem) return false;
      }

      // 🔍 Week 6: Author filter (for collaboration)
      if (selectedAuthor !== 'all' && note.created_by !== selectedAuthor) {
        return false;
      }

      return true;
    });
  }, [allAnnotations, searchQuery, selectedType, selectedPriority, selectedStatus, viewMode, selectedTags, dateRange, hasActionItems, selectedAuthor, selectedCollectionScope]);

  // Group annotations by hierarchy
  const groupedAnnotations = useMemo(() => {
    const groups = {
      project: [] as any[],
      collections: {} as Record<string, any[]>,
      papers: {} as Record<string, any[]>
    };

    filteredAnnotations.forEach((note: any) => {
      if (!note.collection_id && !note.article_pmid) {
        groups.project.push(note);
      } else if (note.collection_id && !note.article_pmid) {
        if (!groups.collections[note.collection_id]) {
          groups.collections[note.collection_id] = [];
        }
        groups.collections[note.collection_id].push(note);
      } else if (note.article_pmid) {
        const key = `${note.collection_id || 'none'}_${note.article_pmid}`;
        if (!groups.papers[key]) {
          groups.papers[key] = [];
        }
        groups.papers[key].push(note);
      }
    });

    return groups;
  }, [filteredAnnotations]);

  // 🔍 Week 6: Get unique tags and authors from all annotations
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allAnnotations.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allAnnotations]);

  const availableAuthors = useMemo(() => {
    const authors = new Set<string>();
    allAnnotations.forEach(note => {
      if (note.created_by) {
        authors.add(note.created_by);
      }
    });
    return Array.from(authors).sort();
  }, [allAnnotations]);

  // 📚 Calculate note counts per collection
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAnnotations.forEach(note => {
      const key = note.collection_id || 'unlinked';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [allAnnotations]);

  // Count active filters
  const activeFiltersCount =
    (selectedType !== 'all' ? 1 : 0) +
    (selectedPriority !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (viewMode !== 'all' ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0) +
    (dateRange ? 1 : 0) +
    (hasActionItems ? 1 : 0) +
    (selectedAuthor !== 'all' ? 1 : 0) +
    (selectedCollectionScope !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setViewMode('all');
    setSearchQuery('');
    setSelectedTags([]);
    setDateRange(null);
    setHasActionItems(false);
    setSelectedAuthor('all');
    setSelectedCollectionScope('all');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Error Loading Notes</h2>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notes & Ideas</h2>
              <p className="text-sm text-gray-600">All your research notes in one place</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{allAnnotations.length}</div>
            <div className="text-sm text-gray-600">Total Notes</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Project Level</div>
            <div className="text-2xl font-bold text-gray-900">
              {groupedAnnotations.project.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Collection Level</div>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(groupedAnnotations.collections).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Paper Level</div>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(groupedAnnotations.papers).length}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes by content, type, or tags..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* 📚 Collection Scope Filter (NEW) */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Filter by Collection</h3>
          <p className="text-xs text-gray-600">
            View notes from all collections, a specific collection, or unlinked project notes
          </p>
        </div>
        <CollectionScopeFilter
          projectId={project.project_id}
          selectedScope={selectedCollectionScope}
          onScopeChange={setSelectedCollectionScope}
          noteCounts={noteCounts}
        />
      </div>

      {/* 🔍 Week 6: Enhanced Filter Panel */}
      <FilterPanel
        sections={[
          {
            title: 'Notes',
            filters: [
              {
                id: 'viewMode',
                label: 'View',
                type: 'select',
                value: viewMode,
                options: [
                  { value: 'all', label: 'All Notes' },
                  { value: 'project', label: 'Project Only' },
                  { value: 'collection', label: 'Collection Only' },
                  { value: 'paper', label: 'Paper Only' }
                ]
              },
              {
                id: 'selectedType',
                label: 'Type',
                type: 'select',
                value: selectedType,
                options: [
                  { value: 'all', label: 'All Types' },
                  { value: 'general', label: '📝 General' },
                  { value: 'finding', label: '🔍 Finding' },
                  { value: 'hypothesis', label: '💡 Hypothesis' },
                  { value: 'question', label: '❓ Question' },
                  { value: 'todo', label: '✅ To-Do' },
                  { value: 'comparison', label: '⚖️ Comparison' },
                  { value: 'critique', label: '🔎 Critique' }
                ]
              },
              {
                id: 'selectedPriority',
                label: 'Priority',
                type: 'select',
                value: selectedPriority,
                options: [
                  { value: 'all', label: 'All Priorities' },
                  { value: 'low', label: '🟢 Low' },
                  { value: 'medium', label: '🟡 Medium' },
                  { value: 'high', label: '🟠 High' },
                  { value: 'critical', label: '🔴 Critical' }
                ]
              },
              {
                id: 'selectedStatus',
                label: 'Status',
                type: 'select',
                value: selectedStatus,
                options: [
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: '🟢 Active' },
                  { value: 'resolved', label: '✅ Resolved' },
                  { value: 'archived', label: '📦 Archived' }
                ]
              },
              {
                id: 'selectedTags',
                label: 'Tags',
                type: 'multi-select',
                value: selectedTags,
                options: availableTags.map(tag => ({ value: tag, label: tag }))
              },
              {
                id: 'hasActionItems',
                label: 'Has Action Items',
                type: 'checkbox',
                value: hasActionItems
              },
              ...(availableAuthors.length > 1 ? [{
                id: 'selectedAuthor',
                label: 'Author',
                type: 'select' as const,
                value: selectedAuthor,
                options: [
                  { value: 'all', label: 'All Authors' },
                  ...availableAuthors.map(author => ({ value: author, label: author }))
                ]
              }] : [])
            ]
          }
        ]}
        activeFilters={{
          viewMode,
          selectedType,
          selectedPriority,
          selectedStatus,
          selectedTags,
          hasActionItems,
          selectedAuthor
        }}
        onFilterChange={(filterId, value) => {
          if (filterId === 'viewMode') setViewMode(value as ViewMode);
          else if (filterId === 'selectedType') setSelectedType(value as NoteTypeFilter);
          else if (filterId === 'selectedPriority') setSelectedPriority(value as PriorityFilter);
          else if (filterId === 'selectedStatus') setSelectedStatus(value as StatusFilter);
          else if (filterId === 'selectedTags') setSelectedTags(value);
          else if (filterId === 'hasActionItems') setHasActionItems(value);
          else if (filterId === 'selectedAuthor') setSelectedAuthor(value);
        }}
        onClearAll={clearFilters}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* 🔍 Week 6: Active Filter Chips */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <FilterChips
          chips={[
            ...(viewMode !== 'all' ? [{ id: 'viewMode', label: 'View', value: viewMode, displayValue: viewMode }] : []),
            ...(selectedType !== 'all' ? [{ id: 'selectedType', label: 'Type', value: selectedType, displayValue: selectedType }] : []),
            ...(selectedPriority !== 'all' ? [{ id: 'selectedPriority', label: 'Priority', value: selectedPriority, displayValue: selectedPriority }] : []),
            ...(selectedStatus !== 'all' ? [{ id: 'selectedStatus', label: 'Status', value: selectedStatus, displayValue: selectedStatus }] : []),
            ...(selectedTags.length > 0 ? [{ id: 'selectedTags', label: 'Tags', value: selectedTags, displayValue: selectedTags.join(', ') }] : []),
            ...(hasActionItems ? [{ id: 'hasActionItems', label: 'Action Items', value: true, displayValue: 'Yes' }] : []),
            ...(selectedAuthor !== 'all' ? [{ id: 'selectedAuthor', label: 'Author', value: selectedAuthor, displayValue: selectedAuthor }] : []),
            ...(searchQuery ? [{ id: 'search', label: 'Search', value: searchQuery, displayValue: `"${searchQuery}"` }] : [])
          ]}
          onRemove={(chipId) => {
            if (chipId === 'search') setSearchQuery('');
            else if (chipId === 'viewMode') setViewMode('all');
            else if (chipId === 'selectedType') setSelectedType('all');
            else if (chipId === 'selectedPriority') setSelectedPriority('all');
            else if (chipId === 'selectedStatus') setSelectedStatus('all');
            else if (chipId === 'selectedTags') setSelectedTags([]);
            else if (chipId === 'hasActionItems') setHasActionItems(false);
            else if (chipId === 'selectedAuthor') setSelectedAuthor('all');
          }}
          onClearAll={clearFilters}
        />
      )}

      {/* Results Summary + View Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredAnnotations.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{allAnnotations.length}</span> notes
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Display Mode Selector - PHASE 3 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">View:</label>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  displayMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="List View"
              >
                <ListBulletIcon className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setDisplayMode('group')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  displayMode === 'group' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Group View"
              >
                <Squares2X2Icon className="w-4 h-4" />
                Group
              </button>
              <button
                onClick={() => setDisplayMode('timeline')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  displayMode === 'timeline' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Timeline View"
              >
                <ClockIcon className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setDisplayMode('paper')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  displayMode === 'paper' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Paper View"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Paper
              </button>
            </div>
          </div>

          {/* Group By Selector - Only show for Group view */}
          {displayMode === 'group' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Group by:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">None</option>
                <option value="paper">Paper</option>
                <option value="date">Date</option>
                <option value="type">Annotation Type</option>
              </select>
            </div>
          )}

          {filteredAnnotations.length === 0 && allAnnotations.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Notes List - PHASE 3: Multiple Display Modes */}
      {filteredAnnotations.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          {displayMode === 'list' && (
            <AnnotationList
              projectId={project.project_id}
              userId={user?.email}
              initialFilters={{
                note_type: selectedType !== 'all' ? selectedType : undefined,
                priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
              }}
              showForm={false}
              compact={false}
            />
          )}

          {displayMode === 'group' && (
            <div className="p-4">
              <AnnotationGroupView
                annotations={filteredAnnotations}
                projectId={project.project_id}
                groupBy={groupBy}
                onJumpToSource={(annotation) => {
                  if (annotation.article_pmid && annotation.pdf_page) {
                    window.open(`/project/${project.project_id}/pdf/${annotation.article_pmid}?page=${annotation.pdf_page}`, '_blank');
                  }
                }}
                onEdit={(annotation) => {
                  console.log('Edit annotation:', annotation);
                }}
                onDelete={(annotationId) => {
                  console.log('Delete annotation:', annotationId);
                }}
                onReply={(annotationId) => {
                  console.log('Reply to annotation:', annotationId);
                }}
              />
            </div>
          )}

          {displayMode === 'timeline' && (
            <div className="p-6">
              <AnnotationTimelineView
                annotations={filteredAnnotations}
                projectId={project.project_id}
                onJumpToSource={(annotation) => {
                  if (annotation.article_pmid && annotation.pdf_page) {
                    window.open(`/project/${project.project_id}/pdf/${annotation.article_pmid}?page=${annotation.pdf_page}`, '_blank');
                  }
                }}
                onEdit={(annotation) => {
                  console.log('Edit annotation:', annotation);
                }}
                onDelete={(annotationId) => {
                  console.log('Delete annotation:', annotationId);
                }}
                onReply={(annotationId) => {
                  console.log('Reply to annotation:', annotationId);
                }}
              />
            </div>
          )}

          {displayMode === 'paper' && (
            <div className="p-4">
              <AnnotationPaperView
                annotations={filteredAnnotations}
                projectId={project.project_id}
                onJumpToSource={(annotation) => {
                  if (annotation.article_pmid && annotation.pdf_page) {
                    window.open(`/project/${project.project_id}/pdf/${annotation.article_pmid}?page=${annotation.pdf_page}`, '_blank');
                  }
                }}
                onEdit={(annotation) => {
                  console.log('Edit annotation:', annotation);
                }}
                onDelete={(annotationId) => {
                  console.log('Delete annotation:', annotationId);
                }}
                onReply={(annotationId) => {
                  console.log('Reply to annotation:', annotationId);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {allAnnotations.length === 0 ? 'No notes yet' : 'No notes match your filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {allAnnotations.length === 0
              ? 'Start taking notes as you explore papers and build your research.'
              : 'Try adjusting your filters or search query.'}
          </p>
          {allAnnotations.length === 0 ? (
            <button
              onClick={() => {
                // Switch to explore tab
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'explore');
                window.history.pushState({}, '', url);
                window.location.reload();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Explore Papers
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesTab;

