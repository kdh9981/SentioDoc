'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

interface TrafficSourcesChartProps {
  data: TrafficSource[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#6b7280'];

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct',
  direct_click: 'Direct Link',
  qr_scan: 'QR Code Scan',
  google: 'Google',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  email: 'Email',
  slack: 'Slack',
  teams: 'Teams',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  other: 'Other'
};

const SOURCE_ICONS: Record<string, string> = {
  direct: '🔗',
  direct_click: '🔗',
  qr_scan: '📱',
  google: '🔍',
  linkedin: '💼',
  facebook: '👤',
  twitter: '🐦',
  instagram: '📷',
  email: '📧',
  slack: '💬',
  teams: '👥',
  youtube: '▶️',
  tiktok: '🎵',
  reddit: '🔴',
  other: '🌐'
};

export default function TrafficSourcesChart({ data }: TrafficSourcesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500">
        No traffic data yet
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    name: SOURCE_LABELS[item.source] || item.source,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [value, name]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.source} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span>{SOURCE_ICONS[item.source] || '🌐'} {SOURCE_LABELS[item.source] || item.source}</span>
            </div>
            <span className="font-semibold text-slate-700">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
