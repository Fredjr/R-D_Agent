import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Collection {
  collection_id: string;
  collection_name: string;
  description: string;  // Match API response field name
  created_at: string;
  updated_at: string;
  article_count: number;
  project_id?: string;  // Optional since API doesn't always include it
  created_by?: string;  // Additional fields from API
  color?: string;
  icon?: string;
  sort_order?: number;
  linked_hypothesis_ids?: string[];  // Week 24: Hypothesis links
  linked_question_ids?: string[];  // Week 24: Question links
  collection_purpose?: string;  // Week 24: Collection purpose
  auto_update?: boolean;  // Week 24: Auto-update flag
}

interface CollectionSyncState {
  collections: Collection[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface CollectionUpdateEvent {
  type: 'collection_added' | 'collection_updated' | 'collection_deleted' | 'article_added' | 'article_removed';
  collectionId: string;
  projectId: string;
  data?: any;
  timestamp: number;
}

// Global state storage using localStorage for persistence
const STORAGE_KEY = 'rd_agent_collection_sync';
const SYNC_CHANNEL = 'rd_agent_collection_updates';

class CollectionSyncManager {
  private listeners: Set<(state: CollectionSyncState) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private state: CollectionSyncState = {
    collections: [],
    lastUpdated: 0,
    isLoading: false,
    error: null
  };

  constructor() {
    // Only initialize BroadcastChannel in browser environment
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL);
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this));
    }
    this.loadStateFromStorage();
  }

  private loadStateFromStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Only load if data is less than 5 minutes old
        if (Date.now() - parsedState.lastUpdated < 5 * 60 * 1000) {
          this.state = { ...this.state, ...parsedState };
        }
      }
    } catch (error) {
      console.warn('Failed to load collection sync state from storage:', error);
    }
  }

  private saveStateToStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save collection sync state to storage:', error);
    }
  }

  private notifyListeners() {
    console.log('📢 CollectionSyncManager notifying', this.listeners.size, 'listeners with state:', {
      collectionsCount: this.state.collections.length,
      isLoading: this.state.isLoading,
      error: this.state.error
    });
    this.listeners.forEach(listener => listener(this.state));
  }

  private handleBroadcastMessage(event: MessageEvent<CollectionUpdateEvent>) {
    const { type, collectionId, projectId, data, timestamp } = event.data;

    console.log('🔄 Received collection sync event:', { type, collectionId, projectId, timestamp });

    // Ignore old events
    if (timestamp <= this.state.lastUpdated) {
      return;
    }

    // 🔧 FIX: Create new collections array to trigger React re-renders
    let newCollections = this.state.collections;

    switch (type) {
      case 'collection_added':
        if (data) {
          newCollections = [...this.state.collections, data];
        }
        break;

      case 'collection_updated':
        if (data) {
          newCollections = this.state.collections.map(col =>
            col.collection_id === collectionId ? { ...col, ...data } : col
          );
        }
        break;

      case 'collection_deleted':
        newCollections = this.state.collections.filter(col => col.collection_id !== collectionId);
        break;

      case 'article_added':
      case 'article_removed':
        // Update article count for the collection
        newCollections = this.state.collections.map(col =>
          col.collection_id === collectionId
            ? {
                ...col,
                article_count: type === 'article_added'
                  ? col.article_count + 1
                  : Math.max(0, col.article_count - 1),
                updated_at: new Date().toISOString()
              }
            : col
        );
        break;
    }

    // 🔧 FIX: Create a new state object to trigger React re-renders
    this.state = {
      ...this.state,
      collections: newCollections,
      lastUpdated: timestamp
    };

    this.saveStateToStorage();
    this.notifyListeners();
  }

  subscribe(listener: (state: CollectionSyncState) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateCollections(collections: Collection[], projectId: string) {
    // 🔧 FIX: Create a new state object to trigger React re-renders
    this.state = {
      ...this.state,
      collections,
      lastUpdated: Date.now(),
      isLoading: false,
      error: null
    };

    this.saveStateToStorage();
    this.notifyListeners();
  }

  setLoading(isLoading: boolean) {
    // 🔧 FIX: Create a new state object to trigger React re-renders
    this.state = {
      ...this.state,
      isLoading
    };
    this.notifyListeners();
  }

  setError(error: string | null) {
    // 🔧 FIX: Create a new state object to trigger React re-renders
    this.state = {
      ...this.state,
      error,
      isLoading: false
    };
    this.notifyListeners();
  }

  broadcastUpdate(event: Omit<CollectionUpdateEvent, 'timestamp'>) {
    const fullEvent: CollectionUpdateEvent = {
      ...event,
      timestamp: Date.now()
    };

    console.log('📡 Broadcasting collection sync event:', fullEvent);

    // Only broadcast if broadcastChannel is available
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(fullEvent);
    }

    // Also handle locally
    this.handleBroadcastMessage({ data: fullEvent } as MessageEvent<CollectionUpdateEvent>);
  }

  getCollectionsForProject(projectId: string): Collection[] {
    // Filter collections by project_id, or return all if project_id is not set
    return this.state.collections.filter(col =>
      col.project_id === projectId || !col.project_id
    );
  }

  getState(): CollectionSyncState {
    return this.state;
  }

  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.listeners.clear();
  }
}

