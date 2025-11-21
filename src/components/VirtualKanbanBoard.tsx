// src/components/VirtualKanbanBoard.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import type { Paper } from '../types';
import { Eye, Trash2, Pencil, Star } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Props {
  papers: Paper[];
  onStatusChange: (id: string, status: string) => void;
  onRead: (p: Paper) => void;
  onEdit: (p: Paper) => void;
  onDelete: (id: string) => void;
}

// Memoized card to prevent unnecessary re-renders during scroll
const PaperCard = React.memo(({ paper, style, onRead, onEdit, onDelete }: any) => (
  <div style={{ ...style, paddingBottom: '8px', paddingRight: '8px' }}>
    <div className={`nb-card p-3 h-full flex flex-col ${paper.color || 'bg-white'} transition-transform hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-black text-sm uppercase leading-tight line-clamp-2">{paper.title}</h4>
        {paper.rating && (
          <div className="flex items-center text-xs font-bold shrink-0 ml-1">
            <Star size={10} fill="black" /> {paper.rating}
          </div>
        )}
      </div>
      
      <p className="text-xs truncate font-mono mb-2 text-gray-600">{paper.authors}</p>
      
      <div className="flex gap-1 flex-wrap mb-auto">
        {paper.tags?.slice(0, 2).map((t: string) => (
          <span key={t} className="text-[10px] border border-black px-1 bg-white/80">{t}</span>
        ))}
      </div>
      
      <div className="flex justify-end gap-1 border-t-2 border-black/10 pt-2 mt-2">
        <button onClick={() => onRead(paper)} className="hover:bg-black hover:text-white p-1 rounded transition-colors" title="Read">
          <Eye size={14} />
        </button>
        <button onClick={() => onEdit(paper)} className="hover:bg-black hover:text-white p-1 rounded transition-colors" title="Edit">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(paper.id)} className="hover:bg-red-500 hover:text-white p-1 rounded transition-colors" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
), areEqual);

export function VirtualKanbanBoard({ papers, onStatusChange, onRead, onEdit, onDelete }: Props) {
  const columns = useMemo(() => ({
    'to-read': papers.filter(p => p.status === 'to-read'),
    'reading': papers.filter(p => p.status === 'reading'),
    'read': papers.filter(p => p.status === 'read')
  }), [papers]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    onStatusChange(result.draggableId, result.destination.droppableId);
  };

  // Custom row renderer for react-window that incorporates Drag and Drop
  const Row = ({ data, index, style }: any) => {
    const paper = data[index];
    return (
      <Draggable draggableId={paper.id} index={index} key={paper.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...style,
              ...provided.draggableProps.style, // Preserve DnD transform
              left: Number(style.left) + 8, // Add padding safely
              top: Number(style.top) + 8,
              width: `calc(${style.width} - 16px)`
            }}
          >
            <PaperCard 
                paper={paper} 
                style={{ height: '100%' }} 
                onRead={onRead} 
                onEdit={onEdit} 
                onDelete={onDelete} 
            />
          </div>
        )}
      </Draggable>
    );
  };

  // Safety check to ensure List is defined before rendering
  if (!List) {
    return <div className="p-8 text-center font-bold text-red-500">Error: Virtual List component failed to load. Please restart the dev server.</div>;
  }

  return (
    <div className="flex-1 h-full overflow-hidden bg-nb-gray p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-4">
          {Object.entries(columns).map(([id, items]) => (
            <div key={id} className="flex-1 flex flex-col border-4 border-black bg-gray-100 h-full">
              <div className="p-3 border-b-4 border-black bg-white font-black uppercase flex justify-between items-center shrink-0">
                <span>{id.replace('-', ' ')}</span>
                <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs">{items.length}</span>
              </div>
              
              <div className="flex-1 relative">
                <Droppable 
                    droppableId={id} 
                    mode="virtual"
                    renderClone={(provided, snapshot, rubric) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                        >
                            <div className="nb-card p-3 bg-white border-black border-2 rotate-3">
                                <h4 className="font-black text-sm">{items[rubric.source.index].title}</h4>
                            </div>
                        </div>
                    )}
                >
                  {(provided) => (
                    <List
                      height={600} 
                      itemCount={items.length}
                      itemSize={160}
                      width="100%"
                      itemData={items}
                      outerRef={provided.innerRef}
                      className="scrollbar-hide"
                    >
                      {Row}
                    </List>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}