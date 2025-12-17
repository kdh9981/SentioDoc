'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-auth';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import Header from '@/components/dashboard/Header';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { PeriodFilterProvider, usePeriodFilterContext, Tier } from '@/contexts/PeriodFilterContext';

// Inner component that uses the period filter context
function DashboardLayoutInner({
  children,
  user,
  usageData,
  onSignOut,
}: {
  children: React.ReactNode;
  user: { email?: string; user_metadata?: { name?: string; full_name?: string } } | null;
  usageData: {
    tier: string;
    usage: { activeLinks: number; viewsThisMonth: number; storageUsed: number };
    limits: { activeLinks: number; viewsPerMonth: number; storageBytes: number };
  } | null;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUserTier } = usePeriodFilterContext();

  // Update user tier in context when usageData changes
  useEffect(() => {
    if (usageData?.tier) {
      setUserTier(usageData.tier as Tier);
    }
  }, [usageData?.tier, setUserTier]);

  const handleNavigate = (page: string) => {
    const pageToUrl: Record<string, string> = {
      'overview': '/dashboard',
      'upload-file': '/dashboard/upload',
      'track-site': '/dashboard/track',
      'my-links': '/dashboard/links',
      'files': '/dashboard/links',
      'favorites': '/dashboard/favorites',
      'contacts': '/dashboard/contacts',
      'domains': '/dashboard/domains',
      'tags': '/dashboard/tags',
      'settings': '/dashboard/settings',
    };
    const url = pageToUrl[page] || '/dashboard';
    router.push(url);
  };

  const getActivePage = (): string => {
    if (pathname === '/dashboard') return 'overview';
    if (pathname === '/dashboard/upload') return 'upload-file';
    if (pathname === '/dashboard/track') return 'track-site';
    if (pathname === '/dashboard/links' || pathname?.startsWith('/dashboard/files/')) return 'my-links';
    if (pathname === '/dashboard/favorites') return 'favorites';
    if (pathname?.startsWith('/dashboard/contacts')) return 'contacts';
    if (pathname === '/dashboard/domains') return 'domains';
    if (pathname === '/dashboard/tags') return 'tags';
    if (pathname === '/dashboard/settings') return 'settings';
    return 'overview';
  };

  const getCurrentPageKey = (): string => {
    if (pathname === '/dashboard') return 'overview';
    if (pathname === '/dashboard/upload') return 'upload-file';
    if (pathname === '/dashboard/track') return 'track-site';
    if (pathname === '/dashboard/links' || pathname?.startsWith('/dashboard/files/')) return 'my-links';
    if (pathname === '/dashboard/favorites') return 'favorites';
    if (pathname?.startsWith('/dashboard/contacts')) return 'contacts';
    if (pathname === '/dashboard/domains') return 'domains';
    if (pathname === '/dashboard/tags') return 'tags';
    if (pathname === '/dashboard/settings') return 'settings';
    return 'overview';
  };

  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex h-screen w-full bg-white">
      <DashboardSidebar
        activePage={getActivePage()}
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
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          currentPage={getCurrentPageKey()}
        />

        <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: { name?: string; full_name?: string } } | null>(null);
  const [usageData, setUsageData] = useState<{
    tier: string;
    usage: { activeLinks: number; viewsThisMonth: number; storageUsed: number };
    limits: { activeLinks: number; viewsPerMonth: number; storageBytes: number };
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
      } else {
        setAuthenticated(true);
        setUser(session.user);

        try {
          const usageRes = await fetch('/api/usage');
          if (usageRes.ok) {
            const usage = await usageRes.json();
            setUsageData(usage);
          }
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

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

  if (!authenticated) {
    return null;
  }

  return (
    <TimezoneProvider>
      <PeriodFilterProvider>
        <DashboardLayoutInner
          user={user}
          usageData={usageData}
          onSignOut={handleSignOut}
        >
          {children}
        </DashboardLayoutInner>
      </PeriodFilterProvider>
    </TimezoneProvider>
  );
}
