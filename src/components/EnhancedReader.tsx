import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import type { Paper, Highlight, PostIt } from '../types';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Highlighter, StickyNote, 
  X, Book, List, Search, Download, FileText, Wand2, Network 
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
  loadPostIts,
  getCategoryColor
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
    <div className="flex h-full bg-gray-100">
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
          {/* Mode selector */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded border-2 border-black">
            <button 
              onClick={() => setMode('read')} 
              className={`p-2 rounded transition-colors ${
                mode === 'read' ? 'bg-black text-white' : 'hover:bg-white'
              }`} 
              title="Read Mode"
            >
              <Book size={18}/>
            </button>
            <button 
              onClick={() => setMode('highlight')} 
              className={`p-2 rounded transition-colors ${
                mode === 'highlight' ? 'bg-black text-white' : 'hover:bg-white'
              }`} 
              title="Highlight Mode"
            >
              <Highlighter size={18}/>
            </button>
            <button 
              onClick={() => setMode('note')} 
              className={`p-2 rounded transition-colors ${
                mode === 'note' ? 'bg-black text-white' : 'hover:bg-white'
              }`} 
              title="Add Sticky Note"
            >
              <StickyNote size={18}/>
            </button>
            {/* Category selector for highlight mode */}
            {mode === 'highlight' && (
              <select 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value as Highlight['category'])} 
                className="text-xs border-black border ml-2 p-1"
              >
                <option value="general">General</option>
                <option value="methodology">Methodology</option>
                <option value="results">Results</option>
                <option value="related-work">Related Work</option>
                <option value="discussion">Discussion</option>
                <option value="limitation">Limitation</option>
              </select>
            )}
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
          className="flex-1 overflow-auto p-8 flex justify-center" 
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
          <div className="bg-white border-t-4 border-black p-2 flex justify-center items-center gap-4">
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
      {/* Right Sidebar -- REPAIRED: sidebar switch logic to show content */}
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
            {/* Additional sidebar logic for other tabs as needed */}
            {sidebarTab === 'toc' && <TableOfContents tocItems={tocItems} onNavigate={setPageNumber} />}
            {sidebarTab === 'notes' && (
              <div className="p-6 text-gray-500">Notes tab content placeholder</div>
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
