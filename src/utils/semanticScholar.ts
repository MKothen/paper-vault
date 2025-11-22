import type { CitationData } from '../types';

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';
const SEMANTIC_SCHOLAR_RECOMMENDATIONS_API = 'https://api.semanticscholar.org/recommendations/v1';

export async function fetchCitationData(doi: string): Promise<CitationData | null> {
  try {
    const cleanDoi = doi.replace(/^DOI:/i, '');
    const response = await fetch(`${SEMANTIC_SCHOLAR_API}/paper/DOI:${cleanDoi}?fields=paperId,externalIds,title,citationCount,references,citations`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch citation data:', error);
    return null;
  }
}

// Fetch papers that cite the given paper (removed abstract to avoid 500 errors with high limits)
export async function fetchCitationsWithMetadata(paperId: string, limit: number = 100) {
  try {
    // Removed abstract field - causes 500 errors when combined with high limit
    const fields = [
      'citingPaper.paperId',
      'citingPaper.title',
      'citingPaper.authors',
      'citingPaper.year',
      'citingPaper.venue',
      'citingPaper.citationCount'
    ].join(',');
    const url = `${SEMANTIC_SCHOLAR_API}/paper/${paperId}/citations?fields=${fields}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Semantic Scholar API error:', response.status, response.statusText, url);
      return [];
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch citations:', error);
    return [];
  }
}

export async function fetchRecommendedPapers(
  paperId: string, 
  limit: number = 200, // Max is 500 for recommendations API
  from: 'recent' | 'all-cs' = 'recent'
) {
  try {
    // Removed abstract and externalIds for better performance
    const fields = 'paperId,title,authors,year,venue,citationCount';
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

export async function fetchRecommendedPapersMultiple(
  positivePaperIds: string[],
  negativePaperIds: string[] = [],
  limit: number = 200 // Max is 500 for recommendations API
) {
  try {
    const fields = 'paperId,title,authors,year,venue,citationCount';
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
