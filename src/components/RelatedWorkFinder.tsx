// src/components/RelatedWorkFinder.tsx
import React, { useState, useEffect } from 'react';
import { fetchRelatedPapers } from '../utils/semanticScholar';
import type { Paper } from '../types';
import { Loader2, ExternalLink, Plus, RefreshCw } from 'lucide-react';

interface Props {
  currentPaper: Paper;
  onImport: (paper: Partial<Paper>) => void;
}

export function RelatedWorkFinder({ currentPaper, onImport }: Props) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentPaper.semanticScholarId || currentPaper.doi) {
      loadRelated();
    }
  }, [currentPaper]);

  const loadRelated = async () => {
    setLoading(true);
    const id = currentPaper.semanticScholarId || `DOI:${currentPaper.doi}`;
    // Fetch citations (papers that cite this one) as they are often "related work"
    const data = await fetchRelatedPapers(id, 10);
    
    // Transform API data
    const cleanData = data.map((item: any) => ({
      paperId: item.paperId,
      title: item.title,
      authors: item.authors?.map((a: any) => a.name).join(', ') || 'Unknown',
      year: item.year,
      abstract: item.abstract,
      venue: item.venue,
      isImp: false
    }));
    
    setRelated(cleanData);
    setLoading(false);
  };

  return (
    <div className="bg-white border-4 border-black p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
        <h3 className="font-black uppercase">Related Work</h3>
        <button onClick={loadRelated} className="p-1 hover:bg-gray-100 rounded">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : related.length === 0 ? (
          <p className="text-gray-500 text-sm text-center italic">No related papers found.</p>
        ) : (
          related.map((paper) => (
            <div key={paper.paperId} className="border-2 border-black p-3 hover:bg-gray-50 transition-colors">
              <h4 className="font-bold text-sm leading-tight mb-1">{paper.title}</h4>
              <div className="text-xs text-gray-600 mb-2 flex justify-between">
                <span>{paper.year}</span>
                <span className="truncate max-w-[150px]">{paper.authors}</span>
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