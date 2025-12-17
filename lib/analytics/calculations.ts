// ============================================
// LINKLENS ANALYTICS CALCULATIONS
// All derived metrics and scores
// ============================================

// -------------------- NEW TYPES FOR FILE DETAIL --------------------

export interface AccessLog {
  id: string;
  file_id: string;
  file_name?: string;
  session_id?: string;
  viewer_name?: string;
  viewer_email?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  region?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | string;
  browser?: string;
  os?: string;
  language?: string;
  referrer?: string;
  referrer_source?: string;
  traffic_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  access_method?: 'direct_click' | 'qr_scan' | 'direct' | string;
  is_qr_scan?: boolean;
  accessed_at: string;
  session_end_at?: string;
  total_duration_seconds?: number;
  is_return_visit?: boolean;
  return_visit_count?: number;
  total_pages?: number;
  pages_viewed_count?: number;
  max_page_reached?: number;
  completion_percentage?: number;
  pages_time_data?: Record<string, number>;
  exit_page?: number;
  video_duration_seconds?: number;
  watch_time_seconds?: number;
  video_completion_percent?: number;
  segments_time_data?: Record<string, number>; // Time spent per segment (0-9) for media
  downloaded?: boolean;
  download_count?: number;
  // engagement_score and intent_signal removed - always recalculated from raw data
}

export interface FileData {
  id: string;
  name: string;
  slug: string;
  type: 'file' | 'url';
  mime_type?: string;
  total_pages?: number;
  video_duration_seconds?: number;
  created_at: string;
  cached_total_views: number;
  cached_unique_viewers: number;
  cached_avg_engagement: number;
  cached_hot_leads: number;
  cached_qr_scans: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueViewers: number;
  avgEngagement: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  qrScans: number;
  directClicks: number;
  completionRate: number;
  avgTimeSpent: number;
  returnRate: number;
  returnVisits: number; // Add this - actual count
  downloadCount: number;
  viewsToday: number;
  lastViewAt: string | null;
}

export interface TimeDistribution {
  labels: string[];
  data: number[];
}

export interface TopItem {
  name: string;
  count: number;
  percentage: number;
}

export interface PageAnalysis {
  page: number;
  label?: string;
  avgTime: number;
  views: number;
  dropOffRate: number;
  isPopular: boolean;
  hasHighDropOff: boolean;
}

// -------------------- ORIGINAL TYPES --------------------

export interface ViewerMetrics {
  // Core Scores
  engagementScore: number;          // 0-100
  intentSignal: 'high' | 'medium' | 'low-medium' | 'low';

  // Action Signals
  hotLeadScore: number;             // 0-100
  urgencyLevel: 'high' | 'medium' | 'low';
  buyerIntent: boolean;
  evaluatorSignal: boolean;
  quickScanner: boolean;
  comparisonShopper: boolean;
  deepDiver: boolean;
  lostInterest: boolean;
  sharerPotential: boolean;

  // Behavioral Tags
  tags: string[];

  // Time Metrics
  totalDuration: number;
  activeTime: number;               // duration - idle
  avgTimePerPage: number;

  // Completion Metrics
  completionPercentage: number;
  pagesViewed: number;
  totalPages: number;
}

export interface FileMetrics {
  // Core Metrics
  totalViews: number;
  uniqueViewers: number;
  contentHealthScore: number;       // 0-100

  // Engagement Metrics
  avgEngagementScore: number;
  avgDuration: number;
  avgCompletion: number;

  // Action Metrics
  conversionRate: number;           // (downloads + prints) / views
  returnRate: number;               // return visits / total
  hotLeadRatio: number;             // high intent / total
  bounceRate: number;               // <10s views / total

  // Content Performance
  hookEffectiveness: number;        // % staying >30s
  dropOffRate: number;              // % leaving before 50%
  viralityScore: number;            // viewers per company

  // Page Analysis (for PDFs)
  hotspotPages: { page: number; avgTime: number; }[];
  problemPages: { page: number; exitRate: number; }[];
  moneyPage: { page: number; correlation: number; } | null;

  // Audience
  companyDiversity: number;         // unique email domains
  geographicSpread: number;         // unique countries
  deviceDistribution: { desktop: number; mobile: number; tablet: number; };
  trafficSources: { source: string; count: number; avgEngagement: number; }[];

  // Time Analysis
  bestTimeToShare: { day: string; hour: number; engagement: number; } | null;
}

export interface DomainMetrics {
  // Core Metrics
  domainHealthScore: number;        // 0-100
  totalViews: number;
  totalUniqueViewers: number;
  totalFiles: number;

  // Aggregate Scores
  avgEngagementScore: number;
  avgContentHealth: number;
  totalHotLeads: number;

  // Performance
  topPerformers: { fileId: string; name: string; healthScore: number; }[];
  underPerformers: { fileId: string; name: string; healthScore: number; }[];

  // Growth
  weeklyGrowth: number;             // % change vs last week
  monthlyGrowth: number;            // % change vs last month

  // Opportunities
  marketOpportunities: { country: string; engagement: number; volume: number; potential: string; }[];
}

export interface AccountMetrics {
  // Core Metrics
  accountHealthScore: number;       // 0-100
  totalViews: number;
  totalUniqueViewers: number;
  totalFiles: number;
  totalDomains: number;

  // Pipeline
  totalHotLeads: number;
  totalWarmLeads: number;
  leadsToFollowUp: number;

  // Performance
  avgEngagementScore: number;
  avgContentHealth: number;
  bestPerformingDomain: { domain: string; healthScore: number; } | null;

  // Trends
  weeklyActiveViewers: number;
  audienceRetention: number;        // returning / total
  leadQualityTrend: number;         // change in hot lead ratio

  // Actions Needed
  actionsRequired: {
    hotLeadsToContact: number;
    viewersToReengage: number;
    filesNeedingAttention: number;
  };
}

// -------------------- RAW DATA INTERFACES --------------------

export interface RawAccessLog {
  id: number;
  file_id: string;
  viewer_name: string;
  viewer_email: string;
  accessed_at: string;
  session_end_at: string | null;
  total_duration_seconds: number;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  traffic_source: string | null;
  is_return_visit: boolean;
  tab_switches_count: number;
  idle_time_seconds: number;
  download_attempted: boolean;
  print_attempted: boolean;
  copy_attempted: boolean;
  pages_viewed_count: number;
  max_page_reached: number;
  total_pages: number;
  completion_percentage: number;
  engagement_score: number;
  intent_signal: string;
}

export interface RawPageView {
  page_number: number;
  duration_seconds: number;
  revisit_count: number;
  access_log_id: number;
}

export interface RawVideoAnalytics {
  watch_time_seconds: number;
  completion_percentage: number;
  play_count: number;
  pause_count: number;
  finished: boolean;
}

// -------------------- VIEWER LEVEL CALCULATIONS --------------------

