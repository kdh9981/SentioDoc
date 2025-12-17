'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PeriodOption, Tier, DateRange } from '@/hooks/usePeriodFilter';
import { TimezoneSelector } from '@/components/ui/TimezoneSelector';

interface PeriodSelectorProps {
  selectedPeriod: PeriodOption;
  customRange: DateRange | null;
  userTier: Tier;
  onPeriodChange: (period: PeriodOption) => boolean;
  onCustomRangeChange: (range: DateRange | null) => void;
  onUpgradeClick: (requiredTier: Tier) => void;
  formatDateRange: () => string;
  effectiveRange: DateRange;
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  '30d': '30 Days',
  '1yr': '1 Year',
  '2yr': '2 Years',
};

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

const PERIOD_REQUIRED_TIER: Record<PeriodOption, Tier> = {
  '30d': 'free',
  '1yr': 'starter',
  '2yr': 'pro',
};

const TIER_ACCESS: Record<Tier, PeriodOption[]> = {
  free: ['30d'],
  starter: ['30d', '1yr'],
  pro: ['30d', '1yr', '2yr'],
};

function formatDateForInput(date: Date): string {
  // Use local date formatting to avoid timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinDateForPeriod(period: PeriodOption): Date {
  const now = new Date();
  const days = period === '30d' ? 30 : period === '1yr' ? 365 : 730;
  const minDate = new Date(now);
  // Subtract (days - 1) to match the "Showing data" calculation
  minDate.setDate(minDate.getDate() - (days - 1));
  minDate.setHours(0, 0, 0, 0);
  return minDate;
}

export default function PeriodSelector({
  selectedPeriod,
  customRange,
  userTier,
  onPeriodChange,
  onCustomRangeChange,
  onUpgradeClick,
  formatDateRange,
  effectiveRange,
}: PeriodSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const isPeriodLocked = (period: PeriodOption): boolean => {
    return !TIER_ACCESS[userTier].includes(period);
  };

  // Handle click outside to close custom picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowCustomPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize temp dates when opening picker
  useEffect(() => {
    if (showCustomPicker) {
      if (customRange) {
        setTempStartDate(formatDateForInput(customRange.startDate));
        setTempEndDate(formatDateForInput(customRange.endDate));
      } else {
        setTempStartDate(formatDateForInput(effectiveRange.startDate));
        setTempEndDate(formatDateForInput(effectiveRange.endDate));
      }
    }
  }, [showCustomPicker, customRange, effectiveRange]);

  const handlePeriodClick = (period: PeriodOption) => {
    if (isPeriodLocked(period)) {
      onUpgradeClick(PERIOD_REQUIRED_TIER[period]);
      return;
    }
    onPeriodChange(period);
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tempEndDate);
      end.setHours(23, 59, 59, 999);

      if (start <= end) {
        onCustomRangeChange({ startDate: start, endDate: end });
        setShowCustomPicker(false);
      }
    }
  };

  const handleClearCustomRange = () => {
    onCustomRangeChange(null);
    setShowCustomPicker(false);
  };

  const minDate = getMinDateForPeriod(selectedPeriod);
  const maxDate = new Date();

  return (
    <div className="flex flex-col gap-3">
      {/* Period Buttons Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Period Buttons */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {(['30d', '1yr', '2yr'] as PeriodOption[]).map((period) => {
            const locked = isPeriodLocked(period);
            const isActive = selectedPeriod === period;

            return (
              <button
                key={period}
                onClick={() => handlePeriodClick(period)}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : locked
                      ? 'text-slate-400 hover:bg-slate-50 cursor-pointer'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={locked ? `Upgrade to ${TIER_LABELS[PERIOD_REQUIRED_TIER[period]]} to unlock` : ''}
              >
                {locked && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {PERIOD_LABELS[period]}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        {/* Custom Date Picker Toggle */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
              customRange
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {customRange ? 'Custom' : 'Custom Range'}
            <svg className={`w-4 h-4 transition-transform ${showCustomPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Custom Date Picker Dropdown */}
          {showCustomPicker && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-4 z-50 min-w-[320px]">
              <div className="text-sm font-semibold text-slate-700 mb-3">Select Custom Range</div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    min={formatDateForInput(minDate)}
                    max={formatDateForInput(maxDate)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    min={tempStartDate || formatDateForInput(minDate)}
                    max={formatDateForInput(maxDate)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                  Available range: Last {selectedPeriod === '30d' ? '30 days' : selectedPeriod === '1yr' ? '1 year' : '2 years'}
                </div>

                <div className="flex gap-2 pt-2">
                  {customRange && (
                    <button
                      onClick={handleClearCustomRange}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleApplyCustomRange}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Date Range Display */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Showing data: <span className="font-medium text-slate-700">{formatDateRange()}</span>
          {customRange && <span className="ml-1 text-blue-600">(Custom)</span>}
        </span>
        <span className="text-slate-300">•</span>
        <TimezoneSelector compact />
      </div>
    </div>
  );
}
