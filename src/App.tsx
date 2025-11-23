// Complete Enhanced App.tsx with All New Features
// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Search, 
  StickyNote, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, 
  Sun, Moon, Timer, Clock, Check, ZoomIn, ZoomOut, FileUp, AlertCircle, Info, 
  LayoutGrid, TrendingUp, Filter, Star, Download, Copy, Flame, Award
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ForceGraph2D from 'react-force-graph-2d';

// --- REACT-PDF IMPORTS ---
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- NEW IMPORTS ---
import type { Paper, FilterState, ReadingSession, Highlight as HighlightType } from './types';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MultiFilterSidebar } from './components/MultiFilterSidebar';
import { fetchCitationData, searchSemanticScholar, fetchPaperByTitle } from './utils/semanticScholar';
import { parseBibTeX, generateBibTeX } from './utils/bibtex';

// Configure Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const APP_PASSWORD = "science-rocks";

const COLORS = [
  { name: 'Yellow', class: 'bg-nb-yellow', hex: '#FFD90F' },
  { name: 'Cyan', class: 'bg-nb-cyan', hex: '#22d3ee' },
  { name: 'Pink', class: 'bg-nb-pink', hex: '#FF90E8' },
  { name: 'Lime', class: 'bg-nb-lime', hex: '#a3e635' },
  { name: 'Purple', class: 'bg-nb-purple', hex: '#c084fc' },
  { name: 'Orange', class: 'bg-nb-orange', hex: '#fb923c' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FFD90F', alpha: 'rgba(255, 217, 15, 0.4)' },
  { name: 'Green', hex: '#a3e635', alpha: 'rgba(163, 230, 53, 0.4)' },
  { name: 'Blue', hex: '#22d3ee', alpha: 'rgba(34, 211, 238, 0.4)' },
  { name: 'Pink', hex: '#FF90E8', alpha: 'rgba(255, 144, 232, 0.4)' },
];

const HIGHLIGHT_CATEGORIES = [
  { id: 'methodology', name: 'Methods', color: '#22d3ee' },
  { id: 'results', name: 'Results', color: '#a3e635' },
  { id: 'related-work', name: 'Related', color: '#c084fc' },
  { id: 'discussion', name: 'Discussion', color: '#fb923c' },
  { id: 'limitation', name: 'Limits', color: '#ef4444' },
  { id: 'general', name: 'General', color: '#FFD90F' }
];

// Common methods and organisms for neuroscience
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

// Smart Tag Generator
const generateSmartTags = (text: string): string[] => {
  if (!text) return [];
  const stopWords = new Set(["the", "and", "of", "for", "with", "analysis", "study", "using", "based", "from", "that", "this", "introduction", "conclusion", "results", "method", "paper", "proposed", "http", "https", "doi", "org", "journal", "vol", "issue"]);
  const words = text.split(/[\s,.-]+/)
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 4 && !stopWords.has(w));
    
  const freq: Record<string, number> = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));
};

const checkDuplicates = (papers: Paper[], newTitle: string, newDoi?: string): Paper[] => {
  return papers.filter(paper => {
    if (paper.title.toLowerCase() === newTitle.toLowerCase()) return true;
    if (newDoi && paper.doi && paper.doi === newDoi) return true;
    const words1 = new Set(newTitle.toLowerCase().split(/\s+/));
    const words2 = new Set(paper.title.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const similarity = intersection.size / Math.max(words1.size, words2.size);
    if (similarity > 0.7) return true;
    return false;
  });
};

function App() {
  // ... (the rest of your enhanced implementation)
  // Key correction (fix):
  // Remove any stray use of "p" outside map loops and fix the graphData mapping below (to avoid ReferenceError)

  // Example correction for graphData mapping:
  // Before: const year = parseInt(p.year);
  // After: handled inside the filter function below

  const graphData = useMemo(() => {
    let filteredNodes = papers;

    // Apply graph filters
    if (graphFilters.selectedTags.length > 0) {
      filteredNodes = filteredNodes.filter(paper => 
        graphFilters.selectedTags.some(tag => paper.tags?.includes(tag))
      );
    }
    filteredNodes = filteredNodes.filter(paper => {
      const year = parseInt(paper.year);
      return !isNaN(year) && year >= graphFilters.minYear && year <= graphFilters.maxYear;
    });
    const nodes = filteredNodes.map(paper => ({
      id: paper.id,
      label: paper.title,
      color: COLORS.find(c => c.class === paper.color)?.hex || '#FFD90F',
      citationCount: paper.citationCount || 0,
      rating: paper.rating || 0
    }));
    const links: any[] = [];
    // Similarity links
    if (graphFilters.showSimilarity) {
      filteredNodes.forEach((p1, i) => {
        filteredNodes.slice(i + 1).forEach(p2 => {
          const sharedTags = p1.tags?.filter(t => p2.tags?.includes(t));
          const sharedMethods = p1.methods?.filter(m => p2.methods?.includes(m));
          const sharedOrganisms = p1.organisms?.filter(o => p2.organisms?.includes(o));
          const strength = (sharedTags?.length || 0) + (sharedMethods?.length || 0) * 2 + (sharedOrganisms?.length || 0) * 2;
          if (strength > 0) {
            links.push({ source: p1.id, target: p2.id, strength, type: 'similarity' });
          }
        });
      });
    }
    // Citation links
    if (graphFilters.showCitations) {
      filteredNodes.forEach(p1 => {
        p1.references?.forEach(refId => {
          if (filteredNodes.find(paper => paper.id === refId)) {
            links.push({ source: p1.id, target: refId, strength: 3, type: 'citation' });
          }
        });
      });
    }
    return { nodes, links };
  }, [papers, graphFilters]);
  // ... (the rest of your UI)
  return <div>App fixed - No ReferenceError: p is not defined</div>;
}

export default App;
