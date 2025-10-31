/**
 * useAnnotations Hook
 * React hook for managing annotations with contextual notes support
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createAnnotation,
  getAnnotations,
  updateAnnotation,
  getAnnotationThread,
  getAnnotationThreads,
  type Annotation,
  type CreateAnnotationRequest,
  type UpdateAnnotationRequest,
  type AnnotationFilters,
  type AnnotationThread,
  AnnotationAPIError,
} from '../lib/api/annotations';

interface UseAnnotationsOptions {
  projectId: string;
  userId?: string;
  autoFetch?: boolean;
  filters?: AnnotationFilters;
}

interface UseAnnotationsReturn {
  // State
  annotations: Annotation[];
  threads: AnnotationThread[];
  loading: boolean;
  error: string | null;
  
  // Actions
  create: (data: CreateAnnotationRequest) => Promise<Annotation>;
  update: (annotationId: string, data: UpdateAnnotationRequest) => Promise<Annotation>;
  fetch: (filters?: AnnotationFilters) => Promise<void>;
  fetchThread: (annotationId: string) => Promise<AnnotationThread>;
  fetchThreads: (filters?: AnnotationFilters) => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useAnnotations(options: UseAnnotationsOptions): UseAnnotationsReturn {
  const { projectId, userId, autoFetch = true, filters: initialFilters } = options;

  // State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [threads, setThreads] = useState<AnnotationThread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Store initial filters in ref to avoid infinite re-renders
  const initialFiltersRef = useRef(initialFilters);

  // Update ref when filters change (but don't trigger re-fetch)
  useEffect(() => {
    initialFiltersRef.current = initialFilters;
  }, [initialFilters]);

  // Fetch annotations
  const fetch = useCallback(async (filters?: AnnotationFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching annotations for project:', projectId, 'with filters:', filters);
      const response = await getAnnotations(projectId, filters, userId);
      console.log('✅ Annotations fetched:', response.annotations.length, 'annotations');
      setAnnotations(response.annotations);
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError
        ? err.message
        : 'Failed to fetch annotations';
      setError(errorMessage);
      console.error('❌ Error fetching annotations:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);
  
  // Fetch threads
  const fetchThreads = useCallback(async (filters?: AnnotationFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAnnotationThreads(projectId, filters, userId);
      setThreads(response.threads);
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError 
        ? err.message 
        : 'Failed to fetch annotation threads';
      setError(errorMessage);
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);
  
  // Fetch single thread
  const fetchThread = useCallback(async (annotationId: string): Promise<AnnotationThread> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAnnotationThread(projectId, annotationId, userId);
      return response.thread;
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError 
        ? err.message 
        : 'Failed to fetch annotation thread';
      setError(errorMessage);
      console.error('Error fetching thread:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);
  
  // Create annotation
  const create = useCallback(async (data: CreateAnnotationRequest): Promise<Annotation> => {
    setLoading(true);
    setError(null);
    
    try {
      const newAnnotation = await createAnnotation(projectId, data, userId);
      
      // Optimistically update local state
      setAnnotations(prev => [newAnnotation, ...prev]);
      
      return newAnnotation;
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError 
        ? err.message 
        : 'Failed to create annotation';
      setError(errorMessage);
      console.error('Error creating annotation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);
  
  // Update annotation
  const update = useCallback(async (
    annotationId: string, 
    data: UpdateAnnotationRequest
  ): Promise<Annotation> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedAnnotation = await updateAnnotation(projectId, annotationId, data, userId);
      
      // Optimistically update local state
      setAnnotations(prev => 
        prev.map(ann => 
          ann.annotation_id === annotationId ? updatedAnnotation : ann
        )
      );
      
      return updatedAnnotation;
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError 
        ? err.message 
        : 'Failed to update annotation';
      setError(errorMessage);
      console.error('Error updating annotation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Refresh (re-fetch with current filters)
  const refresh = useCallback(async () => {
    await fetch(initialFiltersRef.current);
  }, [fetch]);

  // Auto-fetch on mount only (not on every filter change)
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (autoFetch && !hasFetchedRef.current) {
      console.log('🚀 Auto-fetching annotations on mount');
      hasFetchedRef.current = true;
      fetch(initialFiltersRef.current);
    }
  }, [autoFetch, fetch]);
  
  return {
    // State
    annotations,
    threads,
    loading,
    error,
    
    // Actions
    create,
    update,
    fetch,
    fetchThread,
    fetchThreads,
    clearError,
    refresh,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for managing a single annotation thread
 */
export function useAnnotationThread(
  projectId: string,
  annotationId: string,
  userId?: string
) {
  const [thread, setThread] = useState<AnnotationThread | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAnnotationThread(projectId, annotationId, userId);
      setThread(response.thread);
    } catch (err) {
      const errorMessage = err instanceof AnnotationAPIError 
        ? err.message 
        : 'Failed to fetch annotation thread';
      setError(errorMessage);
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, annotationId, userId]);
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  return {
    thread,
    loading,
    error,
    refresh: fetch,
  };
}

/**
 * Hook for filtering annotations
 */
export function useAnnotationFilters(initialFilters?: AnnotationFilters) {
  const [filters, setFilters] = useState<AnnotationFilters>(initialFilters || {});
  
  const updateFilter = useCallback((key: keyof AnnotationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  const removeFilter = useCallback((key: keyof AnnotationFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  return {
    filters,
    updateFilter,
    clearFilters,
    removeFilter,
    setFilters,
  };
}

