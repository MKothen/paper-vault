import { BookMetadata } from '../types';

/**
 * Fetch book metadata from Google Books API using ISBN
 */
export async function fetchBookMetadataByISBN(isbn: string): Promise<BookMetadata | null> {
  try {
    // Remove any hyphens or spaces from ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch book metadata');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    const book = data.items[0].volumeInfo;
    
    // Find the largest cover image available
    const coverImageUrl = 
      book.imageLinks?.extraLarge ||
      book.imageLinks?.large ||
      book.imageLinks?.medium ||
      book.imageLinks?.small ||
      book.imageLinks?.thumbnail ||
      '';
    
    return {
      title: book.title || '',
      authors: book.authors || [],
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      isbn10: book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
      isbn13: book.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
      pageCount: book.pageCount,
      categories: book.categories,
      language: book.language,
      coverImageUrl: coverImageUrl.replace('http:', 'https:'), // Force HTTPS
      previewLink: book.previewLink?.replace('http:', 'https:'),
    };
  } catch (error) {
    console.error('Error fetching book metadata:', error);
    return null;
  }
}

/**
 * Validate ISBN-10 checksum
 */
export function validateISBN10(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  if (cleaned.length !== 10) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(cleaned[i]);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }
  
  const lastChar = cleaned[9].toUpperCase();
  const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
  if (isNaN(checkDigit) && lastChar !== 'X') return false;
  
  sum += checkDigit;
  return sum % 11 === 0;
}

/**
 * Validate ISBN-13 checksum
 */
export function validateISBN13(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  if (cleaned.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const digit = parseInt(cleaned[i]);
    if (isNaN(digit)) return false;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  return sum % 10 === 0;
}

/**
 * Validate any ISBN format (10 or 13)
 */
export function validateISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  if (cleaned.length === 10) {
    return validateISBN10(cleaned);
  } else if (cleaned.length === 13) {
    return validateISBN13(cleaned);
  }
  
  return false;
}

/**
 * Convert ISBN-10 to ISBN-13
 */
export function isbn10To13(isbn10: string): string {
  const cleaned = isbn10.replace(/[-\s]/g, '').slice(0, 9);
  const base = '978' + cleaned;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

/**
 * Format ISBN with hyphens for display
 */
export function formatISBN(isbn: string): string {
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  if (cleaned.length === 10) {
    // Format: X-XXX-XXXXX-X
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 13) {
    // Format: XXX-X-XXX-XXXXX-X
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 12)}-${cleaned.slice(12)}`;
  }
  
  return isbn;
}

/**
 * Extract ISBN from various text formats
 */
export function extractISBN(text: string): string | null {
  // Try to find ISBN-13 pattern
  const isbn13Pattern = /(?:ISBN(?:-13)?:?\s*)?(?=(?:\d[-\s]?){13})\d{3}[-\s]?\d[-\s]?\d{3}[-\s]?\d{5}[-\s]?\d/gi;
  const isbn13Match = text.match(isbn13Pattern);
  
  if (isbn13Match) {
    const cleaned = isbn13Match[0].replace(/[^\d]/g, '');
    if (validateISBN13(cleaned)) {
      return cleaned;
    }
  }
  
  // Try to find ISBN-10 pattern
  const isbn10Pattern = /(?:ISBN(?:-10)?:?\s*)?(?=(?:[\dX][-\s]?){10})[\dX][-\s]?\d{3}[-\s]?\d{5}[-\s]?[\dX]/gi;
  const isbn10Match = text.match(isbn10Pattern);
  
  if (isbn10Match) {
    const cleaned = isbn10Match[0].replace(/[^\dX]/gi, '');
    if (validateISBN10(cleaned)) {
      return cleaned;
    }
  }
  
  return null;
}