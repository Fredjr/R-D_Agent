'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

export interface AsyncJobProgressProps {
  jobId: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  onCancel?: () => void;
  onReset?: () => void;
  jobType?: string;
  className?: string;
}

export function AsyncJobProgress({
  jobId,
  status,
  progress,
  error,
  startedAt,
  completedAt,
  onCancel,
  onReset,
  jobType = 'Job',
  className = ''
}: AsyncJobProgressProps) {
  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {status === 'processing' && (
              <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
            )}
            {status === 'completed' && (
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            )}
            {status === 'failed' && (
              <XCircleIcon className="h-5 w-5 text-red-600" />
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {jobType} {status === 'processing' ? 'Processing' : status === 'completed' ? 'Completed' : 'Failed'}
              </h4>
              {jobId && (
                <span className="text-xs text-gray-500 font-mono">
                  ID: {jobId.slice(0, 8)}...
                </span>
              )}
            </div>

            {/* Progress/Status Message */}
            {progress && (
              <p className="text-sm text-gray-600 mt-1">{progress}</p>
            )}

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}

            {/* Timing Info */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              {startedAt && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>
                    Started: {startedAt.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              {startedAt && (
                <span>
                  Duration: {formatDuration(startedAt, completedAt || undefined)}
                </span>
              )}
            </div>

            {/* Persistence Notice */}
            {status === 'processing' && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <div className="flex items-center space-x-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  <span>
                    This job will continue running even if you close your browser. 
                    You can return later to check the results.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {status === 'processing' && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Cancel
            </Button>
          )}
          
          {(status === 'completed' || status === 'failed') && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar for Processing */}
      {status === 'processing' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AsyncJobProgress;
