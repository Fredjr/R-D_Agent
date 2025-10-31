# Annotation Components Guide

Quick reference guide for using the Annotation UI components.

---

## 📦 Installation

```typescript
import { 
  AnnotationList, 
  AnnotationCard, 
  AnnotationForm,
  AnnotationThreadView 
} from '@/components/annotations';
```

---

## 🎨 Components

### **AnnotationList**

Full-featured list view with filtering, inline forms, and CRUD operations.

**Basic Usage:**
```typescript
<AnnotationList
  projectId="proj_123"
  userId="user_123"
  articlePmid="38796750"
  showForm={true}
/>
```

**With Filters:**
```typescript
<AnnotationList
  projectId="proj_123"
  userId="user_123"
  initialFilters={{
    note_type: 'finding',
    priority: 'high',
    status: 'active',
  }}
/>
```

**Compact Mode:**
```typescript
<AnnotationList
  projectId="proj_123"
  userId="user_123"
  compact={true}
  className="max-h-96 overflow-y-auto"
/>
```

---

### **AnnotationCard**

Display a single annotation with badges, tags, and action items.

**Basic Usage:**
```typescript
<AnnotationCard
  annotation={annotation}
  onReply={(id) => console.log('Reply to:', id)}
  onEdit={(ann) => console.log('Edit:', ann)}
  onDelete={(id) => console.log('Delete:', id)}
/>
```

**Compact Mode:**
```typescript
<AnnotationCard
  annotation={annotation}
  compact={true}
  showContext={false}
/>
```

**With Thread View:**
```typescript
<AnnotationCard
  annotation={annotation}
  onViewThread={(id) => setThreadId(id)}
/>
```

---

### **AnnotationForm**

Form for creating or editing annotations.

**Create New Annotation:**
```typescript
<AnnotationForm
  projectId="proj_123"
  articlePmid="38796750"
  onSubmit={async (data) => {
    await createAnnotation(projectId, data, userId);
  }}
  placeholder="Add a note about this paper..."
/>
```

**Reply to Annotation:**
```typescript
<AnnotationForm
  projectId="proj_123"
  articlePmid="38796750"
  parentAnnotationId="ann_123"
  onSubmit={async (data) => {
    await createAnnotation(projectId, data, userId);
  }}
  placeholder="Write a reply..."
  compact={true}
/>
```

**Edit Annotation:**
```typescript
<AnnotationForm
  projectId="proj_123"
  articlePmid={annotation.article_pmid}
  onSubmit={async (data) => {
    await updateAnnotation(projectId, annotation.annotation_id, data, userId);
  }}
  onCancel={() => setEditing(false)}
  defaultNoteType={annotation.note_type}
  defaultPriority={annotation.priority}
/>
```

**Compact Mode (Inline):**
```typescript
<AnnotationForm
  projectId="proj_123"
  articlePmid="38796750"
  onSubmit={handleSubmit}
  compact={true}
  placeholder="Quick note..."
/>
```

---

### **AnnotationThreadView**

Display a hierarchical thread of annotations.

**Basic Usage:**
```typescript
<AnnotationThreadView
  projectId="proj_123"
  annotationId="ann_123"
  userId="user_123"
  onClose={() => setShowThread(false)}
/>
```

**With Reply Handler:**
```typescript
<AnnotationThreadView
  projectId="proj_123"
  annotationId="ann_123"
  userId="user_123"
  onReply={async (data) => {
    await createAnnotation(projectId, data, userId);
  }}
  onClose={() => setShowThread(false)}
/>
```

**In Modal:**
```typescript
{showThread && (
  <Modal onClose={() => setShowThread(false)}>
    <AnnotationThreadView
      projectId="proj_123"
      annotationId={threadId}
      userId="user_123"
      onClose={() => setShowThread(false)}
    />
  </Modal>
)}
```

---

## 🎯 Common Patterns

### **Sidebar Notes**

```typescript
function PaperSidebar({ pmid }) {
  return (
    <div className="w-96 border-l border-gray-200 p-4">
      <AnnotationList
        projectId={projectId}
        userId={userId}
        articlePmid={pmid}
        compact={true}
        showForm={true}
      />
    </div>
  );
}
```

