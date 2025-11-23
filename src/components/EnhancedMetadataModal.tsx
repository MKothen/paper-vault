import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Award, Star, Plus } from 'lucide-react';
import type { Paper } from '../types';
import { fetchSemanticScholarData, normalizeDOI } from '../utils/citationUtils';

interface EnhancedMetadataModalProps {
  paper: Paper;
  allTags: string[];
  onClose: () => void;
  onSave: (data: Partial<Paper>) => Promise<void>;
  addToast: (message: string, type?: string) => void;
}

const COLORS = [
  { name: 'Yellow', class: 'bg-nb-yellow', hex: '#FFD90F' },
  { name: 'Cyan', class: 'bg-nb-cyan', hex: '#22d3ee' },
  { name: 'Pink', class: 'bg-nb-pink', hex: '#FF90E8' },
  { name: 'Lime', class: 'bg-nb-lime', hex: '#a3e635' },
  { name: 'Purple', class: 'bg-nb-purple', hex: '#c084fc' },
  { name: 'Orange', class: 'bg-nb-orange', hex: '#fb923c' },
];

const COMMON_METHODS = [
  'Electrophysiology', 'Patch Clamp', 'Voltage Clamp',
  'Calcium Imaging', 'Two-Photon Microscopy', 'Confocal Microscopy',
  'Optogenetics', 'Chemogenetics', 'DREADDs',
  'Behavioral Analysis', 'Fear Conditioning', 'Morris Water Maze',
  'Molecular Biology', 'Western Blot', 'PCR', 'RNA-seq',
  'Immunohistochemistry', 'In Situ Hybridization',
  'Computational Modeling', 'Neural Network Simulation',
  'fMRI', 'EEG', 'MEG'
];

const COMMON_ORGANISMS = [
  'Mouse', 'Rat', 'Human', 'Non-human Primate',
  'Zebrafish', 'C. elegans', 'Drosophila',
  'Cell Culture', 'Organoid', 'Brain Slice'
];

