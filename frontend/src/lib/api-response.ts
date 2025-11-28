/**
 * Unified API Response Utilities
 * Provides consistent response handling and transformation across the app.
 */

// Standard API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  success: boolean;
}

// Standard list response with pagination
export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Standard error response
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, any>;
  status: number;
}

/**
 * Wrap an API call with consistent error handling
 */
export async function apiCall<T>(
  fetchFn: () => Promise<Response>,
  transform?: (data: any) => T
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchFn();
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      return {
        data: null,
        error: errorMessage,
        status: response.status,
        success: false,
      };
    }
    
    const rawData = await response.json();
    const data = transform ? transform(rawData) : rawData;
    
    return {
      data,
      error: null,
      status: response.status,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      success: false,
    };
  }
}

/**
 * Normalize collection data from different API responses
 */
export function normalizeCollection(raw: any): NormalizedCollection {
  return {
    id: raw.collection_id || raw.id,
    name: raw.collection_name || raw.name,
    description: raw.description || '',
    color: raw.color || '#FB923C',
    icon: raw.icon || 'folder',
    articleCount: raw.article_count ?? raw.articleCount ?? 0,
    noteCount: raw.note_count ?? raw.noteCount ?? 0,
    projectId: raw.project_id || raw.projectId,
    projectName: raw.project_name || raw.projectName,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

export interface NormalizedCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  articleCount: number;
  noteCount: number;
  projectId?: string;
  projectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Normalize project data from different API responses
 */
export function normalizeProject(raw: any): NormalizedProject {
  return {
    id: raw.project_id || raw.id,
    name: raw.project_name || raw.name || raw.title,
    description: raw.description || '',
    status: raw.status || 'active',
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
    userId: raw.user_id || raw.userId,
    articleCount: raw.article_count ?? raw.articleCount ?? 0,
    collectionCount: raw.collection_count ?? raw.collectionCount ?? 0,
  };
}

export interface NormalizedProject {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  articleCount: number;
  collectionCount: number;
}

/**
 * Normalize experiment plan data
 * Note: Backend uses plan_name, but we normalize to title for consistency
 */
export function normalizeExperimentPlan(raw: any): NormalizedExperimentPlan {
  return {
    id: raw.plan_id || raw.id,
    // Prefer plan_name (backend field) but fall back to title for compatibility
    title: raw.plan_name || raw.title || raw.name || 'Untitled Plan',
    planName: raw.plan_name || raw.title || raw.name || 'Untitled Plan',
    objective: raw.objective || raw.description || '',
    description: raw.description || raw.objective || '',
    status: raw.status || 'draft',
    difficultyLevel: raw.difficulty_level || raw.difficultyLevel || 'moderate',
    protocolId: raw.protocol_id || raw.protocolId,
    projectId: raw.project_id || raw.projectId,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

export interface NormalizedExperimentPlan {
  id: string;
  title: string;        // Normalized display name
  planName: string;     // Original plan_name field
  objective: string;
  description: string;
  status: string;
  difficultyLevel: string;
  protocolId?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

