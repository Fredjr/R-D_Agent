/**
 * React hook for managing collection network session persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export interface NetworkNode {
  id: string;
  pmid: string;
  title: string;
  authors: string[];
  x: number;
  y: number;
  size: number;
  color: string;
  is_expanded?: boolean;
  depth?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'citation' | 'similarity' | 'co_author';
}

export interface NetworkState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  center_node: string;
  zoom_level: number;
  pan_x: number;
  pan_y: number;
  expanded_nodes: string[];
  selected_node?: string;
  filter_settings?: Record<string, any>;
}

export interface NetworkSession {
  session_id: string;
  collection_id: string;
  user_id: string;
  name: string;
  description: string;
  network_state: NetworkState;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  tags?: string[];
}

export interface UseNetworkSessionReturn {
  currentSession: NetworkSession | null;
  availableSessions: NetworkSession[];
  isLoading: boolean;
  createSession: (collectionId: string, initialState: NetworkState, name?: string, description?: string) => Promise<string | null>;
  updateSession: (sessionId: string, newState: NetworkState) => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<NetworkSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  renameSession: (sessionId: string, newName: string) => Promise<boolean>;
  getCollectionSessions: (collectionId: string) => Promise<NetworkSession[]>;
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
}

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useNetworkSession(collectionId?: string): UseNetworkSessionReturn {
  const { user } = useUser();
  const [currentSession, setCurrentSession] = useState<NetworkSession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<NetworkSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<NetworkState | null>(null);

  const getUserEmail = useCallback(() => {
    return user?.emailAddresses?.[0]?.emailAddress;
  }, [user]);

  const createSession = useCallback(async (
    collectionId: string,
    initialState: NetworkState,
    name?: string,
    description?: string
  ): Promise<string | null> => {
    const userEmail = getUserEmail();
    if (!userEmail) return null;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/proxy/network-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userEmail
        },
        body: JSON.stringify({
          collection_id: collectionId,
          name,
          description,
          ...initialState
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create network session');
      }

      const data = await response.json();
      if (data.success) {
        // Load the created session
        const session = await loadSession(data.session_id);
        if (session) {
          setCurrentSession(session);
          lastSavedStateRef.current = session.network_state;
        }
        return data.session_id;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to create network session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const updateSession = useCallback(async (
    sessionId: string,
    newState: NetworkState
  ): Promise<boolean> => {
    const userEmail = getUserEmail();
    if (!userEmail) return false;

    try {
      const response = await fetch(`/api/proxy/network-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userEmail
        },
        body: JSON.stringify(newState)
      });

      if (!response.ok) {
        throw new Error('Failed to update network session');
      }

      const data = await response.json();
      if (data.success) {
        // Update current session if it's the one being updated
        if (currentSession?.session_id === sessionId) {
          setCurrentSession(prev => prev ? {
            ...prev,
            network_state: newState,
            updated_at: new Date().toISOString()
          } : null);
        }
        
        lastSavedStateRef.current = newState;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update network session:', error);
      return false;
    }
  }, [getUserEmail, currentSession]);

  const loadSession = useCallback(async (sessionId: string): Promise<NetworkSession | null> => {
    const userEmail = getUserEmail();
    if (!userEmail) return null;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/proxy/network-sessions/${sessionId}`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load network session');
      }

      const data = await response.json();
      if (data.success) {
        const session = data.session;
        setCurrentSession(session);
        lastSavedStateRef.current = session.network_state;
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load network session:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUserEmail]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    const userEmail = getUserEmail();
    if (!userEmail) return false;

    try {
      const response = await fetch(`/api/proxy/network-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete network session');
      }

      const data = await response.json();
      if (data.success) {
        // Clear current session if it was deleted
        if (currentSession?.session_id === sessionId) {
          setCurrentSession(null);
          lastSavedStateRef.current = null;
        }
        
        // Remove from available sessions
        setAvailableSessions(prev => prev.filter(s => s.session_id !== sessionId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete network session:', error);
      return false;
    }
  }, [getUserEmail, currentSession]);

  const renameSession = useCallback(async (sessionId: string, newName: string): Promise<boolean> => {
    const userEmail = getUserEmail();
    if (!userEmail) return false;

    try {
      const response = await fetch(`/api/proxy/network-sessions/${sessionId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userEmail
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error('Failed to rename network session');
      }

      const data = await response.json();
      if (data.success) {
        // Update current session if it's the one being renamed
        if (currentSession?.session_id === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, name: newName } : null);
        }
        
        // Update available sessions
        setAvailableSessions(prev => prev.map(s => 
          s.session_id === sessionId ? { ...s, name: newName } : s
        ));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to rename network session:', error);
      return false;
    }
  }, [getUserEmail, currentSession]);

  const getCollectionSessions = useCallback(async (collectionId: string): Promise<NetworkSession[]> => {
    const userEmail = getUserEmail();
    if (!userEmail) return [];

    try {
      const response = await fetch(`/api/proxy/network-sessions/collection/${collectionId}`, {
        headers: {
          'User-ID': userEmail
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get collection sessions');
      }

      const data = await response.json();
      if (data.success) {
        const sessions = data.sessions;
        setAvailableSessions(sessions);
        return sessions;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get collection sessions:', error);
      return [];
    }
  }, [getUserEmail]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((sessionId: string, state: NetworkState) => {
    if (!autoSave) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule new auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Only save if state has changed
      if (JSON.stringify(state) !== JSON.stringify(lastSavedStateRef.current)) {
        await updateSession(sessionId, state);
      }
    }, AUTO_SAVE_INTERVAL);
  }, [autoSave, updateSession]);

  // Load collection sessions when collection ID changes
  useEffect(() => {
    if (collectionId) {
      getCollectionSessions(collectionId);
    }
  }, [collectionId, getCollectionSessions]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentSession,
    availableSessions,
    isLoading,
    createSession,
    updateSession,
    loadSession,
    deleteSession,
    renameSession,
    getCollectionSessions,
    autoSave,
    setAutoSave
  };
}

// Helper hook for network state restoration
export function useNetworkStateRestoration() {
  const restoreFromNotification = useCallback(() => {
    const returnPath = sessionStorage.getItem('network_return_path');
    const returnTimestamp = sessionStorage.getItem('network_return_timestamp');
    
    if (returnPath && returnTimestamp) {
      const timestamp = parseInt(returnTimestamp);
      const now = Date.now();
      
      // Only restore if less than 1 hour has passed
      if (now - timestamp < 3600000) {
        // Clear the stored path
        sessionStorage.removeItem('network_return_path');
        sessionStorage.removeItem('network_return_timestamp');
        
        // Navigate back to the network
        window.location.href = returnPath;
        return true;
      } else {
        // Clean up old entries
        sessionStorage.removeItem('network_return_path');
        sessionStorage.removeItem('network_return_timestamp');
      }
    }
    
    return false;
  }, []);

  return { restoreFromNotification };
}
