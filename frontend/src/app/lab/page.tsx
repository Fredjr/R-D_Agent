'use client';

import React, { Suspense } from 'react';
import { useNewLabPage, useErythosTheme } from '@/contexts/FeatureFlagsContext';
import { ErythosLabPage, ErythosHeader } from '@/components/erythos';

// Legacy Lab page placeholder
function LegacyLabPage() {
  return (
    <div className="min-h-screen bg-[var(--spotify-black)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-4">🧪 Lab</h1>
        <p className="text-gray-400 mb-8">
          The legacy Lab page. Enable ENABLE_NEW_LAB_PAGE=true to see the new Erythos Lab page.
        </p>
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Lab features are currently available within Project Workspace → Lab tab
          </p>
        </div>
      </div>
    </div>
  );
}

function LabPageContent() {
  const useNewLab = useNewLabPage();
  const useErythos = useErythosTheme();

  if (useNewLab) {
    return (
      <>
        {useErythos && <ErythosHeader />}
        <Suspense fallback={
          <div className="min-h-screen bg-[#121212] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        }>
          <ErythosLabPage />
        </Suspense>
      </>
    );
  }

  return <LegacyLabPage />;
}

export default function LabPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <LabPageContent />
    </Suspense>
  );
}

