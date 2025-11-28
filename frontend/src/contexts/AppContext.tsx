'use client';

/**
 * Global App Context
 * Provides centralized state management for the application.
 * Manages projects, collections, and global UI state.
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Types
interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

interface Collection {
  id: string;
  name: string;
  projectId: string;
  articleCount: number;
  color?: string;
  icon?: string;
}

interface AppState {
  // Current context
  currentProjectId: string | null;
  currentCollectionId: string | null;
  
  // Cached data
  projects: Project[];
  collections: Collection[];
  
  // UI state
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  
  // Loading states
  isLoadingProjects: boolean;
  isLoadingCollections: boolean;
  
  // Errors
  error: string | null;
}

type AppAction =
  | { type: 'SET_CURRENT_PROJECT'; projectId: string | null }
  | { type: 'SET_CURRENT_COLLECTION'; collectionId: string | null }
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'SET_COLLECTIONS'; collections: Collection[] }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'REMOVE_PROJECT'; projectId: string }
  | { type: 'ADD_COLLECTION'; collection: Collection }
  | { type: 'UPDATE_COLLECTION'; collection: Collection }
  | { type: 'REMOVE_COLLECTION'; collectionId: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_LOADING_PROJECTS'; isLoading: boolean }
  | { type: 'SET_LOADING_COLLECTIONS'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: AppState = {
  currentProjectId: null,
  currentCollectionId: null,
  projects: [],
  collections: [],
  sidebarOpen: true,
  theme: 'dark',
  isLoadingProjects: false,
  isLoadingCollections: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProjectId: action.projectId };
    case 'SET_CURRENT_COLLECTION':
      return { ...state, currentCollectionId: action.collectionId };
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects, isLoadingProjects: false };
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.collections, isLoadingCollections: false };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.project.id ? action.project : p),
      };
    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.projectId),
        currentProjectId: state.currentProjectId === action.projectId ? null : state.currentProjectId,
      };
    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.collection] };
    case 'UPDATE_COLLECTION':
      return {
        ...state,
        collections: state.collections.map(c => c.id === action.collection.id ? action.collection : c),
      };
    case 'REMOVE_COLLECTION':
      return {
        ...state,
        collections: state.collections.filter(c => c.id !== action.collectionId),
        currentCollectionId: state.currentCollectionId === action.collectionId ? null : state.currentCollectionId,
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_LOADING_PROJECTS':
      return { ...state, isLoadingProjects: action.isLoading };
    case 'SET_LOADING_COLLECTIONS':
      return { ...state, isLoadingCollections: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setCurrentProject: (projectId: string | null) => void;
  setCurrentCollection: (collectionId: string | null) => void;
  toggleSidebar: () => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentProject = useCallback((projectId: string | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', projectId });
  }, []);

  const setCurrentCollection = useCallback((collectionId: string | null) => {
    dispatch({ type: 'SET_CURRENT_COLLECTION', collectionId });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, setCurrentProject, setCurrentCollection, toggleSidebar, clearError }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Selector hooks for specific state slices
export function useCurrentProject() {
  const { state } = useAppContext();
  return state.projects.find(p => p.id === state.currentProjectId) || null;
}

export function useCurrentCollection() {
  const { state } = useAppContext();
  return state.collections.find(c => c.id === state.currentCollectionId) || null;
}

export function useProjectCollections(projectId: string) {
  const { state } = useAppContext();
  return state.collections.filter(c => c.projectId === projectId);
}

