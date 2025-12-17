'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase-auth';
import Sidebar from './Sidebar';
import Header from './Header';
import MetricsRow from './MetricsRow';
import HotLeadsCard from './HotLeadsCard';
import RecentActivityCard from './RecentActivityCard';
import ViewsTrendCard from './ViewsTrendCard';
import TopContentCard from './TopContentCard';
import ActiveCompaniesCard from './ActiveCompaniesCard';
import InsightsCard from './InsightsCard';
import FilesPage from './FilesPage';
import FileDetailPage from './FileDetailPage';
import FileNotFound from './FileNotFound';
import LinksPage from './LinksPage';
import ContactsPage from './ContactsPage';
import FavoritesPage from './FavoritesPage';
import AnalyticsPage from './AnalyticsPage';
import TagsPage from './TagsPage';
import SettingsPage from './SettingsPage';
import CreateLinkPage from './CreateLinkPage';
import DomainSettings from '@/components/DomainSettings';
import PeriodSelector from './PeriodSelector';
import UpgradeModal from './UpgradeModal';
import { usePeriodFilter, Tier } from '@/hooks/usePeriodFilter';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// Consumer/personal email domains to exclude from Active Companies
const CONSUMER_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.co.jp', 'yahoo.fr', 'yahoo.de',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de',
  'outlook.com', 'outlook.co.uk',
  'live.com', 'live.co.uk',
  'msn.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'zoho.com', 'yandex.com', 'yandex.ru',
  'mail.com', 'gmx.com', 'gmx.de',
  'fastmail.com', 'tutanota.com',
  'naver.com', 'daum.net', 'hanmail.net', 'kakao.com', 'nate.com',
  'qq.com', '163.com', '126.com', 'sina.com', 'aliyun.com',
  'docomo.ne.jp', 'ezweb.ne.jp', 'softbank.ne.jp',
  'rediffmail.com', 'web.de', 'libero.it', 'wp.pl', 'o2.pl', 'seznam.cz',
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

// Tier type is imported from usePeriodFilter

interface FileRecord {
  id: string;
  name: string;
  views: number;
  createdAt: string;
  slug: string;
  type?: 'file' | 'url';
  fileType?: string;
  size?: number;
  uniqueViewers?: number;
  avgEngagement?: number;
  downloads?: number;
  isActive?: boolean;
  requireEmail?: boolean;
  requireName?: boolean;
  allowDownload?: boolean;
  password?: string;
  expiresAt?: string;
}

