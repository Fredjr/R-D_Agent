/**
 * Annotations API Tests
 * Unit tests for annotation API functions and utilities
 */

import {
  formatNoteType,
  formatPriority,
  formatStatus,
  getNoteTypeColor,
  getPriorityColor,
  getStatusColor,
  sortByCreatedDate,
  sortByPriority,
  filterByNoteType,
  filterByPriority,
  filterByStatus,
  searchAnnotations,
  flattenThread,
  countThreadAnnotations,
  getAnnotationStats,
  type Annotation,
  type AnnotationThread,
} from '../annotations';
import * as utils from '../annotationUtils';

// ============================================================================
// Mock Data
// ============================================================================

const mockAnnotation: Annotation = {
  annotation_id: 'ann_123',
  project_id: 'proj_123',
  content: 'Test annotation about insulin',
  article_pmid: '38796750',
  note_type: 'finding',
  priority: 'high',
  status: 'active',
  parent_annotation_id: undefined,
  related_pmids: ['12345', '67890'],
  tags: ['insulin', 'mitochondria'],
  action_items: [
    {
      text: 'Follow up with team',
      completed: false,
      due_date: '2025-11-15',
    },
  ],
  created_at: '2025-10-31T10:00:00Z',
  updated_at: '2025-10-31T10:00:00Z',
  author_id: 'user_123',
  author_username: 'testuser',
  is_private: false,
};

const mockThread: AnnotationThread = {
  ...mockAnnotation,
  depth: 0,
  children: [
    {
      ...mockAnnotation,
      annotation_id: 'ann_124',
      content: 'Child annotation',
      parent_annotation_id: 'ann_123',
      depth: 1,
      children: [],
    },
  ],
};

// ============================================================================
// Formatting Tests
// ============================================================================

describe('Formatting Functions', () => {
  test('formatNoteType', () => {
    expect(utils.formatNoteType('finding')).toBe('Finding');
    expect(utils.formatNoteType('hypothesis')).toBe('Hypothesis');
    expect(utils.formatNoteType('question')).toBe('Question');
  });
  
  test('formatPriority', () => {
    expect(utils.formatPriority('low')).toBe('Low');
    expect(utils.formatPriority('high')).toBe('High');
    expect(utils.formatPriority('critical')).toBe('Critical');
  });
  
  test('formatStatus', () => {
    expect(utils.formatStatus('active')).toBe('Active');
    expect(utils.formatStatus('resolved')).toBe('Resolved');
    expect(utils.formatStatus('archived')).toBe('Archived');
  });
  
  test('getNoteTypeColor', () => {
    expect(utils.getNoteTypeColor('finding')).toBe('blue');
    expect(utils.getNoteTypeColor('hypothesis')).toBe('purple');
    expect(utils.getNoteTypeColor('question')).toBe('yellow');
  });
  
  test('getPriorityColor', () => {
    expect(utils.getPriorityColor('low')).toBe('gray');
    expect(utils.getPriorityColor('high')).toBe('orange');
    expect(utils.getPriorityColor('critical')).toBe('red');
  });
  
  test('getStatusColor', () => {
    expect(utils.getStatusColor('active')).toBe('green');
    expect(utils.getStatusColor('resolved')).toBe('blue');
    expect(utils.getStatusColor('archived')).toBe('gray');
  });
});

// ============================================================================
// Sorting Tests
// ============================================================================

describe('Sorting Functions', () => {
  const annotations: Annotation[] = [
    { ...mockAnnotation, annotation_id: 'ann_1', priority: 'low', created_at: '2025-10-31T10:00:00Z' },
    { ...mockAnnotation, annotation_id: 'ann_2', priority: 'critical', created_at: '2025-10-31T11:00:00Z' },
    { ...mockAnnotation, annotation_id: 'ann_3', priority: 'high', created_at: '2025-10-31T09:00:00Z' },
  ];
  
  test('sortByCreatedDate', () => {
    const sorted = utils.sortByCreatedDate(annotations);
    expect(sorted[0].annotation_id).toBe('ann_2'); // Newest first
    expect(sorted[2].annotation_id).toBe('ann_3'); // Oldest last
  });
  
  test('sortByPriority', () => {
    const sorted = utils.sortByPriority(annotations);
    expect(sorted[0].priority).toBe('critical');
    expect(sorted[1].priority).toBe('high');
    expect(sorted[2].priority).toBe('low');
  });
});

// ============================================================================
// Filtering Tests
// ============================================================================

