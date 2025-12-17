'use client';

import React from 'react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';
import { UnifiedAction } from '@/lib/analytics/unified-actions';

interface ActionItemsCardProps {
  actions: UnifiedAction[];
}

const PRIORITY_STYLES = {
  high: 'border-l-4 border-l-red-500 bg-red-50',
  medium: 'border-l-4 border-l-amber-500 bg-amber-50',
  low: 'border-l-4 border-l-slate-300 bg-slate-50',
};

export default function ActionItemsCard({ actions }: ActionItemsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>✅</span>
        <span className="text-card-title">Recommended actions</span>
        <InfoTooltip content={getMetricDefinition('recommendedActions')} position="top" />
        {actions.length > 0 && (
          <span className="text-caption bg-slate-100 px-2 py-0.5 rounded-full">
            {actions.length}
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm">No actions needed</p>
          <p className="text-xs mt-1">Actions will appear based on viewer activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.slice(0, 5).map((action, index) => (
            <div
              key={action.id || index}
              className={`flex items-start gap-3 p-3 rounded-lg ${PRIORITY_STYLES[action.priority]}`}
            >
              <span className="text-lg flex-shrink-0">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800">{action.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{action.reason}</p>
              </div>
              {/* Visual-only buttons - NOT clickable */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {action.buttons.slice(0, 2).map((button, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-slate-500 text-xs font-medium rounded-lg border border-slate-200"
                  >
                    <span>{button.icon}</span>
                    <span>{button.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
