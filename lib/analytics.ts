// lib/analytics.ts
// Analytics calculation utilities for LinkLens
// Updated: December 11, 2025 - 5-variable formula for files, separate Track Site score

export interface FileEngagementParams {
  totalDurationSeconds: number;
  completionPercentage: number;
  downloaded: boolean;
  isReturnVisit: boolean;
  returnVisitCount: number;
  totalPages?: number;
  videoDurationSeconds?: number;
  videoCompletionPercent?: number;
  pagesTimeData?: Record<string, number>;
  segmentsTimeData?: Record<string, number>; // Video segment tracking
}

// Legacy alias for backward compatibility
export type EngagementParams = FileEngagementParams;

/**
 * Calculate File Engagement Score (0-100) based on viewer behavior
 *
 * Updated December 11, 2025: Expanded to 5 variables
 *
 * Formula:
 * - Time Score (25% weight): How long they spent vs expected time
 * - Completion Score (25% weight): How much of content they viewed
 * - Download Score (20% weight): Did they download?
 * - Return Score (15% weight): Did they come back?
 * - Depth Score (15% weight): Did they actually read multiple pages?
 */
export function calculateEngagementScore(params: FileEngagementParams): number {
  const {
    totalDurationSeconds,
    completionPercentage,
    downloaded,
    isReturnVisit,
    returnVisitCount = isReturnVisit ? 1 : 0,
    totalPages,
    videoDurationSeconds,
    videoCompletionPercent,
    pagesTimeData,
    segmentsTimeData,
  } = params;

  // Calculate expected time based on content type
  let expectedTime = 60; // default for images/other (60 seconds)
  if (totalPages && totalPages > 0) {
    expectedTime = totalPages * 30; // 30 seconds per page for documents
  } else if (videoDurationSeconds && videoDurationSeconds > 0) {
    expectedTime = videoDurationSeconds;
  }

  // 1. Time Score (25% weight)
  const timeScore = Math.min(100, (totalDurationSeconds / expectedTime) * 100);

  // 2. Completion Score (25% weight)
  let completionScore = completionPercentage || 0;
  if (videoCompletionPercent !== undefined && videoCompletionPercent > 0) {
    completionScore = videoCompletionPercent;
  }

  // 3. Download Score (20% weight)
  const downloadScore = downloaded ? 100 : 0;

  // 4. Return Score (15% weight) - 2 returns = 100 points
  const returnScore = Math.min(100, returnVisitCount * 50);

  // 5. Depth Score (15% weight) - meaningful engagement depth
  let depthScore = 0;
  if (pagesTimeData && totalPages && totalPages > 0) {
    // Documents: pages with 10+ seconds of reading
    const meaningfulPages = Object.values(pagesTimeData).filter(time => time >= 10).length;
    depthScore = Math.min(100, (meaningfulPages / totalPages) * 100);
  } else if (segmentsTimeData && Object.keys(segmentsTimeData).length > 0) {
    // Videos: segments with meaningful watch time (>= 1 second)
    const totalSegments = 10; // We use 10 segments for videos
    const meaningfulSegments = Object.values(segmentsTimeData).filter(time => time >= 1).length;
    depthScore = Math.min(100, (meaningfulSegments / totalSegments) * 100);
  } else if (completionPercentage && completionPercentage > 0) {
    // Fallback: estimate depth from completion if no segment/page data
    depthScore = completionPercentage * 0.8;
  }

  // Calculate final weighted score
  const engagementScore = Math.round(
    (timeScore * 0.25) +
    (completionScore * 0.25) +
    (downloadScore * 0.20) +
    (returnScore * 0.15) +
    (depthScore * 0.15)
  );

  // Clamp between 0-100
  return Math.min(100, Math.max(0, engagementScore));
}

// Legacy alias for backward compatibility
export const calculateFileEngagementScore = calculateEngagementScore;

export interface TrackSiteScoreParams {
  totalClicks: number;
  uniqueClickers: number;
  returnClickers: number;
  daysSinceLastClick: number;
  clicksThisWeek: number;
  clicksLastWeek: number;
}

/**
 * Calculate Track Site Score (0-100) for URL redirect links
 *
 * Added December 11, 2025
 *
 * Formula:
 * - Volume Score (30% weight): Total clicks (log scale)
 * - Reach Score (20% weight): Unique clickers / total clicks
 * - Return Score (25% weight): Return clickers / unique clickers
 * - Recency Score (15% weight): Days since last click
 * - Velocity Score (10% weight): Week-over-week trend
 */
