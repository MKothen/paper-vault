# Integration Steps for Highlighting and Note-Taking Features

This guide walks you through integrating the new highlighting and note-taking system into your Paper-Vault application.

## Quick Start

The simplest integration is to replace the existing `Reader` component with `EnhancedReader`:

```typescript
// Before:
import { Reader } from './components/Reader';

// After:
import { EnhancedReader } from './components/EnhancedReader';
```

The `EnhancedReader` component has the same props interface as the original `Reader`, so it's a drop-in replacement.

## Step-by-Step Integration

### Step 1: Verify Dependencies

Ensure your `package.json` includes:

```json
{
  "dependencies": {
    "react-pdf": "^7.x.x",
    "lucide-react": "^0.x.x",
    "pdfjs-dist": "^3.x.x"
  }
}
```

If not installed:

```bash
npm install react-pdf lucide-react pdfjs-dist
```

### Step 2: Update Your App Component

Find where you're currently rendering the `Reader` component, likely in `App.tsx`:

```typescript
// src/App.tsx

// Old import
// import { Reader } from './components/Reader';

// New import
import { EnhancedReader } from './components/EnhancedReader';

// In your component:
function App() {
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  
  return (
    <div>
      {/* Your paper list */}
      
      {selectedPaper && (
        <EnhancedReader
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onUpdate={(data) => updatePaper(selectedPaper.id, data)}
          papers={allPapers}
        />
      )}
    </div>
  );
}
```

### Step 3: Verify CSS Classes

The new components use neobrutalist design classes. Ensure these exist in your CSS:

```css
/* src/index.css or src/App.css */

.nb-button {
  @apply border-2 border-black bg-white px-3 py-1.5 font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all;
}

.nb-input {
  @apply border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400;
}

.nb-yellow {
  @apply bg-yellow-300;
}

.shadow-nb {
  @apply shadow-[4px_4px_0px_0px_rgba(0,0,0,1)];
}

.shadow-nb-lg {
  @apply shadow-[8px_8px_0px_0px_rgba(0,0,0,1)];
}
```

If you're not using Tailwind, add equivalent CSS.

### Step 4: Configure PDF.js Worker

Ensure the PDF.js worker is properly configured:

```typescript
// src/main.tsx or src/App.tsx

import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Or if hosting locally:
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

### Step 5: Test the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open a paper with a PDF**

3. **Test highlighting:**
   - Click the Highlighter button
   - Select a category
   - Select some text
   - Verify the highlight appears

4. **Test sticky notes:**
   - Click the Sticky Note button
   - Click on the PDF
   - Type in the note
   - Verify it saves

5. **Test persistence:**
   - Refresh the page
   - Open the same paper
   - Verify annotations are still there

### Step 6: Customize (Optional)

You can customize colors, categories, and behavior:

#### Custom Highlight Categories

Edit `src/utils/highlightUtils.ts`:

```typescript
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    methodology: '#22d3ee',
    results: '#a3e635',
    'related-work': '#c084fc',
    // Add your custom categories:
    'my-category': '#ff6b6b',
    'another-category': '#4ecdc4'
  };
  return colors[category] || colors.general;
}
```

Update the type in `src/types.ts`:

```typescript
export interface Highlight {
  // ...
  category?: 'methodology' | 'results' | 'related-work' | 'discussion' | 'limitation' | 'general' | 'my-category' | 'another-category';
  // ...
}
```

#### Custom Post-It Colors

Edit `src/utils/highlightUtils.ts`:

```typescript
export function getPostItColors(): PostIt['color'][] {
  return [
    { name: 'yellow', class: 'bg-yellow-200', hex: '#fef08a' },
    // Add your custom colors:
    { name: 'coral', class: 'bg-red-200', hex: '#fecaca' },
    { name: 'mint', class: 'bg-teal-200', hex: '#99f6e4' }
  ];
}
```

## Advanced Integration

### Using Individual Components

If you want to use the highlighting system in a custom reader:

```typescript
import { HighlightLayer } from './components/HighlightLayer';
import { PostItLayer } from './components/PostItLayer';
import { AnnotationsSidebar } from './components/AnnotationsSidebar';
import {
  loadHighlights,
  loadPostIts,
  saveHighlights,
  savePostIts
} from './utils/highlightUtils';

