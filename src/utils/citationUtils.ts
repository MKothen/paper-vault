import type { Paper, CitationData, BibTeXEntry } from '../types';

/**
 * Fetch citation count and related data from Semantic Scholar
 */
export async function fetchSemanticScholarData(
  identifier: string,
  identifierType: 'DOI' | 'ArXiv' | 'PubMed' | 'Title' = 'DOI'
): Promise<CitationData | null> {
  try {
    let url = '';
    if (identifierType === 'Title') {
      // Search by title
      const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        identifier
      )}&fields=paperId,externalIds,title,citationCount,references,citations&limit=1`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      if (searchData.data && searchData.data.length > 0) {
        return searchData.data[0];
      }
      return null;
    } else {
      // Direct lookup
      url = `https://api.semanticscholar.org/graph/v1/paper/${identifierType}:${identifier}?fields=paperId,externalIds,title,citationCount,references,citations`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Semantic Scholar data:', error);
    return null;
  }
}

/**
 * Parse BibTeX entry and extract metadata
 */
export function parseBibTeX(bibtex: string): Partial<Paper> | null {
  try {
    // Remove comments
    bibtex = bibtex.replace(/%.*$/gm, '');

    // Extract entry type and citation key
    const entryMatch = bibtex.match(/@(\w+)\{([^,]+),/);
    if (!entryMatch) return null;

    const entryType = entryMatch[1].toLowerCase();
    const citationKey = entryMatch[2].trim();

    // Extract fields
    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*[{"]([^}"]+)[}"],?/g;
    let match;

    while ((match = fieldRegex.exec(bibtex)) !== null) {
      const fieldName = match[1].toLowerCase();
      const fieldValue = match[2].trim();
      fields[fieldName] = fieldValue;
    }

    // Map BibTeX fields to Paper fields
    const paper: Partial<Paper> = {
      title: fields.title || '',
      authors: fields.author || '',
      year: fields.year || '',
      venue: fields.journal || fields.booktitle || '',
      abstract: fields.abstract || '',
      doi: fields.doi || '',
      journal: fields.journal || '',
      volume: fields.volume || '',
      issue: fields.number || fields.issue || '',
      pages: fields.pages || '',
      publisher: fields.publisher || '',
      keywords: fields.keywords
        ? fields.keywords.split(',').map((k) => k.trim())
        : [],
      issn: fields.issn || '',
      link: fields.url || (fields.doi ? `https://doi.org/${fields.doi}` : ''),
    };

    // Extract arXiv ID
    if (fields.eprint) {
      paper.arxivId = fields.eprint;
    }

    // Generate tags from title and keywords
    const tags = new Set<string>();
    if (paper.keywords) {
      paper.keywords.forEach((k) => tags.add(k));
    }
    if (paper.title) {
      const titleWords = paper.title
        .split(/\s+/)
        .filter((w) => w.length > 5)
        .slice(0, 5);
      titleWords.forEach((w) => tags.add(w));
    }
    paper.tags = Array.from(tags);

    return paper;
  } catch (error) {
    console.error('Error parsing BibTeX:', error);
    return null;
  }
}

/**
 * Generate BibTeX entry from Paper
 */
export function generateBibTeX(paper: Paper): string {
  const citationKey = `${paper.authors?.split(',')[0]?.split(' ').pop() || 'unknown'}${paper.year}`;
  const entryType = paper.journal ? 'article' : 'misc';

  let bibtex = `@${entryType}{${citationKey},\n`;
  bibtex += `  title={${paper.title}},\n`;
  if (paper.authors) bibtex += `  author={${paper.authors}},\n`;
  if (paper.year) bibtex += `  year={${paper.year}},\n`;
  if (paper.journal) bibtex += `  journal={${paper.journal}},\n`;
  if (paper.venue && !paper.journal) bibtex += `  booktitle={${paper.venue}},\n`;
  if (paper.volume) bibtex += `  volume={${paper.volume}},\n`;
  if (paper.issue) bibtex += `  number={${paper.issue}},\n`;
  if (paper.pages) bibtex += `  pages={${paper.pages}},\n`;
  if (paper.publisher) bibtex += `  publisher={${paper.publisher}},\n`;
  if (paper.doi) bibtex += `  doi={${paper.doi}},\n`;
  if (paper.link) bibtex += `  url={${paper.link}},\n`;
  bibtex += `}`;

  return bibtex;
}

/**
 * Format citation in various styles
 */
export function formatCitation(
  paper: Paper,
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard' = 'APA'
): string {
  const authors = paper.authors || 'Unknown Author';
  const year = paper.year || 'n.d.';
  const title = paper.title || 'Untitled';
  const venue = paper.journal || paper.venue || '';

  switch (style) {
    case 'APA':
      return `${authors} (${year}). ${title}. ${venue ? venue + '.' : ''}`;

    case 'MLA':
      return `${authors}. "${title}." ${venue ? venue + ', ' : ''}${year}.`;

    case 'Chicago':
      return `${authors}. "${title}." ${venue ? venue + ' ' : ''}${year}.`;

    case 'Harvard':
      return `${authors} ${year}, '${title}', ${venue ? venue + '.' : ''}`;

    default:
      return `${authors} (${year}). ${title}. ${venue ? venue + '.' : ''}`;
  }
}

/**
 * Extract DOI from various text formats
 */
export function extractDOI(text: string): string | null {
  const doiPattern =
    /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/gi;
  const match = text.match(doiPattern);
  return match ? match[0] : null;
}

/**
 * Extract arXiv ID from text
 */
export function extractArXivId(text: string): string | null {
  const arxivPattern = /(?:arXiv:)?(\d{4}\.\d{4,5}(?:v\d+)?)/i;
  const match = text.match(arxivPattern);
  return match ? match[1] : null;
}

/**
 * Extract PubMed ID from text
 */
export function extractPubMedId(text: string): string | null {
  const pmidPattern = /(?:PMID:?\s*)?(\d{7,8})/i;
  const match = text.match(pmidPattern);
  return match ? match[1] : null;
}