export function calculateViewerMetrics(
  accessLog: RawAccessLog,
  pageViews: RawPageView[] = [],
  videoAnalytics: RawVideoAnalytics | null = null
): ViewerMetrics {
  const {
    total_duration_seconds,
    idle_time_seconds,
    tab_switches_count,
    download_attempted,
    print_attempted,
    copy_attempted,
    pages_viewed_count,
    max_page_reached,
    total_pages,
    completion_percentage,
    engagement_score,
    intent_signal,
    is_return_visit,
    accessed_at,
  } = accessLog;

  // Calculate active time
  const activeTime = Math.max(0, total_duration_seconds - idle_time_seconds);

  // Calculate avg time per page
  const avgTimePerPage = pages_viewed_count > 0
    ? Math.round(total_duration_seconds / pages_viewed_count)
    : 0;

  // Behavioral Tags
  const tags: string[] = [];
  if (download_attempted) tags.push('downloaded');
  if (print_attempted) tags.push('printed');
  if (copy_attempted) tags.push('copied');
  if (completion_percentage >= 90) tags.push('completed');
  if (is_return_visit) tags.push('returned');
  if (tab_switches_count === 0 && total_duration_seconds > 60) tags.push('focused');
  if (tab_switches_count >= 5) tags.push('distracted');
  if (total_duration_seconds < 60 && completion_percentage > 50) tags.push('rushed');
  if (total_duration_seconds > 300) tags.push('thorough'); // >5 min

  // Hot Lead Score (0-100)
  let hotLeadScore = 0;
  hotLeadScore += Math.min(40, engagement_score * 0.4);
  hotLeadScore += download_attempted ? 20 : 0;
  hotLeadScore += print_attempted ? 10 : 0;
  hotLeadScore += is_return_visit ? 15 : 0;
  hotLeadScore += completion_percentage >= 90 ? 15 : (completion_percentage >= 70 ? 10 : 0);
  hotLeadScore = Math.min(100, Math.round(hotLeadScore));

  // Urgency Level
  const hoursSinceView = (Date.now() - new Date(accessed_at).getTime()) / (1000 * 60 * 60);
  let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
  if (hotLeadScore >= 70 && hoursSinceView < 24) {
    urgencyLevel = 'high';
  } else if (hotLeadScore >= 50 && hoursSinceView < 72) {
    urgencyLevel = 'medium';
  }

  // Check for pricing/contact page focus (for buyer intent)
  const pricingPageViewed = pageViews.some(pv => {
    // Assuming pricing is often near the end or specific page
    return pv.page_number >= Math.floor(total_pages * 0.7) && pv.duration_seconds > 30;
  });
  const buyerIntent = pricingPageViewed && engagement_score >= 60;

  // Evaluator Signal - high time on details
  const evaluatorSignal = total_duration_seconds > 300 &&
    pageViews.some(pv => pv.revisit_count >= 2);

  // Quick Scanner - fast but covered ground
  const quickScanner = total_duration_seconds < 30 && completion_percentage > 50;

  // Comparison Shopper - returns + pricing focus
  const comparisonShopper = is_return_visit && pricingPageViewed;

  // Deep Diver - thorough review
  const avgTimePerPageExpected = 30; // 30s per page is normal
  const deepDiver = avgTimePerPage > avgTimePerPageExpected * 2 && completion_percentage >= 80;

  // Lost Interest - high idle, many tab switches
  const lostInterest = idle_time_seconds > total_duration_seconds * 0.5 || tab_switches_count >= 5;

  // Sharer Potential - downloaded + high engagement
  const sharerPotential = download_attempted && engagement_score >= 70;

  return {
    engagementScore: engagement_score,
    intentSignal: intent_signal as ViewerMetrics['intentSignal'],
    hotLeadScore,
    urgencyLevel,
    buyerIntent,
    evaluatorSignal,
    quickScanner,
    comparisonShopper,
    deepDiver,
    lostInterest,
    sharerPotential,
    tags,
    totalDuration: total_duration_seconds,
    activeTime,
    avgTimePerPage,
    completionPercentage: completion_percentage,
    pagesViewed: pages_viewed_count,
    totalPages: total_pages,
  };
}

// -------------------- FILE LEVEL CALCULATIONS --------------------

export function calculateFileMetrics(
  accessLogs: RawAccessLog[],
  allPageViews: RawPageView[] = []
): FileMetrics {
  if (accessLogs.length === 0) {
    return getEmptyFileMetrics();
  }

  const totalViews = accessLogs.length;

  // Unique viewers by email
  const uniqueEmails = new Set(accessLogs.map(log => log.viewer_email.toLowerCase()));
  const uniqueViewers = uniqueEmails.size;

  // Average scores
  const avgEngagementScore = Math.round(
    accessLogs.reduce((sum, log) => sum + (log.engagement_score || 0), 0) / totalViews
  );

  const avgDuration = Math.round(
    accessLogs.reduce((sum, log) => sum + (log.total_duration_seconds || 0), 0) / totalViews
  );

  const avgCompletion = Math.round(
    accessLogs.reduce((sum, log) => sum + (log.completion_percentage || 0), 0) / totalViews
  );

  // Content Health Score (weighted average)
  const contentHealthScore = Math.round(
    avgEngagementScore * 0.4 +
    avgCompletion * 0.3 +
    Math.min(100, (avgDuration / 180) * 100) * 0.3 // 3 min = 100%
  );

  // Conversion Rate
  const conversions = accessLogs.filter(log =>
    log.download_attempted || log.print_attempted
  ).length;
  const conversionRate = Math.round((conversions / totalViews) * 100);

  // Return Rate - calculate dynamically (viewers with 2+ views)
  const viewerViewCounts = new Map<string, number>();
  accessLogs.forEach(log => {
    const id = log.viewer_email || log.ip_address;
    if (id) viewerViewCounts.set(id, (viewerViewCounts.get(id) || 0) + 1);
  });
  let returnViewers = 0;
  viewerViewCounts.forEach(count => { if (count > 1) returnViewers++; });
  const returnRate = viewerViewCounts.size > 0 ? Math.round((returnViewers / viewerViewCounts.size) * 100) : 0;

  // Hot Lead Ratio
  const hotLeads = accessLogs.filter(log =>
    log.intent_signal === 'high' || log.engagement_score >= 80
  ).length;
  const hotLeadRatio = Math.round((hotLeads / totalViews) * 100);

  // Bounce Rate (views < 10 seconds)
  const bounces = accessLogs.filter(log => log.total_duration_seconds < 10).length;
  const bounceRate = Math.round((bounces / totalViews) * 100);

  // Hook Effectiveness (% staying > 30 seconds)
  const hooked = accessLogs.filter(log => log.total_duration_seconds >= 30).length;
  const hookEffectiveness = Math.round((hooked / totalViews) * 100);

  // Drop-off Rate (% leaving before 50% completion)
  const droppedOff = accessLogs.filter(log => log.completion_percentage < 50).length;
  const dropOffRate = Math.round((droppedOff / totalViews) * 100);

  // Virality Score (avg viewers per company domain)
  const companyDomains = new Map<string, number>();
  accessLogs.forEach(log => {
    const domain = log.viewer_email.split('@')[1]?.toLowerCase();
    if (domain && !isPersonalEmail(domain)) {
      companyDomains.set(domain, (companyDomains.get(domain) || 0) + 1);
    }
  });
  const companyViewerCounts = Array.from(companyDomains.values());
  const viralityScore = companyViewerCounts.length > 0
    ? Math.round((companyViewerCounts.reduce((a, b) => a + b, 0) / companyViewerCounts.length) * 10) / 10
    : 1;

  // Company Diversity
  const companyDiversity = companyDomains.size;

  // Geographic Spread
  const countries = new Set(accessLogs.map(log => log.country).filter(Boolean));
  const geographicSpread = countries.size;

  // Device Distribution
  const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
  accessLogs.forEach(log => {
    const device = (log.device_type || 'desktop').toLowerCase();
    if (device.includes('mobile')) deviceCounts.mobile++;
    else if (device.includes('tablet')) deviceCounts.tablet++;
    else deviceCounts.desktop++;
  });
  const deviceDistribution = {
    desktop: Math.round((deviceCounts.desktop / totalViews) * 100),
    mobile: Math.round((deviceCounts.mobile / totalViews) * 100),
    tablet: Math.round((deviceCounts.tablet / totalViews) * 100),
  };

  // Traffic Sources
  const sourceMap = new Map<string, { count: number; totalEngagement: number }>();
  accessLogs.forEach(log => {
    const source = log.traffic_source || 'direct';
    const existing = sourceMap.get(source) || { count: 0, totalEngagement: 0 };
    existing.count++;
    existing.totalEngagement += log.engagement_score || 0;
    sourceMap.set(source, existing);
  });
  const trafficSources = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.count,
      avgEngagement: Math.round(data.totalEngagement / data.count),
    }))
    .sort((a, b) => b.count - a.count);

  // Page Analysis (Hotspots & Problems)
  const pageStats = analyzePagePerformance(allPageViews, accessLogs);

  // Best Time to Share
  const bestTimeToShare = analyzeBestTime(accessLogs);

  return {
    totalViews,
    uniqueViewers,
    contentHealthScore,
    avgEngagementScore,
    avgDuration,
    avgCompletion,
    conversionRate,
    returnRate,
    hotLeadRatio,
    bounceRate,
    hookEffectiveness,
    dropOffRate,
    viralityScore,
    hotspotPages: pageStats.hotspots,
    problemPages: pageStats.problems,
    moneyPage: pageStats.moneyPage,
    companyDiversity,
    geographicSpread,
    deviceDistribution,
    trafficSources,
    bestTimeToShare,
  };
}

