# Annotations API Guide

Quick reference guide for using the Contextual Notes API in React components.

---

## 📦 Installation

```typescript
import { useAnnotations } from '@/hooks/useAnnotations';
import { 
  createAnnotation, 
  getAnnotations, 
  updateAnnotation 
} from '@/lib/api/annotations';
import { 
  formatNoteType, 
  sortByPriority, 
  getAnnotationStats 
} from '@/lib/api/annotationUtils';
```

---

## 🎣 Using the Hook (Recommended)

### Basic Usage

```typescript
function MyComponent() {
  const { annotations, loading, error, create, update } = useAnnotations({
    projectId: 'proj_123',
    userId: 'user_123',
    autoFetch: true,
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {annotations.map(ann => (
        <div key={ann.annotation_id}>{ann.content}</div>
      ))}
    </div>
  );
}
```

### With Filters

```typescript
const { annotations, fetch } = useAnnotations({
  projectId: 'proj_123',
  userId: 'user_123',
  filters: {
    note_type: 'finding',
    priority: 'high',
    status: 'active',
  },
});

// Update filters
await fetch({ note_type: 'hypothesis' });
```

### Creating Annotations

```typescript
const { create } = useAnnotations({ projectId: 'proj_123' });

const handleCreate = async () => {
  try {
    const newAnnotation = await create({
      content: 'Important finding about insulin',
      article_pmid: '38796750',
      note_type: 'finding',
      priority: 'high',
      tags: ['insulin', 'mitochondria'],
      action_items: [
        {
          text: 'Follow up with team',
          completed: false,
          due_date: '2025-11-15',
        },
      ],
    });
    
    console.log('Created:', newAnnotation);
  } catch (error) {
    console.error('Failed to create:', error);
  }
};
```

### Updating Annotations

```typescript
const { update } = useAnnotations({ projectId: 'proj_123' });

const handleUpdate = async (annotationId: string) => {
  try {
    const updated = await update(annotationId, {
      priority: 'critical',
      status: 'resolved',
      tags: ['urgent', 'completed'],
    });
    
    console.log('Updated:', updated);
  } catch (error) {
    console.error('Failed to update:', error);
  }
};
```

### Working with Threads

```typescript
const { fetchThread } = useAnnotations({ projectId: 'proj_123' });

const handleViewThread = async (annotationId: string) => {
  try {
    const thread = await fetchThread(annotationId);
    console.log('Thread:', thread);
    console.log('Total annotations:', thread.total_in_thread);
  } catch (error) {
    console.error('Failed to fetch thread:', error);
  }
};
```

---

## 🔧 Direct API Usage

### Create Annotation

```typescript
import { createAnnotation } from '@/lib/api/annotations';

const annotation = await createAnnotation(
  'proj_123',
  {
    content: 'Important finding',
    article_pmid: '38796750',
    note_type: 'finding',
    priority: 'high',
  },
  'user_123'
);
```

### Get Annotations

```typescript
import { getAnnotations } from '@/lib/api/annotations';

const response = await getAnnotations(
  'proj_123',
  {
    note_type: 'finding',
    priority: 'high',
    status: 'active',
  },
  'user_123'
);

console.log('Annotations:', response.annotations);
```

### Update Annotation

```typescript
import { updateAnnotation } from '@/lib/api/annotations';

const updated = await updateAnnotation(
  'proj_123',
  'ann_123',
  {
    priority: 'critical',
    status: 'resolved',
  },
  'user_123'
);
```

### Get Thread

```typescript
import { getAnnotationThread } from '@/lib/api/annotations';

const response = await getAnnotationThread(
  'proj_123',
  'ann_123',
  'user_123'
);

console.log('Thread:', response.thread);
console.log('Total:', response.total_annotations);
```

### Get All Threads

```typescript
import { getAnnotationThreads } from '@/lib/api/annotations';

const response = await getAnnotationThreads(
  'proj_123',
  { priority: 'high' },
  'user_123'
);

console.log('Threads:', response.threads);
console.log('Total threads:', response.total_threads);
```

---

## 🛠️ Utility Functions

### Formatting

