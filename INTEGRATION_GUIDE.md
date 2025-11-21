# Integration Guide: Activating New Features

This guide explains how to integrate all the new features into your paper-vault application.

## 🎯 Quick Start

### Option 1: Use the Pre-Integrated Version (Recommended)

Rename your current `App.tsx` and use the new enhanced version:

```bash
mv src/App.tsx src/App-original-backup.tsx
mv src/App-enhanced-integrated.tsx src/App.tsx
```

That's it! All features are now active.

### Option 2: Manual Integration

If you prefer to integrate features into your existing App.tsx manually, follow the sections below.

---

## 📦 New Features Implemented

### 1. **BibTeX Import** ✅
- **Location**: Manual entry mode
- **How it works**: 
  - Click "BibTeX" button next to DOI input
  - Paste BibTeX entry in modal
  - Automatically fills all metadata fields
- **Implementation**:
  ```typescript
  import { parseBibTeX } from './utils/citationUtils';
  
  const handleBibtexImport = () => {
    const parsed = parseBibTeX(bibtexInput);
    if (parsed) {
      setNewTitle(parsed.title || "");
      setNewAuthors(parsed.authors || "");
      // ... etc
    }
  };
  ```

### 2. **Duplicate Detection** ✅
- **Location**: Automatically during upload and manual entry
- **How it works**:
  - Calculates PDF hash for exact duplicates
  - Uses Levenshtein distance for title similarity (85% threshold)
  - Shows warning toast if duplicate found
- **Implementation**:
  ```typescript
  import { findDuplicatePapers, calculatePDFHash } from './utils/pdfUtils';
  
  const pdfHash = await calculatePDFHash(file);
  const duplicates = findDuplicatePapers({ title, pdfHash }, papers);
  if (duplicates.length > 0) {
    addToast(`⚠️ Possible duplicate: "${duplicates[0].title}"`, "warning");
  }
  ```

### 3. **Citation Count Fetching** ✅
- **Location**: Automatic during PDF upload and DOI fetch
- **How it works**:
  - When DOI detected, queries Semantic Scholar API
  - Retrieves citation count and paper metadata
  - Displays citation count on paper cards
- **Implementation**:
  ```typescript
  import { fetchSemanticScholarData } from './utils/citationUtils';
  
  const citationData = await fetchSemanticScholarData(cleanDoi, 'DOI');
  if (citationData) {
    // Save citationCount, semanticScholarId, etc.
  }
  ```

### 4. **PDF Thumbnail Cache** ✅
- **Location**: Paper cards in Kanban view
- **How it works**:
  - Generates thumbnail from first page during upload
  - Stores as base64 data URL in Firebase
  - Displays thumbnail preview on cards
- **Implementation**:
  ```typescript
  import { generatePDFThumbnail } from './utils/pdfUtils';
  
  const thumbnailUrl = await generatePDFThumbnail(pdfUrl, 200);
  // Save to Firestore with paper data
  ```

### 5. **Reading Analytics Dashboard** ✅
- **Location**: New view accessible from header
- **Metrics tracked**:
  - Total papers read
  - Current reading streak (days)
  - Longest streak
  - Total reading time
  - Papers read this week/month
  - Tag frequency distribution
  - Method and organism frequency
- **Implementation**:
  ```typescript
  import { calculateReadingStats } from './utils/analyticsUtils';
  
  const stats = calculateReadingStats(papers, sessions);
  // Display in analytics view
  ```

### 6. **Enhanced Metadata Fields** ✅
- **New fields in Paper type**:
  - `methods: string[]` - Experimental methods
  - `organisms: string[]` - Model organisms
  - `rating: number` - 1-5 star rating
  - `doi: string` - Digital Object Identifier
  - `citationCount: number`
  - `pdfHash: string` - For duplicate detection
  - `thumbnailUrl: string`
- **UI**: Enhanced PaperDetailsModal with sections for each field

---

## 🔧 Step-by-Step Manual Integration

### Step 1: Import Utilities at Top of App.tsx

```typescript
// Add these imports after existing imports
import { generatePDFThumbnail, extractPDFText, findDuplicatePapers, calculatePDFHash } from './utils/pdfUtils';
import { fetchSemanticScholarData, parseBibTeX, generateBibTeX } from './utils/citationUtils';
import { calculateReadingStats, formatReadingTime, getTopItems } from './utils/analyticsUtils';
```

### Step 2: Add New State Variables

```typescript
// BibTeX Import
const [bibtexInput, setBibtexInput] = useState("");
const [showBibtexModal, setShowBibtexModal] = useState(false);

// Enhanced form fields
const [newMethods, setNewMethods] = useState([]);
const [newOrganisms, setNewOrganisms] = useState([]);
const [newRating, setNewRating] = useState(0);

// Analytics
const [readingStats, setReadingStats] = useState(null);
```

### Step 3: Enhance extractMetadata Function

