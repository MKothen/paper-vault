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

// Muted, professional palette for color grading
const COLORS = [
  { name: 'Slate', class: 'bg-nb-slate', hex: '#64748b' },
  { name: 'Stone', class: 'bg-nb-stone', hex: '#78716c' },
  { name: 'Teal', class: 'bg-nb-teal', hex: '#5f9ea0' },
  { name: 'Amber', class: 'bg-nb-amber', hex: '#d4a574' },
  { name: 'Zinc', class: 'bg-nb-zinc', hex: '#71717a' },
  { name: 'Neutral', class: 'bg-nb-neutral', hex: '#737373' },
];

const COMMON_METHODS = [ ... ]; // Omitted for brevity (use original)
const COMMON_ORGANISMS = [ ... ]; // Omitted for brevity (use original)

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

  // Ensure modal form stays fully updated if props.paper changes externally (robust DOI autofill fix)
  useEffect(() => {
    setFormData({
      ...paper,
      rating: paper.rating || 0,
      methods: paper.methods || [],
      organisms: paper.organisms || [],
      hypotheses: paper.hypotheses || [],
    });
  }, [paper]);

  const fetchMetadataFromDOI = async () => {
    const currentDoi = formData.doi?.trim();
    if (!currentDoi) {
      addToast("Please add a DOI first.", "error");
      return;
    }
    setIsFetchingCitations(true);
    try {
      const cleanDoi = normalizeDOI(currentDoi);
      if (!cleanDoi) {
        addToast("Invalid DOI format. Try: 10.xxxx/xxxx or https://doi.org/10.xxxx/xxxx", "error");
        setIsFetchingCitations(false);
        return;
      }
      const data = await fetchSemanticScholarData(cleanDoi, 'DOI');
      if (data) {
        setFormData(prev => ({
          ...prev,
          doi: cleanDoi,
          title: data.title || prev.title,
          authors: (data.authors && Array.isArray(data.authors) && data.authors.length > 0)
            ? data.authors.map((author) => author.name).join(", ") : prev.authors || "",
          abstract: data.abstract || prev.abstract,
          year: data.year?.toString() || (data.publicationDate ? data.publicationDate.split('-')[0] : prev.year || ""),
          venue: data.venue || prev.venue,
          citationCount: data.citationCount || 0,
          semanticScholarId: data.paperId || prev.semanticScholarId,
        }));
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

  // (rest of modal unchanged)
  // ...
}