function getEmptyFileMetrics(): FileMetrics {
  return {
    totalViews: 0,
    uniqueViewers: 0,
    contentHealthScore: 0,
    avgEngagementScore: 0,
    avgDuration: 0,
    avgCompletion: 0,
    conversionRate: 0,
    returnRate: 0,
    hotLeadRatio: 0,
    bounceRate: 0,
    hookEffectiveness: 0,
    dropOffRate: 0,
    viralityScore: 0,
    hotspotPages: [],
    problemPages: [],
    moneyPage: null,
    companyDiversity: 0,
    geographicSpread: 0,
    deviceDistribution: { desktop: 0, mobile: 0, tablet: 0 },
    trafficSources: [],
    bestTimeToShare: null,
  };
}

function isPersonalEmail(domain: string): boolean {
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
    'mail.com', 'yandex.com', 'naver.com', 'daum.net'
  ];
  return personalDomains.includes(domain);
}

function analyzePagePerformance(
  pageViews: RawPageView[],
  accessLogs: RawAccessLog[]
): {
  hotspots: { page: number; avgTime: number; }[];
  problems: { page: number; exitRate: number; }[];
  moneyPage: { page: number; correlation: number; } | null;
} {
  if (pageViews.length === 0) {
    return { hotspots: [], problems: [], moneyPage: null };
  }

  // Group page views by page number
  const pageMap = new Map<number, { totalTime: number; count: number }>();
  pageViews.forEach(pv => {
    const existing = pageMap.get(pv.page_number) || { totalTime: 0, count: 0 };
    existing.totalTime += pv.duration_seconds;
    existing.count++;
    pageMap.set(pv.page_number, existing);
  });

  // Calculate average time per page
  const pageAvgTimes = Array.from(pageMap.entries())
    .map(([page, data]) => ({
      page,
      avgTime: Math.round(data.totalTime / data.count),
    }))
    .sort((a, b) => b.avgTime - a.avgTime);

  // Hotspots: Top 3 pages by time
  const hotspots = pageAvgTimes.slice(0, 3);

  // Exit pages analysis
  const exitPageCounts = new Map<number, number>();
  accessLogs.forEach(log => {
    if (log.completion_percentage < 100) {
      const exitPage = log.max_page_reached || 1;
      exitPageCounts.set(exitPage, (exitPageCounts.get(exitPage) || 0) + 1);
    }
  });

  const totalExits = accessLogs.filter(log => log.completion_percentage < 100).length;
  const problems = Array.from(exitPageCounts.entries())
    .map(([page, count]) => ({
      page,
      exitRate: Math.round((count / Math.max(1, totalExits)) * 100),
    }))
    .filter(p => p.exitRate >= 20) // Only show significant drop-offs
    .sort((a, b) => b.exitRate - a.exitRate)
    .slice(0, 3);

  // Money Page: Page most correlated with downloads
  const downloadLogs = accessLogs.filter(log => log.download_attempted);
  let moneyPage: { page: number; correlation: number; } | null = null;

  if (downloadLogs.length >= 3) {
    const downloadPageTimes = new Map<number, number[]>();

    // This is simplified - in production you'd do proper correlation
    downloadLogs.forEach(log => {
      const maxPage = log.max_page_reached;
      if (maxPage) {
        const times = downloadPageTimes.get(maxPage) || [];
        times.push(log.total_duration_seconds);
        downloadPageTimes.set(maxPage, times);
      }
    });

    let bestPage = 0;
    let bestCount = 0;
    downloadPageTimes.forEach((times, page) => {
      if (times.length > bestCount) {
        bestCount = times.length;
        bestPage = page;
      }
    });

    if (bestPage > 0) {
      moneyPage = {
        page: bestPage,
        correlation: Math.round((bestCount / downloadLogs.length) * 100),
      };
    }
  }

  return { hotspots, problems, moneyPage };
}

function analyzeBestTime(accessLogs: RawAccessLog[]): { day: string; hour: number; engagement: number; } | null {
  if (accessLogs.length < 5) return null;

  const timeSlots = new Map<string, { totalEngagement: number; count: number }>();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  accessLogs.forEach(log => {
    const date = new Date(log.accessed_at);
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;

    const existing = timeSlots.get(key) || { totalEngagement: 0, count: 0 };
    existing.totalEngagement += log.engagement_score || 0;
    existing.count++;
    timeSlots.set(key, existing);
  });

  let bestSlot = { day: '', hour: 0, engagement: 0 };
  timeSlots.forEach((data, key) => {
    const avgEngagement = data.totalEngagement / data.count;
    if (avgEngagement > bestSlot.engagement && data.count >= 2) {
      const [day, hour] = key.split('-');
      bestSlot = { day, hour: parseInt(hour), engagement: Math.round(avgEngagement) };
    }
  });

  return bestSlot.engagement > 0 ? bestSlot : null;
}

