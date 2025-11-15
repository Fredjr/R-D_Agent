/**
 * Annotations API Service
 * Handles all annotation-related API calls with contextual notes support
 */

// ============================================================================
// Types
// ============================================================================

export type NoteType =
  | 'general'
  | 'finding'
  | 'hypothesis'
  | 'question'
  | 'todo'
  | 'comparison'
  | 'critique'
  | 'highlight';  // PDF highlight annotations

export type Priority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type Status = 
  | 'active'
  | 'resolved'
  | 'archived';

export interface ActionItem {
  text: string;
  completed: boolean;
  due_date?: string;
  assigned_to?: string;
}

export interface CreateAnnotationRequest {
  content: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  collection_id?: string;
  note_type?: NoteType;
  priority?: Priority;
  status?: Status;
  parent_annotation_id?: string;
  related_pmids?: string[];
  tags?: string[];
  action_items?: ActionItem[];
  exploration_session_id?: string;
  research_question?: string;
  is_private?: boolean;
}

export interface UpdateAnnotationRequest {
  content?: string;
  note_type?: NoteType;
  priority?: Priority;
  status?: Status;
  parent_annotation_id?: string;
  related_pmids?: string[];
  tags?: string[];
  action_items?: ActionItem[];
  exploration_session_id?: string;
  research_question?: string;
  is_private?: boolean;
}

// PDF-specific types
export interface PDFCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
}

export interface StickyNotePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextFormatting {
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
}

export type AnnotationType = 'highlight' | 'sticky_note' | 'underline' | 'strikethrough' | 'drawing';

export interface Annotation {
  annotation_id: string;
  project_id: string;
  content: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  collection_id?: string;
  note_type: NoteType;
  priority: Priority;
  status: Status;
  parent_annotation_id?: string;
  related_pmids: string[];
  tags: string[];
  action_items: ActionItem[];
  exploration_session_id?: string;
  research_question?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_username?: string;
  is_private: boolean;

  // PDF annotation fields
  pdf_page?: number;
  pdf_coordinates?: PDFCoordinates | null;
  highlight_color?: string | null;
  highlight_text?: string | null;
  annotation_type?: AnnotationType;
  sticky_note_position?: StickyNotePosition | null;
  sticky_note_color?: string;
  text_formatting?: TextFormatting | null;
  drawing_data?: any | null;
}

export interface AnnotationThread {
  annotation_id: string;
  project_id: string;
  content: string;
  article_pmid?: string;
  report_id?: string;
  analysis_id?: string;
  collection_id?: string;
  note_type: NoteType;
  priority: Priority;
  status: Status;
  parent_annotation_id?: string;
  related_pmids: string[];
  tags: string[];
  action_items: ActionItem[];
  exploration_session_id?: string;
  research_question?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_username?: string;
  is_private: boolean;
  depth: number;
  children: AnnotationThread[];
  total_in_thread?: number;
}

export interface AnnotationFilters {
  note_type?: NoteType;
  priority?: Priority;
  status?: Status;
  article_pmid?: string;
  collection_id?: string;
  author_id?: string;
}

export interface GetAnnotationsResponse {
  annotations: Annotation[];
}

export interface GetThreadResponse {
  thread: AnnotationThread;
  total_annotations: number;
}

export interface GetThreadsResponse {
  threads: AnnotationThread[];
  total_threads: number;
  total_annotations: number;
}

// ============================================================================
// API Configuration
// ============================================================================

function getBaseUrl(): string {
  // Use proxy in production, direct in development
  if (process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

function getHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (userId) {
    headers['User-ID'] = userId;
  }
  
  return headers;
}

// ============================================================================
// Error Handling
// ============================================================================

class AnnotationAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AnnotationAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let errorMessage = `API request failed with status ${response.status}`;
    
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.detail || errorMessage;
    } catch {
      if (text) {
        errorMessage = text;
      }
    }
    
    throw new AnnotationAPIError(errorMessage, response.status, text);
  }
  
  return response.json();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new annotation
 */
export async function createAnnotation(
  projectId: string,
  data: CreateAnnotationRequest,
  userId?: string
): Promise<Annotation> {
  const url = `${getBaseUrl()}/projects/${projectId}/annotations`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(userId),
    body: JSON.stringify(data),
  });
  
  return handleResponse<Annotation>(response);
}

/**
 * Get all annotations for a project with optional filters
 */
export async function getAnnotations(
  projectId: string,
  filters?: AnnotationFilters,
  userId?: string
): Promise<GetAnnotationsResponse> {
  const params = new URLSearchParams();

  if (filters?.note_type) params.append('note_type', filters.note_type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.article_pmid) params.append('article_pmid', filters.article_pmid);
  if (filters?.collection_id) params.append('collection_id', filters.collection_id); // ✅ NEW: Support collection_id filter
  if (filters?.author_id) params.append('author_id', filters.author_id);

  const queryString = params.toString();
  const url = `${getBaseUrl()}/projects/${projectId}/annotations${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(userId),
  });
  
  return handleResponse<GetAnnotationsResponse>(response);
}

/**
 * Update an existing annotation
 */
export async function updateAnnotation(
  projectId: string,
  annotationId: string,
  data: UpdateAnnotationRequest,
  userId?: string
): Promise<Annotation> {
  const url = `${getBaseUrl()}/projects/${projectId}/annotations/${annotationId}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(userId),
    body: JSON.stringify(data),
  });
  
  return handleResponse<Annotation>(response);
}

/**
 * Get an annotation thread (parent and all children)
 */
export async function getAnnotationThread(
  projectId: string,
  annotationId: string,
  userId?: string
): Promise<GetThreadResponse> {
  const url = `${getBaseUrl()}/projects/${projectId}/annotations/${annotationId}/thread`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(userId),
  });
  
  return handleResponse<GetThreadResponse>(response);
}

/**
 * Get all annotation threads for a project
 */
export async function getAnnotationThreads(
  projectId: string,
  filters?: AnnotationFilters,
  userId?: string
): Promise<GetThreadsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.note_type) params.append('note_type', filters.note_type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.article_pmid) params.append('article_pmid', filters.article_pmid);
  
  const queryString = params.toString();
  const url = `${getBaseUrl()}/projects/${projectId}/annotations/threads${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(userId),
  });
  
  return handleResponse<GetThreadsResponse>(response);
}

// ============================================================================
// Export Error Class
// ============================================================================

export { AnnotationAPIError };