### **Quick Note Button**

```typescript
function QuickNoteButton({ pmid }) {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowForm(true)}>
        Add Note
      </Button>
      
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <AnnotationForm
            projectId={projectId}
            articlePmid={pmid}
            onSubmit={async (data) => {
              await createAnnotation(projectId, data, userId);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
```

### **Thread Modal**

```typescript
function ThreadModal({ annotationId, onClose }) {
  return (
    <Modal onClose={onClose} size="large">
      <AnnotationThreadView
        projectId={projectId}
        annotationId={annotationId}
        userId={userId}
        onReply={async (data) => {
          await createAnnotation(projectId, data, userId);
        }}
        onClose={onClose}
      />
    </Modal>
  );
}
```

### **Filtered List**

```typescript
function FindingsList() {
  return (
    <AnnotationList
      projectId={projectId}
      userId={userId}
      initialFilters={{
        note_type: 'finding',
        priority: 'high',
      }}
      showForm={false}
    />
  );
}
```

---

## 🎨 Styling

### **Color Coding**

Each note type has a unique color:

- **Finding:** Blue (`border-l-blue-500`)
- **Hypothesis:** Purple (`border-l-purple-500`)
- **Question:** Yellow (`border-l-yellow-500`)
- **To-Do:** Green (`border-l-green-500`)
- **Comparison:** Orange (`border-l-orange-500`)
- **Critique:** Red (`border-l-red-500`)
- **General:** Gray (`border-l-gray-400`)

### **Custom Styling**

All components accept a `className` prop:

```typescript
<AnnotationList
  projectId={projectId}
  userId={userId}
  className="max-h-screen overflow-y-auto bg-gray-50 p-4"
/>
```

---

## 🔧 Advanced Usage

### **Custom Handlers**

```typescript
function CustomAnnotationList() {
  const handleReply = (annotationId: string) => {
    console.log('Reply to:', annotationId);
    // Custom logic
  };
  
  const handleEdit = (annotation: Annotation) => {
    console.log('Edit:', annotation);
    // Custom logic
  };
  
  const handleDelete = async (annotationId: string) => {
    if (confirm('Delete this note?')) {
      await deleteAnnotation(projectId, annotationId, userId);
    }
  };
  
  return (
    <AnnotationList
      projectId={projectId}
      userId={userId}
      // Custom handlers passed to cards
    />
  );
}
```

### **Controlled Filters**

```typescript
function FilteredAnnotations() {
  const [filters, setFilters] = useState<AnnotationFilters>({});
  
  return (
    <div>
      <FilterControls
        filters={filters}
        onChange={setFilters}
      />
      
      <AnnotationList
        projectId={projectId}
        userId={userId}
        initialFilters={filters}
      />
    </div>
  );
}
```

---

## 🚨 Error Handling

All components handle errors gracefully:

```typescript
<AnnotationList
  projectId={projectId}
  userId={userId}
  // Errors are displayed inline with retry button
/>
```

---

## 📱 Responsive Design

Components are responsive by default:

```typescript
// Desktop: Full width
<AnnotationList projectId={projectId} userId={userId} />

// Mobile: Compact mode
<AnnotationList 
  projectId={projectId} 
  userId={userId} 
  compact={true}
  className="px-2"
/>
```

---

## ⌨️ Keyboard Shortcuts

Form components support keyboard shortcuts:

- **Enter** in tag input: Add tag
- **Enter** in action item input: Add action item
- **Cmd/Ctrl + Enter** in textarea: Submit form (coming soon)

---

## 🔗 Related Files

- `frontend/src/components/annotations/AnnotationForm.tsx`
- `frontend/src/components/annotations/AnnotationCard.tsx`
- `frontend/src/components/annotations/AnnotationList.tsx`
- `frontend/src/components/annotations/AnnotationThreadView.tsx`
- `frontend/src/hooks/useAnnotations.ts`
- `frontend/src/lib/api/annotations.ts`

