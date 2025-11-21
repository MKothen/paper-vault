// src/components/Reader.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { Paper, Highlight, PostIt } from '../types';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Highlighter, StickyNote, 
  X, Save, List, Book, Type, Trash2, Search 
} from 'lucide-react';
import { TableOfContents } from './TableOfContents';
import { FullTextSearch } from './FullTextSearch';
import { extractPDFText, extractPDFOutline } from '../utils/pdfUtils';

interface Props {
  paper: Paper;
  onClose: () => void;
  onUpdate: (data: Partial<Paper>) => void;
  papers: Paper[];
}

export function Reader({ paper, onClose, onUpdate, papers }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [highlights, setHighlights] = useState<Highlight[]>(() => JSON.parse(localStorage.getItem(`highlights-${paper.id}`) || '[]'));
  const [postits, setPostits] = useState<PostIt[]>(() => JSON.parse(localStorage.getItem(`postits-${paper.id}`) || '[]'));
  const [tocItems, setTocItems] = useState<any[]>([]);
  const [pdfText, setPdfText] = useState<Map<number, string>>(new Map());
  
  const [mode, setMode] = useState<'read' | 'highlight' | 'note'>('read');
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'notes' | 'annotations'>('notes');
  const [activeCategory, setActiveCategory] = useState('general');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF TOC and text on mount
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

      // Load full text for search (lazy load per page for performance)
      const text = await extractPDFText(paper.pdfUrl!);
      const pageTextMap = new Map<number, string>();
      // Simple split by page (in production, use proper page extraction)
      const pages = text.split('\f'); // Form feed character often separates pages
      pages.forEach((pageText, idx) => {
        pageTextMap.set(idx + 1, pageText);
      });
      setPdfText(pageTextMap);
    } catch (error) {
      console.error('Error loading PDF data:', error);
    }
  };

  const handleFullTextSearch = async (query: string) => {
    const results: Array<{ page: number; text: string; matchIndex: number }> = [];
    const lowerQuery = query.toLowerCase();

    pdfText.forEach((text, page) => {
      const lowerText = text.toLowerCase();
      let index = lowerText.indexOf(lowerQuery);
      
      while (index !== -1) {
        // Extract context around match (50 chars before and after)
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 50);
        const context = text.substring(start, end);
        
        results.push({
          page,
          text: context,
          matchIndex: index
        });
        
        index = lowerText.indexOf(lowerQuery, index + 1);
      }
    });

    return results;
  };

  // Persist annotations
  useEffect(() => {
    localStorage.setItem(`highlights-${paper.id}`, JSON.stringify(highlights));
    localStorage.setItem(`postits-${paper.id}`, JSON.stringify(postits));
  }, [highlights, postits, paper.id]);

  // Text Selection Handler for Highlighting
  const handleMouseUp = () => {
    if (mode !== 'highlight') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;

    const normalizedRects = rects.map(r => ({
      x: (r.left - containerRect.left) / scale,
      y: (r.top - containerRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale
    }));

    const newHighlight: Highlight = {
      id: Date.now(),
      page: pageNumber,
      rects: normalizedRects,
      color: getCategoryColor(activeCategory),
      text: selection.toString(),
      category: activeCategory as any
    };

    setHighlights([...highlights, newHighlight]);
    selection.removeAllRanges();
  };

  const addPostIt = (x: number, y: number) => {
    if (mode !== 'note') return;
    const newPostIt: PostIt = {
      id: Date.now(),
      page: pageNumber,
      x: x / scale,
      y: y / scale,
      text: 'New note...',
      color: 'bg-yellow-200'
    };
    setPostits([...postits, newPostIt]);
    setMode('read');
  };

  const getCategoryColor = (cat: string) => {
    const colors: any = { methodology: '#22d3ee', results: '#a3e635', 'related-work': '#c084fc', general: '#FFD90F' };
    return colors[cat] || '#FFD90F';
  };

  return (
    <div className="flex h-full bg-gray-100">
      {/* Main Reader */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b-4 border-black p-2 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="nb-button"><ChevronLeft size={16} /> Back</button>
            <span className="font-black uppercase truncate max-w-xs">{paper.title}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded border-2 border-black">
            <button onClick={() => setMode('read')} className={`p-2 rounded ${mode === 'read' ? 'bg-black text-white' : 'hover:bg-white'}`} title="Read"><Book size={18}/></button>
            <button onClick={() => setMode('highlight')} className={`p-2 rounded ${mode === 'highlight' ? 'bg-black text-white' : 'hover:bg-white'}`} title="Highlight"><Highlighter size={18}/></button>
            <button onClick={() => setMode('note')} className={`p-2 rounded ${mode === 'note' ? 'bg-black text-white' : 'hover:bg-white'}`} title="Add Note"><StickyNote size={18}/></button>
            {mode === 'highlight' && (
              <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)} className="text-xs border-black border ml-2">
                <option value="general">General</option>
                <option value="methodology">Methods</option>
                <option value="results">Results</option>
                <option value="related-work">Related</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="nb-button p-1"><ZoomOut size={16}/></button>
            <span className="font-mono font-bold">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="nb-button p-1"><ZoomIn size={16}/></button>
          </div>
        </div>

        {/* Full-Text Search Bar */}
        <div className="border-b-2 border-black">
          <FullTextSearch 
            onSearch={handleFullTextSearch}
            onResultClick={(result) => setPageNumber(result.page)}
          />
        </div>

        {/* PDF Canvas */}
        <div className="flex-1 overflow-auto p-8 flex justify-center" onClick={(e) => {
            if (mode === 'note') {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) addPostIt(e.clientX - rect.left, e.clientY - rect.top);
            }
        }}>
          <div className="relative pdf-page-container shadow-nb-lg border-4 border-black" ref={containerRef} onMouseUp={handleMouseUp}>
            <Document file={paper.pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
            </Document>
            
            {/* Overlays */}
            {highlights.filter(h => h.page === pageNumber).map(h => (
              h.rects.map((r, i) => (
                <div key={`${h.id}-${i}`} className="absolute mix-blend-multiply pointer-events-none"
                  style={{ left: r.x * scale, top: r.y * scale, width: r.width * scale, height: r.height * scale, backgroundColor: h.color, opacity: 0.4 }} 
                />
              ))
            ))}
            
            {postits.filter(p => p.page === pageNumber).map(p => (
              <div key={p.id} className={`absolute p-2 w-48 border-2 border-black shadow-nb text-sm font-mono bg-yellow-200`}
                style={{ left: p.x * scale, top: p.y * scale }}>
                <textarea 
                  defaultValue={p.text} 
                  onBlur={(e) => {
                    const newP = postits.map(pi => pi.id === p.id ? { ...pi, text: e.target.value } : pi);
                    setPostits(newP);
                  }}
                  className="w-full bg-transparent resize-none outline-none h-24"
                />
                <button onClick={() => setPostits(postits.filter(pi => pi.id !== p.id))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="bg-white border-t-4 border-black p-2 flex justify-center gap-4">
          <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="nb-button">Prev</button>
          <span className="font-bold flex items-center">Page {pageNumber} / {numPages}</span>
          <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages} className="nb-button">Next</button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l-4 border-black flex flex-col">
        <div className="flex border-b-4 border-black">
          <button onClick={() => setSidebarTab('toc')} className={`flex-1 p-2 font-bold uppercase text-xs ${sidebarTab === 'toc' ? 'bg-nb-yellow' : ''}`}>TOC</button>
          <button onClick={() => setSidebarTab('notes')} className={`flex-1 p-2 font-bold uppercase text-xs ${sidebarTab === 'notes' ? 'bg-nb-yellow' : ''}`}>Notes</button>
          <button onClick={() => setSidebarTab('annotations')} className={`flex-1 p-2 font-bold uppercase text-xs ${sidebarTab === 'annotations' ? 'bg-nb-yellow' : ''}`}>Highlights</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarTab === 'toc' && (
            <TableOfContents 
              items={tocItems}
              currentPage={pageNumber}
              onPageClick={setPageNumber}
            />
          )}

          {sidebarTab === 'notes' && (
            <div className="p-4 space-y-4">
              <h3 className="font-black uppercase mb-2">Structured Notes</h3>
              {['Research Question', 'Methods', 'Results', 'Conclusions', 'Limitations'].map(section => (
                <div key={section}>
                  <label className="text-xs font-bold uppercase block mb-1">{section}</label>
                  <textarea 
                    className="nb-input text-sm w-full"
                    rows={3}
                    placeholder={`Enter ${section}...`}
                    value={(paper.structuredNotes as any)?.[section.toLowerCase().replace(' ', '')] || ''}
                    onChange={e => {
                        const key = section.toLowerCase().replace(' ', '');
                        onUpdate({ structuredNotes: { ...paper.structuredNotes, [key]: e.target.value } });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'annotations' && (
            <div className="p-4 space-y-2">
              {highlights.map(h => (
                <div key={h.id} className="border-2 border-black p-2 text-xs relative group">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold uppercase" style={{ color: h.color }}>{h.category}</span>
                    <span className="text-gray-500">P.{h.page}</span>
                  </div>
                  <p>"{h.text}"</p>
                  <button onClick={() => setHighlights(highlights.filter(hi => hi.id !== h.id))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}