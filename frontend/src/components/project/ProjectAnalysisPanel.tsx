/**
 * PROJECT ANALYSIS PANEL v1.0
 * 
 * Main analysis panel for project workspace
 * Integrates all PhD-enhanced endpoints with proper data display
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, DocumentTextIcon, AcademicCapIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface AnalysisResult {
  id: string;
  type: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  timestamp?: Date;
}

interface ProjectAnalysisPanelProps {
  projectId: string;
  userId: string;
}

export default function ProjectAnalysisPanel({ projectId, userId }: ProjectAnalysisPanelProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([
    { id: 'thesis-generator', type: 'Thesis Chapter Generator', status: 'idle' },
    { id: 'gap-analysis', type: 'Literature Gap Analysis', status: 'idle' },
    { id: 'methodology', type: 'Methodology Synthesis', status: 'idle' },
    { id: 'comprehensive', type: 'Comprehensive Analysis', status: 'idle' }
  ]);

  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const runAnalysis = async (analysisId: string) => {
    setAnalyses(prev => prev.map(a => 
      a.id === analysisId ? { ...a, status: 'loading' as const } : a
    ));

    try {
      let endpoint = '';
      let payload = {};

      switch (analysisId) {
        case 'thesis-generator':
          endpoint = '/api/proxy/thesis-chapter-generator';
          payload = {
            project_id: projectId,
            objective: 'Generate comprehensive thesis structure',
            chapter_focus: 'comprehensive',
            academic_level: 'phd'
          };
          break;
        case 'gap-analysis':
          endpoint = '/api/proxy/literature-gap-analysis';
          payload = {
            project_id: projectId,
            objective: 'Identify comprehensive research gaps',
            gap_types: ['theoretical', 'methodological', 'empirical'],
            academic_level: 'phd'
          };
          break;
        case 'methodology':
          endpoint = '/api/proxy/methodology-synthesis';
          payload = {
            project_id: projectId,
            objective: 'Synthesize research methodologies',
            methodology_types: ['experimental', 'observational', 'computational'],
            academic_level: 'phd'
          };
          break;
        case 'comprehensive':
          endpoint = '/api/proxy/generate-summary';
          payload = {
            project_id: projectId,
            objective: 'Generate comprehensive project summary',
            summary_type: 'comprehensive',
            academic_level: 'phd',
            include_methodology: true,
            include_gaps: true
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setAnalyses(prev => prev.map(a => 
          a.id === analysisId ? { 
            ...a, 
            status: 'success' as const, 
            data, 
            timestamp: new Date() 
          } : a
        ));
      } else {
        throw new Error(data.detail || 'Analysis failed');
      }
    } catch (error) {
      setAnalyses(prev => prev.map(a => 
        a.id === analysisId ? { 
          ...a, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } : a
      ));
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'Thesis Chapter Generator': return <DocumentTextIcon className="w-5 h-5" />;
      case 'Literature Gap Analysis': return <ChartBarIcon className="w-5 h-5" />;
      case 'Methodology Synthesis': return <BeakerIcon className="w-5 h-5" />;
      case 'Comprehensive Analysis': return <AcademicCapIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const renderAnalysisResult = (analysis: AnalysisResult) => {
    if (!analysis.data) return null;

    return (
      <div className="analysis-result-display" data-testid="result-container">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="result-header mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{analysis.type} Results</h3>
            {analysis.data.quality_score && (
              <div className="quality-score mt-2" data-testid="quality-score">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Quality: {analysis.data.quality_score}/10
                </span>
              </div>
            )}
          </div>
          
          <div className="result-content space-y-4" data-testid="result-content">
            {/* Summary Content */}
            {analysis.data.summary_content && (
              <div className="summary-section" data-testid="summary-section">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700 text-sm">{analysis.data.summary_content}</p>
              </div>
            )}
            
            {/* Chapters */}
            {analysis.data.chapters && (
              <div className="chapters-section" data-testid="chapters-section">
                <h4 className="font-medium text-gray-900 mb-2">
                  Chapters ({analysis.data.chapters.length})
                </h4>
                <ul className="space-y-1">
                  {analysis.data.chapters.slice(0, 5).map((chapter: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {chapter.title || `Chapter ${index + 1}`}
                    </li>
                  ))}
                  {analysis.data.chapters.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ... and {analysis.data.chapters.length - 5} more chapters
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Research Gaps */}
            {analysis.data.identified_gaps && (
              <div className="gaps-section" data-testid="gaps-section">
                <h4 className="font-medium text-gray-900 mb-2">
                  Research Gaps ({analysis.data.identified_gaps.length})
                </h4>
                <ul className="space-y-1">
                  {analysis.data.identified_gaps.slice(0, 3).map((gap: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {gap.description || gap}
                    </li>
                  ))}
                  {analysis.data.identified_gaps.length > 3 && (
                    <li className="text-sm text-gray-500">
                      ... and {analysis.data.identified_gaps.length - 3} more gaps
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Methodologies */}
            {analysis.data.identified_methodologies && (
              <div className="methodologies-section" data-testid="methodologies-section">
                <h4 className="font-medium text-gray-900 mb-2">
                  Methodologies ({analysis.data.identified_methodologies.length})
                </h4>
                <ul className="space-y-1">
                  {analysis.data.identified_methodologies.slice(0, 3).map((method: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {method.name || method}
                    </li>
                  ))}
                  {analysis.data.identified_methodologies.length > 3 && (
                    <li className="text-sm text-gray-500">
                      ... and {analysis.data.identified_methodologies.length - 3} more methodologies
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Processing Time */}
            {analysis.data.processing_time && (
              <div className="processing-time mt-4" data-testid="processing-time">
                <small className="text-gray-500">
                  Processing Time: {analysis.data.processing_time}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analysis-panel" data-testid="analysis-panel">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">PhD-Enhanced Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            Run comprehensive analyses on your research project
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className={`analysis-card border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedAnalysis === analysis.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAnalysis(analysis.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getAnalysisIcon(analysis.type)}
                    <span className="font-medium text-gray-900">{analysis.type}</span>
                  </div>
                  <div className={`status-indicator w-3 h-3 rounded-full ${
                    analysis.status === 'success' ? 'bg-green-500' :
                    analysis.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                    analysis.status === 'error' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`} />
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runAnalysis(analysis.id);
                  }}
                  disabled={analysis.status === 'loading'}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    analysis.status === 'loading'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  data-testid="submit-button"
                >
                  {analysis.status === 'loading' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" data-testid="loading-spinner" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    `Run ${analysis.type}`
                  )}
                </button>
                
                {analysis.status === 'error' && (
                  <div className="error-display mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700" data-testid="error-display">
                    Error: {analysis.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Results Display */}
          {selectedAnalysis && (
            <div className="results-section">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h3>
              {(() => {
                const analysis = analyses.find(a => a.id === selectedAnalysis);
                if (!analysis) return null;
                
                if (analysis.status === 'success' && analysis.data) {
                  return renderAnalysisResult(analysis);
                } else if (analysis.status === 'loading') {
                  return (
                    <div className="loading-skeleton p-6 bg-gray-50 rounded-lg" data-testid="loading-skeleton">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  );
                } else if (analysis.status === 'error') {
                  return (
                    <div className="error-display p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-display">
                      <h4 className="font-medium text-red-900">Analysis Failed</h4>
                      <p className="text-red-700 mt-1">{analysis.error}</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="empty-state p-6 text-center text-gray-500">
                      <p>Click "Run Analysis" to start</p>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