describe('Filtering Functions', () => {
  const annotations: Annotation[] = [
    { ...mockAnnotation, annotation_id: 'ann_1', note_type: 'finding', priority: 'high', status: 'active' },
    { ...mockAnnotation, annotation_id: 'ann_2', note_type: 'hypothesis', priority: 'low', status: 'resolved' },
    { ...mockAnnotation, annotation_id: 'ann_3', note_type: 'finding', priority: 'high', status: 'active' },
  ];
  
  test('filterByNoteType', () => {
    const filtered = utils.filterByNoteType(annotations, 'finding');
    expect(filtered.length).toBe(2);
    expect(filtered.every(ann => ann.note_type === 'finding')).toBe(true);
  });
  
  test('filterByPriority', () => {
    const filtered = utils.filterByPriority(annotations, 'high');
    expect(filtered.length).toBe(2);
    expect(filtered.every(ann => ann.priority === 'high')).toBe(true);
  });
  
  test('filterByStatus', () => {
    const filtered = utils.filterByStatus(annotations, 'active');
    expect(filtered.length).toBe(2);
    expect(filtered.every(ann => ann.status === 'active')).toBe(true);
  });
  
  test('searchAnnotations', () => {
    const filtered = utils.searchAnnotations(annotations, 'insulin');
    expect(filtered.length).toBe(3); // All have 'insulin' in tags
  });
});

// ============================================================================
// Thread Operations Tests
// ============================================================================

describe('Thread Operations', () => {
  test('flattenThread', () => {
    const flattened = utils.flattenThread(mockThread);
    expect(flattened.length).toBe(2); // Parent + 1 child
    expect(flattened[0].annotation_id).toBe('ann_123');
    expect(flattened[1].annotation_id).toBe('ann_124');
  });
  
  test('countThreadAnnotations', () => {
    const count = utils.countThreadAnnotations(mockThread);
    expect(count).toBe(2); // Parent + 1 child
  });
  
  test('getThreadDepth', () => {
    const depth = utils.getThreadDepth(mockThread);
    expect(depth).toBe(1); // Max depth is 1 (child)
  });
  
  test('findInThread', () => {
    const found = utils.findInThread(mockThread, 'ann_124');
    expect(found).not.toBeNull();
    expect(found?.annotation_id).toBe('ann_124');
    
    const notFound = utils.findInThread(mockThread, 'ann_999');
    expect(notFound).toBeNull();
  });
});

// ============================================================================
// Action Items Tests
// ============================================================================

describe('Action Items', () => {
  test('getIncompleteActionItems', () => {
    const incomplete = utils.getIncompleteActionItems(mockAnnotation);
    expect(incomplete.length).toBe(1);
    expect(incomplete[0].completed).toBe(false);
  });
  
  test('countIncompleteActionItems', () => {
    const count = utils.countIncompleteActionItems(mockAnnotation);
    expect(count).toBe(1);
  });
});

// ============================================================================
// Statistics Tests
// ============================================================================

describe('Statistics', () => {
  const annotations: Annotation[] = [
    { ...mockAnnotation, annotation_id: 'ann_1', note_type: 'finding', priority: 'high', status: 'active' },
    { ...mockAnnotation, annotation_id: 'ann_2', note_type: 'hypothesis', priority: 'low', status: 'resolved' },
    { ...mockAnnotation, annotation_id: 'ann_3', note_type: 'finding', priority: 'high', status: 'active' },
  ];
  
  test('getAnnotationStats', () => {
    const stats = utils.getAnnotationStats(annotations);
    
    expect(stats.total).toBe(3);
    expect(stats.byNoteType.finding).toBe(2);
    expect(stats.byNoteType.hypothesis).toBe(1);
    expect(stats.byPriority.high).toBe(2);
    expect(stats.byPriority.low).toBe(1);
    expect(stats.byStatus.active).toBe(2);
    expect(stats.byStatus.resolved).toBe(1);
  });
});

// ============================================================================
// Type Tests
// ============================================================================

describe('Type Guards', () => {
  test('isAnnotation', () => {
    expect(utils.isAnnotation(mockAnnotation)).toBe(true);
    expect(utils.isAnnotation({})).toBe(false);
    expect(utils.isAnnotation(null)).toBe(false);
  });
  
  test('isAnnotationThread', () => {
    expect(utils.isAnnotationThread(mockThread)).toBe(true);
    expect(utils.isAnnotationThread(mockAnnotation)).toBe(false);
  });
});

console.log('✅ All annotation tests defined');

