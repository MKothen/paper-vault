# Paper Vault - Features Summary

## 🎉 What's New

Your paper-vault has been enhanced with powerful new features for managing academic papers!

---

## 🚀 Quick Start

### Activate All Features

```bash
# Backup your current App.tsx
mv src/App.tsx src/App-original.tsx

# Activate the enhanced version
mv src/App-enhanced-integrated.tsx src/App.tsx

# Restart your dev server
npm run dev
```

That's it! All features are now active.

---

## ✨ Feature Highlights

### 1. 🔍 Smart PDF Upload with Auto-Detection

**What it does**: Automatically extracts metadata when you upload PDFs

**Features**:
- Detects DOI from PDF text
- Fetches citation counts from Semantic Scholar
- Generates thumbnail preview from first page
- Calculates hash for duplicate detection
- Extracts title, authors, and keywords

**How to use**:
1. Drag and drop PDF into upload zone
2. System automatically analyzes the file
3. See toast notifications for DOI detection and citation counts
4. Paper appears with thumbnail and citation count

---

### 2. ⚠️ Duplicate Detection

**What it does**: Warns you when uploading papers you already have

**Detection methods**:
- Exact match: PDF file hash comparison
- Similar match: Title similarity (85% threshold using Levenshtein distance)
- DOI match: Same digital identifier

**How to use**:
- Automatically runs on every upload
- Warning toast appears if duplicate found
- Shows title of existing paper

---

### 3. 📚 BibTeX Import

**What it does**: Import paper metadata from BibTeX entries

**Supported fields**:
- Title, authors, year, venue
- Abstract, DOI, keywords
- Journal, volume, issue, pages
- arXiv ID, PubMed ID

**How to use**:
1. Switch to "Manual Entry" mode
2. Click "BibTeX" button (orange)
3. Paste your BibTeX entry
4. Click "Import"
5. All fields auto-populate!

**Example BibTeX**:
```bibtex
@article{hodgkin1952quantitative,
  title={A quantitative description of membrane current},
  author={Hodgkin, Alan L and Huxley, Andrew F},
  journal={The Journal of physiology},
  volume={117},
  number={4},
  pages={500},
  year={1952}
}
```

---

### 4. 📊 Citation Count Integration

**What it does**: Shows how many times each paper has been cited

**Data source**: Semantic Scholar API

**Where it appears**:
- Paper cards show citation badge: 📚 42 citations
- Automatically fetched during upload if DOI found
- Can fetch manually via DOI input

**How to use**:
- Automatic: Upload PDF with DOI
- Manual: Paste DOI and click "Auto-Fill"
- Citation count appears on card

---

### 5. 🖼️ PDF Thumbnail Cache

**What it does**: Shows preview image of first page on paper cards

**Benefits**:
- Visual identification of papers
- Faster browsing of large libraries
- Confirms correct PDF uploaded

**How it works**:
- Generated automatically during upload
- Stored as base64 image in Firebase
- Appears at top of paper cards

---

### 6. 📈 Reading Analytics Dashboard

**What it shows**:
- **Total papers read**: Your lifetime count
- **Current streak**: Consecutive days reading 🔥
- **Longest streak**: Your personal best
- **Total reading time**: All time spent reading
- **This week/month**: Recent activity
- **Top tags**: Most used categories
- **Top methods**: Most common experimental techniques
- **Top organisms**: Most studied species

**How to use**:
1. Click "Analytics" button in header
2. View your reading statistics
3. See tag frequency visualization
4. Track your reading habits

---

### 7. 🧪 Enhanced Metadata Fields

**New trackable fields**:

#### Methods 🔬
- Tag papers by experimental techniques
- Examples: "Patch-clamp", "fMRI", "Western blot", "RNA-seq"
- Filter papers by method

#### Model Organisms 🐁
- Track species studied
- Examples: "Mouse", "Drosophila", "C. elegans", "Human"
- Find all papers on specific organisms

#### Star Rating ⭐
- Rate papers 1-5 stars
- Mark importance or quality
- Sort by rating

#### Detailed Metadata
- DOI, PubMed ID, arXiv ID
- Journal, volume, issue, pages
- Publisher, ISSN, language
- Keywords and structured notes

**How to use**:
1. Click edit (pencil icon) on any paper
2. Scroll to new sections
3. Add methods, organisms, or rating
4. Save changes

---

## 📝 Usage Examples

### Example 1: Upload PDF with DOI

1. Drop `hodgkin_huxley_1952.pdf` into upload zone
2. System detects: `DOI: 10.1113/jphysiol.1952.sp004764`
3. Toast: "🔎 DOI detected: 10.1113/jphysiol.1952.sp004764"
4. System fetches from Semantic Scholar
5. Toast: "✅ Metadata & citations retrieved!"
6. Paper added with:
   - Citation count: 12,345
   - Thumbnail preview
   - Auto-extracted title

### Example 2: Import from BibTeX

1. Click "Manual Entry" tab
2. Click "BibTeX" button
3. Paste your reference manager export
4. Click "Import"
5. All fields populated!
6. Add paper with one click

### Example 3: Organize by Method

