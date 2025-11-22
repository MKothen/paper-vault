// src/components/RelatedWorkFinder.tsx
import React, { useState, useEffect } from 'react';
import { fetchCitationData, fetchRecommendedPapers, fetchCitationsWithMetadata } from '../utils/semanticScholar';
import type { Paper } from '../types';
import { Loader2, ExternalLink, Plus, RefreshCw, Sparkles, Library } from 'lucide-react';

interface Props {
  currentPaper: Paper;
  onImport: (paper: Partial<Paper>) => void;
}

export function RelatedWorkFinder({ currentPaper, onImport }: Props) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'citedby' | 'recommended'>('citedby');

  useEffect(() => {
    if (currentPaper.semanticScholarId || currentPaper.doi) {
      loadPapers();
    }
  }, [currentPaper, mode]);

  const loadPapers = async () => {
    if (mode === 'citedby') {
      await loadCitedBy();
    } else {
      await loadRecommendations();
    }
  };

  const loadCitedBy = async () => {
    setLoading(true);
    
    let paperId = currentPaper.semanticScholarId;
    if (!paperId && currentPaper.doi) {
      const cleanDoi = currentPaper.doi.replace(/^DOI:/i, '');
      const data = await fetchCitationData(cleanDoi);
      paperId = data?.paperId;
    }
    if (!paperId) {
      console.error('No Semantic Scholar ID for cited-by mode');
      setRelated([]);
      setLoading(false);
      return;
    }
    const citationsData = await fetchCitationsWithMetadata(paperId, 1000);
    let papers = citationsData.map((item: any) => {
      const cite = item.citingPaper;
      if (!cite) return null;
      return {
        paperId: cite.paperId,
        title: cite.title,
        authors: cite.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
        year: cite.year,
        abstract: cite.abstract,
        venue: cite.venue,
        citationCount: cite.citationCount || 0
      };
    }).filter(p => p && p.paperId && p.title);
    papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    setRelated(papers.slice(0, 20));
    setLoading(false);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    let paperId = currentPaper.semanticScholarId;
    if (!paperId && currentPaper.doi) {
      const cleanDoi = currentPaper.doi.replace(/^DOI:/i, '');
      const data = await fetchCitationData(cleanDoi);
      paperId = data?.paperId;
    }
    if (!paperId) {
      console.error('No Semantic Scholar ID for recommendations');
      setRelated([]);
      setLoading(false);
      return;
    }
    const recommendations = await fetchRecommendedPapers(paperId, 1000, 'recent');
    let papers = recommendations.map((paper: any) => ({
      paperId: paper.paperId,
      title: paper.title,
      authors: paper.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
      year: paper.year,
      abstract: paper.abstract,
      venue: paper.venue,
      citationCount: paper.citationCount || 0
    })).filter(p => p.paperId && p.title);
    papers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    setRelated(papers.slice(0, 20));
    setLoading(false);
  };

  return (
    <div className="bg-white border-4 border-black p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('citedby')}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black flex items-center gap-1 ${
              mode === 'citedby' ? 'bg-nb-lime' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Library size={14} />
            Cited By
          </button>
          <button
            onClick={() => setMode('recommended')}
            className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black flex items-center gap-1 ${
              mode === 'recommended' ? 'bg-nb-peach' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Sparkles size={14} />
            AI Recommended
          </button>
        </div>
        <button onClick={loadPapers} className="p-1 hover:bg-gray-100 rounded">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="mb-2 text-xs text-gray-600">
        {mode === 'citedby' 
          ? 'Top 20 most-cited papers that cite this paper'
          : 'Top 20 most-cited AI-recommended papers for this paper'}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : related.length === 0 ? (
          <p className="text-gray-500 text-sm text-center italic">
            {mode === 'citedby' ? 'No citing papers found.' : 'No recommendations available.'}
          </p>
        ) : (
          related.map((paper, idx) => (
            <div key={paper.paperId || paper.title || idx} className="border-2 border-black p-3 hover:bg-gray-50 transition-colors">
              <h4 className="font-bold text-sm leading-tight mb-1">{paper.title}</h4>
              <div className="text-xs text-gray-600 mb-2 flex items-center justify-between">
                <span>{paper.year}</span>
                <span className="truncate max-w-[120px]">{paper.authors}</span>
                <span className="ml-2 text-gray-400">{paper.citationCount || 0} cites</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => onImport({
                    title: paper.title,
                    authors: paper.authors,
                    year: paper.year?.toString(),
                    abstract: paper.abstract,
                    venue: paper.venue,
                    semanticScholarId: paper.paperId
                  })}
                  className="nb-button py-1 px-2 text-xs flex items-center gap-1 bg-nb-lime flex-1 justify-center"
                >
                  <Plus size={12} /> Add to Library
                </button>
                <a 
                  href={`https://www.semanticscholar.org/paper/${paper.paperId}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="nb-button py-1 px-2 text-xs bg-white"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
