// src/components/LitReviewMode.tsx
import React from 'react';
import { Paper } from '../types';

export function LitReviewMode({ papers }: { papers: Paper[] }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="text-3xl font-black uppercase mb-6">Literature Review Matrix</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-4 border-black bg-white">
          <thead>
            <tr className="bg-black text-white">
              <th className="p-3 text-left">Paper</th>
              <th className="p-3 text-left">Year</th>
              <th className="p-3 text-left">Research Question</th>
              <th className="p-3 text-left">Methods</th>
              <th className="p-3 text-left">Key Results</th>
              <th className="p-3 text-left">Limitations</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-3 border border-black font-bold">{p.title}</td>
                <td className="p-3 border border-black">{p.year}</td>
                <td className="p-3 border border-black text-sm">{p.structuredNotes?.researchQuestion || '-'}</td>
                <td className="p-3 border border-black text-sm">
                    <div className="flex flex-wrap gap-1">
                        {p.methods?.map(m => <span key={m} className="bg-nb-cyan px-1 border border-black text-xs">{m}</span>)}
                    </div>
                </td>
                <td className="p-3 border border-black text-sm">{p.structuredNotes?.results || '-'}</td>
                <td className="p-3 border border-black text-sm">{p.structuredNotes?.limitations || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}