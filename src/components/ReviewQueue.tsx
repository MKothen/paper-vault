// src/components/ReviewQueue.tsx
import React, { useState } from 'react';
import type { Paper } from '../types';
import { ChevronLeft, BookOpen, Calendar, RefreshCw, Check, X } from 'lucide-react';
import { formatInterval, daysUntilDue } from '../utils/srs';

interface Props {
  duePapers: Paper[];
  onReview: (paper: Paper, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  onOpenPaper: (paper: Paper) => void;
  onBack: () => void;
}

export function ReviewQueue({ duePapers, onReview, onOpenPaper, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (duePapers.length === 0) {
    return (
      <div className="min-h-screen bg-nb-gray flex flex-col">
        <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
          <button onClick={onBack} className="nb-button flex gap-2">
            <ChevronLeft strokeWidth={3} /> Back to Library
          </button>
          <h1 className="text-3xl font-black uppercase">Review Queue</h1>
          <div className="w-32"></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border-4 border-black shadow-nb p-12 max-w-md text-center">
            <Check className="w-20 h-20 mx-auto mb-4 text-green-600" strokeWidth={3} />
            <h2 className="text-4xl font-black uppercase mb-2">All Done!</h2>
            <p className="text-lg font-bold mb-6">No papers due for review today.</p>
            <p className="text-sm text-gray-600">Come back tomorrow for more reviews!</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPaper = duePapers[currentIndex];
  const progress = ((currentIndex + 1) / duePapers.length) * 100;

  const handleAnswer = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    onReview(currentPaper, quality);
    
    // Move to next paper or finish
    if (currentIndex < duePapers.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // All reviews complete
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-nb-gray flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center">
        <button onClick={onBack} className="nb-button flex gap-2">
          <ChevronLeft strokeWidth={3} /> Back
        </button>
        <h1 className="text-2xl font-black uppercase">Review Queue</h1>
        <div className="text-sm font-bold">
          {currentIndex + 1} / {duePapers.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b-2 border-black">
        <div className="h-3 bg-nb-yellow" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Review Card */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white border-4 border-black shadow-nb max-w-3xl w-full">
          {/* Paper Info */}
          <div className="p-8 border-b-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-black uppercase mb-2">
                  {currentPaper.title}
                </h2>
                <p className="text-sm font-bold text-gray-600 mb-2">
                  {currentPaper.authors} • {currentPaper.year}
                  {currentPaper.venue && ` • ${currentPaper.venue}`}
                </p>
                {currentPaper.tags && currentPaper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentPaper.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs font-bold px-2 py-1 bg-gray-100 border-2 border-black"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onOpenPaper(currentPaper)}
                className="nb-button flex gap-2 ml-4"
                title="Open in Reader"
              >
                <BookOpen size={16} /> Read
              </button>
            </div>

            {currentPaper.abstract && (
              <div className="mt-4 p-4 bg-gray-50 border-2 border-black">
                <p className="text-sm font-bold text-gray-700">
                  {currentPaper.abstract}
                </p>
              </div>
            )}
          </div>

          {/* Structured Notes (Answer) */}
          {showAnswer && currentPaper.structuredNotes && (
            <div className="p-8 border-b-4 border-black bg-nb-yellow">
              <h3 className="text-lg font-black uppercase mb-4">Your Notes</h3>
              <div className="space-y-4">
                {Object.entries(currentPaper.structuredNotes).map(
                  ([key, value]) =>
                    value && (
                      <div key={key}>
                        <h4 className="text-xs font-black uppercase text-gray-600 mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <p className="text-sm font-bold">{value as string}</p>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Review Buttons */}
          <div className="p-8">
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="nb-button w-full text-lg"
              >
                Show Answer
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center font-bold text-sm uppercase text-gray-600 mb-4">
                  How well did you remember this paper?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAnswer(1)}
                    className="nb-button bg-red-500 text-white border-black hover:bg-red-600"
                  >
                    <X size={16} className="inline mr-2" />
                    Again
                    <span className="text-xs block mt-1">Review in 1 day</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(2)}
                    className="nb-button bg-orange-500 text-white border-black hover:bg-orange-600"
                  >
                    Hard
                    <span className="text-xs block mt-1">Review in 1 day</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(4)}
                    className="nb-button bg-green-500 text-white border-black hover:bg-green-600"
                  >
                    <Check size={16} className="inline mr-2" />
                    Good
                    <span className="text-xs block mt-1">
                      {formatInterval(
                        currentPaper.srsInterval
                          ? Math.round(currentPaper.srsInterval * (currentPaper.srsEase || 2.5))
                          : 6
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => handleAnswer(5)}
                    className="nb-button bg-blue-500 text-white border-black hover:bg-blue-600"
                  >
                    Easy
                    <span className="text-xs block mt-1">
                      {formatInterval(
                        currentPaper.srsInterval
                          ? Math.round(currentPaper.srsInterval * (currentPaper.srsEase || 2.5) * 1.3)
                          : 10
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-white border-t-4 border-black p-4 flex justify-center items-center gap-8 text-sm font-bold">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} strokeWidth={3} />
          <span>Repetitions: {currentPaper.srsRepetitions || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} strokeWidth={3} />
          <span>
            Interval: {formatInterval(currentPaper.srsInterval || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ReviewQueue;