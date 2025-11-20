// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Save, Search, FileText, StickyNote, Download, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Undo2, Clipboard, Moon, Sun, Sidebar as SidebarIcon, Copy, Timer } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ForceGraph2D from 'react-force-graph-2d';
import * as pdfjsLib from 'pdfjs-dist';

// --- CONFIGURATION ---
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const APP_PASSWORD = "science-rocks";

// Neo-Brutalist Palette
const COLORS = [
  { name: 'Yellow', class: 'bg-nb-yellow', hex: '#FFD90F', border: 'border-black' },
  { name: 'Cyan', class: 'bg-nb-cyan', hex: '#22d3ee', border: 'border-black' },
  { name: 'Pink', class: 'bg-nb-pink', hex: '#FF90E8', border: 'border-black' },
  { name: 'Lime', class: 'bg-nb-lime', hex: '#a3e635', border: 'border-black' },
  { name: 'Purple', class: 'bg-nb-purple', hex: '#c084fc', border: 'border-black' },
  { name: 'Orange', class: 'bg-nb-orange', hex: '#fb923c', border: 'border-black' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FFD90F', alpha: 'rgba(255, 217, 15, 0.5)' },
  { name: 'Green', hex: '#a3e635', alpha: 'rgba(163, 230, 53, 0.5)' },
  { name: 'Blue', hex: '#22d3ee', alpha: 'rgba(34, 211, 238, 0.5)' },
  { name: 'Pink', hex: '#FF90E8', alpha: 'rgba(255, 144, 232, 0.5)' },
];

const NOTE_TEMPLATES = [
  { label: "KEY FINDING", prefix: "📌 Key Finding: " },
  { label: "METHOD", prefix: "🔬 Methodology: " },
  { label: "IDEA", prefix: "💡 Idea: " },
];

const CITATION_FORMATS = {
  APA: (paper) => `${paper.authors || 'Unknown'} (${paper.year || 'n.d.'}). ${paper.title}.`,
  MLA: (paper) => `${paper.authors || 'Unknown'}. "${paper.title}." ${paper.venue || 'N.p.'}, ${paper.year || 'n.d.'}.`,
  BibTeX: (paper) => `@article{${(paper.authors?.split(' ')[0] || 'unknown').toLowerCase()}${paper.year || ''},\n  title={${paper.title}},\n  author={${paper.authors}},\n  year={${paper.year}}\n}`
};

const generateSmartTags = (title) => {
  if (!title) return [];
  const stopWords = new Set(["the", "and", "of", "for", "with", "analysis", "study", "using", "based"]);
  return title.split(' ')
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(w => w.length > 4 && !stopWords.has(w))
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));
};

