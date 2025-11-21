import * as pdfjsLib from 'pdfjs-dist';
import type { Paper } from '../types';

// Common lists for auto-tagging and filtering
export const COMMON_METHODS = [
  'Electrophysiology', 'Patch Clamp', 'Calcium Imaging', 'Two-Photon', 
  'Optogenetics', 'Behavioral Analysis', 'Western Blot', 'PCR', 'RNA-seq',
  'fMRI', 'EEG', 'Deep Learning', 'Survey', 'Microscopy', 'CRISPR'
];

export const COMMON_ORGANISMS = [
  'Mouse', 'Rat', 'Human', 'Zebrafish', 'C. elegans', 'Drosophila', 'In Silico', 'Monkey'
];

/**
 * Generates a thumbnail image from the first page of a PDF URL.
 * Returns a Base64 data URL string.
 */
export const generateThumbnail = async (pdfUrl: string): Promise<string> => {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // Scale down for thumbnail (0.3 is roughly 180px width for standard letter)
    const viewport = page.getViewport({ scale: 0.3 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return '';
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.warn("Thumbnail generation failed (likely CORS or invalid PDF):", error);
    return ''; // Return empty string on failure so UI can show default icon
  }
};

/**
 * Checks if a paper already exists in the database based on DOI or Title.
 */
export const checkDuplicates = (papers: Paper[], newTitle: string, newDoi?: string): Paper[] => {
  return papers.filter(p => {
    // Strict DOI match
    if (newDoi && p.doi && p.doi.toLowerCase() === newDoi.toLowerCase()) return true;
    
    // Normalized title match (remove non-alphanumeric, lower case)
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalize(p.title) === normalize(newTitle)) return true;
    
    return false;
  });
};

/**
 * simple frequency-based tag generator for text
 */
export const generateSmartTags = (text: string): string[] => {
  if (!text) return [];
  
  const stopWords = new Set([
    "the", "and", "of", "for", "with", "study", "using", "based", "from", 
    "that", "this", "results", "method", "paper", "doi", "journal", "university",
    "introduction", "conclusion", "discussion", "references", "abstract", "figure",
    "table", "data", "analysis", "model", "between", "during", "through"
  ]);

  // 1. Clean and split text
  const words = text.split(/[\s,.-]+/)
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 4 && !stopWords.has(w));
    
  // 2. Count frequency
  const freq: Record<string, number> = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  // 3. Sort by frequency and capitalize
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));
};