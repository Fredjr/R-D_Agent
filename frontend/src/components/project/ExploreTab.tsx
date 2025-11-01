'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';

interface ExploreTabProps {
  project: any;
  onRefresh: () => void;
}

export function ExploreTab({ project, onRefresh }: ExploreTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&project=${project.project_id}`;
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Explore Papers</h2>
              <p className="text-sm text-gray-600">Discover and visualize related research</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SparklesIcon className="w-5 h-5 text-blue-500" />
            <span>Network View</span>
          </div>
        </div>

        {/* PubMed Search Bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PubMed for papers (e.g., 'CRISPR gene editing', 'machine learning cancer')"
              className="w-full pl-12 pr-32 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-gray-600">Quick tips:</span>
          <button
            onClick={() => setSearchQuery('machine learning')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            machine learning
          </button>
          <button
            onClick={() => setSearchQuery('CRISPR')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            CRISPR
          </button>
          <button
            onClick={() => setSearchQuery('climate change')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            climate change
          </button>
          <button
            onClick={() => setSearchQuery('neural networks')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            neural networks
          </button>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <MultiColumnNetworkView
          sourceType="project"
          sourceId={project.project_id}
          projectId={project.project_id}
        />
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 How to use the network view:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Click on nodes</strong> to view paper details in the side panel</li>
          <li>• <strong>Use navigation modes</strong> (Similar Work, Earlier Work, Later Work, Authors) to explore connections</li>
          <li>• <strong>Add papers to collections</strong> by clicking the "Add to Collection" button</li>
          <li>• <strong>Create notes</strong> directly from paper cards</li>
          <li>• <strong>Zoom and pan</strong> the graph to explore the network</li>
          <li>• <strong>Node size</strong> represents citation count (bigger = more citations)</li>
          <li>• <strong>Node color</strong> represents publication year (darker = more recent)</li>
        </ul>
      </div>
    </div>
  );
}

export default ExploreTab;

