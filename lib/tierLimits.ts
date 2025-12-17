// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    activeLinks: 10,
    viewsPerMonth: 5000,
    customDomains: 0,
    storageBytes: 100 * 1024 * 1024, // 100MB
    analyticsHistoryDays: 14,
    maxFileSizeMB: 50,
    removeBranding: false,
    customLogo: false,
    customBranding: false,
    csvExport: false,
    fullCsvExport: false,
  },
  starter: {
    activeLinks: 500,
    viewsPerMonth: 50000,
    customDomains: 1,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    analyticsHistoryDays: 365,
    maxFileSizeMB: 50,
    removeBranding: true,
    customLogo: true,
    customBranding: true,
    csvExport: true,
    fullCsvExport: false,
  },
  pro: {
    activeLinks: 5000,
    viewsPerMonth: 100000,
    customDomains: 10,
    storageBytes: 50 * 1024 * 1024 * 1024, // 50GB
    analyticsHistoryDays: 36500, // ~100 years (lifetime)
    maxFileSizeMB: 100,
    removeBranding: true,
    customLogo: true,
    customBranding: true,
    csvExport: true,
    fullCsvExport: true,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  const normalizedTier = tier.toLowerCase() as TierName;
  return TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}
