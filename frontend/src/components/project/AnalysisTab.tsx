'use client';

import React, { useState } from 'react';
import { DocumentTextIcon, BeakerIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface AnalysisTabProps {
  project: any;
  onGenerateReport?: () => void;
  onGenerateDeepDive?: () => void;
}

export function AnalysisTab({ project, onGenerateReport, onGenerateDeepDive }: AnalysisTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'reports' | 'deep-dives'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  
  // Combine reports and deep dives
  const allAnalyses = [
    ...(project.reports || []).map((r: any) => ({ ...r, type: 'report', created_at: r.created_at || r.generated_at })),
    ...(project.deep_dives || []).map((d: any) => ({ ...d, type: 'deep-dive', created_at: d.created_at || d.generated_at }))
  ];
  
  // Filter analyses
  const filteredAnalyses = allAnalyses.filter(a => 
    filterType === 'all' || 
    (filterType === 'reports' && a.type === 'report') ||
    (filterType === 'deep-dives' && a.type === 'deep-dive')
  );
  
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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            Reports and deep dive analyses of your research
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onGenerateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Generate Report</span>
          </button>
          <button
            onClick={onGenerateDeepDive}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <BeakerIcon className="w-5 h-5" />
            <span>Generate Deep Dive</span>
          </button>
        </div>
      </div>
      
      {/* Filters and Sort */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Analyses ({allAnalyses.length})</option>
              <option value="reports">Reports Only ({allAnalyses.filter(a => a.type === 'report').length})</option>
              <option value="deep-dives">Deep Dives Only ({allAnalyses.filter(a => a.type === 'deep-dive').length})</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date (Newest First)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Analysis Cards */}
      {sortedAnalyses.length > 0 ? (
        <div className="space-y-4">
          {sortedAnalyses.map((analysis: any, index: number) => (
            <div 
              key={analysis.report_id || analysis.deep_dive_id || index} 
              className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {analysis.type === 'report' ? (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BeakerIcon className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      analysis.type === 'report' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {analysis.type === 'report' ? '📊 REPORT' : '🔬 DEEP DIVE'}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(analysis.created_at)}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {analysis.title || 'Untitled Analysis'}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                {analysis.papers_analyzed && (
                  <span>📄 {analysis.papers_analyzed} papers analyzed</span>
                )}
                {analysis.word_count && (
                  <span>📝 {analysis.word_count.toLocaleString()} words</span>
                )}
                {analysis.status && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    analysis.status === 'completed' 
                      ? 'bg-green-100 text-green-700'
                      : analysis.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {analysis.status}
                  </span>
                )}
              </div>
              
              {analysis.summary && (
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {analysis.summary}
                </p>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    // Navigate to report/deep dive page
                    const id = analysis.report_id || analysis.deep_dive_id;
                    const type = analysis.type === 'report' ? 'report' : 'deep-dive';
                    window.location.href = `/${type}/${id}`;
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View
                </button>
                <button 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    // Download functionality
                    alert('Download functionality coming soon');
                  }}
                >
                  Download
                </button>
                <button 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    // Share functionality
                    alert('Share functionality coming soon');
                  }}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No analyses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Generate reports and deep dives to analyze your research and gain insights
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onGenerateReport}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Generate Your First Report</span>
            </button>
            <button
              onClick={onGenerateDeepDive}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BeakerIcon className="w-5 h-5" />
              <span>Generate Deep Dive</span>
            </button>
          </div>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">💡 What's the difference?</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li><strong>📊 Reports:</strong> Comprehensive literature reviews that synthesize findings across multiple papers</li>
              <li><strong>🔬 Deep Dives:</strong> In-depth analysis of specific topics, methodologies, or research questions</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisTab;

