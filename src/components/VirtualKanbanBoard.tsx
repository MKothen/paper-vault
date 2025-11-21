import React, { useMemo } from "react";
import type { Paper } from "../types";
import { Eye, Trash2, Pencil, Star } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Props {
  papers: Paper[];
  onStatusChange: (id: string, status: string) => void;
  onRead: (p: Paper) => void;
  onEdit: (p: Paper) => void;
  onDelete: (id: string) => void;
}

const PaperCard = ({ paper, onRead, onEdit, onDelete }: any) => (
  <div className={`nb-card p-3 h-full flex flex-col ${paper.color || "bg-white"} transition-transform hover:scale-[1.02]`}>
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
);

const KanbanColumn = ({ id, title, items, onRead, onEdit, onDelete }: any) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-1 flex flex-col border-4 border-black bg-gray-100 h-full"
        >
          <div className="p-3 border-b-4 border-black bg-white font-black uppercase flex justify-between items-center shrink-0">
            <span>{title}</span>
            <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs">{items.length}</span>
          </div>
          <div className="flex-1 relative overflow-y-auto p-2 gap-2 flex flex-col">
            {items.map((paper: Paper, idx: number) => (
              <Draggable key={paper.id} draggableId={paper.id} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-3"
                  >
                    <PaperCard
                      paper={paper}
                      onRead={onRead}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
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
};

export function VirtualKanbanBoard({ papers, onStatusChange, onRead, onEdit, onDelete }: Props) {
  const columns = useMemo(
    () => [
      { id: "to-read", title: "To Read", items: papers.filter((p) => p.status === "to-read") },
      { id: "reading", title: "Reading", items: papers.filter((p) => p.status === "reading") },
      { id: "read", title: "Read", items: papers.filter((p) => p.status === "read") },
    ],
    [papers]
  );

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    onStatusChange(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 h-full overflow-hidden bg-nb-gray p-4 flex gap-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            items={col.items}
            onRead={onRead}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
