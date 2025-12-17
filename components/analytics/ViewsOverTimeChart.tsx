'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ViewData {
  date: string;
  views: number;
}

interface ViewsOverTimeChartProps {
  data: ViewData[];
}

export default function ViewsOverTimeChart({ data }: ViewsOverTimeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500">
        No views data yet
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalViews = data.reduce((sum, d) => sum + d.views, 0);
  const avgViews = Math.round(totalViews / data.length);
  const maxViews = Math.max(...data.map(d => d.views));
  const peakDay = data.find(d => d.views === maxViews);

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Views']}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#viewsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-800">{totalViews}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Daily Avg</p>
          <p className="text-lg font-bold text-slate-800">{avgViews}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Peak Day</p>
          <p className="text-lg font-bold text-blue-600">{maxViews}</p>
        </div>
      </div>
    </div>
  );
}
