// src/components/AISummary.tsx
import React, { useState } from 'react';
import type { Paper } from '../types';
import { Sparkles, Copy, Check } from 'lucide-react';

// NOTE: This requires a backend function or API key for OpenAI/Anthropic/Gemini.
// This is a frontend implementation that would call such a service.

export function AISummary({ paper }: { paper: Paper }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    
    // SIMULATED API CALL
    setTimeout(() => {
      setSummary(
        `Here is a generated summary for "${paper.title}":\n\n` +
        `This paper investigates the effects of [variable] on [subject]. ` +
        `Using ${paper.methods?.[0] || 'experimental methods'}, the authors demonstrate that... \n\n` +
        `**Key Findings:**\n` +
        `- Significant correlation between X and Y\n` +
        `- Novel mechanism proposed for Z\n\n` +
        `**Conclusion:**\n` +
        `The study suggests that further research into ${paper.tags?.[0] || 'this topic'} is warranted.`
      );
      setLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-4 border-black p-4 shadow-nb">
      <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
        <h3 className="font-black uppercase flex items-center gap-2">
          <Sparkles size={18} className="text-nb-purple" /> 
          AI Summary
        </h3>
        {summary && (
          <button onClick={copyToClipboard} className="hover:text-nb-cyan">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {!summary && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-4">Generate a concise summary of this paper using AI.</p>
          <button 
            onClick={generateSummary}
            className="nb-button bg-nb-purple text-white w-full"
          >
            Generate Summary
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 animate-pulse">
          <Sparkles className="animate-spin text-nb-purple" size={24} />
          <span className="text-xs font-bold uppercase">Reading paper...</span>
        </div>
      )}

      {summary && (
        <div className="bg-gray-50 p-4 border-2 border-black font-serif text-sm leading-relaxed whitespace-pre-wrap">
          {summary}
        </div>
      )}
    </div>
  );
}