interface ActivityLog {
  viewerName: string;
  viewerEmail: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  accessedAt: string;
  fileName: string;
  fileType?: string;
  fileId: string;
  engagementScore?: number;
  intentSignal?: string;
  totalDurationSeconds?: number;
  isReturnVisit?: boolean;
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

type ActivePage = 'overview' | 'files' | 'file-detail' | 'links' | 'favorites' | 'contacts' | 'analytics' | 'domains' | 'tags' | 'settings' | 'upload-file' | 'track-site' | 'my-links';

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, uniqueViewers: 0, topCountry: 'N/A' });
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [metricsWithChanges, setMetricsWithChanges] = useState<{
    totalViews: number;
    viewsChange: number;
    uniqueViewers: number;
    viewersChange: number;
    avgEngagement: number;
    engagementChange: number;
    hotLeads: number;
    hotLeadsChange: number;
  } | null>(null);

  const currentTier = (usageData?.tier?.toLowerCase() || 'free') as Tier;
  const periodFilter = usePeriodFilter(currentTier);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const ensureUserExists = async () => {
      if (user?.email) {
        try {
          await fetch('/api/ensure-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Failed to ensure user exists:', error);
        }
      }
    };
    ensureUserExists();
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    const { startDate, endDate } = periodFilter.getApiParams();
    const params = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    try {
      const [filesRes, analyticsRes, usageRes, metricsRes] = await Promise.all([
        fetch('/api/files'),
        fetch(`/api/analytics/global${params}`),
        fetch('/api/usage'),
        fetch(`/api/analytics/metrics${params}`),
      ]);

      const filesData = await filesRes.json();
      if (filesData.files) setFiles(filesData.files);

      const analyticsData = await analyticsRes.json();
      if (analyticsData.recentActivity) {
        setRecentActivity(analyticsData.recentActivity);
        setStats(analyticsData.stats);
      }

      if (usageRes.ok) {
        const usage = await usageRes.json();
        setUsageData(usage);
      }

      // Fetch metrics with change percentages
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

  const handleDeleteFile = async (fileId: string) => {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  };

  const handleFileClick = (fileId: string) => {
    router.push(`/dashboard/files/${fileId}`);
  };

  const handleNavigate = (page: string) => {
    setActivePage(page as ActivePage);
    if (page !== 'file-detail') {
      setSelectedFileId(null);
    }
  };

  // Get selected file details
  const selectedFile = files.find(f => f.id === selectedFileId);

  // Transform viewers from activity for file detail
  const fileViewers = selectedFileId
    ? recentActivity
        .filter(a => a.fileId === selectedFileId)
        .map((a, i) => ({
          id: `${i}`,
          name: a.viewerName || 'Anonymous',
          email: a.viewerEmail,
          company: !isConsumerEmail(a.viewerEmail)
            ? getCompanyNameFromDomain(a.viewerEmail.split('@')[1])
            : undefined,
          engagementScore: a.engagementScore || 0,
          totalTime: a.totalDurationSeconds ? formatDuration(a.totalDurationSeconds) : '0m 0s',
          pagesViewed: 1,
          lastVisit: formatTimeAgo(a.accessedAt),
          visits: 1,
          downloaded: false,
          printed: false,
        }))
    : [];

  // Transform data for dashboard
  const metrics = {
    totalViews: metricsWithChanges?.totalViews ?? stats.totalViews,
    viewsChange: metricsWithChanges?.viewsChange ?? 0,
    uniqueViewers: metricsWithChanges?.uniqueViewers ?? stats.uniqueViewers,
    viewersChange: metricsWithChanges?.viewersChange ?? 0,
    avgEngagement: metricsWithChanges?.avgEngagement ?? (recentActivity.length > 0
      ? Math.round(recentActivity.filter(a => a.engagementScore).reduce((sum, a) => sum + (a.engagementScore || 0), 0) / Math.max(recentActivity.filter(a => a.engagementScore).length, 1))
      : 0),
    engagementChange: metricsWithChanges?.engagementChange ?? 0,
    hotLeads: metricsWithChanges?.hotLeads ?? recentActivity.filter(a => a.intentSignal === 'high' || (a.engagementScore && a.engagementScore >= 80)).length,
    hotLeadsChange: metricsWithChanges?.hotLeadsChange ?? 0,
  };

  const hotLeads = recentActivity
    .filter(a => a.engagementScore && a.engagementScore >= 70)
    .slice(0, 5)
    .map((a, i) => ({
      id: `${i}`,
      name: a.viewerName || 'Anonymous',
      email: a.viewerEmail,
      company: !isConsumerEmail(a.viewerEmail)
        ? getCompanyNameFromDomain(a.viewerEmail.split('@')[1])
        : undefined,
      engagementScore: a.engagementScore || 0,
      fileName: a.fileName,
      fileId: a.fileId,
      lastVisit: formatTimeAgo(a.accessedAt),
      country: a.country,
    }));

  const activities = recentActivity.slice(0, 6).map((a, i) => ({
    id: `${i}`,
    viewerName: a.viewerName || 'Anonymous',
    viewerEmail: a.viewerEmail,
    fileName: a.fileName,
    fileId: a.fileId,
    fileType: a.fileType,
    engagementScore: a.engagementScore,
    intentSignal: a.intentSignal,
    duration: a.totalDurationSeconds ? formatDuration(a.totalDurationSeconds) : undefined,
    accessedAt: formatTimeAgo(a.accessedAt),
    country: a.country,
    city: a.city,
    deviceType: a.deviceType,
  }));

  const topContent = files
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(f => ({
      id: f.id,
      name: f.name,
      views: f.views,
      type: f.type as 'file' | 'url' | undefined,
      fileType: f.fileType,
      avgEngagement: f.avgEngagement || 0,
      hotLeads: 0, // Would need to be calculated from access_logs
    }));

  // Generate actionable insights
  const insights = useMemo(() => {
    const insightsList: Array<{
      id: string;
      type: 'follow_up' | 'trending' | 'low_engagement' | 'new_viewer' | 'return_visitor';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      actionLabel?: string;
      actionData?: { email?: string; fileId?: string };
    }> = [];

    // Find hot leads to follow up
    const hotLeadsList = recentActivity.filter(a =>
      a.intentSignal === 'hot' || (a.engagementScore && a.engagementScore >= 70)
    );

    hotLeadsList.slice(0, 2).forEach(lead => {
      insightsList.push({
        id: `followup-${lead.viewerEmail}`,
        type: 'follow_up',
        priority: 'high',
        title: `Follow up with ${lead.viewerName || 'viewer'}`,
        description: `Viewed "${lead.fileName}" with ${lead.engagementScore || 0}% engagement. Hot lead!`,
        actionLabel: 'View Details',
        actionData: { email: lead.viewerEmail, fileId: lead.fileId }
      });
    });

    // Find return visitors
    const returnVisitors = recentActivity.filter(a => a.isReturnVisit);
    if (returnVisitors.length > 0) {
      const visitor = returnVisitors[0];
      insightsList.push({
        id: `return-${visitor.viewerEmail}`,
        type: 'return_visitor',
        priority: 'medium',
        title: `${visitor.viewerName || 'Someone'} came back`,
        description: `Returned to view "${visitor.fileName}" again. Shows strong interest.`,
        actionLabel: 'View',
        actionData: { fileId: visitor.fileId }
      });
    }

    // Find trending content
    const sortedFiles = [...files].sort((a, b) => (b.views || 0) - (a.views || 0));
    const topFile = sortedFiles[0];
    if (topFile && topFile.views > 5) {
      insightsList.push({
        id: `trending-${topFile.id}`,
        type: 'trending',
        priority: 'medium',
        title: `"${topFile.name}" is getting traction`,
        description: `${topFile.views} views with ${topFile.avgEngagement || 0}% avg engagement.`,
        actionLabel: 'Analyze',
        actionData: { fileId: topFile.id }
      });
    }

    return insightsList;
  }, [recentActivity, files]);

  // Group by company - ONLY business emails
  const companyMap = new Map<string, { totalEngagement: number; count: number; viewerCount: number }>();
  recentActivity.forEach(a => {
    if (isConsumerEmail(a.viewerEmail)) return;
    const domain = a.viewerEmail.split('@')[1]?.toLowerCase();
    if (!domain) return;
    if (!companyMap.has(domain)) {
      companyMap.set(domain, { totalEngagement: 0, count: 0, viewerCount: 0 });
    }
    const company = companyMap.get(domain)!;
    company.viewerCount++;
    if (a.engagementScore) {
      company.totalEngagement += a.engagementScore;
      company.count++;
    }
  });

  const activeCompanies = Array.from(companyMap.entries())
    .map(([domain, data]) => ({
      id: domain,
      name: getCompanyNameFromDomain(domain),
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
      viewerCount: data.viewerCount,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Build contacts list from activity
  const contactsMap = new Map<string, {
    name: string;
    email: string;
    company?: string;
    totalViews: number;
    filesViewed: Set<string>;
    totalEngagement: number;
    engagementCount: number;
    lastActive: string;
    firstSeen: string;
  }>();

  recentActivity.forEach(a => {
    if (!a.viewerEmail) return;
    if (!contactsMap.has(a.viewerEmail)) {
      contactsMap.set(a.viewerEmail, {
        name: a.viewerName || 'Anonymous',
        email: a.viewerEmail,
        company: !isConsumerEmail(a.viewerEmail)
          ? getCompanyNameFromDomain(a.viewerEmail.split('@')[1])
          : undefined,
        totalViews: 0,
        filesViewed: new Set(),
        totalEngagement: 0,
        engagementCount: 0,
        lastActive: a.accessedAt,
        firstSeen: a.accessedAt,
      });
    }
    const contact = contactsMap.get(a.viewerEmail)!;
    contact.totalViews++;
    contact.filesViewed.add(a.fileId);
    if (a.engagementScore) {
      contact.totalEngagement += a.engagementScore;
      contact.engagementCount++;
    }
    if (new Date(a.accessedAt) > new Date(contact.lastActive)) {
      contact.lastActive = a.accessedAt;
    }
    if (new Date(a.accessedAt) < new Date(contact.firstSeen)) {
      contact.firstSeen = a.accessedAt;
    }
  });

  const contacts = Array.from(contactsMap.entries()).map(([email, data], i) => ({
    id: `contact-${i}`,
    name: data.name,
    email: data.email,
    company: data.company,
    totalViews: data.totalViews,
    filesViewed: data.filesViewed.size,
    avgEngagement: data.engagementCount > 0 ? Math.round(data.totalEngagement / data.engagementCount) : 0,
    lastActive: formatTimeAgo(data.lastActive),
    firstSeen: formatTimeAgo(data.firstSeen),
  }));

  // Links (filter files by type = url)
  const links = files
    .filter(f => f.type === 'url')
    .map(f => ({
      id: f.id,
      name: f.name,
      originalUrl: f.slug,
      slug: f.slug,
      views: f.views,
      uniqueViewers: f.uniqueViewers || 0,
      createdAt: f.createdAt,
      isActive: f.isActive ?? true,
    }));

  // User settings
  const userSettings = {
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    company: user?.user_metadata?.company || '',
    tier: usageData?.tier || 'free',
    notifications: {
      emailOnView: true,
      emailOnDownload: true,
      weeklyDigest: false,
    },
  };

  const userName = userSettings.name;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        onUpgrade={() => setActivePage('settings')}
        feature="analytics history"
      />

      <Sidebar
        activePage={activePage === 'file-detail' ? 'my-links' : activePage}
        onNavigate={handleNavigate}
        usage={{
          activeLinks: usageData?.usage.activeLinks || 0,
          linksLimit: usageData?.limits.activeLinks || 10,
          viewsThisMonth: usageData?.usage.viewsThisMonth || 0,
          viewsLimit: usageData?.limits.viewsPerMonth || 5000,
          storageUsed: usageData?.usage.storageUsed || 0,
          storageLimit: usageData?.limits.storageBytes || 104857600,
        }}
        tier={usageData?.tier}
      />

      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header
          userName={userName}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
          {/* Overview Page */}
          {activePage === 'overview' && (
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                  <p className="mt-1 text-slate-600">Welcome back, <span className="font-semibold text-slate-800">{userName}</span> 👋</p>
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

              <MetricsRow metrics={metrics} />

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Insights Card - Above Hot Leads */}
                  {insights.length > 0 && (
                    <InsightsCard
                      insights={insights}
                      onAction={(insight) => {
                        if (insight.actionData?.fileId) {
                          handleFileClick(insight.actionData.fileId);
                        }
                      }}
                    />
                  )}
                  <HotLeadsCard
                    leads={hotLeads}
                    totalCount={hotLeads.length}
                    onLeadClick={(email) => handleNavigate('contacts')}
                    onFileClick={handleFileClick}
                  />
                  <RecentActivityCard
                    activities={activities}
                    onFileClick={handleFileClick}
                    onContactClick={(email) => {
                      // Navigate to contacts page filtered by this email
                      handleNavigate('contacts');
                    }}
                  />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                  <ViewsTrendCard />
                  <TopContentCard items={topContent} onViewAll={() => handleNavigate('files')} onFileClick={handleFileClick} />
                  <ActiveCompaniesCard companies={activeCompanies} />
                </div>
              </div>
            </div>
          )}

          {/* Create Link Pages */}
          {activePage === 'upload-file' && (
            <CreateLinkPage
              defaultTab="file"
              onSuccess={() => fetchDashboardData()}
              onNavigateToMyLinks={() => handleNavigate('my-links')}
              onTabChange={(tab) => handleNavigate(tab === 'file' ? 'upload-file' : 'track-site')}
            />
          )}

          {activePage === 'track-site' && (
            <CreateLinkPage
              defaultTab="site"
              onSuccess={() => fetchDashboardData()}
              onNavigateToMyLinks={() => handleNavigate('my-links')}
              onTabChange={(tab) => handleNavigate(tab === 'file' ? 'upload-file' : 'track-site')}
            />
          )}

          {/* Files/My Links Page */}
          {(activePage === 'files' || activePage === 'my-links') && (
            <FilesPage
              files={files.map(f => ({
                ...f,
                slug: f.slug || f.id,
                type: f.type || 'file',
              }))}
              onUploadClick={() => handleNavigate('upload-file')}
              onFileClick={handleFileClick}
              onDeleteFile={handleDeleteFile}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* File Detail Page */}
          {activePage === 'file-detail' && !selectedFile && (
            <FileNotFound
              onBack={() => handleNavigate('files')}
              onGoToFiles={() => handleNavigate('files')}
            />
          )}

          {activePage === 'file-detail' && selectedFile && (
            <FileDetailPage
              file={{
                id: selectedFile.id,
                name: selectedFile.name,
                slug: selectedFile.slug,
                type: (selectedFile.type || 'file') as 'file' | 'url',
                fileType: selectedFile.fileType,
                size: selectedFile.size,
                views: selectedFile.views,
                uniqueViewers: selectedFile.uniqueViewers || fileViewers.length,
                avgEngagement: selectedFile.avgEngagement ||
                  (fileViewers.length > 0
                    ? Math.round(fileViewers.reduce((sum, v) => sum + v.engagementScore, 0) / fileViewers.length)
                    : 0),
                downloads: selectedFile.downloads || 0,
                createdAt: selectedFile.createdAt,
                isActive: selectedFile.isActive ?? true,
                requireEmail: selectedFile.requireEmail ?? false,
                requireName: selectedFile.requireName ?? false,
                allowDownload: selectedFile.allowDownload ?? true,
                password: selectedFile.password,
                expiresAt: selectedFile.expiresAt,
              }}
              viewers={fileViewers}
              onBack={() => handleNavigate('files')}
              onSave={async (settings) => {
                try {
                  const response = await fetch(`/api/files/${selectedFile.id}/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to save settings');
                  }
                  const result = await response.json();
                  console.log('Settings saved:', result);
                  // Refresh the file data
                  await fetchDashboardData();
                } catch (error) {
                  console.error('Error saving settings:', error);
                  throw error;
                }
              }}
              onDelete={async () => {
                await handleDeleteFile(selectedFile.id);
                handleNavigate('files');
                fetchDashboardData();
              }}
            />
          )}

          {/* Links Page */}
          {activePage === 'links' && (
            <LinksPage
              links={links}
              onCreateLink={() => handleNavigate('track-site')}
              onLinkClick={handleFileClick}
              onDeleteLink={handleDeleteFile}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* Contacts Page */}
          {activePage === 'contacts' && (
            <ContactsPage />
          )}

          {/* Favorites Page */}
          {activePage === 'favorites' && (
            <FavoritesPage
              onFileClick={handleFileClick}
            />
          )}

          {/* Analytics Page */}
          {activePage === 'analytics' && (
            <AnalyticsPage
              tier={usageData?.tier || 'free'}
            />
          )}

          {/* Tags Page */}
          {activePage === 'tags' && (
            <TagsPage />
          )}

          {/* Domains Page */}
          {activePage === 'domains' && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-slate-800 mb-6">Domain Settings</h1>
              <DomainSettings />
            </div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <SettingsPage
              settings={userSettings}
              onSave={async (settings) => {
                console.log('Save settings:', settings);
              }}
              onUpgrade={() => {
                console.log('Open upgrade modal');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US');
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