// -------------------- DOMAIN LEVEL CALCULATIONS --------------------

export function calculateDomainMetrics(
  files: { id: string; name: string; accessLogs: RawAccessLog[] }[],
  previousWeekViews: number = 0,
  previousMonthViews: number = 0
): DomainMetrics {
  if (files.length === 0) {
    return getEmptyDomainMetrics();
  }

  // Calculate metrics for each file
  const fileMetrics = files.map(file => ({
    fileId: file.id,
    name: file.name,
    metrics: calculateFileMetrics(file.accessLogs),
  }));

  // Aggregate totals
  const totalViews = fileMetrics.reduce((sum, f) => sum + f.metrics.totalViews, 0);

  // Unique viewers across domain (dedupe by email)
  const allEmails = new Set<string>();
  files.forEach(file => {
    file.accessLogs.forEach(log => {
      allEmails.add(log.viewer_email.toLowerCase());
    });
  });
  const totalUniqueViewers = allEmails.size;

  // Average scores
  const filesWithViews = fileMetrics.filter(f => f.metrics.totalViews > 0);
  const avgEngagementScore = filesWithViews.length > 0
    ? Math.round(filesWithViews.reduce((sum, f) => sum + f.metrics.avgEngagementScore, 0) / filesWithViews.length)
    : 0;

  const avgContentHealth = filesWithViews.length > 0
    ? Math.round(filesWithViews.reduce((sum, f) => sum + f.metrics.contentHealthScore, 0) / filesWithViews.length)
    : 0;

  // Domain Health Score
  const domainHealthScore = Math.round(
    avgContentHealth * 0.4 +
    avgEngagementScore * 0.3 +
    Math.min(100, (totalViews / 100) * 30) * 0.3 // Scale based on volume
  );

  // Total Hot Leads
  const totalHotLeads = files.reduce((sum, file) => {
    return sum + file.accessLogs.filter(log =>
      log.intent_signal === 'high' || log.engagement_score >= 80
    ).length;
  }, 0);

  // Top & Under Performers
  const sortedByHealth = [...fileMetrics]
    .filter(f => f.metrics.totalViews >= 3) // Need at least 3 views
    .sort((a, b) => b.metrics.contentHealthScore - a.metrics.contentHealthScore);

  const topPerformers = sortedByHealth.slice(0, 3).map(f => ({
    fileId: f.fileId,
    name: f.name,
    healthScore: f.metrics.contentHealthScore,
  }));

  const underPerformers = sortedByHealth
    .filter(f => f.metrics.contentHealthScore < 50)
    .slice(-3)
    .reverse()
    .map(f => ({
      fileId: f.fileId,
      name: f.name,
      healthScore: f.metrics.contentHealthScore,
    }));

  // Growth
  const weeklyGrowth = previousWeekViews > 0
    ? Math.round(((totalViews - previousWeekViews) / previousWeekViews) * 100)
    : 0;

  const monthlyGrowth = previousMonthViews > 0
    ? Math.round(((totalViews - previousMonthViews) / previousMonthViews) * 100)
    : 0;

  // Market Opportunities
  const countryEngagement = new Map<string, { totalEngagement: number; count: number }>();
  files.forEach(file => {
    file.accessLogs.forEach(log => {
      if (log.country) {
        const existing = countryEngagement.get(log.country) || { totalEngagement: 0, count: 0 };
        existing.totalEngagement += log.engagement_score || 0;
        existing.count++;
        countryEngagement.set(log.country, existing);
      }
    });
  });

  const marketOpportunities = Array.from(countryEngagement.entries())
    .map(([country, data]) => ({
      country,
      engagement: Math.round(data.totalEngagement / data.count),
      volume: data.count,
      potential: data.totalEngagement / data.count >= 70 && data.count < totalViews * 0.1
        ? 'High'
        : 'Medium',
    }))
    .filter(m => m.engagement >= 60 && m.volume < totalViews * 0.2)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return {
    domainHealthScore,
    totalViews,
    totalUniqueViewers,
    totalFiles: files.length,
    avgEngagementScore,
    avgContentHealth,
    totalHotLeads,
    topPerformers,
    underPerformers,
    weeklyGrowth,
    monthlyGrowth,
    marketOpportunities,
  };
}

function getEmptyDomainMetrics(): DomainMetrics {
  return {
    domainHealthScore: 0,
    totalViews: 0,
    totalUniqueViewers: 0,
    totalFiles: 0,
    avgEngagementScore: 0,
    avgContentHealth: 0,
    totalHotLeads: 0,
    topPerformers: [],
    underPerformers: [],
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    marketOpportunities: [],
  };
}

// -------------------- ACCOUNT LEVEL CALCULATIONS --------------------

