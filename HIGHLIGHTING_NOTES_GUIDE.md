# Highlighting and Note-Taking System Guide

This guide explains the comprehensive highlighting and note-taking features implemented in Paper-Vault.

## Overview

The system provides three main annotation capabilities:

1. **Text Highlighting** - Mark important passages with category-specific colors
2. **Sticky Notes** - Add floating notes anywhere on the PDF
3. **Structured Notes** - Organize notes by research categories

## Features

### Text Highlighting

#### Creating Highlights

1. Click the **Highlighter** button in the toolbar
2. Select a category from the dropdown:
   - **General** (Yellow) - Default for any content
   - **Methodology** (Cyan) - Methods and experimental procedures
   - **Results** (Lime Green) - Findings and data
   - **Related Work** (Purple) - Citations and references
   - **Discussion** (Orange) - Interpretations and implications
   - **Limitation** (Red) - Study limitations and caveats
3. Select text in the PDF by clicking and dragging
4. The text is automatically highlighted with the selected category color

#### Managing Highlights

- **View**: Click on any highlight in the PDF to jump to its page
- **Add Notes**: Click the edit icon on any highlight in the sidebar to add contextual notes
- **Delete**: Click the trash icon to remove a highlight
- **Filter**: Use the category dropdown to filter highlights by type
- **Search**: Use the search bar to find highlights by text content
- **Export**: Click the download button to export all highlights as Markdown

### Sticky Notes

#### Creating Sticky Notes

1. Click the **Sticky Note** button in the toolbar
2. Click anywhere on the PDF where you want to place the note
3. Type your note content in the text area
4. The note auto-saves as you type

#### Customizing Sticky Notes

- **Change Color**: Hover over a note and click one of the color circles at the top
  - Yellow (default)
  - Pink
  - Blue
  - Green
  - Purple
  - Orange
- **Move**: Drag notes by the grip handle that appears on hover
- **Delete**: Click the X button in the top-right corner

### Structured Notes

The **Notes** sidebar tab provides organized sections for systematic note-taking:

- **Research Question** - The main question addressed
- **Methods** - Experimental approaches and procedures
- **Results** - Key findings and data
- **Conclusions** - Main takeaways
- **Limitations** - Study weaknesses and constraints
- **Future Work** - Suggested next steps

Notes are automatically saved and synced to the paper record.

## Keyboard Shortcuts

- `1` - Switch to Read mode
- `2` - Switch to Highlight mode
- `3` - Switch to Sticky Note mode
- `←/→` - Previous/Next page
- `+/-` - Zoom in/out
- `Cmd/Ctrl + F` - Open full-text search

## Sidebar Navigation

The right sidebar has three tabs:

### 1. TOC (Table of Contents)
- Displays the PDF's document outline
- Click any heading to jump to that section
- Shows current page indicator

### 2. Notes
- Structured note-taking interface
- Organized by research categories
- Auto-saves all changes

### 3. Annotations
- Unified view of all highlights and sticky notes
- Two sub-tabs: **Highlights** and **Notes**
- Grouped by category for easy navigation
- Search and filter capabilities
- Quick navigation to annotated pages
- Export functionality

## Search Functionality

### Full-Text Search
- Located below the toolbar
- Searches all text content in the PDF
- Shows context around matches
- Click any result to jump to that page
- Highlights the search term on the page

### Annotation Search
- Available in the Annotations sidebar
- Searches both highlight text and attached notes
- Real-time filtering as you type
- Preserves category grouping

## Export Options

### Export Highlights to Markdown

1. Open the Annotations sidebar
2. Click the **Download** button
3. A Markdown file is generated with:
   - All highlights grouped by category
   - Page numbers for each highlight
   - Attached notes (if any)
   - Properly formatted for easy reading

Example output:
```markdown
# Highlights: Paper Title

## Methodology

> **Page 3**: "We used a double-blind randomized controlled trial..."
> *Note: Important methodology detail*

## Results

> **Page 8**: "Significant improvement was observed (p < 0.01)..."
```

## Data Persistence

All annotations are stored locally in browser localStorage:

- **Highlights**: `highlights-{paperId}`
- **Sticky Notes**: `postits-{paperId}`
- **Structured Notes**: Synced to Paper object in Firebase

### Backup and Sync

To ensure your annotations are backed up:

1. Export highlights regularly using the export function
2. Structured notes are automatically saved to Firebase
3. Consider implementing cloud sync for highlights and sticky notes (future enhancement)

## Technical Implementation

### Component Structure

