'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AccessLog,
  formatDuration,
  formatRelativeTime,
  getCountryFlag,
  getDeviceIcon,
  getIntentBadge,
} from '@/lib/analytics/calculations';

// Helper: Get actual duration from access log
// Primary: total_duration_seconds (most precise - wall clock time)
// Fallback: sum of pages_time_data (when session end failed to send)
function getActualDuration(log: AccessLog): number {
  // Primary source: total_duration_seconds
  if (log.total_duration_seconds && log.total_duration_seconds > 0) {
    return log.total_duration_seconds;
  }

  // Fallback: sum pages_time_data if available
  if (log.pages_time_data && typeof log.pages_time_data === 'object') {
    const times = Object.values(log.pages_time_data);
    if (times.length > 0) {
      return Math.round(times.reduce((sum: number, t: any) => sum + (Number(t) || 0), 0));
    }
  }

  return 0;
}

interface ViewersTabProps {
  logs: AccessLog[];
  totalPages?: number;
  isTrackSite?: boolean;
}

// Aggregated viewer type
interface AggregatedViewer {
  id: string;  // Unique identifier (email or IP)
  displayName: string;
  email: string | null;
  ipAddress: string | null;
  totalClicks: number;
  isReturnVisitor: boolean;
  latestEngagementScore: number;
  highestEngagementScore: number;
  latestIntentSignal: string;
  totalDurationSeconds: number;
  maxCompletionPercentage: number;
  maxPageReached: number;
  downloaded: boolean;
  country: string;
  city: string;
  deviceType: string;
  browser: string;
  lastAccessedAt: string;
  firstAccessedAt: string;
}

type SortField = 'lastAccessedAt' | 'highestEngagementScore' | 'totalClicks' | 'maxCompletionPercentage' | 'totalDurationSeconds';
type SortOrder = 'asc' | 'desc';

function SortableHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <th
      className="text-left p-3 font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-blue-500">{currentOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  );
}