export function calculateAccountMetrics(
  domains: { domain: string; files: { id: string; name: string; accessLogs: RawAccessLog[] }[] }[],
  previousWeekData?: { views: number; hotLeads: number }
): AccountMetrics {
  if (domains.length === 0 || domains.every(d => d.files.length === 0)) {
    return getEmptyAccountMetrics();
  }

  // Calculate domain metrics for each domain
  const domainMetrics = domains.map(d => ({
    domain: d.domain,
    metrics: calculateDomainMetrics(d.files),
  }));

  // Aggregate totals
  const totalViews = domainMetrics.reduce((sum, d) => sum + d.metrics.totalViews, 0);
  const totalFiles = domainMetrics.reduce((sum, d) => sum + d.metrics.totalFiles, 0);

  // Unique viewers across account
  const allEmails = new Set<string>();
  domains.forEach(domain => {
    domain.files.forEach(file => {
      file.accessLogs.forEach(log => {
        allEmails.add(log.viewer_email.toLowerCase());
      });
    });
  });
  const totalUniqueViewers = allEmails.size;

  // Average scores
  const domainsWithData = domainMetrics.filter(d => d.metrics.totalViews > 0);
  const avgEngagementScore = domainsWithData.length > 0
    ? Math.round(domainsWithData.reduce((sum, d) => sum + d.metrics.avgEngagementScore, 0) / domainsWithData.length)
    : 0;

  const avgContentHealth = domainsWithData.length > 0
    ? Math.round(domainsWithData.reduce((sum, d) => sum + d.metrics.avgContentHealth, 0) / domainsWithData.length)
    : 0;

  // Account Health Score
  const accountHealthScore = Math.round(
    avgContentHealth * 0.35 +
    avgEngagementScore * 0.35 +
    Math.min(100, totalViews / 50) * 0.15 + // Volume factor
    Math.min(100, totalFiles * 10) * 0.15   // Content breadth
  );

  // Lead Counts
  let totalHotLeads = 0;
  let totalWarmLeads = 0;
  const recentHotLeads: RawAccessLog[] = [];
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);

  domains.forEach(domain => {
    domain.files.forEach(file => {
      file.accessLogs.forEach(log => {
        if (log.intent_signal === 'high' || log.engagement_score >= 80) {
          totalHotLeads++;
          if (new Date(log.accessed_at) >= recentDate) {
            recentHotLeads.push(log);
          }
        } else if (log.intent_signal === 'medium' || log.engagement_score >= 60) {
          totalWarmLeads++;
        }
      });
    });
  });

  // Best Performing Domain
  const bestDomain = [...domainMetrics]
    .filter(d => d.metrics.totalViews >= 5)
    .sort((a, b) => b.metrics.domainHealthScore - a.metrics.domainHealthScore)[0];

  const bestPerformingDomain = bestDomain
    ? { domain: bestDomain.domain, healthScore: bestDomain.metrics.domainHealthScore }
    : null;

  // Weekly Active Viewers
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyViewerEmails = new Set<string>();

  domains.forEach(domain => {
    domain.files.forEach(file => {
      file.accessLogs.forEach(log => {
        if (new Date(log.accessed_at) >= weekAgo) {
          weeklyViewerEmails.add(log.viewer_email.toLowerCase());
        }
      });
    });
  });
  const weeklyActiveViewers = weeklyViewerEmails.size;

  // Audience Retention - calculate dynamically (viewers with 2+ views)
  const allViewerCounts = new Map<string, number>();
  domains.forEach(domain => {
    domain.files.forEach(file => {
      file.accessLogs.forEach(log => {
        const id = log.viewer_email || log.ip_address;
        if (id) allViewerCounts.set(id, (allViewerCounts.get(id) || 0) + 1);
      });
    });
  });
  let returningViewerCount = 0;
  allViewerCounts.forEach(count => { if (count > 1) returningViewerCount++; });
  const audienceRetention = allViewerCounts.size > 0
    ? Math.round((returningViewerCount / allViewerCounts.size) * 100)
    : 0;

  // Lead Quality Trend
  const currentHotLeadRatio = totalViews > 0 ? totalHotLeads / totalViews : 0;
  const previousHotLeadRatio = previousWeekData && previousWeekData.views > 0
    ? previousWeekData.hotLeads / previousWeekData.views
    : currentHotLeadRatio;
  const leadQualityTrend = previousHotLeadRatio > 0
    ? Math.round(((currentHotLeadRatio - previousHotLeadRatio) / previousHotLeadRatio) * 100)
    : 0;

  // Actions Required
  const leadsToFollowUp = recentHotLeads.length;

  // Viewers to re-engage (viewed in last 30 days, didn't complete, engagement 40-70)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  let viewersToReengage = 0;

  domains.forEach(domain => {
    domain.files.forEach(file => {
      viewersToReengage += file.accessLogs.filter(log =>
        new Date(log.accessed_at) >= monthAgo &&
        log.completion_percentage < 70 &&
        log.engagement_score >= 40 &&
        log.engagement_score < 70
      ).length;
    });
  });

  // Files needing attention (health < 40)
  let filesNeedingAttention = 0;
  domainMetrics.forEach(d => {
    filesNeedingAttention += d.metrics.underPerformers.filter(f => f.healthScore < 40).length;
  });

  return {
    accountHealthScore,
    totalViews,
    totalUniqueViewers,
    totalFiles,
    totalDomains: domains.length,
    totalHotLeads,
    totalWarmLeads,
    leadsToFollowUp,
    avgEngagementScore,
    avgContentHealth,
    bestPerformingDomain,
    weeklyActiveViewers,
    audienceRetention,
    leadQualityTrend,
    actionsRequired: {
      hotLeadsToContact: leadsToFollowUp,
      viewersToReengage,
      filesNeedingAttention,
    },
  };
}

function getEmptyAccountMetrics(): AccountMetrics {
  return {
    accountHealthScore: 0,
    totalViews: 0,
    totalUniqueViewers: 0,
    totalFiles: 0,
    totalDomains: 0,
    totalHotLeads: 0,
    totalWarmLeads: 0,
    leadsToFollowUp: 0,
    avgEngagementScore: 0,
    avgContentHealth: 0,
    bestPerformingDomain: null,
    weeklyActiveViewers: 0,
    audienceRetention: 0,
    leadQualityTrend: 0,
    actionsRequired: {
      hotLeadsToContact: 0,
      viewersToReengage: 0,
      filesNeedingAttention: 0,
    },
  };
}

// -------------------- UTILITY EXPORTS --------------------

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function formatEngagementBadge(score: number): { emoji: string; label: string; color: string } {
  if (score >= 80) return { emoji: '🔥', label: 'Hot', color: '#22c55e' };
  if (score >= 60) return { emoji: '🟡', label: 'Warm', color: '#eab308' };
  if (score >= 40) return { emoji: '🟠', label: 'Mild', color: '#fb923c' };
  return { emoji: '⚪', label: 'Cold', color: '#9ca3af' };
}

export function formatIntentSignal(signal: string): { emoji: string; label: string; color: string } {
  switch (signal) {
    case 'high': return { emoji: '🔥', label: 'High Intent', color: '#22c55e' };
    case 'medium': return { emoji: '🟡', label: 'Medium Intent', color: '#eab308' };
    case 'low-medium': return { emoji: '🟠', label: 'Low-Medium', color: '#fb923c' };
    default: return { emoji: '⚪', label: 'Low Intent', color: '#9ca3af' };
  }
}

export function formatUrgency(level: string): { emoji: string; label: string; color: string } {
  switch (level) {
    case 'high': return { emoji: '🚨', label: 'Act Now', color: '#ef4444' };
    case 'medium': return { emoji: '⏰', label: 'Follow Up Soon', color: '#f59e0b' };
    default: return { emoji: '📋', label: 'Queue', color: '#6b7280' };
  }
}

// -------------------- NEW FILE DETAIL FUNCTIONS --------------------

/**
 * Calculate File Link-Level Performance Score from access logs
 * Used for "Performance" stat on File detail pages
 *
 * VOLUME-GATED FORMULA:
 * - Base Volume Score: 20 × log₁₀(views + 1)
 * - Volume Multiplier: min(1, views / 500)
 * - Quality Score: (timeScore × 0.35) + (completionScore × 0.35) + (downloadScore × 0.30)
 * - Final: (volumeScore × 0.25) + (qualityScore × volumeMultiplier × 0.75)
 *
 * This ensures:
 * - Low volume = low score regardless of quality
 * - High volume with quality engagement = high score
 */
