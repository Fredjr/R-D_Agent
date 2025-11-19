'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QuestionMarkCircleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface ResearchStats {
  questionsCount: number;
  hypothesesCount: number;
  evidenceCount: number;
  answeredCount: number;
  unansweredCount: number;
}

interface EnhancedDiscoverSectionProps {
  projectId: string;
  collectionsCount: number;
  researchStats?: ResearchStats;
  onAddNote: () => void;
  onNewReport: () => void;
  onDeepDive: () => void;
  onAddQuestion?: () => void;
  onAddHypothesis?: () => void;
}

export default function EnhancedDiscoverSection({
  projectId,
  collectionsCount,
  researchStats,
  onAddNote,
  onNewReport,
  onDeepDive,
  onAddQuestion,
  onAddHypothesis
}: EnhancedDiscoverSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&projectId=${projectId}`);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Research Context Boxes */}
      {researchStats && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Research Progress
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Track your research questions, hypotheses, and evidence
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Unanswered Questions - Red/Orange gradient */}
            <button
              onClick={onAddQuestion}
              className="group relative bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/30"
            >
              <div className="absolute top-4 right-4 text-white opacity-40 group-hover:opacity-70 transition-opacity">
                <QuestionMarkCircleIcon className="w-8 h-8" />
              </div>
              <div className="mb-3">
                {researchStats.unansweredCount > 0 && (
                  <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                    {researchStats.unansweredCount} Unanswered
                  </span>
                )}
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{researchStats.questionsCount}</h3>
              <p className="text-sm text-white opacity-80">
                Research Questions
              </p>
              <div className="mt-4 flex items-center text-white text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                {researchStats.questionsCount === 0 ? 'Add Question' : 'View Questions'}
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Hypotheses - Purple gradient */}
            <button
              onClick={onAddHypothesis}
              className="group relative bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <div className="absolute top-4 right-4 text-white opacity-40 group-hover:opacity-70 transition-opacity">
                <LightBulbIcon className="w-8 h-8" />
              </div>
              <div className="mb-3">
                <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                  Active
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{researchStats.hypothesesCount}</h3>
              <p className="text-sm text-white opacity-80">
                Hypotheses
              </p>
              <div className="mt-4 flex items-center text-white text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                {researchStats.hypothesesCount === 0 ? 'Add Hypothesis' : 'View Hypotheses'}
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Evidence - Blue gradient */}
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-left">
              <div className="absolute top-4 right-4 text-white opacity-40">
                <DocumentTextIcon className="w-8 h-8" />
              </div>
              <div className="mb-3">
                <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                  Linked
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{researchStats.evidenceCount}</h3>
              <p className="text-sm text-white opacity-80">
                Evidence Links
              </p>
            </div>

            {/* Collections - Green gradient */}
            <button
              onClick={() => router.push(`/project/${projectId}?tab=collections`)}
              className="group relative bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30"
            >
              <div className="absolute top-4 right-4 text-white opacity-40 group-hover:opacity-70 transition-opacity">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="mb-3">
                <span className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-semibold text-white mb-2">
                  Organized
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{collectionsCount}</h3>
              <p className="text-sm text-white opacity-80">
                Collections
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
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Add Note */}
          <button
            onClick={onAddNote}
            className="group bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-border-gray)] rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] border border-[var(--spotify-border-gray)]"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-white">Add Note</h3>
            </div>
            <p className="text-sm text-gray-400">
              Capture insights and ideas
            </p>
          </button>

          {/* Generate Report */}
          <button
            onClick={onNewReport}
            className="group bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-border-gray)] rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] border border-[var(--spotify-border-gray)]"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-white">Generate Report</h3>
            </div>
            <p className="text-sm text-gray-400">
              Create analysis reports
            </p>
          </button>

          {/* Deep Dive */}
          <button
            onClick={onDeepDive}
            className="group bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-border-gray)] rounded-xl p-6 text-left transition-all duration-300 hover:scale-[1.02] border border-[var(--spotify-border-gray)]"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-lg font-bold text-white">Deep Dive</h3>
            </div>
            <p className="text-sm text-gray-400">
              Explore research in depth
            </p>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Search Literature
        </h2>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for papers, authors, topics..."
            className="w-full px-6 py-4 bg-[var(--spotify-dark-gray)] text-white rounded-full border border-[var(--spotify-border-gray)] focus:border-[var(--spotify-green)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]/20 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[var(--spotify-green)] text-black font-semibold rounded-full hover:scale-105 transition-transform"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}

