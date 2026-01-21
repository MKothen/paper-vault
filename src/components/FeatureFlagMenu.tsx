import React, { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { useFeatureFlags } from '../providers/FeatureFlagProvider';
import type { FeatureFlags } from '../config/featureFlags';

export function FeatureFlagMenu() {
  const { flags, toggleFlag } = useFeatureFlags();
  const [isOpen, setIsOpen] = useState(false);

  const flagLabels: Record<keyof FeatureFlags, string> = {
    copilot: 'Enable Copilot',
    semanticSearch: 'Semantic Search',
    offlineCache: 'Offline Caching',
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="nb-button flex gap-2"
        title="Experimental Features"
      >
        <Settings strokeWidth={3} /> Features
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-white border-4 border-black shadow-nb p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Experimental
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {(Object.keys(flags) as Array<keyof FeatureFlags>).map((key) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-200">
              <span className="font-bold">{flagLabels[key] || key}</span>
              <button
                onClick={() => toggleFlag(key)}
                className={`
                  w-12 h-6 rounded-full border-2 border-black relative transition-colors
                  ${flags[key] ? 'bg-nb-lime' : 'bg-gray-300'}
                `}
              >
                <div
                  className={`
                    absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-transform
                    ${flags[key] ? 'left-[calc(100%-1.25rem)]' : 'left-0.5'}
                  `}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-500 font-medium text-center uppercase">
          Changes are auto-saved
        </div>
      </div>
    </div>
  );
}
