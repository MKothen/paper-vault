// src/components/MetadataModal.tsx
import React, { useState } from 'react';
import { Paper } from '../types';
import { X, Star, Wand2, Loader2 } from 'lucide-react';
import { fetchCitationData } from '../utils/semanticScholar';
import { COMMON_METHODS, COMMON_ORGANISMS } from '../utils/helpers';

interface Props {
  paper: Paper;
  onClose: () => void;
  onSave: (data: Partial<Paper>) => void;
  allTags: string[];
}

export function MetadataModal({ paper, onClose, onSave, allTags }: Props) {
  const [form, setForm] = useState<Partial<Paper>>(paper);
  const [loading, setLoading] = useState(false);

  const fetchMeta = async () => {
    if (!form.doi) return;
    setLoading(true);
    const data = await fetchCitationData(form.doi);
    if (data) {
        setForm({ ...form, citationCount: data.citationCount });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl border-4 border-black shadow-nb p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
          <h2 className="text-2xl font-black uppercase">Edit Metadata</h2>
          <button onClick={onClose}><X size={24}/></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold block mb-1">Title</label>
              <input className="nb-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="font-bold block mb-1">Authors</label>
              <input className="nb-input" value={form.authors} onChange={e => setForm({...form, authors: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
                <label className="font-bold block mb-1">Year</label>
                <input className="nb-input" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            </div>
            <div>
                <label className="font-bold block mb-1">Venue</label>
                <input className="nb-input" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
            </div>
            <div>
                <label className="font-bold block mb-1">DOI</label>
                <div className="flex gap-1">
                    <input className="nb-input" value={form.doi || ''} onChange={e => setForm({...form, doi: e.target.value})} />
                    <button onClick={fetchMeta} className="nb-button p-1">{loading ? <Loader2 className="animate-spin"/> : <Wand2 size={16}/>}</button>
                </div>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Rating</label>
            <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setForm({...form, rating: s})}>
                        <Star fill={s <= (form.rating || 0) ? "gold" : "none"} />
                    </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="font-bold block mb-1">Methods Used</label>
                <div className="flex flex-wrap gap-1 border-2 border-black p-2 bg-gray-50">
                    {COMMON_METHODS.map(m => (
                        <label key={m} className="flex items-center gap-1 text-xs cursor-pointer bg-white border border-black px-1">
                            <input type="checkbox" checked={form.methods?.includes(m)} onChange={e => {
                                const current = form.methods || [];
                                setForm({...form, methods: e.target.checked ? [...current, m] : current.filter(i => i !== m)});
                            }} />
                            {m}
                        </label>
                    ))}
                </div>
             </div>
             <div>
                <label className="font-bold block mb-1">Organisms</label>
                <div className="flex flex-wrap gap-1 border-2 border-black p-2 bg-gray-50">
                    {COMMON_ORGANISMS.map(o => (
                        <label key={o} className="flex items-center gap-1 text-xs cursor-pointer bg-white border border-black px-1">
                            <input type="checkbox" checked={form.organisms?.includes(o)} onChange={e => {
                                const current = form.organisms || [];
                                setForm({...form, organisms: e.target.checked ? [...current, o] : current.filter(i => i !== o)});
                            }} />
                            {o}
                        </label>
                    ))}
                </div>
             </div>
          </div>

          <button onClick={() => onSave(form)} className="nb-button w-full bg-nb-lime mt-4">Save Changes</button>
        </div>
      </div>
    </div>
  );
}