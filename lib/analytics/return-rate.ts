/**
 * Return Rate Calculation - Unified across all sections
 *
 * Return viewer = someone who viewed MORE THAN ONCE within the period
 * Return rate = (return viewers / unique viewers) × 100
 */

export interface AccessLogForReturn {
  viewer_email?: string;
  ip_address?: string;
}

/**
 * Calculate return rate from logs
 * Works for both file-specific and global analytics
 *
 * @param logs - Access logs already filtered by period (and optionally by file)
 * @returns Return rate as percentage (0-100)
 */
export function calculateReturnRate(logs: AccessLogForReturn[]): number {
  if (!logs || logs.length === 0) return 0;

  // Group views by viewer (email preferred, fallback to IP)
  const viewerCounts = new Map<string, number>();

  logs.forEach(log => {
    const viewerId = log.viewer_email || log.ip_address;
    if (!viewerId) return;

    viewerCounts.set(viewerId, (viewerCounts.get(viewerId) || 0) + 1);
  });

  // Count viewers who viewed more than once
  let returnViewers = 0;
  let totalUniqueViewers = 0;

  viewerCounts.forEach((count) => {
    totalUniqueViewers++;
    if (count > 1) {
      returnViewers++;
    }
  });

  return totalUniqueViewers > 0
    ? Math.round((returnViewers / totalUniqueViewers) * 100)
    : 0;
}

/**
 * Calculate unique viewers count
 */
export function calculateUniqueViewers(logs: AccessLogForReturn[]): number {
  if (!logs || logs.length === 0) return 0;

  const uniqueViewers = new Set<string>();

  logs.forEach(log => {
    const viewerId = log.viewer_email || log.ip_address;
    if (viewerId) {
      uniqueViewers.add(viewerId);
    }
  });

  return uniqueViewers.size || logs.length;
}

/**
 * Get detailed return stats
 */
export function getReturnStats(logs: AccessLogForReturn[]): {
  returnRate: number;
  uniqueViewers: number;
  returnViewers: number;
  totalViews: number;
} {
  if (!logs || logs.length === 0) {
    return { returnRate: 0, uniqueViewers: 0, returnViewers: 0, totalViews: 0 };
  }

  const viewerCounts = new Map<string, number>();

  logs.forEach(log => {
    const viewerId = log.viewer_email || log.ip_address;
    if (viewerId) {
      viewerCounts.set(viewerId, (viewerCounts.get(viewerId) || 0) + 1);
    }
  });

  let returnViewers = 0;
  let uniqueViewers = 0;

  viewerCounts.forEach((count) => {
    uniqueViewers++;
    if (count > 1) returnViewers++;
  });

  return {
    returnRate: uniqueViewers > 0 ? Math.round((returnViewers / uniqueViewers) * 100) : 0,
    uniqueViewers,
    returnViewers,
    totalViews: logs.length,
  };
}
