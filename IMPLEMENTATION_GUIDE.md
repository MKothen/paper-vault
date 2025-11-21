# PaperVault Enhancement Implementation Guide

This guide details all the new features added to PaperVault and how to implement them.

## 📦 New Dependencies

Add these to your `package.json`:

```bash
npm install react-window @types/react-window recharts fuse.js d3-hierarchy d3-scale
```

## 🗂️ New Files Created

### Type Definitions
- `src/types.ts` - Complete TypeScript interfaces
- `src/utils/semanticScholar.ts` - Citation data fetching
- `src/utils/bibtex.ts` - BibTeX parsing and generation
- `src/components/AnalyticsDashboard.tsx` - Reading statistics
- `src/components/MultiFilterSidebar.tsx` - Advanced filtering

## 🎯 Feature Implementation Checklist

### ✅ COMPLETED UTILITIES

#### 1. Enhanced Type System
- ✅ Extended Paper interface with new fields:
  - `rating` (1-5 stars)
  - `methods` (experimental methods array)
  - `organisms` (model organisms array)
  - `hypotheses` (research hypotheses array)
  - `citationCount` (from Semantic Scholar)
  - `doi` (Digital Object Identifier)
  - `lastReadAt` (timestamp)
  - `totalReadingTime` (seconds)
  - `readingStreak` (consecutive days)
  - `hierarchicalTags` (nested tag structure)
  - `citedBy` / `references` (citation network)
  - `thumbnailUrl` (cached PDF preview)
  - `structuredNotes` (template-based notes)

#### 2. Semantic Scholar Integration
- ✅ `fetchCitationData(doi)` - Get citation count and references
- ✅ `fetchRelatedPapers(paperId)` - Find similar papers
- ✅ `searchSemanticScholar(query)` - Search academic papers
- ✅ `fetchPaperByTitle(title)` - Lookup by title

#### 3. BibTeX Support
- ✅ `parseBibTeX(bibtex)` - Import from BibTeX
- ✅ `generateBibTeX(paper)` - Export to BibTeX

#### 4. Analytics Dashboard
- ✅ Total papers, papers read, reading time stats
- ✅ Monthly reading trends (line chart)
- ✅ Top tags frequency (bar chart)
- ✅ Status distribution (pie chart)
- ✅ Reading streak tracker with flame icon

#### 5. Multi-Filter Sidebar
- ✅ Year range slider
- ✅ Star rating filter
- ✅ Status checkboxes
- ✅ Tag multi-select
- ✅ Methods filter
- ✅ Organisms filter
- ✅ Venue filter
- ✅ Clear all button

## 🔨 IMPLEMENTATION STEPS

### Step 1: Update Firebase Schema

Add these fields to your existing papers in Firestore:

```javascript
// In your addDoc/updateDoc calls, include:
{
  // ... existing fields
  rating: 0,
  methods: [],
  organisms: [],
  hypotheses: [],
  citationCount: 0,
  doi: '',
  lastReadAt: null,
  totalReadingTime: 0,
  hierarchicalTags: [],
  citedBy: [],
  references: [],
  thumbnailUrl: '',
  structuredNotes: {
    researchQuestion: '',
    methods: '',
    results: '',
    conclusions: '',
    limitations: '',
    futureWork: ''
  }
}
```

### Step 2: Add Enhanced Metadata Modal

Update `PaperDetailsModal` component to include new fields:

