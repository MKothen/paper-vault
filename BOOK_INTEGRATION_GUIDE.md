# Book Support Integration Guide

This guide explains how to add book functionality to your Paper-Vault application alongside the existing DOI-based paper management.

## What's Been Added

### 1. Updated Type Definitions (`src/types.ts`)
- Added `ItemType` union type: `'paper' | 'book'`
- Extended `Paper` interface with book-specific fields:
  - `itemType?: ItemType` - Distinguishes papers from books
  - `isbn`, `isbn10`, `isbn13` - ISBN identifiers
  - `edition`, `series`, `seriesNumber` - Book edition info
  - `chapters: BookChapter[]` - Chapter tracking
  - `coverImageUrl` - Book cover images
  - `bookFormat` - Hardcover, paperback, ebook, audiobook
- Added `BookChapter` interface for chapter-by-chapter reading tracking
- Added `BookMetadata` interface for API responses

### 2. Book Metadata Utilities (`src/utils/bookMetadata.ts`)
- `fetchBookMetadataByISBN(isbn)` - Fetches book data from Google Books API
- `validateISBN(isbn)` - Validates ISBN-10 and ISBN-13
- `validateISBN10(isbn)` - Validates ISBN-10 with checksum
- `validateISBN13(isbn)` - Validates ISBN-13 with checksum
- `isbn10To13(isbn10)` - Converts ISBN-10 to ISBN-13
- `formatISBN(isbn)` - Formats ISBN with hyphens for display
- `extractISBN(text)` - Extracts ISBN from pasted text

## Integration Steps

### Step 1: Update the Add Item Input Field

Modify your DOI input to accept both DOIs and ISBNs:

```tsx
import { fetchBookMetadataByISBN, validateISBN, extractISBN } from './utils/bookMetadata';

// Add state for item type detection
const [inputType, setInputType] = useState<'doi' | 'isbn' | 'unknown'>('unknown');

// Update your input handler
const handlePasteOrInput = async (value: string) => {
  const trimmed = value.trim();
  
  // Check if it's an ISBN
  const extractedISBN = extractISBN(trimmed);
  if (extractedISBN && validateISBN(extractedISBN)) {
    setInputType('isbn');
    await handleISBNPaste(extractedISBN);
    return;
  }
  
  // Check if it's a DOI
  if (trimmed.includes('10.') || trimmed.startsWith('doi:')) {
    setInputType('doi');
    await handleDOIPaste(trimmed);
    return;
  }
  
  setInputType('unknown');
};
```

### Step 2: Create ISBN Handler Function

Add a handler similar to your existing DOI handler:

```tsx
const handleISBNPaste = async (isbn: string) => {
  try {
    // Fetch metadata from Google Books
    const bookData = await fetchBookMetadataByISBN(isbn);
    
    if (!bookData) {
      alert('Book not found for this ISBN');
      return;
    }
    
    // Create a new book entry
    const newBook: Paper = {
      id: crypto.randomUUID(),
      userId: user.uid,
      itemType: 'book',
      title: bookData.title,
      authors: bookData.authors.join(', '),
      abstract: bookData.description || '',
      year: bookData.publishedDate?.split('-')[0] || '',
      publisher: bookData.publisher || '',
      isbn: isbn,
      isbn10: bookData.isbn10,
      isbn13: bookData.isbn13,
      pageCount: bookData.pageCount,
      coverImageUrl: bookData.coverImageUrl,
      link: bookData.previewLink || '',
      tags: bookData.categories || [],
      color: '#10b981', // Green for books
      status: 'to-read',
      venue: 'Book',
      notes: '',
      pdfUrl: '',
      createdAt: Date.now(),
    };
    
    // Add to Firestore
    await addDoc(collection(db, 'papers'), newBook);
    
    // Clear input
    setDoiInput('');
    setInputType('unknown');
  } catch (error) {
    console.error('Error adding book:', error);
    alert('Failed to add book');
  }
};
```

### Step 3: Update UI Input Component

Modify your input field to show what type of identifier is detected:

```tsx
<div className="relative">
  <input
    type="text"
    value={doiInput}
    onChange={(e) => handlePasteOrInput(e.target.value)}
    onPaste={(e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      handlePasteOrInput(pastedText);
    }}
    placeholder="Paste DOI or ISBN here..."
    className="w-full px-4 py-3 border-2 border-gray-700 rounded"
  />
  {inputType !== 'unknown' && (
    <span className="absolute right-3 top-3 text-sm text-gray-500">
      {inputType === 'doi' ? '📄 DOI detected' : '📚 ISBN detected'}
    </span>
  )}
</div>
```

### Step 4: Display Books Differently

Update your paper card component to show book-specific information:

