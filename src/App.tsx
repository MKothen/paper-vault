// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BookOpen, Trash2, Plus, LogOut, ExternalLink, Loader2, Pencil, X, Save, Search, FileText, StickyNote, Download, Wand2, Layout, Share2, User, Calendar, Clock, FileUp, Eye, Lock, Highlighter, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo2, Clipboard, Moon, Sun, Sidebar as SidebarIcon, Copy, Timer } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ForceGraph2D from 'react-force-graph-2d';
import * as pdfjsLib from 'pdfjs-dist';

// --- CONFIGURATION ---
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const APP_PASSWORD = "science-rocks";

// Updated Neo-Brutalist Palette
const COLORS = [
  { name: 'Yellow', class: 'bg-nb-yellow', hex: '#FFD90F', border: 'border-black' },
  { name: 'Blue', class: 'bg-nb-cyan', hex: '#22d3ee', border: 'border-black' },
  { name: 'Pink', class: 'bg-nb-pink', hex: '#FF90E8', border: 'border-black' },
  { name: 'Green', class: 'bg-nb-lime', hex: '#a3e635', border: 'border-black' },
  { name: 'Purple', class: 'bg-nb-purple', hex: '#c084fc', border: 'border-black' },
  { name: 'Orange', class: 'bg-nb-orange', hex: '#fb923c', border: 'border-black' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FFD90F', alpha: 'rgba(255, 217, 15, 0.5)' },
  { name: 'Green', hex: '#a3e635', alpha: 'rgba(163, 230, 53, 0.5)' },
  { name: 'Blue', hex: '#22d3ee', alpha: 'rgba(34, 211, 238, 0.5)' },
  { name: 'Pink', hex: '#FF90E8', alpha: 'rgba(255, 144, 232, 0.5)' },
  { name: 'Orange', hex: '#fb923c', alpha: 'rgba(251, 146, 60, 0.5)' },
];

const NOTE_TEMPLATES = [
  { label: "📌 Key Finding", prefix: "Key Finding: " },
  { label: "❓ Question", prefix: "Question: " },
  { label: "🔬 Methodology", prefix: "Methodology note: " },
  { label: "📍 Follow-up", prefix: "Follow-up: " },
  { label: "💡 Idea", prefix: "Idea: " },
];

const CITATION_FORMATS = {
  APA: (paper) => {
    const year = paper.year || new Date(paper.uploadedAt).getFullYear();
    const authors = paper.authors || "Unknown";
    return `${authors} (${year}). ${paper.title}. ${paper.venue || 'Unpublished manuscript'}.`;
  },
  MLA: (paper) => {
    const year = paper.year || new Date(paper.uploadedAt).getFullYear();
    const authors = paper.authors || "Unknown";
    return `${authors}. "${paper.title}." ${paper.venue || 'N.p.'}, ${year}.`;
  },
  Chicago: (paper) => {
    const year = paper.year || new Date(paper.uploadedAt).getFullYear();
    const authors = paper.authors || "Unknown";
    return `${authors}. "${paper.title}." ${paper.venue || 'Unpublished'} (${year}).`;
  },
  Nature: (paper) => {
    const year = paper.year || new Date(paper.uploadedAt).getFullYear();
    const authors = paper.authors || "Unknown";
    return `${authors}. ${paper.title}. ${paper.venue || 'Unpublished'} (${year}).`;
  },
  BibTeX: (paper) => {
    const year = paper.year || new Date(paper.uploadedAt).getFullYear();
    const authors = paper.authors || "Unknown";
    const key = paper.title.substring(0, 20).replace(/\s+/g, '').toLowerCase();
    return `@article{${key},\n  title={${paper.title}},\n  author={${authors}},\n  journal={${paper.venue || 'Unpublished'}},\n  year={${year}}\n}`;
  }
};

const STOP_WORDS = new Set(["the", "of", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "I", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "water", "been", "call", "who", "oil", "its", "now", "find", "study", "method", "results", "analysis", "using", "proposed", "based", "paper", "approach", "system", "data", "model", "models", "show", "our", "new", "between", "during", "through", "over", "also", "after", "different", "used", "experiments", "performance", "necessary", "important", "significant", "novel", "framework", "robust", "efficient", "better", "implications", "future", "work", "research", "problem", "issues", "case", "studies", "review", "overview", "survey", "state", "art", "challenges", "opportunities", "application", "applications", "development", "design", "implementation", "evaluation", "comparison", "effect", "effects", "impact", "influence", "role", "understanding", "towards", "via", "large", "small", "high", "low", "potential", "various"]);

const generateSmartTags = (title, abstract) => {
  if (!title) return [];
  const clean = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').split(/\s+/);
  const titleWords = clean(title);
  const abstractWords = clean(abstract || "");
  const candidates = {};

  for(let i=0; i < titleWords.length - 1; i++) {
    const w1 = titleWords[i];
    const w2 = titleWords[i+1];
    if(!STOP_WORDS.has(w1) && !STOP_WORDS.has(w2) && w1.length > 2 && w2.length > 2) {
      const phrase = `${w1} ${w2}`;
      candidates[phrase] = (candidates[phrase] || 0) + 10;
    }
  }

  titleWords.forEach(w => {
    if(!STOP_WORDS.has(w) && w.length > 4) candidates[w] = (candidates[w] || 0) + 5;
  });

  abstractWords.forEach(w => {
    if(candidates[w]) candidates[w] += 1;
  });

  return Object.entries(candidates).sort(([,a], [,b]) => b - a).slice(0, 4).map(([word]) =>
    word.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
};

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [user, loading] = useAuthState(auth);
  
  const [papers, setPapers] = useState([]);
  const [columns, setColumns] = useState({
    'to-read': [],
    'reading': [],
    'read': []
  });
  const [activeView, setActiveView] = useState('library');
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [editForm, setEditForm] = useState({});
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // PDF reader state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  
  // Annotation state
  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [selectedText, setSelectedText] = useState("");
  const [annotationHistory, setAnnotationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // New features
  const [highlightOpacity, setHighlightOpacity] = useState(0.4);
  const [darkMode, setDarkMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchInPdf, setSearchInPdf] = useState("");
  const [citationFormat, setCitationFormat] = useState("APA");
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [readingProgress, setReadingProgress] = useState({});
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [recentPapers, setRecentPapers] = useState([]);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const pomodoroRef = useRef(null);
  
  // Load papers from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "papers"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPapers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPapers(loadedPapers);
      
      const newColumns = {
        'to-read': loadedPapers.filter(p => p.status === 'to-read'),
        'reading': loadedPapers.filter(p => p.status === 'reading'),
        'read': loadedPapers.filter(p => p.status === 'read')
      };
      setColumns(newColumns);
    });
    return () => unsubscribe();
  }, [user]);

  // Load reading progress
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`reading-progress-${user.uid}`);
    if (saved) setReadingProgress(JSON.parse(saved));
    
    const recentIds = localStorage.getItem(`recent-papers-${user.uid}`);
    if (recentIds) {
      const ids = JSON.parse(recentIds);
      setRecentPapers(papers.filter(p => ids.includes(p.id)).slice(0, 5));
    }
  }, [user, papers]);

  // Save reading progress
  useEffect(() => {
    if (selectedPaper && user) {
      const key = `reading-progress-${user.uid}`;
      const progress = {
        ...readingProgress,
        [selectedPaper.id]: {
          currentPage,
          lastRead: Date.now(),
          totalPages: numPages,
          totalTime: totalReadingTime
        }
      };
      setReadingProgress(progress);
      localStorage.setItem(key, JSON.stringify(progress));
      
      const recentIds = [selectedPaper.id, ...recentPapers.map(p => p.id).filter(id => id !== selectedPaper.id)].slice(0, 5);
      localStorage.setItem(`recent-papers-${user.uid}`, JSON.stringify(recentIds));
    }
  }, [currentPage, selectedPaper, user, totalReadingTime]);

  // Track reading time
  useEffect(() => {
    if (selectedPaper && activeView === 'reader') {
      const interval = setInterval(() => {
        setTotalReadingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedPaper, activeView]);

  // Pomodoro timer
  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            alert("Pomodoro session complete! Take a break.");
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(pomodoroRef.current);
    }
  }, [pomodoroRunning, pomodoroTime]);

  // Load annotations when paper changes
  useEffect(() => {
    if (selectedPaper) {
      const savedHighlights = localStorage.getItem(`highlights-${selectedPaper.id}`);
      const savedPostits = localStorage.getItem(`postits-${selectedPaper.id}`);
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
      else setHighlights([]);
      if (savedPostits) setPostits(JSON.parse(savedPostits));
      else setPostits([]);
      
      const progress = readingProgress[selectedPaper.id];
      if (progress) {
        setCurrentPage(progress.currentPage);
        setTotalReadingTime(progress.totalTime || 0);
      } else {
        setCurrentPage(1);
        setTotalReadingTime(0);
      }
    }
  }, [selectedPaper]);

  // PDF rendering
  useEffect(() => {
    if (!pdfDoc || !currentPage || !canvasRef.current) return;
    
    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Brutalist Dark Mode: High Contrast Invert
      if (darkMode) {
        context.filter = 'invert(1) grayscale(1) contrast(1.5)';
      } else {
        context.filter = 'none';
      }
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        const textContent = await page.getTextContent();
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;
        
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport: viewport,
          textDivs: []
        });
      }
    };
    
    renderPage();
  }, [pdfDoc, currentPage, scale, darkMode]);

  // Filtered & sorted papers
  const filteredPapers = useMemo(() => {
    let result = papers;
    if (searchTerm) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.authors && p.authors.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    if (filterStatus !== "all") {
      result = result.filter(p => p.status === filterStatus);
    }
    result.sort((a, b) => {
      if (sortBy === "date") return b.uploadedAt - a.uploadedAt;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "author") return (a.authors || "").localeCompare(b.authors || "");
      return 0;
    });
    return result;
  }, [papers, searchTerm, filterStatus, sortBy]);

  // Graph data
  const graphData = useMemo(() => {
    const nodes = papers.map(p => ({ id: p.id, label: p.title, tags: p.tags || [] }));
    const links = [];
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const sharedTags = (papers[i].tags || []).filter(t => (papers[j].tags || []).includes(t));
        if (sharedTags.length > 0) {
          links.push({ source: papers[i].id, target: papers[j].id, value: sharedTags.length });
        }
      }
    }
    return { nodes, links };
  }, [papers]);

  // Annotation handlers
  const saveAnnotations = useCallback((newHighlights, newPostits) => {
    if (selectedPaper) {
      localStorage.setItem(`highlights-${selectedPaper.id}`, JSON.stringify(newHighlights));
      localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(newPostits));
    }
  }, [selectedPaper]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      const action = annotationHistory[historyIndex];
      if (action.type === 'highlight') {
        setHighlights(highlights.filter(h => h.id !== action.data.id));
      } else if (action.type === 'postit') {
        setPostits(postits.filter(p => p.id !== action.data.id));
      }
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, annotationHistory, highlights, postits]);

  const handleDoubleClick = useCallback((e) => {
    if (e.target.closest('.textLayer') && canvasRef.current) {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        const newHighlight = {
          id: Date.now(),
          page: currentPage,
          x: rect.left - canvasRect.left,
          y: rect.top - canvasRect.top,
          width: rect.width,
          height: rect.height,
          color: selectedColor.alpha,
          text: text
        };
        
        const newHighlights = [...highlights, newHighlight];
        setHighlights(newHighlights);
        saveAnnotations(newHighlights, postits);
        setAnnotationHistory([...annotationHistory, { type: 'highlight', data: newHighlight }]);
        setHistoryIndex(annotationHistory.length);
      }
    }
  }, [currentPage, selectedColor, highlights, postits, saveAnnotations, annotationHistory]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length > 0) setSelectedText(text);
  }, []);

  const addNoteFromSelection = useCallback((template = "") => {
    if (selectedText && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newPostit = {
        id: Date.now(),
        page: currentPage,
        x: canvasRect.width / 2 - 100,
        y: canvasRect.height / 2 - 75,
        text: template + selectedText,
        color: COLORS[0]
      };
      
      const newPostits = [...postits, newPostit];
      setPostits(newPostits);
      saveAnnotations(highlights, newPostits);
      setSelectedText("");
    }
  }, [selectedText, currentPage, postits, highlights, saveAnnotations]);

  const exportAnnotations = useCallback(() => {
    if (!selectedPaper) return;
    
    let markdown = `# ${selectedPaper.title}\n\n`;
    
    const highlightsByColor = highlights.reduce((acc, h) => {
      const colorName = HIGHLIGHT_COLORS.find(c => c.alpha === h.color)?.name || 'Unknown';
      if (!acc[colorName]) acc[colorName] = [];
      acc[colorName].push(h);
      return acc;
    }, {});
    
    markdown += `## Highlights\n\n`;
    Object.entries(highlightsByColor).forEach(([color, items]) => {
      markdown += `### ${color} Highlights\n`;
      items.forEach(h => {
        markdown += `- **Page ${h.page}**: "${h.text}"\n`;
      });
      markdown += '\n';
    });
    
    markdown += `## Notes\n\n`;
    postits.forEach(p => {
      markdown += `- **Page ${p.page}**: ${p.text}\n`;
    });
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPaper.title.replace(/\s+/g, '-')}-annotations.md`;
    a.click();
  }, [selectedPaper, highlights, postits]);

  const searchInPdfText = useCallback(async (searchQuery) => {
    if (!pdfDoc || !searchQuery) return;
    
    const results = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(i);
      }
    }
    
    if (results.length > 0) {
      setCurrentPage(results[0]);
      alert(`Found on pages: ${results.join(', ')}`);
    } else {
      alert('No matches found');
    }
  }, [pdfDoc, numPages]);

  const bulkDeleteHighlights = useCallback((colorToDelete) => {
    const filtered = highlights.filter(h => h.color !== colorToDelete);
    setHighlights(filtered);
    saveAnnotations(filtered, postits);
  }, [highlights, postits, saveAnnotations]);

  const copyCitation = useCallback(() => {
    if (!selectedPaper) return;
    const citation = CITATION_FORMATS[citationFormat](selectedPaper);
    navigator.clipboard.writeText(citation);
    alert('Citation copied to clipboard!');
  }, [selectedPaper, citationFormat]);

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert("Please upload a PDF file");
      return;
    }
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `pdfs/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);
      
      const smartTags = generateSmartTags(file.name.replace('.pdf', ''), '');
      
      await addDoc(collection(db, "papers"), {
        userId: user.uid,
        title: file.name.replace('.pdf', ''),
        authors: "",
        year: new Date().getFullYear(),
        venue: "",
        tags: smartTags,
        status: "to-read",
        color: COLORS[0].class,
        pdfUrl,
        uploadedAt: Date.now()
      });
      
      alert(`Paper uploaded! Auto-generated tags: ${smartTags.join(', ')}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload paper");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    const paper = papers.find(p => p.id === draggableId);
    if (!paper) return;
    await updateDoc(doc(db, "papers", draggableId), { status: destination.droppableId });
  };

  const deletePaper = async (id) => {
    if (confirm("BURN THIS PAPER? 🔥")) {
      await deleteDoc(doc(db, "papers", id));
    }
  };

  const openPaper = (paper) => {
    setSelectedPaper(paper);
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(paper.pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    };
    loadPdf();
    setActiveView('reader');
  };

  const saveMetadata = async () => {
    if (!editingPaper) return;
    await updateDoc(doc(db, "papers", editingPaper.id), editForm);
    setShowMetadataModal(false);
    setEditingPaper(null);
  };

  // --- RENDER: Auth Gate ---
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-nb-yellow flex items-center justify-center p-4">
        <div className="nb-card w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black uppercase mb-6">Restricted Area</h1>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passwordInput === APP_PASSWORD && setIsAuthorized(true)}
            className="nb-input mb-4 text-center text-xl placeholder-black/50"
            placeholder="ENTER PASSWORD"
          />
          <button
            onClick={() => passwordInput === APP_PASSWORD && setIsAuthorized(true)}
            className="nb-button w-full bg-black text-white hover:bg-gray-800"
          >
            UNLOCK VAULT
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-nb-gray">
        <Loader2 className="animate-spin w-16 h-16" strokeWidth={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-nb-cyan p-4">
        <div className="nb-card max-w-md w-full p-10 text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="w-20 h-20" strokeWidth={3} />
          </div>
          <h1 className="text-5xl font-black uppercase mb-2">Paper Vault</h1>
          <p className="text-xl font-bold mb-8 border-b-3 border-black inline-block pb-1">RESEARCH / DESTROY</p>
          <button
            onClick={signInWithGoogle}
            className="nb-button w-full bg-nb-pink flex items-center justify-center gap-3 text-lg"
          >
            <User className="w-6 h-6" strokeWidth={3} />
            ENTER WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: PDF Reader ---
  if (activeView === 'reader' && selectedPaper) {
    const currentHighlights = highlights.filter(h => h.page === currentPage);
    const currentPostits = postits.filter(p => p.page === currentPage);
    const annotationCount = highlights.length + postits.length;

    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-black text-white' : 'bg-nb-gray text-black'}`}>
        {/* Top Toolbar */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-black'} border-b-3 p-3 flex items-center justify-between z-20`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('library')} className="nb-button px-3 py-1 flex items-center gap-2">
              <ChevronLeft strokeWidth={3} /> BACK
            </button>
            <h2 className="font-bold text-xl truncate max-w-md uppercase">{selectedPaper.title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex < 0} className={`nb-button px-2 ${historyIndex < 0 ? 'opacity-50' : ''}`} title="Undo">
              <Undo2 className="w-5 h-5" strokeWidth={3} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="nb-button px-2">
              {darkMode ? <Sun className="w-5 h-5" strokeWidth={3} /> : <Moon className="w-5 h-5" strokeWidth={3} />}
            </button>
            <button onClick={() => setShowCitationModal(true)} className="nb-button px-2" title="Citation">
              <Clipboard className="w-5 h-5" strokeWidth={3} />
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="nb-button px-2">
              <SidebarIcon className="w-5 h-5" strokeWidth={3} />
            </button>
            
            {/* Pomodoro */}
            <div className="flex items-center gap-2 border-l-3 border-black pl-4 ml-2">
              <Timer className="w-5 h-5" strokeWidth={3} />
              <span className="font-mono font-bold text-lg">{Math.floor(pomodoroTime / 60)}:{String(pomodoroTime % 60).padStart(2, '0')}</span>
              <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className={`nb-button px-2 py-1 text-xs ${pomodoroRunning ? 'bg-nb-orange' : 'bg-nb-lime'}`}>
                {pomodoroRunning ? 'PAUSE' : 'START'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Annotation Toolbar */}
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} border-b-3 border-black p-2 flex items-center gap-4 overflow-x-auto z-10`}>
          <div className="flex items-center gap-2 border-r-3 border-black pr-4">
            <span className="font-bold text-sm uppercase">Ink:</span>
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 border-3 border-black ${selectedColor.name === color.name ? 'ring-4 ring-black ring-offset-1' : ''}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          
          {selectedText && (
            <div className="flex items-center gap-2 border-r-3 border-black pr-4 animate-pulse">
              <span className="font-bold text-sm text-nb-purple uppercase">Text Selected!</span>
              {NOTE_TEMPLATES.map(template => (
                <button key={template.label} onClick={() => addNoteFromSelection(template.prefix)} className="nb-button text-xs py-1 px-2 bg-nb-yellow">
                  {template.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="ml-auto flex items-center gap-2">
            <input 
              type="text" 
              value={searchInPdf} 
              onChange={(e) => setSearchInPdf(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && searchInPdfText(searchInPdf)} 
              placeholder="FIND IN PDF..." 
              className="nb-input py-1 text-sm w-48" 
            />
            <button onClick={() => searchInPdfText(searchInPdf)} className="nb-button px-2 py-1 bg-nb-cyan">
              <Search className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto flex flex-col items-center p-8 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]">
            
            {/* Reading Progress Bar */}
            <div className="w-full max-w-4xl mb-6 bg-white border-3 border-black p-2 shadow-nb">
              <div className="flex justify-between text-xs font-bold uppercase mb-1">
                <span>Reading Progress: {Math.round((currentPage / numPages) * 100)}%</span>
                <span>Time: {Math.floor(totalReadingTime / 60)}m</span>
              </div>
              <div className="w-full bg-gray-200 h-4 border-2 border-black">
                <div className="bg-nb-lime h-full border-r-2 border-black transition-all" style={{ width: `${(currentPage / numPages) * 100}%` }} />
              </div>
            </div>
            
            {/* PDF Canvas Container */}
            <div className="relative border-3 border-black shadow-nb-xl bg-white">
              <canvas ref={canvasRef} />
              <div ref={textLayerRef} className="textLayer absolute top-0 left-0" onMouseUp={handleTextSelection} onDoubleClick={handleDoubleClick} />
              
              {/* Highlights Overlay */}
              {currentHighlights.map(h => (
                <div key={h.id} style={{ position: 'absolute', left: h.x, top: h.y, width: h.width, height: h.height, backgroundColor: h.color.replace('0.4', highlightOpacity), pointerEvents: 'none', mixBlendMode: 'multiply' }} />
              ))}
              
              {/* Sticky Notes Overlay */}
              {currentPostits.map(p => (
                <div key={p.id} className={`absolute w-48 nb-postit ${p.color.class || 'bg-nb-yellow'} z-30`} style={{ left: p.x, top: p.y }}>
                  <button onClick={() => { const filtered = postits.filter(item => item.id !== p.id); setPostits(filtered); saveAnnotations(highlights, filtered); }} className="absolute top-1 right-1 hover:text-red-600">
                    <X className="w-4 h-4" strokeWidth={3} />
                  </button>
                  <p className="font-mono text-sm leading-tight mt-2">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className={`${showSidebar ? 'w-96' : 'w-0'} overflow-hidden transition-all duration-300 bg-white border-l-3 border-black flex flex-col z-20`}>
            <div className="p-4 border-b-3 border-black bg-nb-yellow flex justify-between items-center">
              <h3 className="font-black text-xl uppercase">Annotations ({annotationCount})</h3>
              <button onClick={() => setShowSidebar(false)}><X className="w-6 h-6" strokeWidth={3} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Page Highlights */}
              <div>
                <h4 className="font-bold border-b-2 border-black mb-2 uppercase">Page {currentPage} Highlights</h4>
                {currentHighlights.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No highlights here yet.</p>
                ) : (
                  <div className="space-y-2">
                    {currentHighlights.map(h => (
                      <div key={h.id} className="nb-card p-2 text-sm border-l-8" style={{ borderLeftColor: h.color.replace('0.4', '1') }}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold uppercase text-gray-500">Highlight</span>
                          <button onClick={() => { const filtered = highlights.filter(item => item.id !== h.id); setHighlights(filtered); saveAnnotations(filtered, postits); }} className="text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p>"{h.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Page Notes */}
              <div>
                <h4 className="font-bold border-b-2 border-black mb-2 uppercase">Page {currentPage} Stickies</h4>
                {currentPostits.length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No sticky notes.</p>
                ) : (
                  <div className="space-y-2">
                    {currentPostits.map(p => (
                      <div key={p.id} className={`nb-card p-3 ${p.color.class || 'bg-nb-yellow'} rotate-1`}>
                         <div className="flex justify-end">
                            <button onClick={() => { const filtered = postits.filter(item => item.id !== p.id); setPostits(filtered); saveAnnotations(highlights, filtered); }}><Trash2 className="w-3 h-3"/></button>
                         </div>
                         <p className="font-mono text-sm">{p.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t-3 border-black pt-4">
                 <button onClick={exportAnnotations} className="nb-button w-full bg-nb-cyan flex items-center justify-center gap-2">
                   <Download className="w-4 h-4" strokeWidth={3} /> EXPORT NOTES
                 </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-t-3 border-black p-3 flex justify-between items-center z-20`}>
           <div className="flex items-center gap-2">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="nb-button px-2"><ZoomOut/></button>
             <span className="font-bold font-mono w-16 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="nb-button px-2"><ZoomIn/></button>
           </div>
           
           <div className="flex items-center gap-4">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="nb-button px-4 disabled:opacity-50">PREV</button>
             <span className="font-bold text-lg">PAGE {currentPage} / {numPages}</span>
             <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="nb-button px-4 disabled:opacity-50">NEXT</button>
           </div>
           <div className="w-32"></div>
        </div>

        {/* Citation Modal */}
        {showCitationModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="nb-card w-full max-w-2xl p-6">
              <div className="flex justify-between items-center mb-4 border-b-3 border-black pb-2">
                <h3 className="text-2xl font-black uppercase">Cite This Paper</h3>
                <button onClick={() => setShowCitationModal(false)}><X className="w-8 h-8" strokeWidth={3}/></button>
              </div>
              <div className="mb-4">
                <label className="font-bold block mb-2 uppercase">Format</label>
                <select value={citationFormat} onChange={(e) => setCitationFormat(e.target.value)} className="nb-input">
                  {Object.keys(CITATION_FORMATS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="bg-nb-gray border-3 border-black p-4 font-mono text-sm mb-4 whitespace-pre-wrap">
                {CITATION_FORMATS[citationFormat](selectedPaper)}
              </div>
              <button onClick={copyCitation} className="nb-button w-full bg-nb-lime flex justify-center gap-2">
                <Copy className="w-4 h-4" strokeWidth={3} /> COPY TO CLIPBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: Graph View ---
  if (activeView === 'graph') {
    return (
      <div className="h-screen flex flex-col bg-nb-gray">
        <div className="bg-white border-b-3 border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('library')} className="nb-button px-3"><ChevronLeft strokeWidth={3}/></button>
            <h1 className="text-2xl font-black uppercase">Knowledge Graph</h1>
          </div>
          <button onClick={logout} className="nb-button bg-nb-orange"><LogOut strokeWidth={3}/></button>
        </div>
        <div className="flex-1 relative bg-black border-3 border-black m-4 shadow-nb-xl overflow-hidden">
          {graphData.links.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold uppercase">Add papers with shared tags to connect dots!</p>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="label"
              nodeAutoColorBy="id"
              linkWidth={link => link.value}
              linkDirectionalParticles={2}
              backgroundColor="#000000"
              nodeCanvasObject={(node, ctx, globalScale) => {
                 const label = node.label;
                 const fontSize = 12/globalScale;
                 ctx.font = `${fontSize}px Sans-Serif`;
                 const textWidth = ctx.measureText(label).width;
                 const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
                 ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                 ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillStyle = node.color;
                 ctx.fillText(label, node.x, node.y);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: Library (Kanban) ---
  return (
    <div className="h-screen flex flex-col bg-nb-gray">
      {/* Header */}
      <div className="bg-white border-b-3 border-black p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 border-2 border-black"><BookOpen strokeWidth={3} /></div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Paper Vault</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveView('graph')} className="nb-button bg-nb-purple flex gap-2"><Share2 strokeWidth={3} size={18}/> GRAPH</button>
          <button onClick={logout} className="nb-button bg-nb-orange flex gap-2"><LogOut strokeWidth={3} size={18}/> EXIT</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b-3 border-black p-4 flex gap-4 items-center flex-wrap z-10">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="SEARCH DATABASE..."
            className="nb-input pl-10 font-bold uppercase placeholder-gray-500"
          />
        </div>
        
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="nb-input w-40 uppercase">
          <option value="all">All Status</option>
          <option value="to-read">To Read</option>
          <option value="reading">Reading</option>
          <option value="read">Read</option>
        </select>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="nb-input w-40 uppercase">
          <option value="date">Newest</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
        
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="nb-button bg-nb-lime flex items-center gap-2">
          {isUploading ? <Loader2 className="animate-spin"/> : <Plus strokeWidth={3} />} UPLOAD PDF
        </button>
      </div>

      {/* Recent Papers Strip */}
      {recentPapers.length > 0 && (
        <div className="bg-nb-yellow border-b-3 border-black p-3 overflow-x-auto whitespace-nowrap">
          <h2 className="inline-block font-black uppercase mr-4">Recent:</h2>
          {recentPapers.map(paper => (
            <button key={paper.id} onClick={() => openPaper(paper)} className="inline-block mr-3 bg-white border-2 border-black px-3 py-1 hover:shadow-nb transition-transform hover:-translate-y-1">
               <span className="font-bold text-sm uppercase truncate max-w-[150px] inline-block align-bottom">{paper.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
            {['to-read', 'reading', 'read'].map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col h-full">
                    {/* Column Header */}
                    <div className="border-3 border-black bg-black text-white p-3 mb-4 shadow-nb font-black text-xl uppercase tracking-widest flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {status === 'to-read' && <FileText size={20} />}
                        {status === 'reading' && <BookOpen size={20} />}
                        {status === 'read' && <Download size={20} />}
                        {status.replace('-', ' ')}
                      </div>
                      <span className="bg-white text-black px-2 py-0.5 text-sm border-2 border-white rounded-full">{columns[status].length}</span>
                    </div>
                    
                    {/* Column Content (The Corkboard) */}
                    <div className="flex-1 border-3 border-black bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px] p-4 space-y-4 overflow-y-auto shadow-nb-active">
                      {columns[status].map((paper, index) => (
                        <Draggable key={paper.id} draggableId={paper.id} index={index}>
                          {(provided) => {
                            // Visual variations for "messy" look
                            const rotate = index % 2 === 0 ? 'rotate-1' : '-rotate-1';
                            const colorClass = paper.color || 'bg-nb-white';
                            const paperColor = COLORS.find(c => c.class === colorClass) || COLORS[0];

                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`nb-postit ${paperColor.class} ${rotate} flex flex-col gap-2 relative group`}
                                style={{...provided.draggableProps.style}}
                              >
                                {/* Tape visual */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 rotate-2 backdrop-blur-sm border border-white/20 shadow-sm"></div>

                                <div className="flex justify-between items-start">
                                  <div className="font-bold text-lg leading-tight uppercase font-sans line-clamp-3 mt-2 flex-1">
                                    {paper.title}
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                     <button onClick={() => { setEditingPaper(paper); setEditForm(paper); setShowMetadataModal(true); }} className="p-1 hover:bg-black/10 rounded"><Pencil size={14}/></button>
                                     <button onClick={() => deletePaper(paper.id)} className="p-1 hover:bg-red-500 hover:text-white rounded"><Trash2 size={14}/></button>
                                  </div>
                                </div>
                                
                                <div className="font-mono text-xs mt-1 border-t-2 border-black/20 pt-2">
                                   {paper.authors && <div className="flex items-center gap-1"><User size={10}/> {paper.authors}</div>}
                                   {paper.venue && <div className="truncate text-black/70">{paper.venue}</div>}
                                </div>

                                {paper.tags && paper.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {paper.tags.map(tag => (
                                      <span key={tag} className="text-[10px] font-bold border border-black px-1 bg-white/50 uppercase">{tag}</span>
                                    ))}
                                  </div>
                                )}

                                <div className="mt-3">
                                  <button onClick={() => openPaper(paper)} className="w-full bg-black text-white font-bold py-2 px-2 text-xs border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-colors uppercase flex items-center justify-center gap-2">
                                    <Eye size={14} strokeWidth={3} /> READ NOW
                                  </button>
                                  {paper.pdfUrl && (
                                     <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] font-bold underline mt-1 hover:text-nb-purple">OPEN EXTERNAL</a>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Metadata Modal */}
      {showMetadataModal && editingPaper && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-3 border-black shadow-nb-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button onClick={() => setShowMetadataModal(false)} className="absolute top-4 right-4 hover:rotate-90 transition-transform"><X size={32} strokeWidth={3}/></button>
            <h2 className="text-3xl font-black mb-6 uppercase border-b-3 border-black pb-4">Edit Paper Metadata</h2>
            
            <div className="space-y-5 font-bold">
              <div>
                <label className="uppercase text-sm mb-1 block">Title</label>
                <input value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="nb-input" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="uppercase text-sm mb-1 block">Authors</label>
                    <input value={editForm.authors || ''} onChange={e => setEditForm({...editForm, authors: e.target.value})} className="nb-input" />
                 </div>
                 <div>
                    <label className="uppercase text-sm mb-1 block">Year</label>
                    <input type="number" value={editForm.year || ''} onChange={e => setEditForm({...editForm, year: parseInt(e.target.value)})} className="nb-input" />
                 </div>
              </div>

              <div>
                <label className="uppercase text-sm mb-1 block">Venue / Journal</label>
                <input value={editForm.venue || ''} onChange={e => setEditForm({...editForm, venue: e.target.value})} className="nb-input" />
              </div>
              
              <div>
                <label className="uppercase text-sm mb-1 block">Tags (comma sep)</label>
                <input value={(editForm.tags || []).join(', ')} onChange={e => setEditForm({...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="nb-input" />
              </div>
              
              <div>
                <label className="uppercase text-sm mb-2 block">Post-it Color</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button 
                      key={c.name} 
                      onClick={() => setEditForm({...editForm, color: c.class})}
                      className={`w-12 h-12 border-3 border-black ${c.class} ${editForm.color === c.class ? 'ring-4 ring-black ring-offset-2 transform -translate-y-2 shadow-nb' : 'hover:-translate-y-1'}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-4 pt-6 border-t-3 border-black mt-6">
                <button onClick={() => setShowMetadataModal(false)} className="flex-1 py-3 border-3 border-black font-black uppercase hover:bg-gray-200">Cancel</button>
                <button onClick={saveMetadata} className="flex-1 py-3 bg-black text-white border-3 border-black font-black uppercase hover:bg-nb-lime hover:text-black shadow-nb active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
                  <Save className="inline mr-2 w-5 h-5"/> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;