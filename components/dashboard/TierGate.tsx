'use client';

import React from 'react';
import { useTier, TierName } from '@/hooks/useTier';

interface TierGateProps {
  requiredTier: TierName | TierName[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blur?: boolean;
  showUpgrade?: boolean;
  featureName?: string;
}

const TIER_DISPLAY_NAMES: Record<TierName, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

export default function TierGate({
  requiredTier,
  children,
  fallback,
  blur = true,
  showUpgrade = true,
  featureName = 'This feature',
}: TierGateProps) {
  const { tier, loading, canAccess } = useTier();

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl h-48 flex items-center justify-center">
        <span className="text-slate-400">Loading...</span>
      </div>
    );
  }

  const hasAccess = canAccess(requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Determine required tier name for display
  const requiredTierName = Array.isArray(requiredTier)
    ? requiredTier.map(t => TIER_DISPLAY_NAMES[t]).join(' or ')
    : TIER_DISPLAY_NAMES[requiredTier];

  // Default blur overlay with upgrade prompt
  return (
    <div className="relative">
      {/* Blurred content */}
      {blur && (
        <div className="filter blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div className={`${blur ? 'absolute inset-0' : ''} flex items-center justify-center`}>
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm mx-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl">lock</span>
          </div>

          <h3 className="font-bold text-lg text-slate-800 mb-2">
            {requiredTierName} Feature
          </h3>

          <p className="text-slate-600 text-sm mb-4">
            {featureName} requires a {requiredTierName} plan or higher.
            You&apos;re currently on the {TIER_DISPLAY_NAMES[tier]} plan.
          </p>

          {showUpgrade && (
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
            >
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Upgrade Now
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline tier badge component
export function TierBadge({ tier }: { tier: TierName }) {
  const colors: Record<TierName, string> = {
    free: 'bg-slate-100 text-slate-600',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[tier]}`}>
      {TIER_DISPLAY_NAMES[tier]}
    </span>
  );
}

// Feature lock indicator
export function FeatureLock({
  requiredTier,
  inline = false
}: {
  requiredTier: TierName;
  inline?: boolean;
}) {
  const { canAccess } = useTier();

  if (canAccess(requiredTier)) {
    return null;
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 ml-2">
        <span className="material-symbols-outlined text-sm">lock</span>
        {TIER_DISPLAY_NAMES[requiredTier]}
      </span>
    );
  }

  return (
    <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">lock</span>
      {TIER_DISPLAY_NAMES[requiredTier]}
    </div>
  );
}
