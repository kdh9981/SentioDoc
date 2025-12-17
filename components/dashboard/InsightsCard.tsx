'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';
import { Insight } from '@/lib/analytics/unified-insights';

interface InsightsCardProps {
  insights: Insight[];
}

export default function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>💡</span>
        <span className="text-card-title">Key insights</span>
        <InfoTooltip content={getMetricDefinition('keyInsights')} position="top" />
        {insights.length > 0 && (
          <span className="text-caption bg-slate-100 px-2 py-0.5 rounded-full">
            {insights.length}
          </span>
        )}
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <div className="text-3xl mb-2">💡</div>
          <p className="text-sm">No insights yet</p>
          <p className="text-xs mt-1">Share your links to generate insights</p>
        </div>
      ) : (
        <div className="space-y-2">
          {insights.slice(0, 8).map((insight, index) => (
            <div
              key={insight.id || index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.priority === 'high'
                  ? 'bg-red-50 border border-red-100'
                  : insight.priority === 'medium'
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-slate-50 border border-slate-100'
              }`}
            >
              <span className="text-xl flex-shrink-0">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{insight.text}</p>
                {insight.implication && (
                  <p className="text-xs text-slate-600 mt-0.5">→ {insight.implication}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
