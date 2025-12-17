'use client';

import React, { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

// ============================================
// TYPES
// ============================================

interface ChartData {
  label: string;
  value: number;
  percentage?: number;
}

interface TimeSeriesData {
  label: string;
  fullLabel?: string;
  value: number;
}

// ============================================
// REUSABLE COMPONENTS
// ============================================

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
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    slate: 'bg-slate-400',
  };
  const hoverColorMap: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    indigo: 'bg-indigo-600',
    slate: 'bg-slate-500',
  };

  return (
    <div
      className="h-2 bg-slate-100 rounded-full overflow-hidden flex-1 relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-full rounded-full transition-all duration-150 ${
          isHovered ? (hoverColorMap[color] || 'bg-blue-600') : (colorMap[color] || 'bg-blue-500')
        }`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
      {showTooltip && label && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-xl whitespace-nowrap">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, icon, metricKey, children, className = '' }: {
  title: string;
  icon: string;
  metricKey?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="font-semibold text-slate-800 text-sm tracking-wide">{title}</span>
        {metricKey && <InfoTooltip content={getMetricDefinition(metricKey)} position="top" size="sm" />}
      </div>
      {children}
    </div>
  );
}

function HorizontalBarList({ data, maxValue, totalViews }: { data: ChartData[]; maxValue?: number; totalViews?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const total = totalViews || data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const pct = item.percentage !== undefined ? item.percentage : Math.round((item.value / total) * 100);
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-slate-600 w-24 truncate">{item.label}</span>
            <ProgressBar value={item.value} max={max} color="blue" label={`${item.value} of ${total} (${pct}%)`} />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              {item.value} of {total} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// CHART COMPONENTS
// ============================================

// Views Over Time - with hover tooltips
export function ViewsOverTimeChart({
  data,
  viewMode,
  onViewModeChange
}: {
  data: TimeSeriesData[];
  viewMode: 'daily' | 'weekly' | 'monthly';
  onViewModeChange: (mode: 'daily' | 'weekly' | 'monthly') => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const modeLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const hasData = data.some(d => d.value > 0);

  return (
    <ChartCard title="Views over time" icon="📈" metricKey="viewsOverTime">
      {/* Header with toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 mb-4 w-fit">
        {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
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

      {!hasData ? (
        <div className="h-32 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs">No views in this period</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Bar Chart with hover tooltips */}
          <div className="h-32 flex items-end gap-[2px]">
            {data.map((item, index) => {
              const heightPercent = (item.value / maxValue) * 100;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 h-full flex flex-col justify-end relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar */}
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
                        <div className="font-medium">{item.fullLabel || item.label}</div>
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
    </ChartCard>
  );
}

// Engagement Breakdown
export function EngagementBreakdownChart({
  hot,
  warm,
  cold,
  total
}: {
  hot: number;
  warm: number;
  cold: number;
  total: number;
}) {
  // Use unique viewers count, not total views
  const uniqueViewers = hot + warm + cold;
  const t = uniqueViewers || 1;
  const hotPct = Math.round((hot / t) * 100);
  const warmPct = Math.round((warm / t) * 100);
  const coldPct = Math.round((cold / t) * 100);

  return (
    <ChartCard title="Engagement by viewer" icon="🎯" metricKey="engagementBreakdown">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-20">🔥 Hot (70+)</span>
          <ProgressBar value={hot} max={t} color="red" label={`${hot} of ${uniqueViewers} (${hotPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{hot} of {uniqueViewers} ({hotPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-20">🟡 Warm (40-69)</span>
          <ProgressBar value={warm} max={t} color="yellow" label={`${warm} of ${uniqueViewers} (${warmPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{warm} of {uniqueViewers} ({warmPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-20">⚪ Cold (&lt;40)</span>
          <ProgressBar value={cold} max={t} color="slate" label={`${cold} of ${uniqueViewers} (${coldPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{cold} of {uniqueViewers} ({coldPct}%)</span>
        </div>
      </div>
    </ChartCard>
  );
}

// Best Time to Share - Large blue text style matching File Detail
export function BestTimeChart({
  bestDays,
  bestHours,
  insight,
  totalViews
}: {
  bestDays: string;
  bestHours: string;
  insight?: string;
  totalViews?: number;
}) {
  // Format hours to AM/PM style like File Detail
  const formatHoursDisplay = (hours: string) => {
    // If already in format like "16:00 - 18:00", convert to "4PM - 6PM"
    const match = hours.match(/(\d+):00\s*-\s*(\d+):00/);
    if (match) {
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);
      const formatHour = (h: number) => {
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}${suffix}`;
      };
      return `${formatHour(start)} - ${formatHour(end)}`;
    }
    return hours;
  };

  return (
    <ChartCard title="Best time to share" icon="⏰" metricKey="bestTimeToShare">
      <div className="flex flex-col items-center justify-center h-full py-4">
        {/* Large blue text for time - matching File Detail style */}
        <div className="text-3xl font-bold text-blue-600">
          {formatHoursDisplay(bestHours) || '10AM - 2PM'}
        </div>
        <div className="text-sm text-slate-500 mt-2">
          Peak engagement window
        </div>
        {totalViews !== undefined && (
          <div className="mt-4 text-xs text-slate-400">
            Based on {totalViews} views
          </div>
        )}
      </div>
    </ChartCard>
  );
}

// Top Days Chart - with "X of Y (Z%)" format like File Detail
export function TopDaysChart({ data, totalViews }: { data: ChartData[]; totalViews?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = totalViews || data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title="Top days" icon="📅" metricKey="topDays">
      <div className="space-y-2">
        {data.map((day) => {
          const pct = total > 0 ? Math.round((day.value / total) * 100) : 0;
          return (
            <div key={day.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-12">{day.label}</span>
              <ProgressBar
                value={day.value}
                max={maxValue}
                color="blue"
                label={`${day.value} of ${total} (${pct}%)`}
              />
              <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{day.value} of {total} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// Popular Hours Chart - with hover tooltips like File Detail
export function PopularHoursChart({ data }: { data: number[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data, 1);
  const peakHour = data.indexOf(Math.max(...data));
  const hasData = data.some(c => c > 0);

  if (!hasData) {
    return (
      <ChartCard title="Popular hours" icon="🕐" metricKey="popularHours">
        <div className="h-32 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-2xl mb-1">🕐</div>
            <p className="text-xs">No data yet</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Popular hours" icon="🕐" metricKey="popularHours">
      <div className="relative">
        <div className="h-32 flex items-end gap-[1px]">
          {data.map((count, hour) => {
            const heightPercent = (count / maxValue) * 100;
            const isPeak = hour === peakHour && count > 0;
            const isHovered = hoveredIndex === hour;

            // Format hour range for tooltip
            const formatHour = (h: number) => {
              const suffix = h >= 12 ? 'PM' : 'AM';
              const hour12 = h % 12 || 12;
              return `${hour12}${suffix}`;
            };
            const hourLabel = `${formatHour(hour)} - ${formatHour((hour + 1) % 24)}`;

            return (
              <div
                key={hour}
                className="flex-1 h-full flex flex-col justify-end relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(hour)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-150 ${
                    isHovered ? 'bg-blue-600' : isPeak ? 'bg-green-500' : count > 0 ? 'bg-blue-500' : 'bg-slate-100'
                  }`}
                  style={{
                    height: count > 0 ? `${heightPercent}%` : '2px',
                    minHeight: count > 0 ? '4px' : '2px'
                  }}
                />

                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                      <div className="font-medium">{hourLabel}</div>
                      <div className="text-blue-300 font-bold">{count} views</div>
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
    </ChartCard>
  );
}

// Return vs New Chart
export function ReturnVsNewChart({
  returnVisitors,
  newVisitors,
  total
}: {
  returnVisitors: number;
  newVisitors: number;
  total: number;
}) {
  // Use unique viewers, not total views
  const uniqueViewers = returnVisitors + newVisitors;
  const t = uniqueViewers || 1;
  const returnPct = Math.round((returnVisitors / t) * 100);
  const newPct = Math.round((newVisitors / t) * 100);

  return (
    <ChartCard title="Return vs new" icon="🔄" metricKey="returnVsNew">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm w-28">🔄 Return visitors</span>
          <ProgressBar value={returnVisitors} max={t} color="purple" label={`${returnVisitors} of ${uniqueViewers} (${returnPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{returnVisitors} of {uniqueViewers} ({returnPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm w-28">✨ New visitors</span>
          <ProgressBar value={newVisitors} max={t} color="blue" label={`${newVisitors} of ${uniqueViewers} (${newPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{newVisitors} of {uniqueViewers} ({newPct}%)</span>
        </div>
      </div>
    </ChartCard>
  );
}

// Traffic Sources Chart
export function TrafficSourcesChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard title="Traffic sources" icon="🌐" metricKey="trafficSources">
      <HorizontalBarList data={data} />
    </ChartCard>
  );
}

// Access Method Chart (QR vs Direct) - matches File Detail styling
export function AccessMethodChart({
  direct,
  qr,
  total
}: {
  direct: number;
  qr: number;
  total: number;
}) {
  const t = total || 1;
  const directPct = Math.round((direct / t) * 100);
  const qrPct = Math.round((qr / t) * 100);

  return (
    <ChartCard title="Access method" icon="📲" metricKey="accessMethod">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-20">🔗 Link clicks</span>
          <ProgressBar value={direct} max={t} color="blue" label={`${direct} of ${total} (${directPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{direct} of {total} ({directPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-20">📱 QR scans</span>
          <ProgressBar value={qr} max={t} color="green" label={`${qr} of ${total} (${qrPct}%)`} />
          <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-24 text-right">{qr} of {total} ({qrPct}%)</span>
        </div>
      </div>
    </ChartCard>
  );
}

// UTM Campaigns Chart
export function UTMCampaignsChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="UTM campaigns" icon="🎯" metricKey="utmCampaigns">
        <div className="text-center py-4 text-slate-400">
          <p className="text-sm">No UTM campaigns</p>
          <p className="text-xs mt-1">Add UTM params to links</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="UTM campaigns" icon="🎯" metricKey="utmCampaigns">
      <HorizontalBarList data={data} />
    </ChartCard>
  );
}

// Devices Chart
export function DevicesChart({ data }: { data: ChartData[] }) {
  const icons: Record<string, string> = {
    desktop: '💻',
    Desktop: '💻',
    mobile: '📱',
    Mobile: '📱',
    tablet: '📱',
    Tablet: '📱',
  };
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <ChartCard title="Devices" icon="💻" metricKey="devices">
      <div className="space-y-2">
        {data.map((device) => {
          const pct = Math.round((device.value / total) * 100);
          return (
            <div key={device.label} className="flex items-center gap-3">
              <span className="text-sm w-24">
                {icons[device.label] || '📱'} {device.label}
              </span>
              <ProgressBar value={device.value} max={maxValue} color="blue" label={`${device.value} of ${total} (${pct}%)`} />
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                {device.value} of {total} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// Browsers Chart
export function BrowsersChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard title="Browsers" icon="🌐" metricKey="browsers">
      <HorizontalBarList data={data} />
    </ChartCard>
  );
}

// OS Chart
export function OSChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard title="Operating systems" icon="🖥️" metricKey="operatingSystems">
      <HorizontalBarList data={data} />
    </ChartCard>
  );
}

// Languages Chart
export function LanguagesChart({ data }: { data: ChartData[] }) {
  return (
    <ChartCard title="Languages" icon="🗣️" metricKey="languages">
      <HorizontalBarList data={data} />
    </ChartCard>
  );
}

// Actions Taken - Full-width grid layout matching File Detail
export function ActionsTakenChart({
  downloads,
  returnVisits,
  uniqueViewers,
  totalViews
}: {
  downloads: number;
  returnVisits: number;
  uniqueViewers: number;
  totalViews: number;
}) {
  const uniqueRate = totalViews > 0 ? Math.round((uniqueViewers / totalViews) * 100) : 0;

  return (
    <ChartCard title="Actions taken" icon="📋" metricKey="actionsTaken">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{downloads}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <span>⬇️</span>
            <span>Downloads</span>
            <InfoTooltip content={getMetricDefinition('downloadsAction')} position="top" size="sm" />
          </div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{returnVisits}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <span>🔄</span>
            <span>Return visits</span>
            <InfoTooltip content={getMetricDefinition('returnVisits')} position="top" size="sm" />
          </div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{uniqueViewers}</div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <span>👤</span>
            <span>Unique viewers</span>
            <InfoTooltip content={getMetricDefinition('uniqueViewersAction')} position="top" size="sm" />
          </div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{uniqueRate}%</div>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <span>📊</span>
            <span>Unique rate</span>
            <InfoTooltip content={getMetricDefinition('uniqueRate')} position="top" size="sm" />
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// Legacy ActionsChart for backward compatibility
export function ActionsChart({
  downloads,
  returns,
  total
}: {
  downloads: number;
  returns: number;
  total: number;
}) {
  return <ActionsTakenChart downloads={downloads} returnVisits={returns} uniqueViewers={0} totalViews={total} />;
}

// Empty State Component
export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-slate-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
