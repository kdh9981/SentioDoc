'use client';

import React, { useState, useMemo } from 'react';
import WorldMap from './WorldMap';
import {
  ViewsOverTimeChart,
  EngagementBreakdownChart,
  BestTimeChart,
  TopDaysChart,
  PopularHoursChart,
  TrafficSourcesChart,
  AccessMethodChart,
  UTMCampaignsChart,
  DevicesChart,
  BrowsersChart,
  OSChart,
  LanguagesChart,
  ActionsTakenChart,
} from './DashboardCharts';
import { useTimezone } from '@/contexts/TimezoneContext';
import {
  getDateStringInTimezone,
  getHourInTimezone,
  getDayOfWeekInTimezone,
  getWeekStartInTimezone,
  getMonthKeyInTimezone,
  generateDateKeysInTimezone,
  generateWeekKeysInTimezone,
  generateMonthKeysInTimezone,
  formatDateKeyForDisplay,
  formatMonthKeyForDisplay,
} from '@/lib/timezone';

interface ActivityLog {
  viewerName?: string;
  viewerEmail?: string;
  country?: string;
  city?: string;
  region?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  accessedAt: string;
  fileName: string;
  fileType?: string;
  fileId: string;
  linkType?: 'file' | 'url';  // NEW: Differentiate files vs track sites
  engagementScore?: number;
  intentSignal?: string;
  totalDurationSeconds?: number;
  completionPercentage?: number;  // NEW: For aggregated viewer score
  isReturnVisit?: boolean;
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isDownloaded?: boolean;
  downloadCount?: number;  // NEW: For aggregated viewer score
  language?: string;
  ipAddress?: string;  // NEW: For unique viewer counting
  sessionId?: string;  // NEW: For unique viewer counting
}

interface FileRecord {
  id: string;
  name: string;
  slug: string;
  views: number;
  type?: 'file' | 'url';
  fileType?: string;
  mime_type?: string;
  avgEngagement?: number;
}

interface DashboardAnalyticsProps {
  logs: ActivityLog[];
  files: FileRecord[];
  startDate: Date;
  endDate: Date;
}

