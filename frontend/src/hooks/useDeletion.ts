import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type DeletableItemType = 'project' | 'report' | 'deep-dive' | 'collection';

interface DeletionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface DeletionState {
  isDeleting: boolean;
  error: string | null;
}

export const useDeletion = (options: DeletionOptions = {}) => {
  const { user } = useAuth();
  const [state, setState] = useState<DeletionState>({
    isDeleting: false,
    error: null
  });

  const deleteItem = async (
    itemType: DeletableItemType,
    itemId: string,
    projectId?: string
  ) => {
    setState({ isDeleting: true, error: null });

    try {
      const endpoint = getDeleteEndpoint(itemType, itemId, projectId);
      console.log(`🗑️ [Delete ${itemType}] Calling endpoint:`, endpoint);

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${itemType}`);
      }

      const result = await response.json();
      console.log(`🗑️ [Delete ${itemType}] Success:`, result);

      setState({ isDeleting: false, error: null });
      options.onSuccess?.();
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${itemType}`;
      console.error(`🗑️ [Delete ${itemType}] Error:`, errorMessage);
      
      setState({ isDeleting: false, error: errorMessage });
      options.onError?.(errorMessage);
      
      throw error;
    }
  };

  const deleteProject = (projectId: string) => deleteItem('project', projectId);
  
  const deleteReport = (reportId: string) => deleteItem('report', reportId);
  
  const deleteDeepDive = (analysisId: string, projectId: string) => 
    deleteItem('deep-dive', analysisId, projectId);
  
  const deleteCollection = (collectionId: string, projectId: string) => 
    deleteItem('collection', collectionId, projectId);

  return {
    ...state,
    deleteItem,
    deleteProject,
    deleteReport,
    deleteDeepDive,
    deleteCollection
  };
};

const getDeleteEndpoint = (
  itemType: DeletableItemType,
  itemId: string,
  projectId?: string
): string => {
  switch (itemType) {
    case 'project':
      return `/api/proxy/projects/${itemId}`;
    
    case 'report':
      return `/api/proxy/reports/${itemId}/delete`;
    
    case 'deep-dive':
      if (!projectId) throw new Error('Project ID required for deep-dive deletion');
      return `/api/proxy/projects/${projectId}/deep-dive-analyses/${itemId}/delete`;
    
    case 'collection':
      if (!projectId) throw new Error('Project ID required for collection deletion');
      return `/api/proxy/projects/${projectId}/collections/${itemId}/delete`;
    
    default:
      throw new Error(`Unknown item type: ${itemType}`);
  }
};

// Helper function to get user-friendly item type names
export const getItemTypeName = (itemType: DeletableItemType): string => {
  switch (itemType) {
    case 'project':
      return 'Project';
    case 'report':
      return 'Report';
    case 'deep-dive':
      return 'Deep Dive Analysis';
    case 'collection':
      return 'Collection';
    default:
      return 'Item';
  }
};

// Helper function to get deletion confirmation messages
export const getDeletionMessage = (itemType: DeletableItemType): string => {
  switch (itemType) {
    case 'project':
      return 'Are you sure you want to delete this project? This will permanently delete all associated reports, analyses, and collections.';
    case 'report':
      return 'Are you sure you want to delete this report? This will permanently remove the report and all its content.';
    case 'deep-dive':
      return 'Are you sure you want to delete this deep dive analysis? This will permanently remove the analysis and all its insights.';
    case 'collection':
      return 'Are you sure you want to delete this collection? This will permanently remove the collection and all its articles.';
    default:
      return 'Are you sure you want to delete this item?';
  }
};