```tsx
const PaperCard = ({ paper }: { paper: Paper }) => {
  const isBook = paper.itemType === 'book';
  
  return (
    <div className="paper-card">
      {/* Show cover image for books */}
      {isBook && paper.coverImageUrl && (
        <img 
          src={paper.coverImageUrl} 
          alt={paper.title}
          className="w-full h-48 object-cover rounded-t"
        />
      )}
      
      {/* Badge indicating item type */}
      <span className="badge">
        {isBook ? '📚 Book' : '📄 Paper'}
      </span>
      
      <h3>{paper.title}</h3>
      <p className="authors">{paper.authors}</p>
      
      {/* Show different metadata based on type */}
      {isBook ? (
        <>
          <p>{paper.publisher} ({paper.year})</p>
          {paper.pageCount && <p>{paper.pageCount} pages</p>}
          {paper.isbn13 && <p className="text-xs">ISBN: {paper.isbn13}</p>}
        </>
      ) : (
        <>
          <p>{paper.venue} ({paper.year})</p>
          {paper.doi && <p className="text-xs">DOI: {paper.doi}</p>}
        </>
      )}
    </div>
  );
};
```

### Step 5: Add Filter for Item Type

Allow users to filter between papers and books:

```tsx
// Add to your filter state
const [itemTypeFilter, setItemTypeFilter] = useState<ItemType[]>(['paper', 'book']);

// Filter component
<div className="filter-section">
  <label>Item Type:</label>
  <label>
    <input
      type="checkbox"
      checked={itemTypeFilter.includes('paper')}
      onChange={(e) => {
        if (e.target.checked) {
          setItemTypeFilter([...itemTypeFilter, 'paper']);
        } else {
          setItemTypeFilter(itemTypeFilter.filter(t => t !== 'paper'));
        }
      }}
    />
    Papers
  </label>
  <label>
    <input
      type="checkbox"
      checked={itemTypeFilter.includes('book')}
      onChange={(e) => {
        if (e.target.checked) {
          setItemTypeFilter([...itemTypeFilter, 'book']);
        } else {
          setItemTypeFilter(itemTypeFilter.filter(t => t !== 'book'));
        }
      }}
    />
    Books
  </label>
</div>

// Apply filter
const filteredPapers = papers.filter(paper => {
  const type = paper.itemType || 'paper'; // Default to paper for backwards compatibility
  return itemTypeFilter.includes(type);
});
```

### Step 6: Chapter Tracking (Optional Enhancement)

For books, you can add chapter-by-chapter reading tracking:

```tsx
const BookChapterList = ({ book, onUpdateChapter }: { 
  book: Paper, 
  onUpdateChapter: (chapterId: string, updates: Partial<BookChapter>) => void 
}) => {
  if (!book.chapters || book.chapters.length === 0) return null;
  
  return (
    <div className="chapter-list">
      <h4>Chapters</h4>
      {book.chapters.map(chapter => (
        <div key={chapter.id} className="chapter-item">
          <span>Chapter {chapter.number}: {chapter.title}</span>
          <select
            value={chapter.status || 'to-read'}
            onChange={(e) => onUpdateChapter(chapter.id, { 
              status: e.target.value as 'to-read' | 'reading' | 'read' 
            })}
          >
            <option value="to-read">To Read</option>
            <option value="reading">Reading</option>
            <option value="read">Read</option>
          </select>
        </div>
      ))}
    </div>
  );
};
```

## Testing Your Implementation

### Test ISBNs:
- **"Principles of Neural Science" (5th ed.)**: `978-0-07-139011-8`
- **"Neuroscience: Exploring the Brain" (4th ed.)**: `978-1-60913-020-3`
- **"Ion Channels of Excitable Membranes"**: `978-0-87893-321-1`

### Testing Steps:
1. Try pasting a DOI - should add a paper
2. Try pasting an ISBN - should add a book
3. Check that both types appear in your library
4. Test filtering by item type
5. Verify book covers display correctly
6. Check that book-specific fields (publisher, ISBN) show properly

## Backwards Compatibility

All existing papers without `itemType` will default to `'paper'`, ensuring your current library continues to work without any data migration.

## Next Steps

1. **Enhanced Book Metadata**: Add support for Open Library API as a fallback
2. **Chapter Management**: Allow users to manually add/edit chapters
3. **Book Series Tracking**: Group books in the same series
4. **Reading Progress**: Track page-by-page progress for books
5. **Book Recommendations**: Suggest related books based on tags and authors

## API Rate Limits

Google Books API:
- Free tier: 1,000 requests/day
- No API key required for basic usage
- Consider adding API key for higher limits

## Troubleshooting

**Book not found:**
- Try ISBN-13 instead of ISBN-10
- Check for typos in ISBN
- Some older books may not be in Google Books

**Cover images not loading:**
- Check CORS settings
- Verify HTTPS is used (not HTTP)
- Some books don't have cover images available

**Duplicate detection:**
- Compare ISBN-13 values
- Convert ISBN-10 to ISBN-13 for comparison using `isbn10To13()`