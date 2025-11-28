'use client';

import React, { Suspense } from 'react';
import { useNewDiscoverPage, useErythosTheme } from '@/contexts/FeatureFlagsContext';
import { ErythosDiscoverPage, ErythosHeader } from '@/components/erythos';

// Legacy discover page placeholder - the old discover page was the SemanticDiscoveryInterface
// which is now integrated into the new Erythos Discover page
function LegacyDiscoverPage() {
  return (
    <div className="min-h-screen bg-[var(--spotify-black)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-4">Discover</h1>
        <p className="text-gray-400 mb-8">
          The legacy discover page. Enable ENABLE_NEW_DISCOVER_PAGE=true to see the new Erythos Discover page.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a 
            href="/search" 
            className="p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="text-3xl mb-3">🔍</div>
            <h2 className="text-xl font-semibold mb-2">Search Papers</h2>
            <p className="text-gray-400">Search PubMed for research papers</p>
          </a>
          
          <a 
            href="/dashboard" 
            className="p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="text-3xl mb-3">📂</div>
            <h2 className="text-xl font-semibold mb-2">My Projects</h2>
            <p className="text-gray-400">View your research projects</p>
          </a>
        </div>
      </div>
    </div>
  );
}

function DiscoverPageContent() {
  const enableNewDiscoverPage = useNewDiscoverPage();
  const enableErythosTheme = useErythosTheme();

  // Feature flag: show new Erythos Discover page
  if (enableNewDiscoverPage) {
    return (
      <>
        {enableErythosTheme && <ErythosHeader />}
        <ErythosDiscoverPage />
      </>
    );
  }

  // Legacy discover page
  return <LegacyDiscoverPage />;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <DiscoverPageContent />
    </Suspense>
  );
}