function CustomReader({ paper }: Props) {
  const [highlights, setHighlights] = useState(() => loadHighlights(paper.id));
  const [postits, setPostits] = useState(() => loadPostIts(paper.id));
  
  useEffect(() => {
    saveHighlights(paper.id, highlights);
    savePostIts(paper.id, postits);
  }, [highlights, postits, paper.id]);
  
  return (
    <div>
      {/* Your PDF renderer */}
      
      <HighlightLayer
        highlights={highlights}
        currentPage={pageNumber}
        scale={scale}
        onHighlightClick={(h) => setPageNumber(h.page)}
        onHighlightDelete={(h) => setHighlights(prev => prev.filter(x => x.id !== h.id))}
      />
      
      <PostItLayer
        postits={postits}
        currentPage={pageNumber}
        scale={scale}
        onPostItUpdate={(p) => setPostits(prev => prev.map(x => x.id === p.id ? p : x))}
        onPostItDelete={(p) => setPostits(prev => prev.filter(x => x.id !== p.id))}
      />
      
      <AnnotationsSidebar
        highlights={highlights}
        postits={postits}
        onHighlightClick={(h) => setPageNumber(h.page)}
        onHighlightDelete={(h) => setHighlights(prev => prev.filter(x => x.id !== h.id))}
        onHighlightUpdate={(h) => setHighlights(prev => prev.map(x => x.id === h.id ? h : x))}
        onPostItClick={(p) => setPageNumber(p.page)}
        onPostItDelete={(p) => setPostits(prev => prev.filter(x => x.id !== p.id))}
        paperTitle={paper.title}
      />
    </div>
  );
}
```

### Cloud Sync Integration

To sync annotations to Firebase:

```typescript
// src/utils/annotationSync.ts

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Highlight, PostIt } from './types';

export async function syncHighlightsToCloud(
  userId: string,
  paperId: string,
  highlights: Highlight[]
) {
  const docRef = doc(db, 'users', userId, 'annotations', paperId);
  await setDoc(docRef, { highlights }, { merge: true });
}

