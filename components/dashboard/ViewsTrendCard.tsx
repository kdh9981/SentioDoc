'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ViewsData {
  date: string;
  views: number;
}

type ViewMode = 'hours' | 'days' | 'months';

export default function ViewsTrendCard() {
  const [data, setData] = useState<ViewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [change, setChange] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [lastViewTime, setLastViewTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = viewMode === 'hours' ? 1 : viewMode === 'days' ? 7 : 30;
        const res = await fetch(`/api/analytics/views-trend?days=${days}&mode=${viewMode}`);
        if (res.ok) {
          const result = await res.json();
          setData(result.viewsOverTime || []);
          setTotalViews(result.totalViews || 0);
          setChange(result.changePercent || 0);
          setLastViewTime(result.lastViewTime || null);
        }
      } catch (error) {
        console.error('Failed to fetch views trend:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewMode]);

  const hasData = data.length > 0 && data.some(d => d.views > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">📈 Views trend</h3>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          {(['hours', 'days', 'months'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gd-grey hover:text-gd-black'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-50 rounded-lg animate-pulse" />
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-slate-800">{totalViews.toLocaleString()}</span>
            {change !== 0 && (
              <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            )}
          </div>

          {hasData ? (
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      if (viewMode === 'hours') {
                        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      }
                      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    }}
                    formatter={(value: number) => [value, 'Views']}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center bg-slate-50 rounded-lg">
              <p className="text-xs text-gd-grey">No views yet</p>
            </div>
          )}

          {lastViewTime && (
            <p className="text-xs text-gd-grey mt-2">Last view: {lastViewTime}</p>
          )}
        </>
      )}
    </div>
  );
}
