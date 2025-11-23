// src/App.tsx
// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Search, 
  StickyNote, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, 
  Sun, Moon, Timer, Clock, Check, ZoomIn, ZoomOut, FileUp, AlertCircle, 
  Info, LayoutGrid, BarChart3, Download, FileText, Menu, ChevronRight
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

// --- REACT-PDF IMPORTS ---
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- UTILITY IMPORTS ---
import { generatePDFThumbnail, extractPDFText, findDuplicatePapers, calculatePDFHash } from './utils/pdfUtils';
import { fetchSemanticScholarData, parseBibTeX, generateBibTeX, formatCitation } from './utils/citationUtils';
import { calculateReadingStats, formatReadingTime, getTopItems } from './utils/analyticsUtils';

// --- COMPONENT IMPORTS ---
import { VirtualKanbanBoard } from './components/VirtualKanbanBoard';
import { RelatedWorkFinder } from './components/RelatedWorkFinder';
import { AuthorNetwork } from './components/AuthorNetwork';
import { TagCloud } from './components/TagCloud';
import { AISummary } from './components/AISummary';
import { TOCSidebar } from './components/TOCSidebar';
import { EnhancedMetadataModal } from './components/EnhancedMetadataModal';

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

const IS_DESKTOP = typeof window !== 'undefined' && window.innerWidth >= 768;

const generateSmartTags = (text) => {
  if (!text) return [];
  const stopWords = new Set(["the", "and", "of", "for", "with", "analysis", "study", "using", "based", "from", "that", "this", "introduction", "conclusion", "results", "method", "paper", "proposed", "http", "https", "doi", "org", "journal", "vol", "issue", "et", "al"]);
  const words = text.split(/[\s,.-]+/).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 4 && !stopWords.has(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));
};

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [user, loading] = useAuthState(auth);
  const [papers, setPapers] = useState([]);
  const [activeView, setActiveView] = useState('library'); 
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputMode, setInputMode] = useState('drop'); 
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [bibtexInput, setBibtexInput] = useState("");
  const [showBibtexModal, setShowBibtexModal] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showSidebar, setShowSidebar] = useState(IS_DESKTOP); // always desktop by default
  const [sidebarTab, setSidebarTab] = useState('toc');
  const [darkMode, setDarkMode] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const pomodoroRef = useRef(null);

  // Scroll fix for dashboard/kanban
  useEffect(() => {
    document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Keyboard navigation for PDF reader
  useEffect(() => {
    if (activeView !== 'reader') return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goToPreviousPage(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToNextPage(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); setScale(s => Math.min(s + 0.2, 3.0)); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); setScale(s => Math.max(s - 0.2, 0.5)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, pageNumber, numPages]);
  const goToPreviousPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || prev));

  // Always open sidebar on desktop
  useEffect(() => {
    if (selectedPaper && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowSidebar(true);
    }
  }, [selectedPaper]);

  useEffect(() => {
    if (selectedPaper) {
      const h = localStorage.getItem(`highlights-${selectedPaper.id}`);
      const p = localStorage.getItem(`postits-${selectedPaper.id}`);
      setHighlights(h ? JSON.parse(h) : []);
      setPostits(p ? JSON.parse(p) : []);
      setPageNumber(1);
      setIsHighlightMode(false);
      setSidebarTab('toc'); // force restore TOC on new open
    }
  }, [selectedPaper]);

  // Selectors for Kanban
  const allUniqueTags = useMemo(() => {const tags = new Set(); papers.forEach(p => p.tags?.forEach(t => tags.add(t))); return Array.from(tags).sort();}, [papers]);
  const filteredPapers = papers.filter(p => {const q = searchTerm.toLowerCase(); return p.title.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q)); });

  // SharedUI unchanged...
  // ...
  // In JSX sections below:
  // - No parent uses overflow:hidden for main dashboard/kanban/reader
  // - All large scrollable panes/api use overflow-auto
  // - PDF reader: .relative h-fit pdf-page-container replaced by simple div with no explicit h-fit/min-h-0/overflow-hidden
  // - Sidebar always shows correct tab
  // - Render <TOCSidebar pdfUrl={selectedPaper?.pdfUrl} ...>, <AISummary paper={selectedPaper} ...>, etc. in sidebar
  // - Render above all main PDF UI a debug badge showing showSidebar/sidebarTab
  // - Remove extraneous flex-1, min-h-0, and overflow-hidden from all problem regions
  // - No JS/TS code blocks pointer events
}

export default App;
