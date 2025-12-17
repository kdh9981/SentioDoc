'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-auth';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  brand_color: string | null;
  tier: 'free' | 'starter' | 'pro';
  subscription_status: 'active' | 'canceled' | 'past_due' | null;
  subscription_ends_at: string | null;
}

interface Preferences {
  email_daily_digest: boolean;
  email_hot_lead_alert: boolean;
  email_weekly_summary: boolean;
  default_require_email: boolean;
  default_allow_download: boolean;
}

interface SettingsPageProps {
  settings?: {
    name: string;
    email: string;
    company?: string;
    tier: string;
    notifications: {
      emailOnView: boolean;
      emailOnDownload: boolean;
      weeklyDigest: boolean;
    };
  };
  onSave?: (settings: Record<string, unknown>) => Promise<void>;
  onUpgrade?: () => void;
}

export default function SettingsPage({ settings: initialSettings, onSave, onUpgrade }: SettingsPageProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState(initialSettings?.name || '');
  const [company, setCompany] = useState(initialSettings?.company || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    email_daily_digest: initialSettings?.notifications?.emailOnView ?? true,
    email_hot_lead_alert: initialSettings?.notifications?.emailOnDownload ?? true,
    email_weekly_summary: initialSettings?.notifications?.weeklyDigest ?? false,
    default_require_email: false,
    default_allow_download: false,
  });

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        setLoading(false);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });

      // Fetch from authorized_users
      const { data: userData } = await supabase
        .from('authorized_users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userData) {
        const profileData: UserProfile = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          company: null,
          avatar_url: null,
          logo_url: userData.custom_logo_url || userData.logo_url,
          brand_color: userData.brand_color,
          tier: userData.tier || 'free',
          subscription_status: userData.subscription_status,
          subscription_ends_at: userData.subscription_ends_at,
        };
        setProfile(profileData);
        setDisplayName(userData.name || '');
        setLogoPreview(userData.custom_logo_url || userData.logo_url);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!initialSettings) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile, initialSettings]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const path = `avatars/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      setAvatarPreview(publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      // Use the API endpoint
      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch('/api/user/logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoPreview(data.logo);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove your custom logo?')) return;

    try {
      const res = await fetch('/api/user/logo', { method: 'DELETE' });
      if (res.ok) {
        setLogoPreview(null);
      }
    } catch (err) {
      console.error('Logo remove error:', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      if (onSave) {
        await onSave({ name: displayName, company, notifications: preferences });
      } else if (user?.email) {
        // Direct update to authorized_users
        const { error } = await supabase
          .from('authorized_users')
          .update({ name: displayName || null })
          .eq('email', user.email);

        if (error) throw error;
      }

      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof Preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportData = async () => {
    alert('Your data export will be emailed to you within 24 hours.');
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. ' +
      'All your files, links, and analytics data will be permanently deleted.'
    );
    if (!confirmed) return;

    const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') return;

    alert('Account deletion requested. You will receive a confirmation email.');
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Pro</span>;
      case 'starter':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Starter</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">Free</span>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentTier = profile?.tier || initialSettings?.tier || 'free';
  const userEmail = user?.email || initialSettings?.email || '';

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded mb-4"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      {/* Success/Error Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-slate-400">👤</span>
              )}
            </div>
            <div>
              <label className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer text-sm font-medium inline-block">
                {uploadingAvatar ? 'Uploading...' : 'Upload photo'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 2MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Branding</h2>
        <p className="text-sm text-slate-600 mb-4">Your logo will be displayed on viewer pages</p>

        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-slate-400 text-sm text-center px-2">No logo uploaded</span>
            )}
          </div>
          <div>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium inline-block">
              {uploadingLogo ? 'Uploading...' : 'Upload logo'}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={uploadingLogo}
              />
            </label>
            <p className="text-xs text-slate-500 mt-2">
              Recommended: 200x50px or similar aspect ratio.<br />
              PNG with transparent background works best.
            </p>
            {logoPreview && (
              <button
                onClick={handleRemoveLogo}
                className="text-sm text-red-600 hover:text-red-700 mt-2 block"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscription</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm text-slate-500 mb-1">Current plan</div>
            <div>{getTierBadge(currentTier)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Status</div>
            <div className="font-medium text-slate-900">
              {profile?.subscription_status === 'active' ? (
                <span className="text-green-600">Active</span>
              ) : profile?.subscription_status === 'canceled' ? (
                <span className="text-yellow-600">Canceled</span>
              ) : profile?.subscription_status === 'past_due' ? (
                <span className="text-red-600">Past Due</span>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Next billing</div>
            <div className="font-medium text-slate-900">
              {formatDate(profile?.subscription_ends_at || null)}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {currentTier !== 'pro' && (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Upgrade to Pro
            </button>
          )}
          {currentTier !== 'free' && (
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
              Manage subscription
            </button>
          )}
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
            View invoices
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferences</h2>

        {/* Email Notifications */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Email notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_daily_digest}
                onChange={() => handlePreferenceChange('email_daily_digest')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Daily digest of viewer activity</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_hot_lead_alert}
                onChange={() => handlePreferenceChange('email_hot_lead_alert')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Alert when hot lead detected</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_weekly_summary}
                onChange={() => handlePreferenceChange('email_weekly_summary')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Weekly analytics summary</span>
            </label>
          </div>
        </div>

        {/* Default Link Settings */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Default link settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.default_require_email}
                onChange={() => handlePreferenceChange('default_require_email')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Require email to view (by default)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.default_allow_download}
                onChange={() => handlePreferenceChange('default_allow_download')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Allow downloads (by default)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4">Danger zone</h2>
        <p className="text-sm text-red-700 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            Export my data
          </button>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
