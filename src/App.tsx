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
  Info, LayoutGrid, BarChart3, Download, FileText, Users, ChevronRight
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

// --- REACT-PDF IMPORTS ---
import { pdfjs } from 'react-pdf';
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
import { EnhancedReader } from './components/EnhancedReader';

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

// Smart Tag Generator
const generateSmartTags = (text) => {
  if (!text) return [];
  const stopWords = new Set(["the", "and", "of", "for", "with", "analysis", "study", "using", "based", "from", "that", "this", "introduction", "conclusion", "results", "method", "paper", "proposed", "http", "https", "doi", "org", "journal", "vol", "issue", "et", "al"]);
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
  const [activeView, setActiveView] = useState('library'); 
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Input Mode State
  const [inputMode, setInputMode] = useState('drop'); 
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Editing & Uploading State
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // BibTeX Import State
  const [bibtexInput, setBibtexInput] = useState("");
  const [showBibtexModal, setShowBibtexModal] = useState(false);
  
  const graphRef = useRef();
  const [readingStats, setReadingStats] = useState(null);

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
      
      if (typeof calculateReadingStats === 'function') {
        const stats = calculateReadingStats(loaded, []);
        setReadingStats(stats);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const extractMetadata = async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      const metadata = await pdf.getMetadata();
      let authorCandidate = metadata?.info?.Author || "";
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      
      let maxFontSize = 0;
      let titleCandidate = "";
      let fullText = "";
      textContent.items.forEach((item) => {
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
      let pdfHash = "";
      try { if (typeof calculatePDFHash === 'function') pdfHash = await calculatePDFHash(file); } catch (e) {}
      
      if (doiMatch) {
          const cleanDoi = doiMatch[0];
          addToast(`DOI detected: ${cleanDoi}`, "info");
          try {
              const citationData = await fetchSemanticScholarData(cleanDoi, 'DOI');
              if (citationData && !citationData.error) {
                  // Extract authors from the API response
                  let authorsString = "";
                  if (citationData.authors && Array.isArray(citationData.authors)) {
                      authorsString = citationData.authors.map(author => author.name).join(", ");
                  }
                  
                  // Extract year from the API response (could be in 'year' or 'publicationDate')
                  let yearString = "";
                  if (citationData.year) {
                      yearString = citationData.year.toString();
                  } else if (citationData.publicationDate) {
                      // Extract year from publicationDate (format: YYYY-MM-DD)
                      yearString = citationData.publicationDate.split('-')[0];
                  }
                  
                  return {
                      title: citationData.title || titleCandidate,
                      tags: generateSmartTags(citationData.title + " " + (citationData.abstract || "")),
                      authors: authorsString,
                      abstract: citationData.abstract || "",
                      year: yearString || new Date().getFullYear().toString(),
                      venue: citationData.venue || "",
                      doi: cleanDoi,
                      citationCount: citationData.citationCount || 0,
                      semanticScholarId: citationData.paperId,
                      pdfHash,
                      source: 'doi'
                  };
              }
          } catch (e) {
              console.error('Error fetching Semantic Scholar data:', e);
          }
      }
      if (titleCandidate.length < 5) titleCandidate = file.name.replace('.pdf', '');
      return { title: titleCandidate, tags: generateSmartTags(fullText), authors: authorCandidate, abstract: "", year: new Date().getFullYear().toString(), venue: "", pdfHash, source: 'local' };
  };

  const processFile = async (file) => {
      const metadata = await extractMetadata(file);
      if (typeof findDuplicatePapers === 'function') {
        const duplicates = findDuplicatePapers(metadata, papers);
        if (duplicates.length > 0) addToast(`⚠️ Possible duplicate: "${duplicates[0].title}"`, "warning");
      }
      const fileRef = ref(storage, `papers/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      let thumbnailUrl = "";
      try { if (typeof generatePDFThumbnail === 'function') thumbnailUrl = await generatePDFThumbnail(url); } catch (e) {}
      
      await addDoc(collection(db, "papers"), {
        userId: user.uid, title: metadata.title, link: "", tags: metadata.tags, color: COLORS[Math.floor(Math.random() * COLORS.length)].class,
        status: "to-read", abstract: metadata.abstract, authors: metadata.authors, year: metadata.year, venue: metadata.venue,
        notes: "", pdfUrl: url, doi: metadata.doi || "", citationCount: metadata.citationCount || 0, pdfHash: metadata.pdfHash || "",
        thumbnailUrl: thumbnailUrl, createdAt: Date.now(), addedDate: Date.now(),
        rating: 0, methods: [], organisms: [], hypotheses: [], structuredNotes: {}
      });
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
        setIsUploading(true);
        for (let i = 0; i < files.length; i++) {
            setUploadStatus(`Processing ${i + 1}/${files.length}...`);
            await processFile(files[i]);
        }
        setIsUploading(false);
        addToast("Upload complete!", "success");
    } else addToast("Please drop valid PDF files.", "error");
  };
  
  const handleFileSelect = async (e) => { 
    if (e.target.files?.length) { 
      setIsUploading(true); 
      for(let i=0; i<e.target.files.length; i++) await processFile(e.target.files[i]); 
      setIsUploading(false); 
    }
  };

  const deletePaper = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "This will permanently delete the paper and all its annotations.",
      onConfirm: async () => {
        await deleteDoc(doc(db, "papers", id));
        addToast("Paper deleted", "info");
        setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
      }
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateDoc(doc(db, "papers", id), { status: newStatus });
  };

  const allUniqueTags = useMemo(() => {
    const tags = new Set();
    papers.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [papers]);

  const filteredPapers = papers.filter(p => {
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || 
           p.tags?.some(t => t.toLowerCase().includes(q)) ||
           p.authors?.toLowerCase().includes(q);
  });

  // Handler for clicking on tags - navigates back to library with filter
  const handleTagClick = (tag) => {
    setSearchTerm(tag);
    setActiveView('library');
    addToast(`Filtering by tag: ${tag}`, "info");
  };

  // Handler for clicking on authors - navigates back to library with filter
  const handleAuthorClick = (authorName) => {
    setSearchTerm(authorName);
    setActiveView('library');
    addToast(`Filtering by author: ${authorName}`, "info");
  };

  // Handler for updating paper data from EnhancedReader
  const handlePaperUpdate = async (data) => {
    if (!selectedPaper) return;
    await updateDoc(doc(db, "papers", selectedPaper.id), {
      ...data,
      modifiedDate: Date.now()
    });
  };

  // Handler for importing related papers
  const handleImportPaper = async (newPaperData) => {
    if (!user) return;
    await addDoc(collection(db, "papers"), {
      userId: user.uid,
      title: newPaperData.title,
      status: "to-read",
      color: COLORS[0].class,
      tags: [],
      structuredNotes: {},
      ...newPaperData,
      createdAt: Date.now(),
      addedDate: Date.now()
    });
    addToast("Paper added to To-Read", "success");
  };

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
           <div className="bg-white border-4 border-black shadow-nb p-8 max-w-md w-full text-center">
              <h2 className="text-2xl font-black uppercase mb-2">Are you sure?</h2>
              <p className="font-bold text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmDialog({ isOpen: false, message: "", onConfirm: null })} className="flex-1 nb-button bg-white">Cancel</button>
                 <button onClick={confirmDialog.onConfirm} className="flex-1 nb-button bg-red-500 text-white border-black">Confirm</button>
              </div>
           </div>
        </div>
      )}
      {showMetadataModal && editingPaper && (
        <EnhancedMetadataModal
          paper={editingPaper}
          allTags={allUniqueTags}
          onClose={() => {
            setShowMetadataModal(false);
            setEditingPaper(null);
          }}
          onSave={async (data) => {
            await updateDoc(doc(db, "papers", editingPaper.id), {
              ...data,
              modifiedDate: Date.now()
            });
            addToast("Paper updated successfully!", "success");
          }}
          addToast={addToast}
        />
      )}
    </>
  );

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

  if (activeView === 'analytics' && readingStats) {
    return (
      <div className="h-screen flex flex-col bg-nb-gray">
        <SharedUI />
        <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
          <button onClick={() => setActiveView('library')} className="nb-button flex gap-2 text-black"><ChevronLeft /> Back</button>
          <h1 className="text-3xl font-black uppercase">Reading Analytics</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="nb-card p-6 bg-nb-yellow">
              <div className="text-4xl font-black mb-2">{readingStats.papersReadTotal}</div>
              <div className="text-sm font-bold uppercase">Papers Read</div>
            </div>
            <div className="nb-card p-6 bg-nb-cyan">
              <div className="text-4xl font-black mb-2">{readingStats.currentStreak}</div>
              <div className="text-sm font-bold uppercase">Day Streak 🔥</div>
            </div>
            <div className="nb-card p-6 bg-nb-pink">
              <div className="text-4xl font-black mb-2">{formatReadingTime ? formatReadingTime(readingStats.totalReadingTime) : readingStats.totalReadingTime}</div>
              <div className="text-sm font-bold uppercase">Total Reading Time</div>
            </div>
          </div>
          
          <div className="h-96">
             <TagCloud papers={papers} onTagClick={handleTagClick} />
          </div>
          
          <div className="h-96">
             <AuthorNetwork papers={papers} onAuthorClick={handleAuthorClick} />
          </div>
        </div>
      </div>
    );
  }

  // Use EnhancedReader for the reader view
  if (activeView === 'reader' && selectedPaper) {
    return (
      <>
        <SharedUI />
        <EnhancedReader 
          paper={selectedPaper} 
          onClose={() => setActiveView('library')}
          onUpdate={handlePaperUpdate}
          papers={papers}
          onImportPaper={handleImportPaper}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-nb-gray flex flex-col font-sans text-black">
      <SharedUI />
      <header className="bg-white border-b-4 border-black p-5 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3"><div className="bg-black text-white p-2"><BookOpen strokeWidth={3} size={32} /></div><h1 className="text-4xl font-black uppercase tracking-tighter">Paper Vault</h1></div>
        <div className="flex gap-4">
          <button onClick={() => setActiveView('analytics')} className="nb-button flex gap-2"><BarChart3 strokeWidth={3} /> Analytics</button>
          <button onClick={logout} className="nb-button flex gap-2"><LogOut strokeWidth={3} /> Exit</button>
        </div>
      </header>
      
      <div className="bg-white border-b-4 border-black p-6 z-20">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
               <button onClick={() => setInputMode('drop')} className={`text-sm font-black uppercase border-b-4 pb-1 ${inputMode === 'drop' ? 'border-nb-purple' : 'border-transparent'}`}>Smart Drop</button>
               <button onClick={() => setInputMode('manual')} className={`text-sm font-black uppercase border-b-4 pb-1 ${inputMode === 'manual' ? 'border-nb-lime' : 'border-transparent'}`}>Manual Entry</button>
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
              className={`border-4 border-dashed h-32 flex flex-col items-center justify-center cursor-pointer ${isDraggingFile ? 'border-nb-purple bg-purple-50' : 'border-gray-300 bg-gray-50'}`}
            >
               <div className="text-center">
                  <p className="font-black text-xl uppercase">Drop PDF Here</p>
                  <p className="text-sm text-gray-500">Auto-detect: Metadata, Thumbnails, Duplicates</p>
               </div>
               <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" multiple onChange={handleFileSelect} />
            </div>
         ) : (
            <div className="bg-nb-gray p-4 border-4 border-black flex gap-2">
               <input value={doiInput} onChange={e => setDoiInput(e.target.value)} className="nb-input flex-1" placeholder="Paste DOI..." />
               <button disabled={isFetching} className="nb-button bg-nb-purple flex gap-2">{isFetching ? <Loader2 className="animate-spin"/> : <Wand2/>} Auto-Fill</button>
            </div>
         )}
      </div>

      <VirtualKanbanBoard 
        papers={filteredPapers} 
        onStatusChange={handleStatusChange}
        onRead={(p) => { setSelectedPaper(p); setActiveView('reader'); }}
        onEdit={(p) => { 
          setEditingPaper(p); 
          setShowMetadataModal(true); 
        }}
        onDelete={deletePaper}
      />
    </div>
  );
}

export default App;