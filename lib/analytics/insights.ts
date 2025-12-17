/**
 * LinkLens Insights Engine
 * Formula-based insights generation (NO AI required)
 */

import { AccessLog, getPageAnalysis, getViewsByDayOfWeek, getViewsByHour, getBestTimeToShare } from './calculations';

export interface Insight {
  icon: string;
  text: string;
  implication: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Generate insights for a file based on its analytics
 */
export function generateFileInsights(
  logs: AccessLog[],
  totalPages: number,
  pageLabels?: Record<number, string>
): Insight[] {
  const insights: Insight[] = [];

  if (!logs || logs.length === 0) {
    return [{
      icon: '📊',
      text: 'No views yet',
      implication: 'Share your link to start collecting analytics',
      priority: 'medium',
    }];
  }

  // 1. Most popular page analysis
  if (totalPages > 1) {
    const pageAnalysis = getPageAnalysis(logs, totalPages, pageLabels);
    const popularPage = pageAnalysis.find(p => p.isPopular);
    
    if (popularPage) {
      const avgTime = pageAnalysis.reduce((sum, p) => sum + p.avgTime, 0) / pageAnalysis.length;
      const multiplier = Math.round(popularPage.avgTime / avgTime);
      const label = popularPage.label || `Page ${popularPage.page}`;
      
      insights.push({
        icon: '💎',
        text: `${label} gets ${multiplier}x more attention`,
        implication: 'Strong interest in this content',
        priority: 'medium',
      });
    }

    // 2. High drop-off warning
    const highDropOff = pageAnalysis.find(p => p.hasHighDropOff && p.page > 1);
    if (highDropOff) {
      const label = highDropOff.label || `Page ${highDropOff.page}`;
      insights.push({
        icon: '⚠️',
        text: `${highDropOff.dropOffRate}% drop-off at ${label}`,
        implication: 'Content may need revision',
        priority: 'high',
      });
    }
  }

  // 3. Best time to share
  const bestTime = getBestTimeToShare(logs);
  if (bestTime) {
    insights.push({
      icon: '⏰',
      text: `Peak viewing: ${bestTime.days} at ${bestTime.hours}`,
      implication: 'Best time to share for higher engagement',
      priority: 'medium',
    });
  }

  // 4. Company interest (multiple viewers from same company)
  const companies: Record<string, string[]> = {};
  logs.forEach(log => {
    if (log.viewer_email) {
      const domain = log.viewer_email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
        const company = domain.split('.')[0];
        if (!companies[company]) companies[company] = [];
        if (!companies[company].includes(log.viewer_email)) {
          companies[company].push(log.viewer_email);
        }
      }
    }
  });

  Object.entries(companies).forEach(([company, emails]) => {
    if (emails.length >= 2) {
      insights.push({
        icon: '👥',
        text: `${emails.length} people from ${company} viewing`,
        implication: 'Being shared internally',
        priority: 'high',
      });
    }
  });

  // 5. QR effectiveness
  const qrScans = logs.filter(l => l.access_method === 'qr_scan').length;
  const qrPercent = Math.round((qrScans / logs.length) * 100);
  if (qrPercent > 20) {
    insights.push({
      icon: '📱',
      text: `${qrPercent}% from QR codes`,
      implication: 'Physical distribution is working',
      priority: 'low',
    });
  }

  // 6. Return visitors insight - calculate dynamically (viewers with 2+ views)
  const viewerCounts = new Map<string, number>();
  logs.forEach(l => {
    const id = l.viewer_email || l.ip_address;
    if (id) viewerCounts.set(id, (viewerCounts.get(id) || 0) + 1);
  });
  let returnViewerCount = 0;
  viewerCounts.forEach(count => { if (count > 1) returnViewerCount++; });
  const returnRate = viewerCounts.size > 0 ? Math.round((returnViewerCount / viewerCounts.size) * 100) : 0;
  if (returnRate > 20) {
    insights.push({
      icon: '🔄',
      text: `${returnRate}% are return visitors`,
      implication: 'Content is resonating - people come back',
      priority: 'medium',
    });
  }

  // 7. Low engagement warning
  const avgEngagement = logs.reduce((sum, l) => sum + l.engagement_score, 0) / logs.length;
  if (avgEngagement < 40 && logs.length >= 5) {
    insights.push({
      icon: '📉',
      text: 'Below average engagement',
      implication: 'Consider refreshing content',
      priority: 'high',
    });
  }

  // 8. High download rate
  const downloadCount = logs.filter(l => l.downloaded).length;
  const downloadRate = Math.round((downloadCount / logs.length) * 100);
  if (downloadRate > 30) {
    insights.push({
      icon: '⬇️',
      text: `${downloadRate}% of viewers downloaded`,
      implication: 'High interest - content is valuable',
      priority: 'medium',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights.slice(0, 5); // Return top 5 insights
}