// Global singleton instance
let globalSyncManager: CollectionSyncManager | null = null;

function getSyncManager(): CollectionSyncManager {
  if (!globalSyncManager) {
    globalSyncManager = new CollectionSyncManager();
  }
  return globalSyncManager;
}

// React hook for using the global collection sync
export function useGlobalCollectionSync(projectId: string) {
  const { user } = useAuth();
  const syncManager = useRef(getSyncManager());
  const [state, setState] = useState<CollectionSyncState>(() => {
    // Subscribe immediately during initialization to avoid missing updates
    const initialState = syncManager.current.getState();
    console.log('🔧 useGlobalCollectionSync initializing with state:', {
      projectId,
      collectionsCount: initialState.collections.length,
      isLoading: initialState.isLoading
    });
    return initialState;
  });

  useEffect(() => {
    console.log('🔧 useGlobalCollectionSync subscribing to updates for projectId:', projectId);
    const unsubscribe = syncManager.current.subscribe((newState) => {
      console.log('🔔 useGlobalCollectionSync received state update:', {
        projectId,
        collectionsCount: newState.collections.length,
        isLoading: newState.isLoading
      });
      setState(newState);
    });
    return unsubscribe;
  }, [projectId]);

  const refreshCollections = useCallback(async () => {
    if (!projectId) return;

    syncManager.current.setLoading(true);

    try {
      console.log('🔄 Refreshing collections for project:', projectId, 'user:', user?.email);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Collections fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      const data = await response.json();
      const rawCollections = Array.isArray(data) ? data : (data.collections || []);

      // Add project_id to each collection since API doesn't include it
      const collections = rawCollections.map((collection: any) => ({
        ...collection,
        project_id: projectId
      }));

      console.log('✅ Collections fetched successfully:', collections.length, 'collections');
      console.log('🔍 Collections data:', collections);

      syncManager.current.updateCollections(collections, projectId);
    } catch (error) {
      console.error('Failed to refresh collections:', error);
      syncManager.current.setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [projectId, user?.email]);

  // 🔧 FIX: Automatically fetch collections on mount and when projectId/user changes
  useEffect(() => {
    if (projectId && user?.email) {
      console.log('🔄 Auto-fetching collections on mount for project:', projectId);
      refreshCollections();
    }
  }, [projectId, user?.email, refreshCollections]);

  const broadcastCollectionAdded = useCallback((collection: Collection) => {
    syncManager.current.broadcastUpdate({
      type: 'collection_added',
      collectionId: collection.collection_id,
      projectId: collection.project_id || projectId,
      data: collection
    });
  }, [projectId]);

  const broadcastCollectionUpdated = useCallback((collection: Collection) => {
    syncManager.current.broadcastUpdate({
      type: 'collection_updated',
      collectionId: collection.collection_id,
      projectId: collection.project_id || projectId,
      data: collection
    });
  }, [projectId]);

  const broadcastCollectionDeleted = useCallback((collectionId: string) => {
    syncManager.current.broadcastUpdate({
      type: 'collection_deleted',
      collectionId,
      projectId
    });
  }, [projectId]);

  const broadcastArticleAdded = useCallback((collectionId: string) => {
    syncManager.current.broadcastUpdate({
      type: 'article_added',
      collectionId,
      projectId
    });
  }, [projectId]);

  const broadcastArticleRemoved = useCallback((collectionId: string) => {
    syncManager.current.broadcastUpdate({
      type: 'article_removed',
      collectionId,
      projectId
    });
  }, [projectId]);

  // 🔧 FIX: Get collections for current project from state (reactive)
  // This ensures the component re-renders when collections change
  const collections = state.collections.filter(col =>
    col.project_id === projectId || !col.project_id
  );

  // Debug logging
  console.log('🔍 useGlobalCollectionSync returning:', {
    projectId,
    allCollections: state.collections,
    filteredCollections: collections,
    collectionsCount: collections.length,
    isLoading: state.isLoading,
    error: state.error
  });

  return {
    collections,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshCollections,
    broadcastCollectionAdded,
    broadcastCollectionUpdated,
    broadcastCollectionDeleted,
    broadcastArticleAdded,
    broadcastArticleRemoved
  };
}

// Cleanup function for when the app unmounts
export function cleanupGlobalCollectionSync() {
  if (globalSyncManager) {
    globalSyncManager.destroy();
    globalSyncManager = null;
  }
}
