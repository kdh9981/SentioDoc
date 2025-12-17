'use client';

import React, { useState, useEffect } from 'react';
import ToggleSwitch from './ui/ToggleSwitch';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface FileInfo {
  file?: File;
  url?: string;
  name: string;
}

interface LinkResult {
  fileId: string;
  slug: string;
  url: string;
}

interface Domain {
  id: string;
  domain: string;
  isDefault?: boolean;
}

interface LinkConfigModalProps {
  fileInfo: FileInfo;
  onComplete: (result: LinkResult) => void;
  onCancel: () => void;
}

export default function LinkConfigModal({
  fileInfo,
  onComplete,
  onCancel
}: LinkConfigModalProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('DEFAULT');
  const [userTier, setUserTier] = useState<string>('free');
  const [loadingDomains, setLoadingDomains] = useState(true);

  const [customSlug, setCustomSlug] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  // Access control - NO PRINT (removed)
  const [requireEmail, setRequireEmail] = useState(false);
  const [requireName, setRequireName] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);

  // Security
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Is this an external URL (no download option)
  const isExternalUrl = !!fileInfo.url;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/domains');
        if (response.ok) {
          const data = await response.json();
          setDomains(data.domains || []);
          setUserTier(data.tier || 'free');
        }
      } catch (err) {
        console.error('Failed to fetch domains:', err);
      } finally {
        setLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);

  useEffect(() => {
    const slug = fileInfo.name
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);
    setCustomSlug(slug);
  }, [fileInfo.name]);

  // Real-time password match validation
  useEffect(() => {
    if (!passwordEnabled) {
      setPasswordMatch(null);
      return;
    }
    if (!password && !confirmPassword) {
      setPasswordMatch(null);
      return;
    }
    if (confirmPassword.length > 0) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword, passwordEnabled]);

  useEffect(() => {
    if (!customSlug) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const response = await fetch('/api/validate-slug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: customSlug })
        });
        const data = await response.json();
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customSlug]);

  const handleCreate = async () => {
    if (!isAvailable) {
      setError('Please choose an available link name');
      return;
    }

    if (passwordEnabled && !password.trim()) {
      setError('Please enter a password or disable password protection');
      return;
    }

    if (passwordEnabled && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!fileInfo.file && !fileInfo.url) {
      setError('No file or URL provided. Please close and try again.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const formData = new FormData();

      if (fileInfo.file && fileInfo.file instanceof File) {
        formData.append('file', fileInfo.file, fileInfo.file.name);
      } else if (fileInfo.url) {
        formData.append('url', fileInfo.url);
        formData.append('name', fileInfo.name);
      }

      formData.append('slug', customSlug);

      if (selectedDomain && selectedDomain !== 'DEFAULT') {
        formData.append('customDomainId', selectedDomain);
      }

      formData.append('requireEmail', String(requireEmail));
      formData.append('requireName', String(requireName));
      // Only send allowDownload for files, not external URLs
      formData.append('allowDownload', isExternalUrl ? 'false' : String(allowDownload));
      formData.append('allowPrint', 'false'); // Always false now

      if (passwordEnabled && password) {
        formData.append('password', password);
      }
      if (expirationEnabled && expirationDate) {
        const localDate = new Date(expirationDate);
        formData.append('expiresAt', localDate.toISOString());
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onComplete({
        fileId: data.fileId,
        slug: data.slug || customSlug,
        url: `${baseUrl}/s/${data.slug || customSlug}`
      });

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setCreating(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-/, '');
    setCustomSlug(formatted);
  };

  const getDisplayDomain = () => {
    if (selectedDomain === 'DEFAULT') {
      return baseUrl.replace('http://', '').replace('https://', '');
    }
    const domain = domains.find(d => d.id === selectedDomain);
    return domain?.domain || baseUrl.replace('http://', '').replace('https://', '');
  };

  const previewUrl = `${baseUrl}/s/${customSlug}`;
  const canSelectDomain = userTier === 'pro' && domains.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">{isExternalUrl ? 'link' : 'upload_file'}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configure your link</h2>
              <p className="text-xs text-slate-600 truncate max-w-[400px]">{fileInfo.name}</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Domain Selector */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Domain
            </label>
            {canSelectDomain ? (
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 outline-none"
              >
                <option value="DEFAULT">{getDisplayDomain()} (Default)</option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>{d.domain}</option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm">
                {getDisplayDomain()} (Default)
              </div>
            )}
            {!canSelectDomain && (
              <p className="text-xs text-slate-500 mt-1">
                Upgrade to Pro to use custom domains
              </p>
            )}
          </div>

          {/* Link URL */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Link name
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 whitespace-nowrap">{getDisplayDomain()}/s/</span>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-link"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              {checking && <span className="text-xs text-slate-400">...</span>}
              {!checking && isAvailable === true && <span className="text-green-500 text-lg">✓</span>}
              {!checking && isAvailable === false && <span className="text-red-500 text-lg">✗</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Use lowercase letters, numbers, and hyphens
            </p>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Viewer Settings */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Viewer settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Require name</span>
                  <ToggleSwitch enabled={requireName} onChange={setRequireName} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Require email</span>
                  <ToggleSwitch enabled={requireEmail} onChange={setRequireEmail} />
                </div>
                {/* Only show Download toggle for files, not external URLs */}
                {!isExternalUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Allow download</span>
                    <ToggleSwitch enabled={allowDownload} onChange={setAllowDownload} />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Security */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Security</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">Password</span>
                    <ToggleSwitch enabled={passwordEnabled} onChange={(enabled) => {
                      setPasswordEnabled(enabled);
                      if (!enabled) {
                        setPassword('');
                        setConfirmPassword('');
                        setPasswordMatch(null);
                      }
                    }} />
                  </div>
                  {passwordEnabled && (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 outline-none"
                      />
                      <div className="relative">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className={`w-full px-3 py-2 pr-8 rounded-lg border bg-white text-slate-900 text-sm outline-none ${
                            passwordMatch === null
                              ? 'border-slate-200 focus:border-blue-500'
                              : passwordMatch
                              ? 'border-green-500 focus:border-green-500'
                              : 'border-red-500 focus:border-red-500'
                          }`}
                        />
                        {passwordMatch !== null && (
                          <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-lg ${
                            passwordMatch ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {passwordMatch ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                      {passwordMatch === false && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-700">Expiration</span>
                    <ToggleSwitch enabled={expirationEnabled} onChange={setExpirationEnabled} />
                  </div>
                  {expirationEnabled && (
                    <div>
                      <input
                        type="datetime-local"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:border-blue-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="material-symbols-outlined text-base">lightbulb</span>
            <span>Enable &quot;Require email&quot; to capture leads automatically.</span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 my-5" />

          {/* Link Preview Section */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🖼️</span>
              <span className="text-sm font-semibold text-slate-900">Link preview</span>
              <InfoTooltip content="Customize how your link appears when shared on social media, Slack, email, etc." />
            </div>

            {userTier === 'free' ? (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-3">Preview when shared:</p>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {/* Default LinkLens preview */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <img
                        src="/logo-icon.png"
                        alt="LinkLens"
                        className="w-12 h-12 mx-auto mb-1"
                      />
                      <p className="text-white font-medium text-sm">LinkLens</p>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{customSlug || 'your-file-name'}</p>
                    <p className="text-xs text-slate-500">Powered by LinkLens</p>
                  </div>
                </div>

                <div className="mt-3 bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🔒</span>
                    <span className="text-sm font-medium text-blue-900">Want to customize?</span>
                  </div>
                  <p className="text-xs text-blue-700 mb-2">
                    Upgrade to Starter to upload custom images, add your company logo, and set custom titles.
                  </p>
                  <a href="/pricing" className="inline-block px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
                    Upgrade - $9/mo
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-3">Preview when shared:</p>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <img
                        src="/logo-icon.png"
                        alt="LinkLens"
                        className="w-12 h-12 mx-auto mb-1"
                      />
                      <p className="text-white font-medium text-sm">LinkLens</p>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 truncate">{customSlug || 'your-file-name'}</p>
                    <p className="text-xs text-slate-500">Shared via LinkLens</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-slate-600">
                  <span className="text-lg">💡</span>
                  <p className="text-xs">
                    Customize the preview image, title, and description in link settings after creation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 my-5" />

          {/* UTM Tracking Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <span className="text-sm font-semibold text-slate-900">UTM tracking</span>
              <InfoTooltip content="Create tracked links to measure which channels drive the most engagement." />
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-lg">💡</span>
                <p className="text-sm">
                  UTM links can be created after saving your link. Create the link first, then add UTM tracking in settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0 rounded-b-2xl">
          <p className="text-xs text-slate-500 truncate max-w-[250px]">
            {previewUrl}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !isAvailable || (passwordEnabled && (!password.trim() || passwordMatch !== true))}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {creating ? 'Creating...' : 'Create link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
