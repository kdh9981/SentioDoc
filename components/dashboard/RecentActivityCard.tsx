'use client';

import React from 'react';

interface Activity {
  id: string;
  viewerName: string;
  viewerEmail: string;
  fileName: string;
  fileId: string;
  fileType?: string;
  engagementScore?: number;
  intentSignal?: string;
  duration?: string;
  accessedAt: string;
  country?: string;
  deviceType?: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
  onFileClick: (fileId: string) => void;
  onContactClick: (email: string) => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'South Korea': '🇰🇷',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Unknown': '🌍',
};

function getFileIcon(fileType?: string): string {
  if (!fileType) return '📄';
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return '📕';
  if (type.includes('ppt') || type.includes('presentation')) return '📊';
  if (type.includes('doc') || type.includes('word')) return '📘';
  if (type.includes('xls') || type.includes('sheet')) return '📗';
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) return '🖼️';
  if (type.includes('video') || type.includes('mp4') || type.includes('mov')) return '🎬';
  if (type.includes('audio') || type.includes('mp3')) return '🎵';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  return '📄';
}

function getIntentBadge(signal?: string, score?: number) {
  if (signal === 'hot' || (score && score >= 70)) {
    return { emoji: '🔥', label: 'Hot', bg: 'bg-red-100', text: 'text-red-700' };
  }
  if (signal === 'warm' || (score && score >= 40)) {
    return { emoji: '🟡', label: 'Warm', bg: 'bg-yellow-100', text: 'text-yellow-700' };
  }
  return { emoji: '⚪', label: 'Cold', bg: 'bg-slate-100', text: 'text-slate-600' };
}

export default function RecentActivityCard({ activities, onFileClick, onContactClick }: RecentActivityCardProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">📋 Recent activity</h3>
        <div className="text-center py-8">
          <span className="text-4xl">👀</span>
          <p className="text-slate-600 mt-2">No activity yet</p>
          <p className="text-sm text-gd-grey">Share your links to see viewer activity here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800">📋 Recent activity</h3>
        <span className="text-xs text-gd-grey">Latest {activities.length} viewers</span>
      </div>

      {/* Table Header: Visitor | File | 📍 | 💻 | Intent | Score | Time */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gd-grey border-b border-slate-200 mb-2">
        <div className="w-9 flex-shrink-0"></div>
        <div className="flex-1">Visitor</div>
        <div className="w-28">File</div>
        <div className="w-8 text-center">📍</div>
        <div className="w-8 text-center">💻</div>
        <div className="w-16 text-center">Intent</div>
        <div className="w-10 text-center">Score</div>
        <div className="w-16 text-right">Time</div>
      </div>

      <div className="space-y-2">
        {activities.slice(0, 10).map((activity) => {
          const intent = getIntentBadge(activity.intentSignal, activity.engagementScore);
          const countryFlag = COUNTRY_FLAGS[activity.country || 'Unknown'] || '🌍';
          const deviceIcon = activity.deviceType === 'mobile' ? '📱' : '💻';
          const fileIcon = getFileIcon(activity.fileType);

          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {activity.viewerName?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Visitor Name */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onContactClick(activity.viewerEmail)}
                  className="font-semibold text-slate-800 hover:text-blue-600 truncate text-sm block"
                >
                  {activity.viewerName || 'Anonymous'}
                </button>
              </div>

              {/* File */}
              <div className="w-28">
                <button
                  onClick={() => onFileClick(activity.fileId)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 truncate"
                >
                  <span>{fileIcon}</span>
                  <span className="truncate">{activity.fileName}</span>
                </button>
              </div>

              {/* Location */}
              <div className="w-8 text-center">
                <span className="text-sm" title={activity.country}>{countryFlag}</span>
              </div>

              {/* Device */}
              <div className="w-8 text-center">
                <span className="text-sm" title={activity.deviceType}>{deviceIcon}</span>
              </div>

              {/* Intent Badge */}
              <div className="w-16 flex justify-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${intent.bg} ${intent.text}`}>
                  {intent.emoji}
                </span>
              </div>

              {/* Engagement Score */}
              <div className="w-10 text-center">
                {activity.engagementScore !== undefined && activity.engagementScore !== null ? (
                  <span className="text-xs font-bold text-slate-700">{activity.engagementScore}</span>
                ) : (
                  <span className="text-xs text-gd-light-grey">-</span>
                )}
              </div>

              {/* Time */}
              <div className="w-16 text-right">
                <span className="text-xs text-gd-grey">{activity.accessedAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
