'use client';

import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface CountryData {
  country: string;
  countryCode: string;
  views: number;
  uniqueViewers: number;
  avgEngagement: number;
}

interface CityData {
  name: string;
  count: number;
  percentage: number;
}

interface RegionData {
  name: string;
  count: number;
  percentage: number;
}

interface WorldMapProps {
  data: CountryData[];
  cities?: CityData[];
  regions?: RegionData[];
  totalViews?: number; // Add this prop
}

type TabType = 'countries' | 'cities';

// Country name to ISO code mapping
const countryNameToCode: Record<string, string> = {
  'United States': 'USA', 'United Kingdom': 'GBR', 'South Korea': 'KOR',
  'North Korea': 'PRK', 'Thailand': 'THA', 'Japan': 'JPN', 'Germany': 'DEU',
  'France': 'FRA', 'Canada': 'CAN', 'Australia': 'AUS', 'Singapore': 'SGP',
  'India': 'IND', 'China': 'CHN', 'Netherlands': 'NLD', 'Spain': 'ESP',
  'Italy': 'ITA', 'Brazil': 'BRA', 'Mexico': 'MEX', 'Indonesia': 'IDN',
  'Vietnam': 'VNM', 'Russia': 'RUS', 'Poland': 'POL', 'Sweden': 'SWE',
  'Norway': 'NOR', 'Denmark': 'DNK', 'Finland': 'FIN', 'Switzerland': 'CHE',
  'Austria': 'AUT', 'Belgium': 'BEL', 'Portugal': 'PRT', 'Ireland': 'IRL',
  'New Zealand': 'NZL', 'Argentina': 'ARG', 'Chile': 'CHL', 'Colombia': 'COL',
  'Peru': 'PER', 'Philippines': 'PHL', 'Malaysia': 'MYS', 'Taiwan': 'TWN',
  'Hong Kong': 'HKG', 'Israel': 'ISR', 'United Arab Emirates': 'ARE',
  'Saudi Arabia': 'SAU', 'Turkey': 'TUR', 'Egypt': 'EGY', 'South Africa': 'ZAF',
  'Nigeria': 'NGA', 'Kenya': 'KEN', 'Pakistan': 'PAK', 'Bangladesh': 'BGD',
  'Ukraine': 'UKR', 'Czech Republic': 'CZE', 'Romania': 'ROU', 'Hungary': 'HUN',
  'Greece': 'GRC', 'Belarus': 'BLR',
};

// Reverse mapping: ISO code to country name
const codeToCountryName: Record<string, string> = Object.entries(countryNameToCode)
  .reduce((acc, [name, code]) => ({ ...acc, [code]: name }), {});

// Country flags
const countryFlags: Record<string, string> = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'South Korea': '🇰🇷',
  'Thailand': '🇹🇭', 'Japan': '🇯🇵', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Singapore': '🇸🇬', 'India': '🇮🇳',
  'China': '🇨🇳', 'Netherlands': '🇳🇱', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
  'Brazil': '🇧🇷', 'Mexico': '🇲🇽', 'Indonesia': '🇮🇩', 'Vietnam': '🇻🇳',
  'Russia': '🇷🇺', 'Poland': '🇵🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
  'Belgium': '🇧🇪', 'Portugal': '🇵🇹', 'Ireland': '🇮🇪', 'New Zealand': '🇳🇿',
  'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Colombia': '🇨🇴', 'Peru': '🇵🇪',
  'Philippines': '🇵🇭', 'Malaysia': '🇲🇾', 'Taiwan': '🇹🇼', 'Hong Kong': '🇭🇰',
  'Israel': '🇮🇱', 'United Arab Emirates': '🇦🇪', 'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷', 'Egypt': '🇪🇬', 'South Africa': '🇿🇦', 'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Ukraine': '🇺🇦',
  'Czech Republic': '🇨🇿', 'Romania': '🇷🇴', 'Hungary': '🇭🇺', 'Greece': '🇬🇷',
  'Belarus': '🇧🇾',
};

function getFlag(country: string): string {
  return countryFlags[country] || '🌍';
}

