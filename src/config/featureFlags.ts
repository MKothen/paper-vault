import { z } from 'zod'

export const featureFlagSchema = z.object({
  copilot: z.boolean().default(false),
  semanticSearch: z.boolean().default(false),
  offlineCache: z.boolean().default(true),
})

export type FeatureFlags = z.infer<typeof featureFlagSchema>

export const defaultFeatureFlags = featureFlagSchema.parse({})
export const FEATURE_FLAGS_STORAGE_KEY = 'pv.featureFlags'

export function parseFeatureFlags(raw: unknown): FeatureFlags {
  const parsed = featureFlagSchema.safeParse(raw)
  return parsed.success ? parsed.data : defaultFeatureFlags
}

export function parseFeatureFlagsFromEnv(envValue?: string) {
  if (!envValue) return {}
  try {
    const parsed = featureFlagSchema.partial().safeParse(JSON.parse(envValue))
    return parsed.success ? parsed.data : {}
  } catch (error) {
    console.warn('Unable to parse feature flags from env', error)
    return {}
  }
}

export function mergeFeatureFlags(
  ...sources: Array<Partial<FeatureFlags>>
): FeatureFlags {
  return sources.reduce<FeatureFlags>(
    (acc, next) => ({ ...acc, ...next }),
    defaultFeatureFlags,
  )
}

export function loadFeatureFlags(storage?: Storage) {
  if (storage) {
    try {
      const value = storage.getItem(FEATURE_FLAGS_STORAGE_KEY)
      return value ? parseFeatureFlags(JSON.parse(value)) : defaultFeatureFlags
    } catch (error) {
      console.warn('Failed to read feature flags from storage', error)
      return defaultFeatureFlags
    }
  }

  if (typeof window === 'undefined') return defaultFeatureFlags

  const raw = window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
  try {
    return raw ? parseFeatureFlags(JSON.parse(raw)) : defaultFeatureFlags
  } catch (error) {
    console.warn('Failed to parse feature flags from localStorage', error)
    return defaultFeatureFlags
  }
}

export function persistFeatureFlags(flags: FeatureFlags, storage?: Storage) {
  const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
  if (!target) return
  target.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags))
}

export function getInitialFeatureFlags(storage?: Storage) {
  const envValue =
    typeof import.meta !== 'undefined' && 'env' in import.meta
      ? (import.meta as any).env?.VITE_FEATURE_FLAGS
      : undefined

  const envFlags = parseFeatureFlagsFromEnv(envValue)
  const stored = loadFeatureFlags(storage)
  return mergeFeatureFlags(defaultFeatureFlags, envFlags, stored)
}
