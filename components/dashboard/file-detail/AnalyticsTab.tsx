'use client';

import React, { useState, useMemo, useEffect } from 'react';
import WorldMap from '../WorldMap';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';
import { useTimezone } from '@/contexts/TimezoneContext';
import {
  getDateStringInTimezone,
  getHourInTimezone,
  getDayOfWeekInTimezone,
  getWeekStartInTimezone,
  getMonthKeyInTimezone,
  formatDateInTimezone,
  formatHourRange,
  generateDateKeysInTimezone,
  generateWeekKeysInTimezone,
  generateMonthKeysInTimezone,
  formatDateKeyForDisplay,
  formatMonthKeyForDisplay,
  formatMonthKeyForFullDisplay,
} from '@/lib/timezone';

// Types
interface AccessLog {
  id: string;
  accessed_at: string;
  engagement_score?: number; // Now optional - calculated dynamically
  total_duration_seconds?: number;
  completion_percentage?: number;
  downloaded?: boolean;
  is_return_visit?: boolean;
  country?: string;
  city?: string;
  region?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  language?: string;
  traffic_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  is_qr_scan?: boolean;
  viewer_email?: string;
  pages_time_data?: Record<string, number>;
  watch_time_seconds?: number;
  video_duration_seconds?: number;
  exit_page?: number;
  segments_time_data?: Record<string, number>; // Video segment tracking
}

interface FileSummary {
  totalViews: number;
  uniqueViewers: number;
  avgEngagement: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  downloadCount: number;
  returnVisits: number;
  qrScans: number;
  directClicks: number;
  avgTimeSpent?: number;
  completionRate?: number;
}

type FileTypeCategory = 'document' | 'media' | 'image' | 'other' | 'url';

interface FileNote {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

interface AnalyticsTabProps {
  logs: AccessLog[];
  summary: FileSummary;
  totalPages?: number;
  pageLabels?: Record<number, string>;
  isDocument?: boolean;
  isExternalRedirect?: boolean;
  fileType?: FileTypeCategory;
  videoDuration?: number;
  startDate?: Date;
  endDate?: Date;
  isTrackSite?: boolean;
  fileId?: string;
}

// ViewMode type removed - using days-only line chart

// Helper Functions - Always use seconds for clarity, decimal precision for short durations
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  // For very short times (< 10s), show decimal precision
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  // For times under 60 seconds, show whole seconds
  if (seconds < 60) return `${Math.round(seconds)}s`;
  // For times under 1 hour, show in seconds for consistency
  if (seconds < 3600) return `${Math.round(seconds)}s`;
  // For 1 hour+, show hours and minutes
  const hours = Math.floor(seconds / 3600);
  const remainMins = Math.floor((seconds % 3600) / 60);
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

// ISO code to full country name mapping
const ISO_TO_COUNTRY: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'AU': 'Australia',
  'BR': 'Brazil',
  'TH': 'Thailand',
  'SG': 'Singapore',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'NL': 'Netherlands',
  'ES': 'Spain',
  'IT': 'Italy',
  'SE': 'Sweden',
  'MX': 'Mexico',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'RU': 'Russia',
  'PL': 'Poland',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'TR': 'Turkey',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'UA': 'Ukraine',
  'CZ': 'Czech Republic',
  'RO': 'Romania',
  'HU': 'Hungary',
  'GR': 'Greece',
  'BY': 'Belarus',
};

function normalizeCountryName(country: string | undefined): string {
  if (!country) return 'Unknown';
  if (country.length > 2) return country;
  return ISO_TO_COUNTRY[country.toUpperCase()] || country;
}

