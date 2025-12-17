'use client';

import { useState, useRef, useEffect } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { COMMON_TIMEZONES, formatUTCOffset, getTimezoneOffset } from '@/lib/timezone';

interface TimezoneSelectorProps {
  compact?: boolean;
}

export function TimezoneSelector({ compact = false }: TimezoneSelectorProps) {
  const { timezone, timezoneAbbr, setTimezone } = useTimezone();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter timezones by search - search in label, value, and UTC offset
  const filteredTimezones = COMMON_TIMEZONES.filter(tz => {
    const searchLower = search.toLowerCase();
    const utcOffsetStr = formatUTCOffset(tz.offset).toLowerCase();
    return (
      tz.label.toLowerCase().includes(searchLower) ||
      tz.value.toLowerCase().includes(searchLower) ||
      utcOffsetStr.includes(searchLower)
    );
  });

  // Get current timezone info
  const currentTz = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  const currentOffset = currentTz?.offset ?? getTimezoneOffset(timezone);
  const currentOffsetStr = formatUTCOffset(currentOffset);
  const currentLabel = currentTz?.label || timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span>🌐</span>
          <span>{currentOffsetStr}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Search city or UTC offset..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredTimezones.map((tz) => {
                const offsetStr = formatUTCOffset(tz.offset);
                return (
                  <button
                    key={tz.value}
                    onClick={() => {
                      setTimezone(tz.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                      timezone === tz.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <span>{tz.label}</span>
                    <span className={`text-xs ${timezone === tz.value ? 'text-blue-500' : 'text-slate-400'}`}>
                      {offsetStr}
                    </span>
                  </button>
                );
              })}
              {filteredTimezones.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  No timezones found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <span>🌐</span>
        <span>{currentLabel} ({currentOffsetStr})</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search city or UTC offset..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filteredTimezones.map((tz) => {
              const offsetStr = formatUTCOffset(tz.offset);
              return (
                <button
                  key={tz.value}
                  onClick={() => {
                    setTimezone(tz.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                    timezone === tz.value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tz.label}</span>
                    <span className="text-xs text-slate-400">{tz.value}</span>
                  </div>
                  <span className={`text-xs font-medium ${timezone === tz.value ? 'text-blue-600' : 'text-slate-500'}`}>
                    {offsetStr}
                  </span>
                </button>
              );
            })}
            {filteredTimezones.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No timezones found for "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
