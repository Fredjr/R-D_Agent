'use client';

// CACHE BUSTER: Force new bundle hash - v2.0.1 - 2025-11-01T14:40:00Z
import React, { useState, useMemo, useEffect } from 'react';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import AnnotationList from '@/components/annotations/AnnotationList';
import type { NoteType, Priority, Status } from '@/lib/api/annotations';

interface NotesTabProps {
  project: any;
  onRefresh: () => void;
}

type NoteTypeFilter = 'all' | NoteType;
type PriorityFilter = 'all' | Priority;
type StatusFilter = 'all' | Status;
type ViewMode = 'all' | 'project' | 'collection' | 'paper';

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

      return true;
    });
  }, [allAnnotations, searchQuery, selectedType, selectedPriority, selectedStatus, viewMode]);

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

  // Count active filters
  const activeFiltersCount = 
    (selectedType !== 'all' ? 1 : 0) +
    (selectedPriority !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (viewMode !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setViewMode('all');
    setSearchQuery('');
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by content, type, or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* View Mode Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Notes</option>
                  <option value="project">Project Only</option>
                  <option value="collection">Collection Only</option>
                  <option value="paper">Paper Only</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as NoteTypeFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="general">📝 General</option>
                  <option value="finding">🔍 Finding</option>
                  <option value="hypothesis">💡 Hypothesis</option>
                  <option value="question">❓ Question</option>
                  <option value="todo">✅ To-Do</option>
                  <option value="comparison">⚖️ Comparison</option>
                  <option value="critique">🔎 Critique</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as PriorityFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">🟢 Active</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredAnnotations.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{allAnnotations.length}</span> notes
        </p>
        {filteredAnnotations.length === 0 && allAnnotations.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Notes List */}
      {filteredAnnotations.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <AnnotationList
            projectId={project.project_id}
            initialFilters={{
              note_type: selectedType !== 'all' ? selectedType : undefined,
              priority: selectedPriority !== 'all' ? selectedPriority : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
            }}
            showForm={false}
            compact={false}
          />
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

