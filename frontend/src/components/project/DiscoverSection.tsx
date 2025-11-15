'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DiscoverSectionProps {
  projectId: string;
  collectionsCount: number;
  onAddNote: () => void;
  onNewReport: () => void;
  onDeepDive: () => void;
}

export default function DiscoverSection({
  projectId,
  collectionsCount,
  onAddNote,
  onNewReport,
  onDeepDive
}: DiscoverSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&projectId=${projectId}`);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Discover Research Networks - Three Colored Boxes */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔬</span>
          Discover Research Networks
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Explore connections between papers, discover adjacent research, and use your knowledge graph
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Explore Network - Purple to Indigo gradient */}
          <button
            onClick={() => router.push('/explore/network')}
            className="group relative bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="absolute top-4 right-4 text-white opacity-40 group-hover:opacity-70 transition-opacity">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="mb-3">
              <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                See Feature
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Explore Network</h3>
            <p className="text-sm text-white opacity-80">
              Discover how papers connect through citations
            </p>
            <div className="mt-4 flex items-center text-white text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
              Start Exploring
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Project Workspace - Greyed out (current location) */}
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 text-left opacity-60 cursor-not-allowed">
            <div className="absolute top-4 right-4 text-gray-500 opacity-50">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="mb-3">
              <span className="inline-block px-2 py-1 bg-gray-700 rounded text-xs font-semibold text-gray-400 mb-2">
                Current
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">Project Workspace</h3>
            <p className="text-sm text-gray-500">
              Organize & work on your research
            </p>
          </div>

          {/* My Collections - Green to Emerald gradient with dynamic count */}
          <button
            onClick={() => router.push('/collections')}
            className="group relative bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30"
          >
            <div className="absolute top-4 right-4 text-white opacity-40 group-hover:opacity-70 transition-opacity">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="mb-3">
              <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                Organize
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">My Collections</h3>
            <p className="text-sm text-white opacity-80">
              {collectionsCount} {collectionsCount === 1 ? 'collection' : 'collections'}
            </p>
            <div className="mt-4 flex items-center text-white text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
              View Collections
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Start with a paper - Search Bar */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">📄</span>
          Start with a paper
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Search by title, DOI, or keywords to begin exploring the research network
        </p>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, DOI, or keywords..."
            className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Search
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Use the Network Explorer to visualize paper connections, or browse through your collections
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          Quick Actions
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Common tasks to accelerate your research workflow
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Add Note - Green gradient matching Collections */}
          <button
            onClick={onAddNote}
            className="group bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-lg p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Add Note</h4>
                <p className="text-sm text-white opacity-80">Quick note or observation</p>
              </div>
            </div>
          </button>

          {/* New Report - Blue gradient matching Projects */}
          <button
            onClick={onNewReport}
            className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 rounded-lg p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">New Report</h4>
                <p className="text-sm text-white opacity-80">Create a detailed research report</p>
              </div>
            </div>
          </button>

          {/* AI Deep Dive - Purple gradient matching Network/AI */}
          <button
            onClick={onDeepDive}
            className="group bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 rounded-lg p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white group-hover:bg-white/30 group-hover:scale-110 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">AI Deep Dive</h4>
                <p className="text-sm text-white opacity-80">Semantic analysis with deep insights</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

