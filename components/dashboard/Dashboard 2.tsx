'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-auth';
import Sidebar from './Sidebar';
import Header from './Header';
import MetricsRow from './MetricsRow';
import HotLeadsCard from './HotLeadsCard';
import RecentActivityCard from './RecentActivityCard';
import ViewsTrendCard from './ViewsTrendCard';
import TopContentCard from './TopContentCard';
import ActiveCompaniesCard from './ActiveCompaniesCard';
import FilesPage from './FilesPage';
import FileDetailPage from './FileDetailPage';
import LinksPage from './LinksPage';
import ContactsPage from './ContactsPage';
import FavoritesPage from './FavoritesPage';
import AnalyticsPage from './AnalyticsPage';
import TagsPage from './TagsPage';
import SettingsPage from './SettingsPage';
import UploadModal from './UploadModal';
import DomainSettings from '@/components/DomainSettings';
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

type Tier = 'free' | 'starter' | 'pro';
type TimeFilter = '1w' | '1m' | '3m' | 'all';

const TIER_FILTER_ACCESS: Record<Tier, TimeFilter[]> = {
  free: ['1w'],
  starter: ['1w', '1m'],
  pro: ['1w', '1m', '3m', 'all'],
};

const FILTER_LABELS: Record<TimeFilter, string> = {
  '1w': '1 Week',
  '1m': '1 Month',
  '3m': '3 Months',
  'all': 'All',
};

const FILTER_DAYS: Record<TimeFilter, number | null> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  'all': null,
};

const UPGRADE_TIER: Record<Tier, string> = {
  free: 'Starter',
  starter: 'Pro',
  pro: 'Pro',
};

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
  country: string;
  accessedAt: string;
  fileName: string;
  fileId: string;
  engagementScore?: number;
  intentSignal?: string;
  totalDurationSeconds?: number;
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

type ActivePage = 'overview' | 'files' | 'file-detail' | 'links' | 'favorites' | 'contacts' | 'analytics' | 'domains' | 'tags' | 'settings';

