import type { CitationData } from '../types';
import { fetchWithRetry } from './http';

const CACHE_KEY = 'paper-vault:s2-cache:v1';

type CacheRecord = {
  data: CitationData;
  etag?: string;
  fetchedAt: number;
};

type CacheStore = Record<string, CacheRecord>;

const readCache = (): CacheStore => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheStore) : {};
  } catch (error) {
    console.warn('Failed to read Semantic Scholar cache', error);
    return {};
  }
};

const writeCache = (cache: CacheStore) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to write Semantic Scholar cache', error);
  }
};

export const fetchSemanticScholarWithCache = async (
  cacheKey: string,
  url: string,
): Promise<CitationData | null> => {
  const cache = readCache();
  const cached = cache[cacheKey];

  const headers: HeadersInit = {};
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  const response = await fetchWithRetry(url, { headers });
  if (response.status === 304 && cached) {
    return cached.data;
  }
  if (!response.ok) return cached?.data ?? null;

  const etag = response.headers.get('ETag') ?? undefined;
  const data = (await response.json()) as CitationData;
  cache[cacheKey] = { data, etag, fetchedAt: Date.now() };
  writeCache(cache);
  return data;
};