Replace your existing `extractMetadata` function with the enhanced version that:
- Calculates PDF hash
- Fetches citation data from Semantic Scholar when DOI is found

```typescript
const extractMetadata = async (file) => {
  // ... existing code ...
  
  // NEW: Calculate hash
  const pdfHash = await calculatePDFHash(file);
  
  if (doiMatch) {
    const citationData = await fetchSemanticScholarData(cleanDoi, 'DOI');
    if (citationData) {
      return {
        ...metadata,
        doi: cleanDoi,
        citationCount: citationData.citationCount,
        pdfHash
      };
    }
  }
  
  return { ...metadata, pdfHash };
};
```

### Step 4: Enhance processFile with Duplicate Detection and Thumbnails

```typescript
const processFile = async (file) => {
  const metadata = await extractMetadata(file);
  
  // NEW: Check duplicates
  const duplicates = findDuplicatePapers(metadata, papers);
  if (duplicates.length > 0) {
    addToast(`⚠️ Possible duplicate found`, "warning");
  }
  
  // Upload PDF
  const fileRef = ref(storage, `papers/${user.uid}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  
  // NEW: Generate thumbnail
  const thumbnailUrl = await generatePDFThumbnail(url, 200);
  
  // Save to Firestore with new fields
  await addDoc(collection(db, "papers"), {
    ...existingFields,
    doi: metadata.doi || "",
    citationCount: metadata.citationCount || 0,
    pdfHash: metadata.pdfHash || "",
    thumbnailUrl: thumbnailUrl || ""
  });
};
```

### Step 5: Add BibTeX Import Handler

```typescript
const handleBibtexImport = () => {
  try {
    const parsed = parseBibTeX(bibtexInput);
    if (parsed) {
      setNewTitle(parsed.title || "");
      setNewAuthors(parsed.authors || "");
      setNewYear(parsed.year || "");
      setNewVenue(parsed.venue || "");
      setNewAbstract(parsed.abstract || "");
      setNewLink(parsed.link || "");
      setNewTags(parsed.tags || []);
      addToast("BibTeX imported successfully!", "success");
      setShowBibtexModal(false);
    }
  } catch (error) {
    addToast("Error parsing BibTeX", "error");
  }
};
```

### Step 6: Enhance fetchDoi with Citation Data

```typescript
const fetchDoi = async () => {
  if (!doiInput) return;
  setIsFetching(true);
  
  const cleanDoi = doiInput.replace("https://doi.org/", "").trim();
  const citationData = await fetchSemanticScholarData(cleanDoi, 'DOI');
  
  if (citationData) {
    setNewTitle(citationData.title);
    // ... other fields ...
    addToast(`Found! ${citationData.citationCount} citations`, "success");
  }
  
  setIsFetching(false);
};
```

### Step 7: Add BibTeX Button and Modal to UI

In your manual entry section, add:

```typescript
<button 
  onClick={() => setShowBibtexModal(true)} 
  className="nb-button bg-nb-orange flex gap-2"
>
  <FileText size={16}/> BibTeX
</button>
```

Then add the modal to SharedUI component:

```typescript
{showBibtexModal && (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
    <div className="bg-white border-4 border-black p-8 max-w-2xl w-full">
      <h2>Import from BibTeX</h2>
      <textarea 
        value={bibtexInput}
        onChange={e => setBibtexInput(e.target.value)}
        className="w-full h-64 nb-input font-mono"
      />
      <button onClick={handleBibtexImport}>Import</button>
    </div>
  </div>
)}
```

### Step 8: Calculate and Display Reading Stats

Add to your useEffect that loads papers:

```typescript
useEffect(() => {
  if (!user) return;
  const q = query(collection(db, "papers"), where("userId", "==", user.uid));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setPapers(loaded);
    
    // NEW: Calculate stats
    const stats = calculateReadingStats(loaded, []);
    setReadingStats(stats);
  });
  return () => unsubscribe();
}, [user]);
```

### Step 9: Add Analytics View

Add button to header:

```typescript
<button onClick={() => setActiveView('analytics')} className="nb-button">
  <BarChart3 /> Analytics
</button>
```

Add view rendering before library view:

```typescript
if (activeView === 'analytics' && readingStats) {
  return (
    <div className="h-screen flex flex-col">
      <h1>Reading Analytics</h1>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-4xl">{readingStats.papersReadTotal}</div>
          <div>Papers Read</div>
        </div>
        <div>
          <div className="text-4xl">{readingStats.currentStreak}</div>
          <div>Day Streak 🔥</div>
        </div>
        <div>
          <div className="text-4xl">{formatReadingTime(readingStats.totalReadingTime)}</div>
          <div>Reading Time</div>
        </div>
      </div>
      
      <h2>Top Tags</h2>
      {getTopItems(readingStats.tagFrequency, 15).map(({ item, count }) => (
        <span key={item}>{item} ({count})</span>
      ))}
    </div>
  );
}
```

### Step 10: Update PaperDetailsModal

Add inputs for new fields:

```typescript
<label>Methods</label>
<TagInput 
  tags={formData.methods || []} 
  setTags={(methods) => setFormData({...formData, methods})}
