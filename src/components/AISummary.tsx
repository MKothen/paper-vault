// src/components/AISummary.tsx
import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import type { Paper } from '../types';

interface Props {
  paper: Paper;
}

export function AISummary({ paper }: Props) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    
    // Simple extractive summary using key sentences
    // In production, replace with actual AI API (OpenAI, Claude, etc.)
    try {
      const text = paper.abstract || '';
      
      if (!text) {
        setSummary('No abstract available for summarization.');
        setLoading(false);
        return;
      }

      // Simple extractive summary: take first 3 sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      const keySentences = sentences.slice(0, 3).join(' ');
      
      // Add some basic formatting
      const formattedSummary = `**Key Points:**\n\n${keySentences}\n\n**Topics:** ${paper.tags?.join(', ') || 'N/A'}\n**Year:** ${paper.year || 'N/A'}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSummary(formattedSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    }
    
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-4 border-black p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
        <h3 className="font-black uppercase flex items-center gap-2">
          <Sparkles size={18} className="text-purple-600" />
          AI Summary
        </h3>
        {summary && !loading && (
          <button
            onClick={copyToClipboard}
            className="nb-button text-xs px-2 py-1 bg-white flex items-center gap-1"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {!summary && !loading && (
        <button
          onClick={generateSummary}
          className="nb-button w-full py-3 bg-purple-200 hover:bg-purple-300 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Generate AI Summary
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-sm">Generating summary...</p>
        </div>
      )}

      {summary && !loading && (
        <div className="prose prose-sm max-w-none">
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {summary.split('\n').map((line, i) => (
              <p key={i} className={line.startsWith('**') ? 'font-bold mt-3' : ''}>
                {line.replace(/\*\*/g, '')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
