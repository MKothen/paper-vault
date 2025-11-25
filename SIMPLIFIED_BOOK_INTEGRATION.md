# Simplified Book Integration for Paper-Vault

This guide shows how to add manual book entry to your Paper-Vault so books work seamlessly with all existing PDF features (highlighting, notes, etc.).

## Overview

The goal is to:
1. Add a "Book" entry type alongside DOI papers
2. Allow manual entry of book metadata (title, authors, publisher, year)
3. Upload book PDFs just like paper PDFs
4. Have all PDF reader features work identically for books

## Implementation

### Step 1: Add Book Entry Mode to Input Section

In your `App.tsx`, update the input mode tabs to include a "Book" option:

```tsx
// Around line 30, update inputMode state
const [inputMode, setInputMode] = useState('drop'); // 'drop', 'manual', or 'book'
```

Then in your input section UI (around line 600):

```tsx
<div className="flex items-center gap-4">
  <button 
    onClick={() => setInputMode('drop')} 
    className={`text-sm font-black uppercase border-b-4 pb-1 ${
      inputMode === 'drop' ? 'border-nb-purple' : 'border-transparent'
    }`}
  >
    Smart Drop
  </button>
  <button 
    onClick={() => setInputMode('manual')} 
    className={`text-sm font-black uppercase border-b-4 pb-1 ${
      inputMode === 'manual' ? 'border-nb-lime' : 'border-transparent'
    }`}
  >
    DOI Entry
  </button>
  <button 
    onClick={() => setInputMode('book')} 
    className={`text-sm font-black uppercase border-b-4 pb-1 ${
      inputMode === 'book' ? 'border-nb-cyan' : 'border-transparent'
    }`}
  >
    📚 Add Book
  </button>
</div>
```

### Step 2: Add Book Entry Form

After the DOI input section, add a book entry form:

```tsx
// Add state for book form
const [bookForm, setBookForm] = useState({
  title: '',
  authors: '',
  publisher: '',
  year: new Date().getFullYear().toString(),
  isbn: '',
  edition: ''
});
const bookPdfInputRef = useRef(null);
const [selectedBookPdf, setSelectedBookPdf] = useState(null);

// Handler for book submission
const handleAddBook = async () => {
  if (!bookForm.title || !bookForm.authors) {
    addToast("Please fill in at least title and authors", "error");
    return;
  }
  
  try {
    setIsUploading(true);
    
    let pdfUrl = "";
    let thumbnailUrl = "";
    
    // If user selected a PDF, upload it
    if (selectedBookPdf) {
      const fileRef = ref(storage, `papers/${user.uid}/${Date.now()}_${selectedBookPdf.name}`);
      await uploadBytes(fileRef, selectedBookPdf);
      pdfUrl = await getDownloadURL(fileRef);
      
      // Generate thumbnail
      try {
        if (typeof generatePDFThumbnail === 'function') {
          thumbnailUrl = await generatePDFThumbnail(pdfUrl);
        }
      } catch (e) {
        console.error('Thumbnail generation failed:', e);
      }
    }
    
    // Create book entry
    await addDoc(collection(db, "papers"), {
      userId: user.uid,
      itemType: 'book', // Mark as book
      title: bookForm.title,
      authors: bookForm.authors,
      publisher: bookForm.publisher || '',
      year: bookForm.year,
      isbn: bookForm.isbn || '',
      edition: bookForm.edition || '',
      abstract: '', // Can be filled later via edit
      venue: 'Book',
      tags: [], // Can be added later
      color: COLORS[2].class, // Pink for books
      status: 'to-read',
      link: '',
      notes: '',
      pdfUrl: pdfUrl,
      thumbnailUrl: thumbnailUrl,
      createdAt: Date.now(),
      addedDate: Date.now(),
      rating: 0,
      structuredNotes: {}
    });
    
    addToast("Book added successfully!", "success");
    
    // Reset form
    setBookForm({
      title: '',
      authors: '',
      publisher: '',
      year: new Date().getFullYear().toString(),
      isbn: '',
      edition: ''
    });
    setSelectedBookPdf(null);
    setIsUploading(false);
  } catch (error) {
    console.error('Error adding book:', error);
    addToast("Failed to add book", "error");
    setIsUploading(false);
  }
};

// Book input UI (add after DOI input section)
{inputMode === 'book' && (
  <div className="bg-nb-gray p-6 border-4 border-black space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold uppercase mb-1">Title *</label>
        <input 
          value={bookForm.title}
          onChange={e => setBookForm({...bookForm, title: e.target.value})}
          className="nb-input w-full" 
          placeholder="Enter book title..."
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase mb-1">Authors *</label>
        <input 
          value={bookForm.authors}
          onChange={e => setBookForm({...bookForm, authors: e.target.value})}
          className="nb-input w-full" 
          placeholder="e.g., John Doe, Jane Smith"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-bold uppercase mb-1">Publisher</label>
        <input 
          value={bookForm.publisher}
          onChange={e => setBookForm({...bookForm, publisher: e.target.value})}
          className="nb-input w-full" 
          placeholder="Publisher name"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase mb-1">Year</label>
        <input 
          value={bookForm.year}
          onChange={e => setBookForm({...bookForm, year: e.target.value})}
          className="nb-input w-full" 
          placeholder="2024"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase mb-1">Edition</label>
        <input 
          value={bookForm.edition}
          onChange={e => setBookForm({...bookForm, edition: e.target.value})}
          className="nb-input w-full" 
          placeholder="e.g., 5th"
        />
      </div>
    </div>
    
    <div>
      <label className="block text-xs font-bold uppercase mb-1">ISBN (optional)</label>
      <input 
        value={bookForm.isbn}
        onChange={e => setBookForm({...bookForm, isbn: e.target.value})}
        className="nb-input w-full" 
        placeholder="ISBN-10 or ISBN-13"
      />
    </div>
    
    <div className="border-2 border-dashed border-gray-400 p-4 rounded">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">Book PDF (optional - can add later)</p>
          {selectedBookPdf && (
            <p className="text-xs text-gray-600 mt-1">Selected: {selectedBookPdf.name}</p>
          )}
        </div>
        <button 
          onClick={() => bookPdfInputRef.current?.click()}
          className="nb-button flex gap-2 bg-white"
        >
          <FileUp size={16} /> Choose PDF
        </button>
      </div>
      <input 
        ref={bookPdfInputRef}
        type="file" 
        accept=".pdf" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setSelectedBookPdf(e.target.files[0]);
          }
        }}
      />
    </div>
    
    <button 
      onClick={handleAddBook}
      disabled={isUploading || !bookForm.title || !bookForm.authors}
      className="nb-button w-full bg-nb-cyan flex gap-2 justify-center text-lg"
    >
      {isUploading ? (
        <><Loader2 className="animate-spin" /> Adding Book...</>
      ) : (
        <><Plus /> Add Book to Library</>
      )}
    </button>
  </div>
)}
```

