// src/utils/srs.ts
// SM-2 spaced repetition algorithm implementation

export interface SRSState {
  repetitions: number;  // number of successful reviews in a row
  interval: number;     // current interval in days
  ease: number;         // ease factor (difficulty multiplier)
  due: number;          // next review date (ms since epoch)
}

/**
 * SM-2 algorithm for calculating next review interval
 * Based on the SuperMemo SM-2 algorithm used by Anki
 * 
 * @param prev - Previous SRS state
 * @param quality - Quality rating (0-5):
 *   0-1: Again (complete failure)
 *   2: Hard (difficult to recall)
 *   3: Good (recalled with effort)
 *   4: Easy (recalled easily)
 *   5: Perfect (instant recall)
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Updated SRS state
 */
export function sm2Review(
  prev: SRSState,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  now = Date.now()
): SRSState {
  let { repetitions, interval, ease } = prev;

  // Update ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // Simplified: EF' = EF - 0.8 + 0.28 * q - 0.02 * q * q
  ease = ease - 0.8 + 0.28 * quality - 0.02 * quality * quality;
  
  // Minimum ease factor of 1.3
  if (ease < 1.3) ease = 1.3;

  if (quality < 3) {
    // Failed recall: reset repetition count and start over
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Successful recall: increment repetitions
    repetitions += 1;
    
    // Calculate new interval based on repetition number
    if (repetitions === 1) {
      interval = 1; // First review: 1 day
    } else if (repetitions === 2) {
      interval = 6; // Second review: 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      interval = Math.round(interval * ease);
    }
  }

  // Calculate next review date
  const millisInDay = 24 * 60 * 60 * 1000;
  const due = now + (interval * millisInDay);

  return {
    repetitions,
    interval,
    ease,
    due,
  };
}

/**
 * Initialize SRS state for a new paper
 */
export function initializeSRS(now = Date.now()): SRSState {
  return {
    repetitions: 0,
    interval: 0,
    ease: 2.5, // Default ease factor
    due: now,  // Due immediately for first review
  };
}

/**
 * Check if a paper is due for review
 */
export function isDue(srsState: SRSState | null | undefined, now = Date.now()): boolean {
  if (!srsState || !srsState.due) return false;
  return srsState.due <= now;
}

/**
 * Get papers that are due for review
 */
export function getDuePapers<T extends { srsDue?: number }>(papers: T[], now = Date.now()): T[] {
  return papers
    .filter(p => p.srsDue && p.srsDue <= now)
    .sort((a, b) => (a.srsDue || 0) - (b.srsDue || 0));
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.round(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Calculate days until next review
 */
export function daysUntilDue(due: number, now = Date.now()): number {
  const diff = due - now;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}