1. Edit multiple papers
2. Add method tags: "Electrophysiology", "Immunohistochemistry"
3. View Analytics dashboard
4. See "Top Methods" section
5. Find patterns in your research

---

## 🛠️ Technical Details

### New Utility Modules

#### `src/utils/pdfUtils.ts`
- `generatePDFThumbnail()` - Create preview images
- `extractPDFText()` - Full-text extraction for search
- `calculatePDFHash()` - SHA-256 for duplicate detection
- `findDuplicatePapers()` - Similarity detection
- `extractPDFOutline()` - Table of contents
- `getPDFPageCount()` - Page counting

#### `src/utils/citationUtils.ts`
- `fetchSemanticScholarData()` - API integration
- `parseBibTeX()` - BibTeX parser
- `generateBibTeX()` - BibTeX generator
- `formatCitation()` - APA/MLA/Chicago formatting
- `extractDOI()` - DOI extraction from text
- `extractArXivId()` - arXiv ID extraction
- `extractPubMedId()` - PubMed ID extraction

#### `src/utils/analyticsUtils.ts`
- `calculateReadingStats()` - Comprehensive metrics
- `calculateReadingStreaks()` - Day-by-day tracking
- `calculateMonthlyReadings()` - Time-series data
- `formatReadingTime()` - Human-readable time
- `getTopItems()` - Frequency analysis
- `calculateReadingVelocity()` - Papers per week
- `estimateCompletionTime()` - Backlog projection

### Enhanced Data Model

```typescript
interface Paper {
  // Existing fields
  id: string;
  title: string;
  authors: string;
  year: string;
  tags: string[];
  
  // NEW fields
  methods?: string[];           // Experimental methods
  organisms?: string[];         // Model organisms
  rating?: number;              // 1-5 stars
  doi?: string;                 // DOI identifier
  citationCount?: number;       // From Semantic Scholar
  pdfHash?: string;             // For duplicates
  thumbnailUrl?: string;        // Preview image
  semanticScholarId?: string;   // SS paper ID
  
  // Additional metadata
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  keywords?: string[];
  pmid?: string;                // PubMed ID
  arxivId?: string;             // arXiv ID
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Q: Thumbnails not showing?**  
A: Check that PDF.js worker is loaded correctly. Clear cache and reload.

**Q: Semantic Scholar API not working?**  
A: API is rate-limited. Wait a minute between requests. Verify DOI format.

**Q: BibTeX parsing fails?**  
A: Ensure proper formatting with matching braces. Test with simple entry first.

**Q: Duplicate detection missing papers?**  
A: Detection uses 85% similarity threshold. Adjust in `pdfUtils.ts` if needed.

**Q: Analytics not calculating?**  
A: Ensure papers have `lastReadAt` timestamps. Mark papers as "read" first.

---

## 🔮 Future Enhancements

### Coming Soon
- 🔍 Full-text PDF search across entire library
- 🔗 Citation network visualization
- 🤖 AI-powered paper summaries
- 📚 Literature review mode
- 🎯 Related paper recommendations
- 📄 Annotation export to Markdown
- 👥 Author collaboration network
- 📅 Reading schedule planner

### Contribute Ideas
Open an issue on GitHub with your feature requests!

---

## 📚 Resources

### Documentation
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Detailed integration steps
- [README.md](./README.md) - Project overview
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

### APIs Used
- [Semantic Scholar API](https://api.semanticscholar.org/) - Citation data
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Firebase](https://firebase.google.com/) - Storage & database

### Keyboard Shortcuts
- `H` - Toggle highlight mode (in reader)
- `N` - Add sticky note (in reader)
- `Ctrl/Cmd + F` - Search papers (coming soon)
- `G` then `A` - Go to analytics
- `G` then `G` - Go to graph

---

## 🚀 Performance Tips

1. **Thumbnails**: Generated once on upload, cached forever
2. **Citation data**: Fetched once, stored in Firestore
3. **Analytics**: Calculated on-demand, consider caching for large libraries
4. **PDF rendering**: Uses worker thread, non-blocking
5. **Duplicate detection**: O(n) complexity, fast for <1000 papers

---

## 🎓 Best Practices

### Organizing Your Library

1. **Use hierarchical tags**: `Neuroscience > Electrophysiology > Patch-clamp`
2. **Tag methods consistently**: Create a standard vocabulary
3. **Rate as you read**: Add stars immediately after finishing
4. **Add organisms early**: Tag during upload for better filtering
5. **Check duplicates**: Review warnings before dismissing

### Workflow Recommendations

1. **Morning routine**: Check analytics, see reading streak
2. **Weekly review**: Export BibTeX for citations
3. **Monthly analysis**: Review top tags, adjust research focus
4. **Before writing**: Use graph view to find connections
5. **Literature review**: Filter by method + organism

---

## ❤️ Credits

Built with:
- React + TypeScript
- Firebase (Auth, Firestore, Storage)
- PDF.js (Mozilla)
- Semantic Scholar API
- Tailwind CSS
- React DnD (drag and drop)
- React Force Graph

Special thanks to the open-source community!

---

## 💬 Support

Need help? 
- Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Open an issue on GitHub

---

**Happy researching! 🎉**