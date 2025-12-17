/**
 * LinkLens Unified Insights Engine
 *
 * Based on ANALYTICS_DISPLAY_SPECIFICATION.md
 *
 * PRIORITY SYSTEM:
 * - HIGH: Critical insights requiring immediate attention
 * - MEDIUM: Important insights for optimization
 * - LOW: Nice-to-know information
 *
 * Display order: HIGH -> MEDIUM -> LOW
 * Max total: 8 insights
 * Initially visible: 5 insights
 */

import { AccessLog, calculateFileLinkScoreFromLogs, calculateTrackSiteLinkScoreFromLogs } from './calculations';
import { calculateReturnRate } from './return-rate';

export type Priority = 'high' | 'medium' | 'low';
export type SectionType = 'dashboard' | 'file-doc' | 'file-media' | 'file-image' | 'file-other' | 'file-url' | 'track-site' | 'contacts' | 'analytics';

export interface Insight {
  id: string;
  icon: string;
  text: string;
  implication: string;
  priority: Priority;
  category: 'engagement' | 'audience' | 'traffic' | 'timing' | 'content' | 'trend' | 'behavior';
}

// Hot lead info for actions
export interface HotLeadInfo {
  name: string;
  email?: string;
  company?: string;
  score: number;
  fileName?: string;
  fileId?: string;
  isReturn?: boolean;
  downloaded?: boolean;
  visitCount?: number;
}

// Company info for actions
export interface CompanyInfo {
  name: string;
  domain: string;
  viewerCount: number;
  emails: string[];
}

// Contact-specific summary
export interface ContactSummary {
  totalVisits: number;
  filesViewed: number;
  totalTimeSpent: number;
  avgEngagement: number;
  isHighIntent: boolean;
  hasDownloaded: boolean;
  returnVisitCount: number;
  lastVisitHoursAgo: number;
  peakActiveDay?: string;
  peakActiveHour?: string;
  mostViewedFile?: string;
  colleagueCount?: number;
  companyName?: string;
}

export interface InsightsSummary {
  // Basic metrics
  totalViews: number;
  uniqueViewers: number;
  avgEngagement: number;

  // Lead counts (numbers)
  hotLeadsCount: number;
  warmLeadsCount: number;
  coldLeadsCount: number;

  // Lead details (for actions)
  hotLeads: HotLeadInfo[];
  activeCompanies: CompanyInfo[];

  // Rates
  returnRate: number;
  downloadRate: number;
  qrScanRate: number;

  // Document-specific
  avgCompletion?: number;
  highDropOffPage?: number;
  highDropOffRate?: number;
  mostEngagingPage?: number;
  mostEngagingPageTime?: number;
  avgPageTime?: number;

  // Media-specific
  avgWatchTime?: number;
  watchCompletion?: number;
  finishedCount?: number;
  earlyDropRate?: number; // % who drop in first 30 seconds

  // Trends
  viewsChange?: number;
  engagementChange?: number;

  // Geographic
  topCountry?: string;
  topCountryPercent?: number;
  countriesCount?: number;

  // Device
  mobilePercent?: number;
  desktopPercent?: number;

  // Traffic
  socialTrafficPercent?: number;
  searchTrafficPercent?: number;
  referralTrafficPercent?: number;

  // UTM
  topUtmCampaign?: string;
  topUtmCampaignViews?: number;
  topUtmCampaignPercent?: number;

  // Timing
  peakDay?: string;
  peakHour?: string;

  // Companies
  companiesWithMultipleViewers?: string[];

  // Contact-specific (for contacts section)
  contact?: ContactSummary;

  // URL/Track Site specific
  isExternalUrl?: boolean;
  destinationUrl?: string;
}

// Priority weights for sorting (lower = higher priority)
const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Master Insights Pool
 * Each insight has conditions and applies to specific sections
 */
interface InsightRule {
  id: string;
  icon: string;
  priority: Priority;
  category: Insight['category'];
  appliesTo: SectionType[];
  condition: (summary: InsightsSummary, logs: AccessLog[]) => boolean;
  getText: (summary: InsightsSummary, logs: AccessLog[]) => string;
  getImplication: (summary: InsightsSummary, logs: AccessLog[]) => string;
}

