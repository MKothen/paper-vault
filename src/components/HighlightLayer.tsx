// src/components/HighlightLayer.tsx
import React from 'react';
import type { Highlight } from '../types';

interface Props {
  highlights: Highlight[];
  currentPage: number;
  scale: number;
  onHighlightClick?: (highlight: Highlight) => void;
  onHighlightDelete?: (highlight: Highlight) => void;
}

export function HighlightLayer({
  highlights,
  currentPage,
  scale,
  onHighlightClick,
  onHighlightDelete
}: Props) {
  const pageHighlights = highlights.filter(h => h.page === currentPage);

  return (
    <>
      {pageHighlights.map(highlight => (
        <React.Fragment key={highlight.id}>
          {highlight.rects.map((rect, rectIndex) => (
            <div
              key={`${highlight.id}-${rectIndex}`}
              className="absolute mix-blend-multiply cursor-pointer hover:opacity-60 transition-opacity"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: highlight.color,
                opacity: 0.4,
                pointerEvents: 'auto'
              }}
              onClick={() => onHighlightClick?.(highlight)}
              title={`${highlight.category}: ${highlight.text.substring(0, 50)}...`}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

export default HighlightLayer;