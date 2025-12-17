/**
 * Unified Actions Engine
 *
 * Based on ANALYTICS_DISPLAY_SPECIFICATION.md
 *
 * Actions are VISUAL ONLY - buttons show what to do but are not clickable
 * This helps users understand recommended next steps
 */

import { InsightsSummary, SectionType } from './unified-insights';

export type ActionSectionType = 'dashboard' | 'file-doc' | 'file-media' | 'file-image' | 'file-other' | 'file-url' | 'track-site' | 'contacts' | 'analytics';

export interface ActionButton {
  label: string;
  icon: string;
}

export interface UnifiedAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  reason: string;
  buttons: ActionButton[]; // Visual only - not clickable
}

export interface ActionRule {
  id: string;
  priority: 'high' | 'medium' | 'low';
  appliesTo: ActionSectionType[];
  condition: (summary: InsightsSummary) => boolean;
  generate: (summary: InsightsSummary) => UnifiedAction | null;
}

export const MAX_ACTIONS_VISIBLE = 5;
export const MAX_ACTIONS_TOTAL = 5; // Per spec: up to 5 recommended actions

// Priority weights for sorting
const PRIORITY_WEIGHT: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Action Rules per ANALYTICS_DISPLAY_SPECIFICATION.md
 * Organized by section and priority
 */
