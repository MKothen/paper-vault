// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Save, Search, 
  StickyNote, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, 
  Sun, Moon, Timer, Clock, Check, ZoomIn, ZoomOut 
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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [user, loading] = useAuthState(auth);
  
  const [papers, setPapers] = useState([]);
  const [columns, setColumns] = useState({ 'to-read': [], 'reading': [], 'read': [] });
  const [activeView, setActiveView] = useState('library'); // library, reader, graph, timeline
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Editing & Uploading State
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [editForm, setEditForm] = useState({});
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // Add Paper Form State
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [newColor, setNewColor] = useState(COLORS[0].class);
  const [newAbstract, setNewAbstract] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState("");

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
      alert("POMODORO COMPLETE!");
    }
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning, pomodoroTime]);

  // Sync Reader State when paper changes
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

  // --- CORE FUNCTIONS ---

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const saveAnnotations = (newH, newP) => {
    if (selectedPaper) {
      localStorage.setItem(`highlights-${selectedPaper.id}`, JSON.stringify(newH));
      localStorage.setItem(`postits-${selectedPaper.id}`, JSON.stringify(newP));
    }
  };

  const handlePageClick = () => {
    // Only highlight if mode is active
    if (!isHighlightMode) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const container = document.querySelector('.pdf-page-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const x = (rect.left - containerRect.left) / scale;
    const y = (rect.top - containerRect.top) / scale;
    const width = rect.width / scale;
    const height = rect.height / scale;

    const newHighlight = {
      id: Date.now(),
      page: pageNumber,
      x, y, width, height,
      color: selectedColor.alpha,
      text: selection.toString()
    };

    const newHighlights = [...highlights, newHighlight];
    setHighlights(newHighlights);
    saveAnnotations(newHighlights, postits);
    selection.removeAllRanges();
  };

  const addPostit = (text = "Double click to edit...") => {
    const jitterX = (Math.random() * 40 - 20);
    const jitterY = (Math.random() * 40 - 20);
    const newPostit = {
      id: Date.now(),
      page: pageNumber,
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

  // --- PAPER MANAGEMENT FUNCTIONS ---

  const fetchDoi = async () => {
    if (!doiInput) return;
    setIsFetching(true);
    try {
      const cleanDoi = doiInput.replace("https://doi.org/", "").trim();
      const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/DOI:${cleanDoi}?fields=title,url,abstract,authors,year,venue`);
      const data = await response.json();
      
      if (data.error) {
        alert("Could not find paper.");
      } else {
        setNewTitle(data.title);
        setNewLink(data.url || `https://doi.org/${cleanDoi}`);
        setNewAbstract(data.abstract);
        setNewYear(data.year ? data.year.toString() : "");
        setNewVenue(data.venue);
        if(data.authors && data.authors.length > 0) {
          setNewAuthors(data.authors.map(a => a.name).slice(0, 3).join(", ") + (data.authors.length > 3 ? " et al." : ""));
        }
        setNewTags(generateSmartTags(data.title));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to fetch DOI.");
    }
    setIsFetching(false);
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
       const fileRef = ref(storage, `papers/${user.uid}/${Date.now()}_${file.name}`);
       await uploadBytes(fileRef, file);
       const url = await getDownloadURL(fileRef);
       setUploadedPdfUrl(url);
       setNewTitle(file.name.replace('.pdf', '')); 
    } catch (e) {
       alert("Upload failed: " + e.message);
    }
    setIsUploading(false);
  };

  const addPaper = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    await addDoc(collection(db, "papers"), {
      userId: user.uid,
      title: newTitle,
      link: newLink,
      tags: newTags,
      color: newColor,
      status: "to-read",
      abstract: newAbstract,
      authors: newAuthors,
      year: newYear,
      venue: newVenue,
      notes: "",
      pdfUrl: uploadedPdfUrl,
      createdAt: Date.now()
    });
    setNewTitle(""); setNewLink(""); setNewTags([]); setNewAbstract(""); 
    setNewAuthors(""); setNewYear(""); setNewVenue(""); setUploadedPdfUrl(""); setDoiInput("");
  };

  const deletePaper = async (id) => {
    if(confirm("Delete this paper?")) await deleteDoc(doc(db, "papers", id));
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
      <div className="bg-white border-4 border-black shadow-nb p-8 max-w-md w-full text-center">
        <Lock className="w-12 h-12 mx-auto mb-4" strokeWidth={3} />
        <h1 className="text-3xl font-black uppercase mb-4">Restricted Access</h1>
        <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="nb-input text-center mb-4" placeholder="PASSWORD" />
        <button onClick={() => passwordInput === APP_PASSWORD && setIsAuthorized(true)} className="nb-button w-full">UNLOCK</button>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-nb-gray"><Loader2 className="animate-spin w-16 h-16" /></div>;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-nb-cyan p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-10 max-w-md w-full text-center">
        <BookOpen className="w-20 h-20 mx-auto mb-6" strokeWidth={3}/>
        <h1 className="text-5xl font-black uppercase mb-2 tracking-tighter">Paper Vault</h1>
        <button onClick={signInWithGoogle} className="w-full border-4 border-black bg-nb-pink p-4 font-black flex items-center justify-center gap-3 text-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <User strokeWidth={3} /> ENTER WITH GOOGLE
        </button>
      </div>
    </div>
  );

  // --- VIEW: READER ---
  if (activeView === 'reader' && selectedPaper) {
    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-nb-yellow'}`}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-3 flex justify-between items-center z-20`}>
          <div className="flex items-center gap-4">
             <button onClick={() => setActiveView('library')} className="nb-button flex gap-2 text-black">
               <ChevronLeft strokeWidth={3} /> Back
             </button>
             <h2 className="font-black text-xl uppercase truncate max-w-md tracking-tight text-black">{selectedPaper.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 text-black shadow-nb-sm">{darkMode ? <Sun strokeWidth={3}/> : <Moon strokeWidth={3}/>}</button>
             <div className="flex items-center border-2 border-black px-2 py-1 gap-2 bg-white text-black shadow-nb-sm">
                <Timer size={16} strokeWidth={3} />
                <span className="font-mono font-bold">{Math.floor(pomodoroTime/60)}:{(pomodoroTime%60).toString().padStart(2,'0')}</span>
                <button onClick={() => setPomodoroRunning(!pomodoroRunning)} className={`px-2 text-xs font-bold border-2 border-black ${pomodoroRunning ? 'bg-nb-orange' : 'bg-nb-lime'}`}>{pomodoroRunning ? 'STOP' : 'GO'}</button>
             </div>
          </div>
        </div>

        {/* Tools */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-b-4 p-2 flex items-center gap-4 z-20 overflow-x-auto shadow-md`}>
           <div className="flex items-center gap-2 pr-4 border-r-4 border-current">
             <span className="font-bold uppercase text-sm text-black">Ink:</span>
             {HIGHLIGHT_COLORS.map(c => (
               <button key={c.name} onClick={() => setSelectedColor(c)} className={`w-6 h-6 border-2 border-black ${selectedColor.name === c.name ? 'ring-2 ring-offset-2 ring-black' : ''}`} style={{ backgroundColor: c.hex }} />
             ))}
           </div>
           
           {/* HIGHLIGHT TOGGLE BUTTON */}
           <button 
             onClick={() => setIsHighlightMode(!isHighlightMode)} 
             className={`nb-button text-xs flex gap-1 items-center ${isHighlightMode ? 'bg-nb-lime shadow-none translate-y-1' : ''}`}
           >
             {isHighlightMode ? <Check size={14} strokeWidth={4} /> : <Highlighter size={14} />} 
             {isHighlightMode ? 'HIGHLIGHTING ON' : 'HIGHLIGHT OFF'}
           </button>

           <button onClick={() => addPostit()} className="nb-button text-xs flex gap-1 bg-nb-cyan">
             <StickyNote size={14} /> Note
           </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 flex overflow-hidden relative">
           <div className={`flex-1 overflow-auto p-8 flex justify-center bg-[radial-gradient(circle,_#000_1px,_transparent_1px)] [background-size:20px_20px] ${darkMode ? 'bg-gray-900' : 'bg-nb-gray'}`}>
              <div className="relative h-fit pdf-page-container" onMouseUp={handlePageClick}>
                 <Document 
                    file={selectedPaper.pdfUrl} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex items-center gap-2 font-bold bg-white p-4 border-4 border-black shadow-nb"><Loader2 className="animate-spin"/> Loading PDF...</div>}
                    error={<div className="bg-red-100 border-4 border-black p-4 font-bold text-red-600 shadow-nb">Failed to load PDF.</div>}
                 >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        renderTextLayer={true} 
                        renderAnnotationLayer={true}
                        className="shadow-nb-lg"
                    />
                 </Document>

                 {/* Highlights Overlay */}
                 <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {highlights.filter(h => h.page === pageNumber).map(h => (
                      <div key={h.id} style={{ 
                           position: 'absolute', 
                           left: h.x * scale, top: h.y * scale, 
                           width: h.width * scale, height: h.height * scale, 
                           backgroundColor: h.color, mixBlendMode: 'multiply' 
                      }} />
                    ))}
                 </div>

                 {/* Post-its Overlay */}
                 {postits.filter(p => p.page === pageNumber).map(p => (
                   <DraggablePostit 
                     key={p.id} 
                     data={p} 
                     scale={scale} 
                     onUpdate={updatePostit} 
                     onDelete={deleteAnnotation} 
                   />
                 ))}
              </div>
           </div>
           
           {/* Sidebar */}
           {showSidebar && (
             <div className={`w-80 border-l-4 border-black flex flex-col ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                <div className="p-4 border-b-4 border-black font-black text-xl uppercase bg-nb-pink text-black flex justify-between">
                   <span>Annotations</span>
                   <button onClick={() => setShowSidebar(false)}><X strokeWidth={3}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {highlights.filter(h => h.page === pageNumber).length === 0 && postits.filter(p => p.page === pageNumber).length === 0 && <div className="text-center opacity-50 font-bold font-mono">NO ANNOTATIONS ON THIS PAGE</div>}
                   {highlights.filter(h => h.page === pageNumber).map(h => (
                     <div key={h.id} className="border-2 border-black p-2 bg-white text-black shadow-nb-sm">
                        <div className="flex justify-between items-center mb-1 border-b border-black pb-1">
                          <span className="text-xs font-bold uppercase">Highlight</span>
                          <button onClick={() => deleteAnnotation(h.id, 'highlight')} className="text-red-600"><Trash2 size={12}/></button>
                        </div>
                        <p className="text-sm font-mono leading-tight">"{h.text.substring(0, 80)}..."</p>
                     </div>
                   ))}
                   {postits.filter(p => p.page === pageNumber).map(p => (
                     <div key={p.id} className={`border-2 border-black p-2 ${p.color.class || 'bg-nb-yellow'} text-black shadow-nb-sm rotate-1`}>
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

        {/* Footer */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-black'} border-t-4 p-3 flex justify-between items-center z-20`}>
           <div className="flex items-center gap-2">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="nb-button p-1"><ZoomOut/></button>
             <span className="font-mono font-bold w-16 text-center text-black bg-white border-2 border-black px-2 py-1">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="nb-button p-1"><ZoomIn/></button>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="nb-button disabled:opacity-50">Prev</button>
              <span className="font-bold border-2 border-black bg-white text-black px-2 py-1">Page {pageNumber} / {numPages || '--'}</span>
              <button onClick={() => setPageNumber(p => Math.min(numPages || 999, p + 1))} disabled={pageNumber >= numPages} className="nb-button disabled:opacity-50">Next</button>
           </div>
           <div className="w-32"></div>
        </div>
      </div>
    );
  }

  // --- VIEW: GRAPH ---
  if (activeView === 'graph') {
    return (
      <div className="h-screen flex flex-col bg-nb-gray">
        <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
          <button onClick={() => setActiveView('library')} className="nb-button flex gap-2"><ChevronLeft /> Back</button>
          <h1 className="text-3xl font-black uppercase">Knowledge Graph</h1>
        </div>
        <div className="flex-1 bg-black border-4 border-black m-4 shadow-nb overflow-hidden relative">
           <ForceGraph2D graphData={graphData} nodeLabel="label" nodeColor="color" backgroundColor="#000000" linkColor={() => "#ffffff"} nodeRelSize={8} />
        </div>
      </div>
    );
  }

  // --- VIEW: TIMELINE ---
  if (activeView === 'timeline') {
    return (
        <div className="h-screen flex flex-col bg-nb-gray">
            <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
                <button onClick={() => setActiveView('library')} className="nb-button flex gap-2"><ChevronLeft /> Back</button>
                <h1 className="text-3xl font-black uppercase">Timeline View</h1>
            </div>
            <TimelineView papers={filteredPapers} onEdit={(p) => { setEditingPaper(p); setEditForm(p); setShowMetadataModal(true); }} onDelete={deletePaper} onRead={(p) => { setSelectedPaper(p); setActiveView('reader'); }} />
        </div>
    );
  }

  // --- VIEW: LIBRARY (KANBAN) ---
  return (
    <div className="min-h-screen bg-nb-gray flex flex-col font-sans text-black">
      <header className="bg-white border-b-4 border-black p-5 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2"><BookOpen strokeWidth={3} size={32} /></div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Paper Vault</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setActiveView('timeline')} className="nb-button flex gap-2"><Clock strokeWidth={3} /> Timeline</button>
          <button onClick={() => setActiveView('graph')} className="nb-button flex gap-2"><Share2 strokeWidth={3} /> Graph</button>
          <button onClick={logout} className="nb-button flex gap-2"><LogOut strokeWidth={3} /> Exit</button>
        </div>
      </header>
      
      <div className="bg-white border-b-4 border-black p-4 flex flex-col gap-4 z-20">
         <div className="flex gap-4 items-center">
            <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} />
                <input className="nb-input pl-12" placeholder="Search Database..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="nb-button flex gap-2">
                {isUploading ? <Loader2 className="animate-spin"/> : <Plus strokeWidth={4} />} Upload PDF
            </button>
         </div>

         <div className="bg-nb-gray p-4 border-2 border-black flex flex-col gap-4">
            <div className="flex gap-2">
                <input value={doiInput} onChange={e => setDoiInput(e.target.value)} className="nb-input" placeholder="Paste DOI to auto-fill..." />
                <button onClick={fetchDoi} disabled={isFetching} className="nb-button bg-nb-purple flex gap-2">{isFetching ? <Loader2 className="animate-spin"/> : <Wand2/>} Auto-Fill</button>
            </div>
            <div className="flex gap-2">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="nb-input flex-2" placeholder="Title" />
                <select value={newColor} onChange={e => setNewColor(e.target.value)} className="nb-input flex-1">
                    {COLORS.map(c => <option key={c.name} value={c.class}>{c.name}</option>)}
                </select>
                <button onClick={addPaper} className="nb-button bg-nb-lime flex gap-2"><Plus/> Add to Vault</button>
            </div>
            {uploadedPdfUrl && <div className="text-xs font-bold text-green-600">PDF Uploaded Ready to Link</div>}
         </div>
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
                                           <button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(db, "papers", paper.id)) }} className="text-red-600"><Trash2 size={16}/></button>
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

      {showMetadataModal && editingPaper && (
        <PaperDetailsModal paper={editForm} onClose={() => setShowMetadataModal(false)} onSave={async (data) => { await updateDoc(doc(db, "papers", editingPaper.id), data); setShowMetadataModal(false); }} allTags={allUniqueTags} />
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

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

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="absolute left-12 top-0 bottom-0 w-1 bg-black"></div>
      {Object.keys(grouped).sort((a, b) => b - a).map(year => (
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

function DraggablePostit({ data, onUpdate, onDelete, scale }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const offset = useRef({ x: 0, y: 0 });

  // Mouse handler for dragging the Post-it container
  const handleMouseDown = (e) => {
    if (isEditing) return; // Do not drag if editing text
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
             {/* Edit Button to explicitly enter edit mode */}
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
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking textarea
            onClick={(e) => e.stopPropagation()}      // Prevent other click handlers
            autoFocus 
          />
        ) : (
          <p className="text-sm font-bold font-mono leading-tight whitespace-pre-wrap select-none">{data.text}</p>
        )}
     </div>
  );
}

export default App;