import { Paper } from '../types';

// Simple BibTeX parser
export function parseBibTeX(bibtex: string): Partial<Paper> | null {
  try {
    // Extract entry type and key
    const entryMatch = bibtex.match(/@(\w+)\s*{\s*([^,]+),/);
    if (!entryMatch) return null;

    const [, entryType, citationKey] = entryMatch;

    // Extract fields
    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*{([^}]*)}/g;
    let match;

    while ((match = fieldRegex.exec(bibtex)) !== null) {
      fields[match[1].toLowerCase()] = match[2];
    }

    // Also handle fields with quotes
    const quotedFieldRegex = /(\w+)\s*=\s*"([^"]*)"/g;
    while ((match = quotedFieldRegex.exec(bibtex)) !== null) {
      fields[match[1].toLowerCase()] = match[2];
    }

    return {
      title: fields.title || '',
      authors: fields.author || '',
      year: fields.year || '',
      venue: fields.journal || fields.booktitle || fields.publisher || '',
      abstract: fields.abstract || '',
      doi: fields.doi || '',
      link: fields.url || (fields.doi ? `https://doi.org/${fields.doi}` : ''),
    };
  } catch (error) {
    console.error('BibTeX parsing error:', error);
    return null;
  }
}

// Generate BibTeX from paper
export function generateBibTeX(paper: Paper): string {
  const citationKey = paper.title
    .split(' ')
    .slice(0, 3)
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() + paper.year;

  const authors = paper.authors?.split(',').map(a => a.trim()).join(' and ') || 'Unknown';
  
  return `@article{${citationKey},
  title = {${paper.title}},
  author = {${authors}},
  year = {${paper.year || new Date().getFullYear()}},
  journal = {${paper.venue || 'Unknown'}},
  abstract = {${paper.abstract || ''}},
  doi = {${paper.doi || ''}},
  url = {${paper.link || ''}}
}`;
}
