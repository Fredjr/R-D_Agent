/**
 * Background Job Manager Component
 * Handles starting background jobs and managing their lifecycle
 */

import React, { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface BackgroundJobManagerProps {
  onJobStarted?: (jobId: string) => void;
  onJobCompleted?: (jobId: string, resultData: any) => void;
  className?: string;
}

export function BackgroundJobManager({ 
  onJobStarted, 
  onJobCompleted, 
  className = '' 
}: BackgroundJobManagerProps) {
  const { user } = useUser();
  const [activeJobs, setActiveJobs] = useState<Map<string, {
    id: string;
    type: 'generate_review' | 'deep_dive';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startTime: Date;
    title: string;
  }>>(new Map());

  const startBackgroundJob = useCallback(async (
    type: 'generate_review' | 'deep_dive',
    params: any,
    title: string
  ): Promise<string | null> => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.error('User not authenticated');
      return null;
    }

    try {
      const endpoint = type === 'generate_review' 
        ? '/api/proxy/background-jobs/generate-review'
        : '/api/proxy/background-jobs/deep-dive';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.emailAddresses[0].emailAddress
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed to start ${type} job`);
      }

      const data = await response.json();
      
      if (data.success) {
        const jobId = data.job_id;
        
        // Add to active jobs
        setActiveJobs(prev => new Map(prev.set(jobId, {
          id: jobId,
          type,
          status: 'pending',
          progress: 0,
          startTime: new Date(),
          title
        })));

        // Notify parent component
        onJobStarted?.(jobId);

        // Start polling for status updates
        pollJobStatus(jobId);

        return jobId;
      } else {
        throw new Error(data.message || 'Failed to start job');
      }
    } catch (error) {
      console.error(`Failed to start ${type} job:`, error);
      return null;
    }
  }, [user, onJobStarted]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) return;

    const poll = async () => {
      try {
        const response = await fetch(`/api/proxy/background-jobs/${jobId}/status`, {
          headers: {
            'User-ID': user.emailAddresses[0].emailAddress
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          setActiveJobs(prev => {
            const updated = new Map(prev);
            const job = updated.get(jobId);
            if (job) {
              updated.set(jobId, {
                ...job,
                status: data.status,
                progress: data.progress || 0
              });
            }
            return updated;
          });

          // If job is completed or failed, stop polling
          if (data.status === 'completed') {
            onJobCompleted?.(jobId, data.result_data);
            
            // Remove from active jobs after a delay
            setTimeout(() => {
              setActiveJobs(prev => {
                const updated = new Map(prev);
                updated.delete(jobId);
                return updated;
              });
            }, 5000);
            
            return;
          } else if (data.status === 'failed') {
            // Remove failed job after a delay
            setTimeout(() => {
              setActiveJobs(prev => {
                const updated = new Map(prev);
                updated.delete(jobId);
                return updated;
              });
            }, 10000);
            
            return;
          }

          // Continue polling if job is still running
          if (data.status === 'pending' || data.status === 'processing') {
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
        // Retry after a longer delay
        setTimeout(poll, 5000);
      }
    };

    poll();
  }, [user, onJobCompleted]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  };

  // Helper functions for starting specific job types
  const startGenerateReviewJob = useCallback(async (params: {
    molecule: string;
    objective: string;
    project_id?: string;
    max_results?: number;
  }) => {
    return await startBackgroundJob('generate_review', params, `Review: ${params.molecule}`);
  }, [startBackgroundJob]);

  const startDeepDiveJob = useCallback(async (params: {
    pmid: string;
    article_title: string;
    project_id?: string;
  }) => {
    return await startBackgroundJob('deep_dive', params, `Deep Dive: ${params.article_title}`);
  }, [startBackgroundJob]);

  return (
    <div className={className}>
      {/* Active Jobs Display */}
      {activeJobs.size > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Background Processing ({activeJobs.size})
          </h3>
          
          <div className="space-y-3">
            {Array.from(activeJobs.values()).map((job) => (
              <div key={job.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(job.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.title}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDuration(job.startTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-600">
                      {getStatusText(job.status)}
                      {job.type === 'generate_review' ? ' • Review' : ' • Deep Dive'}
                    </p>
                    
                    {job.progress > 0 && (
                      <span className="text-xs text-gray-500">
                        {job.progress}%
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {job.status === 'processing' && job.progress > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export helper functions for use in other components
export { BackgroundJobManager };

// Hook for easy access to background job functionality
export function useBackgroundJobs() {
  const { user } = useUser();

  const startGenerateReview = useCallback(async (params: {
    molecule: string;
    objective: string;
    project_id?: string;
    max_results?: number;
  }) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/proxy/background-jobs/generate-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': user.emailAddresses[0].emailAddress
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Failed to start generate review job');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to start job');
    }

    return data.job_id;
  }, [user]);

  const startDeepDive = useCallback(async (params: {
    pmid: string;
    article_title: string;
    project_id?: string;
  }) => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/proxy/background-jobs/deep-dive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': user.emailAddresses[0].emailAddress
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Failed to start deep dive job');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to start job');
    }

    return data.job_id;
  }, [user]);

  return {
    startGenerateReview,
    startDeepDive
  };
}