export function calculateTrackSiteScore(params: TrackSiteScoreParams): number {
  const {
    totalClicks,
    uniqueClickers,
    returnClickers,
    daysSinceLastClick,
    clicksThisWeek,
    clicksLastWeek
  } = params;

  // NEW VOLUME-GATED FORMULA (December 11, 2025)
  // Core principle: Low volume = Low score, regardless of other factors
  // You need real traffic to achieve high scores

  if (totalClicks === 0) return 0;

  // 1. Base Volume Score - reduced coefficient for realistic scaling
  // 1 click = 6, 5 clicks = 14, 10 clicks = 20, 50 clicks = 34, 100 clicks = 40, 500 clicks = 54
  const volumeScore = Math.min(100, 20 * Math.log10(totalClicks + 1));

  // 2. Volume Multiplier - gates bonus scores by actual volume
  // Low volume links can't get high bonus points
  // 10 clicks = 0.02x, 100 clicks = 0.20x, 500+ clicks = 1.0x
  const volumeMultiplier = Math.min(1, totalClicks / 500);

  // 3. Reach Bonus (unique clickers / total clicks)
  // Max 20 points at full volume
  const reachRatio = totalClicks > 0 ? (uniqueClickers / totalClicks) * 100 : 0;
  const reachBonus = reachRatio * 0.20 * volumeMultiplier;

  // 4. Return Bonus (return clickers / unique clickers)
  // Max 20 points at full volume
  const returnRatio = uniqueClickers > 0 ? (returnClickers / uniqueClickers) * 100 : 0;
  const returnBonus = returnRatio * 0.20 * volumeMultiplier;

  // 5. Recency Bonus - decays over time
  // Max 10 points at full volume
  let recencyScore: number;
  if (daysSinceLastClick <= 1) recencyScore = 100;
  else if (daysSinceLastClick <= 3) recencyScore = 90;
  else if (daysSinceLastClick <= 7) recencyScore = 70;
  else if (daysSinceLastClick <= 14) recencyScore = 50;
  else if (daysSinceLastClick <= 30) recencyScore = 30;
  else if (daysSinceLastClick <= 60) recencyScore = 15;
  else recencyScore = 5;
  const recencyBonus = recencyScore * 0.10 * volumeMultiplier;

  // 6. Velocity Bonus - week-over-week growth
  // Max 10 points at full volume (only for established links)
  let velocityScore: number;
  if (clicksLastWeek === 0) {
    // New link - no velocity bonus (don't reward just being new)
    velocityScore = 0;
  } else {
    const ratio = clicksThisWeek / clicksLastWeek;
    if (ratio >= 2.0) velocityScore = 100;      // Doubling
    else if (ratio >= 1.5) velocityScore = 80;  // Growing fast
    else if (ratio >= 1.0) velocityScore = 50;  // Stable or growing
    else if (ratio >= 0.5) velocityScore = 20;  // Declining
    else velocityScore = 5;                      // Dying
  }
  const velocityBonus = velocityScore * 0.10 * volumeMultiplier;

  // Final score = Base volume + gated bonuses
  const finalScore = Math.round(volumeScore + reachBonus + returnBonus + recencyBonus + velocityBonus);

  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Calculate Track Site Viewer Score (0-100) for individual session
 *
 * Added December 11, 2025
 *
 * Unlike Files which have rich engagement data (time, completion, downloads),
 * Track Sites only have basic signals since viewers redirect away immediately.
 *
 * Formula:
 * - Return Score (60% weight): Did they come back?
 * - Frequency Score (40% weight): How many times have they clicked?
 */
export function calculateTrackSiteViewerScore(params: {
  isReturnVisit: boolean;
  returnVisitCount: number;
}): number {
  const { isReturnVisit, returnVisitCount } = params;

  // 1. Return Score (60% weight)
  // First-time visitor = 0, Return visitor = 100
  const returnScore = isReturnVisit ? 100 : 0;

  // 2. Frequency Score (40% weight)
  // 1 click = 33, 2 clicks = 66, 3+ clicks = 100
  const totalClicks = returnVisitCount + 1; // returnVisitCount is previous visits, +1 for current
  const frequencyScore = Math.min(100, totalClicks * 33);

  // Calculate final weighted score
  const viewerScore = Math.round(
    (returnScore * 0.60) +
    (frequencyScore * 0.40)
  );

  return Math.min(100, Math.max(0, viewerScore));
}

/**
 * Calculate Track Site Link-Level Score from aggregate data
 * Used for Dashboard and Detail Page "Engage" stat
 *
 * This is different from individual viewer scores - it measures
 * how well the LINK is performing overall.
 */
export function calculateTrackSiteLinkScore(params: TrackSiteScoreParams): number {
  // Just call the existing calculateTrackSiteScore function
  return calculateTrackSiteScore(params);
}

/**
 * Determine intent signal based on engagement score
 * Works for both File Engagement and Track Site scores
 * - Hot (🔥): 70+ - High intent, priority for follow-up
 * - Warm (🟡): 40-69 - Medium intent
 * - Cold (⚪): <40 - Low intent
 */
export function getIntentSignal(engagementScore: number): 'hot' | 'warm' | 'cold' {
  if (engagementScore >= 70) return 'hot';
  if (engagementScore >= 40) return 'warm';
  return 'cold';
}

/**
 * Enhanced hot lead detection (for Files only)
 * A viewer is marked as Hot Lead if:
 * - Engagement Score >= 80, OR
 * - Engagement Score >= 70 AND downloaded, OR
 * - Engagement Score >= 60 AND return_visit_count >= 2
 */
export function isHotLead(
  engagementScore: number,
  downloaded: boolean,
  returnVisitCount: number
): boolean {
  if (engagementScore >= 80) return true;
  if (engagementScore >= 70 && downloaded) return true;
  if (engagementScore >= 60 && returnVisitCount >= 2) return true;
  return false;
}

/**
 * Parse referrer URL into source category
 */
export function parseReferrerSource(referrer: string | null): string {
  if (!referrer) return 'direct';

  const url = referrer.toLowerCase();

  // Search engines
  if (url.includes('google.com') || url.includes('google.co')) return 'google';
  if (url.includes('bing.com')) return 'bing';
  if (url.includes('yahoo.com')) return 'yahoo';
  if (url.includes('duckduckgo.com')) return 'duckduckgo';

  // Social media
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) return 'twitter';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('pinterest.com')) return 'pinterest';

  // Messaging
  if (url.includes('slack.com')) return 'slack';
  if (url.includes('discord.com')) return 'discord';
  if (url.includes('t.me') || url.includes('telegram.')) return 'telegram';
  if (url.includes('whatsapp.com')) return 'whatsapp';

  // Email
  if (url.includes('mail.') || url.includes('outlook') || url.includes('gmail')) return 'email';

  // Productivity
  if (url.includes('notion.so')) return 'notion';
  if (url.includes('github.com')) return 'github';

  return 'other';
}