const INSIGHT_RULES: InsightRule[] = [
  // ========== HIGH PRIORITY ==========

  // Engagement - High
  {
    id: 'hot-leads-ready',
    icon: '🔥',
    priority: 'high',
    category: 'engagement',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.hotLeadsCount > 0,
    getText: (s) => `${s.hotLeadsCount} hot lead${s.hotLeadsCount > 1 ? 's' : ''} ready for follow-up`,
    getImplication: () => 'High intent - prioritize outreach',
  },
  {
    id: 'low-engagement-warning',
    icon: '📉',
    priority: 'high',
    category: 'engagement',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.avgEngagement < 20 && s.totalViews >= 5,
    getText: (s) => `Low engagement score (${Math.round(s.avgEngagement)})`,
    getImplication: () => 'Consider refreshing content',
  },
  // Track Site specific engagement
  {
    id: 'tracksite-high-engagement',
    icon: '🎯',
    priority: 'high',
    category: 'engagement',
    appliesTo: ['file-url', 'track-site'],
    condition: (s) => s.avgEngagement >= 70 && s.totalViews >= 3,
    getText: (s) => `High engagement score (${Math.round(s.avgEngagement)})`,
    getImplication: () => 'Link resonating with audience',
  },
  {
    id: 'tracksite-growing-interest',
    icon: '📈',
    priority: 'medium',
    category: 'engagement',
    appliesTo: ['file-url', 'track-site'],
    condition: (s) => s.returnRate >= 30 && s.totalViews >= 5,
    getText: (s) => `${Math.round(s.returnRate)}% return click rate`,
    getImplication: () => 'Strong recurring interest',
  },
  {
    id: 'views-declining',
    icon: '📉',
    priority: 'high',
    category: 'trend',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.viewsChange ?? 0) < -20,
    getText: (s) => `Views down ${Math.abs(s.viewsChange ?? 0)}% vs previous period`,
    getImplication: () => 'Consider refreshing content or distribution',
  },

  // Audience - High
  {
    id: 'company-interest',
    icon: '🏢',
    priority: 'high',
    category: 'audience',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.companiesWithMultipleViewers?.length ?? 0) > 0,
    getText: (s) => {
      const companies = s.companiesWithMultipleViewers || [];
      if (companies.length === 1) return `Multiple viewers from ${companies[0]}`;
      return `${companies.length} companies showing strong interest`;
    },
    getImplication: () => 'Being shared internally - potential deal',
  },

  // Content - High (Docs only)
  {
    id: 'high-drop-off-page',
    icon: '⚠️',
    priority: 'high',
    category: 'content',
    appliesTo: ['file-doc'],
    condition: (s) => (s.highDropOffRate ?? 0) > 25 && (s.highDropOffPage ?? 0) > 1,
    getText: (s) => `${s.highDropOffRate}% drop-off at page ${s.highDropOffPage}`,
    getImplication: () => 'Content may need revision',
  },
  {
    id: 'low-completion-rate',
    icon: '📊',
    priority: 'high',
    category: 'content',
    appliesTo: ['file-doc'],
    condition: (s) => (s.avgCompletion ?? 100) < 50 && s.totalViews >= 3,
    getText: (s) => `Only ${Math.round(s.avgCompletion ?? 0)}% average completion`,
    getImplication: () => 'Most viewers don\'t finish - consider shortening',
  },

  // Content - High (Media only)
  {
    id: 'low-watch-completion',
    icon: '📉',
    priority: 'high',
    category: 'content',
    appliesTo: ['file-media'],
    condition: (s) => (s.watchCompletion ?? 100) < 50 && s.totalViews >= 3,
    getText: (s) => `Only ${Math.round(s.watchCompletion ?? 0)}% average watch completion`,
    getImplication: () => 'Most viewers don\'t finish watching',
  },
  // NEW: Early drop for media (before 20% completion)
  {
    id: 'early-drop-media',
    icon: '⚠️',
    priority: 'high',
    category: 'content',
    appliesTo: ['file-media'],
    condition: (s) => (s.earlyDropRate ?? 0) > 30,
    getText: (s) => `${s.earlyDropRate}% dropped before 20% completion`,
    getImplication: () => 'Opening content needs improvement',
  },

  // Contact - High (NEW)
  {
    id: 'contact-high-intent',
    icon: '🔥',
    priority: 'high',
    category: 'behavior',
    appliesTo: ['contacts'],
    condition: (s) => s.contact?.isHighIntent === true,
    getText: () => 'Very high intent signals',
    getImplication: () => 'Priority follow-up',
  },
  {
    id: 'contact-quick-return',
    icon: '⚡',
    priority: 'high',
    category: 'behavior',
    appliesTo: ['contacts'],
    condition: (s) => (s.contact?.lastVisitHoursAgo ?? 999) < 24 && (s.contact?.returnVisitCount ?? 0) >= 1,
    getText: () => 'Returned within 24 hours',
    getImplication: () => 'Urgent interest',
  },

  // ========== MEDIUM PRIORITY ==========

  // Engagement - Medium
  {
    id: 'high-engagement',
    icon: '🚀',
    priority: 'medium',
    category: 'engagement',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.avgEngagement >= 70 && s.totalViews >= 3,
    getText: (s) => `High engagement score (${Math.round(s.avgEngagement)}%)`,
    getImplication: () => 'Content is resonating well',
  },
  {
    id: 'strong-return-visitors',
    icon: '🔄',
    priority: 'medium',
    category: 'engagement',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-other', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.returnRate > 25,
    getText: (s) => `${Math.round(s.returnRate)}% are return visitors`,
    getImplication: () => 'Content resonating - people come back',
  },
  {
    id: 'high-download-interest',
    icon: '⬇️',
    priority: 'medium',
    category: 'engagement',
    appliesTo: ['dashboard', 'file-doc', 'file-image', 'file-other', 'analytics'],
    condition: (s) => s.downloadRate > 30,
    getText: (s) => `${Math.round(s.downloadRate)}% downloaded`,
    getImplication: () => 'High interest - saving for later',
  },
  {
    id: 'engagement-improving',
    icon: '💪',
    priority: 'medium',
    category: 'trend',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'analytics'],
    condition: (s) => (s.engagementChange ?? 0) > 10,
    getText: (s) => `Engagement up ${s.engagementChange}% vs previous period`,
    getImplication: () => 'Content optimization is working',
  },

  // Media - Medium (NEW)
  {
    id: 'media-finished-count',
    icon: '🏁',
    priority: 'medium',
    category: 'content',
    appliesTo: ['file-media'],
    condition: (s) => (s.finishedCount ?? 0) > 0 && s.totalViews >= 3,
    getText: (s) => `${s.finishedCount} viewer${(s.finishedCount ?? 0) > 1 ? 's' : ''} finished entirely`,
    getImplication: () => 'Content holding attention',
  },
  {
    id: 'high-watch-completion',
    icon: '🎬',
    priority: 'medium',
    category: 'content',
    appliesTo: ['file-media'],
    condition: (s) => (s.watchCompletion ?? 0) > 70 && s.totalViews >= 3,
    getText: (s) => `${Math.round(s.watchCompletion ?? 0)}% average watch completion`,
    getImplication: () => 'Strong retention',
  },

  // Audience - Medium
  {
    id: 'geographic-concentration',
    icon: '🌍',
    priority: 'medium',
    category: 'audience',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.topCountryPercent ?? 0) > 50,
    getText: (s) => `${s.topCountryPercent}% of views from ${s.topCountry}`,
    getImplication: () => 'Strong regional interest',
  },

  // Traffic - Medium
  {
    id: 'social-traffic-strong',
    icon: '📣',
    priority: 'medium',
    category: 'traffic',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.socialTrafficPercent ?? 0) > 30,
    getText: (s) => `${s.socialTrafficPercent}% traffic from social`,
    getImplication: () => 'Social sharing is working',
  },
  {
    id: 'utm-campaign-success',
    icon: '🎯',
    priority: 'medium',
    category: 'traffic',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.topUtmCampaignViews ?? 0) >= 5,
    getText: (s) => `"${s.topUtmCampaign}" driving ${s.topUtmCampaignPercent || Math.round(((s.topUtmCampaignViews || 0) / Math.max(s.totalViews, 1)) * 100)}% of traffic`,
    getImplication: () => 'Campaign working',
  },

  // Timing - Medium
  {
    id: 'peak-time-identified',
    icon: '⏰',
    priority: 'medium',
    category: 'timing',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => !!(s.peakDay && s.peakHour),
    getText: (s) => `Peak viewing: ${s.peakDay} at ${s.peakHour}`,
    getImplication: () => 'Best time to share',
  },

  // Content - Medium (Docs only) - FIXED: Excludes page 1
  {
    id: 'most-engaging-page',
    icon: '💎',
    priority: 'medium',
    category: 'content',
    appliesTo: ['file-doc'],
    condition: (s) => {
      // Must be page > 1 and have 2x more attention than average
      return (s.mostEngagingPage ?? 0) > 1 &&
             (s.mostEngagingPageTime ?? 0) > (s.avgPageTime ?? 0) * 2;
    },
    getText: (s) => `Page ${s.mostEngagingPage} gets 2x more attention`,
    getImplication: () => 'Strong interest in this content',
  },
  {
    id: 'high-completion-rate',
    icon: '✅',
    priority: 'medium',
    category: 'content',
    appliesTo: ['file-doc'],
    condition: (s) => (s.avgCompletion ?? 0) > 80 && s.totalViews >= 3,
    getText: (s) => `${Math.round(s.avgCompletion ?? 0)}% completion rate`,
    getImplication: () => 'Viewers engaged through the end',
  },

  // Track Site / URL - Medium (NEW)
  {
    id: 'tracking-external-site',
    icon: '🔗',
    priority: 'medium',
    category: 'traffic',
    appliesTo: ['file-url', 'track-site'],
    condition: (s) => s.isExternalUrl === true && s.totalViews > 0,
    getText: () => 'Tracking clicks to external site',
    getImplication: () => 'Landing engagement tracked',
  },
  {
    id: 'url-strong-engagement',
    icon: '🔥',
    priority: 'medium',
    category: 'engagement',
    appliesTo: ['file-url', 'track-site'],
    condition: (s) => s.isExternalUrl === true && s.avgEngagement >= 60,
    getText: () => 'Strong click engagement',
    getImplication: () => 'Link is effective',
  },

  // Contact - Medium (NEW)
  {
    id: 'contact-multiple-files',
    icon: '📁',
    priority: 'medium',
    category: 'behavior',
    appliesTo: ['contacts'],
    condition: (s) => (s.contact?.filesViewed ?? 0) >= 3,
    getText: (s) => `Viewed ${s.contact?.filesViewed} different files`,
    getImplication: () => 'Broad interest',
  },
  {
    id: 'contact-colleagues-viewing',
    icon: '👥',
    priority: 'medium',
    category: 'audience',
    appliesTo: ['contacts'],
    condition: (s) => (s.contact?.colleagueCount ?? 0) >= 1,
    getText: (s) => `${s.contact?.colleagueCount} colleague${(s.contact?.colleagueCount ?? 0) > 1 ? 's' : ''} also viewed`,
    getImplication: (s) => `Shared internally at ${s.contact?.companyName || 'company'}`,
  },
  {
    id: 'contact-peak-time',
    icon: '⏰',
    priority: 'medium',
    category: 'timing',
    appliesTo: ['contacts'],
    condition: (s) => !!(s.contact?.peakActiveDay && s.contact?.peakActiveHour),
    getText: (s) => `Most active ${s.contact?.peakActiveDay} at ${s.contact?.peakActiveHour}`,
    getImplication: () => 'Optimal contact time',
  },
  {
    id: 'contact-specific-focus',
    icon: '🎯',
    priority: 'medium',
    category: 'behavior',
    appliesTo: ['contacts'],
    condition: (s) => !!(s.contact?.mostViewedFile) && (s.contact?.filesViewed ?? 0) >= 2,
    getText: (s) => `Focused mainly on "${s.contact?.mostViewedFile}"`,
    getImplication: () => 'Primary interest area',
  },
  {
    id: 'contact-downloaded',
    icon: '⬇️',
    priority: 'medium',
    category: 'behavior',
    appliesTo: ['contacts'],
    condition: (s) => s.contact?.hasDownloaded === true,
    getText: () => 'Downloaded content',
    getImplication: () => 'Ready for more',
  },

  // Trend - Medium
  {
    id: 'views-trending-up',
    icon: '📈',
    priority: 'medium',
    category: 'trend',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.viewsChange ?? 0) > 20,
    getText: (s) => `Views up ${s.viewsChange}% vs previous period`,
    getImplication: () => 'Momentum building - amplify',
  },

  // ========== LOW PRIORITY ==========

  // Audience - Low
  {
    id: 'international-reach',
    icon: '🌐',
    priority: 'low',
    category: 'audience',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.countriesCount ?? 0) >= 3,
    getText: (s) => `Viewers from ${s.countriesCount} countries`,
    getImplication: () => 'International reach expanding',
  },
  {
    id: 'mobile-dominant',
    icon: '📱',
    priority: 'low',
    category: 'audience',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.mobilePercent ?? 0) > 40,
    getText: (s) => `${s.mobilePercent}% viewing on mobile`,
    getImplication: () => 'Mobile audience',
  },
  {
    id: 'desktop-dominant',
    icon: '💻',
    priority: 'low',
    category: 'audience',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => (s.desktopPercent ?? 0) > 80,
    getText: (s) => `${s.desktopPercent}% viewing on desktop`,
    getImplication: () => 'Professional audience',
  },

  // Traffic - Low
  {
    id: 'qr-effective',
    icon: '📲',
    priority: 'low',
    category: 'traffic',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.qrScanRate > 20,
    getText: (s) => `${Math.round(s.qrScanRate)}% from QR codes`,
    getImplication: () => 'Physical distribution working',
  },

  // Image - Low
  {
    id: 'image-view-time',
    icon: '⏰',
    priority: 'low',
    category: 'engagement',
    appliesTo: ['file-image'],
    condition: (s) => s.totalViews >= 3,
    getText: () => `Average view time tracked`,
    getImplication: () => 'Holding attention',
  },
];

