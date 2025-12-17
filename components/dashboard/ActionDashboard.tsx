'use client';

import React, { useState, useEffect } from 'react';
import TierGate from './TierGate';

interface ActionItem {
  id: string;
  type: 'hot_lead' | 'high_engagement' | 'return_visitor' | 'download' | 'completion';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  contact?: {
    name: string;
    email: string;
    company?: string;
  };
  file?: {
    id: string;
    name: string;
  };
  timestamp: string;
  metrics?: {
    views?: number;
    engagement?: number;
    duration?: number;
  };
}

interface ActionSummary {
  hotLeads: number;
  pendingFollowups: number;
  recentCompletions: number;
  totalActions: number;
}

const ACTION_TYPE_CONFIG: Record<
  ActionItem['type'],
  { icon: string; color: string; bgColor: string; label: string }
> = {
  hot_lead: {
    icon: 'local_fire_department',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Hot lead',
  },
  high_engagement: {
    icon: 'trending_up',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'High engagement',
  },
  return_visitor: {
    icon: 'replay',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Return visit',
  },
  download: {
    icon: 'download',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Download',
  },
  completion: {
    icon: 'check_circle',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Completed',
  },
};

const PRIORITY_STYLES: Record<ActionItem['priority'], string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-slate-300',
};

export default function ActionDashboard() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [summary, setSummary] = useState<ActionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActionItem['type'] | 'all'>('all');
  const [requiresPro, setRequiresPro] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions');
      if (res.ok) {
        const data = await res.json();
        setActions(data.actions || []);
        setSummary(data.summary || null);
        setRequiresPro(data.requiresPro || false);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = filter === 'all'
    ? actions
    : actions.filter(a => a.type === filter);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  // Wrap in TierGate for Pro-only access
  if (requiresPro) {
    return (
      <TierGate
        requiredTier="pro"
        featureName="Action dashboard"
        blur={false}
      >
        <ActionDashboardContent
          actions={actions}
          summary={summary}
          filter={filter}
          setFilter={setFilter}
          filteredActions={filteredActions}
          formatTimeAgo={formatTimeAgo}
        />
      </TierGate>
    );
  }

  return (
    <ActionDashboardContent
      actions={actions}
      summary={summary}
      filter={filter}
      setFilter={setFilter}
      filteredActions={filteredActions}
      formatTimeAgo={formatTimeAgo}
    />
  );
}

function ActionDashboardContent({
  actions,
  summary,
  filter,
  setFilter,
  filteredActions,
  formatTimeAgo,
}: {
  actions: ActionItem[];
  summary: ActionSummary | null;
  filter: ActionItem['type'] | 'all';
  setFilter: (f: ActionItem['type'] | 'all') => void;
  filteredActions: ActionItem[];
  formatTimeAgo: (t: string) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 opacity-90 mb-1">
              <span className="material-symbols-outlined text-lg">local_fire_department</span>
              <span className="text-sm font-medium">Hot leads</span>
            </div>
            <p className="text-3xl font-bold">{summary.hotLeads}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 opacity-90 mb-1">
              <span className="material-symbols-outlined text-lg">priority_high</span>
              <span className="text-sm font-medium">Pending actions</span>
            </div>
            <p className="text-3xl font-bold">{summary.pendingFollowups}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 opacity-90 mb-1">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="text-sm font-medium">Completions</span>
            </div>
            <p className="text-3xl font-bold">{summary.recentCompletions}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl p-4">
            <div className="flex items-center gap-2 opacity-90 mb-1">
              <span className="material-symbols-outlined text-lg">bolt</span>
              <span className="text-sm font-medium">Total actions</span>
            </div>
            <p className="text-3xl font-bold">{summary.totalActions}</p>
          </div>
        </div>
      )}

      {/* Action List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header with filters */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Recommended actions</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''} to review
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setFilter(type as ActionItem['type'])}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    filter === type
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${filter === type ? '' : config.color}`}>
                    {config.icon}
                  </span>
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="divide-y divide-slate-100">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
                inbox
              </span>
              <p className="text-slate-500">No actions to show</p>
            </div>
          ) : (
            filteredActions.map(action => {
              const config = ACTION_TYPE_CONFIG[action.type];

              return (
                <div
                  key={action.id}
                  className={`px-6 py-4 hover:bg-slate-50 transition-colors border-l-4 ${PRIORITY_STYLES[action.priority]}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                      <span className={`material-symbols-outlined ${config.color}`}>
                        {config.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800 truncate">
                          {action.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-2">{action.description}</p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {action.contact?.email && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">mail</span>
                            {action.contact.email}
                          </span>
                        )}
                        {action.contact?.company && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">business</span>
                            {action.contact.company}
                          </span>
                        )}
                        {action.metrics?.engagement && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">speed</span>
                            {action.metrics.engagement}% engagement
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {formatTimeAgo(action.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {action.contact?.email && (
                        <a
                          href={`mailto:${action.contact.email}`}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Send email"
                        >
                          <span className="material-symbols-outlined text-lg">mail</span>
                        </a>
                      )}
                      {action.file && (
                        <a
                          href={`/dashboard?file=${action.file.id}`}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="View file analytics"
                        >
                          <span className="material-symbols-outlined text-lg">analytics</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500">lightbulb</span>
          <div>
            <p className="font-semibold text-amber-800 mb-1">Pro tip</p>
            <p className="text-sm text-amber-700">
              Hot leads are viewers who have shown high engagement across multiple sessions.
              Reach out to them within 24 hours for the best conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact action list for sidebar use
export function ActionListCompact({ limit = 5 }: { limit?: number }) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/actions')
      .then(res => res.json())
      .then(data => {
        setActions((data.actions || []).slice(0, limit));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return <div className="animate-pulse h-24 bg-slate-100 rounded-lg" />;
  }

  if (actions.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">No pending actions</p>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map(action => {
        const config = ACTION_TYPE_CONFIG[action.type];
        return (
          <div
            key={action.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
          >
            <span className={`material-symbols-outlined text-lg ${config.color}`}>
              {config.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {action.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
