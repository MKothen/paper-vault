// src/components/TagCloud.tsx
import React, { useMemo } from 'react';
import type { Paper } from '../types';

interface Props {
  papers: Paper[];
  onTagClick?: (tag: string) => void;
}

export function TagCloud({ papers, onTagClick }: Props) {
  const tagData = useMemo(() => {
    const tagCounts = new Map<string, number>();

    papers.forEach(paper => {
      paper.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    const maxCount = sorted[0]?.[1] || 1;
    const minCount = sorted[sorted.length - 1]?.[1] || 1;

    return sorted.map(([tag, count]) => {
      const normalized = (count - minCount) / (maxCount - minCount);
      const fontSize = 12 + normalized * 24; // 12px to 36px
      const opacity = 0.5 + normalized * 0.5; // 0.5 to 1.0

      return { tag, count, fontSize, opacity };
    });
  }, [papers]);

  if (tagData.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-6 rounded-xl">
        <h3 className="font-black uppercase mb-4 border-b-2 border-black pb-2">Tag Cloud</h3>
        <p className="text-gray-500 text-center">No tags available</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 rounded-xl">
      <h3 className="font-black uppercase mb-4 border-b-2 border-black pb-2">Tag Cloud</h3>
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {tagData.map(({ tag, count, fontSize, opacity }) => (
          <button
            key={tag}
            onClick={() => onTagClick?.(tag)}
            className="font-bold hover:underline transition-all hover:scale-110"
            style={{
              fontSize: `${fontSize}px`,
              opacity,
              color: '#1e293b',
            }}
            title={`${count} papers`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
