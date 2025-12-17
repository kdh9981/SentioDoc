'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';

export type Tier = 'free' | 'starter' | 'pro';
export type PeriodOption = '30d' | '1yr' | '2yr';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface PeriodFilterContextType {
  // State
  selectedPeriod: PeriodOption;
  customRange: DateRange | null;
  effectiveRange: DateRange;
  userTier: Tier;

  // Actions
  setSelectedPeriod: (period: PeriodOption) => boolean;
  setCustomRange: (range: DateRange | null) => void;
  clearCustomRange: () => void;
  setUserTier: (tier: Tier) => void;

  // Helpers
  isPeriodLocked: (period: PeriodOption) => boolean;
  getRequiredTierForPeriod: (period: PeriodOption) => Tier;
  formatDateRange: () => string;
  getApiParams: () => { startDate: string; endDate: string };
}

const PeriodFilterContext = createContext<PeriodFilterContextType | undefined>(undefined);

// Period to days mapping
const PERIOD_DAYS: Record<PeriodOption, number> = {
  '30d': 30,
  '1yr': 365,
  '2yr': 730,
};

// Which tier can access which periods
const TIER_ACCESS: Record<Tier, PeriodOption[]> = {
  free: ['30d'],
  starter: ['30d', '1yr'],
  pro: ['30d', '1yr', '2yr'],
};

// Required tier for each period
const PERIOD_REQUIRED_TIER: Record<PeriodOption, Tier> = {
  '30d': 'free',
  '1yr': 'starter',
  '2yr': 'pro',
};

export function PeriodFilterProvider({ children }: { children: ReactNode }) {
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodOption>('30d');
  const [customRange, setCustomRangeState] = useState<DateRange | null>(null);
  const [userTier, setUserTierState] = useState<Tier>('free');

  // Calculate effective date range based on period or custom range
  const effectiveRange = useMemo((): DateRange => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (customRange) {
      return customRange;
    }

    const days = PERIOD_DAYS[selectedPeriod];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate: now };
  }, [selectedPeriod, customRange]);

  // Check if a period is locked for current tier
  const isPeriodLocked = useCallback((period: PeriodOption): boolean => {
    return !TIER_ACCESS[userTier].includes(period);
  }, [userTier]);

  // Get required tier for a period
  const getRequiredTierForPeriod = useCallback((period: PeriodOption): Tier => {
    return PERIOD_REQUIRED_TIER[period];
  }, []);

  // Set selected period (returns false if locked)
  const setSelectedPeriod = useCallback((period: PeriodOption): boolean => {
    if (isPeriodLocked(period)) {
      return false;
    }
    setSelectedPeriodState(period);
    setCustomRangeState(null);
    return true;
  }, [isPeriodLocked]);

  // Set custom range
  const setCustomRange = useCallback((range: DateRange | null) => {
    if (!range) {
      setCustomRangeState(null);
      return;
    }

    const maxDays = PERIOD_DAYS[selectedPeriod];
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - maxDays);

    const clampedStart = range.startDate < minDate ? minDate : range.startDate;
    const clampedEnd = range.endDate > now ? now : range.endDate;

    setCustomRangeState({
      startDate: clampedStart,
      endDate: clampedEnd,
    });
  }, [selectedPeriod]);

  // Clear custom range
  const clearCustomRange = useCallback(() => {
    setCustomRangeState(null);
  }, []);

  // Set user tier
  const setUserTier = useCallback((tier: Tier) => {
    setUserTierState(tier);
  }, []);

  // Format current date range for display
  const formatDateRange = useCallback((): string => {
    const { startDate, endDate } = effectiveRange;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
  }, [effectiveRange]);

  // Get params for API calls
  const getApiParams = useCallback((): { startDate: string; endDate: string } => {
    return {
      startDate: effectiveRange.startDate.toISOString(),
      endDate: effectiveRange.endDate.toISOString(),
    };
  }, [effectiveRange]);

  return (
    <PeriodFilterContext.Provider
      value={{
        selectedPeriod,
        customRange,
        effectiveRange,
        userTier,
        setSelectedPeriod,
        setCustomRange,
        clearCustomRange,
        setUserTier,
        isPeriodLocked,
        getRequiredTierForPeriod,
        formatDateRange,
        getApiParams,
      }}
    >
      {children}
    </PeriodFilterContext.Provider>
  );
}

export function usePeriodFilterContext() {
  const context = useContext(PeriodFilterContext);
  if (context === undefined) {
    throw new Error('usePeriodFilterContext must be used within a PeriodFilterProvider');
  }
  return context;
}