```typescript
import { 
  formatNoteType, 
  formatPriority, 
  getNoteTypeColor 
} from '@/lib/api/annotationUtils';

const label = formatNoteType('finding'); // "Finding"
const priorityLabel = formatPriority('high'); // "High"
const color = getNoteTypeColor('finding'); // "blue"
```

### Sorting

```typescript
import { 
  sortByPriority, 
  sortByCreatedDate 
} from '@/lib/api/annotationUtils';

const sorted = sortByPriority(annotations);
const recent = sortByCreatedDate(annotations);
```

### Filtering

```typescript
import { 
  filterByNoteType, 
  searchAnnotations 
} from '@/lib/api/annotationUtils';

const findings = filterByNoteType(annotations, 'finding');
const results = searchAnnotations(annotations, 'insulin');
```

### Thread Operations

```typescript
import { 
  flattenThread, 
  countThreadAnnotations 
} from '@/lib/api/annotationUtils';

const flat = flattenThread(thread);
const count = countThreadAnnotations(thread);
```

### Statistics

```typescript
import { getAnnotationStats } from '@/lib/api/annotationUtils';

const stats = getAnnotationStats(annotations);
console.log('Total:', stats.total);
console.log('By type:', stats.byNoteType);
console.log('By priority:', stats.byPriority);
console.log('Incomplete action items:', stats.incompleteActionItems);
```

---

## 📝 TypeScript Types

### Note Types

```typescript
type NoteType = 
  | 'general'
  | 'finding'
  | 'hypothesis'
  | 'question'
  | 'todo'
  | 'comparison'
  | 'critique';
```

### Priority

```typescript
type Priority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';
```

### Status

```typescript
type Status = 
  | 'active'
  | 'resolved'
  | 'archived';
```

### Annotation

```typescript
interface Annotation {
  annotation_id: string;
  project_id: string;
  content: string;
  article_pmid?: string;
  note_type: NoteType;
  priority: Priority;
  status: Status;
  tags: string[];
  action_items: ActionItem[];
  created_at: string;
  updated_at: string;
  author_id: string;
  is_private: boolean;
}
```

---

## 🎨 UI Examples

### Annotation Card

```typescript
function AnnotationCard({ annotation }: { annotation: Annotation }) {
  const typeColor = getNoteTypeColor(annotation.note_type);
  const priorityLabel = formatPriority(annotation.priority);
  
  return (
    <div className={`border-l-4 border-${typeColor}-500 p-4`}>
      <div className="flex justify-between">
        <span className="font-semibold">
          {formatNoteType(annotation.note_type)}
        </span>
        <span className={`text-${getPriorityColor(annotation.priority)}-600`}>
          {priorityLabel}
        </span>
      </div>
      <p>{annotation.content}</p>
      <div className="flex gap-2 mt-2">
        {annotation.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-200 rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Filter Component

```typescript
function AnnotationFilters() {
  const { filters, updateFilter } = useAnnotationFilters();
  
  return (
    <div className="flex gap-4">
      <select 
        value={filters.note_type || ''} 
        onChange={(e) => updateFilter('note_type', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="finding">Finding</option>
        <option value="hypothesis">Hypothesis</option>
        <option value="question">Question</option>
      </select>
      
      <select 
        value={filters.priority || ''} 
        onChange={(e) => updateFilter('priority', e.target.value)}
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>
  );
}
```

---

## 🚨 Error Handling

```typescript
import { AnnotationAPIError } from '@/lib/api/annotations';

try {
  await createAnnotation(projectId, data, userId);
} catch (error) {
  if (error instanceof AnnotationAPIError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## 📚 Best Practices

1. **Use the hook** for component state management
2. **Use direct API calls** for one-off operations
3. **Use utility functions** for common operations
4. **Handle errors** with try-catch blocks
5. **Use TypeScript types** for type safety
6. **Optimize with filters** to reduce data transfer
7. **Use optimistic updates** for better UX

---

## 🔗 Related Files

- `frontend/src/lib/api/annotations.ts` - API service
- `frontend/src/hooks/useAnnotations.ts` - React hooks
- `frontend/src/lib/api/annotationUtils.ts` - Utility functions
- `frontend/src/lib/api/__tests__/annotations.test.ts` - Unit tests

