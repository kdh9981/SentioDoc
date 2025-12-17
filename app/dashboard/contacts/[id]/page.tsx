'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';
import TagSelector, { Tag } from '@/components/ui/TagSelector';
import TagBadge from '@/components/ui/TagBadge';
import WorldMap from '@/components/dashboard/WorldMap';
import PeriodSelector from '@/components/dashboard/PeriodSelector';
import UpgradeModal from '@/components/dashboard/UpgradeModal';
import { usePeriodFilter, Tier } from '@/hooks/usePeriodFilter';
import { useTimezone } from '@/contexts/TimezoneContext';
import {
  getDateStringInTimezone,
  getHourInTimezone,
  getWeekStartInTimezone,
  getMonthKeyInTimezone,
  formatDateKeyForDisplay,
  formatMonthKeyForDisplay,
  formatMonthKeyForFullDisplay,
  generateDateKeysInTimezone,
  generateWeekKeysInTimezone,
  generateMonthKeysInTimezone,
} from '@/lib/timezone';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  total_views: number;
  avg_engagement: number;
  is_hot_lead: boolean;
  first_seen_at: string;
  last_seen_at: string;
  total_time_seconds?: number;
  files_viewed?: string[];
  has_downloaded?: boolean;
  tags?: string[];
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  language?: string;
  completion_rate?: number;
  sameCompanyViewers?: number;
}

interface ViewHistory {
  id: string;
  file_id: string;
  file_name: string;
  file_type: string;
  link_type: string;
  accessed_at: string;
  first_accessed_at?: string;
  engagement_score: number;
  total_clicks: number;
  total_duration_seconds: number;
  completion_percentage: number;
  downloaded: boolean;
  is_return_visit: boolean;
  traffic_source?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  file_exists?: boolean;  // Deprecated: use link_deleted instead
  link_deleted?: boolean;  // Whether the link was deleted (from access_logs)
}

interface ContactNote {
  id: string;
  content: string;
  created_at: string;
}

interface AccessLogForAnalytics {
  id: string;
  accessed_at: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  traffic_source: string | null;
  utm_campaign: string | null;
  is_qr_scan: boolean;
}

