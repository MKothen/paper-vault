// src/components/AnnotationsSidebar.tsx
import React, { useState } from 'react';
import type { Highlight, PostIt } from '../types';
import { 
  Trash2, Edit2, Save, X, Download, Filter, Search,
  ChevronDown, ChevronRight, FileText, StickyNote 
} from 'lucide-react';
import { 
  getCategoryBgClass, 
  countHighlightsByCategory,
  exportHighlightsToMarkdown,
  searchHighlights 
} from '../utils/highlightUtils';

interface Props {
  highlights: Highlight[];
  postits: PostIt[];
  onHighlightClick: (highlight: Highlight) => void;
  onHighlightDelete: (highlight: Highlight) => void;
  onHighlightUpdate: (highlight: Highlight) => void;
  onPostItClick: (postit: PostIt) => void;
  onPostItDelete: (postit: PostIt) => void;
  paperTitle: string;
}

export function AnnotationsSidebar({
  highlights,
  postits,
  onHighlightClick,
  onHighlightDelete,
  onHighlightUpdate,
  onPostItClick,
  onPostItDelete,
  paperTitle
}: Props) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'notes'>('highlights');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general']));

  const categoryCounts = countHighlightsByCategory(highlights);
  const categories = Object.keys(categoryCounts).sort();

  const filteredHighlights = searchHighlights(
    filterCategory 
      ? highlights.filter(h => h.category === filterCategory)
      : highlights,
    searchQuery
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleExport = () => {
    const markdown = exportHighlightsToMarkdown(highlights, paperTitle);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paperTitle.replace(/\s+/g, '-')}-highlights.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEditingNote = (highlight: Highlight) => {
    setEditingId(highlight.id);
    setEditNote(highlight.note || '');
  };

  const saveNote = (highlight: Highlight) => {
    onHighlightUpdate({ ...highlight, note: editNote });
    setEditingId(null);
    setEditNote('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNote('');
  };

  // Group highlights by category
  const groupedHighlights = filteredHighlights.reduce((acc, h) => {
    const cat = h.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(h);
    return acc;
  }, {} as Record<string, Highlight[]>);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b-4 border-black p-4">
        <h2 className="font-black uppercase text-lg mb-3">Annotations</h2>
        
        {/* Tab switcher */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`flex-1 py-2 px-3 font-bold uppercase text-xs border-2 border-black ${
              activeTab === 'highlights' ? 'bg-nb-yellow' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <FileText size={14} className="inline mr-1" />
            Highlights ({highlights.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 px-3 font-bold uppercase text-xs border-2 border-black ${
              activeTab === 'notes' ? 'bg-nb-yellow' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <StickyNote size={14} className="inline mr-1" />
            Notes ({postits.length})
          </button>
        </div>

        {/* Search and export */}
        {activeTab === 'highlights' && (
          <>
            <div className="relative mb-2">
              <Search size={16} className="absolute left-2 top-2 text-gray-400" />
              <input
                type="text"
                placeholder="Search highlights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-nb-yellow"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="flex-1 text-xs border-2 border-black p-1"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} ({categoryCounts[cat]})
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleExport}
                className="nb-button p-2 text-xs"
                title="Export to Markdown"
              >
                <Download size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'highlights' ? (
          filteredHighlights.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              {searchQuery || filterCategory ? 'No highlights match your filters' : 'No highlights yet'}
            </p>
          ) : (
            Object.entries(groupedHighlights)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, items]) => {
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="border-2 border-black">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full p-2 flex items-center justify-between font-bold uppercase text-xs ${getCategoryBgClass(category)} hover:opacity-80`}
                    >
                      <span>
                        {isExpanded ? <ChevronDown size={14} className="inline mr-1" /> : <ChevronRight size={14} className="inline mr-1" />}
                        {category} ({items.length})
                      </span>
                    </button>
                    
                    {/* Category items */}
                    {isExpanded && (
                      <div className="p-2 space-y-2">
                        {items
                          .sort((a, b) => a.page - b.page)
                          .map(highlight => {
                            const isEditing = editingId === highlight.id;
                            
                            return (
                              <div
                                key={highlight.id}
                                className="border-2 border-black p-2 bg-white text-xs relative group hover:shadow-md transition-shadow"
                              >
                                {/* Page number and actions */}
                                <div className="flex justify-between items-center mb-1">
                                  <button
                                    onClick={() => onHighlightClick(highlight)}
                                    className="text-gray-600 hover:text-black font-mono font-bold"
                                  >
                                    Page {highlight.page}
                                  </button>
                                  
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isEditing && (
                                      <button
                                        onClick={() => startEditingNote(highlight)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Add/edit note"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onHighlightDelete(highlight)}
                                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Highlighted text */}
                                <p className="text-gray-700 mb-2 leading-relaxed">
                                  "{highlight.text}"
                                </p>
                                
                                {/* Note section */}
                                {isEditing ? (
                                  <div className="mt-2">
                                    <textarea
                                      value={editNote}
                                      onChange={(e) => setEditNote(e.target.value)}
                                      placeholder="Add a note..."
                                      className="w-full p-2 border-2 border-black text-xs resize-none"
                                      rows={3}
                                      autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => saveNote(highlight)}
                                        className="flex-1 nb-button p-1 text-xs"
                                      >
                                        <Save size={12} className="inline mr-1" />
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="flex-1 nb-button p-1 text-xs bg-gray-200"
                                      >
                                        <X size={12} className="inline mr-1" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : highlight.note && (
                                  <div className="mt-2 p-2 bg-gray-50 border-l-2 border-gray-300 italic text-gray-600">
                                    {highlight.note}
                                  </div>
                                )}
                                
                                {/* Timestamp */}
                                {highlight.createdAt && (
                                  <div className="mt-2 text-[10px] text-gray-400">
                                    {new Date(highlight.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })
          )
        ) : (
          // Post-its tab
          postits.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No sticky notes yet</p>
          ) : (
            postits
              .sort((a, b) => a.page - b.page)
              .map(postit => (
                <div
                  key={postit.id}
                  className={`border-2 border-black p-3 ${postit.color.class} relative group hover:shadow-md transition-shadow`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => onPostItClick(postit)}
                      className="text-xs font-mono font-bold hover:underline"
                    >
                      Page {postit.page}
                    </button>
                    
                    <button
                      onClick={() => onPostItDelete(postit)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-600 rounded transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  {/* Note text */}
                  <p className="text-sm font-mono whitespace-pre-wrap">
                    {postit.text || <em className="text-gray-500">Empty note</em>}
                  </p>
                  
                  {/* Timestamp */}
                  {postit.createdAt && (
                    <div className="mt-2 text-[10px] text-gray-500">
                      {new Date(postit.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
          )
        )}
      </div>

      {/* Stats footer */}
      <div className="border-t-4 border-black p-3 bg-gray-50">
        <div className="text-xs font-mono">
          <div className="font-bold mb-1">Statistics</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-600">Highlights:</span>
              <span className="font-bold ml-1">{highlights.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Notes:</span>
              <span className="font-bold ml-1">{postits.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Categories:</span>
              <span className="font-bold ml-1">{categories.length}</span>
            </div>
            <div>
              <span className="text-gray-600">With Notes:</span>
              <span className="font-bold ml-1">{highlights.filter(h => h.note).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnotationsSidebar;