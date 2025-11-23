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

const COMMON_METHODS = [/* ... left unchanged ... */
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

  // ... rest of the UI omitted because unchanged ...

// TagInput stays as in previous version
// Remainder of component unchanged
