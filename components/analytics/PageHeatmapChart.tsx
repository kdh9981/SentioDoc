'use client';

interface PageHeatmapData {
  page: number;
  totalTime: number;
  avgTime: number;
  viewCount: number;
  heatLevel: string;
}

interface PageHeatmapChartProps {
  data: PageHeatmapData[];
  totalPages: number;
}

export default function PageHeatmapChart({ data, totalPages }: PageHeatmapChartProps) {
  if (!data || data.length === 0 || totalPages === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        No page data available
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getHeatColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-500 border-red-600';
      case 'medium': return 'bg-orange-400 border-orange-500';
      case 'cool': return 'bg-yellow-400 border-yellow-500';
      case 'cold': return 'bg-slate-200 border-slate-300';
      default: return 'bg-slate-200 border-slate-300';
    }
  };

  const getHeatBg = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-50';
      case 'medium': return 'bg-orange-50';
      case 'cool': return 'bg-yellow-50';
      case 'cold': return 'bg-slate-50';
      default: return 'bg-slate-50';
    }
  };

  // Find hottest page
  const hottestPage = data.reduce((max, p) => p.avgTime > max.avgTime ? p : max, data[0]);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Hot</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400"></span> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Cool</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200"></span> Cold</span>
      </div>

      {/* Page Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {data.map((page) => (
          <div
            key={page.page}
            className={`relative p-2 rounded-lg border text-center cursor-pointer hover:scale-105 transition-transform ${getHeatBg(page.heatLevel)}`}
            title={`Page ${page.page}: ${formatTime(page.avgTime)} avg time`}
          >
            <div className="text-xs text-slate-500">Page</div>
            <div className="text-lg font-bold text-slate-800">{page.page}</div>
            <div className={`mt-1 h-1 rounded-full ${getHeatColor(page.heatLevel)}`} />
            <div className="text-xs text-slate-600 mt-1">{formatTime(page.avgTime)}</div>
            {page.page === hottestPage.page && hottestPage.avgTime > 0 && (
              <span className="absolute -top-1 -right-1 text-sm">🔥</span>
            )}
          </div>
        ))}
      </div>

      {/* Insight */}
      {hottestPage && hottestPage.avgTime > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <span className="material-symbols-outlined text-sm align-middle mr-1">lightbulb</span>
            <strong>Insight:</strong> Page {hottestPage.page} gets the most attention with {formatTime(hottestPage.avgTime)} average time spent.
          </p>
        </div>
      )}
    </div>
  );
}
