/**
 * Annotation Utilities
 * Helper functions for working with annotations
 */

import type {
  Annotation,
  AnnotationThread,
  NoteType,
  Priority,
  Status,
  ActionItem,
} from './annotations';

// ============================================================================
// Type Guards
// ============================================================================

export function isAnnotation(obj: any): obj is Annotation {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.annotation_id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.note_type === 'string' &&
    typeof obj.priority === 'string' &&
    typeof obj.status === 'string'
  );
}

export function isAnnotationThread(obj: any): obj is AnnotationThread {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.annotation_id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.depth === 'number' &&
    Array.isArray(obj.children)
  );
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format note type for display
 */
export function formatNoteType(noteType: NoteType): string {
  const labels: Record<NoteType, string> = {
    general: 'General',
    finding: 'Finding',
    hypothesis: 'Hypothesis',
    question: 'Question',
    todo: 'To-Do',
    comparison: 'Comparison',
    critique: 'Critique',
  };
  
  return labels[noteType] || noteType;
}

/**
 * Format priority for display
 */
export function formatPriority(priority: Priority): string {
  const labels: Record<Priority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  
  return labels[priority] || priority;
}

/**
 * Format status for display
 */
export function formatStatus(status: Status): string {
  const labels: Record<Status, string> = {
    active: 'Active',
    resolved: 'Resolved',
    archived: 'Archived',
  };
  
  return labels[status] || status;
}

/**
 * Get color for note type
 */
export function getNoteTypeColor(noteType: NoteType): string {
  const colors: Record<NoteType, string> = {
    general: 'gray',
    finding: 'blue',
    hypothesis: 'purple',
    question: 'yellow',
    todo: 'green',
    comparison: 'orange',
    critique: 'red',
  };
  
  return colors[noteType] || 'gray';
}

/**
 * Get color for priority
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    critical: 'red',
  };
  
  return colors[priority] || 'gray';
}

/**
 * Get color for status
 */
export function getStatusColor(status: Status): string {
  const colors: Record<Status, string> = {
    active: 'green',
    resolved: 'blue',
    archived: 'gray',
  };
  
  return colors[status] || 'gray';
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sort annotations by created date (newest first)
 */
export function sortByCreatedDate(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Sort annotations by priority (critical first)
 */
export function sortByPriority(annotations: Annotation[]): Annotation[] {
  const priorityOrder: Record<Priority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return [...annotations].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Sort annotations by updated date (most recently updated first)
 */
export function sortByUpdatedDate(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter annotations by note type
 */
export function filterByNoteType(
  annotations: Annotation[],
  noteType: NoteType
): Annotation[] {
  return annotations.filter(ann => ann.note_type === noteType);
}

/**
 * Filter annotations by priority
 */
export function filterByPriority(
  annotations: Annotation[],
  priority: Priority
): Annotation[] {
  return annotations.filter(ann => ann.priority === priority);
}

/**
 * Filter annotations by status
 */
export function filterByStatus(
  annotations: Annotation[],
  status: Status
): Annotation[] {
  return annotations.filter(ann => ann.status === status);
}

/**
 * Filter annotations by tag
 */
export function filterByTag(
  annotations: Annotation[],
  tag: string
): Annotation[] {
  return annotations.filter(ann => ann.tags.includes(tag));
}

/**
 * Search annotations by content
 */
export function searchAnnotations(
  annotations: Annotation[],
  query: string
): Annotation[] {
  const lowerQuery = query.toLowerCase();
  
  return annotations.filter(ann => 
    ann.content.toLowerCase().includes(lowerQuery) ||
    ann.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    (ann.research_question && ann.research_question.toLowerCase().includes(lowerQuery))
  );
}

// ============================================================================
// Thread Operations
// ============================================================================

/**
 * Flatten annotation thread to array
 */
export function flattenThread(thread: AnnotationThread): AnnotationThread[] {
  const result: AnnotationThread[] = [thread];
  
  for (const child of thread.children) {
    result.push(...flattenThread(child));
  }
  
  return result;
}

/**
 * Get thread depth
 */
export function getThreadDepth(thread: AnnotationThread): number {
  if (thread.children.length === 0) {
    return thread.depth;
  }
  
  return Math.max(...thread.children.map(child => getThreadDepth(child)));
}

/**
 * Count annotations in thread
 */
export function countThreadAnnotations(thread: AnnotationThread): number {
  return 1 + thread.children.reduce(
    (sum, child) => sum + countThreadAnnotations(child),
    0
  );
}

/**
 * Find annotation in thread by ID
 */
export function findInThread(
  thread: AnnotationThread,
  annotationId: string
): AnnotationThread | null {
  if (thread.annotation_id === annotationId) {
    return thread;
  }
  
  for (const child of thread.children) {
    const found = findInThread(child, annotationId);
    if (found) {
      return found;
    }
  }
  
  return null;
}

// ============================================================================
// Action Items
// ============================================================================

/**
 * Get incomplete action items from annotation
 */
export function getIncompleteActionItems(annotation: Annotation): ActionItem[] {
  return annotation.action_items.filter(item => !item.completed);
}

/**
 * Get completed action items from annotation
 */
export function getCompletedActionItems(annotation: Annotation): ActionItem[] {
  return annotation.action_items.filter(item => item.completed);
}

/**
 * Count incomplete action items
 */
export function countIncompleteActionItems(annotation: Annotation): number {
  return getIncompleteActionItems(annotation).length;
}

/**
 * Check if annotation has overdue action items
 */
export function hasOverdueActionItems(annotation: Annotation): boolean {
  const now = new Date();
  
  return annotation.action_items.some(item => {
    if (item.completed || !item.due_date) {
      return false;
    }
    
    const dueDate = new Date(item.due_date);
    return dueDate < now;
  });
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get annotation statistics
 */
export function getAnnotationStats(annotations: Annotation[]) {
  const stats = {
    total: annotations.length,
    byNoteType: {} as Record<NoteType, number>,
    byPriority: {} as Record<Priority, number>,
    byStatus: {} as Record<Status, number>,
    totalActionItems: 0,
    incompleteActionItems: 0,
    overdueActionItems: 0,
  };
  
  for (const ann of annotations) {
    // Count by note type
    stats.byNoteType[ann.note_type] = (stats.byNoteType[ann.note_type] || 0) + 1;
    
    // Count by priority
    stats.byPriority[ann.priority] = (stats.byPriority[ann.priority] || 0) + 1;
    
    // Count by status
    stats.byStatus[ann.status] = (stats.byStatus[ann.status] || 0) + 1;
    
    // Count action items
    stats.totalActionItems += ann.action_items.length;
    stats.incompleteActionItems += countIncompleteActionItems(ann);
    
    if (hasOverdueActionItems(ann)) {
      stats.overdueActionItems++;
    }
  }
  
  return stats;
}