### Step 3: Update Card Display to Show Book Badge

In your `VirtualKanbanBoard` component (or wherever you render paper cards), add a visual indicator for books:

```tsx
// In the paper card rendering
<div className="relative">
  {paper.itemType === 'book' && (
    <div className="absolute top-2 right-2 bg-nb-cyan border-2 border-black px-2 py-1 text-xs font-black uppercase z-10">
      📚 Book
    </div>
  )}
  {/* Rest of card content */}
</div>

// Show appropriate metadata
<div className="text-xs text-gray-600 space-y-1">
  {paper.itemType === 'book' ? (
    <>
      {paper.publisher && <p><strong>Publisher:</strong> {paper.publisher}</p>}
      {paper.edition && <p><strong>Edition:</strong> {paper.edition}</p>}
      {paper.isbn && <p><strong>ISBN:</strong> {paper.isbn}</p>}
    </>
  ) : (
    <>
      {paper.venue && <p><strong>Venue:</strong> {paper.venue}</p>}
      {paper.doi && <p><strong>DOI:</strong> {paper.doi}</p>}
    </>
  )}
  <p><strong>Year:</strong> {paper.year}</p>
</div>
```

### Step 4: That's It!

Your existing code already handles:
- ✅ PDF viewing for any `pdfUrl` (books work automatically)
- ✅ Highlighting system (works on any PDF)
- ✅ Note-taking (works on any paper/book)
- ✅ Post-its (works on any PDF)
- ✅ Status tracking (to-read, reading, read)
- ✅ Search and filtering
- ✅ Upload PDF later via "Upload PDF" button

## Usage

### Adding a Book Without PDF:
1. Click "📚 Add Book" tab
2. Fill in title, authors, and other details
3. Click "Add Book to Library"
4. Later, use "Upload PDF" button on the card to add the PDF

### Adding a Book With PDF:
1. Click "📚 Add Book" tab
2. Fill in metadata
3. Click "Choose PDF" and select your book PDF
4. Click "Add Book to Library"
5. Everything (highlighting, notes) works immediately!

### Alternative: Drop Book PDF First
1. Just drag and drop the book PDF using "Smart Drop"
2. Edit the auto-detected metadata
3. Change `venue` to "Book" and add publisher info in the edit modal
4. Or add `itemType: 'book'` via the metadata editor

## Filter by Item Type (Optional)

If you want to filter books vs papers, add to your search section:

```tsx
<div className="flex gap-2 items-center">
  <label className="text-xs font-bold uppercase">Show:</label>
  <button 
    onClick={() => setItemTypeFilter(prev => 
      prev.includes('book') ? prev.filter(t => t !== 'book') : [...prev, 'book']
    )}
    className={`text-xs font-bold px-2 py-1 border-2 border-black ${
      itemTypeFilter.includes('book') ? 'bg-nb-cyan' : 'bg-white'
    }`}
  >
    📚 Books
  </button>
  <button 
    onClick={() => setItemTypeFilter(prev => 
      prev.includes('paper') ? prev.filter(t => t !== 'paper') : [...prev, 'paper']
    )}
    className={`text-xs font-bold px-2 py-1 border-2 border-black ${
      itemTypeFilter.includes('paper') ? 'bg-nb-lime' : 'bg-white'
    }`}
  >
    📄 Papers
  </button>
</div>
```

## Backwards Compatibility

All existing papers will continue to work because:
- Missing `itemType` defaults to `'paper'`
- All book-specific fields (publisher, edition, isbn) are optional
- Existing papers have `venue` for journal/conference names

## That's All!

Books now work exactly like papers with full PDF reading, highlighting, and note-taking support. The only difference is a visual badge and slightly different metadata fields.