'use client';

import { UnifiedAction } from '@/lib/analytics/unified-actions';

interface FileActionsProps {
  actions: UnifiedAction[];
}

export function FileActions({ actions }: FileActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        ✅ Recommended actions
        {actions.length > 0 && (
          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {actions.length}
          </span>
        )}
      </h3>

      {!actions || actions.length === 0 ? (
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
              className={'p-3 rounded-lg border ' + (
                action.priority === 'high'
                  ? 'bg-red-50 border-red-200'
                  : action.priority === 'medium'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{action.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{action.reason}</p>
                  </div>
                </div>
                {/* Visual-only buttons - NOT clickable */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {action.buttons.slice(0, 2).map((button, btnIndex) => (
                    <span
                      key={btnIndex}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-500"
                    >
                      <span>{button.icon}</span>
                      <span>{button.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
