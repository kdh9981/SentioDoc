'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePeriodFilterContext, PeriodOption, Tier } from '@/contexts/PeriodFilterContext';

const PERIOD_LABELS: Record<PeriodOption, string> = {
  '30d': '30D',
  '1yr': '1Y',
  '2yr': '2Y',
};

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

interface GlobalPeriodSelectorProps {
  onUpgradeClick?: (requiredTier: Tier) => void;
}

export default function GlobalPeriodSelector({ onUpgradeClick }: GlobalPeriodSelectorProps) {
  const {
    selectedPeriod,
    customRange,
    effectiveRange,
    userTier,
    setSelectedPeriod,
    setCustomRange,
    isPeriodLocked,
    getRequiredTierForPeriod,
    formatDateRange,
  } = usePeriodFilterContext();

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside
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
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      if (customRange) {
        setTempStartDate(formatDate(customRange.startDate));
        setTempEndDate(formatDate(customRange.endDate));
      } else {
        setTempStartDate(formatDate(effectiveRange.startDate));
        setTempEndDate(formatDate(effectiveRange.endDate));
      }
    }
  }, [showCustomPicker, customRange, effectiveRange]);

  const handlePeriodClick = (period: PeriodOption) => {
    if (isPeriodLocked(period)) {
      onUpgradeClick?.(getRequiredTierForPeriod(period));
      return;
    }
    setSelectedPeriod(period);
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      const start = new Date(tempStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tempEndDate);
      end.setHours(23, 59, 59, 999);
      if (start <= end) {
        setCustomRange({ startDate: start, endDate: end });
        setShowCustomPicker(false);
      }
    }
  };

  const handleClearCustomRange = () => {
    setCustomRange(null);
    setShowCustomPicker(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Period Buttons - Compact */}
      <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
        {(['30d', '1yr', '2yr'] as PeriodOption[]).map((period) => {
          const locked = isPeriodLocked(period);
          const isActive = selectedPeriod === period && !customRange;

          return (
            <button
              key={period}
              onClick={() => handlePeriodClick(period)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : locked
                    ? 'text-slate-400'
                    : 'text-slate-600 hover:text-slate-800'
              }`}
              title={locked ? `Upgrade to ${TIER_LABELS[getRequiredTierForPeriod(period)]}` : ''}
            >
              {locked && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {PERIOD_LABELS[period]}
            </button>
          );
        })}
      </div>

      {/* Custom Date Button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            customRange
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {customRange ? 'Custom' : ''}
        </button>

        {/* Dropdown */}
        {showCustomPicker && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-4 z-50 min-w-[280px]">
            <div className="text-sm font-semibold text-slate-700 mb-3">Custom Range</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                {customRange && (
                  <button
                    onClick={handleClearCustomRange}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleApplyCustomRange}
                  className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Range Display */}
      <span className="text-xs text-slate-500 hidden lg:inline">
        {formatDateRange()}
      </span>
    </div>
  );
}
