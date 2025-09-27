'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pollJobStatus } from '@/lib/api';

export interface AsyncJobState {
  jobId: string | null;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  result: any | null;
  error: string | null;
  progress: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface UseAsyncJobOptions {
  pollInterval?: number; // milliseconds
  maxPollTime?: number; // milliseconds
  onProgress?: (status: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  persistToLocalStorage?: boolean;
  storageKey?: string;
  userId?: string; // User ID for authentication
}

export function useAsyncJob(options: UseAsyncJobOptions = {}) {
  const {
    pollInterval = 10000, // 10 seconds (reduced polling frequency)
    maxPollTime = 45 * 60 * 1000, // 45 minutes (increased timeout)
    onProgress,
    onComplete,
    onError,
    persistToLocalStorage = true,
    storageKey = 'asyncJob',
    userId
  } = options;

  const [state, setState] = useState<AsyncJobState>({
    jobId: null,
    status: 'idle',
    result: null,
    error: null,
    progress: null,
    startedAt: null,
    completedAt: null,
  });

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Load job from localStorage on mount
  useEffect(() => {
    if (persistToLocalStorage && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedState = JSON.parse(saved);
          if (savedState.jobId && savedState.status === 'processing') {
            setState({
              ...savedState,
              startedAt: savedState.startedAt ? new Date(savedState.startedAt) : null,
              completedAt: savedState.completedAt ? new Date(savedState.completedAt) : null,
            });
            // Resume polling for incomplete job
            startPolling(savedState.jobId);
          }
        } catch (error) {
          console.error('Failed to load saved job state:', error);
        }
      }
    }
  }, [storageKey, persistToLocalStorage]);

  // Save job to localStorage when state changes
  useEffect(() => {
    if (persistToLocalStorage && typeof window !== 'undefined' && state.jobId) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, storageKey, persistToLocalStorage]);

  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const startPolling = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        // Check if we've exceeded max poll time
        if (startTimeRef.current && Date.now() - startTimeRef.current.getTime() > maxPollTime) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Job timed out - exceeded maximum polling time',
            completedAt: new Date(),
          }));
          if (onError) onError('Job timed out');
          return;
        }

        const jobStatus = await pollJobStatus(jobId, userId);

        // Enhanced debugging
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current.getTime() : 0;
        console.log(`🔄 [useAsyncJob] Job ${jobId} status:`, {
          status: jobStatus.status,
          created_at: jobStatus.created_at,
          elapsed_minutes: Math.round(elapsed / 60000),
          result: jobStatus.result ? 'Present' : 'Null',
          article_count: jobStatus.article_count || 'N/A'
        });

        setState(prev => ({
          ...prev,
          status: jobStatus.status as any,
          progress: `Status: ${jobStatus.status} (${Math.round(elapsed / 60000)}m)`,
        }));

        if (onProgress) {
          onProgress(jobStatus.status);
        }

        if (jobStatus.status === 'completed') {
          setState(prev => ({
            ...prev,
            status: 'completed',
            result: jobStatus.result,
            progress: 'Completed successfully',
            completedAt: new Date(),
          }));
          
          if (onComplete) onComplete(jobStatus.result);
          
          // Clear from localStorage when completed
          if (persistToLocalStorage && typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
          }
          
        } else if (jobStatus.status === 'failed') {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Job failed to complete',
            progress: 'Failed',
            completedAt: new Date(),
          }));
          
          if (onError) onError('Job failed to complete');
          
          // Clear from localStorage when failed
          if (persistToLocalStorage && typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
          }
          
        } else {
          // Still processing - check if it's been too long
          const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current.getTime() : 0;

          if (elapsed > 25 * 60 * 1000) { // 25 minutes - assume job is stuck
            console.error(`❌ [useAsyncJob] Job ${jobId} appears stuck after ${Math.round(elapsed / 60000)} minutes`);
            setState(prev => ({
              ...prev,
              status: 'failed',
              error: 'Job appears to be stuck - please try again',
              progress: 'Job timeout',
              completedAt: new Date(),
            }));

            if (onError) onError('Job appears to be stuck - please try again');

            // Clear from localStorage when failed
            if (persistToLocalStorage && typeof window !== 'undefined') {
              localStorage.removeItem(storageKey);
            }
            return;
          }

          // Schedule next poll
          pollTimeoutRef.current = setTimeout(poll, pollInterval);
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Polling failed',
          progress: 'Error occurred',
          completedAt: new Date(),
        }));
        
        if (onError) onError(error instanceof Error ? error.message : 'Polling failed');
      }
    };

    poll();
  }, [pollInterval, maxPollTime, onProgress, onComplete, onError, persistToLocalStorage, storageKey]);

  const startJob = useCallback((jobId: string) => {
    clearPollTimeout();
    startTimeRef.current = new Date();
    
    setState({
      jobId,
      status: 'processing',
      result: null,
      error: null,
      progress: 'Starting job...',
      startedAt: startTimeRef.current,
      completedAt: null,
    });

    startPolling(jobId);
  }, [startPolling, clearPollTimeout]);

  const cancelJob = useCallback(() => {
    clearPollTimeout();
    setState(prev => ({
      ...prev,
      status: 'idle',
      progress: 'Cancelled',
    }));
    
    // Clear from localStorage
    if (persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [clearPollTimeout, persistToLocalStorage, storageKey]);

  const resetJob = useCallback(() => {
    clearPollTimeout();
    setState({
      jobId: null,
      status: 'idle',
      result: null,
      error: null,
      progress: null,
      startedAt: null,
      completedAt: null,
    });
    
    // Clear from localStorage
    if (persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [clearPollTimeout, persistToLocalStorage, storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPollTimeout();
    };
  }, [clearPollTimeout]);

  return {
    ...state,
    startJob,
    cancelJob,
    resetJob,
    isProcessing: state.status === 'processing',
    isCompleted: state.status === 'completed',
    isFailed: state.status === 'failed',
    isIdle: state.status === 'idle',
  };
}
