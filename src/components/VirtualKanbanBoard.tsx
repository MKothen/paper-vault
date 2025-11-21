// src/components/VirtualKanbanBoard.tsx
import React, { useMemo, useState } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import type { Paper } from '../types';
import { Eye, Trash2, Pencil, Star } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  papers: Paper[];
  onStatusChange: (id: string, status: string) => void;
  onRead: (p: Paper) => void;
  onEdit: (p: Paper) => void;
  onDelete: (id: string) => void;
}

// Memoized card to prevent unnecessary re-renders during scroll
const PaperCard = React.memo(({ paper, style, onRead, onEdit, onDelete, isDragging = false }: any) => (
  <div style={{ ...style, paddingBottom: '8px', paddingRight: '8px' }}>
    <div className={`nb-card p-3 h-full flex flex-col ${paper.color || 'bg-white'} transition-transform ${isDragging ? 'rotate-3 opacity-50' : 'hover:scale-[1.02]'}`}>
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

// Sortable wrapper for each paper card
const SortablePaperCard = ({ paper, style, onRead, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paper.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...style,
  };

  return (
    <div ref={setNodeRef} style={sortableStyle} {...attributes} {...listeners}>
      <PaperCard 
        paper={paper} 
        style={{ height: '100%' }} 
        onRead={onRead} 
        onEdit={onEdit} 
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
};

// Droppable column component
const DroppableColumn = ({ id, items, onRead, onEdit, onDelete }: any) => {
  return (
    <div className="flex-1 flex flex-col border-4 border-black bg-gray-100 h-full">
      <div className="p-3 border-b-4 border-black bg-white font-black uppercase flex justify-between items-center shrink-0">
        <span>{id.replace('-', ' ')}</span>
        <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs">{items.length}</span>
      </div>
      
      <div className="flex-1 relative overflow-auto">
        <SortableContext items={items.map((p: Paper) => p.id)} strategy={verticalListSortingStrategy}>
          <List
            height={600} 
            itemCount={items.length}
            itemSize={160}
            width="100%"
            itemData={items}
            className="scrollbar-hide"
          >
            {({ data, index, style }) => {
              const paper = data[index];
              return (
                <SortablePaperCard
                  key={paper.id}
                  paper={paper}
                  style={{
                    ...style,
                    left: Number(style.left) + 8,
                    top: Number(style.top) + 8,
                    width: `calc(${style.width} - 16px)`
                  }}
                  onRead={onRead}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            }}
          </List>
        </SortableContext>
      </div>
    </div>
  );
};

export function VirtualKanbanBoard({ papers, onStatusChange, onRead, onEdit, onDelete }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const columns = useMemo(() => ({
    'to-read': papers.filter(p => p.status === 'to-read'),
    'reading': papers.filter(p => p.status === 'reading'),
    'read': papers.filter(p => p.status === 'read')
  }), [papers]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // Check if dropped over a column (droppable container)
    const overId = over.id as string;
    const validColumns = ['to-read', 'reading', 'read'];
    
    if (validColumns.includes(overId)) {
      // Dropped directly on column
      onStatusChange(active.id as string, overId);
    } else {
      // Dropped on another paper - find which column that paper is in
      const targetPaper = papers.find(p => p.id === overId);
      if (targetPaper && targetPaper.status !== papers.find(p => p.id === active.id)?.status) {
        onStatusChange(active.id as string, targetPaper.status);
      }
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get the paper being dragged for the overlay
  const activePaper = activeId ? papers.find(p => p.id === activeId) : null;

  // Safety check to ensure List is defined before rendering
  if (!List) {
    return <div className="p-8 text-center font-bold text-red-500">Error: Virtual List component failed to load. Please restart the dev server.</div>;
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex-1 h-full overflow-hidden bg-nb-gray p-4">
        <div className="flex h-full gap-4">
          {Object.entries(columns).map(([id, items]) => (
            <DroppableColumn
              key={id}
              id={id}
              items={items}
              onRead={onRead}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activePaper ? (
          <div className="nb-card p-3 bg-white border-black border-4 rotate-3 shadow-nb-lg w-64">
            <h4 className="font-black text-sm">{activePaper.title}</h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
