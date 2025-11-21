// src/components/FullTextSearch.tsx
import React, { useState, useEffect } from 'react';
import type { Paper } from '../types';
import { extractPDFText } from '../utils/pdfUtils';
import { Search, Loader2, FileText } from 'lucide-react';

interface Props {
  papers: Paper[];
  onSelect: (paper: Paper) => void;
}

export function FullTextSearch({ papers, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ paper: Paper, match: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  // Note: In a real app, you'd index this text in a DB or client-side index like Lunr.js.
  // For this implementation, we assume the text might be stored or extracted on demand (which is slow).
  // A better approach for local-first is storing extracted text in IndexedDB.

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    
    const hits: Array<{ paper: Paper, match: string }> = [];
    
    // NOTE: Searching full text of ALL papers on demand is heavy. 
    // This is a simplified demonstration. In production, use a search index.
    // Here we simulate searching the 'abstract' and 'notes' which are readily available,
    // plus checking if we have cached text content (mocked).
    
    const lowerQ = query.toLowerCase();
    
    for (const paper of papers) {
      let match = '';
      
      // 1. Check Abstract
      if (paper.abstract?.toLowerCase().includes(lowerQ)) {
        const idx = paper.abstract.toLowerCase().indexOf(lowerQ);
        match = '...' + paper.abstract.substring(Math.max(0, idx - 30), idx + lowerQ.length + 30) + '...';
      }
      // 2. Check Notes
      else if (paper.notes?.toLowerCase().includes(lowerQ)) {
        const idx = paper.notes.toLowerCase().indexOf(lowerQ);
        match = '...' + paper.notes.substring(Math.max(0, idx - 30), idx + lowerQ.length + 30) + '...';
      }
      
      if (match) {
        hits.push({ paper, match });
      }
    }
    
    setResults(hits);
    setIsSearching(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search abstracts and notes..."
          className="w-full p-4 pl-12 border-4 border-black shadow-nb text-lg font-bold focus:outline-none"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        <button 
          onClick={handleSearch}
          className="absolute right-2 top-2 bottom-2 px-4 bg-nb-cyan border-2 border-black font-bold hover:bg-nb-cyan/80"
        >
          {isSearching ? <Loader2 className="animate-spin"/> : 'Search'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map(({ paper, match }) => (
          <div key={paper.id} onClick={() => onSelect(paper)} className="bg-white border-2 border-black p-4 hover:bg-gray-50 cursor-pointer shadow-sm">
            <h4 className="font-black text-lg flex items-center gap-2">
              <FileText size={16} className="text-nb-purple" />
              {paper.title}
            </h4>
            <p className="text-sm text-gray-500 font-mono mb-2">{paper.authors}</p>
            <div className="bg-yellow-50 p-2 border border-gray-200 text-sm font-serif italic">
              "{match}"
            </div>
          </div>
        ))}
        {query && !isSearching && results.length === 0 && (
          <div className="text-center text-gray-500 font-bold">No matches found.</div>
        )}
      </div>
    </div>
  );
}