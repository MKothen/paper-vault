import type { CitationData } from '../types';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';

export async function fetchCitationData(doi: string): Promise<CitationData | null> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/DOI:${doi}?fields=paperId,externalIds,title,citationCount,references,citations`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch citation data:', error);
    return null;
  }
}

export async function fetchRelatedPapers(paperId: string, limit: number = 10) {
  try {
    // Request citationCount for citing papers, strictly comma-separated, no spaces.
    const queryFields = [
      'citingPaper.paperId',
      'citingPaper.title',
      'citingPaper.authors',
      'citingPaper.year',
      'citingPaper.abstract',
      'citingPaper.venue',
      'citingPaper.citationCount'
    ].join(',');
    const url = `${SEMANTIC_SCHOLAR_API}/paper/${paperId}/citations?fields=${queryFields}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Semantic Scholar API error:', response.status, response.statusText, url);
      return [];
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch related papers:', error);
    return [];
  }
}

export async function searchSemanticScholar(query: string, limit: number = 10) {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(query)}&fields=paperId,title,authors,year,abstract,citationCount&limit=${limit}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to search Semantic Scholar:', error);
    return [];
  }
}

export async function fetchPaperByTitle(title: string) {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(title)}&fields=paperId,externalIds,title,citationCount,references,citations&limit=1`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch paper by title:', error);
    return null;
  }
}
