// src/components/TagCloud.tsx
import React, { useMemo } from 'react';
import type { Paper } from '../types';

interface Props {
  papers: Paper[];
  onTagClick: (tag: string) => void;
}

export function TagCloud({ papers, onTagClick }: Props) {
  const tags = useMemo(() => {
    const counts: Record<string, number> = {};
    let max = 0;
    
    papers.forEach(p => {
      p.tags?.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
        max = Math.max(max, counts[t]);
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) // Top 50 tags
      .map(([text, value]) => ({
        text,
        value,
        size: Math.max(0.8, (value / max) * 3) // Scale between 0.8rem and 3rem
      }));
  }, [papers]);

  const colors = ['text-nb-purple', 'text-nb-lime', 'text-nb-cyan', 'text-nb-pink', 'text-nb-orange'];

  return (
    <div className="bg-white border-4 border-black p-6 shadow-nb">
      <h3 className="font-black uppercase text-xl mb-4 border-b-2 border-black pb-2">Topic Cloud</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center items-center">
        {tags.map((tag, i) => (
          <button
            key={tag.text}
            onClick={() => onTagClick(tag.text)}
            className={`hover:underline transition-all font-bold ${colors[i % colors.length]}`}
            style={{ fontSize: `${tag.size}rem` }}
          >
            {tag.text}
            <sup className="text-xs text-gray-400 ml-0.5">{tag.value}</sup>
          </button>
        ))}
      </div>
    </div>
  );
}