/>

<label>Model Organisms</label>
<TagInput 
  tags={formData.organisms || []} 
  setTags={(organisms) => setFormData({...formData, organisms})}
/>

<label>Rating</label>
<div className="flex gap-1">
  {[1,2,3,4,5].map(star => (
    <button 
      key={star} 
      onClick={() => setFormData({...formData, rating: star})}
    >
      {star <= (formData.rating || 0) ? '⭐' : '☆'}
    </button>
  ))}
</div>
```

### Step 11: Display Thumbnails and Citations

In your Kanban card rendering:

```typescript
{paper.thumbnailUrl && (
  <img 
    src={paper.thumbnailUrl} 
    alt="" 
    className="w-full h-32 object-cover mb-2 border-2 border-black" 
  />
)}

{paper.citationCount > 0 && (
  <div className="text-xs bg-black text-white px-2 py-1">
    📚 {paper.citationCount} citations
  </div>
)}
```

---

## 📝 Testing Checklist

After integration, test these features:

- [ ] **PDF Upload**: Drop a PDF and verify DOI detection, citation count fetch, and thumbnail generation
- [ ] **Duplicate Detection**: Upload the same PDF twice and verify warning appears
- [ ] **BibTeX Import**: Click BibTeX button, paste entry, verify all fields populate
- [ ] **DOI Fetch**: Paste DOI in manual entry, click Auto-Fill, verify citation count appears
- [ ] **Analytics View**: Click Analytics button, verify stats display correctly
- [ ] **Enhanced Modal**: Edit a paper, add methods/organisms/rating, verify saves
- [ ] **Thumbnails**: Verify thumbnails appear on paper cards
- [ ] **Citation Display**: Verify citation counts show on cards with citations

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module './utils/pdfUtils'"
**Solution**: Verify the utility files were created:
- `src/utils/pdfUtils.ts`
- `src/utils/citationUtils.ts`
- `src/utils/analyticsUtils.ts`

### Issue: CORS errors with Semantic Scholar API
**Solution**: Semantic Scholar API is CORS-enabled. If you see errors:
1. Check your internet connection
2. Verify DOI format is correct (e.g., `10.1234/example`)
3. Try with a known valid DOI: `10.1038/nature12373`

### Issue: Thumbnails not generating
**Solution**: 
1. Ensure PDF.js worker is configured correctly
2. Check browser console for errors
3. Verify PDF URL is accessible
4. Try with a smaller PDF file first

### Issue: Duplicate detection not working
**Solution**:
1. Ensure `pdfHash` field is being saved to Firestore
2. Check browser supports `crypto.subtle.digest`
3. Verify papers array is populated before calling `findDuplicatePapers`

### Issue: BibTeX parsing fails
**Solution**:
1. Verify BibTeX format is correct (check for missing braces)
2. Test with a simple entry first:
   ```bibtex
   @article{test2023,
     title={Test Paper},
     author={John Doe},
     year={2023}
   }
   ```

---

## 🚀 Next Steps

After successful integration, consider adding:

1. **Full-Text PDF Search**: Use `extractPDFText()` to enable searching within PDF content
2. **Related Paper Suggestions**: Use tag similarity to suggest related papers
3. **Export Functions**: Use `generateBibTeX()` to export papers
4. **Citation Network Graph**: Extend graph view to show citation relationships
5. **Annotation Categories**: Add category selector to highlight modal
6. **Reading Sessions**: Track time spent reading each paper

---

## 📚 API Reference

### pdfUtils
- `generatePDFThumbnail(pdfUrl, maxWidth)` - Generate thumbnail image
- `extractPDFText(pdfUrl)` - Extract all text from PDF
- `calculatePDFHash(file)` - Calculate SHA-256 hash
- `findDuplicatePapers(paper, papers)` - Find similar papers

### citationUtils
- `fetchSemanticScholarData(identifier, type)` - Fetch from API
- `parseBibTeX(bibtex)` - Parse BibTeX string
- `generateBibTeX(paper)` - Generate BibTeX entry
- `formatCitation(paper, style)` - Format citation (APA/MLA/Chicago)

### analyticsUtils
- `calculateReadingStats(papers, sessions)` - Calculate all stats
- `formatReadingTime(seconds)` - Format time display
- `getTopItems(frequency, n)` - Get top N items from frequency map

---

## 👏 Success!

You've now integrated all the new features! Your paper-vault application now has:

✅ Duplicate detection  
✅ BibTeX import  
✅ Citation count fetching  
✅ PDF thumbnails  
✅ Reading analytics  
✅ Enhanced metadata  
✅ Method & organism tracking  
✅ Star ratings  

Enjoy your enhanced research management tool! 🎉