```tsx
// Add these input sections to the modal:

{/* Star Rating */}
<label className="font-bold block">Rating</label>
<div className="flex gap-1">
  {[1, 2, 3, 4, 5].map(star => (
    <button
      key={star}
      onClick={() => setFormData({ ...formData, rating: star })}
      className="p-2 border-2 border-black"
    >
      <Star 
        size={20} 
        fill={star <= (formData.rating || 0) ? '#FFD90F' : 'none'} 
        strokeWidth={2}
      />
    </button>
  ))}
</div>

{/* Methods */}
<label className="font-bold block">Methods</label>
<TagInput 
  tags={formData.methods || []} 
  setTags={(methods) => setFormData({ ...formData, methods })} 
  allTags={['Electrophysiology', 'Imaging', 'Behavioral', 'Molecular', 'Computational']}
  placeholder="Add method..."
/>

{/* Model Organisms */}
<label className="font-bold block">Model Organisms</label>
<TagInput 
  tags={formData.organisms || []} 
  setTags={(organisms) => setFormData({ ...formData, organisms })} 
  allTags={['Mouse', 'Rat', 'Zebrafish', 'C. elegans', 'Drosophila', 'Human']}
  placeholder="Add organism..."
/>

{/* Hypotheses */}
<label className="font-bold block">Hypotheses</label>
<textarea 
  className="nb-input" 
  rows={3} 
  value={formData.hypotheses?.join('\n') || ''} 
  onChange={e => setFormData({ 
    ...formData, 
    hypotheses: e.target.value.split('\n').filter(Boolean) 
  })}
  placeholder="One hypothesis per line..."
/>

{/* DOI with Citation Fetch */}
<label className="font-bold block">DOI</label>
<div className="flex gap-2">
  <input 
    className="nb-input flex-1" 
    value={formData.doi || ''} 
    onChange={e => setFormData({ ...formData, doi: e.target.value })}
    placeholder="10.xxxx/xxxxx"
  />
  <button 
    onClick={async () => {
      if (formData.doi) {
        const data = await fetchCitationData(formData.doi);
        if (data) {
          setFormData({ 
            ...formData, 
            citationCount: data.citationCount,
            references: data.references.map(r => r.paperId),
            citedBy: data.citations.map(c => c.paperId)
          });
          addToast(`Citations: ${data.citationCount}`, 'success');
        }
      }
    }}
    className="nb-button bg-nb-purple"
  >
    <Wand2 size={16} /> Fetch
  </button>
</div>

{/* Show Citation Count */}
{formData.citationCount > 0 && (
  <div className="bg-nb-lime p-2 border-2 border-black">
    <p className="font-bold text-sm">📊 {formData.citationCount} citations</p>
  </div>
)}
```

### Step 3: Integrate Analytics View

Add analytics as a new view option:

```tsx
// In your App component state:
const [activeView, setActiveView] = useState<'library' | 'graph' | 'timeline' | 'reader' | 'analytics'>('library');

// In header:
<button 
  onClick={() => setActiveView('analytics')} 
  className="nb-button flex gap-2"
>
  <TrendingUp strokeWidth={3} /> Analytics
</button>

// Add view renderer:
if (activeView === 'analytics') {
  return (
    <div className="h-screen flex flex-col bg-nb-gray">
      <SharedUI />
      <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
        <button onClick={() => setActiveView('library')} className="nb-button flex gap-2">
          <ChevronLeft /> Back
        </button>
        <h1 className="text-3xl font-black uppercase">Reading Analytics</h1>
      </div>
      <AnalyticsDashboard papers={papers} sessions={readingSessions} />
    </div>
  );
}
```

### Step 4: Add Filter Sidebar to Library

```tsx
// Add state:
const [showFilters, setShowFilters] = useState(false);
const [filters, setFilters] = useState<FilterState>({
  searchTerm: '',
  tags: [],
  yearRange: [2000, new Date().getFullYear()],
  venues: [],
  authors: [],
  status: [],
  colors: [],
  methods: [],
  organisms: [],
  rating: null
});

// Apply filters:
const filteredPapers = useMemo(() => {
  return papers.filter(p => {
    // Search term
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && 
          !p.tags?.some(t => t.toLowerCase().includes(q))) {
        return false;
      }
    }
    
    // Year range
    const year = parseInt(p.year);
    if (!isNaN(year) && (year < filters.yearRange[0] || year > filters.yearRange[1])) {
      return false;
    }
    
    // Rating
    if (filters.rating && (p.rating || 0) < filters.rating) {
      return false;
    }
    
    // Status
    if (filters.status.length > 0 && !filters.status.includes(p.status)) {
      return false;
    }
    
    // Tags
    if (filters.tags.length > 0 && !filters.tags.some(t => p.tags?.includes(t))) {
      return false;
    }
    
    // Methods
    if (filters.methods.length > 0 && !filters.methods.some(m => p.methods?.includes(m))) {
      return false;
    }
    
    // Organisms
    if (filters.organisms.length > 0 && !filters.organisms.some(o => p.organisms?.includes(o))) {
      return false;
    }
    
    return true;
  });
}, [papers, filters]);

// In library view:
<div className="flex-1 flex">
  <div className="flex-1 overflow-x-auto">
    {/* Kanban board with filteredPapers */}
  </div>
  {showFilters && (
    <MultiFilterSidebar 
      filters={filters}
      setFilters={setFilters}
      papers={papers}
      onClose={() => setShowFilters(false)}
    />
  )}
</div>
```

### Step 5: Enhanced Graph with Clustering

Update graph to show citation relationships:

