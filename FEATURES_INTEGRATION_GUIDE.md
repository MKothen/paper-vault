# Gain-of-Function Features Integration Guide

This guide explains how to integrate the newly implemented features into your PaperVault application.

## ✅ Already Implemented & Integrated

### 1. Table of Contents (TOC)
- **Component**: `TableOfContents.tsx`
- **Location**: Integrated into `Reader.tsx` sidebar
- **Usage**: Click the "TOC" tab in the PDF reader to see the document outline and jump to sections
- **Status**: ✅ Fully integrated

### 2. Full-Text PDF Search
- **Component**: `FullTextSearch.tsx`
- **Location**: Integrated into `Reader.tsx` as search bar above PDF
- **Usage**: Type search query and press Enter to find text within the PDF
- **Status**: ✅ Fully integrated

### 3. Related Work Finder
- **Component**: `RelatedWorkFinder.tsx`
- **Location**: Already imported in `App.tsx`
- **Usage**: Shows papers that cite the current paper using Semantic Scholar API
- **Status**: ✅ Component exists and is imported

---

## 🔧 Features Ready to Integrate

The following components are created but need to be added to your UI:

### 4. Author Network Graph

**Component**: `AuthorNetwork.tsx`

**What it does**: Visualizes co-authorship relationships between authors in your library. Authors are nodes, co-authorships are links.

**Where to integrate**: Add as a new view mode in your dashboard

**Integration steps**:

1. Open `src/App.tsx`
2. Import the component:
```typescript
import { AuthorNetwork } from './components/AuthorNetwork';
```

3. Add a new view mode button in your dashboard toolbar (next to Board/Graph/Timeline):
```typescript
<button onClick={() => setViewMode('authors')} className={...}>
  <Users size={18} /> {/* Import Users from lucide-react */}
</button>
```

4. Add the view case in your `renderContent()` function:
```typescript
if (viewMode === 'authors') {
  return (
    <AuthorNetwork 
      papers={filteredPapers}
      onAuthorClick={(authorName) => {
        // Filter papers by this author
        setSearchQuery(authorName);
      }}
    />
  );
}
```

---

### 5. Tag Cloud

**Component**: `TagCloud.tsx`

**What it does**: Displays all tags with font size proportional to frequency (like a traditional word cloud).

**Where to integrate**: Add to Analytics/Dashboard view

**Integration steps**:

1. Open `src/App.tsx` (or your Analytics component)
2. Import:
```typescript
import { TagCloud } from './components/TagCloud';
```

3. Add below or beside your existing analytics/charts:
```typescript
<TagCloud 
  papers={papers}
  onTagClick={(tag) => {
    // Filter papers by this tag
    setSearchQuery(tag);
  }}
/>
```

**Alternative**: Replace your existing bar chart with the Tag Cloud, or add a toggle to switch between views.

---

### 6. AI Summary Generation

**Component**: `AISummary.tsx`

**What it does**: Generates an extractive summary of a paper's abstract and key information.

**Where to integrate**: Add to Paper Details Modal or Reader sidebar

**Option A - In Paper Details Modal** (recommended):

1. Open your `PaperDetailsModal` component
2. Import:
```typescript
import { AISummary } from './components/AISummary';
```

3. Add as a new section in the modal:
```typescript
<div className="mt-6 border-t-2 border-black pt-4">
  <AISummary paper={paper} />
</div>
```

**Option B - In Reader Sidebar**:

1. Open `src/components/Reader.tsx`
2. Add a new sidebar tab "AI Summary"
3. Render `<AISummary paper={paper} />` when that tab is active

---

## 🚀 Quick Start Integration (All Features)

Here's example code to add all features to your main App.tsx:

