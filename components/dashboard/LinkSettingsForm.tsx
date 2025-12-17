'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { UTM_LIMITS, UTM_PLATFORMS, UserTier } from '@/types';

// Types
interface UTMTemplate {
  id: string;
  name: string;
  utm_source: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface LinkSettingsState {
  require_name: boolean;
  require_email: boolean;
  allow_download: boolean;
  password: string;
  expiration_date: string;
  notes: string;
  og_title: string;
  og_description: string;
  og_image_type: 'default' | 'custom' | 'logo';
  og_image_url: string;
  utm_enabled?: boolean;
}

interface LinkSettingsFormProps {
  fileId?: string;
  fileSlug?: string;
  fileType: 'file' | 'track-site';
  baseUrl: string;
  initialSettings?: Partial<LinkSettingsState>;
  userTier: UserTier;
  companyLogo?: string;
  onSettingsChange?: (settings: LinkSettingsState, isValid: boolean) => void;
  isModal?: boolean;
}

export function LinkSettingsForm({
  fileId,
  fileSlug,
  fileType,
  baseUrl,
  initialSettings,
  userTier,
  companyLogo,
  onSettingsChange,
  isModal = false
}: LinkSettingsFormProps) {
  const [settings, setSettings] = useState<LinkSettingsState>({
    require_name: initialSettings?.require_name || false,
    require_email: initialSettings?.require_email || false,
    allow_download: initialSettings?.allow_download ?? true,
    password: initialSettings?.password || '',
    expiration_date: initialSettings?.expiration_date
      ? new Date(initialSettings.expiration_date).toISOString().slice(0, 16)
      : '',
    notes: initialSettings?.notes || '',
    og_title: initialSettings?.og_title || '',
    og_description: initialSettings?.og_description || '',
    og_image_type: initialSettings?.og_image_type || 'default',
    og_image_url: initialSettings?.og_image_url || '',
    utm_enabled: initialSettings?.utm_enabled || false,
  });

  const [utmEnabled, setUtmEnabled] = useState(initialSettings?.utm_enabled || false);
  const [utmMode, setUtmMode] = useState<'quick' | 'custom'>('quick');
  const [utmTemplates, setUtmTemplates] = useState<UTMTemplate[]>([]);
  const [utmLoading, setUtmLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; template: UTMTemplate | null }>({
    isOpen: false,
    template: null,
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [quickCampaign, setQuickCampaign] = useState('');

  const [customUtm, setCustomUtm] = useState({
    name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [passwordEnabled, setPasswordEnabled] = useState(
    !!(initialSettings?.password && initialSettings.password.length > 0)
  );
  const [confirmPassword, setConfirmPassword] = useState(initialSettings?.password || '');
  const [passwordError, setPasswordError] = useState('');
  const [ogImageDimensions, setOgImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [ogImageLoading, setOgImageLoading] = useState(false);
  const [ogImageError, setOgImageError] = useState(false);
  const [expirationEnabled, setExpirationEnabled] = useState(
    initialSettings?.expiration_date ? initialSettings.expiration_date.length > 0 : false
  );

  const utmLimit = UTM_LIMITS[userTier];
  const canCustomizePreview = userTier !== 'free';

  // Detect OG image dimensions
  useEffect(() => {
    if (settings.og_image_type === 'custom' && settings.og_image_url) {
      setOgImageLoading(true);
      setOgImageError(false);
      setOgImageDimensions(null);

      const img = new Image();
      img.onload = () => {
        setOgImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setOgImageLoading(false);
      };
      img.onerror = () => {
        setOgImageError(true);
        setOgImageLoading(false);
        setOgImageDimensions(null);
      };
      img.src = settings.og_image_url;
    } else {
      setOgImageDimensions(null);
      setOgImageError(false);
    }
  }, [settings.og_image_url, settings.og_image_type]);

  // Calculate ratio info
  const getImageRatioInfo = () => {
    if (!ogImageDimensions) return null;
    const { width, height } = ogImageDimensions;
    const ratio = width / height;
    const recommendedRatio = 1.91; // 1200/630
    const ratioDiff = Math.abs(ratio - recommendedRatio);
    const isOptimal = ratioDiff < 0.1;
    const isAcceptable = ratioDiff < 0.3;

    return {
      width,
      height,
      ratio: ratio.toFixed(2),
      isOptimal,
      isAcceptable,
      status: isOptimal ? 'optimal' : isAcceptable ? 'acceptable' : 'warning'
    };
  };

  const imageRatioInfo = getImageRatioInfo();

  useEffect(() => {
    if (fileId) {
      fetchUtmTemplates();
    }
  }, [fileId]);

  // Validate form
  const isFormValid = (): boolean => {
    if (passwordEnabled && settings.password) {
      if (settings.password !== confirmPassword) return false;
      if (settings.password.length < 4) return false;
    }
    return true;
  };

  useEffect(() => {
    onSettingsChange?.({ ...settings, utm_enabled: utmEnabled }, isFormValid());
  }, [settings, confirmPassword, passwordEnabled, utmEnabled]);

  const fetchUtmTemplates = async () => {
    if (!fileId) return;
    setUtmLoading(true);
    try {
      const res = await fetch(`/api/utm-templates?file_id=${fileId}`);
      const data = await res.json();
      if (data.templates) {
        setUtmTemplates(data.templates);
        // Don't auto-enable - use saved state from initialSettings
      }
    } catch (error) {
      console.error('Failed to fetch UTM templates:', error);
    } finally {
      setUtmLoading(false);
    }
  };

  const handleSettingChange = (key: keyof LinkSettingsState, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const generateUtmUrl = (template: { utm_source: string; utm_medium?: string | null; utm_campaign?: string | null }) => {
    const params = new URLSearchParams();
    if (template.utm_source) params.set('utm_source', template.utm_source);
    if (template.utm_medium) params.set('utm_medium', template.utm_medium);
    if (template.utm_campaign) params.set('utm_campaign', template.utm_campaign);

    const baseLink = `${baseUrl}/${fileSlug || 'your-link'}`;
    return `${baseLink}?${params.toString()}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickSetupSave = async () => {
    if (!fileId || selectedPlatforms.length === 0) return;

    for (const platformId of selectedPlatforms) {
      const platform = UTM_PLATFORMS.find(p => p.id === platformId);
      if (!platform) continue;

      if (utmTemplates.some(t => t.name.toLowerCase() === platform.name.toLowerCase())) {
        continue;
      }

      try {
        const res = await fetch('/api/utm-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: fileId,
            name: platform.name,
            utm_source: platform.utm_source,
            utm_medium: platform.utm_medium,
            utm_campaign: quickCampaign || null
          })
        });

        if (res.ok) {
          const data = await res.json();
          setUtmTemplates(prev => [...prev, data.template]);
        }
      } catch (error) {
        console.error('Failed to save UTM template:', error);
      }
    }

    setSelectedPlatforms([]);
    setQuickCampaign('');
  };

  const handleCustomUtmSave = async () => {
    if (!fileId || !customUtm.name || !customUtm.utm_source) return;

    try {
      const res = await fetch('/api/utm-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          ...customUtm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUtmTemplates(prev => [...prev, data.template]);
        setCustomUtm({
          name: '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_content: '',
          utm_term: ''
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save custom UTM:', error);
    }
  };

  const handleDeleteTemplateClick = (template: UTMTemplate) => {
    setDeleteConfirm({ isOpen: true, template });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.template) return;

    try {
      const res = await fetch(`/api/utm-templates?id=${deleteConfirm.template.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUtmTemplates(prev => prev.filter(t => t.id !== deleteConfirm.template!.id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, template: null });
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className={`space-y-6 ${isModal ? '' : 'bg-white rounded-xl border border-slate-200 p-6'}`}>

      {/* SECTION 1: Viewer settings & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Viewer settings */}
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-4">Viewer settings</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">👤</span>
                <span className="text-sm text-slate-700">Require name</span>
              </div>
              <ToggleSwitch
                checked={settings.require_name}
                onChange={(checked) => handleSettingChange('require_name', checked)}
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📧</span>
                <span className="text-sm text-slate-700">Require email</span>
              </div>
              <ToggleSwitch
                checked={settings.require_email}
                onChange={(checked) => handleSettingChange('require_email', checked)}
              />
            </label>

            {fileType === 'file' && (
              <label className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">⬇️</span>
                  <span className="text-sm text-slate-700">Allow download</span>
                </div>
                <ToggleSwitch
                  checked={settings.allow_download}
                  onChange={(checked) => handleSettingChange('allow_download', checked)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Security */}
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-4">Security</h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">🔒</span>
                <span className="text-sm text-slate-700">Password protection</span>
              </div>
              <ToggleSwitch
                checked={passwordEnabled}
                onChange={(checked) => {
                  setPasswordEnabled(checked);
                  if (!checked) {
                    handleSettingChange('password', '');
                    setConfirmPassword('');
                    setPasswordError('');
                  }
                }}
              />
            </label>
            {passwordEnabled && (
              <div className="space-y-2 mt-2">
                <input
                  type="password"
                  placeholder="Set password"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordError ? 'border-red-300' : 'border-slate-200'
                  }`}
                  value={settings.password}
                  onChange={(e) => {
                    handleSettingChange('password', e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordError ? 'border-red-300' : 'border-slate-200'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (e.target.value && settings.password !== e.target.value) {
                      setPasswordError('Passwords do not match');
                    } else {
                      setPasswordError('');
                    }
                  }}
                />
                {passwordError && (
                  <p className="text-xs text-red-500">{passwordError}</p>
                )}
                {settings.password && settings.password.length > 0 && settings.password.length < 4 && (
                  <p className="text-xs text-amber-500">Password should be at least 4 characters</p>
                )}
              </div>
            )}

            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📅</span>
                <span className="text-sm text-slate-700">Expiration date</span>
              </div>
              <ToggleSwitch
                checked={expirationEnabled}
                onChange={(checked) => {
                  setExpirationEnabled(checked);
                  if (!checked) handleSettingChange('expiration_date', '');
                }}
              />
            </label>
            {expirationEnabled && (
              <input
                type="datetime-local"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.expiration_date}
                onChange={(e) => handleSettingChange('expiration_date', e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* SECTION 2: Link preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">🖼️</span>
            <h4 className="text-sm font-medium text-slate-900">Link preview</h4>
            <InfoTooltip content="Customize how your link appears when shared on social media, Slack, email, etc." />
          </div>
          {canCustomizePreview && (
            <ToggleSwitch
              checked={previewEnabled}
              onChange={setPreviewEnabled}
            />
          )}
        </div>

        {!canCustomizePreview ? (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Preview when shared:</p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Branded Preview Image */}
                <div className="h-40 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <img
                      src="/logo-icon.png"
                      alt="LinkLens"
                      className="w-16 h-16 mx-auto mb-2 object-contain"
                    />
                    <p className="text-slate-800 font-semibold text-lg">LinkLens</p>
                  </div>
                </div>
                {/* Preview Text */}
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900 truncate">{fileSlug || 'your-file-name'}</p>
                  <p className="text-xs text-slate-500">Powered by LinkLens</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>🔒</span>
                <span className="text-sm font-medium text-blue-900">Want to customize?</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Upgrade to Starter to upload custom images, add your company logo, and set custom titles.
              </p>
              <a href="/pricing" className="inline-block px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                Upgrade - $9/mo
              </a>
            </div>
          </div>
        ) : previewEnabled ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Preview image</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="og_image_type"
                    value="custom"
                    checked={settings.og_image_type === 'custom'}
                    onChange={() => handleSettingChange('og_image_type', 'custom')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-sm text-slate-700">Upload custom image</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="og_image_type"
                    value="logo"
                    checked={settings.og_image_type === 'logo'}
                    onChange={() => handleSettingChange('og_image_type', 'logo')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-sm text-slate-700">Use my company logo</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="og_image_type"
                    value="default"
                    checked={settings.og_image_type === 'default'}
                    onChange={() => handleSettingChange('og_image_type', 'default')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-sm text-slate-700">Use LinkLens default</span>
                </label>
              </div>

              {settings.og_image_type === 'custom' && (
                <div className="mt-3 space-y-3">
                  <input
                    type="url"
                    placeholder="Image URL"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={settings.og_image_url}
                    onChange={(e) => handleSettingChange('og_image_url', e.target.value)}
                  />

                  {/* Recommended size guidance */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">💡</span>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Recommended: 1200 × 630 pixels (1.91:1 ratio)</p>
                        <p className="text-blue-600">Works best on Facebook, LinkedIn, Twitter, Slack, WhatsApp, Discord</p>
                      </div>
                    </div>
                  </div>

                  {/* Loading state */}
                  {ogImageLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                      <span>Detecting image dimensions...</span>
                    </div>
                  )}

                  {/* Error state */}
                  {ogImageError && settings.og_image_url && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span>⚠️</span>
                        <div className="text-xs text-red-700">
                          <p className="font-medium">Could not load image</p>
                          <p>Please check the URL is correct and publicly accessible</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image dimensions feedback */}
                  {imageRatioInfo && !ogImageLoading && !ogImageError && (
                    <div className={`p-3 rounded-lg border ${
                      imageRatioInfo.status === 'optimal'
                        ? 'bg-green-50 border-green-100'
                        : imageRatioInfo.status === 'acceptable'
                        ? 'bg-yellow-50 border-yellow-100'
                        : 'bg-orange-50 border-orange-100'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span>{imageRatioInfo.status === 'optimal' ? '✅' : imageRatioInfo.status === 'acceptable' ? '🟡' : '⚠️'}</span>
                        <div className="text-xs">
                          <p className={`font-medium ${
                            imageRatioInfo.status === 'optimal'
                              ? 'text-green-800'
                              : imageRatioInfo.status === 'acceptable'
                              ? 'text-yellow-800'
                              : 'text-orange-800'
                          }`}>
                            Your image: {imageRatioInfo.width} × {imageRatioInfo.height} ({imageRatioInfo.ratio}:1 ratio)
                          </p>
                          <p className={`${
                            imageRatioInfo.status === 'optimal'
                              ? 'text-green-600'
                              : imageRatioInfo.status === 'acceptable'
                              ? 'text-yellow-600'
                              : 'text-orange-600'
                          }`}>
                            {imageRatioInfo.status === 'optimal'
                              ? 'Perfect! This will display great on all platforms.'
                              : imageRatioInfo.status === 'acceptable'
                              ? 'Good enough, but may be slightly cropped on some platforms.'
                              : 'May be cropped significantly. Consider using 1200×630 for best results.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Title</label>
              <input
                type="text"
                placeholder="Custom title for preview"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.og_title}
                onChange={(e) => handleSettingChange('og_title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Description</label>
              <input
                type="text"
                placeholder="Custom description for preview"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.og_description}
                onChange={(e) => handleSettingChange('og_description', e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-2">Live preview:</p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-40 flex items-center justify-center overflow-hidden">
                  {settings.og_image_type === 'custom' && settings.og_image_url ? (
                    <img
                      src={settings.og_image_url}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : settings.og_image_type === 'logo' && companyLogo ? (
                    <div className="bg-slate-100 w-full h-full flex items-center justify-center">
                      <img src={companyLogo} alt="Company logo" className="h-20 object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center">
                        <img
                          src="/logo-icon.png"
                          alt="LinkLens"
                          className="w-14 h-14 mx-auto mb-2 object-contain"
                        />
                        <p className="text-slate-800 font-semibold">LinkLens</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {settings.og_title || fileSlug || 'Your title'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {settings.og_description || 'Your description'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Toggle on to customize how your link appears when shared.</p>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* SECTION 3: UTM tracking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">📊</span>
            <h4 className="text-sm font-medium text-slate-900">UTM tracking</h4>
            <InfoTooltip content="Create tracked links to measure which channels drive the most engagement." />
          </div>
          <ToggleSwitch
            checked={utmEnabled}
            onChange={setUtmEnabled}
          />
        </div>

        {utmEnabled && (
          <div className="space-y-4">
            {utmTemplates.length > 0 && (
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Your saved UTM links ({utmTemplates.length}/{utmLimit}):
                </p>
                <div className="space-y-2">
                  {utmTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{template.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {generateUtmUrl(template)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => copyToClipboard(generateUtmUrl(template), template.id)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          {copiedId === template.id ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span>📋</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplateClick(template)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete UTM link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {utmTemplates.length >= utmLimit ? (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>🔒</span>
                  <span className="text-sm font-medium text-amber-900">
                    UTM limit reached ({utmTemplates.length}/{utmLimit})
                  </span>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  {userTier === 'free' && 'Upgrade to Starter for 15 UTM links per file.'}
                  {userTier === 'starter' && 'Upgrade to Pro for 30 UTM links per file.'}
                  {userTier === 'pro' && 'Delete existing templates to add new ones.'}
                </p>
                {userTier !== 'pro' && (
                  <a href="/pricing" className="inline-block px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors">
                    Upgrade
                  </a>
                )}
              </div>
            ) : (
              <>
                {fileId && (
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setUtmMode('quick')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        utmMode === 'quick'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Quick setup
                    </button>
                    <button
                      onClick={() => setUtmMode('custom')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        utmMode === 'custom'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom UTM
                    </button>
                  </div>
                )}

                {utmMode === 'quick' && fileId && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Select platforms you&apos;ll share on:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {UTM_PLATFORMS.map((platform) => {
                        const alreadySaved = utmTemplates.some(
                          t => t.name.toLowerCase() === platform.name.toLowerCase()
                        );
                        return (
                          <button
                            key={platform.id}
                            onClick={() => !alreadySaved && togglePlatform(platform.id)}
                            disabled={alreadySaved}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                              alreadySaved
                                ? 'bg-green-50 border-green-200 text-green-600 cursor-not-allowed'
                                : selectedPlatforms.includes(platform.id)
                                ? 'bg-blue-50 border-blue-500 text-blue-600'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            <span className="text-xl">{platform.icon}</span>
                            <span className="text-xs">{platform.name}</span>
                            {alreadySaved && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedPlatforms.length > 0 && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">
                            Campaign name (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., q4_launch, investor_outreach"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={quickCampaign}
                            onChange={(e) => setQuickCampaign(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handleQuickSetupSave}
                          className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Save {selectedPlatforms.length} UTM link{selectedPlatforms.length > 1 ? 's' : ''}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {utmMode === 'custom' && fileId && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Build your custom tracked link:</p>

                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Name * <span className="text-slate-400">(for your reference)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Newsletter January"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customUtm.name}
                        onChange={(e) => setCustomUtm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Source * <span className="text-slate-400">(where traffic comes from)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., newsletter, google, partner_site"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customUtm.utm_source}
                        onChange={(e) => setCustomUtm(prev => ({ ...prev, utm_source: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Medium <span className="text-slate-400">(marketing medium)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., email, cpc, social, banner"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customUtm.utm_medium}
                        onChange={(e) => setCustomUtm(prev => ({ ...prev, utm_medium: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Campaign <span className="text-slate-400">(campaign name)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., spring_sale, product_launch"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={customUtm.utm_campaign}
                        onChange={(e) => setCustomUtm(prev => ({ ...prev, utm_campaign: e.target.value }))}
                      />
                    </div>

                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                    >
                      {showAdvanced ? '▲' : '▼'} Advanced options
                    </button>

                    {showAdvanced && (
                      <div className="space-y-4 pl-4 border-l-2 border-slate-100">
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">
                            Content <span className="text-slate-400">(differentiate ads)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., logo_link, text_link, banner_top"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={customUtm.utm_content}
                            onChange={(e) => setCustomUtm(prev => ({ ...prev, utm_content: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1">
                            Term <span className="text-slate-400">(paid keywords)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., running+shoes, saas+tools"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={customUtm.utm_term}
                            onChange={(e) => setCustomUtm(prev => ({ ...prev, utm_term: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    {customUtm.utm_source && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Preview:</p>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 break-all font-mono">
                            {generateUtmUrl({
                              utm_source: customUtm.utm_source,
                              utm_medium: customUtm.utm_medium,
                              utm_campaign: customUtm.utm_campaign
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCustomUtmSave}
                      disabled={!customUtm.name || !customUtm.utm_source}
                      className="w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      + Save UTM link
                    </button>
                  </div>
                )}

                {!fileId && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      UTM links can be created after saving your link. Create the link first, then add UTM tracking in settings.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, template: null })}
        onConfirm={handleConfirmDelete}
        title="Delete UTM link?"
        itemName={deleteConfirm.template?.name}
        message="This UTM tracking link will be permanently deleted."
      />
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-500' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
