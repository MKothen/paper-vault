import React, { useState } from 'react';
import { X, Wand2, Loader2, Award, Star, Plus } from 'lucide-react';
import type { Paper } from '../types';

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

async function fetchCitationData(doi: string) {
  if (!doi) return null;
  const cleanDoi = doi.replace(/^DOI:/i, "").replace("https://doi.org/", "").trim();
  const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(cleanDoi)}?fields=title,authors,year,venue,citationCount`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return await r.json();
}

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

  const fetchCitations = async () => {
    if (!formData.doi) {
      addToast("Please add a DOI first.", "error");
      return;
    }
    setIsFetchingCitations(true);
    try {
      const data = await fetchCitationData(formData.doi);
      if (data) {
        setFormData({
          ...formData,
          citationCount: data.citationCount || 0,
          semanticScholarId: data.paperId
        });
        addToast(`${data.citationCount || 0} citations found!`, "success");
      } else {
        addToast("Failed to fetch citations.", "error");
      }
    } catch (error) {
      addToast("Error fetching citation data.", "error");
    }
    setIsFetchingCitations(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      addToast("Failed to save changes.", "error");
    }
    setIsSaving(false);
  };

  const addTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 md:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border-3 md:border-4 border-black shadow-nb w-full max-w-3xl my-4 md:my-8 max-h-[95vh] md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b-3 md:border-b-4 border-black bg-nb-yellow shrink-0">
          <h2 className="text-xl md:text-2xl font-black uppercase">Edit Paper</h2>
          <button onClick={onClose} className="p-2 hover:bg-black hover:text-white transition-colors rounded">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Title */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="nb-input text-sm md:text-base"
            />
          </div>

          {/* Authors & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 text-sm md:text-base">Authors</label>
              <input
                type="text"
                value={formData.authors || ''}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                className="nb-input text-sm md:text-base"
                placeholder="First Author et al."
              />
            </div>
            <div>
              <label className="block font-bold mb-2 text-sm md:text-base">Year</label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="nb-input text-sm md:text-base"
                placeholder="2024"
              />
            </div>
          </div>

          {/* DOI & Citations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2 text-sm md:text-base">DOI</label>
              <input
                type="text"
                value={formData.doi || ''}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                className="nb-input text-sm md:text-base"
                placeholder="10.xxxx/xxxxx"
              />
            </div>
            <div>
              <label className="block font-bold mb-2 text-sm md:text-base">Citations</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.citationCount || 0}
                  readOnly
                  className="nb-input flex-1 bg-gray-50 text-sm md:text-base"
                />
                <button
                  onClick={fetchCitations}
                  disabled={isFetchingCitations}
                  className="nb-button bg-nb-purple flex items-center gap-2 text-sm md:text-base px-3 md:px-4"
                >
                  {isFetchingCitations ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFormData({ ...formData, rating })}
                  className="p-2 md:p-3 border-2 md:border-3 border-black transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  style={{
                    backgroundColor: formData.rating >= rating ? '#FFD90F' : 'white'
                  }}
                >
                  <Star
                    size={18}
                    fill={formData.rating >= rating ? 'black' : 'none'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.class}
                  onClick={() => setFormData({ ...formData, color: color.class })}
                  className={`w-10 h-10 md:w-12 md:h-12 border-3 md:border-4 border-black ${color.class} transition-all ${
                    formData.color === color.class ? 'ring-4 ring-black ring-offset-2' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-nb-yellow border-2 border-black px-2 md:px-3 py-1 font-bold text-xs md:text-sm"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-600">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.filter(t => !formData.tags?.includes(t)).slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-xs md:text-sm px-2 md:px-3 py-1 border-2 border-black bg-white hover:bg-nb-lime transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Abstract */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Abstract</label>
            <textarea
              value={formData.abstract || ''}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="nb-input min-h-[80px] md:min-h-[100px] text-sm md:text-base"
              placeholder="Paper abstract..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold mb-2 text-sm md:text-base">Personal Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="nb-input min-h-[80px] md:min-h-[100px] text-sm md:text-base"
              placeholder="Your thoughts and notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 p-4 md:p-6 border-t-3 md:border-t-4 border-black bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 nb-button bg-white text-sm md:text-base py-3 md:py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 nb-button bg-nb-lime text-sm md:text-base py-3 md:py-2 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