```tsx
const graphData = useMemo(() => {
  const nodes = papers.map(p => ({ 
    id: p.id, 
    label: p.title,
    color: COLORS.find(c => c.class === p.color)?.hex || '#FFD90F',
    citationCount: p.citationCount || 0,
    methods: p.methods || [],
    organisms: p.organisms || []
  }));
  
  const links: any[] = [];
  
  // Tag-based connections (existing)
  papers.forEach((p1, i) => {
    papers.slice(i + 1).forEach(p2 => {
      const sharedTags = p1.tags?.filter(t => p2.tags?.includes(t));
      const sharedMethods = p1.methods?.filter(m => p2.methods?.includes(m));
      const sharedOrganisms = p1.organisms?.filter(o => p2.organisms?.includes(o));
      
      const strength = (sharedTags?.length || 0) + 
                      (sharedMethods?.length || 0) + 
                      (sharedOrganisms?.length || 0);
      
      if (strength > 0) {
        links.push({ 
          source: p1.id, 
          target: p2.id, 
          strength,
          type: 'similarity'
        });
      }
    });
  });
  
  // Citation-based connections (new)
  papers.forEach(p1 => {
    p1.references?.forEach(refId => {
      const target = papers.find(p => p.id === refId);
      if (target) {
        links.push({
          source: p1.id,
          target: refId,
          strength: 3,
          type: 'citation'
        });
      }
    });
  });
  
  return { nodes, links };
}, [papers]);

// Update link rendering:
<ForceGraph2D
  // ... existing props
  linkWidth={link => link.strength}
  linkColor={link => link.type === 'citation' ? '#ef4444' : '#4b5563'}
  linkDirectionalArrowLength={link => link.type === 'citation' ? 3 : 0}
  linkDirectionalArrowRelPos={1}
/>
```

### Step 6: Structured Notes Template

Add to reader sidebar:

```tsx
// Add tab system in sidebar:
const [sidebarTab, setSidebarTab] = useState<'annotations' | 'notes'>('annotations');

<div className="flex border-b-4 border-black">
  <button 
    onClick={() => setSidebarTab('annotations')}
    className={`flex-1 p-2 font-black uppercase ${
      sidebarTab === 'annotations' ? 'bg-nb-yellow' : 'bg-gray-100'
    }`}
  >
    Annotations
  </button>
  <button 
    onClick={() => setSidebarTab('notes')}
    className={`flex-1 p-2 font-black uppercase ${
      sidebarTab === 'notes' ? 'bg-nb-yellow' : 'bg-gray-100'
    }`}
  >
    Notes
  </button>
</div>

{sidebarTab === 'notes' && (
  <div className="p-4 space-y-4">
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Research Question</label>
      <textarea 
        className="nb-input text-sm" 
        rows={2}
        value={selectedPaper.structuredNotes?.researchQuestion || ''}
        onChange={e => updatePaperNotes('researchQuestion', e.target.value)}
      />
    </div>
    
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Methods</label>
      <textarea 
        className="nb-input text-sm" 
        rows={3}
        value={selectedPaper.structuredNotes?.methods || ''}
        onChange={e => updatePaperNotes('methods', e.target.value)}
      />
    </div>
    
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Key Results</label>
      <textarea 
        className="nb-input text-sm" 
        rows={3}
        value={selectedPaper.structuredNotes?.results || ''}
        onChange={e => updatePaperNotes('results', e.target.value)}
      />
    </div>
    
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Conclusions</label>
      <textarea 
        className="nb-input text-sm" 
        rows={2}
        value={selectedPaper.structuredNotes?.conclusions || ''}
        onChange={e => updatePaperNotes('conclusions', e.target.value)}
      />
    </div>
    
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Limitations</label>
      <textarea 
        className="nb-input text-sm" 
        rows={2}
        value={selectedPaper.structuredNotes?.limitations || ''}
        onChange={e => updatePaperNotes('limitations', e.target.value)}
      />
    </div>
    
    <div>
      <label className="font-bold text-xs uppercase block mb-1">Future Work</label>
      <textarea 
        className="nb-input text-sm" 
        rows={2}
        value={selectedPaper.structuredNotes?.futureWork || ''}
        onChange={e => updatePaperNotes('futureWork', e.target.value)}
      />
    </div>
  </div>
)}
```

### Step 7: Enhanced Highlights with Categories

```tsx
const HIGHLIGHT_CATEGORIES = [
  { id: 'methodology', name: 'Methods', color: '#22d3ee' },
  { id: 'results', name: 'Results', color: '#a3e635' },
  { id: 'related-work', name: 'Related', color: '#c084fc' },
  { id: 'discussion', name: 'Discussion', color: '#fb923c' },
  { id: 'limitation', name: 'Limits', color: '#ef4444' },
  { id: 'general', name: 'General', color: '#FFD90F' }
];

// Add category selector to reader toolbar:
<select 
  value={selectedCategory}
  onChange={e => setSelectedCategory(e.target.value)}
  className="nb-input text-xs"
>
  {HIGHLIGHT_CATEGORIES.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>

// When creating highlight, add category:
const newHighlight = {
  // ... existing fields
  category: selectedCategory,
  note: ''
};
```

