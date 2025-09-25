/**
 * Phase 2A.2: Semantic Analysis Test Component
 * Test component to verify the useSemanticAnalysis hook works correctly
 */

'use client';

import React, { useEffect } from 'react';
import { useSemanticAnalysis } from '@/hooks/useSemanticAnalysis';

export default function SemanticAnalysisTest() {
  const {
    analyzePaper,
    getServiceStatus,
    initializeService,
    runTestAnalysis,
    isLoading,
    error,
    lastAnalysis,
    serviceStatus,
    clearError,
    isServiceReady,
  } = useSemanticAnalysis();

  // Get service status on component mount
  useEffect(() => {
    getServiceStatus();
  }, [getServiceStatus]);

  const handleTestAnalysis = async () => {
    const testPaper = {
      title: "Machine Learning Applications in Drug Discovery",
      abstract: "This study presents novel machine learning approaches for drug discovery, including deep neural networks for molecular property prediction and reinforcement learning for compound optimization. Our experimental validation demonstrates significant improvements in hit identification and lead optimization processes.",
      pmid: "frontend_test_001"
    };

    await analyzePaper(testPaper);
  };

  const handleRunBuiltInTest = async () => {
    await runTestAnalysis();
  };

  const handleInitializeService = async () => {
    await initializeService();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧠 Semantic Analysis Test</h2>
      
      {/* Service Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Service Status</h3>
        {serviceStatus ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isServiceReady ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="font-medium">
                {serviceStatus.service_name} v{serviceStatus.version}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Available: {serviceStatus.is_available ? '✅' : '❌'} | 
              Initialized: {serviceStatus.is_initialized ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">
              Models: SciBERT {serviceStatus.models.scibert_available ? '✅' : '❌'} | 
              Transformers {serviceStatus.models.sentence_transformer_available ? '✅' : '❌'} | 
              spaCy {serviceStatus.models.spacy_available ? '✅' : '❌'}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading service status...</div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={getServiceStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Check Status'}
        </button>
        
        <button
          onClick={handleInitializeService}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Initialize Service'}
        </button>
        
        <button
          onClick={handleRunBuiltInTest}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Run Built-in Test'}
        </button>
        
        <button
          onClick={handleTestAnalysis}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Test Paper Analysis'}
        </button>
      </div>

      {/* Analysis Results */}
      {lastAnalysis && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-green-800">✅ Analysis Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Methodology:</strong> {lastAnalysis.methodology}
            </div>
            <div>
              <strong>Complexity Score:</strong> {lastAnalysis.complexity_score.toFixed(3)}
            </div>
            <div>
              <strong>Novelty Type:</strong> {lastAnalysis.novelty_type}
            </div>
            <div>
              <strong>Research Domains:</strong> {lastAnalysis.research_domains.join(', ')}
            </div>
            <div className="md:col-span-2">
              <strong>Technical Terms:</strong> {lastAnalysis.technical_terms.join(', ')}
            </div>
            <div>
              <strong>Analysis Time:</strong> {lastAnalysis.analysis_metadata.analysis_time_seconds?.toFixed(3)}s
            </div>
            <div>
              <strong>Embedding Dimensions:</strong> {lastAnalysis.embedding_dimensions}
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Processing semantic analysis...</p>
        </div>
      )}
    </div>
  );
}
