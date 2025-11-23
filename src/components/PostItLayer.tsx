// src/components/PostItLayer.tsx
import React, { useState } from 'react';
import { PostIt } from '../types';
import { X, GripVertical } from 'lucide-react';
import { getPostItColors } from '../utils/highlightUtils';

interface Props {
  postits: PostIt[];
  currentPage: number;
  scale: number;
  onPostItUpdate: (postit: PostIt) => void;
  onPostItDelete: (postit: PostIt) => void;
  editable?: boolean;
}

export function PostItLayer({
  postits,
  currentPage,
  scale,
  onPostItUpdate,
  onPostItDelete,
  editable = true
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const pagePostIts = postits.filter(p => p.page === currentPage);
  const colors = getPostItColors();

  const handleTextChange = (postit: PostIt, newText: string) => {
    onPostItUpdate({ ...postit, text: newText });
  };

  const handleColorChange = (postit: PostIt, colorName: string) => {
    const newColor = colors.find(c => c.name === colorName);
    if (newColor) {
      onPostItUpdate({ ...postit, color: newColor });
    }
  };

  return (
    <>
      {pagePostIts.map(postit => {
        const isEditing = editingId === postit.id;
        
        return (
          <div
            key={postit.id}
            className={`absolute p-2 w-48 border-2 border-black shadow-lg font-mono text-sm ${postit.color.class} group`}
            style={{
              left: postit.x * scale,
              top: postit.y * scale,
              zIndex: isEditing ? 50 : 10
            }}
          >
            {/* Drag handle */}
            <div className="absolute -top-2 -left-2 bg-black text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical size={12} />
            </div>

            {/* Color picker */}
            {editable && (
              <div className="absolute -top-2 left-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => handleColorChange(postit, color.name)}
                    className={`w-4 h-4 rounded-full border-2 ${
                      postit.color.name === color.name ? 'border-black' : 'border-gray-400'
                    } ${color.class}`}
                    title={color.name}
                  />
                ))}
              </div>
            )}

            {/* Delete button */}
            {editable && (
              <button
                onClick={() => onPostItDelete(postit)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete note"
              >
                <X size={12} />
              </button>
            )}

            {/* Text area */}
            <textarea
              value={postit.text}
              onChange={(e) => handleTextChange(postit, e.target.value)}
              onFocus={() => setEditingId(postit.id)}
              onBlur={() => setEditingId(null)}
              placeholder="Type your note here..."
              className="w-full bg-transparent resize-none outline-none border-none focus:ring-0"
              style={{ minHeight: '80px' }}
              disabled={!editable}
            />

            {/* Timestamp */}
            {postit.createdAt && (
              <div className="text-[10px] text-gray-600 mt-1 opacity-60">
                {new Date(postit.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default PostItLayer;