/**
 * Generate insights for a section
 * @param logs - Access logs
 * @param summary - Pre-calculated summary metrics
 * @param section - Which section is requesting insights
 * @param maxTotal - Maximum insights to return (default 8)
 * @returns Sorted insights array (HIGH -> MEDIUM -> LOW)
 */
export function generateUnifiedInsights(
  logs: AccessLog[],
  summary: InsightsSummary,
  section: SectionType,
  maxTotal: number = 8
): Insight[] {
  const insights: Insight[] = [];

  // No data case
  if (!logs || logs.length === 0) {
    return [{
      id: 'no-views',
      icon: '📊',
      text: 'No views yet',
      implication: 'Share your link to start collecting analytics',
      priority: 'medium',
      category: 'engagement',
    }];
  }

  // Evaluate each rule
  for (const rule of INSIGHT_RULES) {
    // Check if rule applies to this section
    if (!rule.appliesTo.includes(section)) continue;

    // Check if condition is met
    try {
      if (rule.condition(summary, logs)) {
        insights.push({
          id: rule.id,
          icon: rule.icon,
          text: rule.getText(summary, logs),
          implication: rule.getImplication(summary, logs),
          priority: rule.priority,
          category: rule.category,
        });
      }
    } catch (e) {
      // Skip rule if evaluation fails
      console.warn(`Insight rule ${rule.id} failed:`, e);
    }
  }

  // Sort by priority (HIGH -> MEDIUM -> LOW)
  insights.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);

  // Return max allowed
  return insights.slice(0, maxTotal);
}