export function ViewersTab({ logs, totalPages, isTrackSite = false }: ViewersTabProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('lastAccessedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  // Navigate to contact page (contact ID = base64 encoded email)
  const handleViewerClick = (email: string | null) => {
    if (!email) return;
    const contactId = btoa(email);
    router.push(`/dashboard/contacts/${contactId}`);
  };

  // Aggregate logs by unique viewer (email or IP)
  const aggregatedViewers = useMemo(() => {
    const viewerMap = new Map<string, AggregatedViewer>();

    logs.forEach(log => {
      // Use email as primary identifier, fall back to IP
      const identifier = log.viewer_email || log.ip_address || log.id;

      if (viewerMap.has(identifier)) {
        // Update existing viewer
        const viewer = viewerMap.get(identifier)!;
        viewer.totalClicks += 1;
        viewer.isReturnVisitor = true;

        // Update latest access
        if (new Date(log.accessed_at) > new Date(viewer.lastAccessedAt)) {
          viewer.lastAccessedAt = log.accessed_at;
        }

        // Update first access
        if (new Date(log.accessed_at) < new Date(viewer.firstAccessedAt)) {
          viewer.firstAccessedAt = log.accessed_at;
        }

        // Accumulate duration
        viewer.totalDurationSeconds += getActualDuration(log);

        // Max completion
        if ((log.completion_percentage || 0) > viewer.maxCompletionPercentage) {
          viewer.maxCompletionPercentage = log.completion_percentage || 0;
          viewer.maxPageReached = log.max_page_reached || 0;
        }

        // Downloaded ever
        if (log.downloaded) {
          viewer.downloaded = true;
        }
      } else {
        // Create new viewer entry
        viewerMap.set(identifier, {
          id: identifier,
          displayName: log.viewer_name || 'Anonymous',
          email: log.viewer_email || null,
          ipAddress: log.ip_address || null,
          totalClicks: 1,
          isReturnVisitor: false,
          latestEngagementScore: 0,
          highestEngagementScore: 0,
          latestIntentSignal: 'cold',
          totalDurationSeconds: getActualDuration(log),
          maxCompletionPercentage: log.completion_percentage || 0,
          maxPageReached: log.max_page_reached || 0,
          downloaded: log.downloaded || false,
          country: log.country || '',
          city: log.city || '',
          deviceType: log.device_type || '',
          browser: log.browser || '',
          lastAccessedAt: log.accessed_at,
          firstAccessedAt: log.accessed_at,
        });
      }
    });

    // Recalculate engagement score from aggregated data
    viewerMap.forEach(viewer => {
      let recalculatedScore: number;

      if (isTrackSite) {
        // Track Site Individual Score Formula: Return (60%) + Frequency (40%)
        const returnScore = viewer.isReturnVisitor ? 100 : 0;
        const frequencyScore = Math.min(100, viewer.totalClicks * 33);
        recalculatedScore = Math.round((returnScore * 0.60) + (frequencyScore * 0.40));
      } else {
        // File Individual Score Formula: Time(25%) + Completion(25%) + Download(20%) + Return(15%) + Depth(15%)

        // Time score (0-100 based on total duration)
        // 0s = 0, 30s = 25, 1min = 40, 2min = 60, 5min = 80, 10min+ = 100
        const duration = viewer.totalDurationSeconds;
        let timeScore: number;
        if (duration <= 0) timeScore = 0;
        else if (duration < 30) timeScore = Math.round((duration / 30) * 25);
        else if (duration < 60) timeScore = 25 + Math.round(((duration - 30) / 30) * 15);
        else if (duration < 120) timeScore = 40 + Math.round(((duration - 60) / 60) * 20);
        else if (duration < 300) timeScore = 60 + Math.round(((duration - 120) / 180) * 20);
        else if (duration < 600) timeScore = 80 + Math.round(((duration - 300) / 300) * 20);
        else timeScore = 100;

        // Completion score (direct percentage)
        const completionScore = viewer.maxCompletionPercentage;

        // Download score (binary)
        const downloadScore = viewer.downloaded ? 100 : 0;

        // Return score (binary)
        const returnScore = viewer.isReturnVisitor ? 100 : 0;

        // Depth score (pages reached / total pages)
        // Only use page-based depth for multi-page documents (totalPages > 1)
        // For videos/images/single-page files, use completion as depth proxy
        let depthScore = 0;
        if (totalPages && totalPages > 1 && viewer.maxPageReached > 0) {
          depthScore = Math.round((viewer.maxPageReached / totalPages) * 100);
        } else {
          depthScore = viewer.maxCompletionPercentage;
        }

        // Weighted sum
        recalculatedScore = Math.round(
          (timeScore * 0.25) +
          (completionScore * 0.25) +
          (downloadScore * 0.20) +
          (returnScore * 0.15) +
          (depthScore * 0.15)
        );
      }

      // Update scores with recalculated value
      viewer.highestEngagementScore = recalculatedScore;
      viewer.latestEngagementScore = recalculatedScore;

      // Update intent signal based on new score
      if (recalculatedScore >= 70) {
        viewer.latestIntentSignal = 'hot';
      } else if (recalculatedScore >= 40) {
        viewer.latestIntentSignal = 'warm';
      } else {
        viewer.latestIntentSignal = 'cold';
      }
    });

    return Array.from(viewerMap.values());
  }, [logs, isTrackSite, totalPages]);

  // Filter and sort aggregated viewers
  const filteredViewers = useMemo(() => {
    let result = [...aggregatedViewers];

    // Filter by intent (based on highest engagement score)
    if (filter !== 'all') {
      result = result.filter(v => {
        const score = v.highestEngagementScore;
        const calculatedIntent = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
        return calculatedIntent === filter;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'lastAccessedAt':
          aVal = new Date(a.lastAccessedAt).getTime();
          bVal = new Date(b.lastAccessedAt).getTime();
          break;
        case 'highestEngagementScore':
          aVal = a.highestEngagementScore;
          bVal = b.highestEngagementScore;
          break;
        case 'totalClicks':
          aVal = a.totalClicks;
          bVal = b.totalClicks;
          break;
        case 'maxCompletionPercentage':
          aVal = a.maxCompletionPercentage;
          bVal = b.maxCompletionPercentage;
          break;
        case 'totalDurationSeconds':
          aVal = a.totalDurationSeconds;
          bVal = b.totalDurationSeconds;
          break;
        default:
          return 0;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [aggregatedViewers, filter, sortField, sortOrder]);

  // Count by intent for filter badges
  const intentCounts = useMemo(() => {
    const counts = { hot: 0, warm: 0, cold: 0 };
    aggregatedViewers.forEach(v => {
      const score = v.highestEngagementScore;
      if (score >= 70) counts.hot++;
      else if (score >= 40) counts.warm++;
      else counts.cold++;
    });
    return counts;
  }, [aggregatedViewers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="text-4xl mb-3">👥</div>
        <p>No viewers yet</p>
        <p className="text-sm mt-1">Share your link to start seeing viewers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span><strong>{aggregatedViewers.length}</strong> unique viewer{aggregatedViewers.length !== 1 ? 's' : ''}</span>
        <span className="text-slate-300">•</span>
        <span><strong>{logs.length}</strong> total view{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Filter:</span>
        {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={'px-3 py-1.5 text-sm rounded-lg transition-colors ' + (
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {f === 'all' && 'All'}
            {f === 'hot' && `🔥 Hot (${intentCounts.hot})`}
            {f === 'warm' && `🟡 Warm (${intentCounts.warm})`}
            {f === 'cold' && `⚪ Cold (${intentCounts.cold})`}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500">
          {filteredViewers.length} viewer{filteredViewers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-3 font-medium text-slate-600">Viewer</th>
                <th className="text-left p-3 font-medium text-slate-600">Intent</th>
                <SortableHeader label="Engagement Score" field="highestEngagementScore" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />

                {/* Conditional columns based on content type */}
                {isTrackSite ? (
                  <>
                    {/* Track Site columns: Return, Clicks */}
                    <th className="text-left p-3 font-medium text-slate-600">Return</th>
                    <SortableHeader label="Clicks" field="totalClicks" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                  </>
                ) : (
                  <>
                    {/* File columns: Complete, Time */}
                    <SortableHeader label="Complete" field="maxCompletionPercentage" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                    <SortableHeader label="Time" field="totalDurationSeconds" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                  </>
                )}

                <th className="text-left p-3 font-medium text-slate-600">📍 Location</th>
                <th className="text-left p-3 font-medium text-slate-600">💻 Device</th>
                <SortableHeader label="Last seen" field="lastAccessedAt" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {filteredViewers.map((viewer) => {
                const intent = getIntentBadge(viewer.highestEngagementScore, viewer.latestIntentSignal);
                const hasEmail = !!viewer.email;

                return (
                  <tr
                    key={viewer.id}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${hasEmail ? 'cursor-pointer' : ''}`}
                    onClick={() => hasEmail && handleViewerClick(viewer.email)}
                  >
                    {/* Viewer */}
                    <td className="p-3">
                      <div className={`flex items-center gap-2 ${hasEmail ? 'group' : ''}`}>
                        <span className="text-lg">{hasEmail ? '👤' : '❓'}</span>
                        <div>
                          <p className={`font-medium text-slate-900 ${hasEmail ? 'group-hover:text-blue-600 group-hover:underline' : ''}`}>
                            {viewer.displayName}
                          </p>
                          {hasEmail && (
                            <p className="text-xs text-slate-500 group-hover:text-blue-500">{viewer.email}</p>
                          )}
                        </div>
                        {hasEmail && (
                          <span className="text-slate-400 group-hover:text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </span>
                        )}
                      </div>
                      {/* Action badges - only show for Files */}
                      {!isTrackSite && (
                        <div className="flex items-center gap-1 mt-1">
                          {viewer.downloaded && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">📥 Downloaded</span>
                          )}
                          {viewer.isReturnVisitor && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              🔄 {viewer.totalClicks} visits
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Intent */}
                    <td className="p-3">
                      <span className={'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ' + intent.bgColor + ' ' + intent.textColor}>
                        {intent.icon} {intent.label}
                      </span>
                    </td>

                    {/* Engagement */}
                    <td className="p-3">
                      <span className="font-medium">{viewer.highestEngagementScore}</span>
                    </td>

                    {/* Conditional columns based on content type */}
                    {isTrackSite ? (
                      <>
                        {/* Return - Yes/No badge */}
                        <td className="p-3">
                          {viewer.isReturnVisitor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                              First visit
                            </span>
                          )}
                        </td>

                        {/* Clicks - total click count */}
                        <td className="p-3">
                          <span className="font-medium">{viewer.totalClicks}</span>
                          {viewer.totalClicks >= 3 && (
                            <span className="ml-1 text-xs text-green-600">🔥</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Completion */}
                        <td className="p-3">
                          <div>
                            <span className="font-medium">{Math.round(viewer.maxCompletionPercentage)}%</span>
                            {totalPages && (
                              <span className="text-xs text-slate-500 ml-1">
                                ({viewer.maxPageReached}/{totalPages}pg)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="p-3">
                          <span className="text-slate-600">{formatDuration(viewer.totalDurationSeconds)}</span>
                        </td>
                      </>
                    )}

                    {/* Location */}
                    <td className="p-3">
                      <span className="whitespace-nowrap">
                        {getCountryFlag(viewer.country)} {viewer.city || viewer.country || 'Unknown'}
                      </span>
                    </td>

                    {/* Device */}
                    <td className="p-3">
                      <span className="whitespace-nowrap">
                        {getDeviceIcon(viewer.deviceType)} {viewer.browser || '—'}
                      </span>
                    </td>

                    {/* Last seen */}
                    <td className="p-3">
                      <span className="text-slate-600 whitespace-nowrap">
                        {formatRelativeTime(viewer.lastAccessedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewer Engagement Formula Explanation */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        {isTrackSite ? (
          <>
            <p className="font-medium text-slate-700 mb-1">📊 Viewer Engagement Formula</p>
            <p>
              Individual score = <span className="font-medium">Return (60%)</span> + <span className="font-medium">Frequency (40%)</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              First visit = 13 pts • Return visitor = 73+ pts • 3+ clicks from same person = 100 pts
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-700 mb-1">📊 Viewer Engagement Formula</p>
            <p>
              Individual score = <span className="font-medium">Time (25%)</span> + <span className="font-medium">Completion (25%)</span> + <span className="font-medium">Download (20%)</span> + <span className="font-medium">Return (15%)</span> + <span className="font-medium">Depth (15%)</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Scores aggregated across all visits from same person (email or IP)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
