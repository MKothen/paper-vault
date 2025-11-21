// src/components/AuthorNetwork.tsx
import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Paper } from '../types';

export function AuthorNetwork({ papers }: { papers: Paper[] }) {
  const data = useMemo(() => {
    const authorMap = new Map<string, { id: string; papers: number; collaborators: Set<string> }>();
    const links: any[] = [];

    // 1. Build Author Nodes
    papers.forEach(p => {
      if (!p.authors) return;
      // Simple split by comma, assumes clean data (in production, parse carefully)
      const authors = p.authors.split(',').map(a => a.trim()).filter(a => a.length > 0);
      
      authors.forEach((author) => {
        if (!authorMap.has(author)) {
          authorMap.set(author, { id: author, papers: 0, collaborators: new Set() });
        }
        const node = authorMap.get(author)!;
        node.papers += 1;
        
        // Add collaborators from same paper
        authors.forEach(collab => {
          if (collab !== author) node.collaborators.add(collab);
        });
      });
    });

    // 2. Build Links (Collaborations)
    const nodes = Array.from(authorMap.values()).map(a => ({
      id: a.id,
      val: a.papers * 2, // Size by paper count
      color: a.papers > 2 ? '#FFD90F' : '#a3e635'
    }));

    // Create unique link set
    const processedLinks = new Set<string>();
    
    authorMap.forEach((node, authorId) => {
      node.collaborators.forEach(collabId => {
        const linkKey = [authorId, collabId].sort().join('-');
        if (!processedLinks.has(linkKey)) {
          links.push({ source: authorId, target: collabId, value: 1 });
          processedLinks.add(linkKey);
        }
      });
    });

    return { nodes, links };
  }, [papers]);

  return (
    <div className="h-full w-full bg-nb-gray border-4 border-black relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white p-2 border-2 border-black shadow-nb">
        <h3 className="font-black uppercase text-sm">Author Collaboration</h3>
        <p className="text-xs text-gray-500">{data.nodes.length} Authors, {data.links.length} Connections</p>
      </div>
      
      <ForceGraph2D
        graphData={data}
        nodeLabel="id"
        nodeColor="color"
        nodeRelSize={6}
        linkColor={() => '#9ca3af'}
        linkWidth={1}
        backgroundColor="#f3f4f6"
        d3VelocityDecay={0.6} // Higher friction for stability
      />
    </div>
  );
}