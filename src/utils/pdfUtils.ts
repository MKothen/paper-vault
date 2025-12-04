import { pdfjs } from 'react-pdf';
import type { Paper } from '../types';

/**
 * Generate a thumbnail image from the first page of a PDF
 */
export async function generatePDFThumbnail(
  pdfUrl: string,
  maxWidth: number = 200
): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return '';
  }
}

/**
 * Extract full text content from a PDF
 */
export async function extractPDFText(pdfUrl: string): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n');
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

/**
 * Extract table of contents / bookmarks from PDF
 */
export async function extractPDFOutline(
  pdfUrl: string
): Promise<Array<{ title: string; page: number; level: number }>> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const outline = await pdf.getOutline();

    if (!outline) return [];

    const flattenOutline = async (
      items: any[],
      level: number = 0
    ): Promise<Array<{ title: string; page: number; level: number }>> => {
      const result: Array<{ title: string; page: number; level: number }> = [];

      for (const item of items) {
        let pageNum = 1;
        if (item.dest) {
          try {
            const dest =
              typeof item.dest === 'string'
                ? await pdf.getDestination(item.dest)
                : item.dest;
            if (dest && dest[0]) {
              const pageRef = dest[0];
              const pageIndex = await pdf.getPageIndex(pageRef);
              pageNum = pageIndex + 1;
            }
          } catch (e) {
            console.warn('Could not resolve page for outline item');
          }
        }

        result.push({ title: item.title, page: pageNum, level });

        if (item.items && item.items.length > 0) {
          const children = await flattenOutline(item.items, level + 1);
          result.push(...children);
        }
      }

      return result;
    };

    return await flattenOutline(outline);
  } catch (error) {
    console.error('Error extracting PDF outline:', error);
    return [];
  }
}

/**
 * Calculate PDF file hash for duplicate detection
 */
export async function calculatePDFHash(file: File): Promise<string> {
  try {
    // OPTIMIZATION: Skip hash calculation for files > 50MB to prevent browser crash
    // Large files consume too much RAM when reading into ArrayBuffer
    const MAX_HASH_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_HASH_SIZE) {
      console.warn(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds hash limit. Skipping duplicate check.`);
      return ""; 
    }

    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  } catch (error) {
    console.error('Error calculating PDF hash:', error);
    return '';
  }
}

/**
 * Check for duplicate papers based on title similarity and hash
 */
export function findDuplicatePapers(
  newPaper: Partial<Paper>,
  existingPapers: Paper[]
): Paper[] {
  const duplicates: Paper[] = [];

  for (const paper of existingPapers) {
    // Check PDF hash if available
    if (newPaper.pdfHash && paper.pdfHash === newPaper.pdfHash) {
      duplicates.push(paper);
      continue;
    }

    // Check DOI if available
    if (newPaper.doi && paper.doi === newPaper.doi) {
      duplicates.push(paper);
      continue;
    }

    // Check title similarity
    if (newPaper.title && paper.title) {
      const similarity = calculateStringSimilarity(
        newPaper.title.toLowerCase(),
        paper.title.toLowerCase()
      );
      if (similarity > 0.85) {
        duplicates.push(paper);
      }
    }
  }

  return duplicates;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Get page count from PDF
 */
export async function getPDFPageCount(pdfUrl: string): Promise<number> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 0;
  }
}