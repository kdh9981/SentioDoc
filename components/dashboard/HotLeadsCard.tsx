'use client';

import React from 'react';

interface HotLead {
  id: string;
  name: string;
  email: string;
  company?: string;
  engagementScore: number;
  fileName: string;
  fileId?: string;
  lastVisit: string;
  country?: string;
  viewCount?: number;
}

interface HotLeadsCardProps {
  leads: HotLead[];
  totalCount: number;
  onLeadClick?: (email: string) => void;
  onFileClick?: (fileId: string) => void;
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
  'US': '🇺🇸',
  'KR': '🇰🇷',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'JP': '🇯🇵',
  'TH': '🇹🇭',
  'SG': '🇸🇬',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
};

function getInitials(name: string): string {
  if (!name || name === 'Anonymous') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function HotLeadsCard({ leads, totalCount, onLeadClick, onFileClick }: HotLeadsCardProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔥</span>
          <h3 className="text-lg font-bold text-slate-800">Hot leads</h3>
        </div>
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <span className="text-4xl">🎯</span>
          <p className="text-slate-600 mt-2 font-medium">No hot leads yet</p>
          <p className="text-sm text-gd-grey mt-1">
            Viewers with 70%+ engagement will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h3 className="text-base font-bold text-slate-800">Hot leads</h3>
          <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">
            {totalCount}
          </span>
        </div>
        <span className="text-xs text-orange-600 font-medium">Follow up now!</span>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gd-grey border-b border-orange-200 mb-2">
        <div className="w-10 flex-shrink-0"></div>
        <div className="flex-1">Name</div>
        <div className="w-24">Company</div>
        <div className="w-14 text-center">Engage</div>
        <div className="w-28">File</div>
        <div className="w-20 text-right">Last seen</div>
      </div>

      <div className="space-y-2">
        {leads.slice(0, 5).map((lead) => (
          <div
            key={lead.id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-100 hover:border-orange-200 transition-colors cursor-pointer"
            onClick={() => onLeadClick?.(lead.email)}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {getInitials(lead.name)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 truncate">
                  {lead.name}
                </span>
                {lead.country && (
                  <span className="text-sm flex-shrink-0" title={lead.country}>
                    {COUNTRY_FLAGS[lead.country] || '🌍'}
                  </span>
                )}
              </div>
            </div>

            {/* Company */}
            <div className="w-24 truncate">
              {lead.company ? (
                <span className="text-xs text-blue-600 font-medium">{lead.company}</span>
              ) : (
                <span className="text-xs text-gd-light-grey">-</span>
              )}
            </div>

            {/* Engagement Score */}
            <div className="w-14 flex justify-center">
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                🔥{lead.engagementScore}
              </span>
            </div>

            {/* File */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                lead.fileId && onFileClick?.(lead.fileId);
              }}
              className="w-28 text-xs text-slate-600 hover:text-blue-600 truncate text-left"
            >
              {lead.fileName}
            </button>

            {/* Last Seen */}
            <div className="w-20 text-right">
              <span className="text-xs text-gd-grey">{lead.lastVisit}</span>
            </div>
          </div>
        ))}
      </div>

      {totalCount > 5 && (
        <button className="w-full mt-4 py-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
          View all {totalCount} hot leads →
        </button>
      )}
    </div>
  );
}
