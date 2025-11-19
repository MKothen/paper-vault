// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout, db, storage } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BookOpen, Trash2, Plus, LogOut, ExternalLink, Loader2, Pencil, X, Save, Search, FileText, StickyNote, Download, Wand2, Layout, Share2, User, Calendar, Clock, FileUp, Eye, Lock, Highlighter, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
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

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-slate-700">
          <Lock size={48} className="mx-auto mb-4 text-indigo-400" />
          <h2 className="text-xl font-bold mb-4">Restricted Access</h2>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter Password"
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-600 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-center"
          />
          <button
            onClick={() => passwordInput === APP_PASSWORD ? setIsAuthorized(true) : alert("Wrong Password")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-bold transition"
          >
            Unlock Vault
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {user ? <Dashboard user={user} /> : <Login />}
    </div>
  );
}

function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md mx-4">
        <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="text-indigo-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">PaperVault</h1>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const [papers, setPapers] = useState([]);
  const [editingPaper, setEditingPaper] = useState(null);
  const [readingPaper, setReadingPaper] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState("board");
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTags, setNewTags] = useState([]);
  const [newColor, setNewColor] = useState(COLORS[0].class);
  const [newAbstract, setNewAbstract] = useState("");
  const [newAuthors, setNewAuthors] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState("");
  const graphRef = useRef();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "papers"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersData = snapshot.docs.map(doc => {
        const data = doc.data();
        const tags = data.tags || (data.tag ? [data.tag] : []);
        return { ...data, id: doc.id, tags };
      });
      setPapers(papersData);
    });
    return unsubscribe;
  }, [user]);

  const allUniqueTags = useMemo(() => {
    const tags = new Set();
    papers.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [papers]);

  const handlePdfDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert("Please drop a PDF file.");
      return;
    }
    setIsFetching(true);
    try {
      const storageRef = ref(storage, `pdfs/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadedPdfUrl(downloadURL);
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
      
      if (doiMatch) {
        const foundDoi = doiMatch[0];
        setDoiInput(foundDoi);
        await fetchDoi(foundDoi);
      } else {
        setNewTitle(file.name.replace('.pdf', ''));
        alert("PDF Uploaded! No DOI found, so please fill in the details.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
    setIsFetching(false);
  };

  const fetchDoi = async (manualDoi = null) => {
    const doiToUse = manualDoi || doiInput;
    if (!doiToUse) return;
    setIsFetching(true);
    try {
      const cleanDoi = doiToUse.replace("https://doi.org/", "").trim();
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
        const smartTags = generateSmartTags(data.title, data.abstract);
        setNewTags(smartTags);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to fetch DOI.");
    }
    setIsFetching(false);
  };

  const handleExport = (format) => {
    const filename = `papervault_${new Date().toISOString().split('T')[0]}`;
    let content;
    
    if (format === 'json') {
      content = JSON.stringify(papers, null, 2);
      downloadFile(content, `${filename}.json`, 'application/json');
    } else {
      content = papers.map(p => {
        const firstAuthor = p.authors ? p.authors.split(',')[0].split(' ').pop() : 'Unknown';
        const key = firstAuthor.replace(/[^a-zA-Z]/g, '') + (p.year || '0000');
        return `@article{${key},\n  title={${p.title}},\n  author={${p.authors}},\n  journal={${p.venue}},\n  year={${p.year}},\n  url={${p.link}},\n  abstract={${p.abstract}},\n  keywords={${p.tags.join(', ')}}\n}`;
      }).join('\n\n');
      downloadFile(content, `${filename}.bib`, 'text/plain');
    }
    setIsExporting(false);
  };

  const downloadFile = (content, filename, type) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  const filteredPapers = papers.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || 
           p.tags.some(t => t.toLowerCase().includes(q)) ||
           (p.authors && p.authors.toLowerCase().includes(q)) ||
           (p.year && p.year.toString().includes(q));
  });

  const addPaper = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    
    await addDoc(collection(db, "papers"), {
      uid: user.uid,
      title: newTitle,
      link: newLink,
      tags: newTags,
      color: newColor,
      status: "To Read",
      abstract: newAbstract,
      authors: newAuthors,
      year: newYear,
      venue: newVenue,
      notes: "",
      pdfUrl: uploadedPdfUrl,
      highlights: [],
      postits: [],
      createdAt: new Date()
    });
    
    setNewTitle("");
    setNewLink("");
    setNewTags([]);
    setNewAbstract("");
    setNewAuthors("");
    setNewYear("");
    setNewVenue("");
    setUploadedPdfUrl("");
  };

  const updatePaper = async (id, updatedData) => {
    await updateDoc(doc(db, "papers", id), updatedData);
    setEditingPaper(null);
  };

  const deletePaper = async (id) => {
    if(confirm("Delete this paper?")) {
      await deleteDoc(doc(db, "papers", id));
    }
  };

  const graphData = useMemo(() => {
    const nodes = papers.map(p => ({
      id: p.id,
      name: p.title || 'Untitled',
      val: 1,
      color: COLORS.find(c => c.class === p.color)?.hex || '#fef08a',
      paperData: p
    }));

    const links = [];
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const intersection = papers[i].tags.filter(t => papers[j].tags.includes(t));
        if (intersection.length > 0) {
          links.push({ source: papers[i].id, target: papers[j].id });
        }
      }
    }

    return { nodes, links };
  }, [papers]);

  const nodeCanvasObject = useCallback((node, ctx) => {
    if (node.x === undefined || node.y === undefined) return;
    const size = 50;
    const x = node.x - size / 2;
    const y = node.y - size / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x + 2, y + 2, size, size);
    ctx.fillStyle = node.color || '#fef08a';
    ctx.fillRect(x, y, size, size);

    const fontSize = 7;
    ctx.font = `${fontSize}px "Patrick Hand", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';

    const words = (node.name || '').split(' ');
    let line = '';
    const lines = [];
    const maxWidth = size - 4;
    const lineHeight = fontSize * 1.1;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const maxLines = Math.floor(size / lineHeight);
    const visibleLines = lines.slice(0, maxLines);
    let startY = y + size / 2 - (visibleLines.length * lineHeight) / 2 + lineHeight/2;

    visibleLines.forEach((l, i) => {
      ctx.fillText(l.trim(), node.x, startY + (i * lineHeight) - lineHeight/2);
    });
  }, []);

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    if (node.x === undefined || node.y === undefined) return;
    const size = 50;
    ctx.fillStyle = color;
    ctx.fillRect(node.x - size / 2, node.y - size / 2, size, size);
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    
    await updateDoc(doc(db, "papers", draggableId), { status: destination.droppableId });
  };

  const renderContent = () => {
    if (viewMode === 'board') {
      return (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-4">
            <Column title="To Read" status="To Read" papers={filteredPapers} onDelete={deletePaper} onEdit={setEditingPaper} onRead={setReadingPaper} color="border-yellow-400 bg-yellow-50/50" badge="bg-yellow-100 text-yellow-800" />
            <Column title="Reading" status="Reading" papers={filteredPapers} onDelete={deletePaper} onEdit={setEditingPaper} onRead={setReadingPaper} color="border-blue-400 bg-blue-50/50" badge="bg-blue-100 text-blue-800" />
            <Column title="Done" status="Done" papers={filteredPapers} onDelete={deletePaper} onEdit={setEditingPaper} onRead={setReadingPaper} color="border-green-400 bg-green-50/50" badge="bg-green-100 text-green-800" />
          </div>
        </DragDropContext>
      );
    }

    if (viewMode === 'graph') {
      return (
        <div className="h-full w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
          {papers.length < 2 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <p className="bg-white/80 p-4 rounded-lg text-gray-500 font-hand">Add more papers with shared tags to see connections!</p>
            </div>
          )}
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeRelSize={6}
            linkWidth={2}
            linkColor={() => '#e5e7eb'}
            backgroundColor="#ffffff"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onNodeClick={(node) => setEditingPaper(node.paperData)}
            onNodeDragEnd={(node) => { node.fx = node.x; node.fy = node.y; }}
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.3}
          />
        </div>
      );
    }

    if (viewMode === 'timeline') {
      return <TimelineView papers={filteredPapers} onEdit={setEditingPaper} onDelete={deletePaper} onRead={setReadingPaper} />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-screen flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> PaperVault
        </h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2 shadow-sm">
            <button onClick={() => setViewMode('board')} className={`p-2 rounded-md transition ${viewMode === 'board' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`} title="Board View"><Layout size={18} /></button>
            <button onClick={() => setViewMode('graph')} className={`p-2 rounded-md transition ${viewMode === 'graph' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`} title="Graph View"><Share2 size={18} /></button>
            <button onClick={() => setViewMode('timeline')} className={`p-2 rounded-md transition ${viewMode === 'timeline' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`} title="Timeline View"><Clock size={18} /></button>
          </div>
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="relative">
            <button onClick={() => setIsExporting(!isExporting)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 shadow-sm">
              <Download size={18} />
            </button>
            {isExporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Export JSON</button>
                <button onClick={() => handleExport('bibtex')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">Export BibTeX</button>
              </div>
            )}
          </div>
          <button onClick={logout} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-600 ml-2">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {viewMode === 'board' && (
        <div 
          className={`bg-white p-4 rounded-xl shadow-sm mb-6 border transition-all flex-shrink-0 relative ${isDragging ? 'border-indigo-400 bg-indigo-50 scale-1.01' : 'border-gray-200'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handlePdfDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-indigo-100/90 z-20 rounded-xl flex flex-col items-center justify-center text-indigo-600 border-2 border-dashed border-indigo-400 animate-in fade-in">
              <FileUp size={48} className="mb-2" />
              <p className="font-bold text-lg">Drop PDF to Upload & Scan</p>
            </div>
          )}

          {uploadedPdfUrl && (
            <div className="mb-3 p-2 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2 border border-green-200">
              <FileUp size={14} /> PDF Uploaded Successfully!
            </div>
          )}

          <div className="flex gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="relative flex-grow">
              <Wand2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500" size={18} />
              <input
                value={doiInput}
                onChange={(e) => setDoiInput(e.target.value)}
                placeholder="Paste DOI or Drop PDF..."
                className="w-full pl-10 pr-4 py-2 border border-purple-100 bg-purple-50/50 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchDoi()}
              disabled={isFetching}
              className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition text-sm flex items-center gap-2"
            >
              {isFetching ? <Loader2 className="animate-spin" size={16} /> : null}
              Auto-Fill
            </button>
          </div>

          <form onSubmit={addPaper} className="flex gap-3 flex-col lg:flex-row">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Paper Title..."
              className="flex-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Link / PDF..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex gap-2 flex-1">
              <div className="w-full">
                <TagInput tags={newTags} setTags={setNewTags} allTags={allUniqueTags} />
              </div>
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {COLORS.map((c, i) => <option key={i} value={c.class}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium shadow-sm transition-colors">
              <Plus size={20} /> Add
            </button>
          </form>
        </div>
      )}

      <div className="flex-grow overflow-hidden relative">
        {renderContent()}
      </div>

      {editingPaper && <PaperDetailsModal paper={editingPaper} allTags={allUniqueTags} onClose={() => setEditingPaper(null)} onSave={updatePaper} />}
      
      {/* BEAUTIFUL CUSTOM PDF READER */}
      {readingPaper && <PdfReader paper={readingPaper} onClose={() => setReadingPaper(null)} onSave={updatePaper} />}
    </div>
  );
}

// ===== BEAUTIFUL CUSTOM PDF READER COMPONENT =====
function PdfReader({ paper, onClose, onSave }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [highlights, setHighlights] = useState(paper.highlights || []);
  const [postits, setPostits] = useState(paper.postits || []);
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!paper.pdfUrl) return;
    
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(paper.pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        renderPage(1, pdf);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPdf();
  }, [paper.pdfUrl]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage, pdfDoc);
    }
  }, [currentPage, scale, pdfDoc]);

  const renderPage = async (pageNum, pdf) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Render highlights on top
    highlights.filter(h => h.page === pageNum).forEach(h => {
      context.fillStyle = h.color;
      context.fillRect(h.x, h.y, h.width, h.height);
    });
  };

  const handleCanvasClick = (e) => {
    if (!isHighlighting && !isAddingNote) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isAddingNote) {
      const noteText = prompt("Enter your note:");
      if (noteText) {
        const newPostit = {
          id: Date.now(),
          page: currentPage,
          x,
          y,
          text: noteText,
          color: selectedColor.hex
        };
        const updatedPostits = [...postits, newPostit];
        setPostits(updatedPostits);
        onSave(paper.id, { postits: updatedPostits });
      }
      setIsAddingNote(false);
    }
  };

  const handleMouseDown = (e) => {
    if (!isHighlighting) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    const handleMouseMove = (e) => {
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      // Draw temporary highlight
      renderPage(currentPage, pdfDoc).then(() => {
        const context = canvasRef.current.getContext('2d');
        context.fillStyle = selectedColor.alpha;
        context.fillRect(
          Math.min(startX, currentX),
          Math.min(startY, currentY),
          Math.abs(currentX - startX),
          Math.abs(currentY - startY)
        );
      });
    };

    const handleMouseUp = (e) => {
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      const newHighlight = {
        id: Date.now(),
        page: currentPage,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        color: selectedColor.alpha
      };

      if (newHighlight.width > 5 && newHighlight.height > 5) {
        const updatedHighlights = [...highlights, newHighlight];
        setHighlights(updatedHighlights);
        onSave(paper.id, { highlights: updatedHighlights });
      }

      canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current.removeEventListener('mouseup', handleMouseUp);
    };

    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('mouseup', handleMouseUp);
  };

  const deletePostit = (id) => {
    const updatedPostits = postits.filter(p => p.id !== id);
    setPostits(updatedPostits);
    onSave(paper.id, { postits: updatedPostits });
  };

  const clearHighlights = () => {
    if (confirm("Clear all highlights on this page?")) {
      const updatedHighlights = highlights.filter(h => h.page !== currentPage);
      setHighlights(updatedHighlights);
      onSave(paper.id, { highlights: updatedHighlights });
      renderPage(currentPage, pdfDoc);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h3 className="font-bold text-gray-800">{paper.title}</h3>
            <p className="text-xs text-gray-500">Page {currentPage} of {numPages}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-gray-200 flex items-center gap-3 bg-gray-50 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-2 border-r pr-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage === numPages}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2 border-r pr-3">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.25))}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(3, scale + 0.25))}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Highlighting */}
          <div className="flex items-center gap-2 border-r pr-3">
            <button
              onClick={() => {
                setIsHighlighting(!isHighlighting);
                setIsAddingNote(false);
              }}
              className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
                isHighlighting ? 'bg-yellow-400 text-yellow-900' : 'bg-white border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Highlighter size={16} />
              {isHighlighting ? 'Highlighting...' : 'Highlight'}
            </button>
            
            {/* Color picker */}
            <div className="flex gap-1">
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded border-2 transition ${
                    selectedColor.name === color.name ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            <button
              onClick={clearHighlights}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium transition"
            >
              Clear
            </button>
          </div>

          {/* Post-it Notes */}
          <button
            onClick={() => {
              setIsAddingNote(!isAddingNote);
              setIsHighlighting(false);
            }}
            className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
              isAddingNote ? 'bg-pink-400 text-pink-900' : 'bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <StickyNote size={16} />
            {isAddingNote ? 'Click to add note...' : 'Add Note'}
          </button>
        </div>

        {/* PDF Canvas + Post-its */}
        <div ref={containerRef} className="flex-grow overflow-auto bg-gray-900 p-8 relative">
          <div className="max-w-fit mx-auto relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              className={`bg-white shadow-2xl ${isHighlighting || isAddingNote ? 'cursor-crosshair' : 'cursor-default'}`}
            />
            
            {/* Render post-it notes */}
            {postits.filter(p => p.page === currentPage).map(postit => (
              <div
                key={postit.id}
                className="absolute bg-yellow-200 p-3 rounded-lg shadow-lg border-l-4 border-yellow-400 min-w-[150px] max-w-[250px] group"
                style={{
                  left: postit.x,
                  top: postit.y,
                  backgroundColor: postit.color
                }}
              >
                <button
                  onClick={() => deletePostit(postit.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={12} />
                </button>
                <p className="text-sm text-gray-800 font-hand leading-relaxed">{postit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== HELPER COMPONENTS (Timeline, Column, etc.) =====

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
    <div className="h-full overflow-y-auto p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-indigo-100"></div>
      {Object.keys(grouped).sort((a, b) => b - a).map(year => (
        <div key={year} className="mb-8 relative pl-16">
          <div className="absolute left-2 top-0 flex items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md border-4 border-white z-10">
              {year}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grouped[year].map(paper => (
              <div key={paper.id} className={`bg-white p-4 rounded-xl shadow-sm border border-l-4 ${paper.color ? paper.color.replace('bg-', 'border-l-') : 'border-l-gray-300'} border-gray-200 hover:shadow-md transition-all`}>
                <h3 className="font-semibold text-gray-800 mb-1 leading-snug">{paper.title}</h3>
                <div className="text-xs text-gray-500 mb-2 flex flex-wrap gap-2 items-center">
                  {paper.authors && <span className="flex items-center gap-1"><User size={10} /> {paper.authors.split(',')[0]}{paper.authors.includes(',') ? ' et al.' : ''}</span>}
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">{paper.status}</span>
                </div>
                <div className="flex gap-1">
                  {paper.tags.slice(0, 3).map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-200">{t}</span>
                  ))}
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-50 gap-1">
                  {paper.pdfUrl && (
                    <button onClick={() => onRead(paper)} className="text-gray-400 hover:text-green-600 transition p-1" title="Read PDF">
                      <Eye size={14} />
                    </button>
                  )}
                  <button onClick={() => onEdit(paper)} className="text-gray-400 hover:text-blue-500 transition p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(paper.id)} className="text-gray-400 hover:text-red-500 transition p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TagInput({ tags, setTags, allTags }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (input.trim()) {
      setSuggestions([]);
    } else {
      const filtered = allTags.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t));
      setSuggestions(filtered.slice(0, 5));
    }
  }, [input, allTags, tags]);

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInput("");
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input.trim());
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full relative">
      <div className="w-full p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white flex flex-wrap gap-2 min-h-[48px] items-center">
        {tags.map((tag, index) => (
          <span key={index} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== index))} className="hover:text-indigo-900">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Tags..." : ""}
          className="flex-grow outline-none text-sm min-w-[60px]"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg overflow-hidden">
          {suggestions.map((suggestion, i) => (
            <li key={i} onClick={() => addTag(suggestion)} className="px-3 py-2 hover:bg-indigo-50 text-sm cursor-pointer text-gray-700">
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Column({ title, status, papers, onDelete, onEdit, onRead, color, badge }) {
  const filteredPapers = papers.filter(p => p.status === status);

  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef} className={`p-4 rounded-2xl border-t-4 ${color} bg-white shadow-sm flex flex-col h-full max-h-full overflow-hidden`}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="font-bold text-gray-700">{title}</h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge}`}>{filteredPapers.length}</span>
          </div>
          <div className="overflow-y-auto flex-grow space-y-3 pr-2">
            {filteredPapers.map((paper, index) => (
              <Draggable key={paper.id} draggableId={paper.id} index={index}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing">
                    <div className="mb-3 flex flex-wrap gap-1">
                      {paper.tags && paper.tags.map((t, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">{t}</span>
                      ))}
                      {(paper.notes || paper.abstract) && <StickyNote size={14} className="text-gray-400 ml-auto" />}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1 leading-snug pr-6">{paper.title}</h3>
                    <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-2 items-center">
                      {paper.authors && <span className="flex items-center gap-1"><User size={10} /> {paper.authors.split(',')[0]}{paper.authors.includes(',') ? ' et al.' : ''}</span>}
                      {paper.year && <span className="flex items-center gap-1"><Calendar size={10} /> {paper.year}</span>}
                    </div>
                    {paper.link && (
                      <a href={paper.link} target="_blank" rel="noreferrer" className="text-indigo-500 text-xs flex items-center gap-1 mb-2 hover:underline w-fit">
                        <ExternalLink size={12} /> Open Source
                      </a>
                    )}
                    <div className="flex justify-end items-center pt-3 border-t border-gray-50 mt-2 gap-1">
                      {paper.pdfUrl && (
                        <button onClick={() => onRead(paper)} className="text-gray-400 hover:text-green-600 transition p-1" title="Read PDF">
                          <Eye size={16} />
                        </button>
                      )}
                      <button onClick={() => onEdit(paper)} className="text-gray-400 hover:text-blue-500 transition p-1.5 rounded-md hover:bg-blue-50">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(paper.id)} className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-md hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
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
  );
}

function PaperDetailsModal({ paper, allTags, onClose, onSave }) {
  const [title, setTitle] = useState(paper.title);
  const [link, setLink] = useState(paper.link);
  const [tags, setTags] = useState(paper.tags);
  const [color, setColor] = useState(paper.color || COLORS[0].class);
  const [abstract, setAbstract] = useState(paper.abstract);
  const [notes, setNotes] = useState(paper.notes);
  const [authors, setAuthors] = useState(paper.authors);
  const [year, setYear] = useState(paper.year);
  const [venue, setVenue] = useState(paper.venue);

  const handleSubmit = (e) => {
    if(e) e.preventDefault();
    onSave(paper.id, { title, link, tags, color, abstract, notes, authors, year, venue });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" /> Paper Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link</label>
                <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Authors</label>
                <input value={authors} onChange={(e) => setAuthors(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div className="flex gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
                  <input value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Venue/Journal</label>
                  <input value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tags</label>
                  <TagInput tags={tags} setTags={setTags} allTags={allTags} />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer">
                    {COLORS.map((c, i) => <option key={i} value={c.class}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">Abstract</label>
              <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={4} placeholder="Paste abstract..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed text-gray-600 resize-y" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                <StickyNote size={14} /> Notes
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Your notes..." className="w-full p-3 border border-yellow-200 bg-yellow-50/30 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm leading-relaxed text-gray-700 resize-y" />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2 shadow-sm">
            <Save size={18} /> Save Everything
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