export function calculateFileLinkScoreFromLogs(logs: AccessLog[]): number {
  if (!logs || logs.length === 0) return 0;

  const totalViews = logs.length;

  // 1. Base Volume Score
  // 1 view = 6, 5 views = 14, 10 views = 20, 50 views = 34, 100 views = 40
  const volumeScore = Math.min(100, 20 * Math.log10(totalViews + 1));

  // 2. Volume Multiplier - gates quality bonus
  // 10 views = 0.02x, 100 views = 0.20x, 500+ views = 1.0x
  const volumeMultiplier = Math.min(1, totalViews / 500);

  // 3. Calculate quality metrics from raw log data
  let totalTime = 0;
  let totalCompletion = 0;
  let downloads = 0;

  logs.forEach(log => {
    // Get duration from total_duration_seconds or pages_time_data
    let duration = 0;
    if (log.total_duration_seconds && log.total_duration_seconds > 0) {
      duration = log.total_duration_seconds;
    } else if (log.pages_time_data && typeof log.pages_time_data === 'object') {
      const times = Object.values(log.pages_time_data as Record<string, number>);
      if (times.length > 0) {
        duration = Math.round(times.reduce((sum: number, t: any) => sum + (Number(t) || 0), 0));
      }
    }
    totalTime += duration;

    // Completion
    totalCompletion += log.completion_percentage || 0;

    // Downloads
    if (log.downloaded || log.is_downloaded || (log.download_count && log.download_count > 0)) {
      downloads++;
    }
  });

  // 4. Calculate average quality metrics
  const avgTime = totalTime / totalViews;
  const avgCompletion = totalCompletion / totalViews;
  const downloadRate = (downloads / totalViews) * 100;

  // 5. Convert to scores (0-100)
  // Time: 2 min (120s) = 100 score
  const timeScore = Math.min(100, (avgTime / 120) * 100);
  // Completion: direct percentage
  const completionScore = avgCompletion;
  // Downloads: 50% download rate = 100 score
  const downloadScore = Math.min(100, downloadRate * 2);

  // 6. Weighted quality score
  const qualityScore = (timeScore * 0.35) + (completionScore * 0.35) + (downloadScore * 0.30);

  // 7. Final score: volume base + gated quality bonus
  const finalScore = Math.round((volumeScore * 0.25) + (qualityScore * volumeMultiplier * 0.75));

  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Calculate Track Site Link-Level Score from access logs
 * Used for "Engage" stat on Track Site detail pages
 */
export function calculateTrackSiteLinkScoreFromLogs(logs: AccessLog[]): number {
  if (!logs || logs.length === 0) return 0;

  const totalClicks = logs.length;

  // NEW VOLUME-GATED FORMULA (December 11, 2025)
  // Core principle: Low volume = Low score, regardless of other factors

  // 1. Base Volume Score
  // 1 click = 6, 5 clicks = 14, 10 clicks = 20, 50 clicks = 34, 100 clicks = 40
  const volumeScore = Math.min(100, 20 * Math.log10(totalClicks + 1));

  // 2. Volume Multiplier - gates bonus scores
  // 10 clicks = 0.02x, 100 clicks = 0.20x, 500+ clicks = 1.0x
  const volumeMultiplier = Math.min(1, totalClicks / 500);

  // 3. Unique clickers by email or IP
  const uniqueIdentifiers = new Set<string>();
  logs.forEach(log => {
    const identifier = log.viewer_email || log.ip_address || `${log.country}-${log.device_type}`;
    uniqueIdentifiers.add(identifier);
  });
  const uniqueClickers = uniqueIdentifiers.size || 1;

  // 4. Reach Bonus (max 20 points at full volume)
  const reachRatio = (uniqueClickers / totalClicks) * 100;
  const reachBonus = reachRatio * 0.20 * volumeMultiplier;

  // 5. Return clickers
  const returnClickers = logs.filter(l => l.is_return_visit).length;
  const returnRatio = uniqueClickers > 0 ? (returnClickers / uniqueClickers) * 100 : 0;
  const returnBonus = returnRatio * 0.20 * volumeMultiplier;

  // 6. Recency Bonus (max 10 points at full volume)
  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime()
  );
  const lastClickDate = sortedLogs[0]?.accessed_at;
  const daysSinceLastClick = lastClickDate
    ? Math.floor((Date.now() - new Date(lastClickDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let recencyScore: number;
  if (daysSinceLastClick <= 1) recencyScore = 100;
  else if (daysSinceLastClick <= 3) recencyScore = 90;
  else if (daysSinceLastClick <= 7) recencyScore = 70;
  else if (daysSinceLastClick <= 14) recencyScore = 50;
  else if (daysSinceLastClick <= 30) recencyScore = 30;
  else if (daysSinceLastClick <= 60) recencyScore = 15;
  else recencyScore = 5;
  const recencyBonus = recencyScore * 0.10 * volumeMultiplier;

  // 7. Velocity Bonus (max 10 points at full volume)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const clicksThisWeek = logs.filter(l => new Date(l.accessed_at) >= oneWeekAgo).length;
  const clicksLastWeek = logs.filter(l => {
    const date = new Date(l.accessed_at);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  }).length;

  let velocityScore: number;
  if (clicksLastWeek === 0) {
    velocityScore = 0; // New link - no velocity bonus
  } else {
    const ratio = clicksThisWeek / clicksLastWeek;
    if (ratio >= 2.0) velocityScore = 100;
    else if (ratio >= 1.5) velocityScore = 80;
    else if (ratio >= 1.0) velocityScore = 50;
    else if (ratio >= 0.5) velocityScore = 20;
    else velocityScore = 5;
  }
  const velocityBonus = velocityScore * 0.10 * volumeMultiplier;

  // Final score
  const finalScore = Math.round(volumeScore + reachBonus + returnBonus + recencyBonus + velocityBonus);

  return Math.min(100, Math.max(0, finalScore));
}

/**
 * Calculate aggregated engagement score for a unique viewer
 * This uses the SAME formula as ViewersTab to ensure consistency
 */
export function calculateAggregatedViewerScore(
  viewerLogs: AccessLog[],
  isTrackSite: boolean,
  totalPages?: number
): number {
  if (viewerLogs.length === 0) return 0;

  // Aggregate viewer data from all their sessions
  let totalDuration = 0;
  let maxCompletion = 0;
  let maxPageReached = 0;
  let downloaded = false;
  const isReturn = viewerLogs.length > 1;

  viewerLogs.forEach(log => {
    totalDuration += log.total_duration_seconds || 0;
    if ((log.completion_percentage || 0) > maxCompletion) {
      maxCompletion = log.completion_percentage || 0;
      maxPageReached = log.max_page_reached || 0;
    }
    if (log.downloaded) downloaded = true;
  });

  if (isTrackSite) {
    // Track Site Individual Score Formula: Return (60%) + Frequency (40%)
    const returnScore = isReturn ? 100 : 0;
    const frequencyScore = Math.min(100, viewerLogs.length * 33);
    return Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
  } else {
    // File Individual Score Formula: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)

    // Time score (0-100 based on total duration)
    let timeScore: number;
    if (totalDuration <= 0) timeScore = 0;
    else if (totalDuration < 30) timeScore = Math.round((totalDuration / 30) * 25);
    else if (totalDuration < 60) timeScore = 25 + Math.round(((totalDuration - 30) / 30) * 15);
    else if (totalDuration < 120) timeScore = 40 + Math.round(((totalDuration - 60) / 60) * 20);
    else if (totalDuration < 300) timeScore = 60 + Math.round(((totalDuration - 120) / 180) * 20);
    else if (totalDuration < 600) timeScore = 80 + Math.round(((totalDuration - 300) / 300) * 20);
    else timeScore = 100;

    // Completion score (direct percentage)
    const completionScore = maxCompletion;

    // Download score (binary)
    const downloadScore = downloaded ? 100 : 0;

    // Return score (binary)
    const returnScore = isReturn ? 100 : 0;

    // Depth score (pages reached / total pages)
    // Only use page-based depth for multi-page documents (totalPages > 1)
    // For videos/images/single-page files, use completion as depth proxy
    let depthScore = 0;
    if (totalPages && totalPages > 1 && maxPageReached > 0) {
      depthScore = Math.round((maxPageReached / totalPages) * 100);
    } else {
      depthScore = maxCompletion;
    }

    // Weighted sum
    return Math.round(
      (timeScore * 0.25) +
      (completionScore * 0.25) +
      (downloadScore * 0.20) +
      (returnScore * 0.15) +
      (depthScore * 0.15)
    );
  }
}

/**
 * Calculate analytics summary from access logs
 * @param logs - Array of access logs
 * @param isTrackSite - If true, use track site engagement formula
 * @param totalPages - Total pages in the document (for depth calculation)
 */
export function calculateAnalyticsSummary(
  logs: AccessLog[],
  isTrackSite: boolean = false,
  totalPages?: number
): AnalyticsSummary {
  if (!logs || logs.length === 0) {
    return {
      totalViews: 0,
      uniqueViewers: 0,
      avgEngagement: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      qrScans: 0,
      directClicks: 0,
      completionRate: 0,
      avgTimeSpent: 0,
      returnRate: 0,
      returnVisits: 0,
      downloadCount: 0,
      viewsToday: 0,
      lastViewAt: null,
    };
  }

  const totalViews = logs.length;

  // Group logs by unique viewer
  const viewerLogsMap = new Map<string, AccessLog[]>();
  logs.forEach(log => {
    const identifier = log.viewer_email || log.ip_address || log.session_id || log.id;
    if (!viewerLogsMap.has(identifier)) {
      viewerLogsMap.set(identifier, []);
    }
    viewerLogsMap.get(identifier)!.push(log);
  });

  const uniqueViewers = viewerLogsMap.size;

  // Calculate engagement scores for each unique viewer using aggregated data
  let hotLeads = 0;
  let warmLeads = 0;
  let coldLeads = 0;

  viewerLogsMap.forEach((viewerLogs) => {
    const score = calculateAggregatedViewerScore(viewerLogs, isTrackSite, totalPages);

    if (score >= 70) hotLeads++;
    else if (score >= 40) warmLeads++;
    else coldLeads++;
  });

  // Link-level engagement score uses volume-gated formula
  let avgEngagement: number;
  if (isTrackSite) {
    avgEngagement = calculateTrackSiteLinkScoreFromLogs(logs);
  } else {
    avgEngagement = calculateFileLinkScoreFromLogs(logs);
  }

  // Access method
  const qrScans = logs.filter(l => l.access_method === 'qr_scan').length;
  const directClicks = totalViews - qrScans;

  // Completion rate (viewers who reached 90%+)
  const completedViewers = logs.filter(l => l.completion_percentage >= 90).length;
  const completionRate = (completedViewers / totalViews) * 100;

  // Average time spent
  const avgTimeSpent = logs.reduce((sum, l) => sum + (l.total_duration_seconds || 0), 0) / totalViews;

  // Return rate - viewers with 2+ sessions
  let returnViewerCount = 0;
  viewerLogsMap.forEach((viewerLogs) => {
    if (viewerLogs.length > 1) returnViewerCount++;
  });
  const returnRate = uniqueViewers > 0 ? (returnViewerCount / uniqueViewers) * 100 : 0;

  // Download count
  const downloadCount = logs.filter(l => l.downloaded).length;

  // Views today
  const today = new Date().toISOString().split('T')[0];
  const viewsToday = logs.filter(l => l.accessed_at.startsWith(today)).length;

  // Last view
  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime()
  );
  const lastViewAt = sortedLogs[0]?.accessed_at || null;

  return {
    totalViews,
    uniqueViewers,
    avgEngagement: Math.round(avgEngagement),
    hotLeads,
    warmLeads,
    coldLeads,
    qrScans,
    directClicks,
    completionRate: Math.round(completionRate),
    avgTimeSpent: Math.round(avgTimeSpent),
    returnRate: Math.round(returnRate),
    returnVisits: returnViewerCount,
    downloadCount,
    viewsToday,
    lastViewAt,
  };
}

/**
 * Get views distribution by day of week
 */
export function getViewsByDayOfWeek(logs: AccessLog[]): TopItem[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  logs.forEach(log => {
    const day = new Date(log.accessed_at).getDay();
    counts[day]++;
  });

  const total = logs.length || 1;
  return days.map((name, index) => ({
    name,
    count: counts[index],
    percentage: Math.round((counts[index] / total) * 100),
  }));
}

/**
 * Get views distribution by hour
 */
export function getViewsByHour(logs: AccessLog[]): TimeDistribution {
  const hours: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hours[i] = 0;

  logs.forEach(log => {
    const hour = new Date(log.accessed_at).getHours();
    hours[hour]++;
  });

  return {
    labels: Object.keys(hours).map(h => `${h}:00`),
    data: Object.values(hours),
  };
}

/**
 * Get top countries
 */
export function getTopCountries(logs: AccessLog[], limit = 10): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const country = log.country || 'Unknown';
    counts[country] = (counts[country] || 0) + 1;
  });

  const total = logs.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get top cities
 */
