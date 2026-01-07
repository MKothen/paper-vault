// src/App.tsx
// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, signInWithGoogle, logout } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  BookOpen, Trash2, Plus, LogOut, Loader2, Pencil, X, Search, 
  StickyNote, Wand2, Share2, User, Eye, Lock, Highlighter, ChevronLeft, 
  Sun, Moon, Timer, Clock, ZoomIn, ZoomOut, FileUp, 
  LayoutGrid, BarChart3, Download, FileText, Users, ChevronRight,
  Brain, RefreshCw, Calendar, Upload
} from 'lucide-react';

// --- REACT-PDF IMPORTS ---
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// --- UTILITY IMPORTS ---
import { generatePDFThumbnail, extractPDFText, findDuplicatePapers, calculatePDFHash } from './utils/pdfUtils';
import { 
  fetchSemanticScholarData, 
  parseBibTeX, 
  generateBibTeX, 
  formatCitation, 
  normalizeDOI, 
  detectIdentifier 
} from './utils/citationUtils';
import { calculateReadingStats, formatReadingTime, getTopItems } from './utils/analyticsUtils';
import { sm2Review, initializeSRS, getDuePapers } from './utils/srs';

// --- COMPONENT IMPORTS ---
import { VirtualKanbanBoard } from './components/VirtualKanbanBoard';
import { RelatedWorkFinder } from './components/RelatedWorkFinder';
import { AuthorNetwork } from './components/AuthorNetwork';
import { TagCloud } from './components/TagCloud';
import { AISummary } from './components/AISummary';
import { TOCSidebar } from './components/TOCSidebar';
import { EnhancedMetadataModal } from './components/EnhancedMetadataModal';
import { EnhancedReader } from './components/EnhancedReader';
import { ReviewQueue } from './components/ReviewQueue';
import { MultiFilterSidebar } from './components/MultiFilterSidebar'; // Added MultiFilterSidebar import
import { useToast } from './components/ToastProvider';
import { FeatureFlagPanel } from './components/FeatureFlagPanel';
import { useFeatureFlags } from './providers/FeatureFlagProvider';
import { FeatureFlagMenu } from './components/FeatureFlagMenu';
import {
  createPaper as createPaperRecord,
  listenToUserPapers,
  removePaper as removePaperRecord,
  updatePaper as updatePaperRecord,
} from './data/papersRepository';
import { configurePdfWorker } from './utils/pdfWorker';
import { createStorageProvider } from './services/storageProvider';
import { ResearchOS } from './components/ResearchOS';
import { createCaptureInboxItem } from './data/researchRepositories';

