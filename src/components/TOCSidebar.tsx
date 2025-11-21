// src/components/TOCSidebar.tsx
import React, { useEffect, useState } from 'react';
import { extractPDFOutline } from '../utils/pdfUtils';
import { List } from 'lucide-react';

interface Props {
  pdfUrl: string;
  onNavigate: (page: number) => void;
}

export function TOCSidebar({ pdfUrl, onNavigate }: Props) {
  const [outline, setOutline] = useState<Array<{ title: string; page: number; level: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOutline = async () => {
      const data = await extractPDFOutline(pdfUrl);
      setOutline(data);
      setLoading(false);
    };
    loadOutline();
  }, [pdfUrl]);

  if (loading) return <div className="p-4 text-xs">Loading outline...</div>;
  if (outline.length === 0) return <div className="p-4 text-xs italic text-gray-500">No Table of Contents found.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b-4 border-black bg-nb-yellow font-black flex items-center gap-2 uppercase text-sm">
        <List size={16} /> Contents
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {outline.map((item, i) => (
          <button
            key={i}
            onClick={() => onNavigate(item.page)}
            className="w-full text-left py-1.5 px-2 hover:bg-gray-100 text-sm truncate border-b border-gray-100"
            style={{ paddingLeft: `${item.level * 12 + 8}px` }}
            title={item.title}
          >
            <span className="mr-2 text-gray-400 text-xs font-mono">{item.page}</span>
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}