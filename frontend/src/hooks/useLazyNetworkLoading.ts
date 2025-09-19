import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkNode {
  id: string;
  data: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    node_type: string;
    abstract?: string;
    url?: string;
  };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata?: {
    total_nodes: number;
    total_edges: number;
    source: string;
    network_type: string;
  };
}

interface LazyLoadingState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadedCount: number;
  totalCount: number;
  loadingProgress: number;
}

interface LazyLoadingOptions {
  batchSize: number;
  initialLoad: number;
  loadThreshold: number; // Load more when this many nodes are visible
  maxNodes: number; // Maximum nodes to load
}

const DEFAULT_OPTIONS: LazyLoadingOptions = {
  batchSize: 20,
  initialLoad: 50,
  loadThreshold: 10,
  maxNodes: 200
};

export function useLazyNetworkLoading(
  fetchFunction: (offset: number, limit: number) => Promise<NetworkData>,
  options: Partial<LazyLoadingOptions> = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<LazyLoadingState>({
    nodes: [],
    edges: [],
    isLoading: false,
    hasMore: true,
    error: null,
    loadedCount: 0,
    totalCount: 0,
    loadingProgress: 0
  });

  const loadingRef = useRef(false);
  const offsetRef = useRef(0);
  const totalCountRef = useRef(0);

  const loadBatch = useCallback(async (offset: number, limit: number) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`🔄 Loading network batch: offset=${offset}, limit=${limit}`);
      const data = await fetchFunction(offset, limit);
      
      // Update total count from metadata
      if (data.metadata?.total_nodes) {
        totalCountRef.current = Math.min(data.metadata.total_nodes, opts.maxNodes);
      }

      setState(prev => {
        const newNodes = [...prev.nodes];
        const newEdges = [...prev.edges];
        
        // Add new nodes, avoiding duplicates
        data.nodes.forEach(node => {
          if (!newNodes.find(n => n.id === node.id)) {
            newNodes.push(node);
          }
        });
        
        // Add new edges, avoiding duplicates
        data.edges.forEach(edge => {
          if (!newEdges.find(e => e.id === edge.id)) {
            newEdges.push(edge);
          }
        });

        const loadedCount = newNodes.length;
        const totalCount = totalCountRef.current || loadedCount;
        const hasMore = loadedCount < totalCount && loadedCount < opts.maxNodes;
        const loadingProgress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

        console.log(`✅ Batch loaded: ${loadedCount}/${totalCount} nodes (${loadingProgress.toFixed(1)}%)`);

        return {
          ...prev,
          nodes: newNodes,
          edges: newEdges,
          loadedCount,
          totalCount,
          hasMore,
          loadingProgress,
          isLoading: false
        };
      });

      offsetRef.current = offset + limit;
    } catch (error) {
      console.error('❌ Error loading network batch:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load network data'
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFunction, opts.maxNodes]);

  const loadMore = useCallback(() => {
    if (state.isLoading || !state.hasMore) return;
    loadBatch(offsetRef.current, opts.batchSize);
  }, [state.isLoading, state.hasMore, loadBatch, opts.batchSize]);

  const reset = useCallback(() => {
    offsetRef.current = 0;
    totalCountRef.current = 0;
    loadingRef.current = false;
    setState({
      nodes: [],
      edges: [],
      isLoading: false,
      hasMore: true,
      error: null,
      loadedCount: 0,
      totalCount: 0,
      loadingProgress: 0
    });
  }, []);

  const initialLoad = useCallback(() => {
    reset();
    loadBatch(0, opts.initialLoad);
  }, [reset, loadBatch, opts.initialLoad]);

  // Auto-load more when approaching the end of visible nodes
  const checkLoadMore = useCallback((visibleNodeCount: number) => {
    if (!state.isLoading && state.hasMore && 
        state.loadedCount - visibleNodeCount <= opts.loadThreshold) {
      loadMore();
    }
  }, [state.isLoading, state.hasMore, state.loadedCount, opts.loadThreshold, loadMore]);

  return {
    ...state,
    loadMore,
    reset,
    initialLoad,
    checkLoadMore,
    canLoadMore: !state.isLoading && state.hasMore,
    isComplete: !state.hasMore && state.loadedCount > 0
  };
}

// Hook for lazy loading with intersection observer
export function useLazyNetworkWithIntersection(
  fetchFunction: (offset: number, limit: number) => Promise<NetworkData>,
  options: Partial<LazyLoadingOptions> = {}
) {
  const lazyLoading = useLazyNetworkLoading(fetchFunction, options);
  const [intersectionTarget, setIntersectionTarget] = useState<Element | null>(null);

  useEffect(() => {
    if (!intersectionTarget || !lazyLoading.canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('🔍 Intersection detected, loading more nodes...');
          lazyLoading.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(intersectionTarget);
    return () => observer.disconnect();
  }, [intersectionTarget, lazyLoading.canLoadMore, lazyLoading.loadMore]);

  return {
    ...lazyLoading,
    setIntersectionTarget
  };
}

// Utility for chunked processing of large datasets
export function processNetworkInChunks<T>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[]) => void,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    const processChunk = () => {
      const chunk = items.slice(index, index + chunkSize);
      if (chunk.length === 0) {
        resolve();
        return;
      }

      processor(chunk);
      index += chunkSize;
      
      const progress = (index / items.length) * 100;
      onProgress?.(Math.min(progress, 100));

      // Use requestAnimationFrame to avoid blocking the UI
      requestAnimationFrame(processChunk);
    };

    processChunk();
  });
}

// Memory-efficient node filtering
export function createNodeFilter(
  searchTerm: string,
  nodeTypes: string[] = [],
  yearRange?: [number, number]
) {
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return (node: NetworkNode): boolean => {
    // Text search
    if (searchTerm && !node.data.title.toLowerCase().includes(lowerSearchTerm) &&
        !node.data.authors.some(author => author.toLowerCase().includes(lowerSearchTerm))) {
      return false;
    }

    // Node type filter
    if (nodeTypes.length > 0 && !nodeTypes.includes(node.data.node_type)) {
      return false;
    }

    // Year range filter
    if (yearRange && (node.data.year < yearRange[0] || node.data.year > yearRange[1])) {
      return false;
    }

    return true;
  };
}