/**
 * Calculate insights summary from logs
 * Use this to pre-calculate metrics before calling generateUnifiedInsights
 */
export function calculateInsightsSummary(
  logs: AccessLog[],
  options?: {
    totalPages?: number;
    previousPeriodViews?: number;
    previousPeriodEngagement?: number;
    isExternalUrl?: boolean;
    contactData?: ContactSummary;
  }
): InsightsSummary {
  if (!logs || logs.length === 0) {
    return {
      totalViews: 0,
      uniqueViewers: 0,
      avgEngagement: 0,
      hotLeadsCount: 0,
      warmLeadsCount: 0,
      coldLeadsCount: 0,
      hotLeads: [],
      activeCompanies: [],
      returnRate: 0,
      downloadRate: 0,
      qrScanRate: 0,
    };
  }

  const totalViews = logs.length;
  const uniqueEmails = new Set(logs.filter(l => l.viewer_email).map(l => l.viewer_email));
  const uniqueViewers = uniqueEmails.size || totalViews;

  // Engagement calculation - use volume-gated link-level score (same as Quick Stats)
  const avgEngagement = options?.isExternalUrl
    ? calculateTrackSiteLinkScoreFromLogs(logs)
    : calculateFileLinkScoreFromLogs(logs);

  // Group logs by unique viewer and calculate aggregated scores
  const viewerLogsMap = new Map<string, typeof logs>();
  logs.forEach(log => {
    const identifier = log.viewer_email || log.ip_address || log.session_id || `${log.id}`;
    if (!viewerLogsMap.has(identifier)) {
      viewerLogsMap.set(identifier, []);
    }
    viewerLogsMap.get(identifier)!.push(log);
  });

  // Calculate engagement for each viewer using aggregated data
  let hotLeadsCount = 0;
  let warmLeadsCount = 0;
  let coldLeadsCount = 0;
  const hotLeads: HotLeadInfo[] = [];

  viewerLogsMap.forEach((viewerLogs, identifier) => {
    // Aggregate viewer data
    let totalDuration = 0;
    let maxCompletion = 0;
    let downloaded = false;
    const isReturn = viewerLogs.length > 1;
    const latestLog = viewerLogs.sort((a, b) =>
      new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime()
    )[0];

    viewerLogs.forEach(log => {
      totalDuration += log.total_duration_seconds || 0;
      if ((log.completion_percentage || 0) > maxCompletion) {
        maxCompletion = log.completion_percentage || 0;
      }
      if (log.downloaded) downloaded = true;
    });

    // Calculate aggregated score
    let score: number;
    if (options?.isExternalUrl) {
      // Track Site: Return (60%) + Frequency (40%)
      const returnScore = isReturn ? 100 : 0;
      const frequencyScore = Math.min(100, viewerLogs.length * 33);
      score = Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
    } else {
      // File: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)
      let timeScore: number;
      if (totalDuration <= 0) timeScore = 0;
      else if (totalDuration < 30) timeScore = Math.round((totalDuration / 30) * 25);
      else if (totalDuration < 60) timeScore = 25 + Math.round(((totalDuration - 30) / 30) * 15);
      else if (totalDuration < 120) timeScore = 40 + Math.round(((totalDuration - 60) / 60) * 20);
      else if (totalDuration < 300) timeScore = 60 + Math.round(((totalDuration - 120) / 180) * 20);
      else if (totalDuration < 600) timeScore = 80 + Math.round(((totalDuration - 300) / 300) * 20);
      else timeScore = 100;

      const completionScore = maxCompletion;
      const downloadScore = downloaded ? 100 : 0;
      const returnScore = isReturn ? 100 : 0;
      const depthScore = maxCompletion; // Use completion as proxy for depth

      score = Math.round(
        (timeScore * 0.25) +
        (completionScore * 0.25) +
        (downloadScore * 0.20) +
        (returnScore * 0.15) +
        (depthScore * 0.15)
      );
    }

    // Categorize by score
    if (score >= 70) {
      hotLeadsCount++;
      // Build hot lead info
      if (latestLog.viewer_email) {
        const domain = latestLog.viewer_email.split('@')[1]?.toLowerCase() || '';
        const isConsumer = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].some(d => domain.includes(d));
        hotLeads.push({
          name: latestLog.viewer_name || latestLog.viewer_email.split('@')[0],
          email: latestLog.viewer_email,
          company: isConsumer ? undefined : domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          score,
          fileName: latestLog.file_name,
          fileId: latestLog.file_id,
          isReturn,
          downloaded,
          visitCount: viewerLogs.length,
        });
      }
    } else if (score >= 40) {
      warmLeadsCount++;
    } else {
      coldLeadsCount++;
    }
  });

  // Build active companies array
  const companyViewers = new Map<string, Set<string>>();
  logs.forEach(l => {
    if (l.viewer_email) {
      const domain = l.viewer_email.split('@')[1]?.toLowerCase();
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'protonmail.com'].includes(domain)) {
        if (!companyViewers.has(domain)) {
          companyViewers.set(domain, new Set());
        }
        companyViewers.get(domain)!.add(l.viewer_email);
      }
    }
  });

  const activeCompanies: CompanyInfo[] = [];
  companyViewers.forEach((emails, domain) => {
    if (emails.size >= 2) {
      activeCompanies.push({
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        domain,
        viewerCount: emails.size,
        emails: Array.from(emails),
      });
    }
  });

  // Rates
  const returnRate = calculateReturnRate(logs);
  const downloads = logs.filter(l => l.downloaded).length;
  const downloadRate = (downloads / totalViews) * 100;
  const qrScans = logs.filter(l => l.is_qr_scan || l.access_method === 'qr_scan').length;
  const qrScanRate = (qrScans / totalViews) * 100;

  // Completion (for docs)
  const completions = logs.filter(l => l.completion_percentage !== undefined);
  const avgCompletion = completions.length > 0
    ? completions.reduce((sum, l) => sum + (l.completion_percentage || 0), 0) / completions.length
    : undefined;

  // Watch time (for media) - Use video_completion_percent directly from access logs
  // This is more accurate than recalculating from watch_time_seconds
  const mediaLogs = logs.filter(l =>
    l.video_completion_percent !== undefined ||
    l.video_duration_seconds !== undefined
  );

  // Average watch completion (percentage of video watched)
  const avgWatchCompletion = mediaLogs.length > 0
    ? mediaLogs.reduce((sum, l) => sum + (l.video_completion_percent || l.completion_percentage || 0), 0) / mediaLogs.length
    : undefined;

  // watchCompletion is the same as avgWatchCompletion, capped at 100%
  const watchCompletion = avgWatchCompletion !== undefined
    ? Math.min(100, avgWatchCompletion)
    : undefined;

  // Average watch time in seconds
  const avgWatchTime = mediaLogs.length > 0
    ? mediaLogs.reduce((sum, l) => sum + (l.watch_time_seconds || l.total_duration_seconds || 0), 0) / mediaLogs.length
    : undefined;

  // Finished count (watched 95%+ of video)
  const finishedCount = mediaLogs.filter(l =>
    (l.video_completion_percent || l.completion_percentage || 0) >= 95
  ).length;

  // Early drop rate (percentage-based: viewers who watched less than 20% of the video)
  // NOT time-based (which doesn't work for short videos like 15 seconds)
  const earlyDropLogs = mediaLogs.filter(l => {
    const completion = l.video_completion_percent || l.completion_percentage || 0;
    return completion < 20;
  });
  const earlyDropRate = mediaLogs.length > 0
    ? Math.round((earlyDropLogs.length / mediaLogs.length) * 100)
    : undefined;

  // Geographic
  const countryCounts = new Map<string, number>();
  logs.forEach(l => {
    if (l.country) {
      countryCounts.set(l.country, (countryCounts.get(l.country) || 0) + 1);
    }
  });
  const sortedCountries = Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topCountry = sortedCountries[0]?.[0];
  const topCountryPercent = sortedCountries[0] ? Math.round((sortedCountries[0][1] / totalViews) * 100) : undefined;
  const countriesCount = sortedCountries.length;

  // Device
  const desktopCount = logs.filter(l => l.device_type === 'desktop').length;
  const mobileCount = logs.filter(l => l.device_type === 'mobile' || l.device_type === 'tablet').length;
  const desktopPercent = Math.round((desktopCount / totalViews) * 100);
  const mobilePercent = Math.round((mobileCount / totalViews) * 100);

  // Traffic sources
  const socialCount = logs.filter(l => l.traffic_source === 'social').length;
  const searchCount = logs.filter(l => l.traffic_source === 'search').length;
  const referralCount = logs.filter(l => l.traffic_source === 'referral').length;
  const socialTrafficPercent = Math.round((socialCount / totalViews) * 100);
  const searchTrafficPercent = Math.round((searchCount / totalViews) * 100);
  const referralTrafficPercent = Math.round((referralCount / totalViews) * 100);

  // Peak timing
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  logs.forEach(l => {
    const date = new Date(l.accessed_at);
    dayCounts[date.getDay()]++;
    hourCounts[date.getHours()]++;
  });
  const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayNames[peakDayIndex];
  const peakHour = `${peakHourIndex}:00`;

  // Companies with multiple viewers
  const companiesWithMultipleViewers = activeCompanies.map(c => c.name);

  // UTM campaigns
  const utmCounts = new Map<string, number>();
  logs.forEach(l => {
    if (l.utm_campaign) {
      utmCounts.set(l.utm_campaign, (utmCounts.get(l.utm_campaign) || 0) + 1);
    }
  });
  const sortedUtm = Array.from(utmCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topUtmCampaign = sortedUtm[0]?.[0];
  const topUtmCampaignViews = sortedUtm[0]?.[1];
  const topUtmCampaignPercent = topUtmCampaignViews ? Math.round((topUtmCampaignViews / totalViews) * 100) : undefined;

  // Page analysis (for docs) - FIXED: Exclude page 1
  let highDropOffPage: number | undefined;
  let highDropOffRate: number | undefined;
  let mostEngagingPage: number | undefined;
  let mostEngagingPageTime: number | undefined;
  let avgPageTime: number | undefined;

  if (options?.totalPages && options.totalPages > 1) {
    const pageExits = new Map<number, number>();
    const pageTimes = new Map<number, number[]>();

    logs.forEach(l => {
      if (l.exit_page) {
        pageExits.set(l.exit_page, (pageExits.get(l.exit_page) || 0) + 1);
      }
      if (l.pages_time_data) {
        Object.entries(l.pages_time_data).forEach(([page, time]) => {
          const pageNum = parseInt(page);
          if (!pageTimes.has(pageNum)) pageTimes.set(pageNum, []);
          pageTimes.get(pageNum)!.push(time as number);
        });
      }
    });

    // Find high drop-off page (exclude last page)
    const exitRates = Array.from(pageExits.entries()).map(([page, count]) => ({
      page,
      rate: Math.round((count / totalViews) * 100),
    }));
    const highExit = exitRates
      .filter(e => e.page < (options.totalPages || 99) && e.page > 1) // Exclude page 1 and last page
      .sort((a, b) => b.rate - a.rate)[0];
    if (highExit && highExit.rate > 25) {
      highDropOffPage = highExit.page;
      highDropOffRate = highExit.rate;
    }

    // Find most engaging page - EXCLUDE PAGE 1
    const avgTimes = Array.from(pageTimes.entries())
      .filter(([page]) => page !== 1) // EXCLUDE PAGE 1
      .map(([page, times]) => ({
        page,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }));

    // Calculate average including all pages for comparison
    const allAvgTimes = Array.from(pageTimes.entries()).map(([page, times]) => ({
      page,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    }));
    avgPageTime = allAvgTimes.length > 0
      ? allAvgTimes.reduce((sum, p) => sum + p.avgTime, 0) / allAvgTimes.length
      : 0;

    // Most engaging is from pages 2+ only
    const mostEngaging = avgTimes.sort((a, b) => b.avgTime - a.avgTime)[0];
    if (mostEngaging && mostEngaging.avgTime > avgPageTime * 2) {
      mostEngagingPage = mostEngaging.page;
      mostEngagingPageTime = mostEngaging.avgTime;
    }
  }

  // Period comparison
  let viewsChange: number | undefined;
  let engagementChange: number | undefined;
  if (options?.previousPeriodViews !== undefined && options.previousPeriodViews > 0) {
    viewsChange = Math.round(((totalViews - options.previousPeriodViews) / options.previousPeriodViews) * 100);
  }
  if (options?.previousPeriodEngagement !== undefined && options.previousPeriodEngagement > 0) {
    engagementChange = Math.round(((avgEngagement - options.previousPeriodEngagement) / options.previousPeriodEngagement) * 100);
  }

  return {
    totalViews,
    uniqueViewers,
    avgEngagement,
    hotLeadsCount,
    warmLeadsCount,
    coldLeadsCount,
    hotLeads,
    activeCompanies,
    returnRate,
    downloadRate,
    qrScanRate,
    avgCompletion,
    avgWatchTime,
    watchCompletion,
    finishedCount,
    earlyDropRate,
    viewsChange,
    engagementChange,
    topCountry,
    topCountryPercent,
    countriesCount,
    mobilePercent,
    desktopPercent,
    socialTrafficPercent,
    searchTrafficPercent,
    referralTrafficPercent,
    peakDay,
    peakHour,
    highDropOffPage,
    highDropOffRate,
    mostEngagingPage,
    mostEngagingPageTime,
    avgPageTime,
    companiesWithMultipleViewers,
    topUtmCampaign,
    topUtmCampaignViews,
    topUtmCampaignPercent,
    isExternalUrl: options?.isExternalUrl,
    contact: options?.contactData,
  };
}

export const MAX_INSIGHTS_VISIBLE = 5;
export const MAX_INSIGHTS_TOTAL = 8;
