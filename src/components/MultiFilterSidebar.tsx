import React from 'react';
import type { FilterState, Paper } from '../types';
import { X, Filter, ChevronDown, Star } from 'lucide-react';

interface Props {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  papers: Paper[];
  onClose: () => void;
}

export function MultiFilterSidebar({ filters, setFilters, papers, onClose }: Props) {
  // Extract unique values
  const uniqueVenues = [...new Set(papers.map(p => p.venue).filter(Boolean))];
  const uniqueAuthors = [...new Set(papers.flatMap(p => p.authors?.split(',').map(a => a.trim()) || []))];
  const uniqueMethods = [...new Set(papers.flatMap(p => p.methods || []))];
  const uniqueOrganisms = [...new Set(papers.flatMap(p => p.organisms || []))];
  const allTags = [...new Set(papers.flatMap(p => p.tags || []))];
  
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...papers.map(p => parseInt(p.year) || currentYear).filter(y => !isNaN(y)));
  
  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: newValue });
  };
  
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      tags: [],
      yearRange: [minYear, currentYear],
      venues: [],
      authors: [],
      status: [],
      colors: [],
      methods: [],
      organisms: [],
      rating: null
    });
  };
  
  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b-2 border-black pb-4 mb-4">
      <h3 className="font-black uppercase text-sm mb-2 flex items-center gap-2">
        <ChevronDown size={16} strokeWidth={3} />
        {title}
      </h3>
      {children}
    </div>
  );
  
  return (
    <div className="w-80 bg-white border-l-4 border-black h-full overflow-y-auto p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase flex items-center gap-2">
          <Filter strokeWidth={3} />
          Filters
        </h2>
        <button onClick={onClose} className="hover:bg-gray-100 p-1">
          <X strokeWidth={3} />
        </button>
      </div>
      
      <button onClick={clearFilters} className="nb-button bg-red-500 text-white mb-4 w-full">
        Clear All
      </button>
      
      <div className="flex-1">
        {/* Year Range */}
        <FilterSection title="Year Range">
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={filters.yearRange[0]}
                onChange={e => setFilters({ ...filters, yearRange: [parseInt(e.target.value), filters.yearRange[1]] })}
                className="nb-input w-24 text-sm"
                min={minYear}
                max={currentYear}
              />
              <span className="font-bold">to</span>
              <input
                type="number"
                value={filters.yearRange[1]}
                onChange={e => setFilters({ ...filters, yearRange: [filters.yearRange[0], parseInt(e.target.value)] })}
                className="nb-input w-24 text-sm"
                min={minYear}
                max={currentYear}
              />
            </div>
          </div>
        </FilterSection>
        
        {/* Rating */}
        <FilterSection title="Minimum Rating">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setFilters({ ...filters, rating: filters.rating === rating ? null : rating })}
                className={`p-2 border-2 border-black ${
                  filters.rating === rating ? 'bg-nb-yellow' : 'bg-white'
                }`}
              >
                <Star size={16} fill={rating <= (filters.rating || 0) ? '#000' : 'none'} strokeWidth={2} />
              </button>
            ))}
          </div>
        </FilterSection>
        
        {/* Status */}
        <FilterSection title="Status">
          <div className="space-y-2">
            {['to-read', 'reading', 'read'].map(status => (
              <label key={status} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => toggleArrayFilter('status', status)}
                  className="w-4 h-4"
                />
                <span className="font-bold text-sm uppercase">{status}</span>
              </label>
            ))}
          </div>
        </FilterSection>
        
        {/* Tags */}
        {allTags.length > 0 && (
          <FilterSection title="Tags">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allTags.map(tag => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={() => toggleArrayFilter('tags', tag)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold">{tag}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}
        
        {/* Methods */}
        {uniqueMethods.length > 0 && (
          <FilterSection title="Methods">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueMethods.map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.methods.includes(method)}
                    onChange={() => toggleArrayFilter('methods', method)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold">{method}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}
        
        {/* Organisms */}
        {uniqueOrganisms.length > 0 && (
          <FilterSection title="Model Organisms">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueOrganisms.map(organism => (
                <label key={organism} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.organisms.includes(organism)}
                    onChange={() => toggleArrayFilter('organisms', organism)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold">{organism}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}
        
        {/* Venues */}
        {uniqueVenues.length > 0 && (
          <FilterSection title="Venues">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueVenues.slice(0, 20).map(venue => (
                <label key={venue} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.venues.includes(venue)}
                    onChange={() => toggleArrayFilter('venues', venue)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-bold">{venue}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}
      </div>
    </div>
  );
}
