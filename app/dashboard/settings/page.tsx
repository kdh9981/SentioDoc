'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-auth';
import SettingsPage from '@/components/dashboard/SettingsPage';

export default function SettingsRoutePage() {
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; user_metadata?: { name?: string; full_name?: string; company?: string } } | null>(null);
  const [usageData, setUsageData] = useState<{ tier: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        const res = await fetch('/api/usage');
        if (res.ok) {
          const data = await res.json();
          setUsageData(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase.auth]);

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

  return (
    <SettingsPage
      settings={userSettings}
      onSave={async (settings) => {
        console.log('Save settings:', settings);
      }}
      onUpgrade={() => {
        console.log('Open upgrade modal');
      }}
    />
  );
}