export default function Dashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({ totalViews: 0, uniqueViewers: 0, topCountry: 'N/A' });
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1w');
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const currentTier = (usageData?.tier?.toLowerCase() || 'free') as Tier;
  const allowedFilters = TIER_FILTER_ACCESS[currentTier] || TIER_FILTER_ACCESS.free;

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

  const fetchDashboardData = async (period?: TimeFilter) => {
    const filterDays = period ? FILTER_DAYS[period] : FILTER_DAYS['1w'];
    const periodParam = filterDays ? `?days=${filterDays}` : '';

    try {
      const [filesRes, analyticsRes, usageRes] = await Promise.all([
        fetch('/api/files'),
        fetch(`/api/analytics/global${periodParam}`),
        fetch('/api/usage'),
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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

  const handleFilterClick = (filter: TimeFilter) => {
    if (allowedFilters.includes(filter)) {
      setTimeFilter(filter);
    } else {
      setUpgradeMessage(`Upgrade to ${UPGRADE_TIER[currentTier]} to access ${FILTER_LABELS[filter]} analytics.`);
      setShowUpgradeModal(true);
    }
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
    setSelectedFileId(fileId);
    setActivePage('file-detail');
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
    totalViews: stats.totalViews,
    viewsChange: 12,
    uniqueViewers: stats.uniqueViewers,
    avgEngagement: recentActivity.length > 0
      ? Math.round(recentActivity.filter(a => a.engagementScore).reduce((sum, a) => sum + (a.engagementScore || 0), 0) / Math.max(recentActivity.filter(a => a.engagementScore).length, 1))
      : 0,
    hotLeads: recentActivity.filter(a => a.intentSignal === 'high' || (a.engagementScore && a.engagementScore >= 80)).length,
    downloads: 0,
    downloadsToday: 0,
  };

  const hotLeads = recentActivity
    .filter(a => a.engagementScore && a.engagementScore >= 80)
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
      lastVisit: formatTimeAgo(a.accessedAt),
    }));

  const activities = recentActivity.slice(0, 5).map((a, i) => ({
    id: `${i}`,
    viewerName: a.viewerName || 'Anonymous',
    viewerEmail: a.viewerEmail,
    fileName: a.fileName,
    engagementScore: a.engagementScore,
    duration: a.totalDurationSeconds ? formatDuration(a.totalDurationSeconds) : undefined,
    accessedAt: formatTimeAgo(a.accessedAt),
  }));

  const topContent = files
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(f => ({
      id: f.id,
      name: f.name,
      views: f.views,
      type: f.type as 'file' | undefined,
    }));

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

  // Analytics data
  const analyticsData = {
    totalViews: stats.totalViews,
    totalViewsChange: 12,
    uniqueViewers: stats.uniqueViewers,
    avgEngagement: metrics.avgEngagement,
    topCountries: [
      { country: 'United States', views: Math.floor(stats.totalViews * 0.4) },
      { country: 'South Korea', views: Math.floor(stats.totalViews * 0.2) },
      { country: 'United Kingdom', views: Math.floor(stats.totalViews * 0.15) },
      { country: 'Germany', views: Math.floor(stats.totalViews * 0.1) },
      { country: 'Japan', views: Math.floor(stats.totalViews * 0.05) },
    ],
    topDevices: [
      { device: 'Desktop', percentage: 65 },
      { device: 'Mobile', percentage: 30 },
      { device: 'Tablet', percentage: 5 },
    ],
    viewsByDay: [],
  };

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
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-blue-500">lock</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Upgrade Required</h3>
              <p className="text-slate-600 mb-6">{upgradeMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setActivePage('settings');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={fetchDashboardData}
      />

      <Sidebar
        activePage={activePage === 'file-detail' ? 'files' : activePage}
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

      <div className="flex flex-1 flex-col overflow-y-auto">
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
                  <p className="mt-1 text-slate-600">Welcome back, <span className="font-semibold text-slate-800">{userName}</span></p>
                </div>

                <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                  {(['7d', '14d', '30d', 'all'] as TimeFilter[]).map((filter) => {
                    const isAllowed = allowedFilters.includes(filter);
                    const isActive = timeFilter === filter;

                    return (
                      <button
                        key={filter}
                        onClick={() => handleFilterClick(filter)}
                        className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-blue-500 text-white shadow-md'
                            : isAllowed
                              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              : 'text-slate-400 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {!isAllowed && (
                          <span className="material-symbols-outlined text-sm">lock</span>
                        )}
                        {FILTER_LABELS[filter]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <MetricsRow metrics={metrics} />

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  <HotLeadsCard leads={hotLeads} totalCount={hotLeads.length} />
                  <RecentActivityCard activities={activities} />
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                  <ViewsTrendCard />
                  <TopContentCard items={topContent} onViewAll={() => handleNavigate('files')} />
                  <ActiveCompaniesCard companies={activeCompanies} />
                </div>
              </div>
            </div>
          )}

          {/* Files Page */}
          {activePage === 'files' && (
            <FilesPage
              files={files.map(f => ({
                ...f,
                slug: f.slug || f.id,
                type: f.type || 'file',
              }))}
              onUploadClick={() => setShowUploadModal(true)}
              onFileClick={handleFileClick}
              onDeleteFile={handleDeleteFile}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* File Detail Page */}
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
                // TODO: Implement file settings save
                console.log('Save settings:', settings);
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
              onCreateLink={() => setShowUploadModal(true)}
              onLinkClick={handleFileClick}
              onDeleteLink={handleDeleteFile}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* Contacts Page */}
          {activePage === 'contacts' && (
            <ContactsPage
              contacts={contacts}
              onContactClick={(contactId) => {
                console.log('View contact:', contactId);
              }}
            />
          )}

          {/* Favorites Page */}
          {activePage === 'favorites' && (
            <FavoritesPage
              favorites={[]}
              onItemClick={(id, type) => {
                if (type === 'file') handleFileClick(id);
              }}
              onRemoveFavorite={async (id) => {
                console.log('Remove favorite:', id);
              }}
            />
          )}

          {/* Analytics Page */}
          {activePage === 'analytics' && (
            <AnalyticsPage
              data={analyticsData}
              tier={usageData?.tier || 'free'}
            />
          )}

          {/* Tags Page */}
          {activePage === 'tags' && (
            <TagsPage
              tags={[]}
              onCreateTag={async (name, color) => {
                console.log('Create tag:', name, color);
              }}
              onDeleteTag={async (id) => {
                console.log('Delete tag:', id);
              }}
              onTagClick={(tagId) => {
                console.log('View tag:', tagId);
              }}
            />
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
