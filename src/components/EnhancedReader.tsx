import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import type { Paper, Highlight, PostIt } from '../types';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Highlighter, StickyNote, 
  X, Book, List, Search, Wand2, Network, MousePointer2, FileText
} from 'lucide-react';
import { TableOfContents } from './TableOfContents';
import { FullTextSearch } from './FullTextSearch';
import { AnnotationsSidebar } from './AnnotationsSidebar';
import { HighlightLayer } from './HighlightLayer';
import { PostItLayer } from './PostItLayer';
import { AISummary } from './AISummary';
import { RelatedWorkFinder } from './RelatedWorkFinder';
import { extractPDFText, extractPDFOutline } from '../utils/pdfUtils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  createHighlightFromSelection,
  createPostIt,
  saveHighlights,
  savePostIts,
  loadHighlights,
  loadPostIts
} from '../utils/highlightUtils';

interface Props {
  paper: Paper;
  onClose: () => void;
  onUpdate: (data: Partial<Paper>) => void;
  papers: Paper[];
  onImportPaper?: (paperData: any) => void;
}

type Mode = 'read' | 'highlight' | 'note';
type SidebarTab = 'toc' | 'notes' | 'annotations' | 'ai' | 'related';

export function EnhancedReader({ paper, onClose, onUpdate, papers, onImportPaper }: Props) {
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [uploading, setUploading] = useState(false);

  // Annotation state
  const [highlights, setHighlights] = useState<Highlight[]>(() => loadHighlights(paper.id));
  const [postits, setPostits] = useState<PostIt[]>(() => loadPostIts(paper.id));
  
  // PDF data
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [pdfText, setPdfText] = useState<Map<number, string>>(new Map());
  
  // UI state
  const [mode, setMode] = useState<Mode>('read');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('annotations');
  const [activeCategory, setActiveCategory] = useState<Highlight['category']>('general');
  const [showSidebar, setShowSidebar] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF data on mount
  useEffect(() => {
    if (paper.pdfUrl) {
      loadPDFData();
    }
  }, [paper.pdfUrl]);

  const loadPDFData = async () => {
    try {
      // Load TOC
      const outline = await extractPDFOutline(paper.pdfUrl!);
      setTocItems(outline);

      // Load full text for search
      const text = await extractPDFText(paper.pdfUrl!);
      const pageTextMap = new Map<number, string>();
      const pages = text.split('\f'); // Form feed character separates pages
      pages.forEach((pageText, idx) => {
        pageTextMap.set(idx + 1, pageText);
      });
      setPdfText(pageTextMap);
    } catch (error) {
      console.error('Error loading PDF data:', error);
    }
  };

  // Persist annotations
  useEffect(() => {
    saveHighlights(paper.id, highlights);
    savePostIts(paper.id, postits);
  }, [highlights, postits, paper.id]);

  // Text selection handler for highlighting
  const handleMouseUp = () => {
    if (mode !== 'highlight') return;
    
    const selection = window.getSelection();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!selection || !containerRect) return;
    
    const newHighlight = createHighlightFromSelection(
      selection,
      containerRect,
      scale,
      pageNumber,
      activeCategory
    );
    
    if (newHighlight) {
      setHighlights([...highlights, newHighlight]);
      selection.removeAllRanges();
    }
  };

  // Click handler for adding post-its
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode !== 'note') return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPostIt = createPostIt(x, y, pageNumber, scale);
    setPostits([...postits, newPostIt]);
    setMode('read');
  };

  // Full-text search handler
  const handleFullTextSearch = async (query: string) => {
    const results: Array<{ page: number; text: string; matchIndex: number }> = [];
    const lowerQuery = query.toLowerCase();

    pdfText.forEach((text, page) => {
      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(lowerQuery);
      
      while (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);
        const context = text.substring(start, end);
        
        results.push({ page, text: context, matchIndex: index });
        index = lowerText.indexOf(lowerQuery, index + 1);
      }
    });

    return results;
  };

  // Annotation handlers
  const handleHighlightClick = (highlight: Highlight) => {
    setPageNumber(highlight.page);
  };

  const handleHighlightDelete = (highlight: Highlight) => {
    setHighlights(highlights.filter(h => h.id !== highlight.id));
  };

  const handleHighlightUpdate = (highlight: Highlight) => {
    setHighlights(highlights.map(h => h.id === highlight.id ? highlight : h));
  };

  const handlePostItClick = (postit: PostIt) => {
    setPageNumber(postit.page);
  };

  const handlePostItDelete = (postit: PostIt) => {
    setPostits(postits.filter(p => p.id !== postit.id));
  };

  const handlePostItUpdate = (postit: PostIt) => {
    setPostits(postits.map(p => p.id === postit.id ? postit : p));
  };

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(3, s + 0.1));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.1));

  // Page navigation
  const goToPreviousPage = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber(p => Math.min(numPages, p + 1));

  return (
    <div className="flex h-full bg-gray-100 relative">
      
      {/* --- NEW: Floating Mode Switcher --- */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 rounded-full flex items-center gap-2 transition-transform hover:-translate-y-1">
          <button
            onClick={() => setMode('read')}
            className={`p-3 rounded-full border-2 transition-all ${
              mode === 'read' 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-700 border-transparent hover:bg-gray-100'
            }`}
            title="Read Mode"
          >
            <Book size={20} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => setMode('highlight')}
            className={`p-3 rounded-full border-2 transition-all ${
              mode === 'highlight' 
                ? 'bg-nb-yellow text-black border-black' 
                : 'bg-white text-gray-700 border-transparent hover:bg-gray-100'
            }`}
            title="Highlight Mode"
          >
            <Highlighter size={20} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => setMode('note')}
            className={`p-3 rounded-full border-2 transition-all ${
              mode === 'note' 
                ? 'bg-nb-pink text-black border-black' 
                : 'bg-white text-gray-700 border-transparent hover:bg-gray-100'
            }`}
            title="Add Sticky Note"
          >
            <StickyNote size={20} strokeWidth={2.5} />
          </button>

          {/* Inline Category Selector when Highlighting */}
          {mode === 'highlight' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300 flex items-center border-l-2 border-gray-200 pl-2 ml-1">
               <select 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value as Highlight['category'])} 
                className="text-xs font-bold border-2 border-black p-2 rounded cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-nb-yellow"
              >
                <option value="general">🟡 General</option>
                <option value="methodology">🔵 Methods</option>
                <option value="results">🟢 Results</option>
                <option value="related-work">🟣 Related</option>
                <option value="discussion">🟠 Discuss</option>
                <option value="limitation">🔴 Limits</option>
              </select>
            </div>
          )}
        </div>
      </div>
      {/* ---------------------------------- */}

      {/* Main Reader */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b-4 border-black p-2 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="nb-button">
              <ChevronLeft size={16} className="inline" /> Back
            </button>
            <span className="font-black uppercase truncate max-w-xs text-sm">
              {paper.title}
            </span>
          </div>
          
          {/* Zoom and sidebar controls */}
          <div className="flex items-center gap-2">
            <button onClick={zoomOut} className="nb-button p-1" disabled={scale <= 0.5}>
              <ZoomOut size={16}/>
            </button>
            <span className="font-mono font-bold text-sm min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="nb-button p-1" disabled={scale >= 3}>
              <ZoomIn size={16}/>
            </button>
            <div className="w-px h-6 bg-black mx-2"></div>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="nb-button p-2"
              title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
            >
              <List size={16} />
            </button>
          </div>
        </div>
        {/* Full-Text Search Bar */}
        <div className="border-b-2 border-black">
          <FullTextSearch 
            onSearch={handleFullTextSearch}
            onResultClick={(result) => setPageNumber(result.page)}
          />
        </div>
        {/* PDF Canvas / Upload PDF UI */}
        <div 
          className="flex-1 overflow-auto p-8 flex justify-center pb-24" // Added padding-bottom to avoid overlap with floating tool
          onClick={handleCanvasClick}
          style={{ cursor: mode === 'note' ? 'crosshair' : 'default' }}
        >
          {/* Upload PDF for DOI-only papers */}
          {!paper.pdfUrl && (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center border-4 border-dashed border-nb-purple bg-purple-50 p-10 rounded-xl shadow-lg">
              <p className="text-xl font-bold text-nb-purple mb-2">No PDF uploaded</p>
              <p className="mb-4 text-gray-700">
                This paper was added via DOI only. To enable highlights, annotation, and full reading, upload the PDF below.
              </p>
              <label className="nb-button bg-nb-purple text-white cursor-pointer mb-2">
                {uploading ? "Uploading..." : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const fileRef = ref(storage, `papers/${paper.userId}/${Date.now()}_${file.name}`);
                      await uploadBytes(fileRef, file);
                      const url = await getDownloadURL(fileRef);
                      onUpdate({ pdfUrl: url });
                    } catch (error) {
                      alert('Error uploading PDF.');
                      setUploading(false);
                      return;
                    }
                    setUploading(false);
                  }}
                />
              </label>
              <p className="text-xs text-nb-purple/80">Accepted: PDF only. Max 100MB.</p>
            </div>
          )}
          {/* Only show PDF/document UI when there's a PDF */}
          {paper.pdfUrl && (
            <div 
              className="relative pdf-page-container shadow-nb-lg border-4 border-black" 
              ref={containerRef} 
              onMouseUp={handleMouseUp}
              style={{ userSelect: mode === 'highlight' ? 'text' : 'none' }}
            >
              <Document 
                file={paper.pdfUrl} 
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onItemClick={({ pageNumber }) => setPageNumber(pageNumber)} // handle internal PDF links
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale} 
                  renderTextLayer={true} 
                  renderAnnotationLayer={true} 
                />
              </Document>
              <HighlightLayer
                highlights={highlights}
                currentPage={pageNumber}
                scale={scale}
                onHighlightClick={handleHighlightClick}
                onHighlightDelete={handleHighlightDelete}
              />
              <PostItLayer
                postits={postits}
                currentPage={pageNumber}
                scale={scale}
                onPostItUpdate={handlePostItUpdate}
                onPostItDelete={handlePostItDelete}
                editable={true}
              />
            </div>
          )}
        </div>
        {/* Footer Pagination (unchanged) */}
        {paper.pdfUrl && (
          <div className="bg-white border-t-4 border-black p-2 flex justify-center items-center gap-4 z-40">
            <button 
              onClick={goToPreviousPage} 
              disabled={pageNumber <= 1} 
              className="nb-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} className="inline" /> Prev
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= numPages) {
                    setPageNumber(page);
                  }
                }}
                className="w-16 text-center font-bold border-2 border-black p-1"
              />
              <span className="font-bold">/ {numPages}</span>
            </div>
            <button 
              onClick={goToNextPage} 
              disabled={pageNumber >= numPages} 
              className="nb-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} className="inline" />
            </button>
          </div>
        )}
      </div>
      {/* Right Sidebar */}
      {showSidebar && (
        <div className="w-96 bg-white border-l-4 border-black flex flex-col">
          <div className="flex border-b-4 border-black">
            <button 
              onClick={() => setSidebarTab('toc')} 
              className={`flex-1 p-2 font-bold uppercase text-xs transition-colors ${
                sidebarTab === 'toc' ? 'bg-nb-yellow' : 'hover:bg-gray-100'
              }`}
            >
              <List size={14} className="inline mr-1" />
              TOC
            </button>
            <button 
              onClick={() => setSidebarTab('notes')} 
              className={`flex-1 p-2 font-bold uppercase text-xs transition-colors ${
                sidebarTab === 'notes' ? 'bg-nb-yellow' : 'hover:bg-gray-100'
              }`}
            >
              <FileText size={14} className="inline mr-1" />
              Notes
            </button>
            <button 
              onClick={() => setSidebarTab('annotations')} 
              className={`flex-1 p-2 font-bold uppercase text-xs transition-colors relative ${
                sidebarTab === 'annotations' ? 'bg-nb-yellow' : 'hover:bg-gray-100'
              }`}
            >
              <Highlighter size={14} className="inline mr-1" />
              Marks
              {(highlights.length > 0 || postits.length > 0) && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {highlights.length + postits.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setSidebarTab('ai')} 
              className={`flex-1 p-2 font-bold uppercase text-xs transition-colors ${
                sidebarTab === 'ai' ? 'bg-nb-purple' : 'hover:bg-gray-100'
              }`}
            >
              <Wand2 size={14} className="inline mr-1" />
              AI
            </button>
            <button 
              onClick={() => setSidebarTab('related')} 
              className={`flex-1 p-2 font-bold uppercase text-xs transition-colors ${
                sidebarTab === 'related' ? 'bg-nb-lime' : 'hover:bg-gray-100'
              }`}
            >
              <Network size={14} className="inline mr-1" />
              Related
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'annotations' && (
              <AnnotationsSidebar
                highlights={highlights}
                postits={postits}
                onHighlightClick={handleHighlightClick}
                onHighlightDelete={handleHighlightDelete}
                onHighlightUpdate={handleHighlightUpdate}
                onPostItClick={handlePostItClick}
                onPostItDelete={handlePostItDelete}
                paperTitle={paper.title}
              />
            )}
            {sidebarTab === 'toc' && <TableOfContents items={tocItems} currentPage={pageNumber} onPageClick={setPageNumber} />}
            {sidebarTab === 'notes' && (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <h3 className="font-black uppercase mb-2">Structured Notes</h3>
                {['Research Question', 'Methods', 'Results', 'Conclusions', 'Limitations', 'Future Work'].map(section => (
                  <div key={section}>
                    <label className="text-xs font-bold uppercase block mb-1">{section}</label>
                    <textarea 
                      className="nb-input text-sm w-full border-2 border-black p-2 min-h-[100px] resize-y"
                      placeholder={`Enter ${section}...`}
                      value={(paper.structuredNotes as any)?.[section.toLowerCase().replace(' ', '')] || ''}
                      onChange={e => {
                          const key = section.toLowerCase().replace(' ', '');
                          onUpdate({ 
                            structuredNotes: { 
                              ...(paper.structuredNotes || {}), 
                              [key]: e.target.value 
                            } 
                          });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {sidebarTab === 'ai' && (
              <AISummary paper={paper} />
            )}
            {sidebarTab === 'related' && (
              <RelatedWorkFinder paper={paper} papers={papers} onImportPaper={onImportPaper} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedReader;