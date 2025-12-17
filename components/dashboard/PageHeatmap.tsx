'use client';

import React, { useMemo } from 'react';

interface PageData {
  page: number;
  views: number;
  avgTime: number;
  dropOffRate: number;
}

interface PageHeatmapProps {
  data: PageData[];
  totalPages: number;
  metricType?: 'views' | 'time' | 'dropoff';
}

export default function PageHeatmap({
  data,
  totalPages,
  metricType = 'views'
}: PageHeatmapProps) {
  // Calculate color intensity based on metric
  const getHeatColor = (value: number, max: number, type: 'views' | 'time' | 'dropoff') => {
    const intensity = max > 0 ? value / max : 0;

    if (type === 'dropoff') {
      // Red for high drop-off (bad), green for low (good)
      if (intensity < 0.2) return 'bg-green-100 border-green-300 text-green-800';
      if (intensity < 0.4) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      if (intensity < 0.6) return 'bg-orange-100 border-orange-300 text-orange-800';
      if (intensity < 0.8) return 'bg-red-100 border-red-300 text-red-800';
      return 'bg-red-200 border-red-400 text-red-900';
    }

    // Blue gradient for views and time (higher is better)
    if (intensity < 0.2) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (intensity < 0.4) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (intensity < 0.6) return 'bg-blue-200 border-blue-400 text-blue-800';
    if (intensity < 0.8) return 'bg-blue-300 border-blue-500 text-blue-900';
    return 'bg-blue-400 border-blue-600 text-white';
  };

  const { maxValue, pageDataMap } = useMemo(() => {
    const map = new Map<number, PageData>();
    let max = 0;

    data.forEach(d => {
      map.set(d.page, d);
      const val = metricType === 'views'
        ? d.views
        : metricType === 'time'
          ? d.avgTime
          : d.dropOffRate;
      if (val > max) max = val;
    });

    return { maxValue: max, pageDataMap: map };
  }, [data, metricType]);

  // Generate page grid
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Calculate rows (max 10 columns)
  const columns = Math.min(10, totalPages);
  const rows = Math.ceil(totalPages / columns);

  const formatMetric = (pageData: PageData | undefined) => {
    if (!pageData) return '-';

    switch (metricType) {
      case 'views':
        return pageData.views.toString();
      case 'time':
        return `${Math.round(pageData.avgTime)}s`;
      case 'dropoff':
        return `${Math.round(pageData.dropOffRate)}%`;
      default:
        return '-';
    }
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'views': return 'Page Views';
      case 'time': return 'Avg. Time';
      case 'dropoff': return 'Drop-off Rate';
      default: return 'Metric';
    }
  };

  if (totalPages === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">description</span>
        <p className="text-slate-500">No page data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Page Heatmap</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              {getMetricLabel()} across all {totalPages} pages
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Low</span>
            <div className="flex gap-0.5">
              {metricType === 'dropoff' ? (
                <>
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                  <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                  <div className="w-4 h-4 rounded bg-red-200 border border-red-400" />
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
                  <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                  <div className="w-4 h-4 rounded bg-blue-200 border border-blue-400" />
                  <div className="w-4 h-4 rounded bg-blue-300 border border-blue-500" />
                  <div className="w-4 h-4 rounded bg-blue-400 border border-blue-600" />
                </>
              )}
            </div>
            <span className="text-slate-500">High</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-6">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
          }}
        >
          {pages.map(page => {
            const pageData = pageDataMap.get(page);
            const value = pageData
              ? (metricType === 'views'
                  ? pageData.views
                  : metricType === 'time'
                    ? pageData.avgTime
                    : pageData.dropOffRate)
              : 0;
            const colorClass = getHeatColor(value, maxValue, metricType);

            return (
              <div
                key={page}
                className={`relative group aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-110 hover:z-10 cursor-pointer ${colorClass}`}
              >
                <span className="text-lg font-bold">{page}</span>
                <span className="text-xs opacity-80">{formatMetric(pageData)}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  <div className="font-semibold mb-1">Page {page}</div>
                  <div>Views: {pageData?.views || 0}</div>
                  <div>Avg. Time: {pageData?.avgTime ? `${Math.round(pageData.avgTime)}s` : '-'}</div>
                  <div>Drop-off: {pageData?.dropOffRate ? `${Math.round(pageData.dropOffRate)}%` : '-'}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-500 tracking-wide">Most viewed</p>
          <p className="text-lg font-bold text-slate-800">
            Page {data.reduce((max, d) => d.views > (pageDataMap.get(max)?.views || 0) ? d.page : max, 1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 tracking-wide">Highest drop-off</p>
          <p className="text-lg font-bold text-red-600">
            Page {data.reduce((max, d) => d.dropOffRate > (pageDataMap.get(max)?.dropOffRate || 0) ? d.page : max, 1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 tracking-wide">Most time spent</p>
          <p className="text-lg font-bold text-blue-600">
            Page {data.reduce((max, d) => d.avgTime > (pageDataMap.get(max)?.avgTime || 0) ? d.page : max, 1)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Metric type selector component
export function HeatmapMetricSelector({
  selected,
  onChange,
}: {
  selected: 'views' | 'time' | 'dropoff';
  onChange: (metric: 'views' | 'time' | 'dropoff') => void;
}) {
  const options: { value: 'views' | 'time' | 'dropoff'; label: string; icon: string }[] = [
    { value: 'views', label: 'Views', icon: 'visibility' },
    { value: 'time', label: 'Time', icon: 'schedule' },
    { value: 'dropoff', label: 'Drop-off', icon: 'trending_down' },
  ];

  return (
    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            selected === option.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-base">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
}
