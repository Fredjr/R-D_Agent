'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface ArticleSummaryModalProps {
  pmid: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
  className?: string;
}

interface SummaryData {
  summary: string;
  cached: boolean;
  generated_at: string;
  model: string;
  version: number;
}

export function ArticleSummaryModal({
  pmid,
  title,
  isOpen,
  onClose,
  onViewDetails,
  className
}: ArticleSummaryModalProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pmid) {
      fetchSummary();
    } else {
      // Reset state when modal closes
      setSummary(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, pmid]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Fetching summary for PMID: ${pmid}`);
      
      const response = await fetch(`/api/proxy/articles/${pmid}/summary`, {
        headers: {
          'User-ID': 'current_user', // TODO: Get from auth context
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch summary');
      }

      const data: SummaryData = await response.json();
      console.log(`✅ Summary fetched for PMID ${pmid}:`, data.cached ? 'CACHED' : 'GENERATED');
      
      setSummary(data);
    } catch (err: any) {
      console.error(`❌ Error fetching summary for ${pmid}:`, err);
      setError(err.message || 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleViewDetails = () => {
    onClose();
    onViewDetails?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all',
          'animate-scaleIn',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 pr-4 line-clamp-2 flex-1">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close summary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <span className="text-sm text-gray-600">Generating summary...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Summary Unavailable
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {error}
                  </p>
                  {error.includes('abstract') && (
                    <p className="text-sm text-gray-500 mt-2">
                      You can still view the full article details in the sidebar or visit the publisher's website.
                    </p>
                  )}
                </div>
              </div>

              {onViewDetails && (
                <button
                  onClick={handleViewDetails}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  View Full Details in Sidebar
                </button>
              )}
            </div>
          )}

          {/* Success State */}
          {summary && !loading && !error && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl flex-shrink-0">🤖</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    AI Summary
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.summary}
                  </p>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {summary.cached && (
                  <span className="flex items-center">
                    <span className="text-green-600 mr-1">✓</span>
                    Cached
                  </span>
                )}
                <span>•</span>
                <span>Generated by {summary.model}</span>
              </div>

              {/* Actions */}
              {onViewDetails && (
                <button
                  onClick={handleViewDetails}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View Full Details in Sidebar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 200ms ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 200ms ease-out;
        }
      `}</style>
    </div>
  );
}

export default ArticleSummaryModal;

