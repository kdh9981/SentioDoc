/**
 * LinkLens Actions Engine
 * Generate recommended actions based on insights and data
 */

import { AccessLog, AnalyticsSummary, PageAnalysis } from './calculations';
import { Insight } from './insights';

export interface ActionButton {
  label: string;
  icon: string;
  action: 'viewLeads' | 'exportLeads' | 'editFile' | 'copyLink' | 'downloadQR' | 'viewPage' | 'share';
  data?: any;
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  reason: string;
  buttons: ActionButton[];
}

/**
 * Generate recommended actions for a file
 */
export function generateFileActions(
  logs: AccessLog[],
  summary: AnalyticsSummary,
  insights: Insight[],
  pageAnalysis?: PageAnalysis[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (!logs || logs.length === 0) {
    return [{
      priority: 'high',
      icon: '📤',
      title: 'Share your link',
      reason: 'No views yet - start sharing to collect analytics',
      buttons: [
        { label: 'Copy Link', icon: '📋', action: 'copyLink' },
        { label: 'Download QR', icon: '📱', action: 'downloadQR' },
      ],
    }];
  }

  // 1. Hot leads action
  if (summary.hotLeads > 0) {
    const hotViewers = logs
      .filter(l => l.intent_signal === 'hot' && l.viewer_email)
      .slice(0, 3);
    
    const names = hotViewers
      .map(v => v.viewer_name || v.viewer_email?.split('@')[0])
      .join(', ');

    actions.push({
      priority: 'high',
      icon: '🔥',
      title: 'Contact ' + summary.hotLeads + ' hot lead' + (summary.hotLeads > 1 ? 's' : ''),
      reason: names ? names + ' - High intent viewers' : 'High intent viewers ready for follow-up',
      buttons: [
        { label: 'View Leads', icon: '👥', action: 'viewLeads' },
        { label: 'Export', icon: '📤', action: 'exportLeads' },
      ],
    });
  }

  // 2. Drop-off fix action
  const dropOffInsight = insights.find(i => i.icon === '⚠️' && i.text.includes('drop-off'));
  if (dropOffInsight && pageAnalysis) {
    const highDropOffPage = pageAnalysis.find(p => p.hasHighDropOff);
    if (highDropOffPage) {
      actions.push({
        priority: 'high',
        icon: '⚠️',
        title: 'Fix page ' + highDropOffPage.page + ' drop-off',
        reason: highDropOffPage.dropOffRate + '% of viewers leave here',
        buttons: [
          { label: 'Review Page', icon: '👁️', action: 'viewPage', data: highDropOffPage.page },
          { label: 'Edit File', icon: '✏️', action: 'editFile' },
        ],
      });
    }
  }

  // 3. Optimal share time
  const timeInsight = insights.find(i => i.icon === '⏰');
  if (timeInsight) {
    actions.push({
      priority: 'medium',
      icon: '⏰',
      title: 'Share at optimal time',
      reason: timeInsight.text + ' - ' + timeInsight.implication,
      buttons: [
        { label: 'Copy Link', icon: '📋', action: 'copyLink' },
        { label: 'Download QR', icon: '📱', action: 'downloadQR' },
      ],
    });
  }

  // 4. Company interest action
  const companyInsight = insights.find(i => i.icon === '👥' && i.text.includes('people from'));
  if (companyInsight) {
    const companyMatch = companyInsight.text.match(/from (\w+)/);
    const company = companyMatch ? companyMatch[1] : 'company';
    actions.push({
      priority: 'medium',
      icon: '🏢',
      title: 'Follow up with ' + company + ' team',
      reason: companyInsight.text + ' - potential deal',
      buttons: [
        { label: 'View Leads', icon: '👥', action: 'viewLeads' },
      ],
    });
  }

  // 5. Low engagement action
  const lowEngagementInsight = insights.find(i => i.icon === '📉');
  if (lowEngagementInsight) {
    actions.push({
      priority: 'medium',
      icon: '📉',
      title: 'Refresh content',
      reason: 'Engagement below average - consider updates',
      buttons: [
        { label: 'Edit File', icon: '✏️', action: 'editFile' },
      ],
    });
  }

  // 6. Popular page action (💎)
  const popularPageInsight = insights.find(i => i.icon === '💎' && i.text.includes('more attention'));
  if (popularPageInsight) {
    const pageMatch = popularPageInsight.text.match(/Page (\d+)/);
    const pageName = pageMatch ? `Page ${pageMatch[1]}` : 'key content';
    actions.push({
      priority: 'medium',
      icon: '💎',
      title: `Highlight ${pageName}`,
      reason: popularPageInsight.text + ' - promote this section',
      buttons: [
        { label: 'Copy Link', icon: '📋', action: 'copyLink' },
        { label: 'Share', icon: '📤', action: 'share' },
      ],
    });
  }

  // 7. Return visitors action (🔄)
  const returnVisitorsInsight = insights.find(i => i.icon === '🔄' && i.text.includes('return'));
  if (returnVisitorsInsight) {
    actions.push({
      priority: 'medium',
      icon: '🔄',
      title: 'Nurture returning viewers',
      reason: returnVisitorsInsight.text + ' - high interest audience',
      buttons: [
        { label: 'View Leads', icon: '👥', action: 'viewLeads' },
        { label: 'Export', icon: '📤', action: 'exportLeads' },
      ],
    });
  }

  // 8. High download action (⬇️)
  const downloadInsight = insights.find(i => i.icon === '⬇️' && i.text.includes('downloaded'));
  if (downloadInsight) {
    actions.push({
      priority: 'medium',
      icon: '⬇️',
      title: 'Follow up with downloaders',
      reason: downloadInsight.text + ' - ready to engage',
      buttons: [
        { label: 'View Leads', icon: '👥', action: 'viewLeads' },
        { label: 'Export', icon: '📤', action: 'exportLeads' },
      ],
    });
  }

  // 9. Amplify if trending (high views recently)
  const viewsThisWeek = logs.filter(l => {
    const date = new Date(l.accessed_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  if (viewsThisWeek > 10 && actions.length < 3) {
    actions.push({
      priority: 'low',
      icon: '📈',
      title: 'Amplify distribution',
      reason: viewsThisWeek + ' views this week - momentum building',
      buttons: [
        { label: 'Copy Link', icon: '📋', action: 'copyLink' },
        { label: 'Share', icon: '📤', action: 'share' },
      ],
    });
  }

  // Sort by priority and limit
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions.slice(0, 4); // Return top 4 actions
}