// Analytics calculation helpers
function getViewsByDayOfWeek(logs: AccessLog[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const counts = new Array(7).fill(0);
  logs.forEach(log => {
    const day = new Date(log.accessed_at).getDay();
    counts[day]++;
  });
  const total = logs.length || 1;
  return days.map((name, i) => ({
    name,
    count: counts[i],
    percentage: Math.round((counts[i] / total) * 100),
  }));
}

function getViewsByHour(logs: AccessLog[]) {
  const counts = new Array(24).fill(0);
  logs.forEach(log => {
    const hour = new Date(log.accessed_at).getHours();
    counts[hour]++;
  });
  return { data: counts };
}

function getTopCountries(logs: AccessLog[], limit = 5) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const country = normalizeCountryName(log.country);
    counts.set(country, (counts.get(country) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopCities(logs: AccessLog[], limit = 5) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const city = log.city || 'Unknown';
    counts.set(city, (counts.get(city) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopRegions(logs: AccessLog[], limit = 5) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    // Use country as region if no specific region, and normalize ISO codes
    const region = log.region || normalizeCountryName(log.country);
    counts.set(region, (counts.get(region) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getDeviceBreakdown(logs: AccessLog[]) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const device = log.device_type || 'Unknown';
    counts.set(device, (counts.get(device) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function getBrowserBreakdown(logs: AccessLog[], limit = 5) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const browser = log.browser || 'Unknown';
    counts.set(browser, (counts.get(browser) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTrafficSources(logs: AccessLog[]) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const source = log.traffic_source || 'direct';
    counts.set(source, (counts.get(source) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function getLanguageBreakdown(logs: AccessLog[], limit = 5) {
  const counts = new Map<string, number>();
  logs.forEach(log => {
    const lang = log.language || 'Unknown';
    counts.set(lang, (counts.get(lang) || 0) + 1);
  });
  const total = logs.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getBestTimeToShare(logs: AccessLog[], timezone: string) {
  if (logs.length === 0) return null;
  const hourCounts = new Array(24).fill(0);
  logs.forEach(log => {
    // Use timezone-aware hour extraction
    const hour = getHourInTimezone(log.accessed_at, timezone);
    hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const startHour = peakHour;
  const endHour = (peakHour + 2) % 24;
  const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}${suffix}`;
  };
  return {
    hours: `${formatHour(startHour)} - ${formatHour(endHour)}`,
    peakHour,
  };
}

function getPageAnalysis(logs: AccessLog[], totalPages: number, pageLabels?: Record<number, string>) {
  // Collect all page data from logs
  const pageData: Record<number, { totalTime: number; viewCount: number }> = {};
  const exitCounts: Record<number, number> = {};
  let maxPageFromData = 0;

  logs.forEach(log => {
    // Count exit pages
    if (log.exit_page) {
      exitCounts[log.exit_page] = (exitCounts[log.exit_page] || 0) + 1;
    }

    if (log.pages_time_data) {
      Object.entries(log.pages_time_data).forEach(([page, time]) => {
        const pageNum = parseInt(page);
        if (!isNaN(pageNum)) {
          if (!pageData[pageNum]) pageData[pageNum] = { totalTime: 0, viewCount: 0 };
          pageData[pageNum].totalTime += time;
          pageData[pageNum].viewCount++;
          maxPageFromData = Math.max(maxPageFromData, pageNum);
        }
      });
    }
  });

  // Use provided totalPages OR infer from data
  const effectiveTotalPages = totalPages > 0 ? totalPages : maxPageFromData;

  if (effectiveTotalPages === 0) return [];

  const totalViewers = logs.length;

  const result = [];
  for (let i = 1; i <= effectiveTotalPages; i++) {
    const data = pageData[i] || { totalTime: 0, viewCount: 0 };
    const exitCount = exitCounts[i] || 0;
    const exitRate = totalViewers > 0 ? Math.round((exitCount / totalViewers) * 100) : 0;

    result.push({
      page: i,
      totalTime: data.totalTime, // Changed from avgTime to totalTime
      viewCount: data.viewCount,
      exitCount,
      exitRate,
      label: pageLabels?.[i] || '',
      isPopular: false, // Will be set below - MOST VIEWERS (only if unique)
      isMostEngaging: false, // LONGEST TOTAL TIME (only if unique)
      isHighExit: exitRate >= 20,
    });
  }

  // Mark popular page (MOST VIEWERS - only if ONE page has unique max)
  if (result.length > 0) {
    const maxViewers = Math.max(...result.map(p => p.viewCount));
    if (maxViewers > 0) {
      const pagesWithMax = result.filter(p => p.viewCount === maxViewers);
      // Only mark as Popular if exactly ONE page has the max viewers
      if (pagesWithMax.length === 1) {
        pagesWithMax[0].isPopular = true;
      }
    }
  }

  // Mark most engaging page (LONGEST TOTAL TIME - only if ONE page has unique max)
  if (result.length > 0) {
    const maxTime = Math.max(...result.map(p => p.totalTime));
    if (maxTime > 0) {
      const pagesWithMaxTime = result.filter(p => p.totalTime === maxTime);
      // Only mark as Most Engaging if exactly ONE page has the max time (independent of Popular)
      if (pagesWithMaxTime.length === 1) {
        pagesWithMaxTime[0].isMostEngaging = true;
      }
    }
  }

  return result;
}

// Component: Progress Bar with Hover Tooltip
function ProgressBar({
  value,
  max,
  color = 'blue',
  label,
  showTooltip = true
}: {
  value: number;
  max: number;
  color?: string;
  label?: string;
  showTooltip?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500', red: 'bg-red-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500', slate: 'bg-slate-400',
  };
  const hoverColorClasses: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600', red: 'bg-red-600',
    yellow: 'bg-yellow-600', purple: 'bg-purple-600', slate: 'bg-slate-500',
  };

  return (
    <div
      className="relative h-2 bg-slate-100 rounded-full overflow-hidden flex-1 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div
        className={`h-full rounded-full transition-all duration-150 ${
          isHovered ? (hoverColorClasses[color] || 'bg-blue-600') : (colorClasses[color] || 'bg-blue-500')
        }`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />

      {/* Hover Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
            {label && <div className="font-medium text-slate-300">{label}</div>}
            <div className="font-bold">{value} of {max} ({percentage}%)</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Analytics Card
function AnalyticsCard({ title, icon, metricKey, children }: { title: string; icon: string; metricKey?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="font-semibold text-slate-800 text-sm tracking-wide">{title}</span>
        {metricKey && <InfoTooltip content={getMetricDefinition(metricKey)} position="top" />}
      </div>
      {children}
    </div>
  );
}

// Component: Views Over Time - BAR Chart with Hover Tooltips and Daily/Weekly/Monthly toggle
interface ViewsOverTimeChartProps {
  logs: AccessLog[];
  startDate: Date;
  endDate: Date;
}

function ViewsOverTimeChart({ logs, startDate, endDate }: ViewsOverTimeChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { timezone } = useTimezone();

  const data = useMemo(() => {
    if (viewMode === 'daily') {
      // Daily: One bar per day in the selected timezone
      const dateKeys = generateDateKeysInTimezone(startDate, endDate, timezone);
      const dayCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      dateKeys.forEach(key => {
        dayCounts.set(key, {
          label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
          fullLabel: formatDateKeyForDisplay(key, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          value: 0,
        });
      });

      logs.forEach(log => {
        const key = getDateStringInTimezone(log.accessed_at, timezone);
        const day = dayCounts.get(key);
        if (day) day.value++;
      });

      return Array.from(dayCounts.values());
    } else if (viewMode === 'weekly') {
      // Weekly: One bar per week in the selected timezone
      const weekKeys = generateWeekKeysInTimezone(startDate, endDate, timezone);
      const weekCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      weekKeys.forEach(key => {
        weekCounts.set(key, {
          label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
          fullLabel: `Week of ${formatDateKeyForDisplay(key, { month: 'short', day: 'numeric', year: 'numeric' })}`,
          value: 0,
        });
      });

      logs.forEach(log => {
        const weekStart = getWeekStartInTimezone(log.accessed_at, timezone);
        const week = weekCounts.get(weekStart);
        if (week) week.value++;
      });

      return Array.from(weekCounts.values());
    } else {
      // Monthly: One bar per month in the selected timezone
      const monthKeys = generateMonthKeysInTimezone(startDate, endDate, timezone);
      const monthCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      monthKeys.forEach(key => {
        monthCounts.set(key, {
          label: formatMonthKeyForDisplay(key, { month: 'short' }),
          fullLabel: formatMonthKeyForFullDisplay(key),
          value: 0,
        });
      });

      logs.forEach(log => {
        const monthKey = getMonthKeyInTimezone(log.accessed_at, timezone);
        const month = monthCounts.get(monthKey);
        if (month) month.value++;
      });

      return Array.from(monthCounts.values());
    }
  }, [logs, startDate, endDate, viewMode, timezone]);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const hasData = data.some(d => d.value > 0);
  const modeLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>📈</span>
          <span className="font-semibold text-slate-800 text-sm tracking-wide">Views over time</span>
          <InfoTooltip content={getMetricDefinition('viewsOverTime')} position="top" />
        </div>
        {/* Daily/Weekly/Monthly Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-32 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs">No views in this period</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Bar Chart - DYNAMIC HEIGHT: max value = 100% */}
          <div className="h-32 flex items-end gap-[2px]">
            {data.map((item, index) => {
              // DYNAMIC: Calculate height as percentage of max value
              const heightPercent = (item.value / maxValue) * 100;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar - height is dynamic based on value/maxValue */}
                  <div
                    className={`w-full rounded-t transition-all duration-150 ${
                      isHovered ? 'bg-blue-600' : item.value > 0 ? 'bg-blue-500' : 'bg-slate-100'
                    }`}
                    style={{
                      height: item.value > 0 ? `${heightPercent}%` : '2px',
                      minHeight: item.value > 0 ? '4px' : '2px'
                    }}
                  />

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                      <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        <div className="font-medium">{item.fullLabel}</div>
                        <div className="text-blue-300 font-bold">{item.value} views</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{data[0]?.label}</span>
            {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
            <span>{data[data.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Popular Hours - Bar Chart with Hover Tooltips
function PopularHoursChart({ logs }: { logs: AccessLog[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { timezone } = useTimezone();

  const data = useMemo(() => {
    const hourCounts = new Array(24).fill(0);

    logs.forEach(log => {
      // Use timezone-aware hour extraction
      const hour = getHourInTimezone(log.accessed_at, timezone);
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      hour,
      label: `${hour}:00`,
      fullLabel: `${hour}:00 - ${(hour + 1) % 24}:00`,
      value: count,
    }));
  }, [logs, timezone]);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const hasData = data.some(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Header - info icon at END */}
      <div className="flex items-center gap-2 mb-3">
        <span>🕐</span>
        <span className="font-semibold text-slate-800 text-sm tracking-wide">Popular hours</span>
        <InfoTooltip content={getMetricDefinition('popularHours')} position="top" />
      </div>

      {!hasData ? (
        <div className="h-32 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-1">🕐</div>
            <p className="text-xs">No data yet</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Bar Chart - DYNAMIC HEIGHT: max value = 100% */}
          <div className="h-32 flex items-end gap-[1px]">
            {data.map((item, index) => {
              // DYNAMIC: Max value = 100% height
              const heightPercent = (item.value / maxValue) * 100;
              const isHovered = hoveredIndex === index;
              const isPeak = item.value === maxValue && item.value > 0;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar - dynamic height */}
                  <div
                    className={`w-full rounded-t transition-all duration-150 ${
                      isHovered ? 'bg-blue-600' : isPeak ? 'bg-green-500' : item.value > 0 ? 'bg-blue-500' : 'bg-slate-100'
                    }`}
                    style={{
                      height: item.value > 0 ? `${heightPercent}%` : '2px',
                      minHeight: item.value > 0 ? '4px' : '2px'
                    }}
                  />

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                      <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        <div className="font-medium">{item.fullLabel}</div>
                        <div className="text-blue-300 font-bold">{item.value} views</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>12AM</span>
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>11PM</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Document Analytics - Standardized format with Completion Funnel
function DocumentAnalyticsSection({ logs, totalPages, pageLabels }: { logs: AccessLog[]; totalPages: number; pageLabels?: Record<number, string> }) {
  // Infer totalPages from logs if not provided
  const inferredTotalPages = useMemo(() => {
    if (totalPages > 0) return totalPages;
    let maxPage = 0;
    logs.forEach(log => {
      if (log.pages_time_data) {
        Object.keys(log.pages_time_data).forEach(page => {
          const pageNum = parseInt(page);
          if (!isNaN(pageNum)) maxPage = Math.max(maxPage, pageNum);
        });
      }
      if (log.exit_page) {
        maxPage = Math.max(maxPage, log.exit_page);
      }
    });
    return maxPage;
  }, [logs, totalPages]);

  const pageAnalysis = useMemo(() => getPageAnalysis(logs, inferredTotalPages, pageLabels), [logs, inferredTotalPages, pageLabels]);

  // Calculate completion funnel
  const completionFunnel = useMemo(() => {
    if (logs.length === 0) return { q25: 0, q50: 0, q75: 0, q100: 0, biggestDrop: '' };

    const reached25 = logs.filter(l => (l.completion_percentage || 0) >= 25).length;
    const reached50 = logs.filter(l => (l.completion_percentage || 0) >= 50).length;
    const reached75 = logs.filter(l => (l.completion_percentage || 0) >= 75).length;
    const reached100 = logs.filter(l => (l.completion_percentage || 0) >= 95).length; // 95%+ = finished

    const total = logs.length;
    const q25 = Math.round((reached25 / total) * 100);
    const q50 = Math.round((reached50 / total) * 100);
    const q75 = Math.round((reached75 / total) * 100);
    const q100 = Math.round((reached100 / total) * 100);

    // Find biggest drop
    const drops = [
      { from: 'Start', to: '25%', drop: 100 - q25 },
      { from: '25%', to: '50%', drop: q25 - q50 },
      { from: '50%', to: '75%', drop: q50 - q75 },
      { from: '75%', to: '100%', drop: q75 - q100 },
    ].filter(d => d.drop > 0);

    const biggest = drops.sort((a, b) => b.drop - a.drop)[0];
    const biggestDrop = biggest ? `${biggest.from} → ${biggest.to}` : '';

    return { q25, q50, q75, q100, biggestDrop };
  }, [logs]);

  if (pageAnalysis.length === 0) {
    return (
      <AnalyticsCard title="Document analytics" icon="📄" metricKey="pageAnalytics">
        <div className="text-center py-4 text-slate-500">
          <p className="text-sm">No page data yet</p>
          <p className="text-xs mt-1">Share your document to collect page analytics</p>
        </div>
      </AnalyticsCard>
    );
  }

  // Calculate summary stats
  const avgTime = pageAnalysis.reduce((sum, p) => sum + p.avgTime, 0) / pageAnalysis.length;
  const avgCompletion = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.completion_percentage || 0), 0) / logs.length)
    : 0;
  const popularPage = pageAnalysis.find(p => p.isPopular);

  // Find top exit pages (pages where most people left)
  const topExitPages = [...pageAnalysis]
    .filter(p => p.exitCount > 0)
    .sort((a, b) => b.exitRate - a.exitRate)
    .slice(0, 3);

  const maxTime = Math.max(...pageAnalysis.map(p => p.avgTime), 1);

  return (
    <div className="space-y-4">
      {/* Summary Row - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnalyticsCard title="Quick summary" icon="📊" metricKey="quickSummary">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Total pages:</span>
                <InfoTooltip content={getMetricDefinition('totalPages')} position="top" size="sm" />
              </div>
              <span className="font-medium">{inferredTotalPages}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Avg view time:</span>
                <InfoTooltip content={getMetricDefinition('avgViewTime')} position="top" size="sm" />
              </div>
              <span className="font-medium">{formatDuration(
                logs.length > 0
                  ? Math.round(logs.reduce((sum, l) => sum + (l.total_duration_seconds || 0), 0) / logs.length)
                  : 0
              )}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Avg completion:</span>
                <InfoTooltip content={getMetricDefinition('avgCompletion')} position="top" size="sm" />
              </div>
              <span className="font-medium">{avgCompletion}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Most popular:</span>
                <InfoTooltip content={getMetricDefinition('mostPopular')} position="top" size="sm" />
              </div>
              <span className="font-medium">Pg{popularPage?.page || 1}</span>
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Completion funnel" icon="📈" metricKey="completionFunnel">
          {(() => {
            // Calculate milestone pages
            const page25 = Math.ceil(inferredTotalPages * 0.25);
            const page50 = Math.ceil(inferredTotalPages * 0.50);
            const page75 = Math.ceil(inferredTotalPages * 0.75);
            const pageFinal = inferredTotalPages;
            const totalViewers = logs.length;

            // Count viewers who reached each milestone
            const reached25 = logs.filter(l => (l.completion_percentage || 0) >= 25).length;
            const reached50 = logs.filter(l => (l.completion_percentage || 0) >= 50).length;
            const reached75 = logs.filter(l => (l.completion_percentage || 0) >= 75).length;
            const reachedFinished = logs.filter(l => (l.completion_percentage || 0) >= 95).length;

            const milestones = [
              { label: `Page ${page25}`, count: reached25, percent: totalViewers > 0 ? Math.round((reached25 / totalViewers) * 100) : 0 },
              { label: `Page ${page50}`, count: reached50, percent: totalViewers > 0 ? Math.round((reached50 / totalViewers) * 100) : 0 },
              { label: `Page ${page75}`, count: reached75, percent: totalViewers > 0 ? Math.round((reached75 / totalViewers) * 100) : 0 },
              { label: `Finished Pg${pageFinal}`, count: reachedFinished, percent: totalViewers > 0 ? Math.round((reachedFinished / totalViewers) * 100) : 0, isFinished: true },
            ];

            // Find biggest drop with page references
            const drops = [
              { from: 'Start', to: `Pg${page25}`, drop: 100 - milestones[0].percent },
              { from: `Pg${page25}`, to: `Pg${page50}`, drop: milestones[0].percent - milestones[1].percent },
              { from: `Pg${page50}`, to: `Pg${page75}`, drop: milestones[1].percent - milestones[2].percent },
              { from: `Pg${page75}`, to: `Pg${pageFinal}`, drop: milestones[2].percent - milestones[3].percent },
            ].filter(d => d.drop > 0);
            const biggestDrop = drops.sort((a, b) => b.drop - a.drop)[0];

            return (
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium mb-2">Reached</div>
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs w-24 ${m.isFinished ? 'text-green-600 font-medium' : 'text-slate-600'}`}>{m.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-20 text-right ${m.isFinished ? 'text-green-600' : 'text-slate-700'}`}>
                      {m.count} of {totalViewers} ({m.percent}%)
                    </span>
                  </div>
                ))}
                {biggestDrop && biggestDrop.drop > 0 && (
                  <div className="text-xs text-amber-600 pt-2 border-t border-slate-100 mt-2">
                    💡 Biggest drop: {biggestDrop.from} → {biggestDrop.to}
                  </div>
                )}
              </div>
            );
          })()}
        </AnalyticsCard>

        <AnalyticsCard title="Top exit pages" icon="🚪" metricKey="topExitPages">
          {topExitPages.length > 0 ? (
            <div className="space-y-2">
              {topExitPages.map((page) => (
                <div key={page.page} className="flex justify-between text-sm">
                  <span className="text-slate-600">Page {page.page}:</span>
                  <span className="font-medium text-amber-600">{page.exitRate}% exited</span>
                </div>
              ))}
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                {topExitPages.length} page{topExitPages.length > 1 ? 's' : ''} with high exits
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <span className="text-2xl mb-2">📊</span>
              <span className="text-sm text-slate-600">No exit data yet</span>
              <span className="text-xs text-slate-400">Need more viewers</span>
            </div>
          )}
        </AnalyticsCard>
      </div>

      {/* Page-by-Page Table - Standardized Format */}
      <AnalyticsCard title="Page-by-page details" icon="📑" metricKey="pageAnalytics">
        <div className="overflow-x-auto">
          {(() => {
            const totalViewers = logs.length;
            const maxViewCount = Math.max(...pageAnalysis.map(p => p.viewCount || 0), 1);

            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Page</th>
                    <th className="pb-2 font-medium w-40">Viewers</th>
                    <th className="pb-2 font-medium">Total time</th>
                    <th className="pb-2 font-medium">Exit rate</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageAnalysis.map((page, index) => {
                    const isLastPage = index === pageAnalysis.length - 1;
                    const viewCount = page.viewCount || 0;
                    const exitCount = page.exitCount || 0;

                    return (
                      <tr key={page.page} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 font-medium">Pg{page.page}</td>
                        <td className="py-2">
                          {/* Merged Viewers: bar + number */}
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${(viewCount / maxViewCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-600 text-xs">{viewCount}</span>
                          </div>
                        </td>
                        <td className="py-2 text-slate-600">{formatDuration(page.totalTime)}</td>
                        <td className="py-2 text-slate-600">
                          {exitCount > 0 ? `${exitCount} of ${totalViewers} (${page.exitRate}%)` : '—'}
                        </td>
                        <td className="py-2">
                          {page.isPopular && (
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mr-1">
                              🏆 Popular
                            </span>
                          )}
                          {page.isMostEngaging && (
                            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full mr-1">
                              ⏱️ Engaging
                            </span>
                          )}
                          {page.isHighExit && !isLastPage && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              🚪 {page.exitRate}% exit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </AnalyticsCard>
    </div>
  );
}

// Component: Media Analytics - Standardized format with Completion Funnel
function MediaAnalyticsSection({ logs, videoDuration }: { logs: AccessLog[]; videoDuration?: number }) {
  const mediaLogs = logs.filter(l => l.watch_time_seconds !== undefined && l.watch_time_seconds !== null);

  // Get duration from file or from first log that has it
  const totalDuration = videoDuration ||
    mediaLogs.find(l => l.video_duration_seconds)?.video_duration_seconds ||
    0;

  // Calculate completion funnel
  const completionFunnel = useMemo(() => {
    if (mediaLogs.length === 0 || totalDuration === 0) {
      return { q25: 0, q50: 0, q75: 0, q100: 0, biggestDrop: '' };
    }

    const getCompletion = (log: AccessLog) => {
      const watchTime = log.watch_time_seconds || 0;
      const duration = log.video_duration_seconds || totalDuration;
      return duration > 0 ? (watchTime / duration) * 100 : 0;
    };

    const reached25 = mediaLogs.filter(l => getCompletion(l) >= 25).length;
    const reached50 = mediaLogs.filter(l => getCompletion(l) >= 50).length;
    const reached75 = mediaLogs.filter(l => getCompletion(l) >= 75).length;
    const reached100 = mediaLogs.filter(l => getCompletion(l) >= 90).length; // 90%+ = finished

    const total = mediaLogs.length;
    const q25 = Math.round((reached25 / total) * 100);
    const q50 = Math.round((reached50 / total) * 100);
    const q75 = Math.round((reached75 / total) * 100);
    const q100 = Math.round((reached100 / total) * 100);

    // Find biggest drop
    const drops = [
      { from: 'Start', to: '25%', drop: 100 - q25 },
      { from: '25%', to: '50%', drop: q25 - q50 },
      { from: '50%', to: '75%', drop: q50 - q75 },
      { from: '75%', to: '100%', drop: q75 - q100 },
    ].filter(d => d.drop > 0);

    const biggest = drops.sort((a, b) => b.drop - a.drop)[0];
    const biggestDrop = biggest ? `${biggest.from} → ${biggest.to}` : '';

    return { q25, q50, q75, q100, biggestDrop };
  }, [mediaLogs, totalDuration]);

  if (mediaLogs.length === 0) {
    return (
      <AnalyticsCard title="Media analytics" icon="🎬" metricKey="pageAnalytics">
        <div className="text-center py-4 text-slate-500">
          <p className="text-sm">No play data yet</p>
          <p className="text-xs mt-1">Share your media to collect play analytics</p>
        </div>
      </AnalyticsCard>
    );
  }

  // Calculate stats
  const avgPlayTime = Math.round(mediaLogs.reduce((sum, l) => sum + (l.watch_time_seconds || 0), 0) / mediaLogs.length);
  const avgCompletion = totalDuration > 0
    ? Math.round((avgPlayTime / totalDuration) * 100)
    : 0;
  const finishedCount = mediaLogs.filter(l => {
    const watchTime = l.watch_time_seconds || 0;
    const duration = l.video_duration_seconds || totalDuration;
    return duration > 0 && (watchTime / duration) >= 0.90;
  }).length;
  const finishedPercent = Math.round((finishedCount / mediaLogs.length) * 100);

  // Create 10 buckets (0-10%, 10-20%, ..., 90-100%)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    min: i * 10,
    max: (i + 1) * 10,
    label: `${i * 10}-${(i + 1) * 10}%`,
    count: 0, // Exit count at this segment
    exitRate: 0,
    viewersInSegment: new Set<string>(), // Track unique viewers who watched this segment
  }));

  // Fill buckets based on segments_time_data (who watched which segments)
  // OR fallback to watch_time_seconds for exit point
  mediaLogs.forEach((l, index) => {
    const viewerId = l.viewer_email || l.id || `viewer-${index}`;

    // NEW: Use segments_time_data if available (accurate segment tracking)
    if (l.segments_time_data && Object.keys(l.segments_time_data).length > 0) {
      // Add viewer to each segment they actually watched
      Object.keys(l.segments_time_data).forEach(segKey => {
        const segIndex = parseInt(segKey);
        if (segIndex >= 0 && segIndex < 10 && l.segments_time_data![segKey] > 0) {
          buckets[segIndex].viewersInSegment.add(viewerId);
        }
      });

      // Find exit point (highest segment they watched)
      const watchedSegments = Object.keys(l.segments_time_data)
        .map(k => parseInt(k))
        .filter(k => l.segments_time_data![k] > 0);
      if (watchedSegments.length > 0) {
        const exitSegment = Math.max(...watchedSegments);
        buckets[exitSegment].count++; // This is exit count
      }
    } else {
      // FALLBACK: Use watch_time_seconds to estimate exit point
      const watchTime = l.watch_time_seconds || 0;
      const duration = l.video_duration_seconds || totalDuration;
      if (duration > 0) {
        const completionPercent = (watchTime / duration) * 100;
        const exitBucketIndex = Math.min(Math.floor(completionPercent / 10), 9);
        buckets[exitBucketIndex].count++;

        // Assume they watched all segments up to exit point
        for (let i = 0; i <= exitBucketIndex; i++) {
          buckets[i].viewersInSegment.add(viewerId);
        }
      }
    }
  });

  // Calculate exit rates (exits at this segment / total viewers)
  buckets.forEach(b => {
    b.exitRate = mediaLogs.length > 0 ? Math.round((b.count / mediaLogs.length) * 100) : 0;
  });

  // Use viewersInSegment count for the bars (who watched this segment)
  const maxBucketCount = Math.max(...buckets.map(b => b.viewersInSegment.size), 1);

  // Find top exit points (excluding 90-100% which is "finished")
  const topExitBuckets = [...buckets]
    .slice(0, 9)
    .filter(b => b.count > 0)
    .sort((a, b) => b.exitRate - a.exitRate)
    .slice(0, 3);

  // Find peak bucket
  const peakBucket = buckets.reduce((max, b) => b.count > max.count ? b : max, buckets[0]);

  return (
    <div className="space-y-4">
      {/* Summary Row - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnalyticsCard title="Quick summary" icon="📊" metricKey="quickSummary">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Duration:</span>
              <span className="font-medium">{formatDuration(totalDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Avg play time:</span>
                <InfoTooltip content={getMetricDefinition('avgViewTime')} position="top" size="sm" />
              </div>
              <span className="font-medium">{formatDuration(avgPlayTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Avg completion:</span>
                <InfoTooltip content={getMetricDefinition('avgCompletion')} position="top" size="sm" />
              </div>
              <span className="font-medium">{avgCompletion}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <span>Finished:</span>
                <InfoTooltip content={getMetricDefinition('finished')} position="top" size="sm" />
              </div>
              <span className="font-medium">{finishedCount} ({finishedPercent}%)</span>
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Completion funnel" icon="📈" metricKey="completionFunnel">
          {(() => {
            // Calculate milestone times
            const time25 = Math.ceil(totalDuration * 0.25);
            const time50 = Math.ceil(totalDuration * 0.50);
            const time75 = Math.ceil(totalDuration * 0.75);
            const timeFinal = totalDuration;
            const totalViewers = mediaLogs.length;

            // Helper to format time as M:SS
            const formatTime = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Helper to get completion percentage for a log
            const getCompletion = (log: AccessLog) => {
              const watchTime = log.watch_time_seconds || 0;
              const duration = log.video_duration_seconds || totalDuration;
              return duration > 0 ? (watchTime / duration) * 100 : 0;
            };

            // Count viewers who reached each milestone
            const reached25 = mediaLogs.filter(l => getCompletion(l) >= 25).length;
            const reached50 = mediaLogs.filter(l => getCompletion(l) >= 50).length;
            const reached75 = mediaLogs.filter(l => getCompletion(l) >= 75).length;
            const reachedFinished = mediaLogs.filter(l => getCompletion(l) >= 90).length;

            const milestones = [
              { label: formatTime(time25), count: reached25, percent: totalViewers > 0 ? Math.round((reached25 / totalViewers) * 100) : 0 },
              { label: formatTime(time50), count: reached50, percent: totalViewers > 0 ? Math.round((reached50 / totalViewers) * 100) : 0 },
              { label: formatTime(time75), count: reached75, percent: totalViewers > 0 ? Math.round((reached75 / totalViewers) * 100) : 0 },
              { label: `Finished ${formatTime(timeFinal)}`, count: reachedFinished, percent: totalViewers > 0 ? Math.round((reachedFinished / totalViewers) * 100) : 0, isFinished: true },
            ];

            // Find biggest drop with time references
            const drops = [
              { from: 'Start', to: formatTime(time25), drop: 100 - milestones[0].percent },
              { from: formatTime(time25), to: formatTime(time50), drop: milestones[0].percent - milestones[1].percent },
              { from: formatTime(time50), to: formatTime(time75), drop: milestones[1].percent - milestones[2].percent },
              { from: formatTime(time75), to: formatTime(timeFinal), drop: milestones[2].percent - milestones[3].percent },
            ].filter(d => d.drop > 0);
            const biggestDrop = drops.sort((a, b) => b.drop - a.drop)[0];

            return (
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium mb-2">Reached</div>
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs w-24 ${m.isFinished ? 'text-green-600 font-medium' : 'text-slate-600'}`}>{m.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-20 text-right ${m.isFinished ? 'text-green-600' : 'text-slate-700'}`}>
                      {m.count} of {totalViewers} ({m.percent}%)
                    </span>
                  </div>
                ))}
                {biggestDrop && biggestDrop.drop > 0 && (
                  <div className="text-xs text-amber-600 pt-2 border-t border-slate-100 mt-2">
                    💡 Biggest drop: {biggestDrop.from} → {biggestDrop.to}
                  </div>
                )}
              </div>
            );
          })()}
        </AnalyticsCard>

        <AnalyticsCard title="Top exit points" icon="🚪" metricKey="topExitPages">
          {(() => {
            // Helper to format time as M:SS
            const formatTime = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = Math.round(seconds % 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Calculate time ranges for top exit buckets
            const bucketDuration = totalDuration / 10;
            const topExitWithTimes = topExitBuckets.map((bucket) => {
              const bucketIndex = Math.floor(bucket.min / 10);
              const startTime = Math.round(bucketIndex * bucketDuration);
              const endTime = Math.round((bucketIndex + 1) * bucketDuration);
              return {
                ...bucket,
                timeLabel: `${formatTime(startTime)}-${formatTime(endTime)}`,
              };
            });

            return topExitWithTimes.length > 0 ? (
              <div className="space-y-2">
                {topExitWithTimes.map((bucket) => (
                  <div key={bucket.min} className="flex justify-between text-sm">
                    <span className="text-slate-600">At {bucket.timeLabel}:</span>
                    <span className="font-medium text-amber-600">{bucket.exitRate}% exited</span>
                  </div>
                ))}
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  {topExitWithTimes.length} range{topExitWithTimes.length > 1 ? 's' : ''} with high exits
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4">
                <span className="text-2xl mb-2">✅</span>
                <span className="text-sm text-slate-600">All viewers finished!</span>
                <span className="text-xs text-slate-400">No early exits</span>
              </div>
            );
          })()}
        </AnalyticsCard>
      </div>

      {/* Timeline Breakdown Table - Standardized Format */}
      <AnalyticsCard title="Timeline breakdown" icon="📑" metricKey="pageAnalytics">
        <div className="overflow-x-auto">
          {(() => {
            const totalViewers = mediaLogs.length;

            // Helper to format time as M:SS
            const formatTime = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = Math.round(seconds % 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Helper to format duration with 1 decimal point
            const formatDur = (seconds: number) => {
              if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`; // 1 decimal point
              const mins = Math.floor(seconds / 60);
              const secs = Math.round((seconds % 60) * 10) / 10;
              return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
            };

            // Create 10 buckets with actual time ranges
            const bucketDuration = totalDuration / 10;
            const timeBuckets = buckets.map((bucket, index) => {
              const startTime = Math.round(index * bucketDuration);
              const endTime = Math.round((index + 1) * bucketDuration);
              return {
                ...bucket,
                timeLabel: `${formatTime(startTime)}-${formatTime(endTime)}`,
              };
            });

            // Pre-calculate for unique badges
            const maxViewerCount = Math.max(...timeBuckets.map(b => b.viewersInSegment.size));
            const bucketsWithMaxViewers = timeBuckets.filter(b => b.viewersInSegment.size === maxViewerCount);
            const showPopular = bucketsWithMaxViewers.length === 1 && maxViewerCount > 0;

            // Calculate total time per bucket (sum of all watch time in that segment)
            const bucketTotalTimes = timeBuckets.map((bucket, index) => {
              const bucketDur = totalDuration / 10;
              const startTime = index * bucketDur;
              const endTime = (index + 1) * bucketDur;
              // Sum watch time for viewers who reached this segment
              let totalTimeInBucket = 0;
              mediaLogs.forEach(log => {
                const watchTime = log.watch_time_seconds || 0;
                if (watchTime >= startTime) {
                  // Time spent in this bucket = min(watchTime, endTime) - startTime
                  const timeInThisBucket = Math.min(watchTime, endTime) - startTime;
                  if (timeInThisBucket > 0) {
                    totalTimeInBucket += timeInThisBucket;
                  }
                }
              });
              return totalTimeInBucket;
            });

            const maxTotalTime = Math.max(...bucketTotalTimes);
            const bucketsWithMaxTime = bucketTotalTimes.filter(t => t === maxTotalTime);
            const showMostEngaged = bucketsWithMaxTime.length === 1 && maxTotalTime > 0;
            const mostEngagedIndex = bucketTotalTimes.indexOf(maxTotalTime);

            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Range</th>
                    <th className="pb-2 font-medium w-40">Viewers</th>
                    <th className="pb-2 font-medium">Total time</th>
                    <th className="pb-2 font-medium">Exit rate</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timeBuckets.map((bucket, index) => {
                    const viewerCount = bucket.viewersInSegment.size;
                    const isFinishedBucket = index === 9;
                    const totalTimeForBucket = bucketTotalTimes[index];

                    // Exit rate: exits in this bucket / TOTAL viewers (not segment viewers)
                    const exitRate = totalViewers > 0 ? Math.round((bucket.count / totalViewers) * 100) : 0;
                    const isHighExit = exitRate >= 20 && !isFinishedBucket && bucket.count > 0;

                    // Popular: only if this bucket uniquely has max viewers
                    const isPopular = showPopular && viewerCount === maxViewerCount;

                    // Most Engaged: only if this bucket uniquely has max total time (independent of Popular)
                    const isMostEngaged = showMostEngaged && index === mostEngagedIndex;

                    return (
                      <tr key={bucket.min} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 font-medium">{bucket.timeLabel}</td>
                        <td className="py-2">
                          {/* Merged Viewers: bar + number */}
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${(viewerCount / maxBucketCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-slate-600 text-xs">{viewerCount}</span>
                          </div>
                        </td>
                        <td className="py-2 text-slate-600">{formatDur(totalTimeForBucket)}</td>
                        <td className="py-2 text-slate-600">
                          {bucket.count > 0 ? `${bucket.count} of ${totalViewers} (${exitRate}%)` : '—'}
                        </td>
                        <td className="py-2">
                          {isPopular && (
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mr-1">
                              🏆 Popular
                            </span>
                          )}
                          {isMostEngaged && (
                            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full mr-1">
                              ⏱️ Most Engaged
                            </span>
                          )}
                          {isHighExit && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              🚪 {exitRate}% exit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </AnalyticsCard>
    </div>
  );
}

// Component: External Redirect Notice
function ExternalRedirectNotice() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔗</span>
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">Track Site Link</h4>
          <p className="text-sm text-blue-700">
            This link redirects to an external site. Click data and visitor info are tracked.
            Engagement is calculated based on click volume, unique visitors, and return rate.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function AnalyticsTab({
  logs,
  summary,
  totalPages,
  pageLabels,
  isDocument,
  isExternalRedirect = false,
  fileType,
  videoDuration,
  startDate,
  endDate,
  isTrackSite = false,
  fileId,
}: AnalyticsTabProps) {
  const { timezone } = useTimezone();

  // Notes state
  const [notes, setNotes] = useState<FileNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Fetch notes
  useEffect(() => {
    if (!fileId) return;
    async function fetchNotes() {
      try {
        const res = await fetch(`/api/files/${fileId}/notes`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        console.error('Failed to fetch notes:', err);
      }
    }
    fetchNotes();
  }, [fileId]);

  // Notes handlers
  const handleAddNote = async () => {
    if (!newNote.trim() || !fileId) return;
    setSavingNote(true);
    setNoteSaved(false);
    try {
      const res = await fetch(`/api/files/${fileId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNewNote('');
        setNoteSaved(true);
        setTimeout(() => {
          setNoteSaved(false);
          setShowAddNote(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim() || !fileId) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/files/${fileId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editNoteContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map(n => n.id === noteId ? data.note : n));
        setEditingNoteId(null);
        setEditNoteContent('');
      }
    } catch (err) {
      console.error('Failed to edit note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!fileId) return;
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/files/${fileId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const startEditNote = (note: FileNote) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  const formatNoteDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Default to last 30 days if no dates provided
  const effectiveEndDate = endDate || new Date();
  const effectiveStartDate = startDate || new Date(effectiveEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate all analytics
  const dayOfWeek = useMemo(() => getViewsByDayOfWeek(logs), [logs]);
  const hourlyData = useMemo(() => getViewsByHour(logs), [logs]);
  const topCities = useMemo(() => getTopCities(logs, 5), [logs]);
  const topRegions = useMemo(() => getTopRegions(logs, 5), [logs]);
  const devices = useMemo(() => getDeviceBreakdown(logs), [logs]);
  const browsers = useMemo(() => getBrowserBreakdown(logs, 5), [logs]);
  const trafficSources = useMemo(() => getTrafficSources(logs), [logs]);
  const languages = useMemo(() => getLanguageBreakdown(logs, 5), [logs]);
  const bestTime = useMemo(() => getBestTimeToShare(logs, timezone), [logs, timezone]);

  // OS breakdown
  const osBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach(l => counts.set(l.os || 'Unknown', (counts.get(l.os || 'Unknown') || 0) + 1));
    const total = logs.length || 1;
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [logs]);

  // UTM campaigns
  const utmCampaigns = useMemo(() => {
    const counts = new Map<string, number>();
    logs.forEach(l => { if (l.utm_campaign) counts.set(l.utm_campaign, (counts.get(l.utm_campaign) || 0) + 1); });
    const total = logs.length || 1;
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [logs]);

  // World map data
  const worldMapData = useMemo(() => {
    const countryMap = new Map<string, { views: number; uniqueViewers: Set<string>; totalEngagement: number }>();
    logs.forEach(l => {
      const country = normalizeCountryName(l.country);
      if (country === 'Unknown') return;
      if (!countryMap.has(country)) countryMap.set(country, { views: 0, uniqueViewers: new Set(), totalEngagement: 0 });
      const data = countryMap.get(country)!;
      data.views++;
      if (l.viewer_email) data.uniqueViewers.add(l.viewer_email);
      data.totalEngagement += l.engagement_score || 0;
    });
    const codeMap: Record<string, string> = {
      'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 'Germany': 'DE',
      'France': 'FR', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN',
      'Australia': 'AU', 'Brazil': 'BR', 'Thailand': 'TH', 'Singapore': 'SG',
    };
    return Array.from(countryMap.entries()).map(([country, data]) => ({
      country, countryCode: codeMap[country] || 'XX', views: data.views,
      uniqueViewers: data.uniqueViewers.size,
      avgEngagement: data.views > 0 ? Math.round(data.totalEngagement / data.views) : 0,
    }));
  }, [logs]);

  // Check if has media data - only for UPLOADED media files, NOT Track Sites
  // Track Sites (type='url') always show simple redirect analytics, even for YouTube/TikTok
  const hasMediaData = logs.some(l => l.watch_time_seconds !== undefined && l.watch_time_seconds !== null && l.watch_time_seconds > 0);
  const isMedia = fileType === 'media';  // Only uploaded media files, NOT Track Sites

  // Max values
  const maxDayCount = Math.max(...dayOfWeek.map(d => d.count), 1);
  const maxHourCount = Math.max(...hourlyData.data, 1);

  // Always render all chart containers, even with no data
  // The individual charts will show empty states as needed

  return (
    <div className="space-y-4">
      {/* External Redirect Notice - Show for ALL Track Sites */}
      {(isExternalRedirect || fileType === 'url') && <ExternalRedirectNotice />}

      {/* ROW 1: Views Over Time, Engagement Breakdown, Best Time to Share */}
      {/* Track Sites now have engagement scores, so show breakdown for all types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ViewsOverTimeChart logs={logs} startDate={effectiveStartDate} endDate={effectiveEndDate} />

        {/* Show Engagement Breakdown for ALL content types (Files and Track Sites) */}
        {(
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span>🎯</span>
              <span className="font-semibold text-slate-800 text-sm tracking-wide">Engagement by viewer</span>
              <InfoTooltip content={getMetricDefinition('engagementBreakdown')} position="top" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20">🔥 Hot (70+)</span>
                <ProgressBar value={summary.hotLeads} max={summary.uniqueViewers} color="red" label={`${summary.hotLeads} of ${summary.uniqueViewers} (${summary.uniqueViewers > 0 ? Math.round(summary.hotLeads / summary.uniqueViewers * 100) : 0}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{summary.hotLeads} of {summary.uniqueViewers} ({summary.uniqueViewers > 0 ? Math.round(summary.hotLeads / summary.uniqueViewers * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20">🟡 Warm (40-69)</span>
                <ProgressBar value={summary.warmLeads} max={summary.uniqueViewers} color="yellow" label={`${summary.warmLeads} of ${summary.uniqueViewers} (${summary.uniqueViewers > 0 ? Math.round(summary.warmLeads / summary.uniqueViewers * 100) : 0}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{summary.warmLeads} of {summary.uniqueViewers} ({summary.uniqueViewers > 0 ? Math.round(summary.warmLeads / summary.uniqueViewers * 100) : 0}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20">⚪ Cold (&lt;40)</span>
                <ProgressBar value={summary.coldLeads} max={summary.uniqueViewers} color="slate" label={`${summary.coldLeads} of ${summary.uniqueViewers} (${summary.uniqueViewers > 0 ? Math.round(summary.coldLeads / summary.uniqueViewers * 100) : 0}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{summary.coldLeads} of {summary.uniqueViewers} ({summary.uniqueViewers > 0 ? Math.round(summary.coldLeads / summary.uniqueViewers * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>⏰</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Best time to share</span>
            <InfoTooltip content={getMetricDefinition('bestTimeToShare')} position="top" />
          </div>
          {bestTime ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <div className="text-3xl font-bold text-blue-600">{bestTime.hours}</div>
              <div className="text-sm text-slate-500 mt-2">Peak engagement window</div>
              <div className="mt-4 text-xs text-slate-400">Based on {logs.length} views</div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              <p className="text-sm">Need more data</p>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Top Days, Popular Hours, Access Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>📅</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Top days</span>
            <InfoTooltip content={getMetricDefinition('topDays')} position="top" />
          </div>
          <div className="space-y-2">
            {dayOfWeek.map(day => (
              <div key={day.name} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-12">{day.name.slice(0, 3)}</span>
                <ProgressBar value={day.count} max={maxDayCount} label={`${day.count} of ${logs.length} (${day.percentage}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{day.count} of {logs.length} ({day.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <PopularHoursChart logs={logs} />

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>📲</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Access method</span>
            <InfoTooltip content={getMetricDefinition('accessMethod')} position="top" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">🔗 Link clicks</span>
              <ProgressBar value={summary.directClicks} max={summary.totalViews} label={`${summary.directClicks} of ${summary.totalViews} (${summary.totalViews > 0 ? Math.round(summary.directClicks / summary.totalViews * 100) : 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{summary.directClicks} of {summary.totalViews} ({summary.totalViews > 0 ? Math.round(summary.directClicks / summary.totalViews * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-20">📱 QR scans</span>
              <ProgressBar value={summary.qrScans} max={summary.totalViews} color="green" label={`${summary.qrScans} of ${summary.totalViews} (${summary.totalViews > 0 ? Math.round(summary.qrScans / summary.totalViews * 100) : 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{summary.qrScans} of {summary.totalViews} ({summary.totalViews > 0 ? Math.round(summary.qrScans / summary.totalViews * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Traffic Sources, Devices, Browsers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🌐</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Traffic sources</span>
            <InfoTooltip content={getMetricDefinition('trafficSources')} position="top" />
          </div>
          <div className="space-y-2">
            {trafficSources.slice(0, 5).map(source => (
              <div key={source.name} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16 truncate capitalize">{source.name}</span>
                <ProgressBar value={source.count} max={summary.totalViews} label={`${source.count} of ${summary.totalViews} (${source.percentage}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{source.count} of {summary.totalViews} ({source.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>💻</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Devices</span>
            <InfoTooltip content={getMetricDefinition('devices')} position="top" />
          </div>
          <div className="space-y-2">
            {devices.map(device => (
              <div key={device.name} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16">{device.name === 'Desktop' ? '💻' : '📱'} {device.name}</span>
                <ProgressBar value={device.count} max={summary.totalViews} label={`${device.count} of ${summary.totalViews} (${device.percentage}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{device.count} of {summary.totalViews} ({device.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🌐</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Browsers</span>
            <InfoTooltip content={getMetricDefinition('browsers')} position="top" />
          </div>
          <div className="space-y-2">
            {browsers.map(browser => (
              <div key={browser.name} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16 truncate">{browser.name}</span>
                <ProgressBar value={browser.count} max={summary.totalViews} label={`${browser.count} of ${summary.totalViews} (${browser.percentage}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{browser.count} of {summary.totalViews} ({browser.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 4: OS, UTM Campaigns, Languages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🖥️</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Operating systems</span>
            <InfoTooltip content={getMetricDefinition('operatingSystems')} position="top" />
          </div>
          {osBreakdown.length > 0 ? (
            <div className="space-y-2">
              {osBreakdown.map(os => (
                <div key={os.name} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-16 truncate">{os.name}</span>
                  <ProgressBar value={os.count} max={logs.length} label={`${os.count} of ${logs.length} (${os.percentage}%)`} />
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{os.count} of {logs.length} ({os.percentage}%)</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm">No OS data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🎯</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">UTM campaigns</span>
            <InfoTooltip content={getMetricDefinition('utmCampaigns')} position="top" />
          </div>
          {utmCampaigns.length > 0 ? (
            <div className="space-y-2">
              {utmCampaigns.map(campaign => (
                <div key={campaign.name} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-20 truncate">{campaign.name}</span>
                  <ProgressBar value={campaign.count} max={logs.length} label={`${campaign.count} of ${logs.length} (${campaign.percentage}%)`} />
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{campaign.count} of {logs.length} ({campaign.percentage}%)</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              <p className="text-sm">No UTM campaigns</p>
              <p className="text-xs mt-1">Add UTM params to links</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🗣️</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Languages</span>
            <InfoTooltip content={getMetricDefinition('languages')} position="top" />
          </div>
          <div className="space-y-2">
            {languages.map(lang => (
              <div key={lang.name} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-16 truncate">{lang.name}</span>
                <ProgressBar value={lang.count} max={summary.totalViews} label={`${lang.count} of ${summary.totalViews} (${lang.percentage}%)`} />
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{lang.count} of {summary.totalViews} ({lang.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 5: Actions Taken */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span>📋</span>
          <span className="font-semibold text-slate-800 text-sm tracking-wide">Actions taken</span>
          <InfoTooltip content={getMetricDefinition('actionsTaken')} position="top" />
        </div>
        {isTrackSite ? (
          // Track Site: 3 columns (no Downloads)
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.returnVisits}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>🔄</span>
                <span>Return visits</span>
                <InfoTooltip content={getMetricDefinition('returnVisits')} position="top" size="sm" />
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.uniqueViewers}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>👤</span>
                <span>Unique viewers</span>
                <InfoTooltip content={getMetricDefinition('uniqueViewersAction')} position="top" size="sm" />
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{Math.round((summary.uniqueViewers / Math.max(summary.totalViews, 1)) * 100)}%</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>📊</span>
                <span>Unique rate</span>
                <InfoTooltip content={getMetricDefinition('uniqueRate')} position="top" size="sm" />
              </div>
            </div>
          </div>
        ) : (
          // Files: 4 columns (with Downloads)
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.downloadCount}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>⬇️</span>
                <span>Downloads</span>
                <InfoTooltip content={getMetricDefinition('downloadsAction')} position="top" size="sm" />
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.returnVisits}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>🔄</span>
                <span>Return visits</span>
                <InfoTooltip content={getMetricDefinition('returnVisits')} position="top" size="sm" />
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.uniqueViewers}</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>👤</span>
                <span>Unique viewers</span>
                <InfoTooltip content={getMetricDefinition('uniqueViewersAction')} position="top" size="sm" />
              </div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{Math.round((summary.uniqueViewers / Math.max(summary.totalViews, 1)) * 100)}%</div>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <span>📊</span>
                <span>Unique rate</span>
                <InfoTooltip content={getMetricDefinition('uniqueRate')} position="top" size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* World Map */}
      <WorldMap data={worldMapData} cities={topCities} regions={topRegions} totalViews={logs.length} />

      {/* Notes - Matching Contact page exactly */}
      {fileId && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span className="font-semibold text-slate-800 text-sm tracking-wide">Notes</span>
            </div>
            <button onClick={() => setShowAddNote(!showAddNote)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              + Add note
            </button>
          </div>

          {showAddNote && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note about this link..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim() || noteSaved}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    noteSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 text-white disabled:opacity-50'
                  }`}
                >
                  {noteSaved ? '✓ Saved!' : savingNote ? 'Saving...' : 'Save note'}
                </button>
                <button
                  onClick={() => { setShowAddNote(false); setNewNote(''); }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border-l-2 border-slate-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-500">{formatNoteDate(note.created_at)}</span>
                    <div className="flex items-center gap-2">
                      {editingNoteId !== note.id && (
                        <>
                          <button
                            onClick={() => startEditNote(note)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {deletingNoteId === note.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditNote(note.id)}
                          disabled={savingNote || !editNoteContent.trim()}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                        >
                          {savingNote ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingNoteId(null); setEditNoteContent(''); }}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-700">{note.content}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No notes yet. Add a note to track your interactions.</p>
          )}
        </div>
      )}

      {/* Document Analytics - Option C (3 summary cards + table) */}
      {isDocument && !isExternalRedirect && (
        <DocumentAnalyticsSection logs={logs} totalPages={totalPages || 0} pageLabels={pageLabels} />
      )}

      {/* Media Analytics - Option C (3 cards) */}
      {isMedia && !isExternalRedirect && (
        <MediaAnalyticsSection logs={logs} videoDuration={videoDuration} />
      )}
    </div>
  );
}

export default AnalyticsTab;