// Configure Worker
configurePdfWorker();

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
  const { addToast } = useToast();
  const { flags } = useFeatureFlags();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [user, loading] = useAuthState(auth);
  const storageProvider = useMemo(() => createStorageProvider(), []);
  
  const [papers, setPapers] = useState([]);
  const [activeView, setActiveView] = useState('library'); 
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter State
  const [filters, setFilters] = useState({
    searchTerm: '',
    tags: [],
    yearRange: [2000, new Date().getFullYear()],
    venues: [],
    authors: [],
    status: [],
    colors: [],
    methods: [],
    organisms: [],
    rating: null,
    readingLists: []
  });

  const [showFilters, setShowFilters] = useState(false);

  // Input Mode State - added 'plan'
  const [inputMode, setInputMode] = useState('drop'); 
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Editing & Uploading State
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const fileInputRef = useRef(null);
  const planInputRef = useRef(null); // Ref for JSON plan upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); 
  const [doiInput, setDoiInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // BibTeX Import State
  const [bibtexInput, setBibtexInput] = useState("");
  const [showBibtexModal, setShowBibtexModal] = useState(false);
  const [readingStats, setReadingStats] = useState(null);

  // --- NOTIFICATION STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", onConfirm: null });

  // --- DATA & AUTH ---
  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToUserPapers(
      user.uid,
      (loaded) => {
        setPapers(loaded);
        
        if (typeof calculateReadingStats === 'function') {
          const stats = calculateReadingStats(loaded, []);
          setReadingStats(stats);
        }
      },
      () => addToast('Sync error: could not load papers', 'error')
    );
    return () => unsubscribe();
  }, [user, addToast]);

  useEffect(() => {
    if (!user) return;
    const workerReady = pdfjs.GlobalWorkerOptions.workerSrc;
    if (!workerReady) {
      addToast('PDF worker not configured. Please ensure pdf.worker.min.mjs is available.', 'error');
    }
  }, [user, addToast]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const captureUrl = params.get('capture');
    const captureTitle = params.get('title') ?? undefined;
    if (!captureUrl) return;

    createCaptureInboxItem(user.uid, {
      url: captureUrl,
      title: captureTitle,
      source: 'bookmarklet',
    })
      .then(() => addToast('Captured link added to inbox.', 'success'))
      .catch(() => addToast('Failed to save capture.', 'error'))
      .finally(() => {
        params.delete('capture');
        params.delete('title');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, document.title, newUrl);
      });
  }, [user, addToast]);

  // Calculate due papers for review
  const duePapers = useMemo(() => getDuePapers(papers), [papers]);

  // Apply filters
  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      // Search Term Filter
      const q = searchTerm.toLowerCase();
      if (q && !(
        p.title.toLowerCase().includes(q) || 
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.authors?.toLowerCase().includes(q)
      )) {
        return false;
      }

      // Reading List Filter (from Filters object)
      if (filters.readingLists.length > 0 && (!p.readingList || !filters.readingLists.includes(p.readingList))) {
        return false;
      }

      // Other filters (Tags, Year, etc.) from MultiFilterSidebar would go here
      // ...

      return true;
    });
  }, [papers, searchTerm, filters]);


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
      if (!user) return;
      try {
        const metadata = await extractMetadata(file);
        if (typeof findDuplicatePapers === 'function') {
          const duplicates = findDuplicatePapers(metadata, papers);
          if (duplicates.length > 0) addToast(`⚠️ Possible duplicate: "${duplicates[0].title}"`, "warning");
        }
        const uploadResult = await storageProvider.uploadPdf(user.uid, file);
        const url = uploadResult?.url ?? '';
        if (!uploadResult) {
          addToast('Storage disabled. Paper metadata saved without PDF.', 'warning');
        }
        let thumbnailUrl = "";
        if (url) {
          try { if (typeof generatePDFThumbnail === 'function') thumbnailUrl = await generatePDFThumbnail(url); } catch (e) {}
        }
        
        await createPaperRecord(user.uid, {
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
          doi: metadata.doi || "",
          citationCount: metadata.citationCount || 0,
          pdfHash: metadata.pdfHash || "",
          thumbnailUrl: thumbnailUrl,
          createdAt: Date.now(),
          addedDate: Date.now(),
          rating: 0,
          methods: [],
          organisms: [],
          hypotheses: [],
          structuredNotes: {}
        });
      } catch (error) {
        console.error('Failed to process file', error);
        addToast('Upload failed. Please retry.', 'error');
      }
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

  // Handler for Plan Upload (JSON)
  const handlePlanUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const items = Array.isArray(json) ? json : json.items || [];
        
        // Detect Plan Name: Use JSON 'title' or fallback to Filename
        const planName = (!Array.isArray(json) && json.title) 
          ? json.title 
          : file.name.replace(/\.[^/.]+$/, ""); // remove .json extension
        
        let createdCount = 0;
        let updatedCount = 0;

        for (const item of items) {
          if (!item.title) continue;

          const existingPaper = papers.find(p => p.title.toLowerCase().trim() === item.title.toLowerCase().trim());

          if (existingPaper) {
            // Update existing paper with date AND reading list
            await updatePaperRecord(existingPaper.id, {
              scheduledDate: item.date || item.scheduledDate,
              readingList: planName, // <--- Assign to group
              modifiedDate: Date.now()
            });
            updatedCount++;
          } else {
            // Create new paper with reading list
            await createPaperRecord(user.uid, {
              title: item.title,
              scheduledDate: item.date || item.scheduledDate,
              readingList: planName, // <--- Assign to group
              notes: item.notes || "",
              status: "to-read",
              color: COLORS[0].class,
              tags: ["Planned"],
              authors: "Unknown",
              createdAt: Date.now(),
              addedDate: Date.now(),
              rating: 0,
              methods: [],
              organisms: [],
              hypotheses: [],
              structuredNotes: {}
            });
            createdCount++;
          }
        }
        
        addToast(`Imported "${planName}": ${createdCount} new, ${updatedCount} updated`, "success");
        setInputMode('drop'); 
        
      } catch (err) {
        console.error("JSON parse error", err);
        addToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
  };

  // Handler for Auto-fill functionality (DOI, S2 URL, ArXiv)
  const handleDOIAutoFill = async () => {
    if (!doiInput.trim()) {
      addToast("Please enter a DOI, URL, or ID", "error");
      return;
    }

    setIsFetching(true);
    try {
      // Auto-detect the type of identifier
      const detected = detectIdentifier(doiInput);
      
      if (!detected) {
        addToast("Invalid format. Try a DOI, Semantic Scholar URL, or ArXiv ID.", "error");
        setIsFetching(false);
        return;
      }

      addToast(`Fetching metadata for ${detected.type}...`, "info");
      
      // Fetch metadata from Semantic Scholar
      const citationData = await fetchSemanticScholarData(detected.id, detected.type);
      
      if (citationData && !citationData.error) {
        // Extract authors
        let authorsString = "";
        if (citationData.authors && Array.isArray(citationData.authors)) {
          authorsString = citationData.authors.map(author => author.name).join(", ");
        }
        
        // Extract year
        let yearString = "";
        if (citationData.year) {
          yearString = citationData.year.toString();
        } else if (citationData.publicationDate) {
          yearString = citationData.publicationDate.split('-')[0];
        }
        
        // Create paper with fetched metadata
        await createPaperRecord(user.uid, {
          title: citationData.title || "Untitled Paper",
          authors: authorsString,
          abstract: citationData.abstract || "",
          year: yearString || new Date().getFullYear().toString(),
          venue: citationData.venue || "",
          doi: citationData.externalIds?.DOI || (detected.type === 'DOI' ? detected.id : ""),
          citationCount: citationData.citationCount || 0,
          semanticScholarId: citationData.paperId,
          tags: generateSmartTags(citationData.title + " " + (citationData.abstract || "")),
          color: COLORS[Math.floor(Math.random() * COLORS.length)].class,
          status: "to-read",
          link: citationData.externalIds?.DOI ? `https://doi.org/${citationData.externalIds.DOI}` : "",
          notes: "",
          pdfUrl: "",
          thumbnailUrl: "",
          createdAt: Date.now(),
          addedDate: Date.now(),
          rating: 0,
          methods: [],
          organisms: [],
          hypotheses: [],
          structuredNotes: {}
        });
        
        addToast("Paper added successfully!", "success");
        setDoiInput(""); // Clear the input
      } else {
        addToast("Could not find paper metadata. Please check your input.", "error");
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      addToast("Error fetching metadata. Please try again.", "error");
    }
    
    setIsFetching(false);
  };

  // NEW: Upload PDF for DOI-only papers
  const handleUploadPdf = async (paper, file) => {
    if (!user || !file) return;
    try {
      addToast('Uploading PDF...', 'info');
      const uploadResult = await storageProvider.uploadPdf(user.uid, file);
      if (!uploadResult) {
        addToast('Storage disabled. PDF metadata saved without file.', 'warning');
        return;
      }
      const { url } = uploadResult;
      await updatePaperRecord(paper.id, {
        pdfUrl: url,
        modifiedDate: Date.now(),
      });
      addToast('PDF uploaded successfully!', 'success');
    } catch (e) {
      addToast('Error uploading PDF. Try again.', 'error');
    }
  };

  const deletePaper = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: "This will permanently delete the paper and all its annotations.",
      onConfirm: async () => {
        await removePaperRecord(id);
        addToast("Paper deleted", "info");
        setConfirmDialog({ isOpen: false, message: "", onConfirm: null });
      }
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    await updatePaperRecord(id, { status: newStatus });
    
    // Initialize SRS when paper moves to "read" status
    if (newStatus === 'read') {
      const paper = papers.find(p => p.id === id);
      if (paper && !paper.srsDue) {
        const srsState = initializeSRS();
        await updatePaperRecord(id, {
          srsRepetitions: srsState.repetitions,
          srsInterval: srsState.interval,
          srsEase: srsState.ease,
          srsDue: srsState.due,
        });
        addToast("Paper added to review queue!", "success");
      }
    }
  };

  // Handler for reviewing a paper
  const handleReview = async (paper, quality) => {
    const prev = {
      repetitions: paper.srsRepetitions ?? 0,
      interval: paper.srsInterval ?? 0,
      ease: paper.srsEase ?? 2.5,
      due: paper.srsDue ?? Date.now(),
    };

    const next = sm2Review(prev, quality);

    await updatePaperRecord(paper.id, {
      srsRepetitions: next.repetitions,
      srsInterval: next.interval,
      srsEase: next.ease,
      srsDue: next.due,
      modifiedDate: Date.now()
    });

    addToast("Review recorded!", "success");
  };

  // Handler for Read button with DOI redirect
  const handleRead = (paper) => {
    // If no PDF uploaded, redirect to DOI website
    if (!paper.pdfUrl || paper.pdfUrl === "") {
      const doiUrl = paper.link && paper.link.length > 4 ? paper.link : `https://doi.org/${paper.doi}`;
      window.open(doiUrl, '_blank');
      return;
    }
    // Otherwise open PDF reader
    setSelectedPaper(paper);
    setActiveView('reader');
  };

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
    await updatePaperRecord(selectedPaper.id, {
      ...data,
      modifiedDate: Date.now()
    });
  };

  // Handler for importing related papers
  const handleImportPaper = async (newPaperData) => {
    if (!user) return;
    await createPaperRecord(user.uid, {
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
          allTags={Array.from(new Set(papers.flatMap(p => p.tags || [])))}
          onClose={() => {
            setShowMetadataModal(false);
            setEditingPaper(null);
          }}
          onSave={async (data) => {
            await updatePaperRecord(editingPaper.id, {
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

  // Review Queue view
  if (activeView === 'review') {
    return (
      <>
        <SharedUI />
        <ReviewQueue
          duePapers={duePapers}
          onReview={handleReview}
          onOpenPaper={(paper) => {
            setSelectedPaper(paper);
            setActiveView('reader');
          }}
          onBack={() => setActiveView('library')}
        />
      </>
    );
  }

  if (activeView === 'research') {
    return (
      <>
        <SharedUI />
        <ResearchOS
          userId={user.uid}
          papers={papers}
          onBack={() => setActiveView('library')}
        />
      </>
    );
  }

  // Use EnhancedReader for the reader view
  if (activeView === 'reader' && selectedPaper) {
    // FIX: ensure we pass the live paper object, not the stale 'selectedPaper'
    const livePaper = papers.find(p => p.id === selectedPaper.id) || selectedPaper;
    
    return (
      <>
        <SharedUI />
        <EnhancedReader 
          paper={livePaper} 
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
        <div className="flex items-center gap-3"><div className="bg-black text-white p-2"><BookOpen strokeWidth={3} size={32} /></div><h1 className="text-4xl font-black uppercase tracking-tighter">Paper Vault</h1><p className="text-sm font-bold text-gray-600 uppercase">by Maximilian Kothen</p></div>
        <div className="flex gap-4">
          {(flags?.copilot || flags?.semanticSearch) && (
            <div className="flex items-center gap-2 border-3 border-black bg-nb-yellow px-3 py-2 font-black uppercase text-xs shadow-nb">
              <Wand2 strokeWidth={3} size={16} /> Labs On
            </div>
          )}
          <button 
            onClick={() => setActiveView('review')} 
            className="nb-button flex gap-2 relative"
          >
            <Brain strokeWidth={3} /> Review
            {duePapers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                {duePapers.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveView('analytics')} className="nb-button flex gap-2"><BarChart3 strokeWidth={3} /> Analytics</button>
          <button onClick={() => setActiveView('research')} className="nb-button flex gap-2"><LayoutGrid strokeWidth={3} /> Research OS</button>
          <FeatureFlagMenu />
          <button onClick={logout} className="nb-button flex gap-2"><LogOut strokeWidth={3} /> Exit</button>
        </div>
      </header>
      
      <div className="bg-white border-b-4 border-black p-6 z-20">
         <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
               <button onClick={() => setInputMode('drop')} className={`text-sm font-black uppercase border-b-4 pb-1 ${inputMode === 'drop' ? 'border-nb-purple' : 'border-transparent'}`}>Smart Drop</button>
               <button onClick={() => setInputMode('manual')} className={`text-sm font-black uppercase border-b-4 pb-1 ${inputMode === 'manual' ? 'border-nb-lime' : 'border-transparent'}`}>Manual Entry</button>
               <button onClick={() => setInputMode('plan')} className={`text-sm font-black uppercase border-b-4 pb-1 ${inputMode === 'plan' ? 'border-nb-cyan' : 'border-transparent'}`}>Upload Plan</button>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={3} size={16} />
                <input className="nb-input pl-10 py-2 text-sm" placeholder="Search Library..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>

         {inputMode === 'drop' && (
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
         )}
         
         {inputMode === 'manual' && (
            <div className="bg-nb-gray p-4 border-4 border-black">
               <p className="text-xs font-bold text-gray-600 mb-2 uppercase">
                  Supports: DOI, Semantic Scholar URL, Paper ID, or ArXiv ID
               </p>
               <div className="flex gap-2">
                  <input 
                    value={doiInput} 
                    onChange={e => setDoiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDOIAutoFill(); }}
                    className="nb-input flex-1" 
                    placeholder="Paste DOI/URL here..." 
                    disabled={isFetching}
                  />
                  <button 
                    onClick={handleDOIAutoFill}
                    disabled={isFetching} 
                    className="nb-button bg-nb-purple flex gap-2"
                  >
                    {isFetching ? <Loader2 className="animate-spin"/> : <Wand2/>} 
                    {isFetching ? 'Fetching...' : 'Auto-Fill'}
                  </button>
               </div>
            </div>
         )}

         {inputMode === 'plan' && (
            <div 
              onClick={() => planInputRef.current?.click()}
              className="border-4 border-dashed border-nb-cyan bg-cyan-50 h-32 flex flex-col items-center justify-center cursor-pointer"
            >
               <div className="text-center">
                  <p className="font-black text-xl uppercase flex items-center gap-2 justify-center">
                    <Upload size={24}/> Upload Reading Plan (JSON)
                  </p>
         <p className="text-sm text-gray-500">Auto-create papers from list with due dates & groups</p>
       </div>
       <input ref={planInputRef} type="file" accept=".json" className="hidden" onChange={handlePlanUpload} />
      </div>
     )}

      <div className="mt-4">
        <FeatureFlagPanel />
      </div>
    </div>

    <div className="flex flex-1 overflow-hidden">
        {/* Kanban Board Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <VirtualKanbanBoard 
            papers={filteredPapers} 
            onStatusChange={handleStatusChange}
            onRead={handleRead}
            onEdit={(p) => { 
              setEditingPaper(p); 
              setShowMetadataModal(true); 
            }}
            onDelete={deletePaper}
            onUploadPdf={handleUploadPdf}
          />
        </div>

        {/* Right Sidebar Toggle */}
        <div className="border-l-4 border-black bg-white flex flex-col items-center py-4 w-12 hover:w-14 transition-all cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
           <div className="vertical-text font-black uppercase tracking-widest text-xs transform -rotate-90 whitespace-nowrap mt-8">Filters & Groups</div>
        </div>

        {/* Filter Sidebar (Conditional) */}
        {showFilters && (
          <MultiFilterSidebar 
            filters={filters}
            setFilters={setFilters}
            papers={papers}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
