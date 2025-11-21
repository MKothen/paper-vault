// src/components/FullTextSearch.tsx
import React, { useState } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchResult {
  page: number;
  text: string;
  matchIndex: number;
}

interface Props {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultClick: (result: SearchResult) => void;
}

export function FullTextSearch({ onSearch, onResultClick }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setExpanded(true);
    const searchResults = await onSearch(query);
    setResults(searchResults);
    setLoading(false);
  };

  return (
    <div className="bg-white border-2 border-black">
      <div className="flex items-center gap-2 p-2 border-b-2 border-black">
        <div className="flex-1 flex items-center gap-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search in PDF..."
            className="flex-1 outline-none text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="nb-button text-xs px-3 py-1 bg-nb-blue"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
        </button>
        {results.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {expanded && results.length > 0 && (
        <div className="max-h-64 overflow-y-auto">
          <div className="p-2 text-xs text-gray-600 border-b border-gray-200">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </div>
          {results.map((result, idx) => (
            <button
              key={idx}
              onClick={() => onResultClick(result)}
              className="w-full text-left p-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="text-xs text-gray-500 mb-1">Page {result.page}</div>
              <div className="text-sm line-clamp-2">{result.text}</div>
            </button>
          ))}
        </div>
      )}

      {expanded && results.length === 0 && !loading && query && (
        <div className="p-4 text-center text-sm text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