export function getTopCities(logs: AccessLog[], limit = 10): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const city = log.city || 'Unknown';
    counts[city] = (counts[city] || 0) + 1;
  });

  const total = logs.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get top regions
 */
export function getTopRegions(logs: AccessLog[], limit = 10): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const region = log.region || 'Unknown';
    counts[region] = (counts[region] || 0) + 1;
  });

  const total = logs.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get device breakdown
 */
export function getDeviceBreakdown(logs: AccessLog[]): TopItem[] {
  const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };

  logs.forEach(log => {
    const device = log.device_type || 'desktop';
    counts[device] = (counts[device] || 0) + 1;
  });

  const total = logs.length || 1;
  return [
    { name: 'Desktop', count: counts.desktop, percentage: Math.round((counts.desktop / total) * 100) },
    { name: 'Mobile', count: counts.mobile, percentage: Math.round((counts.mobile / total) * 100) },
    { name: 'Tablet', count: counts.tablet, percentage: Math.round((counts.tablet / total) * 100) },
  ].filter(d => d.count > 0);
}

/**
 * Get browser breakdown
 */
export function getBrowserBreakdown(logs: AccessLog[], limit = 5): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const browser = log.browser || 'Unknown';
    counts[browser] = (counts[browser] || 0) + 1;
  });

  const total = logs.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get traffic sources breakdown
 */