export async function loadHighlightsFromCloud(
  userId: string,
  paperId: string
): Promise<Highlight[]> {
  const docRef = doc(db, 'users', userId, 'annotations', paperId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().highlights : [];
}
```

Then in your component:

```typescript
useEffect(() => {
  // Load from cloud on mount
  loadHighlightsFromCloud(user.id, paper.id)
    .then(cloudHighlights => {
      if (cloudHighlights.length > 0) {
        setHighlights(cloudHighlights);
      }
    });
}, [user.id, paper.id]);

useEffect(() => {
  // Debounced sync to cloud
  const timer = setTimeout(() => {
    syncHighlightsToCloud(user.id, paper.id, highlights);
  }, 2000);
  
  return () => clearTimeout(timer);
}, [highlights, user.id, paper.id]);
```

## Troubleshooting

### Issue: Highlights don't appear

**Solution:**
- Verify `containerRef` is properly attached to the PDF container
- Check that `scale` prop is passed correctly
- Ensure highlights are being saved (check localStorage in DevTools)

### Issue: "Cannot read property 'getBoundingClientRect' of null"

**Solution:**
```typescript
const containerRect = containerRef.current?.getBoundingClientRect();
if (!containerRect) return; // Add this check
```

### Issue: Post-its appear in wrong positions

**Solution:**
- Ensure the container has `position: relative`
- Verify scale is applied consistently
- Check that x/y coordinates are normalized correctly

### Issue: Export doesn't download

**Solution:**
```typescript
// Try this alternative download method:
const downloadMarkdown = (markdown: string, filename: string) => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

### Issue: LocalStorage quota exceeded

**Solution:**
- Implement cloud sync (see Advanced Integration)
- Or compress annotations before storing:

```typescript
import LZString from 'lz-string';

export function saveHighlights(paperId: string, highlights: Highlight[]): void {
  const compressed = LZString.compress(JSON.stringify(highlights));
  localStorage.setItem(`highlights-${paperId}`, compressed);
}

export function loadHighlights(paperId: string): Highlight[] {
  const compressed = localStorage.getItem(`highlights-${paperId}`);
  if (!compressed) return [];
  const decompressed = LZString.decompress(compressed);
  return JSON.parse(decompressed);
}
```

## Testing

### Unit Tests

```typescript
// src/utils/highlightUtils.test.ts

import { describe, it, expect } from 'vitest';
import { getCategoryColor, countHighlightsByCategory } from './highlightUtils';

describe('highlightUtils', () => {
  it('returns correct color for category', () => {
    expect(getCategoryColor('methodology')).toBe('#22d3ee');
    expect(getCategoryColor('unknown')).toBe('#fde047'); // fallback to general
  });
  
  it('counts highlights by category', () => {
    const highlights = [
      { id: 1, category: 'methodology', /* ... */ },
      { id: 2, category: 'methodology', /* ... */ },
      { id: 3, category: 'results', /* ... */ }
    ];
    
    const counts = countHighlightsByCategory(highlights);
    expect(counts.methodology).toBe(2);
    expect(counts.results).toBe(1);
  });
});
```

### Integration Tests

```typescript
// src/components/EnhancedReader.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedReader } from './EnhancedReader';

test('creates highlight on text selection', async () => {
  const mockPaper = { id: '1', title: 'Test Paper', pdfUrl: '/test.pdf', /* ... */ };
  
  render(
    <EnhancedReader
      paper={mockPaper}
      onClose={() => {}}
      onUpdate={() => {}}
      papers={[mockPaper]}
    />
  );
  
  // Click highlight mode
  fireEvent.click(screen.getByTitle('Highlight Mode'));
  
  // Simulate text selection (mock)
  // ...
  
  // Verify highlight was created
  expect(screen.getByText(/highlighted text/i)).toBeInTheDocument();
});
```

## Performance Optimization

### Lazy Load Annotations

```typescript
const [highlights, setHighlights] = useState<Highlight[]>([]);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  // Only load when reader is opened
  if (paper.id && !loaded) {
    const h = loadHighlights(paper.id);
    setHighlights(h);
    setLoaded(true);
  }
}, [paper.id, loaded]);
```

### Debounce Save Operations

```typescript
import { useDebounce } from './hooks/useDebounce';

const debouncedHighlights = useDebounce(highlights, 1000);

useEffect(() => {
  saveHighlights(paper.id, debouncedHighlights);
}, [debouncedHighlights, paper.id]);
```

### Virtualize Large Annotation Lists

```typescript
import { FixedSizeList } from 'react-window';

const AnnotationList = ({ highlights }: { highlights: Highlight[] }) => (
  <FixedSizeList
    height={600}
    itemCount={highlights.length}
    itemSize={100}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <HighlightCard highlight={highlights[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

## Migration from Old Reader

If you have existing papers with the old Reader component:

1. **Backup existing data:**
   ```bash
   # Export from browser console
   const data = {};
   for (let i = 0; i < localStorage.length; i++) {
     const key = localStorage.key(i);
     if (key.startsWith('highlights-') || key.startsWith('postits-')) {
       data[key] = localStorage.getItem(key);
     }
   }
   console.log(JSON.stringify(data));
   ```

2. **Test with a few papers first**

3. **Gradually roll out to all users**

4. **Keep old Reader as fallback:**
   ```typescript
   {selectedPaper && (
     useNewReader ? (
       <EnhancedReader {...props} />
     ) : (
       <Reader {...props} />
     )
   )}
   ```

## Next Steps

1. ✅ Test all features thoroughly
2. ✅ Customize colors and categories to your needs
3. ✅ Add cloud sync (optional)
4. ✅ Implement analytics for annotation usage
5. ✅ Consider collaboration features
6. ✅ Add export to more formats (PDF annotations, Hypothesis)

## Support

For issues or questions:
- Check the **HIGHLIGHTING_NOTES_GUIDE.md** for user documentation
- Review component code for implementation details
- Open an issue on GitHub with reproduction steps

---

**Happy annotating! 📝✨**