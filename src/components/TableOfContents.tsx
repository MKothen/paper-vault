// src/components/TableOfContents.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface TOCItem {
  title: string;
  page: number;
  level: number;
}

interface Props {
  items: TOCItem[];
  currentPage: number;
  onPageClick: (page: number) => void;
}

export function TableOfContents({ items, currentPage, onPageClick }: Props) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No table of contents available
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b-2 border-black bg-white font-black uppercase sticky top-0">
        Contents
      </div>
      <div className="p-2">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onPageClick(item.page)}
            className={
              `w-full text-left p-2 rounded transition-colors hover:bg-gray-100 
              ${currentPage === item.page ? 'bg-nb-yellow font-bold' : ''}
              ${item.level === 1 ? 'text-sm font-bold' : ''}
              ${item.level === 2 ? 'text-xs ml-2' : ''}
              ${item.level > 2 ? 'text-xs ml-4 text-gray-600' : ''}`
            }
          >
            <div className="flex items-center justify-between">
              <span className="truncate flex-1">{item.title}</span>
              <span className="text-xs text-gray-500 ml-2">{item.page}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
