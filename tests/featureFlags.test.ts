/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import {
  defaultFeatureFlags,
  getInitialFeatureFlags,
  mergeFeatureFlags,
  parseFeatureFlagsFromEnv,
  persistFeatureFlags,
  loadFeatureFlags,
} from '../src/config/featureFlags'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

describe('feature flags', () => {
  it('parses env flags safely', () => {
    const flags = parseFeatureFlagsFromEnv(
      JSON.stringify({ copilot: true, semanticSearch: true }),
    )
    expect(flags.copilot).toBe(true)
    expect(flags.semanticSearch).toBe(true)
  })

  it('ignores malformed env flags', () => {
    const flags = parseFeatureFlagsFromEnv('not-json')
    expect(flags).toEqual({})
  })

  it('merges defaults with overrides', () => {
    const merged = mergeFeatureFlags(defaultFeatureFlags, { copilot: true })
    expect(merged.copilot).toBe(true)
    expect(merged.offlineCache).toBe(true)
  })

  it('persists and reloads flags from storage', () => {
    const storage = new MemoryStorage()
    persistFeatureFlags(
      { ...defaultFeatureFlags, semanticSearch: true },
      storage,
    )
    const reloaded = loadFeatureFlags(storage)
    expect(reloaded.semanticSearch).toBe(true)
    expect(reloaded.copilot).toBe(false)
  })

  it('prefers persisted flags over defaults', () => {
    const storage = new MemoryStorage()
    persistFeatureFlags(
      { ...defaultFeatureFlags, copilot: true, semanticSearch: false },
      storage,
    )
    const initial = getInitialFeatureFlags(storage)
    expect(initial.copilot).toBe(true)
    expect(initial.semanticSearch).toBe(false)
  })
})
