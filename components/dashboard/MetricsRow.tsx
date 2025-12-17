'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface Metrics {
  totalViews: number;
  viewsChange?: number | null;
  uniqueViewers: number;
  viewersChange?: number | null;
  avgEngagement: number;
  engagementChange?: number | null;
  hotLeads: number;
  hotLeadsChange?: number | null;
  qrScans?: number;
  qrScansChange?: number | null;
  avgCompletion?: number;
  completionChange?: number | null;
  avgTime?: number;
  timeChange?: number | null;
  returnRate?: number;
  returnChange?: number | null;
  downloads?: number;
  downloadsChange?: number | null;
  uniquePercent?: number;
  viewsToday?: number;
  qrToday?: number;
}

interface MetricsRowProps {
  metrics: Metrics;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

interface StatCard {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  change?: number | null;  // Allow null (means don't show comparison)
  metricKey: string;
}

export default function MetricsRow({ metrics }: MetricsRowProps) {
  // Calculate link clicks (total views minus QR scans)
  const linkClicks = metrics.totalViews - (metrics.qrScans ?? 0);

  const stats: StatCard[] = [
    // Row 1: Primary metrics (same as File Detail)
    {
      icon: '👁️',
      label: 'Total views',
      value: metrics.totalViews.toLocaleString(),
      subValue: metrics.viewsToday ? `+${metrics.viewsToday} today` : undefined,
      change: metrics.viewsChange,
      metricKey: 'totalViews',
    },
    {
      icon: '🔗',
      label: 'Link clicks',
      value: linkClicks.toLocaleString(),
      metricKey: 'linkClicks',
    },
    {
      icon: '📱',
      label: 'QR scans',
      value: (metrics.qrScans ?? 0).toLocaleString(),
      subValue: metrics.qrToday ? `+${metrics.qrToday} today` : undefined,
      change: metrics.qrScansChange,
      metricKey: 'qrScans',
    },
    {
      icon: '👤',
      label: 'Unique',
      value: metrics.uniqueViewers.toLocaleString(),
      change: metrics.viewersChange,
      metricKey: 'uniqueViewers',
    },
    {
      icon: '📊',
      label: 'Avg Performance',
      value: metrics.avgEngagement.toString(),
      change: metrics.engagementChange,
      metricKey: 'avgPerformance',
    },
    // Row 2: Secondary metrics
    {
      icon: '🔥',
      label: 'Hot leads',
      value: metrics.hotLeads.toString(),
      change: metrics.hotLeadsChange,
      metricKey: 'hotLeads',
    },
    {
      icon: '✅',
      label: 'Complete %',
      value: `${metrics.avgCompletion ?? 0}%`,
      change: metrics.completionChange,
      metricKey: 'completePercent',
    },
    {
      icon: '⏱️',
      label: 'Avg view time',
      value: formatTime(metrics.avgTime ?? 0),
      change: metrics.timeChange,
      metricKey: 'avgViewTime',
    },
    {
      icon: '🔄',
      label: 'Return %',
      value: `${metrics.returnRate ?? 0}%`,
      change: metrics.returnChange,
      metricKey: 'returnPercent',
    },
    {
      icon: '📥',
      label: 'Downloads',
      value: (metrics.downloads ?? 0).toLocaleString(),
      change: metrics.downloadsChange,
      metricKey: 'downloads',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Row 1: 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.slice(0, 5).map((stat) => (
          <StatCardComponent key={stat.label} stat={stat} />
        ))}
      </div>
      {/* Row 2: 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.slice(5, 10).map((stat) => (
          <StatCardComponent key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

// SAME DESIGN as FileDetailStats - Icon + Title centered on top, Value below
function StatCardComponent({ stat }: { stat: StatCard }) {
  // Don't show change indicator when it's null (no valid comparison) or 0
  const showChange = stat.change !== undefined && stat.change !== null && stat.change !== 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
      {/* Icon + Title row - centered together */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className="text-sm">{stat.icon}</span>
        <span className="text-sm font-semibold text-slate-600">{stat.label}</span>
        <InfoTooltip content={getMetricDefinition(stat.metricKey)} position="top" size="sm" />
      </div>
      {/* Value - large and bold */}
      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
      {/* Sub value and/or change indicator */}
      <div className="flex items-center justify-center gap-2 mt-1">
        {stat.subValue && (
          <span className="text-xs text-green-600 font-medium">{stat.subValue}</span>
        )}
        {showChange && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              stat.change! >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {stat.change! >= 0 ? '↑' : '↓'}{Math.abs(stat.change!)}%
          </span>
        )}
      </div>
    </div>
  );
}
