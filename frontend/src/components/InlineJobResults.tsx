'use client';

import React from 'react';

interface InlineJobResultsProps {
  jobType: 'review' | 'deep-dive';
  jobStatus: 'idle' | 'processing' | 'completed' | 'failed';
  result: any;
  onClose: () => void;
  onViewFullResults: () => void;
}

export default function InlineJobResults({ 
  jobType, 
  jobStatus, 
  result, 
  onClose, 
  onViewFullResults 
}: InlineJobResultsProps) {
  if (jobStatus !== 'completed' || !result) {
    return null;
  }

  const isReview = jobType === 'review';
  const title = isReview ? 'Generate Review Results' : 'Deep Dive Results';
  const results = isReview ? result.results : result.sections;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              {isReview ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Analysis completed successfully</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isReview ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                <p className="text-blue-800 text-sm">
                  Found {results?.length || 0} key findings from the literature review.
                </p>
              </div>
              
              {results?.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Finding {index + 1}
                  </h5>
                  <p className="text-gray-700 text-sm mb-2">
                    {item.content || item.summary || 'Analysis result available'}
                  </p>
                  {item.confidence && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${item.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(item.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              ))}
              
              {results?.length > 3 && (
                <div className="text-center">
                  <p className="text-gray-500 text-sm">
                    And {results.length - 3} more findings...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Deep Dive Analysis</h4>
                <p className="text-purple-800 text-sm">
                  Comprehensive analysis completed with detailed insights.
                </p>
              </div>
              
              {results?.slice(0, 2).map((section: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {section.title || `Section ${index + 1}`}
                  </h5>
                  <p className="text-gray-700 text-sm">
                    {section.content || section.summary || 'Detailed analysis available'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Results are automatically saved to your project
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onViewFullResults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Full Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