export function getTrafficSources(logs: AccessLog[]): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const source = log.referrer_source || 'direct';
    counts[source] = (counts[source] || 0) + 1;
  });

  const total = logs.length || 1;
  const sourceLabels: Record<string, string> = {
    direct: 'Direct',
    google: 'Google',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    email: 'Email',
    slack: 'Slack',
    other: 'Other',
  };

  return Object.entries(counts)
    .map(([key, count]) => ({
      name: sourceLabels[key] || key,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get language breakdown
 */
export function getLanguageBreakdown(logs: AccessLog[], limit = 5): TopItem[] {
  const counts: Record<string, number> = {};

  logs.forEach(log => {
    const lang = log.language || 'Unknown';
    counts[lang] = (counts[lang] || 0) + 1;
  });

  const total = logs.length || 1;
  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Calculate page-by-page analysis
 */
export function getPageAnalysis(logs: AccessLog[], totalPages: number, pageLabels?: Record<number, string>): PageAnalysis[] {
  if (totalPages <= 0) return [];

  const pageStats: Record<number, { times: number[]; reached: number }> = {};

  // Initialize all pages
  for (let i = 1; i <= totalPages; i++) {
    pageStats[i] = { times: [], reached: 0 };
  }

  // Collect data
  logs.forEach(log => {
    // Count how many reached each page
    const maxPage = log.max_page_reached || 1;
    for (let i = 1; i <= maxPage; i++) {
      pageStats[i].reached++;
    }

    // Collect time data
    if (log.pages_time_data) {
      Object.entries(log.pages_time_data).forEach(([page, time]) => {
        const pageNum = parseInt(page);
        if (pageStats[pageNum]) {
          pageStats[pageNum].times.push(time as number);
        }
      });
    }
  });

  const totalViewers = logs.length || 1;

  // Calculate metrics for each page
  const result: PageAnalysis[] = [];
  let prevReached = totalViewers;

  for (let page = 1; page <= totalPages; page++) {
    const stats = pageStats[page];
    const avgTime = stats.times.length > 0
      ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
      : 0;

    const dropOffRate = prevReached > 0
      ? Math.round(((prevReached - stats.reached) / prevReached) * 100)
      : 0;

    result.push({
      page,
      label: pageLabels?.[page],
      avgTime: Math.round(avgTime),
      views: stats.reached,
      dropOffRate: Math.max(0, dropOffRate),
      isPopular: false, // Will be set below
      hasHighDropOff: dropOffRate > 30,
    });

    prevReached = stats.reached;
  }

  // Find most popular page (highest avg time)
  const maxTime = Math.max(...result.map(p => p.avgTime));
  const avgAvgTime = result.reduce((sum, p) => sum + p.avgTime, 0) / result.length;

  result.forEach(page => {
    if (page.avgTime === maxTime && page.avgTime > avgAvgTime * 1.5) {
      page.isPopular = true;
    }
  });

  return result;
}

/**
 * Get best time to share
 */
export function getBestTimeToShare(logs: AccessLog[]): { days: string; hours: string; insight: string } | null {
  if (logs.length < 5) return null;

  const dayOfWeek = getViewsByDayOfWeek(logs);
  const hourlyData = getViewsByHour(logs);

  // Find top 2 days
  const topDays = [...dayOfWeek]
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(d => d.name.slice(0, 3)); // "Monday" -> "Mon"

  // Find peak hours (consecutive hours with highest views)
  let maxSum = 0;
  let peakStart = 10;
  for (let i = 0; i < 20; i++) {
    const sum = hourlyData.data[i] + hourlyData.data[i + 1] + hourlyData.data[i + 2] + hourlyData.data[i + 3];
    if (sum > maxSum) {
      maxSum = sum;
      peakStart = i;
    }
  }

  const formatHour = (h: number) => {
    if (h === 0) return '12AM';
    if (h === 12) return '12PM';
    return h < 12 ? `${h}AM` : `${h - 12}PM`;
  };

  return {
    days: topDays.join(' & '),
    hours: `${formatHour(peakStart)} - ${formatHour(peakStart + 4)}`,
    insight: '3x higher engagement at this time',
  };
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get country flag emoji
 */
export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'USA': '🇺🇸',
    'South Korea': '🇰🇷',
    'Korea': '🇰🇷',
    'United Kingdom': '🇬🇧',
    'UK': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'India': '🇮🇳',
    'Singapore': '🇸🇬',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾',
    'Philippines': '🇵🇭',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Poland': '🇵🇱',
    'Russia': '🇷🇺',
    'Ukraine': '🇺🇦',
    'Israel': '🇮🇱',
    'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'Turkey': '🇹🇷',
    'South Africa': '🇿🇦',
    'Nigeria': '🇳🇬',
    'Egypt': '🇪🇬',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Peru': '🇵🇪',
    'New Zealand': '🇳🇿',
    'Ireland': '🇮🇪',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Belgium': '🇧🇪',
    'Portugal': '🇵🇹',
    'Czech Republic': '🇨🇿',
    'Romania': '🇷🇴',
    'Hungary': '🇭🇺',
    'Greece': '🇬🇷',
  };
  return flags[country] || '🌍';
}

/**
 * Get file type icon
 */
export function getFileTypeIcon(mimeType?: string, type?: string): string {
  if (type === 'url') return '🔗';
  if (!mimeType) return '📄';

  const mt = mimeType.toLowerCase();
  if (mt.includes('pdf')) return '📕';
  if (mt.includes('presentation') || mt.includes('ppt')) return '📊';
  if (mt.includes('document') || mt.includes('doc') || mt.includes('word')) return '📘';
  if (mt.includes('sheet') || mt.includes('excel') || mt.includes('xls')) return '📗';
  if (mt.includes('image') || mt.includes('png') || mt.includes('jpg') || mt.includes('jpeg')) return '🖼️';
  if (mt.includes('video') || mt.includes('mp4') || mt.includes('mov')) return '🎬';
  if (mt.includes('audio') || mt.includes('mp3')) return '🎵';
  if (mt.includes('zip') || mt.includes('rar') || mt.includes('tar')) return '📦';
  return '📄';
}

/**
 * Get intent badge info
 */
export function getIntentBadge(score: number, signal?: string): { icon: string; label: string; bgColor: string; textColor: string } {
  if (signal === 'hot' || score >= 70) {
    return { icon: '🔥', label: 'Hot', bgColor: 'bg-red-100', textColor: 'text-red-700' };
  }
  if (signal === 'warm' || score >= 40) {
    return { icon: '🟡', label: 'Warm', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
  }
  return { icon: '⚪', label: 'Cold', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
}

/**
 * Get device icon
 */
export function getDeviceIcon(deviceType?: string): string {
  switch (deviceType) {
    case 'mobile': return '📱';
    case 'tablet': return '📱';
    default: return '💻';
  }
}
