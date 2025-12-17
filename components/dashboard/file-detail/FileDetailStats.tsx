'use client';

import { AnalyticsSummary, formatDuration } from '@/lib/analytics/calculations';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

type FileTypeCategory = 'document' | 'media' | 'image' | 'other' | 'url';

interface FileDetailStatsProps {
  summary: AnalyticsSummary;
  fileType: FileTypeCategory;
  isExternalRedirect?: boolean;  // Legacy - now all Track Sites use simple stats
  avgPlayTime?: number;
  avgCompletion?: number;
  finishedCount?: number;
}

export function getFileTypeCategory(mimeType?: string, type?: string): FileTypeCategory {
  if (type === 'url') return 'url';
  const mime = mimeType?.toLowerCase() || '';
  if (mime.includes('pdf')) return 'document';
  if (mime.includes('presentation') || mime.includes('ppt')) return 'document';
  if (mime.includes('word') || mime.includes('doc')) return 'document';
  if (mime.includes('sheet') || mime.includes('xls')) return 'document';
  if (mime.includes('video')) return 'media';
  if (mime.includes('audio')) return 'media';
  if (mime.includes('image')) return 'image';
  return 'other';
}

interface StatCard {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  metricKey: string;
}

export function FileDetailStats({
  summary,
  fileType,
  isExternalRedirect = false,  // Legacy param - ignored for Track Sites
  avgPlayTime = 0,
  avgCompletion = 0,
  finishedCount = 0,
}: FileDetailStatsProps) {
  const qrToday = summary.qrScans > 0 && summary.viewsToday > 0
    ? Math.round((summary.qrScans / summary.totalViews) * summary.viewsToday)
    : 0;
  const uniquePercent = Math.round((summary.uniqueViewers / Math.max(summary.totalViews, 1)) * 100);
  const linkClicks = summary.totalViews - summary.qrScans;

  const getStats = (): StatCard[] => {
    // Base stats for ALL file types
    const baseStats: StatCard[] = [
      {
        icon: '👁️',
        label: 'Total views',
        value: summary.totalViews.toLocaleString(),
        subValue: summary.viewsToday > 0 ? `+${summary.viewsToday} today` : undefined,
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
        value: summary.qrScans.toLocaleString(),
        subValue: qrToday > 0 ? `+${qrToday} today` : undefined,
        metricKey: 'qrScans',
      },
      {
        icon: '👤',
        label: 'Unique',
        value: summary.uniqueViewers.toLocaleString(),
        metricKey: 'uniqueViewers',
      },
      {
        icon: '📊',
        label: 'Performance',
        value: summary.avgEngagement.toString(),
        metricKey: fileType === 'url' ? 'performanceTrackSiteLinkLevel' : 'performanceFileLinkLevel',
      },
      {
        icon: '🔥',
        label: 'Hot leads',
        value: summary.hotLeads.toString(),
        metricKey: 'hotLeads',
      },
    ];

    // Track Site (URL type) - ALWAYS use simple 8-stat layout
    // No video-specific stats (Avg play, Complete %, Finished) since we don't embed videos
    if (fileType === 'url') {
      return [
        ...baseStats,
        { icon: '🔄', label: 'Return %', value: `${summary.returnRate}%`, metricKey: 'returnPercent' },
        { icon: '📈', label: 'Unique %', value: `${uniquePercent}%`, metricKey: 'uniqueRate' },
      ];
    }

    switch (fileType) {
      case 'document':
        return [
          ...baseStats,
          { icon: '✅', label: 'Complete %', value: `${summary.completionRate}%`, metricKey: 'completePercent' },
          { icon: '⏱️', label: 'Avg view time', value: formatDuration(summary.avgTimeSpent), metricKey: 'avgViewTime' },
          { icon: '🔄', label: 'Return %', value: `${summary.returnRate}%`, metricKey: 'returnPercent' },
          { icon: '📥', label: 'Downloads', value: summary.downloadCount.toString(), metricKey: 'downloads' },
        ];

      case 'media':
        return [
          ...baseStats,
          { icon: '▶️', label: 'Avg play', value: formatDuration(avgPlayTime), metricKey: 'avgViewTime' },
          { icon: '✅', label: 'Complete %', value: `${avgCompletion}%`, metricKey: 'completePercent' },
          { icon: '🏁', label: 'Finished', value: finishedCount.toString(), metricKey: 'completionRate' },
          { icon: '📥', label: 'Downloads', value: summary.downloadCount.toString(), metricKey: 'downloads' },
        ];

      case 'image':
        return [
          ...baseStats,
          { icon: '⏱️', label: 'Avg view time', value: formatDuration(summary.avgTimeSpent), metricKey: 'avgViewTime' },
          { icon: '📥', label: 'Downloads', value: summary.downloadCount.toString(), metricKey: 'downloads' },
        ];

      case 'other':
        return [
          ...baseStats,
          { icon: '⏱️', label: 'Avg view time', value: formatDuration(summary.avgTimeSpent), metricKey: 'avgViewTime' },
          { icon: '📥', label: 'Downloads', value: summary.downloadCount.toString(), metricKey: 'downloads' },
        ];

      default:
        return baseStats;
    }
  };

  const stats = getStats();

  // 10 stats - 2 rows of 5 (documents)
  if (stats.length === 10) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.slice(0, 5).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.slice(5, 10).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    );
  }

  // 8 stats - 2 rows of 4 (Track Sites, images, other)
  if (stats.length === 8) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.slice(0, 4).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.slice(4, 8).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    );
  }

  // 6 stats - 2 rows of 3
  if (stats.length === 6) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.slice(0, 3).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.slice(3, 6).map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <StatCardComponent key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

// NEW DESIGN: Icon + Title on top (centered together), Value below
function StatCardComponent({ stat }: { stat: StatCard }) {
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
      {/* Sub value if exists */}
      {stat.subValue && (
        <div className="text-xs text-green-600 mt-1 font-medium">{stat.subValue}</div>
      )}
    </div>
  );
}
