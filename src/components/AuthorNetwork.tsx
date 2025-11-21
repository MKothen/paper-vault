// src/components/AuthorNetwork.tsx
import React, { useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Paper } from '../types';

interface Props {
  papers: Paper[];
  onAuthorClick?: (authorName: string) => void;
}

export function AuthorNetwork({ papers, onAuthorClick }: Props) {
  const graphRef = useRef();

  const graphData = useMemo(() => {
    // Extract all authors and build co-authorship network
    const authorMap = new Map<string, Set<string>>();
    const papersByAuthor = new Map<string, Paper[]>();

    papers.forEach(paper => {
      if (!paper.authors) return;
      
      const authors = paper.authors
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      authors.forEach(author => {
        if (!papersByAuthor.has(author)) {
          papersByAuthor.set(author, []);
        }
        papersByAuthor.get(author)!.push(paper);

        if (!authorMap.has(author)) {
          authorMap.set(author, new Set());
        }

        // Add co-author relationships
        authors.forEach(coAuthor => {
          if (coAuthor !== author) {
            authorMap.get(author)!.add(coAuthor);
          }
        });
      });
    });

    // Build nodes (authors)
    const nodes = Array.from(authorMap.keys()).map(author => ({
      id: author,
      name: author,
      val: papersByAuthor.get(author)!.length,
      color: '#32b8c6',
    }));

    // Build links (co-authorships)
    const links: Array<{ source: string; target: string }> = [];
    const processedPairs = new Set<string>();

    authorMap.forEach((coAuthors, author) => {
      coAuthors.forEach(coAuthor => {
        const pairKey = [author, coAuthor].sort().join('|');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          links.push({ source: author, target: coAuthor });
        }
      });
    });

    return { nodes, links };
  }, [papers]);

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D) => {
    if (!node.x || !node.y) return;

    const size = Math.sqrt(node.val) * 8;
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(node.name, node.x, node.y + size + 10);
  };

  return (
    <div className="h-full w-full bg-white rounded-xl border-4 border-black overflow-hidden">
      <div className="p-3 border-b-4 border-black bg-white font-black uppercase">
        Author Network
      </div>
      {graphData.nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No author data available
        </div>
      ) : (
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeRelSize={6}
          linkWidth={1}
          linkColor={() => '#e5e7eb'}
          backgroundColor="#ffffff"
          nodeCanvasObject={nodeCanvasObject}
          onNodeClick={(node: any) => onAuthorClick?.(node.id)}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      )}
    </div>
  );
}