### Step 8: Virtual Scrolling for Kanban

Replace paper lists with virtual scrolling:

```tsx
import { FixedSizeList as List } from 'react-window';

// In each Kanban column:
<List
  height={600}
  itemCount={columns[status].length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => {
    const paper = columns[status][index];
    return (
      <div style={style}>
        <Draggable key={paper.id} draggableId={paper.id} index={index}>
          {/* Paper card */}
        </Draggable>
      </div>
    );
  }}
</List>
```

### Step 9: Dark Mode Extension

Add dark mode toggle to all views:

```tsx
// In App state:
const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem('darkMode') === 'true';
});

// Persist preference:
useEffect(() => {
  localStorage.setItem('darkMode', darkMode.toString());
  document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);

// Wrap all views:
<div className={darkMode ? 'dark' : ''}>
  {/* content */}
</div>
```

### Step 10: PDF Thumbnails

Generate and cache first page:

```tsx
const generateThumbnail = async (pdfUrl: string, paperId: string) => {
  const loadingTask = pdfjs.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 0.2 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({ canvasContext: context!, viewport }).promise;
  
  const thumbnailDataUrl = canvas.toDataURL();
  
  // Store in Firebase or localStorage
  localStorage.setItem(`thumbnail-${paperId}`, thumbnailDataUrl);
  
  return thumbnailDataUrl;
};
```

## 🎨 UI Enhancements

### Literature Review Mode

Add special view for comparing multiple papers:

```tsx
if (activeView === 'literature-review') {
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="p-4 border-b-4 border-black">
        <h1 className="text-2xl font-black uppercase">Literature Review</h1>
        <p className="text-sm font-bold text-gray-600">Select papers to compare</p>
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-4 p-4">
        {selectedForReview.map(paper => (
          <div key={paper.id} className="nb-card p-4">
            <h3 className="font-black text-lg mb-2">{paper.title}</h3>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-bold">Methods: </span>
                {paper.methods?.join(', ')}
              </div>
              
              <div>
                <span className="font-bold">Organisms: </span>
                {paper.organisms?.join(', ')}
              </div>
              
              <div>
                <span className="font-bold">Key Finding: </span>
                {paper.structuredNotes?.results}
              </div>
              
              <div>
                <span className="font-bold">Limitations: </span>
                {paper.structuredNotes?.limitations}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Duplicate Detection

```tsx
const checkDuplicates = (newTitle: string, newDoi?: string) => {
  const duplicates = papers.filter(p => {
    // Exact title match
    if (p.title.toLowerCase() === newTitle.toLowerCase()) return true;
    
    // DOI match
    if (newDoi && p.doi && p.doi === newDoi) return true;
    
    // Similar title (fuzzy match)
    const similarity = calculateSimilarity(p.title, newTitle);
    if (similarity > 0.8) return true;
    
    return false;
  });
  
  if (duplicates.length > 0) {
    addToast(
      `⚠️ Possible duplicate: "${duplicates[0].title}"`,
      'warning'
    );
  }
};
```

## 🚀 Quick Wins

Easy additions that provide immediate value:

```tsx
// 1. Copy DOI button
<button 
  onClick={() => {
    navigator.clipboard.writeText(paper.doi || '');
    addToast('DOI copied!', 'success');
  }}
  className="nb-button text-xs"
>
  Copy DOI
</button>

// 2. Sort papers in columns
<select onChange={e => setSortBy(e.target.value)}>
  <option value="date">Date Added</option>
  <option value="title">Title</option>
  <option value="year">Year</option>
  <option value="rating">Rating</option>
</select>

// 3. Recent papers widget
<div className="bg-white border-4 border-black p-4 mb-4">
  <h3 className="font-black uppercase mb-2">Recently Added</h3>
  {papers
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map(p => (
      <div key={p.id} className="text-sm font-bold py-1">
        {p.title}
      </div>
    ))}
</div>
```

## 📝 Next Steps

1. **Install dependencies**: `npm install`
2. **Update Firestore rules** to allow new fields
3. **Migrate existing data** to include new fields
4. **Test each feature** individually
5. **Deploy** incrementally

## 🐛 Known Considerations

- **Semantic Scholar API** has rate limits (100 requests/5 minutes)
- **PDF.js** can be memory-intensive with many pages
- **Virtual scrolling** requires fixed item heights
- **LocalStorage** has 5-10MB limit per domain

## 💡 Future Enhancements

- Export highlights to Markdown/Notion
- AI-powered paper summarization
- Collaborative annotations
- Zotero sync integration
- Mobile app version

All features are modular and can be implemented incrementally!
