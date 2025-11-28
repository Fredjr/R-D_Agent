'use client';

import React, { Suspense } from 'react';
import { useErythosTheme } from '@/contexts/FeatureFlagsContext';
import { ErythosHeader } from '@/components/erythos';
import { ErythosWritePage } from '@/components/erythos/write/ErythosWritePage';

function WritePageContent() {
  const enableErythosTheme = useErythosTheme();

  return (
    <>
      {enableErythosTheme && <ErythosHeader />}
      <ErythosWritePage />
    </>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}