```typescript
// src/App.tsx additions

import { AuthorNetwork } from './components/AuthorNetwork';
import { TagCloud } from './components/TagCloud';
import { AISummary } from './components/AISummary';
import { RelatedWorkFinder } from './components/RelatedWorkFinder';
import { Users } from 'lucide-react'; // For author network icon

// In your Dashboard component:

// 1. Add view modes
const [viewMode, setViewMode] = useState<'board' | 'graph' | 'timeline' | 'authors' | 'analytics'>('board');

// 2. Add toolbar buttons
<div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2 shadow-sm">
  <button onClick={() => setViewMode('board')} className={...}>
    <Layout size={18} />
  </button>
  <button onClick={() => setViewMode('graph')} className={...}>
    <Share2 size={18} />
  </button>
  <button onClick={() => setViewMode('timeline')} className={...}>
    <Clock size={18} />
  </button>
  <button onClick={() => setViewMode('authors')} className={...}>
    <Users size={18} />
  </button>
  <button onClick={() => setViewMode('analytics')} className={...}>
    <BarChart size={18} />
  </button>
</div>

// 3. Add view cases in renderContent()
const renderContent = () => {
  if (viewMode === 'board') {
    return <KanbanBoard ... />;
  }
  
  if (viewMode === 'graph') {
    return <PaperGraph ... />;
  }
  
  if (viewMode === 'timeline') {
    return <TimelineView ... />;
  }
  
  if (viewMode === 'authors') {
    return (
      <AuthorNetwork 
        papers={filteredPapers}
        onAuthorClick={(author) => setSearchQuery(author)}
      />
    );
  }
  
  if (viewMode === 'analytics') {
    return (
      <div className="space-y-6 p-6">
        <TagCloud 
          papers={papers}
          onTagClick={(tag) => setSearchQuery(tag)}
        />
        {/* Your existing analytics charts */}
      </div>
    );
  }
};

// 4. In PaperDetailsModal, add Related Work and AI Summary sections:
function PaperDetailsModal({ paper, onClose, onSave, onImport }) {
  return (
    <div className="modal-container">
      {/* Existing paper details form */}
      
      <div className="mt-6 border-t-4 border-black pt-4">
        <AISummary paper={paper} />
      </div>
      
      {paper.doi && (
        <div className="mt-6 border-t-4 border-black pt-4">
          <RelatedWorkFinder 
            currentPaper={paper}
            onImport={onImport}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Feature Summary

| Feature | Component | Status | Integration Complexity |
|---------|-----------|--------|------------------------|
| Related Work Finder | `RelatedWorkFinder.tsx` | ✅ Created | Low - Add to modal |
| Author Network | `AuthorNetwork.tsx` | ✅ Created | Low - Add view mode |
| Tag Cloud | `TagCloud.tsx` | ✅ Created | Low - Add to dashboard |
| Table of Contents | `TableOfContents.tsx` | ✅ Integrated | ✅ Complete |
| Full-Text Search | `FullTextSearch.tsx` | ✅ Integrated | ✅ Complete |
| AI Summary | `AISummary.tsx` | ✅ Created | Low - Add to modal |

---

## 🎨 UI/UX Notes

- **Neo-brutalist styling**: All new components follow your existing `nb-*` design system
- **Responsive**: Components adapt to different screen sizes
- **Interactive**: Click handlers are built-in for filtering and navigation
- **Performance**: Author network and tag cloud are memoized for efficiency

---

## 🔮 Future Enhancements

### AI Summary
- Replace extractive logic with actual AI API (OpenAI, Claude, local LLM)
- Add customizable summary length
- Support multiple summary styles (technical, layman, bullet points)

### Full-Text Search
- Add highlighting of search matches within PDF
- Support regex and Boolean operators
- Add search history

### Related Work Finder
- Expand to show references (papers this paper cites)
- Add similarity scoring
- Enable bulk import of related papers

### Author Network
- Add filtering by year/venue
- Show author productivity metrics
- Enable author profile cards with paper list

---

## 🐛 Troubleshooting

### "Cannot find module" errors
- Run `npm install` to ensure all dependencies are installed
- Check that imports match actual file locations

### Graph not rendering
- Ensure `react-force-graph-2d` is installed: `npm install react-force-graph-2d`
- Check browser console for specific errors

### PDF features not working
- Verify `pdfUtils.ts` contains `extractPDFText` and `extractPDFOutline` functions
- Check that PDF URLs are accessible
- Ensure `pdfjs-dist` is properly configured

---

## ✅ Checklist for Integration

- [ ] Import new components in `App.tsx`
- [ ] Add view mode buttons for Author Network
- [ ] Add Tag Cloud to analytics view
- [ ] Add AI Summary to Paper Details Modal
- [ ] Add Related Work Finder to Paper Details Modal
- [ ] Test each feature with sample data
- [ ] Verify all click handlers and filters work
- [ ] Check mobile responsiveness
- [ ] Update user documentation

---

Need help with integration? Check the inline comments in each component file for usage examples and prop definitions.
