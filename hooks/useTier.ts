'use client';

import { useState, useEffect } from 'react';

export type TierName = 'free' | 'starter' | 'pro';

interface TierInfo {
  tier: TierName;
  loading: boolean;
  canAccess: (requiredTier: TierName | TierName[]) => boolean;
  isAtLeast: (requiredTier: TierName) => boolean;
}

const TIER_ORDER: Record<TierName, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

export function useTier(): TierInfo {
  const [tier, setTier] = useState<TierName>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch('/api/user/tier');
        if (res.ok) {
          const data = await res.json();
          setTier(data.tier || 'free');
        }
      } catch (error) {
        console.error('Failed to fetch tier:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTier();
  }, []);

  const canAccess = (requiredTier: TierName | TierName[]): boolean => {
    if (Array.isArray(requiredTier)) {
      return requiredTier.includes(tier);
    }
    return TIER_ORDER[tier] >= TIER_ORDER[requiredTier];
  };

  const isAtLeast = (requiredTier: TierName): boolean => {
    return TIER_ORDER[tier] >= TIER_ORDER[requiredTier];
  };

  return { tier, loading, canAccess, isAtLeast };
}

export default useTier;
