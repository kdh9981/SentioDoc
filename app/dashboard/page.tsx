'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-auth';
import MetricsRow from '@/components/dashboard/MetricsRow';
import InsightsCard from '@/components/dashboard/InsightsCard';
import ActionItemsCard from '@/components/dashboard/ActionItemsCard';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';
import PeriodSelector from '@/components/dashboard/PeriodSelector';
import UpgradeModal from '@/components/dashboard/UpgradeModal';
import { usePeriodFilterContext, Tier } from '@/contexts/PeriodFilterContext';
// NEW: Import unified system
import {
  generateUnifiedInsights,
  calculateInsightsSummary,
  HotLeadInfo,
  CompanyInfo,
} from '@/lib/analytics/unified-insights';
import { generateUnifiedActions } from '@/lib/analytics/unified-actions';
import { AccessLog } from '@/lib/analytics/calculations';

// Consumer/personal email domains to exclude from Active Companies
const CONSUMER_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'zoho.com', 'yandex.com', 'mail.com',
  'naver.com', 'daum.net', 'hanmail.net', 'kakao.com', 'qq.com', '163.com',
];

function isConsumerEmail(email: string): boolean {
  if (!email) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return CONSUMER_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function getCompanyNameFromDomain(domain: string): string {
  const name = domain.split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

interface ActivityLog {
  viewerName: string;
  viewerEmail: string;
  country?: string;
  city?: string;
  region?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  accessedAt: string;
  fileName: string;
  fileType?: string;
  fileId: string;
  engagementScore?: number;
  intentSignal?: string;
  totalDurationSeconds?: number;
  isReturnVisit?: boolean;
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isDownloaded?: boolean;
  language?: string;
  isQrScan?: boolean;
}

interface FileRecord {
  id: string;
  name: string;
  views: number;
  createdAt: string;
  slug: string;
  type?: 'file' | 'url';
  fileType?: string;
  mime_type?: string;
  avgEngagement?: number;
}

interface UsageData {
  tier: string;
  usage: {
    activeLinks: number;
    viewsThisMonth: number;
    customDomains: number;
    storageUsed: number;
  };
  limits: {
    activeLinks: number;
    viewsPerMonth: number;
    customDomains: number;
    storageBytes: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { name?: string; full_name?: string } } | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, uniqueViewers: 0, topCountry: 'N/A' });
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');
  const [metricsWithChanges, setMetricsWithChanges] = useState<{
    totalViews: number;
    viewsChange: number;
    uniqueViewers: number;
    viewersChange: number;
    avgEngagement: number;
    engagementChange: number;
    hotLeads: number;
    hotLeadsChange: number;
    qrScans?: number;
    qrScansChange?: number;
    avgCompletion?: number;
    completionChange?: number;
    avgTime?: number;
    timeChange?: number;
    returnRate?: number;
    returnChange?: number;
    downloads?: number;
    downloadsChange?: number;
    uniquePercent?: number;
    viewsToday?: number;
    qrToday?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Get current tier for period filter
  const currentTier = (usageData?.tier?.toLowerCase() || 'free') as Tier;
  const periodFilter = usePeriodFilterContext();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch usage data on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageData(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };
    fetchUsage();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const { startDate, endDate } = periodFilter.getApiParams();
    const params = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    try {
      const [filesRes, analyticsRes, metricsRes] = await Promise.all([
        fetch('/api/files'),
        fetch(`/api/analytics/global${params}`),
        fetch(`/api/analytics/metrics${params}`),
      ]);

      const filesData = await filesRes.json();
      if (filesData.files) setFiles(filesData.files);

      const analyticsData = await analyticsRes.json();
      if (analyticsData.recentActivity) {
        setRecentActivity(analyticsData.recentActivity);
        setStats(analyticsData.stats);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetricsWithChanges(metricsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [periodFilter.effectiveRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Transform data for dashboard
  const metrics = {
    totalViews: metricsWithChanges?.totalViews ?? stats.totalViews,
    viewsChange: metricsWithChanges?.viewsChange ?? 0,
    uniqueViewers: metricsWithChanges?.uniqueViewers ?? stats.uniqueViewers,
    viewersChange: metricsWithChanges?.viewersChange ?? 0,
    avgEngagement: metricsWithChanges?.avgEngagement ?? 0,
    engagementChange: metricsWithChanges?.engagementChange ?? 0,
    hotLeads: metricsWithChanges?.hotLeads ?? recentActivity.filter(a => a.intentSignal === 'hot' || (a.engagementScore && a.engagementScore >= 80)).length,
    hotLeadsChange: metricsWithChanges?.hotLeadsChange ?? 0,
    qrScans: metricsWithChanges?.qrScans ?? 0,
    qrScansChange: metricsWithChanges?.qrScansChange ?? 0,
    avgCompletion: metricsWithChanges?.avgCompletion ?? 0,
    completionChange: metricsWithChanges?.completionChange ?? 0,
    avgTime: metricsWithChanges?.avgTime ?? 0,
    timeChange: metricsWithChanges?.timeChange ?? 0,
    returnRate: metricsWithChanges?.returnRate ?? 0,
    returnChange: metricsWithChanges?.returnChange ?? 0,
    downloads: metricsWithChanges?.downloads ?? 0,
    downloadsChange: metricsWithChanges?.downloadsChange ?? 0,
    uniquePercent: metricsWithChanges?.uniquePercent ?? 0,
    viewsToday: metricsWithChanges?.viewsToday ?? 0,
    qrToday: metricsWithChanges?.qrToday ?? 0,
  };

  // Convert ActivityLog[] to AccessLog[] for unified system
  const accessLogs = useMemo((): AccessLog[] => {
    return recentActivity.map(a => ({
      id: `${a.fileId}-${a.accessedAt}`,
      file_id: a.fileId,
      file_name: a.fileName,
      viewer_name: a.viewerName,
      viewer_email: a.viewerEmail,
      accessed_at: a.accessedAt,
      country: a.country,
      city: a.city,
      region: a.region,
      device_type: a.deviceType,
      browser: a.browser,
      os: a.os,
      language: a.language,
      engagement_score: a.engagementScore || 0,
      intent_signal: a.intentSignal,
      total_duration_seconds: a.totalDurationSeconds || 0,
      is_return_visit: a.isReturnVisit || false,
      return_visit_count: a.isReturnVisit ? 1 : 0,
      traffic_source: a.trafficSource,
      utm_source: a.utmSource,
      utm_medium: a.utmMedium,
      utm_campaign: a.utmCampaign,
      downloaded: a.isDownloaded || false,
      is_qr_scan: a.isQrScan || false,
      access_method: a.isQrScan ? 'qr_scan' : 'direct',
    })) as AccessLog[];
  }, [recentActivity]);

  // Build hot leads and active companies for unified system
  const hotLeadsData = useMemo((): HotLeadInfo[] => {
    const leads: HotLeadInfo[] = [];
    const seenEmails = new Set<string>();

    recentActivity
      .filter(a => a.engagementScore && a.engagementScore >= 70 && a.viewerEmail)
      .forEach(a => {
        if (seenEmails.has(a.viewerEmail)) return;
        seenEmails.add(a.viewerEmail);

        const domain = a.viewerEmail.split('@')[1]?.toLowerCase() || '';
        const isConsumer = isConsumerEmail(a.viewerEmail);

        leads.push({
          name: a.viewerName || a.viewerEmail.split('@')[0],
          email: a.viewerEmail,
          company: isConsumer ? undefined : getCompanyNameFromDomain(domain),
          score: a.engagementScore || 0,
          fileName: a.fileName,
          fileId: a.fileId,
          isReturn: a.isReturnVisit,
          downloaded: a.isDownloaded,
        });
      });

    return leads;
  }, [recentActivity]);

  const activeCompaniesData = useMemo((): CompanyInfo[] => {
    const companyViewers = new Map<string, Set<string>>();

    recentActivity.forEach(a => {
      if (!a.viewerEmail || isConsumerEmail(a.viewerEmail)) return;
      const domain = a.viewerEmail.split('@')[1]?.toLowerCase();
      if (!domain) return;

      if (!companyViewers.has(domain)) {
        companyViewers.set(domain, new Set());
      }
      companyViewers.get(domain)!.add(a.viewerEmail);
    });

    const companies: CompanyInfo[] = [];
    companyViewers.forEach((emails, domain) => {
      if (emails.size >= 2) {
        companies.push({
          name: getCompanyNameFromDomain(domain),
          domain,
          viewerCount: emails.size,
          emails: Array.from(emails),
        });
      }
    });

    return companies.sort((a, b) => b.viewerCount - a.viewerCount);
  }, [recentActivity]);

  // Calculate insights summary for unified system
  const insightsSummary = useMemo(() => {
    if (accessLogs.length === 0) {
      return {
        totalViews: metrics.totalViews,
        uniqueViewers: metrics.uniqueViewers,
        avgEngagement: metrics.avgEngagement,
        hotLeadsCount: hotLeadsData.length,
        warmLeadsCount: recentActivity.filter(a => {
          const score = a.engagementScore || 0;
          return score >= 40 && score < 70;
        }).length,
        coldLeadsCount: recentActivity.filter(a => (a.engagementScore || 0) < 40).length,
        hotLeads: hotLeadsData,
        activeCompanies: activeCompaniesData,
        returnRate: metrics.returnRate || 0,
        downloadRate: metrics.downloads ? (metrics.downloads / Math.max(metrics.totalViews, 1)) * 100 : 0,
        qrScanRate: metrics.qrScans ? (metrics.qrScans / Math.max(metrics.totalViews, 1)) * 100 : 0,
        viewsChange: metrics.viewsChange,
        engagementChange: metrics.engagementChange,
        companiesWithMultipleViewers: activeCompaniesData.map(c => c.name),
      };
    }

    // Use calculateInsightsSummary for more detailed analysis
    const baseSummary = calculateInsightsSummary(accessLogs);

    // Override with dashboard-specific data
    return {
      ...baseSummary,
      totalViews: metrics.totalViews || baseSummary.totalViews,
      uniqueViewers: metrics.uniqueViewers || baseSummary.uniqueViewers,
      avgEngagement: metrics.avgEngagement || baseSummary.avgEngagement,
      hotLeadsCount: hotLeadsData.length,
      hotLeads: hotLeadsData,
      activeCompanies: activeCompaniesData,
      viewsChange: metrics.viewsChange,
      engagementChange: metrics.engagementChange,
      returnRate: metrics.returnRate || baseSummary.returnRate,
      companiesWithMultipleViewers: activeCompaniesData.map(c => c.name),
    };
  }, [accessLogs, metrics, hotLeadsData, activeCompaniesData, recentActivity]);

  // Generate UNIFIED insights (using new system)
  const insights = useMemo(() => {
    if (recentActivity.length === 0 && metrics.totalViews === 0) return [];
    return generateUnifiedInsights(accessLogs, insightsSummary, 'dashboard', 8);
  }, [accessLogs, insightsSummary, recentActivity.length, metrics.totalViews]);

  // Generate UNIFIED actions (independent from insights)
  const actions = useMemo(() => {
    if (recentActivity.length === 0 && metrics.totalViews === 0) return [];
    return generateUnifiedActions(insightsSummary, 'dashboard');
  }, [insightsSummary, recentActivity.length, metrics.totalViews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        onUpgrade={() => router.push('/dashboard/settings')}
        feature="analytics history"
      />

      {/* Header with Period Selector */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">👋 Welcome back, {userName}</h2>
          <p className="mt-1 text-slate-600">Here&apos;s what&apos;s happening with your links</p>
        </div>

        <PeriodSelector
          selectedPeriod={periodFilter.selectedPeriod}
          customRange={periodFilter.customRange}
          userTier={currentTier}
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

      {/* Quick Stats Row (10 cards in 2 rows of 5) */}
      <MetricsRow metrics={metrics} />

      {/* Key Insights and Recommended Actions - Side by Side */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightsCard insights={insights} />
        <ActionItemsCard actions={actions} />
      </div>

      {/* Main Analytics Section - 3-per-row charts, World Map, etc. */}
      <div className="mt-6">
        <DashboardAnalytics
          logs={recentActivity}
          files={files}
          startDate={periodFilter.effectiveRange.startDate}
          endDate={periodFilter.effectiveRange.endDate}
        />
      </div>
    </div>
  );
}
