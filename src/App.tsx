// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Search, 
  StickyNote, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, 
  Sun, Moon, Timer, Clock, Check, ZoomIn, ZoomOut, FileUp, AlertCircle, Info, LayoutGrid 
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ForceGraph2D from 'react-force-graph-2d';

// --- REACT-PDF IMPORTS ---
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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

// Smart Tag Generator
const generateSmartTags = (text) => {
  if (!text) return [];
  const stopWords = new Set(["the", "and", "of", "for", "with", "analysis", "study", "using", "based", "from", "that", "this", "introduction", "conclusion", "results", "method", "paper", "proposed", "http", "https", "doi", "org", "journal", "vol", "issue"]);
  const words = text.split(/[\s,.-]+/)
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 4 && !stopWords.has(w));
    
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0].charAt(0).toUpperCase() + entry[0].slice(1));
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
  
  // Input Mode State
  const [inputMode, setInputMode] = useState('drop'); 
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Editing & Uploading State
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [editForm, setEditForm] = useState({});
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // Manual Form State
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [newColor, setNewColor] = useState(COLORS[0].class);
  const [newAbstract, setNewAbstract] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newVenue, setNewVenue] = useState("");

  // Reader State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const pomodoroRef = useRef(null);
  
  // Graph Ref for Physics Tweaking
  const graphRef = useRef();

  // --- NOTIFICATION STATE ---
  const [toasts, setToasts] = useState([]); 
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: null });

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- DATA & AUTH ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "papers"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPapers(loaded);
      setColumns({
        'to-read': loaded.filter(p => p.status === 'to-read'),
        'reading': loaded.filter(p => p.status === 'reading'),
        'read': loaded.filter(p => p.status === 'read')
      });
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTime > 0) {
      pomodoroRef.current = setInterval(() => setPomodoroTime(t => t - 1), 1000);
    } else if (pomodoroTime === 0) {
      setPomodoroRunning(false);
      addToast("POMODORO COMPLETE!", "success");
    }
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning, pomodoroTime]);

  useEffect(() => {
    if (selectedPaper) {
      const h = localStorage.getItem(`highlights-${selectedPaper.id}`);
      const p = localStorage.getItem(`postits-${selectedPaper.id}`);
      setHighlights(h ? JSON.parse(h) : []);
      setPostits(p ? JSON.parse(p) : []);
      setPageNumber(1);
      setIsHighlightMode(false); 
    }
  }, [selectedPaper]);

  // --- GRAPH PHYSICS CONFIGURATION ---
  useEffect(() => {
    if (activeView === 'graph' && graphRef.current) {
      // Disable cord pulling force (strength 0)
      graphRef.current.d3Force('link').strength(0);
      // Stop global centering so you can pan freely
      graphRef.current.d3Force('center', null);
      // Minimal charge to prevent initial overlap
      graphRef.current.d3Force('charge').strength(-20);
    }
  }, [activeView, papers]);

  // --- METADATA EXTRACTION ---
  const extractMetadata = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    
    const metadata = await pdf.getMetadata();
    let authorCandidate = "";
    if (metadata?.info?.Author) authorCandidate = metadata.info.Author;

    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    let maxFontSize = 0;
    let titleCandidate = "";
    const items = textContent.items;
    let fullText = "";

    items.forEach((item) => {
      const str = item.str.trim();
      if (!str) return;
      fullText += str + " ";
      const fontSize = Math.abs(item.transform[3]);
      if (fontSize > maxFontSize) {
        maxFontSize = fontSize;
        titleCandidate = str;
      } else if (Math.abs(fontSize - maxFontSize) < 1 && fontSize > 10) {
        titleCandidate += " " + str;
      }
    });

    const doiMatch = fullText.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
    
    if (doiMatch) {
        const cleanDoi = doiMatch[0];
        addToast(`DOI detected: ${cleanDoi}`, "info");
        try {
            const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${cleanDoi}?fields=title,url,abstract,authors,year,venue`);
            const apiData = await response.json();
            if (!apiData.error) {
                addToast("Metadata retrieved from DOI!", "success");
                return {
                    title: apiData.title,
                    tags: generateSmartTags(apiData.title + " " + (apiData.abstract || "")),
                    authors: apiData.authors ? apiData.authors.map(a => a.name).slice(0, 3).join(", ") : authorCandidate,
                    abstract: apiData.abstract || "",
                    year: apiData.year ? apiData.year.toString() : (new Date().getFullYear().toString()),
                    venue: apiData.venue || "",
                    source: 'doi'
                };
            } else {
                addToast("DOI found but metadata lookup failed. Using text extraction.", "warning");
            }
        } catch (e) {
            console.warn("DOI fetch failed", e);
            addToast("DOI lookup connection error. Using text extraction.", "warning");
        }
    } else {
       addToast("No DOI found in text. Using text analysis.", "info");
    }

    if (titleCandidate.length < 5) titleCandidate = file.name.replace('.pdf', '');
    const tags = generateSmartTags(fullText);

    return {
      title: titleCandidate,
      tags: tags,
      authors: authorCandidate,
      abstract: "",
      year: new Date().getFullYear().toString(),
      venue: "",
      source: 'local'
    };
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) await handleBatchUpload(files);
    else addToast("Please drop valid PDF files.", "error");
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) await handleBatchUpload(Array.from(e.target.files));
  };

  const processFile = async (file) => {
      const metadata = await extractMetadata(file);
      const fileRef = ref(storage, `papers/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await addDoc(collection(db, "papers"), {
        userId: user.uid,
        title: metadata.title,
        link: "",
        tags: metadata.tags,
        color: COLORS[Math.floor(Math.random() * COLORS.length)].class,
        status: "to-read",
        abstract: metadata.abstract,
        authors: metadata.authors,
        year: metadata.year,
        venue: metadata.venue,
        notes: "",
        pdfUrl: url,
        createdAt: Date.now()
      });
      return metadata;
  };

  const handleBatchUpload = async (files) => {
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(`Processing ${i + 1}/${files.length}: "${file.name.substring(0, 15)}..."`);
        try {
            const meta = await processFile(file);
            if (meta.source === 'doi') addToast(`DOI Found: ${file.name}`, "success");
            else addToast(`Uploaded: ${file.name}`, "info");
            successCount++;
        } catch (e) {
            console.error(e);
            failCount++;
            addToast(`Failed: ${file.name}`, "error");
        }
    }
    setUploadStatus("Done!");
    setTimeout(() => {
        setIsUploading(false);
        setUploadStatus("");
        addToast(`Processed ${files.length} files. ${successCount} Success, ${failCount} Failed.`, successCount > 0 ? "success" : "error");
    }, 1000);
  };

  // --- MANUAL & READER FUNCTIONS ---
  const fetchDoi = async () => {
    if (!doiInput) { addToast("Please paste a DOI first.", "error"); return; }
    setIsFetching(true);
    try {
      const cleanDoi = doiInput.replace("https://doi.org/", "").trim();
      const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${cleanDoi}?fields=title,url,abstract,authors,year,venue`);
      const data = await response.json();
      if (data.error) {
        addToast("Could not find paper with that DOI.", "error");
      } else {
        setNewTitle(data.title);
        setNewLink(data.url || `https://doi.org/${cleanDoi}`);
        setNewAbstract(data.abstract);
        setNewYear(data.year ? data.year.toString() : "");
        setNewVenue(data.venue);
        if(data.authors && data.authors.length > 0) {
          setNewAuthors(data.authors.map(a => a.name).slice(0, 3).join(", ") + (data.authors.length > 3 ? " et al." : ""));
        }
        setNewTags(generateSmartTags(data.title + " " + data.abstract));
        addToast("Metadata fetched successfully!", "success");
      }
    } catch (error) {
      addToast("Failed to fetch DOI. Check connection.", "error");
    }
    setIsFetching(false);
  };

  const addPaperManual = async (e) => {
    e.preventDefault();
    if (!newTitle) { addToast("Please enter a title.", "error"); return; }
    await addDoc(collection(db, "papers"), {
      userId: user.uid, title: newTitle, link: newLink, tags: newTags, color: newColor, status: "to-read", abstract: newAbstract, authors: newAuthors, year: newYear, venue: newVenue, notes: "", pdfUrl: "", createdAt: Date.now()
    });
    addToast("Paper added manually.", "success");
    setNewTitle(""); setNewLink(""); setNewTags([]); setNewAbstract(""); setNewAuthors(""); setNewYear(""); setNewVenue(""); setDoiInput("");
  };

  const deletePaper = (id) => {
    setConfirmDialog({
        isOpen: true,
        message: "Are you sure you want to delete this paper? This action cannot be undone.",
        onConfirm: async () => {
            await deleteDoc(doc(db, "papers", id));
            addToast("Paper deleted.", "info");
            setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
        }
    });
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handlePageClick = () => {
    if (!isHighlightMode) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const container = document.querySelector('.pdf-page-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const normalizedRects = Array.from(rects).map(rect => ({
      x: (rect.left - containerRect.left) / scale,
      y: (rect.top - containerRect.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale
    }));
    if (normalizedRects.length === 0) return;
    const newHighlight = { id: Date.now(), page: pageNumber, rects: normalizedRects, color: selectedColor.alpha, text: selection.toString() };
    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    localStorage.setItem(`highlights-${selectedPaper.id}`, JSON.stringify(newHighlights));
    selection.removeAllRanges();
  };

  const addPostit = (text = "Double click to edit...") => {
    const jitterX = (Math.random() * 40 - 20);
    const jitterY = (Math.random() * 40 - 20);
    const newPostit = { id: Date.now(), page: pageNumber, x: 100 + jitterX, y: 100 + jitterY, text: text, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    const newPostits = [...postits, newPostit];
    setPostits(newPostits);
    localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(newPostits));
  };

  const updatePostit = (id, updates) => {
    const updated = postits.map(p => p.id === id ? { ...p, ...updates } : p);
    setPostits(updated);
    localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(updated));
  };

  const deleteAnnotation = (id, type) => {
    if (type === 'highlight') {
      const filtered = highlights.filter(h => h.id !== id);
      setHighlights(filtered);
      localStorage.setItem(`highlights-${selectedPaper.id}`, JSON.stringify(filtered));
    } else {
      const filtered = postits.filter(p => p.id !== id);
      setPostits(filtered);
      localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(filtered));
    }
  };

  const allUniqueTags = useMemo(() => {
    const tags = new Set();
    papers.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [papers]);

  const filteredPapers = papers.filter(p => {
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q));
  });

  // --- CUSTOM GRAPH RENDERING (REALISTIC CORKBOARD) ---
  const graphData = useMemo(() => {
    const nodes = papers.map(p => ({ 
        id: p.id, 
        label: p.title, 
        color: COLORS.find(c => c.class === p.color)?.hex || '#FFD90F' 
    }));
    const links = [];
    papers.forEach((p1, i) => {
      papers.slice(i + 1).forEach(p2 => {
        const shared = p1.tags?.filter(t => p2.tags?.includes(t));
        if (shared?.length > 0) links.push({ source: p1.id, target: p2.id });
      });
    });
    return { nodes, links };
  }, [papers]);

  // --- GRAPH ACTIONS ---
  const organizeGraph = () => {
      // Simple Grid Layout
      const nodes = graphData.nodes;
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacing = 120;
      
      nodes.forEach((node, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          node.fx = col * spacing - (cols * spacing) / 2;
          node.fy = row * spacing - (nodes.length / cols * spacing) / 2;
      });
      
      // Re-heat simulation to snap cords
      if (graphRef.current) {
          graphRef.current.d3ReheatSimulation();
      }
  };

  // 1. NODE RENDERER: DRAWS PAPER ONLY
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.label || '';
    // FIXED FONT SIZE (Stationary on the note, scales with zoom)
    const fontSize = 6; 
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`;
    
    const width = 60;
    const height = 60;
    const pinX = node.x;
    const pinY = node.y;
    const paperX = pinX - width / 2;
    const paperY = pinY - 5;

    // Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Post-it Body
    ctx.fillStyle = node.color || '#fef08a';
    // Random-ish rotation based on ID
    const rotate = (node.id.charCodeAt(0) % 10 - 5) * (Math.PI / 180); 
    ctx.save();
    ctx.translate(pinX, pinY);
    ctx.rotate(rotate);
    ctx.fillRect(-width / 2, 5, width, height); 
    
    // Text Rendering (Moves with paper)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#1f2937';
    ctx.shadowColor = "transparent"; // No shadow for text
    
    const words = label.split(' ');
    let line = '';
    let lineY = 12; 
    const lineHeight = fontSize * 1.1;
    
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 6 && n > 0) {
        ctx.fillText(line, 0, lineY); 
        line = words[n] + ' ';
        lineY += lineHeight;
        if (lineY > height) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 0, lineY);
    ctx.restore();
  }, []);

  // 2. FRAME RENDERER: DRAWS CORDS & PINS ON TOP
  const onRenderFramePost = useCallback((ctx, globalScale) => {
    // Safe check to avoid crash if graphRef isn't ready
    if (!graphData.nodes || graphData.nodes.length === 0) return;

    // Draw Cords (Links) First
    ctx.beginPath();
    graphData.links.forEach(link => {
        // Use safety check for source/target objects
        const source = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
        const target = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
        
        if (source?.x && target?.x) {
            ctx.moveTo(source.x, source.y);
            ctx.lineTo(target.x, target.y);
        }
    });
    ctx.strokeStyle = "#4b5563"; 
    ctx.lineWidth = 2; 
    ctx.stroke();

    // Draw Pins (On top of cords)
    graphData.nodes.forEach(node => {
        if (!node.x) return;
        const pinX = node.x;
        const pinY = node.y;
        
        // Pin Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(pinX + 1, pinY + 1, 2.5, 0, 2 * Math.PI, false);
        ctx.fill();
        
        // Pin Head
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath();
        ctx.arc(pinX, pinY, 2.5, 0, 2 * Math.PI, false);
        ctx.fill();
        
        // Pin Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(pinX - 0.5, pinY - 0.5, 1, 0, 2 * Math.PI, false);
        ctx.fill();
    });
  }, [graphData]); // Dependency on graphData ensures this updates

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    const width = 60;
    const height = 60;
    ctx.fillStyle = color;
    ctx.fillRect(node.x - width / 2, node.y, width, height);
  }, []);

  // --- MODAL RENDERER HELPER ---
  const renderModal = () => {
    if (showMetadataModal && editingPaper) {
      return (
        <PaperDetailsModal 
            paper={editForm} 
            onClose={() => setShowMetadataModal(false)} 
            onSave={async (data) => { await updateDoc(doc(db, "papers", editingPaper.id), data); setShowMetadataModal(false); addToast("Paper updated", "success"); }} 
            allTags={allUniqueTags} 
        />
      );
    }
    return null;
  };

  // --- SHARED UI ---
  const SharedUI = () => (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 p-4 bg-white border-4 border-black shadow-nb min-w-[300px] animate-in slide-in-from-right`}>
            {toast.type === 'success' && <Check className="text-green-600" size={24} strokeWidth={3} />}
            {toast.type === 'error' && <AlertCircle className="text-red-600" size={24} strokeWidth={3} />}
            {toast.type === 'info' && <Info className="text-blue-600" size={24} strokeWidth={3} />}
            {toast.type === 'warning' && <AlertCircle className="text-yellow-600" size={24} strokeWidth={3} />}
            <p className="font-bold uppercase text-sm">{toast.message}</p>
          </div>
        ))}
      </div>
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white border-4 border-black shadow-nb p-8 max-w-md w-full text-center relative">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" strokeWidth={2} />
              <h2 className="text-2xl font-black uppercase mb-2">Are you sure?</h2>
              <p className="font-bold text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDialog({ isOpen: false, message: "", onConfirm: null })} className="flex-1 nb-button bg-white">Cancel</button>
                 <button onClick={confirmDialog.onConfirm} className="flex-1 nb-button bg-red-500 text-white border-black">Confirm</button>
              </div>
           </div>
        </div>
      )}
      {renderModal()}
    </>
  );

  if (!isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-nb-yellow p-4"><div className="bg-white border-4 border-black shadow-nb p-8 max-w-md w-full text-center"><Lock className="w-12 h-12 mx-auto mb-4" strokeWidth={3} /><h1 className="text-3xl font-black uppercase mb-4">Restricted Access</h1><input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="nb-input text-center mb-4" placeholder="PASSWORD" /><button onClick={() => passwordInput === APP_PASSWORD && setIsAuthorized(true)} className="nb-button w-full">UNLOCK</button></div></div>;
  if (loading) return <div className="h-screen flex items-center justify-center bg-nb-gray"><Loader2 className="animate-spin w-16 h-16" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-nb-cyan p-4"><div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-md w-full text-center"><BookOpen className="w-20 h-20 mx-auto mb-6" strokeWidth={3}/><h1 className="text-5xl font-black uppercase mb-2 tracking-tighter">Paper Vault</h1><button onClick={signInWithGoogle} className="w-full border-4 border-black bg-nb-pink p-4 font-black flex items-center justify-center gap-3 text-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><User strokeWidth={3} /> ENTER WITH GOOGLE</button></div></div>;

  // --- READER ---
  if (activeView === 'reader' && selectedPaper) {
    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-nb-yellow'}`}>
        <SharedUI />
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-3 flex justify-between items-center z-20`}>
          <div className="flex items-center gap-4"><button onClick={() => setActiveView('library')} className="nb-button flex gap-2 text-black"><ChevronLeft strokeWidth={3} /> Back</button><h2 className="font-black text-xl uppercase truncate max-w-md tracking-tight text-black">{selectedPaper.title}</h2></div>
          <div className="flex items-center gap-3"><button onClick={() => setDarkMode(!darkMode)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 text-black shadow-nb-sm">{darkMode ? <Sun strokeWidth={3}/> : <Moon strokeWidth={3}/>}</button><div className="flex items-center border-2 border-black px-2 py-1 gap-2 bg-white text-black shadow-nb-sm"><Timer size={16} strokeWidth={3} /><span className="font-mono font-bold">{Math.floor(pomodoroTime/60)}:{(pomodoroTime%60).toString().padStart(2,'0')}</span><button onClick={() => setPomodoroRunning(!pomodoroRunning)} className={`px-2 text-xs font-bold border-2 border-black ${pomodoroRunning ? 'bg-nb-orange' : 'bg-nb-lime'}`}>{pomodoroRunning ? 'STOP' : 'GO'}</button></div></div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-2 flex items-center gap-4 z-20 overflow-x-auto shadow-md`}>
           <div className="flex items-center gap-2 pr-4 border-r-4 border-current"><span className="font-bold uppercase text-sm text-black">Ink:</span>{HIGHLIGHT_COLORS.map(c => (<button key={c.name} onClick={() => setSelectedColor(c)} className={`w-6 h-6 border-2 border-black ${selectedColor.name === c.name ? 'ring-2 ring-offset-2 ring-black' : ''}`} style={{ backgroundColor: c.hex }} />))}</div>
           <button onClick={() => setIsHighlightMode(!isHighlightMode)} className={`nb-button text-xs flex gap-1 items-center ${isHighlightMode ? 'bg-nb-lime shadow-none translate-y-1' : ''}`}>{isHighlightMode ? <Check size={14} strokeWidth={4} /> : <Highlighter size={14} />} {isHighlightMode ? 'HIGHLIGHTING ON' : 'HIGHLIGHT OFF'}</button>
           <button onClick={() => addPostit()} className="nb-button text-xs flex gap-1 bg-nb-cyan"><StickyNote size={14} /> Note</button>
        </div>
        <div className="flex-1 flex overflow-hidden relative">
           <div className={`flex-1 overflow-auto p-8 flex justify-center bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:20px_20px] ${darkMode ? 'bg-gray-900' : 'bg-nb-gray'}`}>
              <div className="relative h-fit pdf-page-container" onMouseUp={handlePageClick}>
                 <Document file={selectedPaper.pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex items-center gap-2 font-bold bg-white p-4 border-4 border-black shadow-nb"><Loader2 className="animate-spin"/> Loading PDF...</div>}>
                    <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} className="shadow-nb-lg" />
                 </Document>
                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {highlights.filter(h => h.page === pageNumber).map(h => (
                        <React.Fragment key={h.id}>{(h.rects || [{ x: h.x, y: h.y, width: h.width, height: h.height }]).map((box, i) => (<div key={i} style={{ position: 'absolute', left: box.x * scale, top: box.y * scale, width: box.width * scale, height: box.height * scale, backgroundColor: h.color, mixBlendMode: 'multiply' }} />))}</React.Fragment>
                    ))}
                 </div>
                 {postits.filter(p => p.page === pageNumber).map(p => (<DraggablePostit key={p.id} data={p} scale={scale} onUpdate={updatePostit} onDelete={deleteAnnotation} />))}
              </div>
           </div>
           {showSidebar && (
             <div className={`w-80 border-l-4 border-black flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className="p-4 border-b-4 border-black font-black text-xl uppercase bg-nb-pink text-black flex justify-between"><span>Annotations</span><button onClick={() => setShowSidebar(false)}><X strokeWidth={3}/></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {highlights.filter(h => h.page === pageNumber).map(h => (<div key={h.id} className="border-2 border-black p-2 bg-white text-black shadow-nb-sm"><div className="flex justify-between items-center mb-1 border-b border-black pb-1"><span className="text-xs font-bold uppercase">Highlight</span><button onClick={() => deleteAnnotation(h.id, 'highlight')} className="text-red-600"><Trash2 size={12}/></button></div><p className="text-sm font-mono leading-tight">"{h.text.substring(0, 80)}..."</p></div>))}
                   {postits.filter(p => p.page === pageNumber).map(p => (<div key={p.id} className={`border-2 border-black p-2 ${p.color.class || 'bg-nb-yellow'} text-black shadow-nb-sm rotate-1`}><div className="flex justify-between items-center mb-1 border-b border-black/20 pb-1"><span className="text-xs font-bold uppercase">Note</span><button onClick={() => deleteAnnotation(p.id, 'postit')}><Trash2 size={12}/></button></div><p className="text-sm font-bold">{p.text}</p></div>))}
                </div>
             </div>
           )}
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-t-4 p-3 flex justify-between items-center z-20`}>
           <div className="flex items-center gap-2"><button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="nb-button p-1"><ZoomOut/></button><span className="font-mono font-bold w-16 text-center text-black bg-white border-2 border-black px-2 py-1">{Math.round(scale * 100)}%</span><button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="nb-button p-1"><ZoomIn/></button></div>
           <div className="flex items-center gap-4"><button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="nb-button disabled:opacity-50">Prev</button><span className="font-bold border-2 border-black bg-white text-black px-2 py-1">Page {pageNumber} / {numPages || '--'}</span><button onClick={() => setPageNumber(p => Math.min(numPages || 999, p + 1))} disabled={pageNumber >= numPages} className="nb-button disabled:opacity-50">Next</button></div><div className="w-32"></div>
        </div>
      </div>
    );
  }

  // --- GRAPH VIEW ---
  if (activeView === 'graph') {
    return (
      <div className="h-screen flex flex-col bg-nb-gray">
        <SharedUI />
        <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveView('library')} className="nb-button flex gap-2"><ChevronLeft /> Back</button>
             <button onClick={organizeGraph} className="nb-button flex gap-2 bg-nb-purple"><LayoutGrid size={18} /> Organize Board</button>
          </div>
          <h1 className="text-3xl font-black uppercase">Knowledge Graph</h1>
        </div>
        <div className="flex-1 bg-[#e3d5ca] border-4 border-black m-4 shadow-nb overflow-hidden relative" 
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239c92ac' fill-opacity='0.1'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' /%3E%3C/g%3E%3C/svg%3E")`
             }}>
           <ForceGraph2D 
             ref={graphRef}
             graphData={graphData} 
             nodeCanvasObject={nodeCanvasObject}
             onRenderFramePost={onRenderFramePost} // CORDS AND PINS DRAWN LAST (ON TOP)
             nodePointerAreaPaint={nodePointerAreaPaint}
             backgroundColor="transparent"
             linkWidth={0} // Hide default links
             nodeRelSize={8}
             d3VelocityDecay={0.9}
             onNodeDragEnd={(node) => {
               // "Pin" the node in place
               node.fx = node.x;
               node.fy = node.y;
             }}
             onNodeClick={(node) => { 
                const fullPaper = papers.find(p => p.id === node.id);
                if(fullPaper) {
                    setSelectedPaper(fullPaper); // NEW: Select paper
                    setActiveView('reader');     // NEW: Open Reader
                }
             }}
           />
        </div>
      </div>
    );
  }

  // --- TIMELINE VIEW ---
  if (activeView === 'timeline') {
    return (
        <div className="h-screen flex flex-col bg-nb-gray">
            <SharedUI />
            <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
                <button onClick={() => setActiveView('library')} className="nb-button flex gap-2"><ChevronLeft /> Back</button>
                <h1 className="text-3xl font-black uppercase">Timeline View</h1>
            </div>
            <TimelineView papers={filteredPapers} onEdit={(p) => { setEditingPaper(p); setEditForm(p); setShowMetadataModal(true); }} onDelete={deletePaper} onRead={(p) => { setSelectedPaper(p); setActiveView('reader'); }} />
        </div>
    );
  }

  // --- LIBRARY (KANBAN) ---
  return (
    <div className="min-h-screen bg-nb-gray flex flex-col font-sans text-black">
      <SharedUI />
      <header className="bg-white border-b-4 border-black p-5 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3"><div className="bg-black text-white p-2"><BookOpen strokeWidth={3} size={32} /></div><h1 className="text-4xl font-black uppercase tracking-tighter">Paper Vault</h1></div>
        <div className="flex gap-4">
          <button onClick={() => setActiveView('timeline')} className="nb-button flex gap-2"><Clock strokeWidth={3} /> Timeline</button>
          <button onClick={() => setActiveView('graph')} className="nb-button flex gap-2"><Share2 strokeWidth={3} /> Graph</button>
          <button onClick={logout} className="nb-button flex gap-2"><LogOut strokeWidth={3} /> Exit</button>
        </div>
      </header>
      
      <div className="bg-white border-b-4 border-black p-6 z-20">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
               <button onClick={() => setInputMode('drop')} className={`text-sm font-black uppercase border-b-4 pb-1 transition-colors ${inputMode === 'drop' ? 'border-nb-purple text-black' : 'border-transparent text-gray-400'}`}>Smart Drop</button>
               <button onClick={() => setInputMode('manual')} className={`text-sm font-black uppercase border-b-4 pb-1 transition-colors ${inputMode === 'manual' ? 'border-nb-lime text-black' : 'border-transparent text-gray-400'}`}>Manual Entry</button>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} size={16} />
                <input className="nb-input pl-10 py-2 text-sm" placeholder="Search Library..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>

         {inputMode === 'drop' ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed transition-all h-48 flex flex-col items-center justify-center gap-4 cursor-pointer ${isDraggingFile ? 'border-nb-purple bg-purple-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
            >
               {isUploading ? (
                 <div className="text-center animate-pulse">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-black"/>
                    <p className="font-black text-xl">{uploadStatus}</p>
                 </div>
               ) : (
                 <>
                    <div className="bg-black text-white p-4 rounded-full shadow-nb"><FileUp size={32} strokeWidth={3} /></div>
                    <div className="text-center">
                       <p className="font-black text-2xl uppercase">Drop PDF Here</p>
                       <p className="font-bold text-gray-500">Smart Extract: Title, Tags & Metadata</p>
                    </div>
                 </>
               )}
               <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" multiple onChange={handleFileSelect} />
            </div>
         ) : (
            <div className="bg-nb-gray p-4 border-4 border-black space-y-4">
               <div className="flex gap-2">
                  <input value={doiInput} onChange={e => setDoiInput(e.target.value)} className="nb-input" placeholder="Paste DOI to auto-fill..." />
                  <button onClick={fetchDoi} disabled={isFetching} className="nb-button bg-nb-purple flex gap-2">{isFetching ? <Loader2 className="animate-spin"/> : <Wand2/>} Auto-Fill</button>
               </div>
               <div className="flex gap-2">
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="nb-input flex-2" placeholder="Title" />
                  <select value={newColor} onChange={e => setNewColor(e.target.value)} className="nb-input flex-1">
                      {COLORS.map(c => <option key={c.name} value={c.class}>{c.name}</option>)}
                  </select>
                  <button onClick={addPaperManual} className="nb-button bg-nb-lime flex gap-2"><Plus/> Add Manual</button>
               </div>
            </div>
         )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={async (result) => {
          if (!result.destination) return;
          await updateDoc(doc(db, "papers", result.draggableId), { status: result.destination.droppableId });
        }}>
           <div className="flex h-full gap-8 min-w-[1024px]">
              {['to-read', 'reading', 'read'].map(status => (
                <Droppable key={status} droppableId={status}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 flex flex-col h-full">
                       <div className="bg-black text-white p-4 border-4 border-black mb-6 font-black text-2xl uppercase tracking-widest flex justify-between items-center shadow-nb-lg">
                          <span>{status.replace('-', ' ')}</span>
                          <span className="bg-white text-black px-3 py-1 rounded-full text-sm border-2 border-black font-bold">{columns[status].length}</span>
                       </div>
                       <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white border-4 border-black p-4 space-y-6 overflow-y-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
                          {columns[status].map((paper, index) => (
                            <Draggable key={paper.id} draggableId={paper.id} index={index}>
                               {(provided) => (
                                   <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`nb-card p-5 ${paper.color || 'bg-white'} rotate-1 relative cursor-grab active:cursor-grabbing`}>
                                      <div className="flex justify-between items-start mb-2 mt-2">
                                        <h3 className="font-black text-lg leading-tight uppercase line-clamp-3 flex-1">{paper.title}</h3>
                                        <div className="flex flex-col gap-1 ml-2">
                                           <button onClick={() => { setEditingPaper(paper); setEditForm(paper); setShowMetadataModal(true); }}><Pencil size={16}/></button>
                                           <button onClick={() => deletePaper(paper.id)} className="text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                      </div>
                                      <div className="text-xs font-mono font-bold border-t-2 border-black/10 pt-2 mb-2">{paper.authors?.slice(0, 30)}...</div>
                                      {paper.pdfUrl && (
                                        <button onClick={() => { setSelectedPaper(paper); setActiveView('reader'); }} className="nb-button w-full text-sm flex items-center justify-center gap-2 mt-2">
                                            <Eye size={16} /> Read
                                        </button>
                                      )}
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
    </div>
  );
}

function PaperDetailsModal({ paper, allTags, onClose, onSave }) {
  const [formData, setFormData] = useState(paper);
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 hover:rotate-90 transition-transform"><X size={32} strokeWidth={3}/></button>
          <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2">Edit Metadata</h2>
          <div className="space-y-4">
             <input className="nb-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title" />
             <input className="nb-input" value={formData.authors || ''} onChange={e => setFormData({...formData, authors: e.target.value})} placeholder="Authors" />
             <div className="flex gap-2">
                <input className="nb-input" value={formData.year || ''} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="Year" />
                <input className="nb-input" value={formData.venue || ''} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="Venue" />
             </div>
             <textarea className="nb-input" rows={4} value={formData.abstract || ''} onChange={e => setFormData({...formData, abstract: e.target.value})} placeholder="Abstract"></textarea>
             
             {/* RESTORED TAG INPUT */}
             <label className="font-bold block">Tags</label>
             <TagInput tags={formData.tags || []} setTags={(tags) => setFormData({...formData, tags})} allTags={allTags} />

             <label className="font-bold block">Color</label>
             <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c.name} onClick={() => setFormData({...formData, color: c.class})} className={`w-8 h-8 border-2 border-black ${c.class} ${formData.color === c.class ? 'ring-2 ring-offset-2 ring-black' : ''}`} />
                ))}
             </div>
             <div className="flex gap-4 pt-4">
                <button onClick={onClose} className="flex-1 nb-button bg-white">Cancel</button>
                <button onClick={() => onSave(formData)} className="flex-1 nb-button bg-nb-lime">Save</button>
             </div>
          </div>
       </div>
    </div>
  );
}

// --- TAG INPUT COMPONENT ---
function TagInput({ tags, setTags, allTags }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    if (input && !tags.includes(input)) {
      setTags([...tags, input]);
      setInput("");
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {tags.map(tag => (
          <span key={tag} className="bg-black text-white px-2 py-1 text-xs font-bold flex items-center gap-1">
            {tag} <button onClick={() => setTags(tags.filter(t => t !== tag))}><X size={10}/></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          className="nb-input py-1 text-sm" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="Add tag..." 
        />
        <button onClick={addTag} className="nb-button py-1 px-3"><Plus size={14}/></button>
      </div>
    </div>
  );
}

function DraggablePostit({ data, onUpdate, onDelete, scale }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (isEditing) return; 
    e.stopPropagation();
    setIsDragging(true);
    offset.current = { x: e.clientX - (data.x * scale), y: e.clientY - (data.y * scale) };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = (e.clientX - offset.current.x) / scale;
      const newY = (e.clientY - offset.current.y) / scale;
      onUpdate(data.id, { x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate, data.id, scale]);

  return (
     <div 
       style={{ position: 'absolute', left: data.x * scale, top: data.y * scale, zIndex: 20 }}
       className={`w-48 p-4 border-2 border-black shadow-nb ${data.color.class || 'bg-nb-yellow'} cursor-move hover:scale-105 transition-transform`}
       onMouseDown={handleMouseDown}
       onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
     >
        <div className="flex justify-between items-start mb-2 border-b border-black/20 pb-1">
           <span className="text-[10px] font-black uppercase bg-white px-1 border border-black">Note</span>
           <div className="flex gap-1">
             <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setIsEditing(true)} className="text-black p-0.5 hover:bg-white/50 rounded"><Pencil size={12} strokeWidth={3}/></button>
             <button onMouseDown={(e) => e.stopPropagation()} onClick={() => onDelete(data.id, 'postit')} className="bg-red-600 text-white p-0.5 border border-black hover:bg-red-800"><X size={12} strokeWidth={3}/></button>
           </div>
        </div>
        {isEditing ? (
          <textarea 
            className="w-full h-24 text-sm font-bold bg-white/50 border-2 border-black p-1 focus:outline-none resize-none text-black" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onBlur={() => { setIsEditing(false); onUpdate(data.id, { text }); }} 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()} 
            autoFocus 
          />
        ) : (
          <p className="text-sm font-bold font-mono leading-tight whitespace-pre-wrap select-none">{data.text}</p>
        )}
     </div>
  );
}

function TimelineView({ papers, onEdit, onDelete, onRead }) {
  const grouped = useMemo(() => {
    const groups = {};
    const sortedPapers = [...papers].sort((a, b) => (b.year || 0) - (a.year || 0));
    sortedPapers.forEach(p => {
      const year = p.year || "Unknown Year";
      if (!groups[year]) groups[year] = [];
      groups[year].push(p);
    });
    return groups;
  }, [papers]);

  const sortedYears = Object.keys(grouped).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (isNaN(numA) && isNaN(numB)) return 0;
    if (isNaN(numA)) return 1; 
    if (isNaN(numB)) return -1;
    return numB - numA; 
  });

  if (papers.length === 0) {
      return (
          <div className="h-full flex items-center justify-center text-gray-400 font-bold text-xl">
              NO PAPERS IN VAULT
          </div>
      );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="absolute left-12 top-0 bottom-0 w-1 bg-black"></div>
      {sortedYears.map(year => (
        <div key={year} className="mb-8 relative pl-20">
          <div className="absolute left-6 top-0 flex items-center">
            <div className="w-14 h-14 rounded-full bg-black text-white border-4 border-white flex items-center justify-center font-black text-sm shadow-nb z-10">
              {year}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grouped[year].map(paper => (
              <div key={paper.id} className={`nb-card p-4 border-l-8 ${paper.color?.replace('bg-', 'border-') || 'border-black'}`}>
                <h3 className="font-black text-lg">{paper.title}</h3>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => onRead(paper)} className="nb-button text-xs p-1"><Eye size={12}/></button>
                    <button onClick={() => onEdit(paper)} className="nb-button text-xs p-1"><Pencil size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;