interface ContactInsight {
  icon: string;
  text: string;
  implication: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContactAction {
  priority: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  reason: string;
  buttons: { label: string; icon: string; action: string }[];
}

// Helper functions
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const remainMins = Math.floor((seconds % 3600) / 60);
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function formatDaysAgo(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatActivityDate(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  const daysAgo = Math.floor((today.getTime() - d.getTime()) / 86400000);
  return `${daysAgo} days ago`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts: Record<string, number> = {};
  arr.forEach((v) => {
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] as T;
}

function getDayName(day: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
}

function getFullDayName(day: number): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

const FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'South Korea': '🇰🇷',
  'United Kingdom': '🇬🇧',
  'Thailand': '🇹🇭',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Singapore': '🇸🇬',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',
  'Netherlands': '🇳🇱',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Sweden': '🇸🇪',
};

// ISO code to full country name mapping (for converting DB values to display names)
const ISO_TO_COUNTRY: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'AU': 'Australia',
  'BR': 'Brazil',
  'TH': 'Thailand',
  'SG': 'Singapore',
  'TW': 'Taiwan',
  'HK': 'Hong Kong',
  'NL': 'Netherlands',
  'ES': 'Spain',
  'IT': 'Italy',
  'SE': 'Sweden',
  'MX': 'Mexico',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'RU': 'Russia',
  'PL': 'Poland',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'TR': 'Turkey',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'UA': 'Ukraine',
  'CZ': 'Czech Republic',
  'RO': 'Romania',
  'HU': 'Hungary',
  'GR': 'Greece',
  'BY': 'Belarus',
};

// Helper function to convert ISO code or full name to full country name
function normalizeCountryName(country: string | null): string | null {
  if (!country) return null;
  // If it's already a full name, return as-is
  if (country.length > 2) return country;
  // Convert ISO code to full name
  return ISO_TO_COUNTRY[country.toUpperCase()] || country;
}

function getFlag(country?: string): string {
  if (!country) return '🌍';
  return FLAGS[country] || '🌍';
}

function getFileIcon(fileType?: string, linkType?: string): string {
  if (linkType === 'url') return '🔗';
  const ft = fileType?.toLowerCase() || '';
  if (ft === 'pdf' || ft.includes('pdf')) return '📕';
  if (ft === 'pptx' || ft.includes('presentation') || ft.includes('ppt')) return '📊';
  if (ft === 'docx' || ft.includes('word') || ft.includes('doc')) return '📘';
  if (ft === 'xlsx' || ft.includes('sheet') || ft.includes('xls')) return '📗';
  if (ft === 'image' || ft.includes('image')) return '🖼️';
  if (ft === 'video' || ft.includes('video')) return '🎬';
  return '📄';
}

function IntentBadge({ score }: { score: number }) {
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        🔥 {Math.round(score)}
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
        🟡 {Math.round(score)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
      ⚪ {Math.round(score)}
    </span>
  );
}

function generateContactInsights(
  contact: Contact,
  viewHistory: ViewHistory[]
): ContactInsight[] {
  const insights: ContactInsight[] = [];

  // Return visitor pattern
  const returnCount = viewHistory.filter((v) => v.is_return_visit).length;
  const hasDownloaded = viewHistory.some((v) => v.downloaded);

  if (returnCount >= 3 && hasDownloaded) {
    insights.push({
      icon: '🔄',
      text: `Downloaded after ${returnCount + 1} visits`,
      implication: 'Thorough evaluator - took time to decide',
      priority: 'high',
    });
  } else if (returnCount >= 2) {
    insights.push({
      icon: '🔄',
      text: `Returned ${returnCount + 1} times`,
      implication: 'Showing sustained interest',
      priority: 'medium',
    });
  }

  // Peak activity time
  if (viewHistory.length > 0) {
    const hours = viewHistory.map((v) => new Date(v.accessed_at).getHours());
    const days = viewHistory.map((v) => getDayName(new Date(v.accessed_at).getDay()));
    const peakHour = mode(hours);
    const peakDay = mode(days);

    if (peakHour !== undefined && peakDay !== undefined) {
      insights.push({
        icon: '⏰',
        text: `Most active ${peakDay} around ${peakHour}:00`,
        implication: 'Optimal time to reach out',
        priority: 'low',
      });
    }
  }

  // Colleagues viewing
  if (contact.sameCompanyViewers && contact.sameCompanyViewers >= 2) {
    insights.push({
      icon: '👥',
      text: `${contact.sameCompanyViewers} colleagues also viewed`,
      implication: `Being shared internally at ${contact.company}`,
      priority: 'high',
    });
  }

  // Very high intent signals
  if (contact.avg_engagement >= 80 && returnCount >= 2 && (hasDownloaded || contact.has_downloaded)) {
    insights.push({
      icon: '🔥',
      text: 'Very high intent signals',
      implication: 'Priority follow-up recommended',
      priority: 'high',
    });
  }

  // High engagement
  if (contact.avg_engagement >= 70 && !insights.find(i => i.icon === '🔥')) {
    insights.push({
      icon: '🎯',
      text: `High engagement (${contact.avg_engagement}%)`,
      implication: 'Actively interested in your content',
      priority: 'medium',
    });
  }

  // Completed content
  if (contact.completion_rate && contact.completion_rate >= 90) {
    insights.push({
      icon: '✅',
      text: `${contact.completion_rate}% completion rate`,
      implication: 'Thoroughly reviewed your materials',
      priority: 'medium',
    });
  }

  // Downloaded file
  if (hasDownloaded || contact.has_downloaded) {
    insights.push({
      icon: '📥',
      text: 'Downloaded your file',
      implication: 'Saved for reference or sharing',
      priority: 'medium',
    });
  }

  // QR code access
  const qrScans = viewHistory.filter((v) => v.is_qr_scan).length;
  if (qrScans > 0) {
    insights.push({
      icon: '📱',
      text: `Found via QR code (${qrScans}x)`,
      implication: 'In-person or print marketing effective',
      priority: 'low',
    });
  }

  // UTM campaign tracking
  const utmViews = viewHistory.filter((v) => v.utm_campaign).length;
  if (utmViews > 0) {
    const campaigns = [...new Set(viewHistory.filter((v) => v.utm_campaign).map((v) => v.utm_campaign))];
    insights.push({
      icon: '🎯',
      text: `From campaign: ${campaigns[0]}`,
      implication: 'Marketing campaign is working',
      priority: 'low',
    });
  }

  // Multiple files viewed
  const filesCount = contact.files_viewed?.length || 0;
  if (filesCount >= 3) {
    insights.push({
      icon: '📂',
      text: `Viewed ${filesCount} different files`,
      implication: 'Exploring your full offering',
      priority: 'medium',
    });
  }

  // Significant time spent
  if (contact.total_time_seconds && contact.total_time_seconds >= 300) {
    const minutes = Math.round(contact.total_time_seconds / 60);
    insights.push({
      icon: '⏱️',
      text: `Spent ${minutes} minutes total`,
      implication: 'Invested significant time reviewing',
      priority: 'medium',
    });
  }

  return insights.slice(0, 6);
}

function generateContactActions(
  contact: Contact,
  insights: ContactInsight[]
): ContactAction[] {
  const actions: ContactAction[] = [];

  const lastSeenHours = (Date.now() - new Date(contact.last_seen_at).getTime()) / 3600000;

  // Hot lead - immediate follow up
  if (contact.avg_engagement >= 70 && lastSeenHours < 48) {
    actions.push({
      priority: 'high',
      icon: '🔥',
      title: `Reach out to ${contact.name || 'this viewer'}`,
      reason: `${Math.round(contact.avg_engagement)}% engaged, active ${lastSeenHours < 1 ? 'just now' : Math.round(lastSeenHours) + 'h ago'}`,
      buttons: [
        { label: 'Email', icon: '📧', action: 'email' },
        { label: 'LinkedIn', icon: '💼', action: 'linkedin' },
      ],
    });
  }

  // Schedule based on active time
  const timeInsight = insights.find((i) => i.icon === '⏰');
  if (timeInsight) {
    actions.push({
      priority: 'medium',
      icon: '📅',
      title: 'Schedule for their active time',
      reason: 'Their most active time - higher response rate',
      buttons: [{ label: 'Schedule', icon: '📅', action: 'schedule' }],
    });
  }

  // Team viewing - suggest demo
  const teamInsight = insights.find((i) => i.icon === '👥');
  if (teamInsight && contact.company) {
    actions.push({
      priority: 'high',
      icon: '👥',
      title: `Offer team demo to ${contact.company}`,
      reason: 'Multiple people viewing - team interest',
      buttons: [{ label: 'Draft email', icon: '📧', action: 'draftDemoEmail' }],
    });
  }

  // Downloaded - follow up
  const downloadInsight = insights.find((i) => i.icon === '📥');
  if (downloadInsight) {
    actions.push({
      priority: 'medium',
      icon: '📥',
      title: 'Follow up on downloaded file',
      reason: 'They saved your content - likely reviewing',
      buttons: [{ label: 'Email', icon: '📧', action: 'email' }],
    });
  }

  // Return visitor - nurture
  const returnInsight = insights.find((i) => i.icon === '🔄');
  if (returnInsight && !actions.find(a => a.icon === '🔥')) {
    actions.push({
      priority: 'medium',
      icon: '🔄',
      title: 'Nurture this returning visitor',
      reason: 'Multiple visits shows ongoing interest',
      buttons: [{ label: 'Email', icon: '📧', action: 'email' }],
    });
  }

  // Re-engage cold lead
  if (lastSeenHours > 168 && contact.avg_engagement >= 40) {
    actions.push({
      priority: 'low',
      icon: '💤',
      title: 'Re-engage - been a week',
      reason: `Last active ${Math.round(lastSeenHours / 24)} days ago`,
      buttons: [{ label: 'Email', icon: '📧', action: 'email' }],
    });
  }

  return actions.slice(0, 4);
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogForAnalytics[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [viewTimeMode, setViewTimeMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [contactTags, setContactTags] = useState<Tag[]>([]);

  // Period filter state
  const [userTier, setUserTier] = useState<Tier>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');

  const periodFilter = usePeriodFilter(userTier);
  const { timezone } = useTimezone();

  // Fetch user tier
  useEffect(() => {
    async function fetchTier() {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUserTier((data.tier?.toLowerCase() || 'free') as Tier);
        }
      } catch (error) {
        console.error('Failed to fetch tier:', error);
      }
    }
    fetchTier();
  }, []);

  const fetchContactData = useCallback(async () => {
    try {
      setLoading(true);

      // Get date range from period filter
      const { startDate, endDate } = periodFilter.getApiParams();

      const contactRes = await fetch(`/api/contacts/${contactId}?startDate=${startDate}&endDate=${endDate}`);
      if (!contactRes.ok) {
        if (contactRes.status === 404) {
          setError('Contact not found');
          return;
        }
        throw new Error('Failed to fetch contact');
      }
      const contactData = await contactRes.json();

      if (!contactData.contact.company && contactData.contact.email) {
        const domain = contactData.contact.email.split('@')[1];
        if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
          const companyName = domain.split('.')[0];
          contactData.contact.company = companyName.charAt(0).toUpperCase() + companyName.slice(1);
        }
      }

      setContact(contactData.contact);
      setViewHistory(contactData.viewHistory || []);
      setAccessLogs(contactData.accessLogs || []);
      setNotes(contactData.notes || []);

      // Fetch contact tags
      const tagsRes = await fetch(`/api/contacts/${contactId}/tags`);
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setContactTags(tagsData.tags || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [contactId, periodFilter]);

  useEffect(() => {
    if (contactId) {
      fetchContactData();
    }
  }, [contactId, fetchContactData, periodFilter.effectiveRange]);

  const insights = useMemo(() => {
    if (!contact) return [];
    return generateContactInsights(contact, viewHistory);
  }, [contact, viewHistory]);

  const actions = useMemo(() => {
    if (!contact) return [];
    return generateContactActions(contact, insights);
  }, [contact, insights]);

  // Analytics calculations - using raw access logs and full date range (matching file analytics)
  const viewsOverTime = useMemo(() => {
    const { startDate, endDate } = periodFilter.effectiveRange;

    if (viewTimeMode === 'daily') {
      // Generate ALL date keys in the range
      const dateKeys = generateDateKeysInTimezone(startDate, endDate, timezone);
      const dayCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      dateKeys.forEach(key => {
        dayCounts.set(key, {
          label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
          fullLabel: formatDateKeyForDisplay(key, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          value: 0,
        });
      });

      // Fill in counts from access logs
      accessLogs.forEach(log => {
        const key = getDateStringInTimezone(log.accessed_at, timezone);
        const day = dayCounts.get(key);
        if (day) day.value++;
      });

      return Array.from(dayCounts.values());
    } else if (viewTimeMode === 'weekly') {
      const weekKeys = generateWeekKeysInTimezone(startDate, endDate, timezone);
      const weekCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      weekKeys.forEach(key => {
        weekCounts.set(key, {
          label: formatDateKeyForDisplay(key, { month: 'short', day: 'numeric' }),
          fullLabel: `Week of ${formatDateKeyForDisplay(key, { month: 'short', day: 'numeric', year: 'numeric' })}`,
          value: 0,
        });
      });

      accessLogs.forEach(log => {
        const weekStart = getWeekStartInTimezone(log.accessed_at, timezone);
        const week = weekCounts.get(weekStart);
        if (week) week.value++;
      });

      return Array.from(weekCounts.values());
    } else {
      // Monthly
      const monthKeys = generateMonthKeysInTimezone(startDate, endDate, timezone);
      const monthCounts: Map<string, { label: string; fullLabel: string; value: number }> = new Map();

      monthKeys.forEach(key => {
        monthCounts.set(key, {
          label: formatMonthKeyForDisplay(key, { month: 'short' }),
          fullLabel: formatMonthKeyForFullDisplay(key),
          value: 0,
        });
      });

      accessLogs.forEach(log => {
        const monthKey = getMonthKeyInTimezone(log.accessed_at, timezone);
        const month = monthCounts.get(monthKey);
        if (month) month.value++;
      });

      return Array.from(monthCounts.values());
    }
  }, [accessLogs, viewTimeMode, periodFilter.effectiveRange, timezone]);

  // Top days - using raw access logs
  const topDays = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    accessLogs.forEach((log) => {
      const day = new Date(log.accessed_at).getDay();
      counts[day]++;
    });
    return days.map((name, i) => ({
      day: name,
      count: counts[i],
    }));
  }, [accessLogs]);

  // Hourly data - using raw access logs with timezone
  const hourlyData = useMemo(() => {
    const counts = new Array(24).fill(0);
    accessLogs.forEach((log) => {
      const hour = getHourInTimezone(log.accessed_at, timezone);
      counts[hour]++;
    });
    return counts.map((count, hour) => ({
      hour,
      label: `${hour}:00`,
      count,
    }));
  }, [accessLogs, timezone]);

  const trafficSources = useMemo(() => {
    const sources: Record<string, number> = {};
    accessLogs.forEach((log) => {
      const source = log.traffic_source || 'direct';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [accessLogs]);

  const utmCampaigns = useMemo(() => {
    const campaigns: Record<string, number> = {};
    accessLogs.forEach((log) => {
      if (log.utm_campaign) {
        campaigns[log.utm_campaign] = (campaigns[log.utm_campaign] || 0) + 1;
      }
    });
    return Object.entries(campaigns)
      .map(([campaign, count]) => ({ campaign, count }))
      .sort((a, b) => b.count - a.count);
  }, [accessLogs]);

  const accessMethod = useMemo(() => {
    let direct = 0;
    let qr = 0;
    accessLogs.forEach((log) => {
      if (log.is_qr_scan) qr++;
      else direct++;
    });
    return { direct, qr };
  }, [accessLogs]);

  const devices = useMemo(() => {
    const deviceCounts: Record<string, number> = {};
    accessLogs.forEach((log) => {
      const device = log.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    return Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  }, [accessLogs]);

  const browsers = useMemo(() => {
    const browserCounts: Record<string, number> = {};
    accessLogs.forEach((log) => {
      const browser = log.browser || 'Unknown';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });
    return Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count);
  }, [accessLogs]);

  const operatingSystems = useMemo(() => {
    const osCounts: Record<string, number> = {};
    accessLogs.forEach((log) => {
      const os = log.os || 'Unknown';
      osCounts[os] = (osCounts[os] || 0) + 1;
    });
    return Object.entries(osCounts)
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count);
  }, [accessLogs]);

  const locations = useMemo(() => {
    if (viewHistory.length === 0) return [];
    const locationCounts: Record<string, { country: string; city?: string; count: number }> = {};
    viewHistory.forEach((v) => {
      if (v.country) {
        const key = v.city ? `${v.city}, ${v.country}` : v.country;
        if (!locationCounts[key]) {
          locationCounts[key] = { country: v.country, city: v.city, count: 0 };
        }
        locationCounts[key].count++;
      }
    });
    return Object.values(locationCounts).sort((a, b) => b.count - a.count);
  }, [viewHistory]);

  // World map data - using raw access logs (not aggregated viewHistory)
  const worldMapData = useMemo(() => {
    const countryMap = new Map<string, { views: number; uniqueViewers: Set<string>; totalEngagement: number }>();
    accessLogs.forEach(log => {
      // Normalize country from ISO code to full name
      const rawCountry = log.country;
      const country = normalizeCountryName(rawCountry) || 'Unknown';
      if (country === 'Unknown') return;
      if (!countryMap.has(country)) {
        countryMap.set(country, { views: 0, uniqueViewers: new Set(), totalEngagement: 0 });
      }
      const data = countryMap.get(country)!;
      data.views++;
    });
    const codeMap: Record<string, string> = {
      'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 'Germany': 'DE',
      'France': 'FR', 'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN',
      'Australia': 'AU', 'Brazil': 'BR', 'Thailand': 'TH', 'Singapore': 'SG',
      'Taiwan': 'TW', 'Hong Kong': 'HK', 'Netherlands': 'NL', 'Spain': 'ES',
      'Italy': 'IT', 'Sweden': 'SE', 'Mexico': 'MX', 'Indonesia': 'ID',
      'Vietnam': 'VN', 'Malaysia': 'MY', 'Philippines': 'PH',
    };
    return Array.from(countryMap.entries()).map(([country, data]) => ({
      country,
      countryCode: codeMap[country] || 'XX',
      views: data.views,
      uniqueViewers: data.uniqueViewers.size,
      avgEngagement: 0, // Engagement calculated at viewer level, not per-log
    }));
  }, [accessLogs]);

  // Top cities - using raw access logs (matching AnalyticsTab format - includes Unknown)
  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    accessLogs.forEach(log => {
      const city = log.city || 'Unknown';
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    const total = accessLogs.length || 1;
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [accessLogs]);

  // Top regions - using raw access logs (matching AnalyticsTab format - includes Unknown)
  const topRegions = useMemo(() => {
    const counts = new Map<string, number>();
    accessLogs.forEach(log => {
      // Normalize country from ISO code to full name
      const region = normalizeCountryName(log.country) || 'Unknown';
      counts.set(region, (counts.get(region) || 0) + 1);
    });
    const total = accessLogs.length || 1;
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [accessLogs]);

  const handleAction = (action: string) => {
    if (!contact) return;
    switch (action) {
      case 'email':
        if (contact.email) window.open(`mailto:${contact.email}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(contact.name || '')}`);
        break;
      case 'draftPricingEmail':
        if (contact.email) {
          window.open(`mailto:${contact.email}?subject=Pricing%20Information&body=Hi%20${encodeURIComponent(contact.name || '')}%2C%0A%0AI%20noticed%20you%20were%20reviewing%20our%20pricing%20information.%20I%27d%20be%20happy%20to%20discuss%20options%20that%20best%20fit%20your%20needs.%0A%0ABest%20regards`);
        }
        break;
      case 'draftDemoEmail':
        if (contact.email) {
          window.open(`mailto:${contact.email}?subject=Team%20Demo%20Invitation&body=Hi%20${encodeURIComponent(contact.name || '')}%2C%0A%0AI%20noticed%20several%20people%20from%20${encodeURIComponent(contact.company || 'your team')}%20have%20been%20reviewing%20our%20materials.%20Would%20you%20be%20interested%20in%20scheduling%20a%20team%20demo%3F%0A%0ABest%20regards`);
        }
        break;
      case 'schedule':
        if (contact.email) {
          window.open(`mailto:${contact.email}?subject=Quick%20Call&body=Hi%20${encodeURIComponent(contact.name || '')}%2C%0A%0AWould%20you%20have%20time%20for%20a%20quick%20call%20this%20week%3F%0A%0ABest%20regards`);
        }
        break;
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !contact) return;
    setSavingNote(true);
    setNoteSaved(false);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNewNote('');
        setNoteSaved(true);
        // Hide success after 2 seconds and close form
        setTimeout(() => {
          setNoteSaved(false);
          setShowAddNote(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editNoteContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map(n => n.id === noteId ? data.note : n));
        setEditingNoteId(null);
        setEditNoteContent('');
      }
    } catch (err) {
      console.error('Failed to edit note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const startEditNote = (note: ContactNote) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  // Calculate totals for percentage display
  const totalViews = accessLogs.length;
  const maxViewCount = Math.max(...viewsOverTime.map((v) => v.value), 1);
  const maxDayCount = Math.max(...topDays.map((d) => d.count), 1);
  const maxHourCount = Math.max(...hourlyData.map((h) => h.count), 1);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Link href="/dashboard/contacts" className="text-slate-500 hover:text-slate-700 text-sm mb-4 inline-block">
          ← Back to contacts
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error || 'Contact not found'}</p>
          <button onClick={() => router.push('/dashboard/contacts')} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <Link href="/dashboard/contacts" className="text-slate-500 hover:text-slate-700 text-sm mb-4 inline-block">
          ← Back to contacts
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {contact.name ? contact.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{contact.name || 'Anonymous'}</h1>
              <div className="flex items-center gap-4 text-slate-600 mt-1">
                {contact.email && <span>📧 {contact.email}</span>}
                {contact.company && <span>🏢 {contact.company}</span>}
              </div>
              {/* Tags display */}
              {contactTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {contactTags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      emoji={tag.emoji}
                      color={tag.color}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <TagSelector
            entityType="contact"
            entityId={contactId}
            appliedTags={contactTags}
            onTagsChange={setContactTags}
          />
        </div>
      </div>

      {/* QUICK STATS - 6 cards (CENTER ALIGNED like file page) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">📊</span>
            <span className="text-sm font-semibold text-slate-600">Engage</span>
            <InfoTooltip content={getMetricDefinition('engageContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{Math.round(contact.avg_engagement || 0)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">👁️</span>
            <span className="text-sm font-semibold text-slate-600">Visits</span>
            <InfoTooltip content={getMetricDefinition('totalViewsContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{contact.total_views || 0}x</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">📁</span>
            <span className="text-sm font-semibold text-slate-600">Files</span>
            <InfoTooltip content={getMetricDefinition('filesViewedContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{contact.files_viewed?.length || 0}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">⏱️</span>
            <span className="text-sm font-semibold text-slate-600">Time</span>
            <InfoTooltip content={getMetricDefinition('totalTimeContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatDuration(contact.total_time_seconds || 0)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">📅</span>
            <span className="text-sm font-semibold text-slate-600">First</span>
            <InfoTooltip content={getMetricDefinition('firstSeenContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{contact.first_seen_at ? formatDaysAgo(contact.first_seen_at) : '—'}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-sm">🕐</span>
            <span className="text-sm font-semibold text-slate-600">Last</span>
            <InfoTooltip content={getMetricDefinition('lastSeenContact')} position="top" size="sm" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{contact.last_seen_at ? formatDaysAgo(contact.last_seen_at) : '—'}</div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <PeriodSelector
          selectedPeriod={periodFilter.selectedPeriod}
          customRange={periodFilter.customRange}
          userTier={userTier}
          onPeriodChange={(period) => {
            const success = periodFilter.setSelectedPeriod(period);
            if (!success) {
              setUpgradeRequiredTier(periodFilter.getRequiredTierForPeriod(period));
              setShowUpgradeModal(true);
            }
            return success;
          }}
          onCustomRangeChange={periodFilter.setCustomRange}
          onUpgradeClick={(tier) => {
            setUpgradeRequiredTier(tier);
            setShowUpgradeModal(true);
          }}
          formatDateRange={periodFilter.formatDateRange}
          effectiveRange={periodFilter.effectiveRange}
        />
      </div>

      {/* KEY INSIGHTS + RECOMMENDED ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Key Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>💡</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Key insights</span>
            {insights.length > 0 && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{insights.length}</span>
            )}
          </div>
          {insights.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <div className="text-3xl mb-2">💡</div>
              <p className="text-sm">No insights yet</p>
              <p className="text-xs mt-1">Insights appear as viewing patterns emerge</p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.slice(0, 8).map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    insight.priority === 'high'
                      ? 'bg-red-50 border border-red-100'
                      : insight.priority === 'medium'
                      ? 'bg-blue-50 border border-blue-100'
                      : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{insight.text}</p>
                    <p className="text-xs text-slate-600 mt-0.5">→ {insight.implication}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>✅</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Recommended actions</span>
            {actions.length > 0 && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{actions.length}</span>
            )}
          </div>
          {actions.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">No actions needed</p>
              <p className="text-xs mt-1">Actions appear based on activity patterns</p>
            </div>
          ) : (
            <div className="space-y-2">
              {actions.slice(0, 5).map((action, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    action.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : action.priority === 'medium'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{action.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{action.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {action.buttons.map((btn, j) => (
                        <button
                          key={j}
                          onClick={() => handleAction(btn.action)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>{btn.icon}</span>
                          <span>{btn.label}</span>
                          <span>→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEWING PATTERNS - Views Over Time, Top Days, Popular Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Views Over Time - Bar Chart with Daily/Weekly/Monthly toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>📈</span>
              <span className="font-semibold text-slate-800 text-sm tracking-wide">Views over time</span>
              <InfoTooltip content={getMetricDefinition('viewsOverTime')} position="top" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewTimeMode(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    viewTimeMode === mode
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {viewsOverTime.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <p className="text-xs">No views yet</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="h-32 flex items-end gap-[2px]">
                {viewsOverTime.map((item, index) => {
                  const heightPercent = maxViewCount > 0 ? (item.value / maxViewCount) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 h-full flex flex-col justify-end relative group cursor-pointer"
                    >
                      <div
                        className="w-full rounded-t transition-all duration-150 bg-blue-500 group-hover:bg-blue-600"
                        style={{
                          height: item.value > 0 ? `${heightPercent}%` : '2px',
                          minHeight: item.value > 0 ? '4px' : '2px'
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                          <div className="font-medium">{item.fullLabel}</div>
                          <div className="text-blue-300 font-bold">{item.value} views</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{viewsOverTime[0]?.label}</span>
                {viewsOverTime.length > 2 && <span>{viewsOverTime[Math.floor(viewsOverTime.length / 2)]?.label}</span>}
                <span>{viewsOverTime[viewsOverTime.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Top Days - All 7 days */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>📅</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Top days</span>
            <InfoTooltip content={getMetricDefinition('topDays')} position="top" />
          </div>
          <div className="space-y-2">
            {topDays.map((day) => {
              const percentage = totalViews > 0 ? Math.round((day.count / totalViews) * 100) : 0;
              return (
                <div key={day.day} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-10">{day.day}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: maxDayCount > 0 ? `${(day.count / maxDayCount) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                    {day.count} of {totalViews} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Hours - 24-hour bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🕐</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Popular hours</span>
            <InfoTooltip content={getMetricDefinition('popularHours')} position="top" />
          </div>
          {totalViews === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="text-2xl mb-1">🕐</div>
                <p className="text-xs">No data yet</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="h-32 flex items-end gap-[1px]">
                {hourlyData.map((item, index) => {
                  const heightPercent = maxHourCount > 0 ? (item.count / maxHourCount) * 100 : 0;
                  const isPeak = item.count === maxHourCount && item.count > 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 h-full flex flex-col justify-end relative group cursor-pointer"
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-150 ${
                          isPeak ? 'bg-green-500 group-hover:bg-green-600' : item.count > 0 ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-100'
                        }`}
                        style={{
                          height: item.count > 0 ? `${heightPercent}%` : '2px',
                          minHeight: item.count > 0 ? '4px' : '2px'
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                          <div className="font-medium">{item.hour}:00 - {(item.hour + 1) % 24}:00</div>
                          <div className="text-blue-300 font-bold">{item.count} views</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>12AM</span>
                <span>6AM</span>
                <span>12PM</span>
                <span>6PM</span>
                <span>11PM</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HOW THEY FIND YOU - Traffic Sources, UTM Campaigns, Access Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🔗</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Traffic sources</span>
            <InfoTooltip content={getMetricDefinition('trafficSources')} position="top" />
          </div>
          {trafficSources.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No source data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trafficSources.slice(0, 5).map((item, i) => {
                const percentage = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                const maxSourceCount = Math.max(...trafficSources.map(s => s.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16 truncate">{item.source}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / maxSourceCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                      {item.count} of {totalViews} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UTM Campaigns */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🎯</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">UTM campaigns</span>
            <InfoTooltip content={getMetricDefinition('utmCampaigns')} position="top" />
          </div>
          {utmCampaigns.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No UTM data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {utmCampaigns.slice(0, 5).map((item, i) => {
                const percentage = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                const maxCampaignCount = Math.max(...utmCampaigns.map(c => c.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16 truncate">{item.campaign}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / maxCampaignCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                      {item.count} of {totalViews} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Access Method */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>📱</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Access method</span>
            <InfoTooltip content={getMetricDefinition('accessMethod')} position="top" />
          </div>
          {totalViews === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-16">Direct link</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(accessMethod.direct / totalViews) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                  {accessMethod.direct} of {totalViews} ({Math.round((accessMethod.direct / totalViews) * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-16">QR Code</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(accessMethod.qr / totalViews) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                  {accessMethod.qr} of {totalViews} ({Math.round((accessMethod.qr / totalViews) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TECHNICAL PROFILE - Devices, Browsers, Operating Systems */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Devices */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>💻</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Devices</span>
            <InfoTooltip content={getMetricDefinition('devices')} position="top" />
          </div>
          {devices.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No device data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((item, i) => {
                const percentage = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                const maxDeviceCount = Math.max(...devices.map(d => d.count), 1);
                const deviceIcon = item.device === 'desktop' ? '💻' : item.device === 'mobile' ? '📱' : '📟';
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16 flex items-center gap-1">
                      <span>{deviceIcon}</span>
                      <span className="capitalize truncate">{item.device}</span>
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / maxDeviceCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                      {item.count} of {totalViews} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browsers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>🌐</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Browsers</span>
            <InfoTooltip content={getMetricDefinition('browsers')} position="top" />
          </div>
          {browsers.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No browser data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {browsers.slice(0, 5).map((item, i) => {
                const percentage = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                const maxBrowserCount = Math.max(...browsers.map(b => b.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16 truncate">{item.browser}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / maxBrowserCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                      {item.count} of {totalViews} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operating Systems */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>⚙️</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Operating systems</span>
            <InfoTooltip content={getMetricDefinition('operatingSystems')} position="top" />
          </div>
          {operatingSystems.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p className="text-sm">No OS data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {operatingSystems.slice(0, 5).map((item, i) => {
                const percentage = totalViews > 0 ? Math.round((item.count / totalViews) * 100) : 0;
                const maxOsCount = Math.max(...operatingSystems.map(o => o.count), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-16 truncate">{item.os}</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / maxOsCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap w-20 text-right">
                      {item.count} of {totalViews} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* GEOGRAPHIC DISTRIBUTION - Matching File Detail Page */}
      <WorldMap data={worldMapData} cities={topCities} regions={topRegions} totalViews={totalViews} />

      {/* BEHAVIOR TAGS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span>🏷️</span>
          <span className="font-semibold text-slate-800 text-sm tracking-wide">Behavior tags</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {contact.has_downloaded && (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">📥 Downloaded</span>
          )}
          {contact.total_views > 1 && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">🔄 Returned x{contact.total_views - 1}</span>
          )}
          {contact.completion_rate && contact.completion_rate >= 90 && (
            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">✅ Completed</span>
          )}
          {contact.is_hot_lead && (
            <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">🔥 Hot lead</span>
          )}
          {contact.tags?.map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm">{tag}</span>
          ))}
          {!contact.has_downloaded &&
            contact.total_views <= 1 &&
            (!contact.completion_rate || contact.completion_rate < 90) &&
            !contact.is_hot_lead &&
            (!contact.tags || contact.tags.length === 0) && (
              <span className="text-slate-500 text-sm">No behavior tags yet</span>
            )}
        </div>
      </div>

      {/* NOTES */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span className="font-semibold text-slate-800 text-sm tracking-wide">Notes</span>
          </div>
          <button onClick={() => setShowAddNote(!showAddNote)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            + Add note
          </button>
        </div>

        {showAddNote && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note about this contact..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim() || noteSaved}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  noteSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 text-white disabled:opacity-50'
                }`}
              >
                {noteSaved ? '✓ Saved!' : savingNote ? 'Saving...' : 'Save note'}
              </button>
              <button
                onClick={() => { setShowAddNote(false); setNewNote(''); }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border-l-2 border-slate-200 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-500">{formatDate(note.created_at)}</span>
                  <div className="flex items-center gap-2">
                    {editingNoteId !== note.id && (
                      <>
                        <button
                          onClick={() => startEditNote(note)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {deletingNoteId === note.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditNote(note.id)}
                        disabled={savingNote || !editNoteContent.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        {savingNote ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingNoteId(null); setEditNoteContent(''); }}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-700">{note.content}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No notes yet. Add a note to track your interactions.</p>
        )}
      </div>

      {/* ACTIVITY HISTORY - Split by link type */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span>📊</span>
          <span className="font-semibold text-slate-800 text-sm tracking-wide">Activity history</span>
        </div>

        {/* File Activity Section */}
        {viewHistory.filter(v => v.link_type !== 'url').length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span>📁</span>
              <span className="text-sm font-medium text-slate-700">Files</span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {viewHistory.filter(v => v.link_type !== 'url').length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">File</th>
                    <th className="pb-2 font-medium">Visits</th>
                    <th className="pb-2 font-medium">Engage</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Complete</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {viewHistory.filter(v => v.link_type !== 'url').map((view, i) => {
                    const isDeleted = view.link_deleted === true;
                    return (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${!isDeleted ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                      onClick={() => !isDeleted && router.push(`/dashboard/files/${view.file_id}`)}
                    >
                      <td className="py-3 text-sm text-slate-600">{formatActivityDate(view.accessed_at)}</td>
                      <td className="py-3">
                        <div className={`flex items-center gap-2 ${!isDeleted ? 'group' : ''}`}>
                          <span className={!isDeleted ? '' : 'opacity-50'}>{getFileIcon(view.file_type, view.link_type)}</span>
                          <span className={`text-sm font-medium truncate max-w-32 ${!isDeleted ? 'text-slate-900 group-hover:text-blue-600 group-hover:underline' : 'text-slate-400'}`}>
                            {view.file_name}
                          </span>
                          {!isDeleted && (
                            <span className="text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          )}
                          {isDeleted && (
                            <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">deleted</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-slate-600">{view.total_clicks}x</td>
                      <td className="py-3"><IntentBadge score={view.engagement_score} /></td>
                      <td className="py-3 text-sm text-slate-600">{formatDuration(view.total_duration_seconds)}</td>
                      <td className="py-3 text-sm text-slate-600">{Math.round(view.completion_percentage)}%</td>
                      <td className="py-3 text-sm text-slate-600">{view.traffic_source || 'Direct'}</td>
                      <td className="py-3">
                        {view.downloaded && <span className="text-green-600 text-sm mr-2">📥 Downloaded</span>}
                        {view.is_return_visit && !view.downloaded && <span className="text-blue-600 text-sm">🔄 Revisit</span>}
                        {!view.is_return_visit && !view.downloaded && <span className="text-slate-400 text-sm">First Visit</span>}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Track Site Activity Section */}
        {viewHistory.filter(v => v.link_type === 'url').length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span>🔗</span>
              <span className="text-sm font-medium text-slate-700">Track Sites</span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {viewHistory.filter(v => v.link_type === 'url').length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-500 text-sm">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Link</th>
                    <th className="pb-2 font-medium">Clicks</th>
                    <th className="pb-2 font-medium">Engage</th>
                    <th className="pb-2 font-medium">Return</th>
                    <th className="pb-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {viewHistory.filter(v => v.link_type === 'url').map((view, i) => {
                    const isDeleted = view.link_deleted === true;
                    return (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${!isDeleted ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                      onClick={() => !isDeleted && router.push(`/dashboard/files/${view.file_id}`)}
                    >
                      <td className="py-3 text-sm text-slate-600">{formatActivityDate(view.accessed_at)}</td>
                      <td className="py-3">
                        <div className={`flex items-center gap-2 ${!isDeleted ? 'group' : ''}`}>
                          <span className={!isDeleted ? '' : 'opacity-50'}>🔗</span>
                          <span className={`text-sm font-medium truncate max-w-32 ${!isDeleted ? 'text-slate-900 group-hover:text-blue-600 group-hover:underline' : 'text-slate-400'}`}>
                            {view.file_name}
                          </span>
                          {!isDeleted && (
                            <span className="text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          )}
                          {isDeleted && (
                            <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">deleted</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-sm text-slate-600">{view.total_clicks}x</td>
                      <td className="py-3"><IntentBadge score={view.engagement_score} /></td>
                      <td className="py-3">
                        {view.is_return_visit ? (
                          <span className="text-green-600 text-sm font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-slate-400 text-sm">No</span>
                        )}
                      </td>
                      <td className="py-3 text-sm text-slate-600">{view.traffic_source || 'Direct'}</td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state if no activity */}
        {viewHistory.length === 0 && (
          <div className="text-center py-6 text-slate-500">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm">No activity recorded yet</p>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        feature="extended history"
      />
    </div>
  );
}
