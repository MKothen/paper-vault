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

const extractPdfMetadata = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const metadata = await pdf.getMetadata();
    const info = metadata.info;
    
    let title = info.Title || "";
    let authors = info.Author || "";
    let abstract = "";
    
    if (!title || title.trim().length === 0) {
      const firstPage = await pdf.getPage(1);
      const firstPageTextContent = await firstPage.getTextContent();
      const fullText = firstPageTextContent.items.map(item => item.str).join(' ');
      
      const lines = firstPageTextContent.items
        .filter(item => item.height > 12)
        .slice(0, 10)
        .map(item => item.str.trim())
        .filter(str => str.length > 0);
      
      title = lines[0] || file.name.replace('.pdf', '');
    }
    
    try {
      let textForAbstract = "";
      const pagesToCheck = Math.min(2, pdf.numPages);
      
      for (let i = 1; i <= pagesToCheck; i++) {
        const page = await pdf.getPage(i);
        const pageTextContent = await page.getTextContent();
        textForAbstract += pageTextContent.items.map(item => item.str).join(' ') + ' ';
      }
      
      const abstractMatch = textForAbstract.match(/abstract[:\s]+(.*?)(?:introduction|keywords|1\.|$)/is);
      if (abstractMatch) {
        abstract = abstractMatch[1].trim().substring(0, 500);
      }
    } catch (e) {
      console.warn("Could not extract abstract:", e);
    }
    
    let year = null;
    if (info.CreationDate) {
      const yearMatch = info.CreationDate.match(/\d{4}/);
      if (yearMatch) year = parseInt(yearMatch[0]);
    }
    
    title = title.trim().replace(/\s+/g, ' ');
    if (title.length > 200) {
      title = title.substring(0, 200) + '...';
    }
    
    authors = authors.trim().replace(/\s+/g, ' ');
    
    return {
      title: title || file.name.replace('.pdf', ''),
      authors: authors || "",
      year: year || new Date().getFullYear(),
      abstract: abstract
    };
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);
    return {
      title: file.name.replace('.pdf', ''),
      authors: "",
      year: new Date().getFullYear(),
      abstract: ""
    };
  }
};

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
  
  return Object.entries(candidates)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([word]) => word.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
};

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [user, loading] = useAuthState(auth);
  const [papers, setPapers] = useState([]);
  const [columns, setColumns] = useState({ 'to-read': [], 'reading': [], 'read': [] });
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

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);

  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [selectedText, setSelectedText] = useState("");
  const [annotationHistory, setAnnotationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  useEffect(() => {
    if (selectedPaper && activeView === 'reader') {
      const interval = setInterval(() => {
        setTotalReadingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedPaper, activeView]);

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
        
        textContent.items.forEach((item) => {
          const tx = pdfjsLib.Util.transform(
            pdfjsLib.Util.transform(viewport.transform, item.transform),
            [1, 0, 0, -1, 0, 0]
          );
          const style = {
            left: `${tx[4]}px`,
            top: `${tx[5]}px`,
            fontSize: `${Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3])}px`,
            fontFamily: item.fontName
          };
          
          const div = document.createElement('div');
          div.textContent = item.str;
          div.style.position = 'absolute';
          div.style.left = style.left;
          div.style.top = style.top;
          div.style.fontSize = style.fontSize;
          div.style.whiteSpace = 'pre';
          div.style.transformOrigin = '0% 0%';
          
          textLayerRef.current.appendChild(div);
        });
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, darkMode]);

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

  const graphData = useMemo(() => {
    const nodes = papers.map(p => ({
      id: p.id,
      label: p.title,
      tags: p.tags || []
    }));
    
    const links = [];
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const sharedTags = (papers[i].tags || []).filter(t => (papers[j].tags || []).includes(t));
        if (sharedTags.length > 0) {
          links.push({
            source: papers[i].id,
            target: papers[j].id,
            value: sharedTags.length
          });
        }
      }
    }
    
    return { nodes, links };
  }, [papers]);

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
      const metadata = await extractPdfMetadata(file);
      
      const storageRef = ref(storage, `pdfs/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);

      const smartTags = generateSmartTags(metadata.title, metadata.abstract);

      await addDoc(collection(db, "papers"), {
        userId: user.uid,
        title: metadata.title,
        authors: metadata.authors,
        year: metadata.year,
        abstract: metadata.abstract,
        venue: "",
        tags: smartTags,
        status: "to-read",
        pdfUrl,
        uploadedAt: Date.now()
      });

      alert(`Paper uploaded!\n\nTitle: ${metadata.title}\nAuthors: ${metadata.authors}\nTags: ${smartTags.join(', ')}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload paper: " + error.message);
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <Lock className="w-16 h-16 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
            Research Library
          </h1>
          <p className="text-gray-600 text-center mb-6">Enter password to access your research library</p>
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
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <BookOpen className="w-20 h-20 mx-auto mb-6 text-purple-600" />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
            Research Library
          </h1>
          <p className="text-gray-600 mb-8 text-lg">Your personal research library</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
              Paper Vault
            </h1>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('library')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeView === 'library' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText className="w-5 h-5" />
              Library
            </button>
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeView === 'kanban' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Layout className="w-5 h-5" />
              Kanban
            </button>
            <button
              onClick={() => setActiveView('graph')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeView === 'graph' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Share2 className="w-5 h-5" />
              Graph
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Upload PDF
            </button>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Library View */}
        {activeView === 'library' && (
          <div>
            <div className="mb-6 flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search papers..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPapers.map(paper => (
                <div key={paper.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition p-6">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{paper.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{paper.authors}</p>
                  <p className="text-gray-500 text-xs mb-4">{paper.year} • {paper.venue}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(paper.tags || []).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openPaper(paper)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Read
                    </button>
                    <button
                      onClick={() => {
                        setEditingPaper(paper);
                        setEditForm(paper);
                        setShowMetadataModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deletePaper(paper.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kanban View */}
        {activeView === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['to-read', 'reading', 'read'].map(status => (
                <Droppable key={status} droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-gray-100 rounded-lg p-4 min-h-96"
                    >
                      <h3 className="font-bold text-lg mb-4 capitalize">
                        {status.replace('-', ' ')} ({columns[status].length})
                      </h3>
                      {columns[status].map((paper, index) => (
                        <Draggable key={paper.id} draggableId={paper.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-lg p-4 mb-3 shadow hover:shadow-md transition"
                            >
                              <h4 className="font-semibold text-sm line-clamp-2 mb-2">{paper.title}</h4>
                              <p className="text-gray-600 text-xs">{paper.authors}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* Graph View */}
        {activeView === 'graph' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Knowledge Graph</h2>
            <div style={{ height: '600px' }}>
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="label"
                nodeAutoColorBy="id"
                linkWidth={link => link.value}
                onNodeClick={(node) => {
                  const paper = papers.find(p => p.id === node.id);
                  if (paper) openPaper(paper);
                }}
              />
            </div>
          </div>
        )}

        {/* PDF Reader View */}
        {activeView === 'reader' && selectedPaper && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setActiveView('library')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Library
              </button>
              <h2 className="text-xl font-bold flex-1 text-center">{selectedPaper.title}</h2>
              <button
                onClick={() => setShowCitationModal(true)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
              >
                <Copy className="w-5 h-5" />
                Cite
              </button>
            </div>

            {/* PDF Controls */}
            <div className="mb-4 flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.25))}
                className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(Math.min(3, scale + 0.25))}
                className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={exportAnnotations}
                className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Canvas */}
            <div className="relative overflow-auto max-h-[800px] border border-gray-300 rounded-lg" onDoubleClick={handleDoubleClick} onMouseUp={handleTextSelection}>
              <canvas ref={canvasRef} className="mx-auto" />
              <div ref={textLayerRef} className="textLayer absolute top-0 left-0 mx-auto" style={{ pointerEvents: 'none' }} />
            </div>
          </div>
        )}
      </main>

      {/* Metadata Edit Modal */}
      {showMetadataModal && editingPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Edit Metadata</h3>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Authors</label>
                <input
                  type="text"
                  value={editForm.authors || ''}
                  onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <input
                    type="number"
                    value={editForm.year || ''}
                    onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Venue</label>
                  <input
                    type="text"
                    value={editForm.venue || ''}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={(editForm.tags || []).join(', ')}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveMetadata}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setShowMetadataModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Citation Modal */}
      {showCitationModal && selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Citation</h3>
              <button
                onClick={() => setShowCitationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <select
                value={citationFormat}
                onChange={(e) => setCitationFormat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Object.keys(CITATION_FORMATS).map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap">
              {CITATION_FORMATS[citationFormat](selectedPaper)}
            </div>

            <button
              onClick={copyCitation}
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;