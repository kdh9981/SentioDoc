'use client';

interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

interface CountryListProps {
  data: CountryData[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'South Korea': '🇰🇷',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Singapore': '🇸🇬',
  'Thailand': '🇹🇭',
  'Netherlands': '🇳🇱',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Mexico': '🇲🇽',
  'Indonesia': '🇮🇩',
  'Vietnam': '🇻🇳',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Turkey': '🇹🇷',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'South Africa': '🇿🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Unknown': '🌍'
};

export default function CountryList({ data }: CountryListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        No geographic data yet
      </div>
    );
  }

  const maxCount = data[0]?.count || 1;

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.country} className="flex items-center gap-3">
          <span className="text-xl">{COUNTRY_FLAGS[item.country] || '🌍'}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">
                {index + 1}. {item.country}
              </span>
              <span className="text-xs text-slate-500">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