export const ACTION_RULES: ActionRule[] = [
  // ============ HIGH PRIORITY ACTIONS ============

  // 1. Contact hot lead - ALL SECTIONS
  {
    id: 'contact-hot-lead',
    priority: 'high',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.hotLeads.length > 0 && s.hotLeads.some(l => l.email),
    generate: (s) => {
      const lead = s.hotLeads.find(l => l.email);
      if (!lead) return null;
      return {
        id: 'contact-hot-lead',
        priority: 'high',
        icon: '🔥',
        title: `Contact ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
        reason: `${lead.score}% engagement${lead.fileName ? ` on ${lead.fileName}` : ''}`,
        buttons: [
          { label: 'Email', icon: '📧' },
          { label: 'LinkedIn', icon: '💼' },
        ],
      };
    },
  },

  // 2. Contact multiple hot leads
  {
    id: 'contact-hot-leads-multiple',
    priority: 'high',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'analytics'],
    condition: (s) => s.hotLeadsCount >= 3,
    generate: (s) => ({
      id: 'contact-hot-leads-multiple',
      priority: 'high',
      icon: '🔥',
      title: `Contact ${s.hotLeadsCount} hot leads`,
      reason: 'High intent viewers ready for follow-up',
      buttons: [
        { label: 'View Leads', icon: '👥' },
        { label: 'Export', icon: '📤' },
      ],
    }),
  },

  // 3. Follow up with company showing team interest
  {
    id: 'follow-up-company',
    priority: 'high',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-url', 'track-site', 'analytics'],
    condition: (s) => s.activeCompanies.length > 0,
    generate: (s) => {
      const company = s.activeCompanies[0];
      if (!company) return null;
      return {
        id: 'follow-up-company',
        priority: 'high',
        icon: '🏢',
        title: `Follow up with ${company.name}`,
        reason: `${company.viewerCount} team members viewing`,
        buttons: [
          { label: 'View Leads', icon: '👥' },
        ],
      };
    },
  },

  // 4. Fix drop-off page (Documents only)
  {
    id: 'fix-drop-off',
    priority: 'high',
    appliesTo: ['file-doc'],
    condition: (s) => (s.highDropOffRate ?? 0) > 25 && (s.highDropOffPage ?? 0) > 1,
    generate: (s) => ({
      id: 'fix-drop-off',
      priority: 'high',
      icon: '⚠️',
      title: `Review page ${s.highDropOffPage}`,
      reason: `${s.highDropOffRate}% drop-off`,
      buttons: [
        { label: 'View Page', icon: '👁️' },
      ],
    }),
  },

  // 5. Improve opening content (Media only)
  {
    id: 'improve-hook',
    priority: 'high',
    appliesTo: ['file-media'],
    condition: (s) => (s.earlyDropRate ?? 0) > 30,
    generate: (s) => ({
      id: 'improve-hook',
      priority: 'high',
      icon: '⚠️',
      title: 'Improve opening 20%',
      reason: `High early drop-off rate (${Math.round(s.earlyDropRate ?? 0)}%)`,
      buttons: [
        { label: 'Edit', icon: '✏️' },
      ],
    }),
  },

  // 6. Contact now - CONTACTS section
  {
    id: 'contact-now',
    priority: 'high',
    appliesTo: ['contacts'],
    condition: (s) => s.contact?.isHighIntent === true && (s.contact?.lastVisitHoursAgo ?? 999) < 48,
    generate: (s) => ({
      id: 'contact-now',
      priority: 'high',
      icon: '🔥',
      title: `Contact now`,
      reason: `${s.contact?.avgEngagement || 0}% engagement, ${s.contact?.lastVisitHoursAgo || 0}h ago`,
      buttons: [
        { label: 'Email', icon: '📧' },
        { label: 'LinkedIn', icon: '💼' },
      ],
    }),
  },

  // ============ MEDIUM PRIORITY ACTIONS ============

  // 7. Share at optimal time
  {
    id: 'share-optimal-time',
    priority: 'medium',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'file-url', 'track-site', 'analytics'],
    condition: (s) => !!(s.peakDay && s.peakHour),
    generate: (s) => ({
      id: 'share-optimal-time',
      priority: 'medium',
      icon: '⏰',
      title: `Share on ${s.peakDay} at ${s.peakHour}`,
      reason: 'Peak engagement time',
      buttons: [
        { label: 'Copy Link', icon: '📋' },
        { label: 'QR Code', icon: '📱' },
      ],
    }),
  },

  // 8. Amplify trending content (Dashboard)
  {
    id: 'amplify-trending',
    priority: 'medium',
    appliesTo: ['dashboard', 'analytics'],
    condition: (s) => (s.viewsChange ?? 0) > 20,
    generate: (s) => ({
      id: 'amplify-trending',
      priority: 'medium',
      icon: '📈',
      title: 'Amplify trending content',
      reason: `Views up ${s.viewsChange}%`,
      buttons: [
        { label: 'Share', icon: '📤' },
        { label: 'View', icon: '👁️' },
      ],
    }),
  },

  // 9. Refresh low engagement content
  {
    id: 'refresh-content',
    priority: 'medium',
    appliesTo: ['dashboard', 'file-doc', 'file-media', 'file-image', 'analytics'],
    condition: (s) => s.avgEngagement < 40 && s.totalViews >= 5,
    generate: () => ({
      id: 'refresh-content',
      priority: 'medium',
      icon: '📉',
      title: 'Refresh content',
      reason: 'Below average engagement',
      buttons: [
        { label: 'Edit', icon: '✏️' },
      ],
    }),
  },

  // 10. Follow up with downloaders
  {
    id: 'follow-up-downloaders',
    priority: 'medium',
    appliesTo: ['dashboard', 'file-doc', 'file-image', 'file-other', 'analytics'],
    condition: (s) => s.downloadRate > 30 && s.hotLeads.some(l => l.downloaded),
    generate: () => ({
      id: 'follow-up-downloaders',
      priority: 'medium',
      icon: '⬇️',
      title: 'Follow up with downloaders',
      reason: 'They saved your content',
      buttons: [
        { label: 'View Leads', icon: '👥' },
      ],
    }),
  },

  // 11. Amplify UTM campaign (Track Sites / URLs)
  {
    id: 'amplify-campaign',
    priority: 'medium',
    appliesTo: ['file-url', 'track-site', 'dashboard', 'analytics'],
    condition: (s) => (s.topUtmCampaignViews ?? 0) >= 5,
    generate: (s) => ({
      id: 'amplify-campaign',
      priority: 'medium',
      icon: '🎯',
      title: `Amplify "${s.topUtmCampaign}"`,
      reason: `Driving ${s.topUtmCampaignPercent}% of traffic`,
      buttons: [
        { label: 'Copy UTM Link', icon: '📋' },
      ],
    }),
  },

  // 12. Update link destination (Track Sites / URLs - low engagement)
  {
    id: 'update-link-destination',
    priority: 'medium',
    appliesTo: ['file-url', 'track-site'],
    condition: (s) => s.isExternalUrl === true && s.avgEngagement < 40 && s.totalViews >= 5,
    generate: () => ({
      id: 'update-link-destination',
      priority: 'medium',
      icon: '📉',
      title: 'Update link destination',
      reason: 'Below average engagement',
      buttons: [
        { label: 'Edit URL', icon: '✏️' },
      ],
    }),
  },

  // 13. Shorten content (Media with low completion)
  {
    id: 'shorten-content',
    priority: 'medium',
    appliesTo: ['file-media'],
    condition: (s) => (s.watchCompletion ?? 100) < 50 && s.totalViews >= 3,
    generate: () => ({
      id: 'shorten-content',
      priority: 'medium',
      icon: '📉',
      title: 'Shorten content',
      reason: 'Low completion rate',
      buttons: [
        { label: 'Edit', icon: '✏️' },
      ],
    }),
  },

  // 14. Try different image
  {
    id: 'try-different-image',
    priority: 'medium',
    appliesTo: ['file-image'],
    condition: (s) => s.avgEngagement < 40 && s.totalViews >= 5,
    generate: () => ({
      id: 'try-different-image',
      priority: 'medium',
      icon: '📉',
      title: 'Try different image',
      reason: 'Below average engagement',
      buttons: [
        { label: 'Replace', icon: '🔄' },
      ],
    }),
  },

  // 15. Schedule contact time - CONTACTS section
  {
    id: 'schedule-contact',
    priority: 'medium',
    appliesTo: ['contacts'],
    condition: (s) => !!(s.contact?.peakActiveDay && s.contact?.peakActiveHour),
    generate: (s) => ({
      id: 'schedule-contact',
      priority: 'medium',
      icon: '⏰',
      title: `Schedule for ${s.contact?.peakActiveDay} ${s.contact?.peakActiveHour}`,
      reason: 'Their active time',
      buttons: [
        { label: 'Schedule', icon: '📅' },
      ],
    }),
  },

  // 16. Propose team demo - CONTACTS section
  {
    id: 'propose-team-demo',
    priority: 'medium',
    appliesTo: ['contacts'],
    condition: (s) => (s.contact?.colleagueCount ?? 0) >= 2,
    generate: (s) => ({
      id: 'propose-team-demo',
      priority: 'medium',
      icon: '👥',
      title: 'Propose team demo',
      reason: `${s.contact?.colleagueCount} colleagues viewing`,
      buttons: [
        { label: 'Draft Email', icon: '📧' },
      ],
    }),
  },

  // 17. Send follow-up materials - CONTACTS section
  {
    id: 'send-followup-materials',
    priority: 'medium',
    appliesTo: ['contacts'],
    condition: (s) => s.contact?.hasDownloaded === true && (s.contact?.avgEngagement ?? 0) >= 50,
    generate: () => ({
      id: 'send-followup-materials',
      priority: 'medium',
      icon: '⬇️',
      title: 'Send follow-up materials',
      reason: 'Downloaded and engaged - ready for more',
      buttons: [
        { label: 'Draft Email', icon: '📧' },
      ],
    }),
  },

  // ============ LOW PRIORITY ACTIONS ============

  // 18. Try QR for offline
  {
    id: 'try-qr-offline',
    priority: 'low',
    appliesTo: ['file-doc', 'file-media', 'file-image', 'file-other'],
    condition: (s) => s.qrScanRate < 5 && s.totalViews >= 10,
    generate: () => ({
      id: 'try-qr-offline',
      priority: 'low',
      icon: '📱',
      title: 'Try QR for offline sharing',
      reason: 'Expand reach beyond digital',
      buttons: [
        { label: 'Generate QR', icon: '📱' },
      ],
    }),
  },
];

/**
 * Generate unified actions based on analytics summary
 * Returns max 5 actions, sorted by priority (per spec)
 */
export function generateUnifiedActions(
  summary: InsightsSummary,
  section: ActionSectionType = 'dashboard'
): UnifiedAction[] {
  const actions: UnifiedAction[] = [];

  // Filter rules by section and check conditions
  for (const rule of ACTION_RULES) {
    if (!rule.appliesTo.includes(section)) continue;

    try {
      if (!rule.condition(summary)) continue;

      const action = rule.generate(summary);
      if (action) {
        actions.push(action);
      }
    } catch (e) {
      console.warn(`Action rule ${rule.id} failed:`, e);
    }

    // Stop if we have enough actions
    if (actions.length >= MAX_ACTIONS_TOTAL) break;
  }

  // Sort by priority (HIGH → MEDIUM → LOW)
  actions.sort((a, b) => {
    return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  });

  return actions.slice(0, MAX_ACTIONS_TOTAL);
}
