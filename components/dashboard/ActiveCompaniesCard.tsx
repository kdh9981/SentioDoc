'use client';

import React from 'react';

interface Company {
  id: string;
  name: string;
  domain?: string;
  avgEngagement: number;
  viewerCount?: number;
  lastActive?: string;
}

interface ActiveCompaniesCardProps {
  companies: Company[];
  onViewAll?: () => void;
}

function getEngagementColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gd-grey';
}

function getEngagementBg(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-slate-300';
}

export default function ActiveCompaniesCard({ companies, onViewAll }: ActiveCompaniesCardProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">🏢 Active companies</h3>
        <div className="text-center py-6">
          <span className="text-3xl">🏢</span>
          <p className="text-gd-grey text-sm mt-2">No company data yet</p>
          <p className="text-xs text-gd-light-grey mt-1">Business email viewers will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">🏢 Active companies</h3>
        <span className="text-xs text-gd-grey">{companies.length} companies</span>
      </div>

      <div className="space-y-3">
        {companies.slice(0, 5).map((company) => (
          <div
            key={company.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {/* Company Initial */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {company.name[0]?.toUpperCase() || '?'}
            </div>

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{company.name}</p>
              <p className="text-xs text-gd-grey">{company.viewerCount} viewer{company.viewerCount !== 1 ? 's' : ''}</p>
            </div>

            {/* Engagement */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getEngagementBg(company.avgEngagement)}`}
                  style={{ width: `${company.avgEngagement}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${getEngagementColor(company.avgEngagement)}`}>
                {Math.round(company.avgEngagement)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-4 w-full text-center text-sm font-bold text-blue-500 hover:text-blue-600 hover:underline transition-colors"
        >
          View all companies →
        </button>
      )}
    </div>
  );
}
