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

const COLORS = [
  { name: 'Yellow', class: 'bg-yellow-200 text-yellow-900 border-yellow-300', hex: '#fef08a' },
  { name: 'Blue', class: 'bg-cyan-200 text-cyan-900 border-cyan-300', hex: '#a5f3fc' },
  { name: 'Pink', class: 'bg-pink-200 text-pink-900 border-pink-300', hex: '#fbcfe8' },
  { name: 'Green', class: 'bg-lime-200 text-lime-900 border-lime-300', hex: '#d9f99d' },
  { name: 'Purple', class: 'bg-purple-200 text-purple-900 border-purple-300', hex: '#e9d5ff' },
  { name: 'Orange', class: 'bg-orange-200 text-orange-900 border-orange-300', hex: '#fed7aa' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#fef08a', alpha: 'rgba(254, 240, 138, 0.4)' },
  { name: 'Green', hex: '#d9f99d', alpha: 'rgba(217, 249, 157, 0.4)' },
  { name: 'Blue', hex: '#a5f3fc', alpha: 'rgba(165, 243, 252, 0.4)' },
  { name: 'Pink', hex: '#fbcfe8', alpha: 'rgba(251, 207, 232, 0.4)' },
  { name: 'Orange', hex: '#fed7aa', alpha: 'rgba(254, 215, 170, 0.4)' },
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
  // ============ ALL HOOKS MUST BE AT THE TOP (React Rules of Hooks) ============
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
  
  // ENHANCED: Annotation state
  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [selectedText, setSelectedText] = useState("");
  const [annotationHistory, setAnnotationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // ENHANCED: New features
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
  
  // ============ 2. EFFECTS & CALLBACKS (STILL NO RETURNS YET) ============

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
      
      if (darkMode) {
        context.filter = 'invert(1) hue-rotate(180deg)';
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
    if (confirm("Delete this paper?")) {
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

  // ============ 3. CONDITIONAL RETURNS (UI) ============

  // Gatekeeper UI
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Paper Vault</h1>
          </div>
          <p className="text-gray-600 mb-6">Enter password to access your research library</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passwordInput === APP_PASSWORD && setIsAuthorized(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter password"
          />
          <button
            onClick={() => passwordInput === APP_PASSWORD && setIsAuthorized(true)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <BookOpen className="text-indigo-600" size={60} />
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Paper Vault</h1>
          <p className="text-gray-600">Your personal research library</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-3"
          >
            <User size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ============ 4. MAIN UI (READER, GRAPH, BOARD) ============

  if (activeView === 'reader' && selectedPaper) {
    const currentHighlights = highlights.filter(h => h.page === currentPage);
    const currentPostits = postits.filter(p => p.page === currentPage);
    const annotationCount = highlights.length + postits.length;

    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Top toolbar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('library')} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} truncate max-w-md`}>{selectedPaper.title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex < 0} className={`p-2 rounded ${historyIndex < 0 ? 'opacity-50' : 'hover:bg-gray-100'}`} title="Undo">
              <Undo2 className="w-5 h-5" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded hover:bg-gray-100">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowCitationModal(true)} className="p-2 rounded hover:bg-gray-100" title="Citation">
              <Clipboard className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded hover:bg-gray-100">
              <SidebarIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 border-l pl-2">
              <Timer className="w-4 h-4" />
              <span className="text-sm font-mono">{Math.floor(pomodoroTime / 60)}:{String(pomodoroTime % 60).padStart(2, '0')}</span>
              <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className={`px-2 py-1 text-xs rounded ${pomodoroRunning ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {pomodoroRunning ? 'Pause' : 'Start'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Annotation toolbar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-2 flex items-center gap-4 flex-wrap`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Highlight:</span>
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded border-2 ${selectedColor.name === color.name ? 'border-gray-900 scale-110' : 'border-gray-300'}`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 border-l pl-4">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Opacity:</span>
            <input type="range" min="0.1" max="0.8" step="0.1" value={highlightOpacity} onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))} className="w-24" />
            <span className="text-sm">{Math.round(highlightOpacity * 100)}%</span>
          </div>
          
          {selectedText && (
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-sm text-purple-600 font-medium">Text selected</span>
              {NOTE_TEMPLATES.map(template => (
                <button key={template.label} onClick={() => addNoteFromSelection(template.prefix)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                  {template.label}
                </button>
              ))}
            </div>
          )}
          
          <div className="ml-auto flex items-center gap-2">
            <input type="text" value={searchInPdf} onChange={(e) => setSearchInPdf(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchInPdfText(searchInPdf)} placeholder="Search in PDF..." className={`px-3 py-1 text-sm rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`} />
            <button onClick={() => searchInPdfText(searchInPdf)} className="p-1 rounded hover:bg-gray-100">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto flex flex-col items-center p-4">
            <div className="w-full max-w-4xl mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress: {Math.round((currentPage / numPages) * 100)}%</span>
                <span>Reading time: {Math.floor(totalReadingTime / 60)}m {totalReadingTime % 60}s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${(currentPage / numPages) * 100}%` }} />
              </div>
            </div>
            
            <div className="relative">
              <canvas ref={canvasRef} className="shadow-2xl" />
              <div ref={textLayerRef} className="textLayer absolute top-0 left-0" onMouseUp={handleTextSelection} onDoubleClick={handleDoubleClick} style={{ mixBlendMode: 'multiply' }} />
              {/* Highlights */}
              {currentHighlights.map(h => (
                <div key={h.id} style={{ position: 'absolute', left: h.x, top: h.y, width: h.width, height: h.height, backgroundColor: h.color.replace('0.4', highlightOpacity), pointerEvents: 'none', mixBlendMode: 'multiply' }} />
              ))}
              {/* Post-its */}
              {currentPostits.map(p => (
                <div key={p.id} className={`absolute ${p.color.class} p-3 rounded-lg shadow-lg cursor-move text-sm max-w-xs border-2`} style={{ left: p.x, top: p.y }}>
                  <button onClick={() => { const filtered = postits.filter(item => item.id !== p.id); setPostits(filtered); saveAnnotations(highlights, filtered); }} className="absolute top-1 right-1 text-gray-500 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                  {p.text}
                </div>
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className={`${showSidebar ? 'w-80' : 'w-0'} overflow-hidden transition-all duration-300 bg-white border-l border-gray-200 flex flex-col`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Annotations ({annotationCount})</h3>
              <button onClick={() => setShowSidebar(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlights on Page {currentPage}</h4>
                {currentHighlights.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No highlights on this page</p>
                ) : (
                  <div className="space-y-2">
                    {currentHighlights.map(h => {
                      const colorName = HIGHLIGHT_COLORS.find(c => c.alpha === h.color)?.name;
                      return (
                        <div key={h.id} className="text-sm border-l-4 pl-2 py-1" style={{ borderColor: h.color }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">{colorName}</span>
                            <button onClick={() => { const filtered = highlights.filter(item => item.id !== h.id); setHighlights(filtered); saveAnnotations(filtered, postits); }} className="ml-auto text-red-500 hover:text-red-700">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-gray-700">"{h.text}"</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes on Page {currentPage}</h4>
                {currentPostits.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No notes on this page</p>
                ) : (
                  <div className="space-y-2">
                    {currentPostits.map(p => (
                      <div key={p.id} className={`${p.color.class} p-2 rounded border-2 text-sm`}>
                        <button onClick={() => { const filtered = postits.filter(item => item.id !== p.id); setPostits(filtered); saveAnnotations(highlights, filtered); }} className="float-right text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <p>{p.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">All Annotations</h4>
                <div className="space-y-1">
                  {Array.from(new Set([...highlights.map(h => h.page), ...postits.map(p => p.page)])).sort((a, b) => a - b).map(pageNum => {
                    const pageHighlights = highlights.filter(h => h.page === pageNum).length;
                    const pageNotes = postits.filter(p => p.page === pageNum).length;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-full text-left px-2 py-1 rounded text-sm ${pageNum === currentPage ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}>
                        Page {pageNum}: {pageHighlights} highlights, {pageNotes} notes
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Bulk Actions</h4>
                <div className="space-y-2">
                  {HIGHLIGHT_COLORS.map(color => {
                    const count = highlights.filter(h => h.color === color.alpha).length;
                    return count > 0 ? (
                      <button key={color.name} onClick={() => { if (confirm(`Delete all ${count} ${color.name} highlights?`)) bulkDeleteHighlights(color.alpha); }} className="w-full text-left px-2 py-1 rounded text-sm hover:bg-red-50 text-red-600">
                        Delete all {color.name} ({count})
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button onClick={exportAnnotations} className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Annotations
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom controls */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 rounded hover:bg-gray-100"><ZoomOut className="w-5 h-5" /></button>
            <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 rounded hover:bg-gray-100"><ZoomIn className="w-5 h-5" /></button>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Page {currentPage} of {numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
          </div>
          
          <div className="w-32" />
        </div>
        
        {/* Citation Modal */}
        {showCitationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generate Citation</h3>
                <button onClick={() => setShowCitationModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select value={citationFormat} onChange={(e) => setCitationFormat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {Object.keys(CITATION_FORMATS).map(format => (<option key={format} value={format}>{format}</option>))}
                </select>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap">{CITATION_FORMATS[citationFormat](selectedPaper)}</div>
              <button onClick={() => { copyCitation(); setShowCitationModal(false); }} className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Graph View
  if (activeView === 'graph') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('library')} className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Knowledge Graph</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
            <LogOut size={20} />
            Logout
          </button>
        </div>
        <div className="flex-1 bg-gray-900">
          {graphData.links.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white text-center p-8">
              <div>
                <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl">Add more papers with shared tags to see connections!</p>
              </div>
            </div>
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="label"
              nodeAutoColorBy="id"
              linkWidth={link => link.value}
              linkDirectionalParticles={2}
              backgroundColor="#111827"
            />
          )}
        </div>
      </div>
    );
  }

  // Library View (Kanban)
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BookOpen className="text-indigo-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">Paper Vault</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveView('graph')} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
            <Share2 size={18} />
            Graph
          </button>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search papers..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="all">All Status</option>
          <option value="to-read">To Read</option>
          <option value="reading">Reading</option>
          <option value="read">Read</option>
        </select>
        
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
        </select>
        
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Upload PDF
        </button>
      </div>

      {/* Recent Papers */}
      {recentPapers.length > 0 && (
        <div className="px-6 py-4 bg-gray-100 border-b">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Papers</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentPapers.map(paper => (
              <button key={paper.id} onClick={() => openPaper(paper)} className="flex-shrink-0 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow w-48">
                <div className="text-sm font-medium line-clamp-2">{paper.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {readingProgress[paper.id] && `Page ${readingProgress[paper.id].currentPage}/${readingProgress[paper.id].totalPages}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {['to-read', 'reading', 'read'].map(status => (
              <Droppable key={status} droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 rounded-xl p-4 flex flex-col">
                    <h2 className="text-lg font-bold mb-4 text-gray-700 capitalize flex items-center gap-2">
                      {status === 'to-read' && <FileText size={20} />}
                      {status === 'reading' && <BookOpen size={20} />}
                      {status === 'read' && <Download size={20} />}
                      {status.replace('-', ' ')} ({columns[status].length})
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {columns[status].map((paper, index) => (
                        <Draggable key={paper.id} draggableId={paper.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-800 flex-1 line-clamp-2">{paper.title}</h3>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditingPaper(paper); setEditForm(paper); setShowMetadataModal(true); }} className="p-1 text-gray-400 hover:text-indigo-600">
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => deletePaper(paper.id)} className="p-1 text-gray-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              {paper.authors && <p className="text-sm text-gray-600 mb-1"><User size={12} className="inline mr-1" />{paper.authors}</p>}
                              {paper.venue && <p className="text-sm text-gray-600 mb-1">{paper.venue}</p>}
                              {paper.year && <p className="text-sm text-gray-500 mb-2"><Calendar size={12} className="inline mr-1" />{paper.year}</p>}
                              {paper.tags && paper.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {paper.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">{tag}</span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => openPaper(paper)} className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2">
                                  <Eye size={14} />
                                  Read
                                </button>
                                {paper.pdfUrl && (
                                  <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Metadata</h2>
              <button onClick={() => setShowMetadataModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input type="text" value={editForm.title || ''} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
                <input type="text" value={editForm.authors || ''} onChange={(e) => setEditForm({...editForm, authors: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input type="number" value={editForm.year || ''} onChange={(e) => setEditForm({...editForm, year: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input type="text" value={editForm.venue || ''} onChange={(e) => setEditForm({...editForm, venue: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input type="text" value={(editForm.tags || []).join(', ')} onChange={(e) => setEditForm({...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={saveMetadata} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <Save size={18} />
                  Save Changes
                </button>
                <button onClick={() => setShowMetadataModal(false)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
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