import { supabaseAdmin } from '@/lib/supabase';
import { getTierLimits, TierName } from '@/lib/tierLimits';

export interface UsageStats {
  activeLinks: number;
  viewsThisMonth: number;
  customDomains: number;
  storageUsed: number;
}

export interface UsageLimits {
  activeLinks: number;
  viewsPerMonth: number;
  customDomains: number;
  storageBytes: number;
}

export interface UsageWithLimits {
  usage: UsageStats;
  limits: UsageLimits;
  percentages: {
    links: number;
    views: number;
    domains: number;
    storage: number;
  };
}

export async function getUserUsage(userEmail: string): Promise<UsageStats> {
  // Get active links count
  const { count: activeLinks } = await supabaseAdmin
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', userEmail)
    .is('deleted_at', null);

  // Get views this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // First get the user's file IDs
  const { data: userFiles } = await supabaseAdmin
    .from('files')
    .select('id')
    .eq('user_email', userEmail);

  const fileIds = userFiles?.map(f => f.id) || [];

  let viewsThisMonth = 0;
  if (fileIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .in('file_id', fileIds)
      .gte('accessed_at', startOfMonth.toISOString());
    viewsThisMonth = count || 0;
  }

  // Get custom domains count
  const { count: customDomains } = await supabaseAdmin
    .from('custom_domains')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', userEmail);

  // Get storage used
  const { data: storageData } = await supabaseAdmin
    .from('files')
    .select('size')
    .eq('user_email', userEmail)
    .is('deleted_at', null);

  const storageUsed = storageData?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

  return {
    activeLinks: activeLinks || 0,
    viewsThisMonth,
    customDomains: customDomains || 0,
    storageUsed,
  };
}

export async function getUserUsageWithLimits(userEmail: string, tier: string): Promise<UsageWithLimits> {
  const usage = await getUserUsage(userEmail);
  const limits = getTierLimits(tier);

  return {
    usage,
    limits,
    percentages: {
      links: Math.min(100, (usage.activeLinks / limits.activeLinks) * 100),
      views: Math.min(100, (usage.viewsThisMonth / limits.viewsPerMonth) * 100),
      domains: limits.customDomains > 0
        ? Math.min(100, (usage.customDomains / limits.customDomains) * 100)
        : 0,
      storage: Math.min(100, (usage.storageUsed / limits.storageBytes) * 100),
    },
  };
}

export async function canCreateLink(userEmail: string, tier: string): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, limits } = await getUserUsageWithLimits(userEmail, tier);

  if (usage.activeLinks >= limits.activeLinks) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.activeLinks} active links. Please upgrade or delete existing links.`,
    };
  }

  return { allowed: true };
}

export async function canTrackView(userEmail: string, tier: string): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, limits } = await getUserUsageWithLimits(userEmail, tier);

  if (usage.viewsThisMonth >= limits.viewsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.viewsPerMonth.toLocaleString()} views this month. Analytics will resume next month or upgrade now.`,
    };
  }

  return { allowed: true };
}

export async function canAddDomain(userEmail: string, tier: string): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, limits } = await getUserUsageWithLimits(userEmail, tier);

  if (limits.customDomains === 0) {
    return {
      allowed: false,
      reason: 'Custom domains are not available on the Free plan. Please upgrade to Starter or Pro.',
    };
  }

  if (usage.customDomains >= limits.customDomains) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.customDomains} custom domain${limits.customDomains > 1 ? 's' : ''}. Please upgrade to add more.`,
    };
  }

  return { allowed: true };
}

export async function canUploadFile(userEmail: string, tier: string, fileSizeBytes: number): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, limits } = await getUserUsageWithLimits(userEmail, tier);
  const tierLimits = getTierLimits(tier);

  // Check file size limit
  const maxFileSizeBytes = tierLimits.maxFileSizeMB * 1024 * 1024;
  if (fileSizeBytes > maxFileSizeBytes) {
    return {
      allowed: false,
      reason: `File size exceeds the ${tierLimits.maxFileSizeMB}MB limit for your plan.`,
    };
  }

  // Check storage limit
  if (usage.storageUsed + fileSizeBytes > limits.storageBytes) {
    return {
      allowed: false,
      reason: `This file would exceed your storage limit. Please upgrade or delete existing files.`,
    };
  }

  return { allowed: true };
}