function App() {
  // --- STATE ---
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
  
  // Modals & Forms
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [editForm, setEditForm] = useState({});
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // PDF Reader
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  
  // Annotations
  const [highlights, setHighlights] = useState([]);
  const [postits, setPostits] = useState([]);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [selectedText, setSelectedText] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Tools
  const [darkMode, setDarkMode] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationFormat, setCitationFormat] = useState("APA");
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [searchInPdf, setSearchInPdf] = useState("");
  const pomodoroRef = useRef(null);

  // --- DATA FETCHING ---
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
      alert("POMODORO COMPLETE!");
    }
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning, pomodoroTime]);

  // --- PDF LOGIC ---
  useEffect(() => {
    if (selectedPaper) {
      const h = localStorage.getItem(`highlights-${selectedPaper.id}`);
      const p = localStorage.getItem(`postits-${selectedPaper.id}`);
      setHighlights(h ? JSON.parse(h) : []);
      setPostits(p ? JSON.parse(p) : []);
      setCurrentPage(1);
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

      // Fill white first for dark mode inversion to work properly
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;

      // TEXT LAYER RENDERING
      if (textLayerRef.current) {
        const textContent = await page.getTextContent();
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;
        // Key fix: Ensure text layer aligns perfectly with canvas
        textLayerRef.current.style.setProperty('--scale-factor', scale);
        
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport: viewport,
          textDivs: []
        });
      }
    };
    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // --- ACTION HANDLERS ---
  const saveAnnotations = (newH, newP) => {
    if (selectedPaper) {
      localStorage.setItem(`highlights-${selectedPaper.id}`, JSON.stringify(newH));
      localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(newP));
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) setSelectedText(text);
    else setSelectedText("");
  };

  const addHighlight = () => {
    if (!selectedText || !canvasRef.current) return;
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate relative coordinates
    const newHighlight = {
      id: Date.now(),
      page: currentPage,
      x: rect.left - canvasRect.left,
      y: rect.top - canvasRect.top,
      width: rect.width,
      height: rect.height,
      color: selectedColor.alpha,
      text: selectedText
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    saveAnnotations(newHighlights, postits);
    setSelectedText("");
    selection.removeAllRanges();
  };

  const addPostit = (text = "New Note") => {
    // Random jitter to prevent stacking
    const jitterX = Math.random() * 40 - 20;
    const jitterY = Math.random() * 40 - 20;
    
    const newPostit = {
      id: Date.now(),
      page: currentPage,
      x: 100 + jitterX, 
      y: 100 + jitterY,
      text: text,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    const newPostits = [...postits, newPostit];
    setPostits(newPostits);
    saveAnnotations(highlights, newPostits);
  };

  const updatePostit = (id, updates) => {
    const updated = postits.map(p => p.id === id ? { ...p, ...updates } : p);
    setPostits(updated);
    saveAnnotations(highlights, updated);
  };

  const deleteAnnotation = (id, type) => {
    if (type === 'highlight') {
      const filtered = highlights.filter(h => h.id !== id);
      setHighlights(filtered);
      saveAnnotations(filtered, postits);
    } else {
      const filtered = postits.filter(p => p.id !== id);
      setPostits(filtered);
      saveAnnotations(highlights, filtered);
    }
  };

  // Graph Data Generation
  const graphData = useMemo(() => {
    const nodes = papers.map(p => ({ id: p.id, label: p.title, color: COLORS.find(c => c.class === p.color)?.hex || '#FFD90F' }));
    const links = [];
    papers.forEach((p1, i) => {
      papers.slice(i + 1).forEach(p2 => {
        const shared = p1.tags?.filter(t => p2.tags?.includes(t));
        if (shared?.length > 0) links.push({ source: p1.id, target: p2.id });
      });
    });
    return { nodes, links };
  }, [papers]);

  // --- RENDER: AUTH GATE ---
  if (!isAuthorized) return (
    <div className="min-h-screen flex items-center justify-center bg-nb-yellow p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full text-center">
        <Lock className="w-12 h-12 mx-auto mb-4" strokeWidth={3} />
        <h1 className="text-3xl font-black uppercase mb-4">Restricted Access</h1>
        <input 
          type="password" 
          className="w-full border-4 border-black p-3 font-bold mb-4 text-center focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          placeholder="PASSWORD"
          value={passwordInput}
          onChange={e => setPasswordInput(e.target.value)}
        />
        <button onClick={() => passwordInput === APP_PASSWORD && setIsAuthorized(true)} className="w-full bg-black text-white font-black p-3 hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all border-4 border-black">UNLOCK</button>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-nb-gray"><Loader2 className="animate-spin w-16 h-16" /></div>;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-nb-cyan p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-md w-full text-center">
        <BookOpen className="w-20 h-20 mx-auto mb-6" strokeWidth={3}/>
        <h1 className="text-5xl font-black uppercase mb-2 tracking-tighter">Paper Vault</h1>
        <p className="font-bold mb-8 border-b-4 border-black inline-block text-xl">RESEARCH / DESTROY</p>
        <button onClick={signInWithGoogle} className="w-full border-4 border-black bg-nb-pink p-4 font-black flex items-center justify-center gap-3 text-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <User strokeWidth={3} /> ENTER WITH GOOGLE
        </button>
      </div>
    </div>
  );

  // --- RENDER: READER VIEW ---
  if (activeView === 'reader' && selectedPaper) {
    const currentHighlights = highlights.filter(h => h.page === currentPage);
    const currentPostits = postits.filter(p => p.page === currentPage);

    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-nb-yellow'}`}>
        {/* Reader Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-3 flex justify-between items-center z-20`}>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveView('library')} className="border-2 border-current px-3 py-1 font-bold flex items-center gap-2 hover:bg-black hover:text-white transition-colors uppercase">
               <ChevronLeft strokeWidth={3} /> Back
             </button>
             <h2 className="font-black text-xl uppercase truncate max-w-md tracking-tight">{selectedPaper.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 border-2 border-current hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {darkMode ? <Sun strokeWidth={3}/> : <Moon strokeWidth={3}/>}
             </button>
             <div className="flex items-center border-2 border-current px-2 py-1 gap-2 bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Timer size={16} strokeWidth={3} />
                <span className="font-mono font-bold">{Math.floor(pomodoroTime/60)}:{(pomodoroTime%60).toString().padStart(2,'0')}</span>
                <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className={`px-2 text-xs font-bold border-2 border-black ${pomodoroRunning ? 'bg-nb-orange' : 'bg-nb-lime'}`}>
                  {pomodoroRunning ? 'STOP' : 'GO'}
                </button>
             </div>
          </div>
        </div>

        {/* Tools */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-2 flex items-center gap-4 z-20 overflow-x-auto shadow-md`}>
           <div className="flex items-center gap-2 pr-4 border-r-4 border-current">
             <span className="font-bold uppercase text-sm">Ink:</span>
             {HIGHLIGHT_COLORS.map(c => (
               <button 
                 key={c.name} 
                 onClick={() => setSelectedColor(c)}
                 className={`w-6 h-6 border-2 border-black ${selectedColor.name === c.name ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                 style={{ backgroundColor: c.hex }}
               />
             ))}
           </div>
           
           {selectedText ? (
             <button onClick={addHighlight} className="bg-nb-lime text-black border-2 border-black px-3 py-1 font-bold flex items-center gap-2 hover:translate-y-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
               <Highlighter size={16} strokeWidth={3} /> HIGHLIGHT TEXT
             </button>
           ) : (
             <button onClick={() => addPostit()} className="bg-nb-cyan text-black border-2 border-black px-3 py-1 font-bold flex items-center gap-2 hover:translate-y-1 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               <StickyNote size={16} strokeWidth={3} /> ADD NOTE
             </button>
           )}

           {/* Smart Templates */}
           <div className="flex gap-2">
             {NOTE_TEMPLATES.map(t => (
               <button key={t.label} onClick={() => addPostit(t.prefix)} className="bg-white border-2 border-black px-2 py-1 text-xs font-bold hover:bg-nb-pink uppercase">
                 {t.label}
               </button>
             ))}
           </div>
        </div>

        {/* PDF Canvas Wrapper */}
        <div className="flex-1 flex overflow-hidden relative">
           <div className={`flex-1 overflow-auto p-8 flex justify-center bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:20px_20px] ${darkMode ? 'bg-gray-900' : 'bg-nb-gray'}`}>
              <div className="relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black bg-white h-fit">
                 {/* Canvas */}
                 <canvas 
                   ref={canvasRef} 
                   style={{ 
                     display: 'block',
                     filter: darkMode ? 'invert(1) hue-rotate(180deg)' : 'none' 
                   }} 
                 />
                 
                 {/* Transparent Text Layer for Selection */}
                 <div 
                   ref={textLayerRef} 
                   className="textLayer absolute top-0 left-0"
                   style={{
                     mixBlendMode: 'multiply',
                     opacity: 1,
                     color: 'transparent',
                     lineHeight: '1',
                     transformOrigin: '0 0'
                   }}
                   onMouseUp={handleTextSelection}
                 />

                 {/* Highlights Visuals */}
                 <div className="absolute inset-0 pointer-events-none">
                    {currentHighlights.map(h => (
                      <div 
                        key={h.id} 
                        style={{ 
                           position: 'absolute', 
                           left: h.x, 
                           top: h.y, 
                           width: h.width, 
                           height: h.height, 
                           backgroundColor: h.color,
                           mixBlendMode: 'multiply',
                           opacity: 0.6
                        }} 
                      />
                    ))}
                 </div>

                 {/* Draggable Notes */}
                 {currentPostits.map(p => (
                   <DraggablePostit 
                     key={p.id} 
                     data={p} 
                     onUpdate={updatePostit} 
                     onDelete={deleteAnnotation} 
                     darkMode={darkMode}
                   />
                 ))}
              </div>
           </div>
           
           {/* Sidebar Annotations */}
           {showSidebar && (
             <div className={`w-80 border-l-4 border-black flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className="p-4 border-b-4 border-black font-black text-xl uppercase bg-nb-pink text-black flex justify-between">
                   <span>Annotations</span>
                   <button onClick={() => setShowSidebar(false)}><X strokeWidth={3}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {currentHighlights.length === 0 && currentPostits.length === 0 && <div className="text-center opacity-50 font-bold font-mono">NO ANNOTATIONS</div>}
                   
                   {currentHighlights.map(h => (
                     <div key={h.id} className="border-2 border-black p-2 bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex justify-between items-center mb-1 border-b border-black pb-1">
                          <span className="text-xs font-bold uppercase">Page {h.page}</span>
                          <button onClick={() => deleteAnnotation(h.id, 'highlight')} className="text-red-600 hover:bg-red-100 p-1"><Trash2 size={12}/></button>
                        </div>
                        <p className="text-sm font-mono leading-tight">"{h.text.substring(0, 80)}..."</p>
                     </div>
                   ))}

                   {currentPostits.map(p => (
                     <div key={p.id} className={`border-2 border-black p-2 ${p.color.class || 'bg-nb-yellow'} text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1`}>
                        <div className="flex justify-between items-center mb-1 border-b border-black/20 pb-1">
                          <span className="text-xs font-bold uppercase">Note</span>
                          <button onClick={() => deleteAnnotation(p.id, 'postit')}><Trash2 size={12}/></button>
                        </div>
                        <p className="text-sm font-bold">{p.text}</p>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
        
        {/* Bottom Navigation */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-t-4 p-3 flex justify-between items-center z-20`}>
           <div className="flex items-center gap-2">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="border-2 border-current p-1 hover:bg-black hover:text-white"><ZoomOut/></button>
             <span className="font-mono font-bold w-16 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="border-2 border-current p-1 hover:bg-black hover:text-white"><ZoomIn/></button>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="font-black uppercase hover:underline disabled:opacity-50">Prev</button>
              <span className="font-bold border-2 border-current px-2 py-1">Page {currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages} className="font-black uppercase hover:underline disabled:opacity-50">Next</button>
           </div>
           <div className="w-32"></div>
        </div>
      </div>
    );
  }

  // --- RENDER: GRAPH VIEW ---
  if (activeView === 'graph') {
    return (
      <div className="h-screen flex flex-col bg-nb-gray">
        <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('library')} className="border-2 border-black px-3 py-1 font-bold hover:bg-black hover:text-white flex gap-2 uppercase"><ChevronLeft /> Back</button>
            <h1 className="text-3xl font-black uppercase">Knowledge Graph</h1>
          </div>
        </div>
        <div className="flex-1 bg-black border-4 border-black m-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
           <ForceGraph2D 
             graphData={graphData}
             nodeLabel="label"
             nodeColor="color"
             backgroundColor="#000000"
             linkColor={() => "#ffffff"}
             nodeRelSize={8}
           />
        </div>
      </div>
    );
  }

  // --- RENDER: KANBAN LIBRARY ---
  return (
    <div className="min-h-screen bg-nb-gray flex flex-col font-sans text-black">
      {/* Header */}
      <header className="bg-white border-b-4 border-black p-5 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2"><BookOpen strokeWidth={3} size={32} /></div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Paper Vault</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveView('graph')} className="border-2 border-black bg-nb-purple px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex gap-2 uppercase">
            <Share2 strokeWidth={3} /> Graph
          </button>
          <button onClick={logout} className="border-2 border-black bg-nb-orange px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex gap-2 uppercase">
            <LogOut strokeWidth={3} /> Exit
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b-4 border-black p-4 flex gap-4 items-center flex-wrap z-20">
         <div className="flex-1 relative min-w-[200px]">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} />
           <input 
             className="w-full border-2 border-black py-3 pl-12 font-bold uppercase placeholder-gray-500 focus:outline-none focus:bg-yellow-50 text-lg" 
             placeholder="Search Database..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
         </div>
         
         <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
         <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-nb-lime border-2 border-black px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex gap-2 uppercase text-lg">
           {isUploading ? <Loader2 className="animate-spin"/> : <Plus strokeWidth={4} />} Upload PDF
         </button>
      </div>

      {/* Kanban Board */}
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
                       {/* Column Header */}
                       <div className="bg-black text-white p-4 border-4 border-black mb-6 font-black text-2xl uppercase tracking-widest flex justify-between items-center shadow-[8px_8px_0px_0px_rgba(100,100,100,0.5)]">
                          <span>{status.replace('-', ' ')}</span>
                          <span className="bg-white text-black px-3 py-1 rounded-full text-sm border-2 border-black font-bold">{columns[status].length}</span>
                       </div>
                       
                       {/* Column Content */}
                       <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white border-4 border-black p-4 space-y-6 overflow-y-auto shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
                          {columns[status].map((paper, index) => (
                            <Draggable key={paper.id} draggableId={paper.id} index={index}>
                               {(provided) => {
                                 // Visual randomness
                                 const rotate = index % 2 === 0 ? 'rotate-1' : '-rotate-1';
                                 const color = COLORS.find(c => c.class === paper.color) || COLORS[0];
                                 
                                 return (
                                   <div
                                     ref={provided.innerRef}
                                     {...provided.draggableProps}
                                     {...provided.dragHandleProps}
                                     className={`relative p-5 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${color.class} ${rotate} hover:scale-105 hover:z-50 transition-transform cursor-grab active:cursor-grabbing`}
                                   >
                                      {/* Tape Effect */}
                                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-white/40 border border-white/50 rotate-2 shadow-sm backdrop-blur-sm z-10"></div>
                                      
                                      <div className="flex justify-between items-start mb-2 mt-2">
                                        <h3 className="font-black text-lg leading-tight uppercase line-clamp-3 flex-1">{paper.title}</h3>
                                        <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <button onClick={() => { setEditingPaper(paper); setEditForm(paper); setShowMetadataModal(true); }}><Pencil size={16}/></button>
                                           <button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(db, "papers", paper.id)) }} className="text-red-600"><Trash2 size={16}/></button>
                                        </div>
                                      </div>
                                      
                                      <div className="border-t-2 border-black/20 pt-2 mb-4 text-xs font-mono font-bold flex justify-between">
                                         <span>{paper.authors?.split(',')[0] || 'Unknown'}</span>
                                         <span>{paper.year}</span>
                                      </div>

                                      <button onClick={() => { setSelectedPaper(paper); pdfjsLib.getDocument(paper.pdfUrl).promise.then(pdf => { setPdfDoc(pdf); setNumPages(pdf.numPages); setActiveView('reader'); }); }} className="w-full bg-black text-white font-bold py-2 text-sm hover:bg-white hover:text-black border-2 border-transparent hover:border-black transition-colors uppercase flex items-center justify-center gap-2">
                                        <Eye size={16} /> Read Paper
                                      </button>
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] w-full max-w-lg p-8 relative">
              <button onClick={() => setShowMetadataModal(false)} className="absolute top-4 right-4 hover:rotate-90 transition-transform"><X size={32} strokeWidth={3}/></button>
              <h2 className="text-3xl font-black uppercase mb-6 border-b-4 border-black pb-2">Edit Metadata</h2>
              <div className="space-y-4">
                 <div>
                   <label className="font-bold uppercase block mb-1">Title</label>
                   <input className="w-full border-2 border-black p-3 font-bold bg-gray-50" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                 </div>
                 <div>
                   <label className="font-bold uppercase block mb-1">Authors</label>
                   <input className="w-full border-2 border-black p-3 font-bold bg-gray-50" value={editForm.authors || ''} onChange={e => setEditForm({...editForm, authors: e.target.value})} />
                 </div>
                 <div>
                   <label className="font-bold uppercase block mb-1">Color</label>
                   <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button 
                          key={c.name} 
                          onClick={() => setEditForm({...editForm, color: c.class})} 
                          className={`w-10 h-10 border-2 border-black ${c.class} ${editForm.color === c.class ? 'ring-4 ring-black ring-offset-2' : ''} hover:scale-110 transition-transform`} 
                        />
                      ))}
                   </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setShowMetadataModal(false)} className="flex-1 border-4 border-black p-3 font-black uppercase hover:bg-gray-200">Cancel</button>
                    <button onClick={async () => { await updateDoc(doc(db, "papers", editingPaper.id), editForm); setShowMetadataModal(false); }} className="flex-1 bg-black text-white border-4 border-black p-3 font-black uppercase hover:bg-nb-lime hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">Save</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- DRAGGABLE POSTIT COMPONENT ---