export default function WorldMap({ data, cities = [], regions = [], totalViews: propTotalViews }: WorldMapProps) {
  const [activeTab, setActiveTab] = useState<TabType>('countries');
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null); // Country NAME
  const [hoveredIsoCode, setHoveredIsoCode] = useState<string | null>(null); // ISO code from map
  const [tooltipContent, setTooltipContent] = useState<CountryData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const hasCountryData = data.length > 0;
  const maxViews = Math.max(...data.map(d => d.views), 1);

  // Create lookup map from ISO code to data
  const dataByCode = useMemo(() => {
    const map = new Map<string, CountryData>();
    data.forEach(d => {
      const code = countryNameToCode[d.country];
      if (code) map.set(code, d);
      if (d.countryCode) map.set(d.countryCode, d);
    });
    return map;
  }, [data]);

  // Sort countries by views descending
  const sortedCountries = useMemo(() => {
    return [...data].sort((a, b) => b.views - a.views);
  }, [data]);

  // Sort cities by count descending
  const sortedCities = useMemo(() => {
    return [...cities].sort((a, b) => b.count - a.count);
  }, [cities]);

  // Sort regions by count descending
  const sortedRegions = useMemo(() => {
    return [...regions].sort((a, b) => b.count - a.count);
  }, [regions]);

  // Determine if a country is highlighted
  const isHighlightedCountry = (countryName: string): boolean => {
    if (!hoveredCountry && !hoveredIsoCode) return true; // No hover = all visible
    if (hoveredCountry === countryName) return true;
    if (hoveredIsoCode && codeToCountryName[hoveredIsoCode] === countryName) return true;
    // Check if hoveredIsoCode matches this country's code
    const thisCode = countryNameToCode[countryName];
    if (hoveredIsoCode && thisCode === hoveredIsoCode) return true;
    return false;
  };

  // Determine if a map country is highlighted
  const isHighlightedIso = (isoCode: string): boolean => {
    if (!hoveredCountry && !hoveredIsoCode) return true; // No hover = all visible
    if (hoveredIsoCode === isoCode) return true;
    if (hoveredCountry && countryNameToCode[hoveredCountry] === isoCode) return true;
    return false;
  };

  // Get color based on view intensity (heat map style)
  const getCountryColor = (isoCode: string, isHighlighted: boolean) => {
    const countryData = dataByCode.get(isoCode);

    // If something is being hovered and this is not it, gray it out
    if ((hoveredCountry || hoveredIsoCode) && !isHighlighted) {
      return '#f1f5f9'; // slate-100 (very light gray)
    }

    if (!countryData) return '#e2e8f0'; // slate-200 for no data

    const ratio = countryData.views / maxViews;
    if (ratio > 0.75) return '#dc2626'; // red-600
    if (ratio > 0.5) return '#f97316';  // orange-500
    if (ratio > 0.25) return '#fbbf24'; // amber-400
    if (ratio > 0) return '#fef3c7';    // amber-100
    return '#e2e8f0';
  };

  // Map hover handlers
  const handleMapMouseEnter = (geo: { properties: { ISO_A3?: string } }, event: React.MouseEvent) => {
    const isoCode = geo.properties.ISO_A3;
    if (isoCode) {
      setHoveredIsoCode(isoCode);
      const countryData = dataByCode.get(isoCode);
      if (countryData) {
        setTooltipContent(countryData);
        setTooltipPos({ x: event.clientX, y: event.clientY });
      }
    }
  };

  const handleMapMouseLeave = () => {
    setHoveredIsoCode(null);
    setTooltipContent(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltipContent) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    }
  };

  // List hover handlers
  const handleListMouseEnter = (countryName: string) => {
    setHoveredCountry(countryName);
  };

  const handleListMouseLeave = () => {
    setHoveredCountry(null);
  };

  const countryCount = sortedCountries.length;
  const cityCount = sortedCities.length;
  const regionCount = sortedRegions.length;
  // Use prop totalViews if provided, otherwise calculate from data
  const totalViews = propTotalViews ?? data.reduce((sum, d) => sum + d.views, 0);

  // Check if any hover is active
  const isAnyHoverActive = hoveredCountry !== null || hoveredIsoCode !== null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="flex items-center gap-2">
          <span>🗺️</span>
          <span className="text-card-title">Geographic distribution</span>
          <InfoTooltip content={getMetricDefinition('geographicDistribution')} position="top" size="sm" />
        </h3>
        <span className="text-meta">{totalViews} total views</span>
      </div>

      {/* Main Content: Side by Side */}
      <div className="flex flex-col lg:flex-row" style={{ maxHeight: '440px' }}>
        {/* LEFT: List Panel */}
        <div className="lg:w-96 xl:w-[420px] border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col" style={{ maxHeight: '440px' }}>
          {/* Tabs */}
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('countries')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'countries'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🌍 {countryCount > 0 ? `(${countryCount})` : ''}
              </button>
              <button
                onClick={() => setActiveTab('cities')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'cities'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🏙️ {cityCount > 0 ? `(${cityCount})` : ''}
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '340px' }}>
            {/* Countries */}
            {activeTab === 'countries' && (
              sortedCountries.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {sortedCountries.map((country, index) => {
                    const barWidth = Math.max((country.views / maxViews) * 100, 5);
                    const isHighlighted = isHighlightedCountry(country.country);

                    return (
                      <div
                        key={country.country}
                        className={`px-3 py-2 flex items-center gap-2 cursor-pointer transition-all duration-150 ${
                          isHighlighted
                            ? 'bg-orange-50 hover:bg-orange-100'
                            : isAnyHoverActive
                              ? 'opacity-30 bg-white'
                              : 'hover:bg-slate-50'
                        }`}
                        onMouseEnter={() => handleListMouseEnter(country.country)}
                        onMouseLeave={handleListMouseLeave}
                      >
                        <span className={`text-xs font-medium w-5 ${isHighlighted ? 'text-orange-600' : 'text-slate-400'}`}>
                          {index + 1}
                        </span>
                        <span className="text-sm">{getFlag(country.country)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium truncate ${isHighlighted ? 'text-slate-900' : 'text-slate-400'}`}>
                              {country.country}
                            </span>
                            <span className={`text-xs font-bold ${isHighlighted ? 'text-slate-700' : 'text-slate-300'}`}>
                              {country.views}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isHighlighted ? 'bg-orange-500' : 'bg-slate-200'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-slate-400">
                  <div className="text-xl mb-1">🌍</div>
                  <p className="text-xs">No country data yet</p>
                </div>
              )
            )}

            {/* Cities */}
            {activeTab === 'cities' && (
              sortedCities.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {sortedCities.map((city, index) => {
                    const maxCount = sortedCities[0]?.count || 1;
                    const barWidth = Math.max((city.count / maxCount) * 100, 5);
                    return (
                      <div key={city.name} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 w-5">{index + 1}</span>
                        <span className="text-sm">🏙️</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-900 truncate">{city.name}</span>
                            <span className="text-xs font-bold text-slate-700">{city.count}</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-slate-400">
                  <div className="text-xl mb-1">🏙️</div>
                  <p className="text-xs">No city data yet</p>
                </div>
              )
            )}

          </div>
        </div>

        {/* RIGHT: Map Panel */}
        <div className="flex-1 relative overflow-hidden" style={{ maxHeight: '440px' }} onMouseMove={handleMouseMove}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 157,
              center: [10, 30],
            }}
            style={{
              width: '100%',
              height: '440px',
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoCode = geo.properties.ISO_A3;
                  const isHighlighted = isHighlightedIso(isoCode);
                  const fillColor = getCountryColor(isoCode, isHighlighted);
                  const hasViewData = dataByCode.has(isoCode);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={isHighlighted && hasViewData && isAnyHoverActive ? '#991b1b' : '#ffffff'}
                      strokeWidth={isHighlighted && hasViewData && isAnyHoverActive ? 1.5 : 0.5}
                      style={{
                        default: { outline: 'none', transition: 'all 0.15s ease-out' },
                        hover: {
                          fill: hasViewData ? '#991b1b' : '#cbd5e1',
                          stroke: hasViewData ? '#7f1d1d' : '#ffffff',
                          strokeWidth: hasViewData ? 2 : 0.5,
                          outline: 'none',
                          cursor: hasViewData ? 'pointer' : 'default',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(event) => handleMapMouseEnter(geo, event)}
                      onMouseLeave={handleMapMouseLeave}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {tooltipContent && (
            <div
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 pointer-events-none"
              style={{ left: tooltipPos.x + 10, top: tooltipPos.y - 60 }}
            >
              <div className="font-semibold text-slate-900 flex items-center gap-2 text-sm mb-1">
                <span>{getFlag(tooltipContent.country)}</span>
                <span>{tooltipContent.country}</span>
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Views:</span>
                  <span className="font-semibold">{tooltipContent.views}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Unique:</span>
                  <span className="font-semibold">{tooltipContent.uniqueViewers}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Engage:</span>
                  <span className="font-semibold">{tooltipContent.avgEngagement}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {hasCountryData && (
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-2 rounded bg-amber-100"></div>
                <div className="w-3 h-2 rounded bg-amber-400"></div>
                <div className="w-3 h-2 rounded bg-orange-500"></div>
                <div className="w-3 h-2 rounded bg-red-600"></div>
                <span className="text-slate-400 ml-1">views</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
