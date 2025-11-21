import type { Paper, ReadingStats, ReadingSession } from '../types';

/**
 * Calculate comprehensive reading statistics
 */
export function calculateReadingStats(
  papers: Paper[],
  sessions: ReadingSession[]
): ReadingStats {
  const now = Date.now();
  const readPapers = papers.filter((p) => p.status === 'read');

  // Time-based stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  thisWeek.setHours(0, 0, 0, 0);

  const papersReadThisMonth = readPapers.filter(
    (p) => p.lastReadAt && p.lastReadAt >= thisMonth.getTime()
  ).length;

  const papersReadThisWeek = readPapers.filter(
    (p) => p.lastReadAt && p.lastReadAt >= thisWeek.getTime()
  ).length;

  // Reading time stats
  const totalReadingTime = papers.reduce(
    (sum, p) => sum + (p.totalReadingTime || 0),
    0
  );
  const averageReadingTime =
    readPapers.length > 0 ? totalReadingTime / readPapers.length : 0;

  // Streak calculation
  const { currentStreak, longestStreak } = calculateReadingStreaks(papers);

  // Tag frequency
  const tagFrequency: Record<string, number> = {};
  papers.forEach((p) => {
    p.tags?.forEach((tag) => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  // Method frequency
  const methodFrequency: Record<string, number> = {};
  papers.forEach((p) => {
    p.methods?.forEach((method) => {
      methodFrequency[method] = (methodFrequency[method] || 0) + 1;
    });
  });

  // Organism frequency
  const organismFrequency: Record<string, number> = {};
  papers.forEach((p) => {
    p.organisms?.forEach((organism) => {
      organismFrequency[organism] = (organismFrequency[organism] || 0) + 1;
    });
  });

  // Year distribution
  const yearDistribution: Record<string, number> = {};
  papers.forEach((p) => {
    if (p.year) {
      yearDistribution[p.year] = (yearDistribution[p.year] || 0) + 1;
    }
  });

  // Monthly readings for the last 12 months
  const monthlyReadings = calculateMonthlyReadings(papers, 12);

  return {
    papersReadTotal: readPapers.length,
    papersReadThisMonth,
    papersReadThisWeek,
    totalReadingTime,
    averageReadingTime,
    currentStreak,
    longestStreak,
    tagFrequency,
    methodFrequency,
    organismFrequency,
    yearDistribution,
    monthlyReadings,
  };
}

/**
 * Calculate current and longest reading streaks
 */
function calculateReadingStreaks(papers: Paper[]): {
  currentStreak: number;
  longestStreak: number;
} {
  const readPapers = papers
    .filter((p) => p.status === 'read' && p.lastReadAt)
    .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));

  if (readPapers.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique reading days
  const readingDays = new Set(
    readPapers.map((p) => {
      const date = new Date(p.lastReadAt!);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const sortedDays = Array.from(readingDays).sort((a, b) => b - a);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today.getTime();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (const day of sortedDays) {
    if (day === checkDate || day === checkDate - dayInMs) {
      currentStreak++;
      checkDate = day - dayInMs;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < sortedDays.length - 1; i++) {
    if (sortedDays[i] - sortedDays[i + 1] === dayInMs) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Calculate monthly reading counts for visualization
 */
function calculateMonthlyReadings(
  papers: Paper[],
  months: number
): Array<{ month: string; count: number }> {
  const result: Array<{ month: string; count: number }> = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const count = papers.filter((p) => {
      if (!p.lastReadAt) return false;
      const readDate = new Date(p.lastReadAt);
      return readDate >= targetMonth && readDate < nextMonth;
    }).length;

    result.unshift({
      month: targetMonth.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      }),
      count,
    });
  }

  return result;
}

/**
 * Format reading time for display
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Get top N items from frequency map
 */
export function getTopItems(
  frequency: Record<string, number>,
  n: number = 10
): Array<{ item: string; count: number }> {
  return Object.entries(frequency)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Calculate reading velocity (papers per week)
 */
export function calculateReadingVelocity(
  papers: Paper[],
  weeks: number = 4
): number {
  const now = Date.now();
  const cutoff = now - weeks * 7 * 24 * 60 * 60 * 1000;

  const recentReads = papers.filter(
    (p) => p.status === 'read' && p.lastReadAt && p.lastReadAt >= cutoff
  );

  return recentReads.length / weeks;
}

/**
 * Predict time to complete reading list
 */
export function estimateCompletionTime(
  papers: Paper[],
  averageReadingTime: number
): { days: number; formattedTime: string } {
  const unreadPapers = papers.filter((p) => p.status !== 'read').length;
  const totalSeconds = unreadPapers * averageReadingTime;
  const days = Math.ceil(totalSeconds / (8 * 60 * 60)); // Assuming 8 hours of reading per day

  return {
    days,
    formattedTime: formatReadingTime(totalSeconds),
  };
}