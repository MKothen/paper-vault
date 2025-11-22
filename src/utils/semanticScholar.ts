import type { CitationData } from '../types';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';
const SEMANTIC_SCHOLAR_RECOMMENDATIONS_API = 'https://api.semanticscholar.org/recommendations/v1';

export async function fetchCitationData(doi: string): Promise<CitationData | null> {
  try {
    // Clean up the DOI - remove any existing "DOI:" prefix to avoid duplication
    const cleanDoi = doi.replace(/^DOI:/i, '');
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/DOI:${cleanDoi}?fields=paperId,externalIds,title,citationCount,references,citations`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch citation data:', error);
    return null;
  }
}

/**
 * Fetch references (papers cited BY the given paper) with full metadata
 * @param paperId - The Semantic Scholar paper ID
 * @param limit - Number of references to return (max 1000)
 */
export async function fetchReferencesWithMetadata(paperId: string, limit: number = 100) {
  try {
    const queryFields = [
      'citedPaper.paperId',
      'citedPaper.title',
      'citedPaper.authors',
      'citedPaper.year',
      'citedPaper.abstract',
      'citedPaper.venue',
      'citedPaper.citationCount'
    ].join(',');
    const url = `${SEMANTIC_SCHOLAR_API}/paper/${paperId}/references?fields=${queryFields}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Semantic Scholar API error:', response.status, response.statusText, url);
      return [];
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch references:', error);
    return [];
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

/**
 * Get recommended papers using Semantic Scholar's Recommendations API
 * @param paperId - The Semantic Scholar paper ID to get recommendations for
 * @param limit - Number of recommendations to return (max 500, default 10)
 * @param from - Which pool to recommend from: "recent" or "all-cs"
 */
export async function fetchRecommendedPapers(
  paperId: string, 
  limit: number = 10,
  from: 'recent' | 'all-cs' = 'recent'
) {
  try {
    const fields = 'paperId,title,authors,year,abstract,venue,citationCount,externalIds';
    const url = `${SEMANTIC_SCHOLAR_RECOMMENDATIONS_API}/papers/forpaper/${paperId}?fields=${fields}&limit=${limit}&from=${from}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Recommendations API error:', response.status, response.statusText, url);
      return [];
    }
    
    const data = await response.json();
    return data.recommendedPapers || [];
  } catch (error) {
    console.error('Failed to fetch recommended papers:', error);
    return [];
  }
}

/**
 * Get recommended papers using multiple positive and/or negative example papers
 * @param positivePaperIds - Array of Semantic Scholar paper IDs for positive examples
 * @param negativePaperIds - Array of Semantic Scholar paper IDs for negative examples (optional)
 * @param limit - Number of recommendations to return (max 500, default 100)
 */
export async function fetchRecommendedPapersMultiple(
  positivePaperIds: string[],
  negativePaperIds: string[] = [],
  limit: number = 100
) {
  try {
    const fields = 'paperId,title,authors,year,abstract,venue,citationCount,externalIds';
    const url = `${SEMANTIC_SCHOLAR_RECOMMENDATIONS_API}/papers?fields=${fields}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        positivePaperIds,
        negativePaperIds
      })
    });
    
    if (!response.ok) {
      console.error('Recommendations API error:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.recommendedPapers || [];
  } catch (error) {
    console.error('Failed to fetch recommended papers:', error);
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