export function EnhancedMetadataModal({ 
  paper, 
  allTags, 
  onClose, 
  onSave, 
  addToast 
}: EnhancedMetadataModalProps) {
  const [formData, setFormData] = useState<Partial<Paper>>({
    ...paper,
    rating: paper.rating || 0,
    methods: paper.methods || [],
    organisms: paper.organisms || [],
    hypotheses: paper.hypotheses || [],
  });
  const [isFetchingCitations, setIsFetchingCitations] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMetadataFromDOI = async () => {
    const currentDoi = formData.doi?.trim();
    
    if (!currentDoi) {
      addToast("Please add a DOI first.", "error");
      return;
    }

    setIsFetchingCitations(true);
    try {
      // Normalize DOI to handle all formats
      const cleanDoi = normalizeDOI(currentDoi);
      
      if (!cleanDoi) {
        addToast("Invalid DOI format. Try: 10.xxxx/xxxx or https://doi.org/10.xxxx/xxxx", "error");
        setIsFetchingCitations(false);
        return;
      }

      console.log('Fetching metadata for normalized DOI:', cleanDoi);
      const data = await fetchSemanticScholarData(cleanDoi, 'DOI');
      
      if (data) {
        console.log('Received data from Semantic Scholar:', data);
        
        // Extract authors
        let authorsString = formData.authors || "";
        if (data.authors && Array.isArray(data.authors) && data.authors.length > 0) {
          authorsString = data.authors.map((author: any) => author.name).join(", ");
        }
        
        // Extract year
        let yearString = formData.year || "";
        if (data.year) {
          yearString = data.year.toString();
        } else if (data.publicationDate) {
          yearString = data.publicationDate.split('-')[0];
        }

        // Create updated form data with all fetched metadata
        const updatedData = {
          ...formData,
          doi: cleanDoi, // Always use the normalized DOI
          title: data.title || formData.title,
          authors: authorsString,
          abstract: data.abstract || formData.abstract,
          year: yearString,
          venue: data.venue || formData.venue,
          citationCount: data.citationCount || 0,
          semanticScholarId: data.paperId || formData.semanticScholarId
        };
        
        console.log('Updating form data with:', updatedData);
        setFormData(updatedData);
        
        addToast(`✓ Metadata fetched! ${data.citationCount || 0} citations found.`, "success");
      } else {
        addToast("DOI not found in Semantic Scholar database.", "error");
      }
    } catch (error) {
      addToast("Error fetching metadata. Please check your connection.", "error");
      console.error('Error fetching DOI metadata:', error);
    }
    setIsFetchingCitations(false);
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      addToast("Title is required!", "error");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      addToast("Failed to save changes.", "error");
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white border-4 border-black shadow-nb w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 hover:rotate-90 transition-transform"
        >
          <X size={32} strokeWidth={3} />
        </button>
        
        <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2">
          Edit Metadata
        </h2>
        
        <div className="space-y-4">
          {/* DOI with Auto-Fill (moved to top for better UX) */}
          <div className="bg-nb-purple/10 p-4 border-2 border-nb-purple">
            <label className="font-bold block mb-2 text-sm uppercase flex items-center gap-2">
              <Wand2 size={16} /> DOI - Auto-Fill All Fields
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Paste any DOI format: <code className="bg-gray-200 px-1">10.xxxx/xxxx</code> | <code className="bg-gray-200 px-1">https://doi.org/10.xxxx/xxxx</code> | <code className="bg-gray-200 px-1">https://www.doi.org/10.xxxx/xxxx</code>
            </p>
            <div className="flex gap-2">
              <input
                className="nb-input flex-1"
                value={formData.doi || ''}
                onChange={e => setFormData({ ...formData, doi: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter' && !isFetchingCitations) fetchMetadataFromDOI(); }}
                placeholder="Paste DOI here..."
                disabled={isFetchingCitations}
              />
              <button
                onClick={fetchMetadataFromDOI}
                disabled={isFetchingCitations || !formData.doi?.trim()}
                className="nb-button bg-nb-purple flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingCitations ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Auto-Fill
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Citation Count Display */}
          {(formData.citationCount || 0) > 0 && (
            <div className="bg-nb-lime p-4 border-2 border-black animate-in fade-in">
              <p className="font-bold text-sm flex items-center gap-2">
                <Award size={20} />
                {formData.citationCount} citations on Semantic Scholar
              </p>
            </div>
          )}
          
          {/* Title */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Title *</label>
            <input
              className="nb-input w-full"
              value={formData.title || ''}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Paper title"
            />
          </div>
          
          {/* Authors */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Authors</label>
            <input
              className="nb-input w-full"
              value={formData.authors || ''}
              onChange={e => setFormData({ ...formData, authors: e.target.value })}
              placeholder="Author names (comma separated)"
            />
          </div>
          
          {/* Year & Venue */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-2 text-sm uppercase">Year</label>
              <input
                className="nb-input w-full"
                value={formData.year || ''}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                placeholder="2025"
              />
            </div>
            <div>
              <label className="font-bold block mb-2 text-sm uppercase">Venue</label>
              <input
                className="nb-input w-full"
                value={formData.venue || ''}
                onChange={e => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Conference or Journal"
              />
            </div>
          </div>
          
          {/* Abstract */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Abstract</label>
            <textarea
              className="nb-input w-full"
              rows={4}
              value={formData.abstract || ''}
              onChange={e => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Paper abstract..."
            />
          </div>
          
          {/* Star Rating */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-2 border-2 border-black hover:bg-nb-yellow transition-colors"
                >
                  <Star
                    size={24}
                    fill={star <= (formData.rating || 0) ? '#FFD90F' : 'none'}
                    strokeWidth={2}
                  />
                </button>
              ))}
              {(formData.rating || 0) > 0 && (
                <button
                  onClick={() => setFormData({ ...formData, rating: 0 })}
                  className="ml-2 px-3 border-2 border-black text-xs font-bold hover:bg-red-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Tags</label>
            <TagInput
              tags={formData.tags || []}
              setTags={(tags) => setFormData({ ...formData, tags })}
              allTags={allTags}
              placeholder="Add tag..."
            />
          </div>
          
          {/* Methods */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Methods</label>
            <TagInput
              tags={formData.methods || []}
              setTags={(methods) => setFormData({ ...formData, methods })}
              allTags={COMMON_METHODS}
              placeholder="Add method..."
            />
          </div>
          
          {/* Organisms */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Model Organisms</label>
            <TagInput
              tags={formData.organisms || []}
              setTags={(organisms) => setFormData({ ...formData, organisms })}
              allTags={COMMON_ORGANISMS}
              placeholder="Add organism..."
            />
          </div>
          
          {/* Hypotheses */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Key Hypotheses</label>
            <textarea
              className="nb-input w-full"
              rows={3}
              value={(formData.hypotheses || []).join('\n')}
              onChange={e => setFormData({
                ...formData,
                hypotheses: e.target.value.split('\n').filter(Boolean)
              })}
              placeholder="One hypothesis per line...\nExample: Dopamine modulates learning rate"
            />
          </div>
          
          {/* Link */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Link</label>
            <input
              className="nb-input w-full"
              value={formData.link || ''}
              onChange={e => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          
          {/* Color */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Color Label</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.name}
                  onClick={() => setFormData({ ...formData, color: c.class })}
                  className={`w-12 h-12 border-4 border-black ${c.class} ${
                    formData.color === c.class ? 'ring-4 ring-offset-2 ring-black' : ''
                  } hover:scale-110 transition-transform`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="font-bold block mb-2 text-sm uppercase">Notes</label>
            <textarea
              className="nb-input w-full"
              rows={4}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Personal notes about this paper..."
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t-4 border-black">
            <button 
              onClick={onClose} 
              className="flex-1 nb-button bg-white"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="flex-1 nb-button bg-nb-lime flex items-center justify-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tag Input Component
interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  allTags: string[];
  placeholder?: string;
}

function TagInput({ tags, setTags, allTags, placeholder = "Add tag..." }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestions = allTags.filter(tag => 
    tag.toLowerCase().includes(input.toLowerCase()) && 
    !tags.includes(tag)
  ).slice(0, 5);
  
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setInput("");
      setShowSuggestions(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {tags.map((tag: string) => (
          <span 
            key={tag} 
            className="bg-black text-white px-3 py-1 text-xs font-bold flex items-center gap-2 border-2 border-black"
          >
            {tag}
            <button 
              onClick={() => setTags(tags.filter((t: string) => t !== tag))}
              className="hover:text-red-400"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex gap-2">
          <input
            className="nb-input py-2 text-sm flex-1"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(input);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
          />
          <button 
            onClick={() => addTag(input)} 
            className="nb-button py-2 px-4 flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black shadow-nb z-10 max-h-40 overflow-y-auto">
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-nb-yellow font-bold text-sm border-b border-gray-200 last:border-b-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}