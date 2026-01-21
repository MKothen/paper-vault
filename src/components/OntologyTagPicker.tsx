import React, { useMemo, useState } from 'react';
import type { OntologyNode } from '../domain';

type OntologyTagPickerProps = {
  nodes: OntologyNode[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  label?: string;
};

export function OntologyTagPicker({ nodes, selectedIds, onChange, label }: OntologyTagPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(q) ||
        node.synonyms.some((synonym) => synonym.toLowerCase().includes(q)),
    );
  }, [nodes, query]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="nb-card p-4 bg-white">
      {label && <div className="text-sm font-black uppercase mb-2">{label}</div>}
      <input
        className="nb-input w-full mb-3"
        placeholder="Search ontology..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-48 overflow-y-auto space-y-2">
        {filtered.map((node) => (
          <label key={node.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(node.id)}
              onChange={() => toggle(node.id)}
            />
            <span className="font-semibold">{node.label}</span>
            <span className="text-xs text-gray-500">({node.type})</span>
          </label>
        ))}
        {filtered.length === 0 && <div className="text-xs text-gray-500">No ontology nodes match.</div>}
      </div>
    </div>
  );
}
