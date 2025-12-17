'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface DeviceChartProps {
  data: DeviceData[];
}

const COLORS: Record<string, string> = {
  desktop: '#3b82f6',
  mobile: '#22c55e',
  tablet: '#f97316',
  unknown: '#6b7280'
};

const ICONS: Record<string, string> = {
  desktop: '💻',
  mobile: '📱',
  tablet: '📱',
  unknown: '❓'
};

export default function DeviceChart({ data }: DeviceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-500">
        No device data yet
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    name: item.device.charAt(0).toUpperCase() + item.device.slice(1),
    fill: COLORS[item.device] || COLORS.unknown
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={50}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} views`, name]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {data.map(item => (
          <div key={item.device} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{ICONS[item.device] || '❓'}</span>
              <span className="text-sm font-medium text-slate-700 capitalize">{item.device}</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
