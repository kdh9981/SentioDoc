'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DropOffData {
  page: number;
  viewers: number;
  dropOffRate: number;
  retention: number;
}

interface DropOffChartProps {
  data: DropOffData[];
  totalViewers: number;
}

export default function DropOffChart({ data, totalViewers }: DropOffChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      pageLabel: `Page ${d.page}`,
      retentionPercent: Math.round(d.retention * 100),
    }));
  }, [data]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (data.length === 0) return null;

    const avgRetention = data.reduce((sum, d) => sum + d.retention, 0) / data.length;
    const maxDropOff = Math.max(...data.map(d => d.dropOffRate));
    const maxDropOffPage = data.find(d => d.dropOffRate === maxDropOff)?.page || 1;
    const completionRate = data.length > 0 ? data[data.length - 1].retention : 0;

    return {
      avgRetention: Math.round(avgRetention * 100),
      maxDropOff: Math.round(maxDropOff),
      maxDropOffPage,
      completionRate: Math.round(completionRate * 100),
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
          trending_down
        </span>
        <p className="text-slate-500">No drop-off data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Viewers:</span>
            <span className="font-semibold text-slate-800">{data.viewers}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Retention:</span>
            <span className="font-semibold text-blue-600">{data.retentionPercent}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Drop-off:</span>
            <span className="font-semibold text-red-600">{Math.round(data.dropOffRate)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Viewer Drop-off Analysis</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Track where viewers leave across {data.length} pages
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{totalViewers}</p>
            <p className="text-xs text-slate-500">Total viewers</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="pageLabel"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 50% retention line */}
            <ReferenceLine
              y={50}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: '50% retention',
                position: 'insideTopRight',
                fill: '#f59e0b',
                fontSize: 11,
              }}
            />

            <Area
              type="monotone"
              dataKey="retentionPercent"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#retentionGradient)"
              name="Retention %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      {metrics && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 tracking-wide mb-1">
                Avg. retention
              </p>
              <p className="text-xl font-bold text-blue-600">{metrics.avgRetention}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 tracking-wide mb-1">
                Completion rate
              </p>
              <p className="text-xl font-bold text-green-600">{metrics.completionRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 tracking-wide mb-1">
                Highest drop-off
              </p>
              <p className="text-xl font-bold text-red-600">{metrics.maxDropOff}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 tracking-wide mb-1">
                Critical page
              </p>
              <p className="text-xl font-bold text-orange-600">Page {metrics.maxDropOffPage}</p>
            </div>
          </div>

          {/* Insight callout */}
          {metrics.maxDropOff > 30 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-500">warning</span>
              <div className="text-sm">
                <p className="font-semibold text-orange-800">High Drop-off Detected</p>
                <p className="text-orange-700">
                  Page {metrics.maxDropOffPage} has a {metrics.maxDropOff}% drop-off rate.
                  Consider reviewing this page&apos;s content for engagement issues.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact funnel visualization
export function DropOffFunnel({ data }: { data: DropOffData[] }) {
  if (data.length === 0) return null;

  const firstViewers = data[0]?.viewers || 0;

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((d, index) => {
        const width = firstViewers > 0 ? (d.viewers / firstViewers) * 100 : 0;
        const isLast = index === Math.min(4, data.length - 1);

        return (
          <div key={d.page} className="flex items-center gap-3">
            <span className="w-16 text-xs text-slate-500 text-right">Page {d.page}</span>
            <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 ${
                  isLast ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${width}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-700">
                {d.viewers} viewers ({Math.round(d.retention * 100)}%)
              </span>
            </div>
            {d.dropOffRate > 0 && (
              <span className="w-16 text-xs text-red-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                {Math.round(d.dropOffRate)}%
              </span>
            )}
          </div>
        );
      })}
      {data.length > 5 && (
        <p className="text-xs text-slate-400 text-center">
          +{data.length - 5} more pages...
        </p>
      )}
    </div>
  );
}