/**
 * Detect access method (QR scan vs direct click)
 */
export function detectAccessMethod(
  referrer: string | null,
  utmMedium: string | null,
  userAgent: string | null
): string {
  // Check UTM medium first
  if (utmMedium === 'qr') return 'qr_scan';

  // Check user agent for QR scanner apps
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('scanner') || ua.includes('qr')) return 'qr_scan';
  }

  return 'direct_click';
}

/**
 * Parse company name from email domain
 */
export function parseCompanyFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;

  const domain = email.split('@')[1];
  if (!domain) return null;

  // Remove common email provider domains
  const genericDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
    'live.com', 'msn.com', 'ymail.com', 'googlemail.com'
  ];

  if (genericDomains.includes(domain.toLowerCase())) {
    return null;
  }

  // Extract company name from domain
  const parts = domain.split('.');
  if (parts.length >= 2) {
    // Capitalize first letter
    const name = parts[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return null;
}

// =============================================
// CONTENT HEALTH SCORE (Per File)
// =============================================

interface ContentHealthParams {
  avgEngagement: number;      // Average engagement score of all viewers
  completionRate: number;     // % of viewers who saw last page
  returnRate: number;         // % of viewers who returned
  actionRate: number;         // % of viewers who downloaded
}

/**
 * Calculate Content Health Score for a file
 *
 * Formula:
 * - Avg Engagement (40% weight)
 * - Completion Rate (30% weight)
 * - Return Rate (20% weight)
 * - Action Rate (10% weight)
 */
export function calculateContentHealthScore(params: ContentHealthParams): number {
  const { avgEngagement, completionRate, returnRate, actionRate } = params;

  const healthScore = Math.round(
    (avgEngagement * 0.4) +
    (completionRate * 0.3) +
    (returnRate * 0.2) +
    (actionRate * 0.1)
  );

  return Math.min(100, Math.max(0, healthScore));
}

// =============================================
// DOMAIN HEALTH SCORE
// =============================================

interface DomainHealthParams {
  avgContentHealth: number;   // Average content health across files
  viewsLast7Days: number;     // Views in last 7 days
  totalLinks: number;         // Total number of links
  viewsThisWeek: number;      // Views this week
  viewsLastWeek: number;      // Views last week
}

export function calculateDomainHealthScore(params: DomainHealthParams): number {
  const { avgContentHealth, viewsLast7Days, totalLinks, viewsThisWeek, viewsLastWeek } = params;

  // Activity Score
  const activityScore = Math.min(100, (viewsLast7Days / Math.max(1, totalLinks)) * 10);

  // Growth Score
  let growthScore = 50; // neutral
  if (viewsLastWeek > 0) {
    const growth = ((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100;
    growthScore = Math.max(0, Math.min(100, 50 + growth));
  }

  // Formula: (Avg Content Health × 0.5) + (Activity Score × 0.3) + (Growth Score × 0.2)
  const domainHealth = Math.round(
    (avgContentHealth * 0.5) +
    (activityScore * 0.3) +
    (growthScore * 0.2)
  );

  return Math.min(100, Math.max(0, domainHealth));
}

// =============================================
// PAGE DROP-OFF ANALYSIS
// =============================================

interface PageDropOff {
  page: number;
  viewers: number;
  dropOffRate: number;
  dropOffCount: number;
}

export function calculatePageDropOff(exitPages: number[], totalViewers: number, totalPages: number): PageDropOff[] {
  const dropOffs: PageDropOff[] = [];

  // Count how many exited at each page
  const exitCounts: Record<number, number> = {};
  exitPages.forEach(page => {
    exitCounts[page] = (exitCounts[page] || 0) + 1;
  });

  let remainingViewers = totalViewers;

  for (let page = 1; page <= totalPages; page++) {
    const droppedHere = exitCounts[page] || 0;
    const dropOffRate = remainingViewers > 0 ? (droppedHere / remainingViewers) * 100 : 0;

    dropOffs.push({
      page,
      viewers: remainingViewers,
      dropOffRate: Math.round(dropOffRate * 10) / 10,
      dropOffCount: droppedHere
    });

    remainingViewers -= droppedHere;
  }

  return dropOffs;
}

// =============================================
// PAGE HEATMAP SCORES
// =============================================

interface PageHeatmap {
  page: number;
  totalTime: number;
  avgTime: number;
  heatScore: number;  // 0-100 relative to hottest page
  heatLevel: 'hot' | 'medium' | 'cool' | 'cold';
}

export function calculatePageHeatmap(pagesTimeDataArray: Record<string, number>[], totalPages: number): PageHeatmap[] {
  // Aggregate time across all viewers
  const pageTotals: Record<number, { totalTime: number; viewCount: number }> = {};

  pagesTimeDataArray.forEach(viewerData => {
    Object.entries(viewerData).forEach(([pageStr, time]) => {
      const page = parseInt(pageStr);
      if (!pageTotals[page]) {
        pageTotals[page] = { totalTime: 0, viewCount: 0 };
      }
      pageTotals[page].totalTime += time;
      pageTotals[page].viewCount += 1;
    });
  });

  // Find max time for scaling
  const maxTime = Math.max(...Object.values(pageTotals).map(p => p.totalTime), 1);

  // Build heatmap
  const heatmap: PageHeatmap[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const data = pageTotals[page] || { totalTime: 0, viewCount: 0 };
    const avgTime = data.viewCount > 0 ? Math.round(data.totalTime / data.viewCount) : 0;
    const heatScore = Math.round((data.totalTime / maxTime) * 100);

    let heatLevel: 'hot' | 'medium' | 'cool' | 'cold';
    if (heatScore >= 80) heatLevel = 'hot';
    else if (heatScore >= 50) heatLevel = 'medium';
    else if (heatScore >= 20) heatLevel = 'cool';
    else heatLevel = 'cold';

    heatmap.push({
      page,
      totalTime: data.totalTime,
      avgTime,
      heatScore,
      heatLevel
    });
  }

  return heatmap;
}

// =============================================
// BEST TIME TO SHARE
// =============================================

interface TimeAnalysis {
  bestDays: string[];
  bestHours: string[];
  recommendation: string;
}

export function calculateBestTimeToShare(accessedAtTimes: string[]): TimeAnalysis {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Count views by day and hour
  const dayCounts: Record<number, number> = {};
  const hourCounts: Record<number, number> = {};

  accessedAtTimes.forEach(timestamp => {
    const date = new Date(timestamp);
    const day = date.getDay();
    const hour = date.getHours();

    dayCounts[day] = (dayCounts[day] || 0) + 1;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // Sort and get top 2 days
  const sortedDays = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([day]) => dayNames[parseInt(day)]);

  // Sort and get top 3 hours, then find range
  const sortedHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))
    .sort((a, b) => a - b);

  // Format hours
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  const bestHours = sortedHours.length > 0
    ? [`${formatHour(sortedHours[0])}-${formatHour(sortedHours[sortedHours.length - 1] + 1)}`]
    : ['No data'];

  // Build recommendation
  const recommendation = sortedDays.length > 0 && sortedHours.length > 0
    ? `Best time to share: ${sortedDays.join(' & ')}, ${bestHours[0]}`
    : 'Not enough data for recommendations';

  return {
    bestDays: sortedDays,
    bestHours,
    recommendation
  };
}

// =============================================
// CONTACT RANKING SCORE
// =============================================

interface ContactScoreParams {
  totalViews: number;
  avgEngagement: number;
  lastSeenAt: string;
  filesViewedCount: number;
}

export function calculateContactScore(params: ContactScoreParams): number {
  const { totalViews, avgEngagement, lastSeenAt, filesViewedCount } = params;

  // Recency Score
  const daysSinceLastView = Math.floor(
    (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  let recencyScore: number;
  if (daysSinceLastView <= 7) recencyScore = 100;
  else if (daysSinceLastView <= 30) recencyScore = 70;
  else if (daysSinceLastView <= 90) recencyScore = 40;
  else recencyScore = 10;

  // Views Score (cap at 100)
  const viewsScore = Math.min(100, totalViews * 10);

  // Files Score (cap at 100)
  const filesScore = Math.min(100, filesViewedCount * 20);

  // Formula: (Views × 0.2) + (Engagement × 0.4) + (Recency × 0.2) + (Files × 0.2)
  const contactScore = Math.round(
    (viewsScore * 0.2) +
    (avgEngagement * 0.4) +
    (recencyScore * 0.2) +
    (filesScore * 0.2)
  );

  return Math.min(100, Math.max(0, contactScore));
}

// =============================================
// VIRALITY SCORE
// =============================================

export function calculateViralityScore(viewerEmails: string[]): { score: number; companies: Record<string, number> } {
  // Group by email domain (company)
  const companies: Record<string, number> = {};

  viewerEmails.forEach(email => {
    if (!email) return;
    const domain = email.split('@')[1];
    if (domain) {
      companies[domain] = (companies[domain] || 0) + 1;
    }
  });

  const companyCount = Object.keys(companies).length;
  const totalViewers = viewerEmails.filter(Boolean).length;

  // Average viewers per company
  const avgViewersPerCompany = companyCount > 0 ? totalViewers / companyCount : 0;

  // Score: >3 = high, 1.5-3 = medium, <1.5 = low
  // Convert to 0-100 scale
  const score = Math.min(100, Math.round(avgViewersPerCompany * 25));

  return { score, companies };
}

// =============================================
// TOP/UNDER PERFORMERS
// =============================================

interface FilePerformance {
  fileId: string;
  fileName: string;
  healthScore: number;
  totalViews: number;
}

export function getTopPerformers(files: FilePerformance[], limit: number = 5): FilePerformance[] {
  return [...files]
    .filter(f => f.totalViews >= 5) // Minimum views for statistical relevance
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, limit);
}

export function getUnderPerformers(files: FilePerformance[], limit: number = 5): FilePerformance[] {
  return [...files]
    .filter(f => f.totalViews >= 5) // Minimum views for statistical relevance
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, limit);
}

// =============================================
// TRAFFIC SOURCE BREAKDOWN
// =============================================

interface TrafficBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export function calculateTrafficBreakdown(referrerSources: string[]): TrafficBreakdown[] {
  const counts: Record<string, number> = {};

  referrerSources.forEach(source => {
    counts[source] = (counts[source] || 0) + 1;
  });

  const total = referrerSources.length;

  return Object.entries(counts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// =============================================
// DEVICE BREAKDOWN
// =============================================

export function calculateDeviceBreakdown(deviceTypes: string[]): TrafficBreakdown[] {
  const counts: Record<string, number> = {};

  deviceTypes.forEach(device => {
    counts[device || 'unknown'] = (counts[device || 'unknown'] || 0) + 1;
  });

  const total = deviceTypes.length;

  return Object.entries(counts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// =============================================
// GEOGRAPHY BREAKDOWN
// =============================================

export function calculateGeographyBreakdown(countries: string[]): TrafficBreakdown[] {
  const counts: Record<string, number> = {};

  countries.forEach(country => {
    counts[country || 'Unknown'] = (counts[country || 'Unknown'] || 0) + 1;
  });

  const total = countries.length;

  return Object.entries(counts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}
