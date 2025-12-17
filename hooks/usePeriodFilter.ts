'use client';

import { useState, useMemo, useCallback } from 'react';

export type Tier = 'free' | 'starter' | 'pro';
export type PeriodOption = '30d' | '1yr' | '2yr';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PeriodFilterState {
  selectedPeriod: PeriodOption;
  customRange: DateRange | null;
  effectiveRange: DateRange;
}

export interface UsePeriodFilterReturn {
  // State
  selectedPeriod: PeriodOption;
  customRange: DateRange | null;
  effectiveRange: DateRange;

  // Actions
  setSelectedPeriod: (period: PeriodOption) => boolean; // returns false if locked
  setCustomRange: (range: DateRange | null) => void;
  clearCustomRange: () => void;

  // Helpers
  isPeriodLocked: (period: PeriodOption) => boolean;
  getRequiredTierForPeriod: (period: PeriodOption) => Tier;
  getMaxDaysForTier: (tier: Tier) => number;
  formatDateRange: () => string;

  // For API calls
  getApiParams: () => { startDate: string; endDate: string };
}

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

export function usePeriodFilter(userTier: Tier = 'free'): UsePeriodFilterReturn {
  const [selectedPeriod, setSelectedPeriodState] = useState<PeriodOption>('30d');
  const [customRange, setCustomRangeState] = useState<DateRange | null>(null);

  // Calculate effective date range based on period or custom range
  const effectiveRange = useMemo((): DateRange => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today

    if (customRange) {
      return customRange;
    }

    const days = PERIOD_DAYS[selectedPeriod];
    const startDate = new Date();
    // Subtract (days - 1) because today counts as day 1
    // e.g., 30 days means today + 29 previous days
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0); // Start of that day

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

  // Get max days allowed for tier
  const getMaxDaysForTier = useCallback((tier: Tier): number => {
    const periods = TIER_ACCESS[tier];
    const maxPeriod = periods[periods.length - 1];
    return PERIOD_DAYS[maxPeriod];
  }, []);

  // Set selected period (returns false if locked)
  const setSelectedPeriod = useCallback((period: PeriodOption): boolean => {
    if (isPeriodLocked(period)) {
      return false;
    }
    setSelectedPeriodState(period);
    setCustomRangeState(null); // Clear custom range when switching periods
    return true;
  }, [isPeriodLocked]);

  // Set custom range (validates against selected period)
  const setCustomRange = useCallback((range: DateRange | null) => {
    if (!range) {
      setCustomRangeState(null);
      return;
    }

    // Validate range is within selected period
    const maxDays = PERIOD_DAYS[selectedPeriod];
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - maxDays);

    // Clamp start date to min allowed
    const clampedStart = range.startDate < minDate ? minDate : range.startDate;
    // Clamp end date to today
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

  return {
    selectedPeriod,
    customRange,
    effectiveRange,
    setSelectedPeriod,
    setCustomRange,
    clearCustomRange,
    isPeriodLocked,
    getRequiredTierForPeriod,
    getMaxDaysForTier,
    formatDateRange,
    getApiParams,
  };
}
