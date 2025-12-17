'use client';

import React from 'react';
import { Tier } from '@/hooks/usePeriodFilter';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: Tier;
  onUpgrade: () => void;
  feature?: string;
}

const TIER_INFO: Record<Tier, { name: string; price: string; period: string }> = {
  free: { name: 'Free', price: '$0', period: '30 days' },
  starter: { name: 'Starter', price: '$9/mo', period: '1 year' },
  pro: { name: 'Pro', price: '$19/mo', period: '2 years' },
};

export default function UpgradeModal({
  isOpen,
  onClose,
  requiredTier,
  onUpgrade,
  feature = 'analytics history',
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const tierInfo = TIER_INFO[requiredTier];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Unlock {tierInfo.period} of {feature}
          </h3>

          <p className="text-slate-600 mb-4">
            Upgrade to <span className="font-semibold text-blue-600">{tierInfo.name}</span> to access up to {tierInfo.period} of historical analytics data.
          </p>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 mb-6 border border-slate-100">
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl font-bold text-slate-900">{tierInfo.price}</div>
              {requiredTier !== 'free' && (
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-700">{tierInfo.name} Plan</div>
                  <div className="text-xs text-slate-500">{tierInfo.period} analytics history</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
