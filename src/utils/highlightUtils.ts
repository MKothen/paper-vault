// src/utils/highlightUtils.ts
import { Highlight, PostIt } from '../types';

/**
 * Normalizes selection rectangles relative to container
 */
export function normalizeSelectionRects(
  selection: Selection,
  containerRect: DOMRect,
  scale: number
): Array<{ x: number; y: number; width: number; height: number }> {
  if (!selection || selection.isCollapsed) return [];
  
  const range = selection.getRangeAt(0);
  const rects = Array.from(range.getClientRects());
  
  return rects.map(r => ({
    x: (r.left - containerRect.left) / scale,
    y: (r.top - containerRect.top) / scale,
    width: r.width / scale,
    height: r.height / scale
  }));
}

/**
 * Gets color for a highlight category
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    methodology: '#22d3ee',      // Cyan
    results: '#a3e635',          // Lime green
    'related-work': '#c084fc',   // Purple
    discussion: '#fb923c',       // Orange
    limitation: '#f87171',       // Red
    general: '#fde047'          // Yellow
  };
  return colors[category] || colors.general;
}

/**
 * Gets background color class for a category (Tailwind)
 */
export function getCategoryBgClass(category: string): string {
  const bgClasses: Record<string, string> = {
    methodology: 'bg-cyan-400',
    results: 'bg-lime-400',
    'related-work': 'bg-purple-400',
    discussion: 'bg-orange-400',
    limitation: 'bg-red-400',
    general: 'bg-yellow-300'
  };
  return bgClasses[category] || bgClasses.general;
}

/**
 * Creates a new highlight from selection
 */
export function createHighlightFromSelection(
  selection: Selection,
  containerRect: DOMRect,
  scale: number,
  pageNumber: number,
  category: Highlight['category'] = 'general'
): Highlight | null {
  if (!selection || selection.isCollapsed) return null;
  
  const rects = normalizeSelectionRects(selection, containerRect, scale);
  if (rects.length === 0) return null;
  
  return {
    id: Date.now(),
    page: pageNumber,
    rects,
    color: getCategoryColor(category),
    text: selection.toString().trim(),
    category,
    createdAt: Date.now()
  };
}

/**
 * Persists highlights to localStorage
 */
export function saveHighlights(paperId: string, highlights: Highlight[]): void {
  localStorage.setItem(`highlights-${paperId}`, JSON.stringify(highlights));
}

/**
 * Loads highlights from localStorage
 */
export function loadHighlights(paperId: string): Highlight[] {
  try {
    const data = localStorage.getItem(`highlights-${paperId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading highlights:', error);
    return [];
  }
}

/**
 * Persists post-its to localStorage
 */
export function savePostIts(paperId: string, postits: PostIt[]): void {
  localStorage.setItem(`postits-${paperId}`, JSON.stringify(postits));
}

/**
 * Loads post-its from localStorage
 */
export function loadPostIts(paperId: string): PostIt[] {
  try {
    const data = localStorage.getItem(`postits-${paperId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading post-its:', error);
    return [];
  }
}

/**
 * Exports highlights to markdown format
 */
export function exportHighlightsToMarkdown(
  highlights: Highlight[],
  paperTitle: string
): string {
  let markdown = `# Highlights: ${paperTitle}\n\n`;
  
  // Group by category
  const grouped = highlights.reduce((acc, h) => {
    const cat = h.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(h);
    return acc;
  }, {} as Record<string, Highlight[]>);
  
  Object.entries(grouped).forEach(([category, items]) => {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    items
      .sort((a, b) => a.page - b.page)
      .forEach(h => {
        markdown += `> **Page ${h.page}**: "${h.text}"\n`;
        if (h.note) {
          markdown += `> *Note: ${h.note}*\n`;
        }
        markdown += '\n';
      });
  });
  
  return markdown;
}

/**
 * Exports highlights to JSON format
 */
export function exportHighlightsToJSON(highlights: Highlight[]): string {
  return JSON.stringify(highlights, null, 2);
}

/**
 * Filters highlights by category
 */
export function filterHighlightsByCategory(
  highlights: Highlight[],
  category: Highlight['category'] | null
): Highlight[] {
  if (!category) return highlights;
  return highlights.filter(h => h.category === category);
}

/**
 * Filters highlights by page
 */
export function filterHighlightsByPage(
  highlights: Highlight[],
  page: number
): Highlight[] {
  return highlights.filter(h => h.page === page);
}

/**
 * Gets all unique categories from highlights
 */
export function getUniqueCategories(highlights: Highlight[]): string[] {
  const categories = new Set(highlights.map(h => h.category || 'general'));
  return Array.from(categories).sort();
}

/**
 * Counts highlights per category
 */
export function countHighlightsByCategory(
  highlights: Highlight[]
): Record<string, number> {
  return highlights.reduce((acc, h) => {
    const cat = h.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Searches highlights by text content
 */
export function searchHighlights(
  highlights: Highlight[],
  query: string
): Highlight[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return highlights;
  
  return highlights.filter(h => 
    h.text.toLowerCase().includes(lowerQuery) ||
    h.note?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Creates a post-it note at specific coordinates
 */
export function createPostIt(
  x: number,
  y: number,
  pageNumber: number,
  scale: number,
  color: PostIt['color'] = { name: 'yellow', class: 'bg-yellow-200', hex: '#fef08a' }
): PostIt {
  return {
    id: Date.now(),
    page: pageNumber,
    x: x / scale,
    y: y / scale,
    text: '',
    color,
    createdAt: Date.now()
  };
}

/**
 * Gets available post-it colors
 */
export function getPostItColors(): PostIt['color'][] {
  return [
    { name: 'yellow', class: 'bg-yellow-200', hex: '#fef08a' },
    { name: 'pink', class: 'bg-pink-200', hex: '#fbcfe8' },
    { name: 'blue', class: 'bg-blue-200', hex: '#bfdbfe' },
    { name: 'green', class: 'bg-green-200', hex: '#bbf7d0' },
    { name: 'purple', class: 'bg-purple-200', hex: '#e9d5ff' },
    { name: 'orange', class: 'bg-orange-200', hex: '#fed7aa' }
  ];
}