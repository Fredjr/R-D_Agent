'use client';

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  BeakerIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  SpotifyTabSection,
  SpotifyTabCard,
  SpotifyTabCardHeader,
  SpotifyTabCardContent,
  SpotifyTabButton,
  SpotifyTabSearchBar,
  SpotifyTabEmptyState,
  SpotifyTabGrid,
  SpotifyTabBadge
} from './shared';

interface AnalysisTabProps {
  project: any;
  onGenerateReport?: () => void;
  onGenerateDeepDive?: () => void;
}

export function AnalysisTab({ project, onGenerateReport, onGenerateDeepDive }: AnalysisTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'reports' | 'deep-dives'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine reports and deep dives
  // Backend returns 'deep_dive_analyses' but we also check 'deep_dives' for backward compatibility
  const deepDives = project.deep_dive_analyses || project.deep_dives || [];
  const allAnalyses = [
    ...(project.reports || []).map((r: any) => ({ ...r, type: 'report', created_at: r.created_at || r.generated_at })),
    ...deepDives.map((d: any) => ({
      ...d,
      type: 'deep-dive',
      created_at: d.created_at || d.generated_at,
      // Map analysis_id to deep_dive_id for consistency
      deep_dive_id: d.analysis_id || d.deep_dive_id,
      title: d.article_title || d.title,
      summary: d.article_title || d.summary || 'Deep dive analysis'
    }))
  ];

  // Filter analyses by type
  const filteredByType = allAnalyses.filter(a =>
    filterType === 'all' ||
    (filterType === 'reports' && a.type === 'report') ||
    (filterType === 'deep-dives' && a.type === 'deep-dive')
  );

  // Filter analyses by search query
  const filteredAnalyses = filteredByType.filter(a => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (a.title || '').toLowerCase().includes(query) ||
      (a.summary || '').toLowerCase().includes(query) ||
      (a.objective || '').toLowerCase().includes(query)
    );
  });

  // Sort analyses
  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return (a.title || '').localeCompare(b.title || '');
    }
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <SpotifyTabSection data-testid="analysis-tab-content">
      {/* Header with actions */}
      <SpotifyTabCard variant="gradient" gradient="from-orange-500/10 to-red-500/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--spotify-white)]">Analysis</h2>
            <p className="text-sm text-[var(--spotify-light-text)] mt-1">
              Reports and deep dive analyses of your research
            </p>
          </div>
          <div className="flex gap-3">
            <SpotifyTabButton
              data-testid="generate-report-button"
              variant="primary"
              onClick={onGenerateReport}
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Generate Report</span>
            </SpotifyTabButton>
            <SpotifyTabButton
              data-testid="generate-deep-dive-button"
              variant="primary"
              onClick={onGenerateDeepDive}
            >
              <BeakerIcon className="w-5 h-5" />
              <span>Generate Deep Dive</span>
            </SpotifyTabButton>
          </div>
        </div>
      </SpotifyTabCard>

      {/* Search and Filters */}
      <SpotifyTabCard>
        <SpotifyTabCardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <SpotifyTabSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search analyses by title, summary, or objective..."
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">Filter by Type</label>
              <select
                data-testid="analysis-filter-dropdown"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--spotify-white)]"
              >
                <option value="all">All Analyses ({allAnalyses.length})</option>
                <option value="reports">Reports Only ({allAnalyses.filter(a => a.type === 'report').length})</option>
                <option value="deep-dives">Deep Dives Only ({allAnalyses.filter(a => a.type === 'deep-dive').length})</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">Sort by</label>
              <select
                data-testid="analysis-sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--spotify-white)]"
              >
                <option value="date">Date (Newest First)</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="text-sm text-[var(--spotify-light-text)] mt-4">
              Found {sortedAnalyses.length} result{sortedAnalyses.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
        </SpotifyTabCardContent>
      </SpotifyTabCard>
      
      {/* Analysis Cards */}
      {sortedAnalyses.length > 0 ? (
        <div className="space-y-4">
          {sortedAnalyses.map((analysis: any, index: number) => (
            <SpotifyTabCard
              key={analysis.report_id || analysis.deep_dive_id || index}
              hoverable
            >
              <SpotifyTabCardContent>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {analysis.type === 'report' ? (
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <BeakerIcon className="w-6 h-6 text-purple-500" />
                      </div>
                    )}
                    <div>
                      <SpotifyTabBadge
                        variant={analysis.type === 'report' ? 'info' : 'default'}
                        size="sm"
                      >
                        {analysis.type === 'report' ? '📊 REPORT' : '🔬 DEEP DIVE'}
                      </SpotifyTabBadge>
                    </div>
                  </div>
                  <span className="text-sm text-[var(--spotify-light-text)]">
                    {formatDate(analysis.created_at)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2">
                  {analysis.title || 'Untitled Analysis'}
                </h3>

                <div className="flex items-center gap-4 text-sm text-[var(--spotify-light-text)] mb-4">
                  {analysis.papers_analyzed && (
                    <span>📄 {analysis.papers_analyzed} papers analyzed</span>
                  )}
                  {analysis.word_count && (
                    <span>📝 {analysis.word_count.toLocaleString()} words</span>
                  )}
                  {analysis.status && (
                    <SpotifyTabBadge
                      variant={
                        analysis.status === 'completed' ? 'success' :
                        analysis.status === 'processing' ? 'warning' : 'default'
                      }
                      size="sm"
                    >
                      {analysis.status}
                    </SpotifyTabBadge>
                  )}
                </div>

                {analysis.summary && (
                  <p className="text-sm text-[var(--spotify-light-text)] mb-4 line-clamp-2">
                    {analysis.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <SpotifyTabButton
                    variant="primary"
                    onClick={() => {
                      // Navigate to report/deep dive page
                      const id = analysis.report_id || analysis.deep_dive_id || analysis.analysis_id;
                      const type = analysis.type === 'report' ? 'report' : 'analysis';
                      window.location.href = `/${type}/${id}`;
                    }}
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </SpotifyTabButton>
                  <SpotifyTabButton
                    variant="secondary"
                    onClick={() => {
                      // Download functionality - export as markdown
                      const id = analysis.report_id || analysis.deep_dive_id;
                      const type = analysis.type === 'report' ? 'report' : 'deep-dive';
                      const content = `# ${analysis.title || 'Untitled Analysis'}\n\n${analysis.summary || ''}\n\nGenerated: ${new Date(analysis.created_at).toLocaleDateString()}\nType: ${type}\nID: ${id}`;
                      const blob = new Blob([content], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${analysis.title || 'analysis'}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export
                  </SpotifyTabButton>
                  <SpotifyTabButton
                    variant="secondary"
                    onClick={() => {
                      // Share functionality - copy link
                      const id = analysis.report_id || analysis.deep_dive_id;
                      const type = analysis.type === 'report' ? 'report' : 'deep-dive';
                      const url = `${window.location.origin}/${type}/${id}`;
                      navigator.clipboard.writeText(url);
                      alert('✅ Link copied to clipboard!');
                    }}
                  >
                    <ShareIcon className="w-4 h-4" />
                    Share
                  </SpotifyTabButton>
                </div>
              </SpotifyTabCardContent>
            </SpotifyTabCard>
          ))}
        </div>
      ) : searchQuery ? (
        <SpotifyTabEmptyState
          icon={<MagnifyingGlassIcon />}
          title="No results found"
          description={`No analyses match your search for "${searchQuery}"`}
          action={{
            label: 'Clear Search',
            onClick: () => setSearchQuery('')
          }}
        />
      ) : (
        <SpotifyTabCard>
          <SpotifyTabCardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-2">
                No analyses yet
              </h3>
              <p className="text-[var(--spotify-light-text)] mb-6">
                Generate reports and deep dives to analyze your research and gain insights
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <SpotifyTabButton
                  variant="primary"
                  onClick={onGenerateReport}
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>Generate Your First Report</span>
                </SpotifyTabButton>
                <SpotifyTabButton
                  variant="primary"
                  onClick={onGenerateDeepDive}
                >
                  <BeakerIcon className="w-5 h-5" />
                  <span>Generate Deep Dive</span>
                </SpotifyTabButton>
              </div>

              <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left max-w-2xl mx-auto">
                <h4 className="font-medium text-blue-400 mb-2">💡 What's the difference?</h4>
                <ul className="text-sm text-[var(--spotify-light-text)] space-y-2">
                  <li><strong className="text-[var(--spotify-white)]">📊 Reports:</strong> Comprehensive literature reviews that synthesize findings across multiple papers</li>
                  <li><strong className="text-[var(--spotify-white)]">🔬 Deep Dives:</strong> In-depth analysis of specific topics, methodologies, or research questions</li>
                </ul>
              </div>
            </div>
          </SpotifyTabCardContent>
        </SpotifyTabCard>
      )}
    </SpotifyTabSection>
  );
}

export default AnalysisTab;

