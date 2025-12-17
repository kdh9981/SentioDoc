'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DropOffData {
  page: number;
  viewers: number;
  dropOffRate: number;
  dropOffCount: number;
}

interface DropOffAnalysisChartProps {
  data: DropOffData[];
}

export default function DropOffAnalysisChart({ data }: DropOffAnalysisChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        No drop-off data available
      </div>
    );
  }

  const getBarColor = (rate: number) => {
    if (rate >= 30) return '#ef4444';
    if (rate >= 15) return '#f97316';
    return '#22c55e';
  };

  // Find worst drop-off
  const worstPage = data.reduce((max, p) => p.dropOffRate > max.dropOffRate ? p : max, data[0]);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Low (&lt;15%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500"></span> Medium (15-30%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> High (&gt;30%)</span>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="page"
              tickFormatter={(v) => `P${v}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Drop-off Rate']}
              labelFormatter={(label) => `Page ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <ReferenceLine y={20} stroke="#f97316" strokeDasharray="5 5" />
            <Bar dataKey="dropOffRate" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.dropOffRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {worstPage && worstPage.dropOffRate > 15 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-800">
            <span className="material-symbols-outlined text-sm align-middle mr-1">warning</span>
            <strong>Attention:</strong> {worstPage.dropOffRate.toFixed(1)}% of viewers leave at Page {worstPage.page}. Consider revising this page.
          </p>
        </div>
      )}
    </div>
  );
}