// Helper to get country flag
function getCountryFlag(countryName: string): string {
  const countryToCode: Record<string, string> = {
    'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 'Germany': 'DE',
    'France': 'FR', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN',
    'Australia': 'AU', 'Brazil': 'BR', 'Mexico': 'MX', 'Thailand': 'TH', 'Singapore': 'SG',
    'Netherlands': 'NL', 'Spain': 'ES', 'Italy': 'IT', 'Russia': 'RU', 'Indonesia': 'ID',
  };
  const code = countryToCode[countryName];
  if (!code || code.length !== 2) return '🌍';
  const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Helper to get file icon
function getFileIcon(mimeType?: string, type?: string): string {
  if (type === 'url') return '🔗';
  const mt = mimeType?.toLowerCase() || '';
  if (mt.includes('pdf')) return '📕';
  if (mt.includes('presentation') || mt.includes('ppt')) return '📊';
  if (mt.includes('word') || mt.includes('doc')) return '📘';
  if (mt.includes('sheet') || mt.includes('xls')) return '📗';
  if (mt.includes('image')) return '🖼️';
  if (mt.includes('video')) return '🎬';
  if (mt.includes('audio')) return '🎵';
  return '📄';
}

// Helper to get country code from name
function getCountryCode(countryName: string): string {
  const nameToCode: Record<string, string> = {
    'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 'Germany': 'DE',
    'France': 'FR', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN',
    'Australia': 'AU', 'Brazil': 'BR', 'Mexico': 'MX', 'Thailand': 'TH', 'Singapore': 'SG',
    'Netherlands': 'NL', 'Spain': 'ES', 'Italy': 'IT', 'Russia': 'RU', 'Indonesia': 'ID',
    'Vietnam': 'VN', 'Malaysia': 'MY', 'Philippines': 'PH', 'Taiwan': 'TW', 'Hong Kong': 'HK',
  };
  return nameToCode[countryName] || 'XX';
}

export default function DashboardAnalytics({ logs, files, startDate, endDate }: DashboardAnalyticsProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { timezone } = useTimezone();

  // Calculate all analytics data
  const analytics = useMemo(() => {
    const total = logs.length;

    // Views over time - using timezone-aware bucket generation
    let viewsOverTime: Array<{ label: string; value: number }> = [];

    if (viewMode === 'daily') {
      // Daily: One bar per day in the selected timezone
      const dateKeys = generateDateKeysInTimezone(startDate, endDate, timezone);
      const dayCounts: Map<string, number> = new Map();

      dateKeys.forEach(key => {
        dayCounts.set(key, 0);
      });

      logs.forEach(log => {
        const key = getDateStringInTimezone(log.accessedAt, timezone);
        if (dayCounts.has(key)) {
          dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
        }
      });

      viewsOverTime = Array.from(dayCounts.entries()).map(([key, count]) => ({
        label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
        fullLabel: formatDateKeyForDisplay(key, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        value: count,
      }));
    } else if (viewMode === 'weekly') {
      // Weekly: One bar per week in the selected timezone
      const weekKeys = generateWeekKeysInTimezone(startDate, endDate, timezone);
      const weekCounts: Map<string, number> = new Map();

      weekKeys.forEach(key => {
        weekCounts.set(key, 0);
      });

      logs.forEach(log => {
        const weekStart = getWeekStartInTimezone(log.accessedAt, timezone);
        if (weekCounts.has(weekStart)) {
          weekCounts.set(weekStart, (weekCounts.get(weekStart) || 0) + 1);
        }
      });

      viewsOverTime = Array.from(weekCounts.entries()).map(([key, count]) => ({
        label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
        fullLabel: `Week of ${formatDateKeyForDisplay(key, { month: 'short', day: 'numeric', year: 'numeric' })}`,
        value: count,
      }));
    } else {
      // Monthly: One bar per month in the selected timezone
      const monthKeys = generateMonthKeysInTimezone(startDate, endDate, timezone);
      const monthCounts: Map<string, number> = new Map();

      monthKeys.forEach(key => {
        monthCounts.set(key, 0);
      });

      logs.forEach(log => {
        const monthKey = getMonthKeyInTimezone(log.accessedAt, timezone);
        if (monthCounts.has(monthKey)) {
          monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
        }
      });

      viewsOverTime = Array.from(monthCounts.entries()).map(([key, count]) => ({
        label: formatMonthKeyForDisplay(key, { month: 'short' }),
        fullLabel: formatMonthKeyForDisplay(key, { month: 'long', year: 'numeric' }),
        value: count,
      }));
    }

    // Engagement breakdown - Group by unique viewer and calculate aggregated scores
    // Helper function for file viewer score
    const calculateFileViewerScore = (viewerLogs: ActivityLog[]): number => {
      if (viewerLogs.length === 0) return 0;

      let totalDuration = 0;
      let maxCompletion = 0;
      let downloaded = false;
      const isReturn = viewerLogs.length > 1;

      viewerLogs.forEach(log => {
        totalDuration += log.totalDurationSeconds || 0;
        if ((log.completionPercentage || 0) > maxCompletion) {
          maxCompletion = log.completionPercentage || 0;
        }
        if (log.isDownloaded || (log.downloadCount && log.downloadCount > 0)) {
          downloaded = true;
        }
      });

      // Time score (25%)
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
      const depthScore = maxCompletion;

      return Math.round(
        (timeScore * 0.25) +
        (completionScore * 0.25) +
        (downloadScore * 0.20) +
        (returnScore * 0.15) +
        (depthScore * 0.15)
      );
    };

    // Helper function for track site viewer score
    const calculateTrackSiteViewerScore = (viewerLogs: ActivityLog[]): number => {
      if (viewerLogs.length === 0) return 0;
      const isReturn = viewerLogs.length > 1;
      const returnScore = isReturn ? 100 : 0;
      const frequencyScore = Math.min(100, viewerLogs.length * 33);
      return Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
    };

    // Group logs by unique viewer (across all files) with their best score
    const viewerBestScores = new Map<string, number>();
    const viewerFileLogsMap = new Map<string, ActivityLog[]>();

    // First pass: group logs by fileId:viewerId
    // Use same identifier logic as metrics API
    logs.forEach((log, index) => {
      const viewerId = log.viewerEmail || log.ipAddress || log.sessionId || `anon-${index}`;
      const key = `${log.fileId}:${viewerId}`;
      if (!viewerFileLogsMap.has(key)) {
        viewerFileLogsMap.set(key, []);
      }
      viewerFileLogsMap.get(key)!.push(log);
    });

    // Second pass: calculate aggregated score per viewer per file, keep best
    viewerFileLogsMap.forEach((viewerLogs, key) => {
      const viewerId = key.split(':').slice(1).join(':');
      const isTrackSite = viewerLogs[0]?.linkType === 'url';
      const score = isTrackSite
        ? calculateTrackSiteViewerScore(viewerLogs)
        : calculateFileViewerScore(viewerLogs);
      const currentBest = viewerBestScores.get(viewerId) || 0;
      if (score > currentBest) {
        viewerBestScores.set(viewerId, score);
      }
    });

    // Count unique viewers by engagement level based on their best score
    let hot = 0, warm = 0, cold = 0;
    viewerBestScores.forEach(score => {
      if (score >= 70) hot++;
      else if (score >= 40) warm++;
      else cold++;
    });

    // Day of week - using timezone
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCountsMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    logs.forEach(l => {
      const day = getDayOfWeekInTimezone(l.accessedAt, timezone);
      dayCountsMap[day]++;
    });
    const topDays = dayNames.map((name, i) => ({
      label: name,
      value: dayCountsMap[i],
      percentage: total > 0 ? Math.round((dayCountsMap[i] / total) * 100) : 0,
    }));

    // Hourly data - using timezone
    const hourCounts: number[] = new Array(24).fill(0);
    logs.forEach(l => {
      const hour = getHourInTimezone(l.accessedAt, timezone);
      hourCounts[hour]++;
    });

    // Traffic sources
    const sourceCounts = new Map<string, number>();
    logs.forEach(l => {
      const source = l.trafficSource || 'Direct';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    const trafficSources = Array.from(sourceCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // UTM campaigns
    const campaignCounts = new Map<string, number>();
    logs.forEach(l => {
      if (l.utmCampaign) {
        campaignCounts.set(l.utmCampaign, (campaignCounts.get(l.utmCampaign) || 0) + 1);
      }
    });
    const utmCampaigns = Array.from(campaignCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Access method (QR vs Direct)
    const qrScans = logs.filter(l =>
      l.utmMedium?.toLowerCase() === 'qr' ||
      l.utmMedium?.toLowerCase() === 'qr_code'
    ).length;
    const directClicks = total - qrScans;

    // Return vs new - Count UNIQUE viewers, not logs
    // A unique viewer is a return visitor if they have 2+ sessions across any file
    // Logic aligned with metrics API: viewer_email || ip_address || session_id
    const viewerVisitCounts = new Map<string, number>();
    logs.forEach((log, index) => {
      // Use same identifier logic as metrics API
      const viewerId = log.viewerEmail || log.ipAddress || log.sessionId || `anon-${index}`;
      viewerVisitCounts.set(viewerId, (viewerVisitCounts.get(viewerId) || 0) + 1);
    });
    const uniqueViewerCount = viewerVisitCounts.size;
    let returnVisitorCount = 0;
    viewerVisitCounts.forEach(count => {
      if (count > 1) returnVisitorCount++;
    });
    const returnVisitors = returnVisitorCount;
    const newVisitors = uniqueViewerCount - returnVisitorCount;

    // Devices
    const deviceCounts = new Map<string, number>();
    logs.forEach(l => {
      const device = l.deviceType || 'Unknown';
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
    });
    const devices = Array.from(deviceCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);

    // Browsers
    const browserCounts = new Map<string, number>();
    logs.forEach(l => {
      const browser = l.browser || 'Unknown';
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
    });
    const browsers = Array.from(browserCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // OS
    const osCounts = new Map<string, number>();
    logs.forEach(l => {
      const os = l.os || 'Unknown';
      osCounts.set(os, (osCounts.get(os) || 0) + 1);
    });
    const operatingSystems = Array.from(osCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Countries
    const countryCounts = new Map<string, number>();
    logs.forEach(l => {
      const country = l.country || 'Unknown';
      countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
    });
    const countries = Array.from(countryCounts.entries())
      .map(([label, value]) => ({
        label,
        value,
        percentage: Math.round((value / total) * 100),
        flag: getCountryFlag(label),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Cities
    const cityCounts = new Map<string, number>();
    logs.forEach(l => {
      const city = l.city || 'Unknown';
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    });
    const cities = Array.from(cityCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Regions
    const regionCounts = new Map<string, number>();
    logs.forEach(l => {
      const region = l.region || 'Unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    const regions = Array.from(regionCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Languages
    const langCounts = new Map<string, number>();
    logs.forEach(l => {
      const lang = l.language || 'Unknown';
      langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
    });
    const languages = Array.from(langCounts.entries())
      .map(([label, value]) => ({ label, value, percentage: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Downloads and returns
    const downloads = logs.filter(l => l.isDownloaded).length;

    // World map data
    const worldMapData = Array.from(countryCounts.entries())
      .filter(([name]) => name !== 'Unknown')
      .map(([country, views]) => {
        const countryLogs = logs.filter(l => l.country === country);
        const uniqueEmails = new Set(countryLogs.filter(l => l.viewerEmail).map(l => l.viewerEmail));
        const avgEng = countryLogs.length > 0
          ? Math.round(countryLogs.reduce((sum, l) => sum + (l.engagementScore || 0), 0) / countryLogs.length)
          : 0;
        return {
          country,
          countryCode: getCountryCode(country),
          views,
          uniqueViewers: uniqueEmails.size,
          avgEngagement: avgEng,
        };
      });

    // Top performing: sorted by views DESC (highest views = rank 1)
    const contentPerformance = files
      .filter(f => f.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((f, index) => {
        // Generate reason based on metrics
        let reason = '';
        const eng = f.avgEngagement || 0;
        if (index === 0) {
          reason = 'Most viewed content';
        } else if (eng >= 70) {
          reason = `High engagement (${eng}%)`;
        } else if (eng >= 40) {
          reason = `${f.views} views, ${eng}% engagement`;
        } else {
          reason = `${f.views} total views`;
        }

        return {
          name: f.slug || f.name,
          views: f.views,
          engagement: eng,
          icon: getFileIcon(f.mime_type || f.fileType, f.type),
          id: f.id,
          reason,
        };
      });

    // Best time
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const topDaysSorted = [...topDays].sort((a, b) => b.value - a.value);

    return {
      total,
      viewsOverTime,
      hot,
      warm,
      cold,
      topDays,
      hourCounts,
      trafficSources,
      utmCampaigns,
      qrScans,
      directClicks,
      returnVisitors,
      newVisitors,
      devices,
      browsers,
      operatingSystems,
      countries,
      cities,
      regions,
      languages,
      downloads,
      worldMapData,
      contentPerformance,
      bestDays: topDaysSorted.slice(0, 2).map(d => d.label).join(', ') || 'N/A',
      bestHours: peakHour >= 0 ? `${peakHour}:00 - ${(peakHour + 2) % 24}:00` : 'N/A',
    };
  }, [logs, files, viewMode, startDate, endDate, timezone]);

  return (
    <div className="space-y-4">
      {/* Row 1: Views Over Time, Engagement Breakdown, Best Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ViewsOverTimeChart
          data={analytics.viewsOverTime}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <EngagementBreakdownChart
          hot={analytics.hot}
          warm={analytics.warm}
          cold={analytics.cold}
          total={analytics.total}
        />
        <BestTimeChart
          bestDays={analytics.bestDays}
          bestHours={analytics.bestHours}
          totalViews={analytics.total}
        />
      </div>

      {/* Row 2: Top Days, Popular Hours, Access Method - matching File Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TopDaysChart data={analytics.topDays} totalViews={analytics.total} />
        <PopularHoursChart data={analytics.hourCounts} />
        <AccessMethodChart
          direct={analytics.directClicks}
          qr={analytics.qrScans}
          total={analytics.total}
        />
      </div>

      {/* Row 3: Traffic Sources, Devices, Browsers - matching File Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrafficSourcesChart data={analytics.trafficSources} />
        <DevicesChart data={analytics.devices} />
        <BrowsersChart data={analytics.browsers} />
      </div>

      {/* Row 4: OS, UTM Campaigns, Languages - matching File Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OSChart data={analytics.operatingSystems} />
        <UTMCampaignsChart data={analytics.utmCampaigns} />
        <LanguagesChart data={analytics.languages} />
      </div>

      {/* Row 5: Actions Taken (Full Width) - matching File Detail */}
      <ActionsTakenChart
        downloads={analytics.downloads}
        returnVisits={analytics.returnVisitors}
        uniqueViewers={analytics.returnVisitors + analytics.newVisitors}
        totalViews={analytics.total}
      />

      {/* Row 6: World Map (Full Width) - matching File Detail */}
      <WorldMap
        data={analytics.worldMapData}
        cities={analytics.cities.map(c => ({ name: c.label, count: c.value, percentage: c.percentage }))}
        regions={analytics.regions.map(r => ({ name: r.label, count: r.value, percentage: r.percentage }))}
        totalViews={analytics.total}
      />

      {/* Top Performing & Needs Attention - SEPARATED by type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* LEFT COLUMN: FILES */}
        <div className="space-y-4">
          {/* Top Performing Files */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">🏆</span> Top Performing Files
              </h3>
              <div className="group relative">
                <span className="text-slate-400 hover:text-slate-600 cursor-help text-sm">ⓘ</span>
                <div className="absolute right-0 top-6 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  <p className="font-medium mb-1">Ranking by Performance</p>
                  <p className="text-slate-300">Top 3 files ranked by Performance score (0-100). Based on view volume plus quality metrics: time spent, completion rate, and downloads.</p>
                </div>
              </div>
            </div>

            {(() => {
              // Calculate File Link Performance Score (matches calculateFileLinkScoreFromLogs)
              const filesWithScore = files
                .filter(f => f.type !== 'url')
                .map(file => {
                  const fileLogs = logs.filter(l => l.fileId === file.id);
                  const totalViews = fileLogs.length || file.views || 0;

                  if (totalViews === 0) {
                    return { ...file, performanceScore: 0 };
                  }

                  // Volume-Gated Formula (matches centralized function)
                  const volumeScore = Math.min(100, 20 * Math.log10(totalViews + 1));
                  const volumeMultiplier = Math.min(1, totalViews / 500);

                  // Calculate quality metrics from RAW DATA (not engagement_score field)
                  let totalTime = 0;
                  let totalCompletion = 0;
                  let downloads = 0;

                  fileLogs.forEach(log => {
                    totalTime += log.totalDurationSeconds || 0;
                    totalCompletion += log.completionPercentage || 0;
                    if (log.isDownloaded || (log.downloadCount && log.downloadCount > 0)) {
                      downloads++;
                    }
                  });

                  const avgTime = totalViews > 0 ? totalTime / totalViews : 0;
                  const avgCompletion = totalViews > 0 ? totalCompletion / totalViews : 0;
                  const downloadRate = totalViews > 0 ? (downloads / totalViews) * 100 : 0;

                  // Convert to scores (0-100)
                  const timeScore = Math.min(100, (avgTime / 120) * 100);
                  const completionScore = avgCompletion;
                  const downloadScore = Math.min(100, downloadRate * 2);

                  // Weighted quality score
                  const qualityScore = (timeScore * 0.35) + (completionScore * 0.35) + (downloadScore * 0.30);

                  // Final score: volume base + gated quality bonus
                  const performanceScore = Math.round((volumeScore * 0.25) + (qualityScore * volumeMultiplier * 0.75));

                  return { ...file, performanceScore: Math.min(100, Math.max(0, performanceScore)) };
                });

              // Top 3 by performance score (>= 20 threshold)
              const topFiles = filesWithScore
                .filter(f => f.views > 0 && f.performanceScore >= 20)
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 3);

              if (topFiles.length > 0) {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div className="space-y-3">
                    {topFiles.map((file, i) => {
                      const performance = file.performanceScore;
                      const reason = performance >= 70
                        ? 'Excellent performance'
                        : performance >= 40
                          ? 'Good performance'
                          : performance >= 20
                            ? 'Moderate performance'
                            : 'Low performance';

                      return (
                        <a
                          key={file.id}
                          href={`/dashboard/files/${file.id}`}
                          className="block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{medals[i]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{getFileIcon(file.mime_type || file.fileType, file.type)}</span>
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600">
                                  {file.slug || file.name}
                                </p>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{reason}</p>

                              {/* Performance Score Bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-500">Performance</span>
                                  <span className={`font-semibold ${
                                    performance >= 70 ? 'text-green-600' :
                                    performance >= 40 ? 'text-yellow-600' :
                                    'text-slate-500'
                                  }`}>{performance}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      performance >= 70 ? 'bg-green-500' :
                                      performance >= 40 ? 'bg-yellow-500' :
                                      'bg-slate-300'
                                    }`}
                                    style={{ width: `${performance}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm font-medium">No top performers yet</p>
                  <p className="text-xs mt-1 text-slate-400">Files need Performance score of 20+ to appear here</p>
                </div>
              );
            })()}
          </div>

          {/* Needs Attention - Files */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Files Needing Attention
              </h3>
              <div className="group relative">
                <span className="text-slate-400 hover:text-slate-600 cursor-help text-sm">ⓘ</span>
                <div className="absolute right-0 top-6 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  <p className="font-medium mb-1">Low Performance Alert</p>
                  <p className="text-slate-300">Files with Performance score below 20 need attention. May require content improvements, better titles, or promotion. Sorted by lowest score first.</p>
                </div>
              </div>
            </div>

            {(() => {
              // Calculate File Link Performance Score (matches calculateFileLinkScoreFromLogs)
              const filesWithScore = files
                .filter(f => f.type !== 'url')
                .map(file => {
                  const fileLogs = logs.filter(l => l.fileId === file.id);
                  const totalViews = fileLogs.length || file.views || 0;

                  if (totalViews === 0) {
                    return { ...file, performanceScore: 0 };
                  }

                  // Volume-Gated Formula (matches centralized function)
                  const volumeScore = Math.min(100, 20 * Math.log10(totalViews + 1));
                  const volumeMultiplier = Math.min(1, totalViews / 500);

                  // Calculate quality metrics from RAW DATA
                  let totalTime = 0;
                  let totalCompletion = 0;
                  let downloads = 0;

                  fileLogs.forEach(log => {
                    totalTime += log.totalDurationSeconds || 0;
                    totalCompletion += log.completionPercentage || 0;
                    if (log.isDownloaded || (log.downloadCount && log.downloadCount > 0)) {
                      downloads++;
                    }
                  });

                  const avgTime = totalViews > 0 ? totalTime / totalViews : 0;
                  const avgCompletion = totalViews > 0 ? totalCompletion / totalViews : 0;
                  const downloadRate = totalViews > 0 ? (downloads / totalViews) * 100 : 0;

                  const timeScore = Math.min(100, (avgTime / 120) * 100);
                  const completionScore = avgCompletion;
                  const downloadScore = Math.min(100, downloadRate * 2);

                  const qualityScore = (timeScore * 0.35) + (completionScore * 0.35) + (downloadScore * 0.30);
                  const performanceScore = Math.round((volumeScore * 0.25) + (qualityScore * volumeMultiplier * 0.75));

                  return { ...file, performanceScore: Math.min(100, Math.max(0, performanceScore)) };
                });

              // Performance < 20, ascending order (lowest = most urgent first), up to 5 items
              const lowPerformance = filesWithScore
                .filter(f => f.views > 0 && f.performanceScore < 20)
                .sort((a, b) => a.performanceScore - b.performanceScore)
                .slice(0, 5);

              if (lowPerformance.length > 0) {
                return (
                  <div className="space-y-3">
                    {lowPerformance.map((file) => {
                      const performance = file.performanceScore;
                      let reason = '';
                      let suggestion = '';
                      if (performance === 0) {
                        reason = 'No views yet';
                        suggestion = 'Share this link to get started';
                      } else if (performance < 10) {
                        reason = 'Very low performance';
                        suggestion = 'Consider revising content';
                      } else {
                        reason = 'Low performance';
                        suggestion = 'Room for improvement';
                      }

                      return (
                        <a
                          key={file.id}
                          href={`/dashboard/files/${file.id}`}
                          className="block p-3 rounded-lg border border-yellow-100 bg-yellow-50/30 hover:border-yellow-200 hover:bg-yellow-50 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{getFileIcon(file.mime_type || file.fileType, file.type)}</span>
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-yellow-700">
                                  {file.slug || file.name}
                                </p>
                              </div>
                              <p className="text-xs text-yellow-700 mt-0.5">{reason} · {suggestion}</p>

                              {/* Performance Score Bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-500">Performance</span>
                                  <span className="font-semibold text-yellow-600">{performance}</span>
                                </div>
                                <div className="h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 rounded-full transition-all"
                                    style={{ width: `${Math.max(performance, 3)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-sm font-medium">All files performing well!</p>
                  <p className="text-xs mt-1 text-slate-400">No files with performance below 20</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN: TRACK SITES */}
        <div className="space-y-4">
          {/* Top Performing Track Sites */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">🔗</span> Top Performing Track Sites
              </h3>
              <div className="group relative">
                <span className="text-slate-400 hover:text-slate-600 cursor-help text-sm">ⓘ</span>
                <div className="absolute right-0 top-6 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  <p className="font-medium mb-1">Ranking by Performance</p>
                  <p className="text-slate-300">Top 3 track sites ranked by Performance score (0-100). Based on click volume plus quality metrics: unique visitors, return rate, recency, and velocity.</p>
                </div>
              </div>
            </div>

            {(() => {
              // Calculate Link-Level Performance score for each track site
              const trackSitesWithScore = files
                .filter(f => f.type === 'url')
                .map(site => {
                  // Get logs for this specific track site
                  const siteLogs = logs.filter(l => l.fileId === site.id);
                  const totalClicks = siteLogs.length || site.views || 0;

                  if (totalClicks === 0) {
                    return { ...site, performanceScore: 0 };
                  }

                  // VOLUME-GATED FORMULA FOR TRACK SITES
                  // Base volume score
                  const volumeScore = Math.min(100, 20 * Math.log10(totalClicks + 1));

                  // Volume multiplier gates all bonuses
                  const volumeMultiplier = Math.min(1, totalClicks / 500);

                  // Unique clickers
                  const uniqueClickers = new Set(
                    siteLogs.map(l => l.viewerEmail || l.ipAddress || (l.country || '') + (l.deviceType || ''))
                  ).size || 1;

                  // Reach bonus (max 20 pts at full volume)
                  const reachRatio = (uniqueClickers / totalClicks) * 100;
                  const reachBonus = reachRatio * 0.20 * volumeMultiplier;

                  // Return bonus (max 20 pts at full volume)
                  const returnClickers = siteLogs.filter(l => l.isReturnVisit).length;
                  const returnRatio = uniqueClickers > 0 ? (returnClickers / uniqueClickers) * 100 : 0;
                  const returnBonus = returnRatio * 0.20 * volumeMultiplier;

                  // Recency bonus (max 10 pts at full volume)
                  const sortedLogs = [...siteLogs].sort((a, b) =>
                    new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
                  );
                  const lastClickDate = sortedLogs[0]?.accessedAt;
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

                  // Velocity bonus (max 10 pts at full volume)
                  const now = new Date();
                  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                  const clicksThisWeek = siteLogs.filter(l => new Date(l.accessedAt) >= oneWeekAgo).length;
                  const clicksLastWeek = siteLogs.filter(l => {
                    const date = new Date(l.accessedAt);
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

                  // Final Performance score = base + gated bonuses
                  const performanceScore = Math.round(volumeScore + reachBonus + returnBonus + recencyBonus + velocityBonus);

                  return { ...site, performanceScore };
                });

              // Top 3 by Performance score (>= 20 threshold)
              const topTrackSites = trackSitesWithScore
                .filter(s => s.performanceScore >= 20)
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .slice(0, 3);

              if (topTrackSites.length > 0) {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div className="space-y-3">
                    {topTrackSites.map((site, i) => {
                      const performance = site.performanceScore;
                      const reason = performance >= 70
                        ? 'Excellent performance'
                        : performance >= 40
                          ? 'Good performance'
                          : performance >= 20
                            ? 'Moderate performance'
                            : 'Low performance';

                      return (
                        <a
                          key={site.id}
                          href={`/dashboard/files/${site.id}`}
                          className="block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{medals[i]}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🔗</span>
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600">
                                  {site.slug || site.name}
                                </p>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{reason}</p>

                              {/* Performance Score Bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-500">Performance</span>
                                  <span className={`font-semibold ${
                                    performance >= 70 ? 'text-green-600' :
                                    performance >= 40 ? 'text-blue-600' :
                                    'text-slate-500'
                                  }`}>{performance}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      performance >= 70 ? 'bg-green-500' :
                                      performance >= 40 ? 'bg-blue-500' :
                                      'bg-slate-300'
                                    }`}
                                    style={{ width: `${performance}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-sm font-medium">No top performers yet</p>
                  <p className="text-xs mt-1 text-slate-400">Track sites need Performance score of 20+ to appear here</p>
                </div>
              );
            })()}
          </div>

          {/* Needs Attention - Track Sites */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Track Sites Needing Attention
              </h3>
              <div className="group relative">
                <span className="text-slate-400 hover:text-slate-600 cursor-help text-sm">ⓘ</span>
                <div className="absolute right-0 top-6 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  <p className="font-medium mb-1">Low Performance Alert</p>
                  <p className="text-slate-300">Track sites with Performance score below 20 need attention. May need better placement or promotion. Sorted by lowest score first.</p>
                </div>
              </div>
            </div>

            {(() => {
              // Calculate Link-Level Performance score for all track sites
              const trackSitesWithScore = files
                .filter(f => f.type === 'url')
                .map(site => {
                  // Get logs for this specific track site
                  const siteLogs = logs.filter(l => l.fileId === site.id);
                  const totalClicks = siteLogs.length || site.views || 0;

                  if (totalClicks === 0) {
                    return { ...site, performanceScore: 0 };
                  }

                  // VOLUME-GATED FORMULA FOR TRACK SITES
                  // Base volume score
                  const volumeScore = Math.min(100, 20 * Math.log10(totalClicks + 1));

                  // Volume multiplier gates all bonuses
                  const volumeMultiplier = Math.min(1, totalClicks / 500);

                  // Unique clickers
                  const uniqueClickers = new Set(
                    siteLogs.map(l => l.viewerEmail || l.ipAddress || (l.country || '') + (l.deviceType || ''))
                  ).size || 1;

                  // Reach bonus (max 20 pts at full volume)
                  const reachRatio = (uniqueClickers / totalClicks) * 100;
                  const reachBonus = reachRatio * 0.20 * volumeMultiplier;

                  // Return bonus (max 20 pts at full volume)
                  const returnClickers = siteLogs.filter(l => l.isReturnVisit).length;
                  const returnRatio = uniqueClickers > 0 ? (returnClickers / uniqueClickers) * 100 : 0;
                  const returnBonus = returnRatio * 0.20 * volumeMultiplier;

                  // Recency bonus (max 10 pts at full volume)
                  const sortedLogs = [...siteLogs].sort((a, b) =>
                    new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
                  );
                  const lastClickDate = sortedLogs[0]?.accessedAt;
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

                  // Velocity bonus (max 10 pts at full volume)
                  const now = new Date();
                  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                  const clicksThisWeek = siteLogs.filter(l => new Date(l.accessedAt) >= oneWeekAgo).length;
                  const clicksLastWeek = siteLogs.filter(l => {
                    const date = new Date(l.accessedAt);
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

                  // Final Performance score = base + gated bonuses
                  const performanceScore = Math.round(volumeScore + reachBonus + returnBonus + recencyBonus + velocityBonus);

                  return { ...site, performanceScore };
                });

              // Performance < 20, ascending order (lowest = most urgent first), up to 5 items
              const lowPerformers = trackSitesWithScore
                .filter(site => site.performanceScore < 20)
                .sort((a, b) => a.performanceScore - b.performanceScore)
                .slice(0, 5);

              if (lowPerformers.length > 0) {
                return (
                  <div className="space-y-3">
                    {lowPerformers.map((site) => {
                      const performance = site.performanceScore;
                      let reason = '';
                      let suggestion = '';
                      if (performance === 0) {
                        reason = 'No clicks yet';
                        suggestion = 'Promote this link';
                      } else if (performance < 10) {
                        reason = 'Very low performance';
                        suggestion = 'Needs more exposure';
                      } else {
                        reason = 'Low performance';
                        suggestion = 'Room for improvement';
                      }

                      return (
                        <a
                          key={site.id}
                          href={`/dashboard/files/${site.id}`}
                          className="block p-3 rounded-lg border border-yellow-100 bg-yellow-50/30 hover:border-yellow-200 hover:bg-yellow-50 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🔗</span>
                                <p className="text-sm font-medium text-slate-900 truncate group-hover:text-yellow-700">
                                  {site.slug || site.name}
                                </p>
                              </div>
                              <p className="text-xs text-yellow-700 mt-0.5">{reason} · {suggestion}</p>

                              {/* Performance Score Bar */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-500">Performance</span>
                                  <span className="font-semibold text-yellow-600">{performance}</span>
                                </div>
                                <div className="h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 rounded-full transition-all"
                                    style={{ width: `${Math.max(performance, 3)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-sm font-medium">All track sites performing well!</p>
                  <p className="text-xs mt-1 text-slate-400">No track sites with performance below 20</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
