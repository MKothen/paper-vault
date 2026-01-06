import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { FeatureFlags } from '../domain/featureFlag';
import { FeatureFlagSchema, defaultFeatureFlags } from '../domain/featureFlag';

const STORAGE_KEY = 'papervault:featureFlags';

type FeatureFlagContextValue = {
  flags: FeatureFlags;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  reset: () => void;
};

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

const loadFeatureFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') return defaultFeatureFlags;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFeatureFlags;
    const parsed = FeatureFlagSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultFeatureFlags;
  } catch (error) {
    console.warn('Could not load feature flags from storage', error);
    return defaultFeatureFlags;
  }
};

export const FeatureFlagProvider = ({
  children,
  initialFlags,
}: PropsWithChildren<{ initialFlags?: FeatureFlags }>) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => initialFlags ?? loadFeatureFlags());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  }, [flags]);

  const setFlag = useCallback((flag: keyof FeatureFlags, value: boolean) => {
    setFlags((prev) => ({ ...prev, [flag]: value }));
  }, []);

  const toggleFlag = useCallback((flag: keyof FeatureFlags) => {
    setFlags((prev) => ({ ...prev, [flag]: !prev[flag] }));
  }, []);

  const reset = useCallback(() => setFlags(defaultFeatureFlags), []);

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      setFlag,
      toggleFlag,
      reset,
    }),
    [flags, reset, setFlag, toggleFlag]
  );

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlags must be used inside FeatureFlagProvider');
  return ctx;
};

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[flag];
};

export const FeatureFlagMenu = () => {
  const { flags, toggleFlag, reset } = useFeatureFlags();
  const [open, setOpen] = useState(false);

  const entries: Array<{ key: keyof FeatureFlags; label: string; description: string }> = [
    { key: 'projects', label: 'Projects', description: 'Enable project-scoped workspaces' },
    { key: 'copilot', label: 'Research Copilot', description: 'Experimental retrieval-first assistant' },
    { key: 'semanticSearch', label: 'Semantic search', description: 'Use embeddings when available' },
    { key: 'systematicReview', label: 'Systematic review', description: 'Screening & extraction views' },
  ];

  return (
    <div className="relative">
      <button
        className="nb-button flex gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Toggle feature flags"
      >
        Labs
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border-4 border-black shadow-nb p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black uppercase">Feature flags</h3>
            <button className="text-xs font-bold underline" onClick={reset}>
              Reset
            </button>
          </div>
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.key} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id={`flag-${entry.key}`}
                  className="mt-1"
                  checked={Boolean(flags[entry.key])}
                  onChange={() => toggleFlag(entry.key)}
                />
                <div>
                  <label htmlFor={`flag-${entry.key}`} className="font-bold uppercase text-sm">
                    {entry.label}
                  </label>
                  <p className="text-xs text-gray-600">{entry.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
