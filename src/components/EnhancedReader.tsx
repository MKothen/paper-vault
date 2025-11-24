// src/components/EnhancedReader.tsx
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

  // Annotation handlers -- UNCHANGED
  // ... (omitted here)

  // Zoom controls -- UNCHANGED
  // ... (omitted here)

  // Main render
  return (
    <div className="flex h-full bg-gray-100">
      {/* Main Reader */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar ... unchanged ... */}

        {/* Full-Text Search Bar ... unchanged ... */}

        {/* PDF Canvas / Upload prompt */}
        <div 
          className="flex-1 overflow-auto p-8 flex justify-center" 
          onClick={handleCanvasClick}
          style={{ cursor: mode === 'note' ? 'crosshair' : 'default' }}
        >
          {/* If no PDF, show upload */}
          {!paper.pdfUrl && (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center border-4 border-dashed border-nb-purple bg-purple-50 p-10 rounded-xl shadow-lg">
              <p className="text-xl font-bold text-nb-purple mb-2">No PDF uploaded</p>
              <p className="mb-4 text-gray-700">This paper was added via DOI only. To enable highlights, annotation, and full reading, upload the PDF below.</p>
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

        {/* Footer Pagination ... unchanged ... */}
      </div>

      {/* Right Sidebar ... unchanged ... */}
    </div>
  );
}

export default EnhancedReader;
