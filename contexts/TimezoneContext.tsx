'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectTimezone, getTimezoneOffset, formatUTCOffset } from '@/lib/timezone';

interface TimezoneContextType {
  timezone: string;
  timezoneAbbr: string;  // Always UTC format like "UTC+7"
  timezoneOffset: number;
  setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>('UTC');
  const [timezoneAbbr, setTimezoneAbbr] = useState<string>('UTC');
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0);

  useEffect(() => {
    // Detect timezone on mount (client-side only)
    const detected = detectTimezone();
    setTimezoneState(detected);
    const offset = getTimezoneOffset(detected);
    setTimezoneOffset(offset);
    setTimezoneAbbr(formatUTCOffset(offset));
  }, []);

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    const offset = getTimezoneOffset(tz);
    setTimezoneOffset(offset);
    setTimezoneAbbr(formatUTCOffset(offset));
  };

  return (
    <TimezoneContext.Provider value={{ timezone, timezoneAbbr, timezoneOffset, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