```
EnhancedReader (Main container)
├── Toolbar (Mode selection and controls)
├── FullTextSearch (PDF content search)
├── Document/Page (react-pdf)
├── HighlightLayer (Overlay for highlights)
├── PostItLayer (Overlay for sticky notes)
└── Sidebar
    ├── TableOfContents
    ├── StructuredNotes
    └── AnnotationsSidebar
        ├── Highlights tab
        └── Notes tab
```

### Key Files

- **`src/components/EnhancedReader.tsx`** - Main reader component with all features
- **`src/components/HighlightLayer.tsx`** - Renders highlight overlays
- **`src/components/PostItLayer.tsx`** - Renders sticky note overlays
- **`src/components/AnnotationsSidebar.tsx`** - Manages annotation display and interaction
- **`src/utils/highlightUtils.ts`** - Utility functions for annotations
- **`src/types.ts`** - TypeScript type definitions

### Utilities

The `highlightUtils.ts` file provides:

- `createHighlightFromSelection()` - Creates highlight from text selection
- `createPostIt()` - Creates a sticky note
- `getCategoryColor()` - Gets color for category
- `saveHighlights/loadHighlights()` - Persistence functions
- `exportHighlightsToMarkdown()` - Export functionality
- `searchHighlights()` - Search annotations
- `countHighlightsByCategory()` - Statistics

## Best Practices

### For Efficient Highlighting

1. **Use Categories Consistently**
   - Methodology: experimental details, procedures
   - Results: data, findings, statistics
   - Related Work: citations, prior research
   - Discussion: interpretations, implications
   - Limitation: caveats, weaknesses
   - General: everything else

2. **Add Notes to Highlights**
   - Explain why the passage is important
   - Link to other papers or ideas
   - Add your own interpretations

3. **Use Sticky Notes for**
   - Marginal comments
   - Questions to investigate
   - Ideas for future research
   - Connections between sections

### For Structured Notes

1. **Be Concise** - Bullet points work better than paragraphs
2. **Be Specific** - Include enough detail to remember later
3. **Cross-Reference** - Link to specific pages or highlights
4. **Update Regularly** - Revise as your understanding evolves

## Troubleshooting

### Highlights not appearing?
- Ensure you're in Highlight mode (button is highlighted black)
- Text selection must be within the PDF page boundaries
- Try refreshing the page if highlights seem "stuck"

### Sticky notes not saving?
- Notes auto-save on blur (when you click away)
- Check browser console for any errors
- Verify localStorage is not full

### Export not working?
- Check if popups are blocked in your browser
- Verify you have highlights to export
- Try a different browser if issues persist

### Performance issues?
- Large PDFs may slow down with many annotations
- Consider splitting very long papers into sections
- Close other browser tabs to free up memory

## Future Enhancements

Planned improvements:

1. **Cloud Sync** - Sync annotations across devices via Firebase
2. **Collaboration** - Share annotations with others
3. **Smart Highlights** - AI-suggested important passages
4. **Drawing Tools** - Annotate diagrams and figures
5. **Citation Integration** - Link highlights to citations
6. **Annotation Templates** - Pre-defined note structures
7. **Version Control** - Track annotation history
8. **Import/Export** - Support for multiple formats (JSON, CSV, BibTeX)

## API Reference

### Creating a Highlight Programmatically

```typescript
import { createHighlightFromSelection } from './utils/highlightUtils';

const selection = window.getSelection();
const containerRect = containerRef.current.getBoundingClientRect();

const highlight = createHighlightFromSelection(
  selection,
  containerRect,
  scale,
  pageNumber,
  'methodology' // category
);

if (highlight) {
  setHighlights([...highlights, highlight]);
}
```

### Creating a Sticky Note Programmatically

```typescript
import { createPostIt } from './utils/highlightUtils';

const postit = createPostIt(
  x,      // X coordinate
  y,      // Y coordinate
  pageNumber,
  scale,
  { name: 'yellow', class: 'bg-yellow-200', hex: '#fef08a' } // optional color
);

setPostits([...postits, postit]);
```

### Exporting Highlights

```typescript
import { exportHighlightsToMarkdown } from './utils/highlightUtils';

const markdown = exportHighlightsToMarkdown(highlights, paper.title);
const blob = new Blob([markdown], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
// Download or display the markdown
```

## Contributing

To extend the highlighting and note-taking system:

1. Follow the existing component structure
2. Use the utility functions in `highlightUtils.ts`
3. Maintain TypeScript types in `types.ts`
4. Add tests for new functionality
5. Update this documentation

## License

This highlighting system is part of Paper-Vault and follows the same license.

---

**Need Help?** Open an issue on GitHub with:
- Browser version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)