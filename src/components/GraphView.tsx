// src/components/GraphView.tsx
import React, { useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Paper } from '../types';

export function GraphView({ papers, onSelect }: { papers: Paper[], onSelect: (p: Paper) => void }) {
  const fgRef = useRef();

  const data = useMemo(() => {
    const nodes = papers.map(p => ({ id: p.id, name: p.title, val: 1, group: p.status }));
    const links: any[] = [];
    
    // Citation Links
    papers.forEach(p => {
        p.references?.forEach(refId => {
            if (papers.find(target => target.id === refId)) {
                links.push({ source: p.id, target: refId, type: 'citation' });
            }
        });
    });

    // Similarity Links
    papers.forEach((p1, i) => {
        papers.slice(i+1).forEach(p2 => {
            const shared = p1.tags.filter(t => p2.tags.includes(t));
            if (shared.length > 2) {
                links.push({ source: p1.id, target: p2.id, type: 'similarity' });
            }
        });
    });

    return { nodes, links };
  }, [papers]);

  return (
    <div className="flex-1 bg-gray-50 border-4 border-black relative overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeColor={node => node.group === 'read' ? '#a3e635' : '#FFD90F'}
        linkColor={link => link.type === 'citation' ? '#ef4444' : '#e5e7eb'}
        linkDirectionalArrowLength={link => link.type === 'citation' ? 3.5 : 0}
        onNodeClick={(node: any) => {
            const p = papers.find(paper => paper.id === node.id);
            if (p) onSelect(p);
        }}
      />
      <div className="absolute bottom-4 right-4 bg-white border-2 border-black p-2 text-xs">
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 block"></span> Citation</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-300 block"></span> Similarity</div>
      </div>
    </div>
  );
}