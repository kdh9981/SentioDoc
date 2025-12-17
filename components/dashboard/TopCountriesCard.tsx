'use client';

import React from 'react';

interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

interface TopCountriesCardProps {
  countries: CountryData[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'South Korea': '🇰🇷',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'Thailand': '🇹🇭',
  'Singapore': '🇸🇬',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Netherlands': '🇳🇱',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Poland': '🇵🇱',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Turkey': '🇹🇷',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',
  'New Zealand': '🇳🇿',
  'Ireland': '🇮🇪',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Unknown': '🌍',
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌍';
}

export default function TopCountriesCard({ countries }: TopCountriesCardProps) {
  if (countries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">🗺️ Top countries</h3>
        <div className="text-center py-6">
          <span className="text-3xl">🌍</span>
          <p className="text-slate-500 text-sm mt-2">No location data yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-4">🗺️ Top countries</h3>

      <div className="space-y-3">
        {countries.slice(0, 5).map((item, index) => (
          <div key={item.country || index} className="flex items-center gap-3">
            <span className="text-xl">{getFlag(item.country)}</span>
            <span className="text-sm font-medium text-slate-700 flex-1 truncate">
              {item.country || 'Unknown'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-8 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
