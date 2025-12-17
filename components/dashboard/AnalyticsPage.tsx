'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import WorldMap from './WorldMap';
import PeriodSelector from './PeriodSelector';
import UpgradeModal from './UpgradeModal';
import { usePeriodFilter, Tier } from '@/hooks/usePeriodFilter';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface GlobalAnalytics {
  totalViews: number;
  totalViewsChange: number;
  qrScans: number;
  qrScansChange: number;
  uniqueViewers: number;
  uniqueViewersChange: number;
  avgEngagement: number;
  avgEngagementChange: number;
  hotLeads: number;
  hotLeadsChange: number;
  avgCompletion: number;
  completionChange: number;
  avgTime: number;
  timeChange: number;
  returnRate: number;
  returnChange: number;
  downloads: number;
  downloadsChange: number;
  viewsOverTime: { date: string; views: number }[];
  topCountries: { country: string; views: number; percentage: number }[];
  topCities: { city: string; views: number; percentage: number }[];
  topRegions: { region: string; views: number; percentage: number }[];
  topLanguages: { language: string; views: number; percentage: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  browserBreakdown: { browser: string; count: number; percentage: number }[];
  osBreakdown: { os: string; count: number; percentage: number }[];
  topContent: { id: string; name: string; views: number; engagement: number; mimeType?: string; type?: string }[];
  needsAttention: { id: string; name: string; views: number; engagement: number; mimeType?: string; type?: string }[];
  trafficSources: { source: string; count: number; percentage: number }[];
  utmCampaigns: { campaign: string; count: number; percentage: number }[];
  accessMethod: { direct: number; qr: number };
  topDays: { name: string; count: number; percent: number }[];
  popularHours: number[];
  engagementBreakdown: { hot: { count: number; percent: number }; warm: { count: number; percent: number }; cold: { count: number; percent: number } };
  returnVsNew: { return: number; new: number };
}

interface AnalyticsPageProps {
  tier: string;
}

const FLAGS: Record<string, string> = {
  'United States': '🇺🇸', 'South Korea': '🇰🇷', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪',
  'Japan': '🇯🇵', 'France': '🇫🇷', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'India': '🇮🇳',
  'Brazil': '🇧🇷', 'China': '🇨🇳', 'Netherlands': '🇳🇱', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
  'Mexico': '🇲🇽', 'Singapore': '🇸🇬', 'Thailand': '🇹🇭', 'Vietnam': '🇻🇳',
};

function getCountryFlag(country: string): string {
  return FLAGS[country] || '🌍';
}

function getCountryCode(country: string): string {
  const nameToCode: Record<string, string> = {
    'United States': 'US', 'South Korea': 'KR', 'United Kingdom': 'GB', 'Germany': 'DE',
    'Japan': 'JP', 'France': 'FR', 'Canada': 'CA', 'Australia': 'AU', 'India': 'IN',
    'Brazil': 'BR', 'China': 'CN', 'Thailand': 'TH', 'Singapore': 'SG',
  };
  return nameToCode[country] || 'XX';
}

function getFileIcon(mimeType?: string, type?: string): string {
  if (type === 'url') return '🔗';
  const mt = mimeType?.toLowerCase() || '';
  if (mt.includes('pdf')) return '📕';
  if (mt.includes('presentation') || mt.includes('ppt')) return '📊';
  if (mt.includes('word') || mt.includes('doc')) return '📘';
  if (mt.includes('sheet') || mt.includes('xls')) return '📗';
  if (mt.includes('image')) return '🖼️';
  if (mt.includes('video')) return '🎬';
  return '📄';
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function IntentBadge({ score }: { score: number }) {
  if (score >= 70) {
    return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">🔥 {score}</span>;
  }
  if (score >= 40) {
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">🟡 {score}</span>;
  }
  return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">⚪ {score}</span>;
}

function ProgressBar({
  percent,
  color = 'bg-blue-500',
  label,
  showTooltip = true
}: {
  percent: number;
  color?: string;
  label?: string;
  showTooltip?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="h-2 bg-slate-100 rounded-full overflow-hidden flex-1 relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, percent)}%` }} />
      {showTooltip && label && isHovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {label}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, icon, metricKey, children }: { title: string; icon: string; metricKey?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="text-card-title">{title}</span>
        {metricKey && <InfoTooltip content={getMetricDefinition(metricKey)} position="top" size="sm" />}
      </h4>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, change, subValue }: { icon: string; label: string; value: string; change?: number; subValue?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {change !== undefined && change !== 0 && (
          <span className={`text-caption font-medium px-1.5 py-0.5 rounded-full ${change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-stat">{value}</div>
      <div className="text-meta">{label}</div>
      {subValue && <div className="text-caption text-green-600 mt-1">{subValue}</div>}
    </div>
  );
}

export default function AnalyticsPage({ tier }: AnalyticsPageProps) {
  const [data, setData] = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');

  const userTier = (tier?.toLowerCase() || 'free') as Tier;
  const periodFilter = usePeriodFilter(userTier);
  const isPro = userTier === 'pro';

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = periodFilter.getApiParams();
      const params = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const res = await fetch(`/api/analytics/global/full${params}`);
      const result = await res.json();
      if (result) setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [periodFilter.effectiveRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Generate insights
  const insights = useMemo(() => {
    if (!data) return [];
    const list: Array<{ icon: string; text: string; implication: string; priority: 'high' | 'medium' | 'low' }> = [];

    if (data.hotLeads > 0) {
      list.push({ icon: '🔥', text: `${data.hotLeads} hot leads ready for follow-up`, implication: 'High intent viewers - prioritize outreach', priority: 'high' });
    }
    if (data.returnRate > 20) {
      list.push({ icon: '🔄', text: `${data.returnRate}% return visitors`, implication: 'Content is resonating - people come back', priority: 'medium' });
    }
    if (data.avgEngagement < 40 && data.totalViews > 10) {
      list.push({ icon: '📉', text: 'Below average engagement', implication: 'Consider refreshing content', priority: 'high' });
    }
    if (data.topDays && data.topDays.length > 0) {
      const topDay = data.topDays.reduce((a, b) => a.count > b.count ? a : b);
      list.push({ icon: '⏰', text: `Peak viewing: ${topDay.name}`, implication: 'Best day to share for higher engagement', priority: 'medium' });
    }

    return list.slice(0, 5);
  }, [data]);

  // Generate actions
  const actions = useMemo(() => {
    if (!data) return [];
    const list: Array<{ icon: string; title: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];

    if (data.hotLeads > 0) {
      list.push({ icon: '🔥', title: `Contact ${data.hotLeads} hot leads`, reason: 'High intent viewers ready for follow-up', priority: 'high' });
    }
    if (data.topContent && data.topContent.length > 0) {
      list.push({ icon: '📈', title: `Amplify "${data.topContent[0]?.name}"`, reason: 'Top performer - maximize reach', priority: 'medium' });
    }
    if (data.needsAttention && data.needsAttention.length > 0) {
      list.push({ icon: '⚠️', title: `Review "${data.needsAttention[0]?.name}"`, reason: 'Low engagement - needs refresh', priority: 'medium' });
    }

    return list.slice(0, 4);
  }, [data]);

  // Transform country data for World Map
  const worldMapData = useMemo(() => {
    if (!data?.topCountries) return [];
    return data.topCountries.map(c => ({
      country: c.country,
      countryCode: getCountryCode(c.country),
      views: c.views,
      uniqueViewers: Math.round(c.views * 0.7),
      avgEngagement: data.avgEngagement || 0,
    }));
  }, [data]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="mt-1 text-slate-600">Overview of all your content performance</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const uniquePercent = data.totalViews > 0 ? Math.round((data.uniqueViewers / data.totalViews) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span>📈</span> Analytics
            </h1>
            <p className="mt-1 text-slate-600">Overview of all your content performance</p>
          </div>
          <PeriodSelector
            selectedPeriod={periodFilter.selectedPeriod}
            customRange={periodFilter.customRange}
            userTier={userTier}
            onPeriodChange={(period) => {
              const success = periodFilter.setSelectedPeriod(period);
              if (!success) {
                setUpgradeRequiredTier(periodFilter.getRequiredTierForPeriod(period));
                setShowUpgradeModal(true);
              }
              return success;
            }}
            onCustomRangeChange={periodFilter.setCustomRange}
            onUpgradeClick={(tier) => {
              setUpgradeRequiredTier(tier);
              setShowUpgradeModal(true);
            }}
            formatDateRange={periodFilter.formatDateRange}
            effectiveRange={periodFilter.effectiveRange}
          />
        </div>
      </div>

      {/* QUICK STATS - 10 cards in 2 rows */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon="👁️" label="Views" value={data.totalViews.toLocaleString()} change={data.totalViewsChange} />
          <StatCard icon="📱" label="QR scans" value={(data.qrScans || 0).toLocaleString()} change={data.qrScansChange} />
          <StatCard icon="👥" label="Unique" value={data.uniqueViewers.toLocaleString()} change={data.uniqueViewersChange} />
          <StatCard icon="📊" label="Engage" value={`${data.avgEngagement}`} change={data.avgEngagementChange} />
          <StatCard icon="🔥" label="Hot leads" value={data.hotLeads.toString()} change={data.hotLeadsChange} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon="✅" label="Complete %" value={`${data.avgCompletion || 0}%`} change={data.completionChange} />
          <StatCard icon="⏱️" label="Avg time" value={formatDuration(data.avgTime || 0)} change={data.timeChange} />
          <StatCard icon="🔄" label="Return %" value={`${data.returnRate || 0}%`} change={data.returnChange} />
          <StatCard icon="📥" label="Downloads" value={(data.downloads || 0).toLocaleString()} change={data.downloadsChange} />
          <StatCard icon="👤" label="Unique %" value={`${uniquePercent}%`} />
        </div>
      </div>

      {/* KEY INSIGHTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="flex items-center gap-2 mb-3">
          <span>💡</span>
          <span className="text-card-title">Key insights</span>
          <InfoTooltip content={getMetricDefinition('keyInsights')} position="top" size="sm" />
          {insights.length > 0 && (
            <span className="text-caption bg-slate-100 px-2 py-0.5 rounded-full">
              {insights.length}
            </span>
          )}
        </h3>
        {insights.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm">No insights yet</p>
            <p className="text-xs mt-1">Insights will appear as viewers engage</p>
          </div>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.priority === 'high' ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'
              }`}>
                <span className="text-xl">{insight.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{insight.text}</p>
                  <p className="text-xs text-slate-600">→ {insight.implication}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED ACTIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="flex items-center gap-2 mb-3">
          <span>✅</span>
          <span className="text-card-title">Recommended actions</span>
          <InfoTooltip content={getMetricDefinition('recommendedActions')} position="top" size="sm" />
          {actions.length > 0 && (
            <span className="text-caption bg-slate-100 px-2 py-0.5 rounded-full">{actions.length}</span>
          )}
        </h3>
        {actions.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm">No actions needed</p>
            <p className="text-xs mt-1">Actions will appear based on viewer activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className={`p-3 rounded-lg border ${
                action.priority === 'high' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{action.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-600">{action.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROW 1: Views Over Time, Engagement, Best Time - 3 per row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Views over time" icon="📈" metricKey="viewsOverTime">
          {data.viewsOverTime && data.viewsOverTime.length > 0 ? (
            <div className="h-32 flex items-end justify-between gap-1">
              {data.viewsOverTime.slice(-14).map((d, i) => {
                const max = Math.max(...data.viewsOverTime.map(v => v.views), 1);
                return (
                  <div key={i} className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views > 0 ? '4px' : '0' }} title={`${d.date}: ${d.views}`} />
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">📈</div>
                <p className="text-xs">No view data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Engagement by viewer" icon="🎯" metricKey="engagementBreakdown">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">🔥 Hot</span>
              <ProgressBar percent={data.engagementBreakdown?.hot?.percent || 0} color="bg-red-500" label={`${data.engagementBreakdown?.hot?.count || 0} (${data.engagementBreakdown?.hot?.percent || 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-16 text-right">{data.engagementBreakdown?.hot?.count || 0} ({data.engagementBreakdown?.hot?.percent || 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">🟡 Warm</span>
              <ProgressBar percent={data.engagementBreakdown?.warm?.percent || 0} color="bg-yellow-500" label={`${data.engagementBreakdown?.warm?.count || 0} (${data.engagementBreakdown?.warm?.percent || 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-16 text-right">{data.engagementBreakdown?.warm?.count || 0} ({data.engagementBreakdown?.warm?.percent || 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">⚪ Cold</span>
              <ProgressBar percent={data.engagementBreakdown?.cold?.percent || 0} color="bg-slate-400" label={`${data.engagementBreakdown?.cold?.count || 0} (${data.engagementBreakdown?.cold?.percent || 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-16 text-right">{data.engagementBreakdown?.cold?.count || 0} ({data.engagementBreakdown?.cold?.percent || 0}%)</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Best time to share" icon="⏰" metricKey="bestTimeToShare">
          {data.topDays && data.topDays.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <span className="font-medium">{data.topDays.reduce((a, b) => a.count > b.count ? a : b).name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🕐</span>
                <span className="font-medium">{data.popularHours ? `${data.popularHours.indexOf(Math.max(...data.popularHours))}:00` : 'N/A'}</span>
              </div>
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">💡 Share during peak hours for maximum engagement</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Need more data</p>
          )}
        </ChartCard>
      </div>

      {/* ROW 2: Top Days, Popular Hours, Return vs New */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Top days" icon="📅" metricKey="topDays">
          {data.topDays && data.topDays.length > 0 ? (
            data.topDays.map(day => (
              <div key={day.name} className="flex items-center gap-2 mb-2">
                <span className="w-10 text-sm text-slate-600">{day.name}</span>
                <ProgressBar percent={day.percent} label={`${day.count} (${day.percent}%)`} />
                <span className="w-8 text-right text-sm">{day.percent}%</span>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">📅</div>
                <p className="text-xs">No day data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Popular hours" icon="🕐" metricKey="popularHours">
          {data.popularHours && data.popularHours.length > 0 && data.popularHours.some(h => h > 0) ? (
            <>
              <div className="h-20 flex items-end gap-0.5">
                {data.popularHours.map((count, i) => {
                  const max = Math.max(...data.popularHours, 1);
                  return <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '2px' : '0' }} title={`${i}:00`} />;
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>12AM</span><span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
              </div>
            </>
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🕐</div>
                <p className="text-xs">No hourly data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Return vs new" icon="🔄" metricKey="returnVsNew">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">🔄 Return</span>
              <ProgressBar percent={data.returnVsNew?.return || 0} color="bg-purple-500" label={`${data.returnVsNew?.return || 0}%`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-12 text-right">{data.returnVsNew?.return || 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">✨ New</span>
              <ProgressBar percent={data.returnVsNew?.new || 0} color="bg-blue-500" label={`${data.returnVsNew?.new || 0}%`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-12 text-right">{data.returnVsNew?.new || 0}%</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ROW 3: Traffic Sources, Access Method, UTM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Traffic sources" icon="🌐" metricKey="trafficSources">
          {data.trafficSources && data.trafficSources.length > 0 ? (
            data.trafficSources.slice(0, 5).map(s => (
              <div key={s.source} className="flex items-center gap-2 mb-2">
                <span className="w-16 text-sm text-slate-600 truncate capitalize">{s.source}</span>
                <ProgressBar percent={s.percentage} label={`${s.count} (${s.percentage}%)`} />
                <span className="w-10 text-right text-sm">{s.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🌐</div>
                <p className="text-xs">No traffic data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Access method" icon="📲" metricKey="accessMethod">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">🔗 Direct</span>
              <ProgressBar percent={data.accessMethod?.direct || 0} label={`${data.accessMethod?.direct || 0}%`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-12 text-right">{data.accessMethod?.direct || 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">📱 QR Scan</span>
              <ProgressBar percent={data.accessMethod?.qr || 0} color="bg-green-500" label={`${data.accessMethod?.qr || 0}%`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-12 text-right">{data.accessMethod?.qr || 0}%</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="UTM campaigns" icon="🎯" metricKey="utmCampaigns">
          {data.utmCampaigns && data.utmCampaigns.length > 0 ? (
            data.utmCampaigns.slice(0, 5).map(c => (
              <div key={c.campaign} className="flex items-center gap-2 mb-2">
                <span className="w-24 text-sm text-slate-600 truncate">{c.campaign}</span>
                <ProgressBar percent={c.percentage} label={`${c.count} (${c.percentage}%)`} />
                <span className="w-10 text-right text-sm">{c.percentage}%</span>
              </div>
            ))
          ) : <p className="text-sm text-slate-500">No campaigns yet</p>}
        </ChartCard>
      </div>

      {/* ROW 4: Devices, Browsers, OS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Devices" icon="💻" metricKey="devices">
          {data.deviceBreakdown && data.deviceBreakdown.length > 0 ? (
            data.deviceBreakdown.map(d => (
              <div key={d.device} className="flex items-center gap-2 mb-2">
                <span className="w-16 text-sm">{d.device === 'desktop' ? '💻' : '📱'} {d.device}</span>
                <ProgressBar percent={d.percentage} label={`${d.count} (${d.percentage}%)`} />
                <span className="w-10 text-right text-sm">{d.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">💻</div>
                <p className="text-xs">No device data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Browsers" icon="🌐" metricKey="browsers">
          {data.browserBreakdown && data.browserBreakdown.length > 0 ? (
            data.browserBreakdown.slice(0, 5).map(b => (
              <div key={b.browser} className="flex items-center gap-2 mb-2">
                <span className="w-16 text-sm text-slate-600 truncate">{b.browser}</span>
                <ProgressBar percent={b.percentage} label={`${b.count} (${b.percentage}%)`} />
                <span className="w-10 text-right text-sm">{b.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🌐</div>
                <p className="text-xs">No browser data yet</p>
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Operating systems" icon="🖥️" metricKey="operatingSystems">
          {data.osBreakdown && data.osBreakdown.length > 0 ? (
            data.osBreakdown.slice(0, 5).map(o => (
              <div key={o.os} className="flex items-center gap-2 mb-2">
                <span className="w-16 text-sm text-slate-600 truncate">{o.os}</span>
                <ProgressBar percent={o.percentage} label={`${o.count} (${o.percentage}%)`} />
                <span className="w-10 text-right text-sm">{o.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🖥️</div>
                <p className="text-xs">No OS data yet</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* WORLD MAP with Countries/Cities/Regions tabs */}
      {isPro && (
        <WorldMap
          data={worldMapData}
          cities={data.topCities?.map(c => ({ name: c.city, count: c.views, percentage: c.percentage })) || []}
          regions={data.topRegions?.map(r => ({ name: r.region, count: r.views, percentage: r.percentage })) || []}
        />
      )}
      {!isPro && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <span className="text-4xl">🗺️</span>
          <h3 className="text-lg font-semibold text-slate-700 mt-2">World Map</h3>
          <p className="text-slate-500 text-sm mt-1">Upgrade to Pro to see geographic distribution</p>
          <Link href="/dashboard/settings" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Upgrade →
          </Link>
        </div>
      )}

      {/* ROW 6: Languages, Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Languages" icon="🗣️" metricKey="languages">
          {!isPro ? (
            <div className="text-center py-4"><span className="text-2xl">🔒</span><p className="text-slate-500 text-sm mt-1">Pro Feature</p></div>
          ) : data.topLanguages && data.topLanguages.length > 0 ? (
            data.topLanguages.slice(0, 5).map(l => (
              <div key={l.language} className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-sm truncate">{l.language}</span>
                <ProgressBar percent={l.percentage} label={`${l.count} (${l.percentage}%)`} />
                <span className="text-sm w-10 text-right">{l.percentage}%</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-slate-500">
              <div className="text-2xl mb-2">🗣️</div>
              <p className="text-sm">No language data yet</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Actions" icon="📋" metricKey="actionsTaken">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-24">⬇️ Downloads</span>
              <ProgressBar percent={data.totalViews > 0 ? ((data.downloads || 0) / data.totalViews) * 100 : 0} label={`${data.downloads || 0} (${data.totalViews > 0 ? Math.round(((data.downloads || 0) / data.totalViews) * 100) : 0}%)`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-16 text-right">{data.downloads || 0} ({data.totalViews > 0 ? Math.round(((data.downloads || 0) / data.totalViews) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-24">🔄 Returns</span>
              <ProgressBar percent={data.returnVsNew?.return || 0} color="bg-purple-500" label={`${data.returnVsNew?.return || 0}%`} />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-16 text-right">{data.returnVsNew?.return || 0}%</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* TOP/UNDER PERFORMING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="flex items-center gap-2 mb-4">
            <span>🏆</span>
            <span className="text-section-header">Top performing</span>
            <InfoTooltip content={getMetricDefinition('topPerforming')} position="top" size="sm" />
          </h3>
          {data.topContent && data.topContent.length > 0 ? (
            data.topContent.slice(0, 5).map(file => (
              <Link key={file.id} href={`/dashboard/files/${file.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                <span className="text-xl">{getFileIcon(file.mimeType, file.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{file.name}</div>
                  <div className="text-sm text-slate-500">{file.views} views</div>
                </div>
                <IntentBadge score={file.engagement || 0} />
              </Link>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-sm">No content yet</p>
              <p className="text-xs mt-1">Top performers will appear here</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="flex items-center gap-2 mb-4">
            <span>📉</span>
            <span className="text-section-header">Needs attention</span>
            <InfoTooltip content={getMetricDefinition('needsAttention')} position="top" size="sm" />
          </h3>
          {data.needsAttention && data.needsAttention.length > 0 ? (
            data.needsAttention.slice(0, 5).map(file => (
              <Link key={file.id} href={`/dashboard/files/${file.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                <span className="text-xl">{getFileIcon(file.mimeType, file.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{file.name}</div>
                  <div className="text-sm text-slate-500">{file.views} views</div>
                </div>
                <span className="text-yellow-600">⚠️</span>
              </Link>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">All content performing well!</p>
              <p className="text-xs mt-1">Low performers will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        onUpgrade={() => window.location.href = '/dashboard/settings'}
        feature="analytics history"
      />
    </div>
  );
}
