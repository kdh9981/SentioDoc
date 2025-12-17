'use client';

import React from 'react';

interface ContentItem {
  id: string;
  name: string;
  views: number;
  type?: 'file' | 'url';
  fileType?: string;
  avgEngagement?: number;
  hotLeads?: number;
}

interface TopContentCardProps {
  items: ContentItem[];
  onViewAll: () => void;
  onFileClick: (fileId: string) => void;
}

function getFileIcon(type?: string, fileType?: string): string {
  if (type === 'url') return '🔗';
  if (!fileType) return '📄';
  const ft = fileType.toLowerCase();
  if (ft.includes('pdf')) return '📕';
  if (ft.includes('ppt') || ft.includes('presentation')) return '📊';
  if (ft.includes('doc') || ft.includes('word')) return '📘';
  if (ft.includes('xls') || ft.includes('sheet')) return '📗';
  if (ft.includes('image') || ft.includes('png') || ft.includes('jpg')) return '🖼️';
  if (ft.includes('video') || ft.includes('mp4')) return '🎬';
  if (ft.includes('audio') || ft.includes('mp3')) return '🎵';
  return '📄';
}

function getEngagementColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-slate-300';
}

export default function TopContentCard({ items, onViewAll, onFileClick }: TopContentCardProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">🏆 Top content</h3>
        <div className="text-center py-6">
          <span className="text-3xl">📁</span>
          <p className="text-gd-grey text-sm mt-2">No content yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">🏆 Top content</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View all →
        </button>
      </div>

      {/* Header Row */}
      <div className="flex items-center gap-2 mb-2 px-1 text-xs text-gd-grey">
        <span className="w-5"></span>
        <span className="flex-1">File</span>
        <span className="w-14 text-right">Views</span>
        <span className="w-14 text-right">Score</span>
      </div>

      <div className="space-y-2">
        {items.slice(0, 5).map((item, index) => {
          const fileIcon = getFileIcon(item.type, item.fileType);
          const engagement = item.avgEngagement ?? 0;

          return (
            <div
              key={item.id}
              onClick={() => onFileClick(item.id)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {/* Rank */}
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-slate-200 text-slate-600' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-slate-100 text-gd-grey'
              }`}>
                {index + 1}
              </span>

              {/* Icon + Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base flex-shrink-0">{fileIcon}</span>
                <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
              </div>

              {/* Views - Always Show */}
              <div className="w-14 text-right">
                <span className="text-sm font-bold text-slate-800">{item.views}</span>
              </div>

              {/* Engagement Score - Always Show (even if 0) */}
              <div className="w-14 flex items-center justify-end gap-1">
                <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getEngagementColor(engagement)}`}
                    style={{ width: `${Math.min(engagement, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 w-5 text-right">{engagement}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
