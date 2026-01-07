export type RetryOptions = {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  jitterMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RetryOptions = {},
): Promise<Response> => {
  const {
    retries = 3,
    minDelayMs = 500,
    maxDelayMs = 4000,
    jitterMs = 250,
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const response = await fetch(input, init);
    if (response.status !== 429) {
      return response;
    }

    lastError = new Error('Rate limited');
    if (attempt === retries) {
      return response;
    }

    const backoff = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
    const jitter = Math.random() * jitterMs;
    await sleep(backoff + jitter);
    attempt += 1;
  }

  throw lastError instanceof Error ? lastError : new Error('Retry failed');
};
