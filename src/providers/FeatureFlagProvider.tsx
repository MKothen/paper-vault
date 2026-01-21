import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getInitialFeatureFlags,
  persistFeatureFlags,
} from '../config/featureFlags'
import type { FeatureFlags } from '../config/featureFlags'

type FeatureFlagContextValue = {
  flags: FeatureFlags
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void
  toggleFlag: (flag: keyof FeatureFlags) => void
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null)

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(() => getInitialFeatureFlags())

  useEffect(() => {
    persistFeatureFlags(flags)
  }, [flags])

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      setFlag: (flag, value) => setFlags((prev) => ({ ...prev, [flag]: value })),
      toggleFlag: (flag) => setFlags((prev) => ({ ...prev, [flag]: !prev[flag] })),
    }),
    [flags],
  )

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext)
  if (!context) throw new Error('useFeatureFlags must be used within FeatureFlagProvider')
  return context
}
