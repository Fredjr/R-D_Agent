/**
 * Phase 2A.2: Semantic Analysis Test Page
 * Test page to verify the semantic analysis hook and backend integration
 */

'use client';

import React from 'react';
import SemanticAnalysisTest from '@/components/SemanticAnalysisTest';

export default function TestSemanticPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧠 Semantic Analysis Testing
          </h1>
          <p className="text-gray-600">
            Phase 2A.2: Testing semantic analysis hook and backend integration
          </p>
        </div>
        
        <SemanticAnalysisTest />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This page tests the semantic analysis functionality before integrating it into the main app.</p>
          <p>Backend: {process.env.NODE_ENV === 'production' ? 'Production (Railway)' : 'Local Development'}</p>
        </div>
      </div>
    </div>
  );
}