// Standard Mouse-Event based dragging (reliable on canvas)
function DraggablePostit({ data, onUpdate, onDelete, darkMode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.stopPropagation(); // Prevent PDF panning
    setIsDragging(true);
    offset.current = {
      x: e.clientX - data.x,
      y: e.clientY - data.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;
      onUpdate(data.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate, data.id]);

  return (
     <div 
       style={{ position: 'absolute', left: data.x, top: data.y }}
       className={`w-48 p-4 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${data.color.class || 'bg-nb-yellow'} z-50 cursor-move group hover:scale-105 transition-transform`}
       onMouseDown={handleMouseDown}
       onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
     >
        {/* Header/Handle */}
        <div className="flex justify-between items-start mb-2 border-b border-black/20 pb-1">
           <span className="text-[10px] font-black uppercase bg-white px-1 border border-black">Note</span>
           <button 
             onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on delete
             onClick={() => onDelete(data.id, 'postit')} 
             className="bg-red-600 text-white p-0.5 border border-black hover:bg-red-800"
           >
             <X size={12} strokeWidth={3}/>
           </button>
        </div>
        
        {/* Content */}
        {isEditing ? (
          <textarea 
            className="w-full h-24 text-sm font-bold bg-white/50 border-2 border-black p-1 focus:outline-none resize-none" 
            value={text} 
            onChange={e => setText(e.target.value)}
            onBlur={() => { setIsEditing(false); onUpdate(data.id, { text }); }}
            onMouseDown={e => e.stopPropagation()} // Allow text selection inside
            autoFocus
          />
        ) : (
          <p className="text-sm font-bold font-mono leading-tight whitespace-pre-wrap select-none">{data.text}</p>
        )}
     </div>
  );
}

export default App;