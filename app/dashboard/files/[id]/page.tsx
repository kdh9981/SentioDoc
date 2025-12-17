'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase-auth';
import {
  FileDetailStats,
  getFileTypeCategory,
  FileInsights,
  FileActions,
  AnalyticsTab,
  ViewersTab,
} from '@/components/dashboard/file-detail';
import {
  AccessLog,
  calculateAnalyticsSummary,
  getFileTypeIcon,
  formatRelativeTime,
  getPageAnalysis,
} from '@/lib/analytics/calculations';
// NEW: Use unified system instead of old insights/actions
import {
  generateUnifiedInsights,
  calculateInsightsSummary,
  SectionType,
} from '@/lib/analytics/unified-insights';
import { generateUnifiedActions, ActionSectionType } from '@/lib/analytics/unified-actions';
import PeriodSelector from '@/components/dashboard/PeriodSelector';
import UpgradeModal from '@/components/dashboard/UpgradeModal';
import { usePeriodFilterContext, Tier } from '@/contexts/PeriodFilterContext';
import { LinkSettingsForm } from '@/components/dashboard/LinkSettingsForm';
import { LinkSettings } from '@/types';
import TagSelector, { Tag } from '@/components/ui/TagSelector';
import TagBadge from '@/components/ui/TagBadge';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';

type TabType = 'analytics' | 'viewers' | 'settings';

interface FileData {
  id: string;
  user_email: string;
  name?: string;
  original_filename: string;
  title?: string;
  mime_type?: string;
  file_size: number;
  path?: string;
  slug?: string;
  custom_slug?: string;
  type: 'file' | 'url';
  external_url?: string;
  total_pages?: number;
  video_duration_seconds?: number;
  is_favorite: boolean;
  notes?: string;
  require_name: boolean;
  require_email: boolean;
  allow_download: boolean;
  allow_print: boolean;
  password_hash?: string;
  expires_at?: string;
  utm_enabled?: boolean;
  cached_total_views?: number;
  cached_qr_scans?: number;
  created_at: string;
  updated_at?: string;
}

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get initial tab from URL query parameter
  const initialTab = (searchParams.get('tab') as TabType) || 'analytics';

  const [file, setFile] = useState<FileData | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [pageLabels, setPageLabels] = useState<{ page: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [fileTags, setFileTags] = useState<Tag[]>([]);

  // Period filter state
  const [userTier, setUserTier] = useState<Tier>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeRequiredTier, setUpgradeRequiredTier] = useState<Tier>('starter');

  const periodFilter = usePeriodFilterContext();

  // Settings state
  const [settings, setSettings] = useState({
    title: '',
    require_email: false,
    require_name: false,
    allow_download: true,
    allow_print: false,
    password: '',
    expires_at: '',
    notes: '',
    og_title: '',
    og_description: '',
    og_image_type: 'default' as 'default' | 'custom' | 'logo',
    og_image_url: '',
    utm_enabled: false,
  });

  // Track LinkSettingsForm changes
  const [formSettings, setFormSettings] = useState<LinkSettings | null>(null);
  const [formIsValid, setFormIsValid] = useState(true);

  // Handle settings change from LinkSettingsForm
  const handleFormSettingsChange = (newSettings: LinkSettings, isValid: boolean) => {
    setFormSettings(newSettings);
    setFormIsValid(isValid);
  };

  const fileId = params?.id as string;

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

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      // Fetch file
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;
      setFile(fileData);
      setSettings({
        title: fileData.title || '',
        require_email: fileData.require_email || false,
        require_name: fileData.require_name || false,
        allow_download: fileData.allow_download !== false,
        allow_print: fileData.allow_print || false,
        password: '',
        expires_at: fileData.expires_at || '',
        notes: fileData.notes || '',
        og_title: fileData.og_title || '',
        og_description: fileData.og_description || '',
        og_image_type: fileData.og_image_type || 'default',
        og_image_url: fileData.og_image_url || '',
        utm_enabled: fileData.utm_enabled || false,
      });

      // Get date range from period filter
      const { startDate, endDate } = periodFilter.getApiParams();

      // Fetch access logs with date filter
      const { data: logsData, error: logsError } = await supabase
        .from('access_logs')
        .select('*')
        .eq('file_id', fileId)
        .gte('accessed_at', startDate)
        .lte('accessed_at', endDate)
        .order('accessed_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Fetch page labels
      const { data: labelsData } = await supabase
        .from('page_labels')
        .select('page_number, label')
        .eq('file_id', fileId)
        .order('page_number', { ascending: true });

      // Map page_number to page for unified format
      setPageLabels((labelsData || []).map(pl => ({ page: pl.page_number, label: pl.label })));

      // Fetch file tags
      const tagsRes = await fetch(`/api/files/${fileId}/tags`);
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setFileTags(tagsData.tags || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fileId, supabase, periodFilter.effectiveRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate analytics using OLD summary for display stats
  const isTrackSite = file?.type === 'url';
  const summary = useMemo(() => file ? calculateAnalyticsSummary(logs, isTrackSite, file?.total_pages) : null, [logs, file, isTrackSite]);

  // Determine file type category for unified system
  const fileTypeCategory = useMemo(() => {
    return getFileTypeCategory(file?.mime_type, file?.type);
  }, [file]);

  // Map file type to section type for unified system
  const sectionType = useMemo((): SectionType => {
    if (file?.type === 'url') return 'file-url';
    switch (fileTypeCategory) {
      case 'document': return 'file-doc';
      case 'media': return 'file-media';
      case 'image': return 'file-image';
      default: return 'file-other';
    }
  }, [file?.type, fileTypeCategory]);

  // Calculate insights summary for unified system
  const insightsSummary = useMemo(() => {
    if (!logs || logs.length === 0) return null;
    return calculateInsightsSummary(logs, {
      totalPages: file?.total_pages,
      isExternalUrl: file?.type === 'url',
    });
  }, [logs, file]);

  // Calculate unique viewers count (aggregate by email or IP)
  const uniqueViewersCount = useMemo(() => {
    const uniqueIdentifiers = new Set<string>();
    logs.forEach(log => {
      const identifier = log.viewer_email || log.ip_address || `${log.id}`;
      uniqueIdentifiers.add(identifier);
    });
    return uniqueIdentifiers.size;
  }, [logs]);

  // Generate UNIFIED insights (independent, not copied to actions)
  const insights = useMemo(() => {
    if (!insightsSummary) return [];
    return generateUnifiedInsights(logs, insightsSummary, sectionType, 8);
  }, [logs, insightsSummary, sectionType]);

  // Generate UNIFIED actions (independent, NOT derived from insights)
  const actions = useMemo(() => {
    if (!insightsSummary) return [];
    const actionSection = sectionType as ActionSectionType;
    return generateUnifiedActions(insightsSummary, actionSection);
  }, [insightsSummary, sectionType]);

  // Page analysis for document analytics
  const pageAnalysis = useMemo(() => {
    if (!file?.total_pages || file.total_pages <= 1) return null;
    const labelsMap: Record<number, string> = {};
    pageLabels.forEach(pl => { labelsMap[pl.page] = pl.label; });
    return getPageAnalysis(logs, file.total_pages, labelsMap);
  }, [logs, file, pageLabels]);

  // Determine file type
  const isDocument = useMemo(() => {
    if (!file?.mime_type) return false;
    const mt = file.mime_type.toLowerCase();
    return mt.includes('pdf') || mt.includes('document') || mt.includes('presentation');
  }, [file]);

  const isVideo = useMemo(() => {
    if (!file?.mime_type) return false;
    return file.mime_type.toLowerCase().includes('video');
  }, [file]);

  // ALL Track Sites are external redirects - no video embedding
  const isConfirmedExternalRedirect = useMemo(() => {
    return file?.type === 'url';
  }, [file?.type]);

  // Calculate media-specific stats (for both 'media' type and 'url' type with play data)
  const mediaStats = useMemo(() => {
    // Debug logging
    console.log('[mediaStats] fileTypeCategory:', fileTypeCategory);
    console.log('[mediaStats] Sample log watch_time:', logs[0]?.watch_time_seconds);

    // Only calculate for media files OR url files (which might embed videos)
    if (fileTypeCategory !== 'media' && fileTypeCategory !== 'url') {
      return { avgPlayTime: 0, avgCompletion: 0, finishedCount: 0 };
    }

    const mediaLogs = logs.filter(l => l.watch_time_seconds !== undefined || l.video_completion_percent !== undefined);
    if (mediaLogs.length === 0) return { avgPlayTime: 0, avgCompletion: 0, finishedCount: 0 };

    const avgPlayTime = Math.round(
      mediaLogs.reduce((sum, l) => sum + (l.watch_time_seconds || 0), 0) / mediaLogs.length
    );
    const avgCompletion = Math.round(
      mediaLogs.reduce((sum, l) => sum + (l.video_completion_percent || 0), 0) / mediaLogs.length
    );
    const finishedCount = mediaLogs.filter(l =>
      l.video_completion_percent && l.video_completion_percent >= 95
    ).length;

    return { avgPlayTime, avgCompletion, finishedCount };
  }, [logs, fileTypeCategory]);

  // Get share URL
  const getShareUrl = () => {
    if (!file) return '';
    return file.slug
      ? `${window.location.origin}/s/${file.slug}`
      : `${window.location.origin}/view/${file.id}`;
  };

  // Copy link
  const copyLink = async () => {
    if (!file) return;
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show QR Code
  const showQR = async () => {
    const url = getShareUrl();
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    setQRCodeDataUrl(dataUrl);
    setShowQRModal(true);
  };

  // Copy QR Image
  const copyQRImage = async () => {
    try {
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR:', err);
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!file) return;
    const { error } = await supabase
      .from('files')
      .update({ is_favorite: !file.is_favorite })
      .eq('id', file.id);

    if (!error) {
      setFile({ ...file, is_favorite: !file.is_favorite });
    }
  };

  // Save settings
  const saveSettings = async () => {
    if (!file) return;
    setSaving(true);
    setSaved(false);

    try {
      // Use formSettings from LinkSettingsForm if available, otherwise use legacy settings
      const settingsToSave = formSettings || settings;

      const updates: Record<string, unknown> = {
        require_email: settingsToSave.require_email ?? false,
        require_name: settingsToSave.require_name ?? false,
        allow_download: settingsToSave.allow_download ?? true,
        allow_print: settings.allow_print ?? false,
        expires_at: settingsToSave.expiration_date ? new Date(settingsToSave.expiration_date).toISOString() : null,
        notes: settingsToSave.notes || null,
        og_title: settingsToSave.og_title || null,
        og_description: settingsToSave.og_description || null,
        og_image_type: settingsToSave.og_image_type || 'default',
        og_image_url: settingsToSave.og_image_url || null,
        utm_enabled: settingsToSave.utm_enabled ?? false,
      };

      // Handle password: save new password OR clear if disabled
      if (settingsToSave.password && settingsToSave.password !== '********') {
        // New password entered
        updates.password_hash = settingsToSave.password;
      } else if (!settingsToSave.password || settingsToSave.password === '') {
        // Password protection disabled - clear the hash
        updates.password_hash = null;
      }
      // If password is '********', keep existing (don't update)

      const { data: updatedFile, error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', file.id)
        .select()
        .single();

      if (error) throw error;

      // Update local file state with returned data
      setFile(prev => prev ? { ...prev, ...updatedFile } : prev);

      // Update local settings state
      setSettings(prev => ({
        ...prev,
        require_email: updatedFile.require_email ?? false,
        require_name: updatedFile.require_name ?? false,
        allow_download: updatedFile.allow_download ?? true,
        allow_print: updatedFile.allow_print ?? false,
        expires_at: updatedFile.expires_at || '',
        notes: updatedFile.notes || '',
        og_title: updatedFile.og_title || '',
        og_description: updatedFile.og_description || '',
        og_image_type: updatedFile.og_image_type || 'default',
        og_image_url: updatedFile.og_image_url || '',
        utm_enabled: updatedFile.utm_enabled ?? false,
      }));

      // Show success feedback
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete file
  const deleteFile = async () => {
    if (!file) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      router.push('/dashboard/links');
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
      setIsDeleting(false);
    }
  };

  // Format created date
  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get file type label
  const getFileTypeLabel = () => {
    if (!file?.mime_type) return 'File';
    const mt = file.mime_type.toLowerCase();
    if (mt.includes('pdf')) return 'PDF';
    if (mt.includes('presentation') || mt.includes('ppt')) return 'Presentation';
    if (mt.includes('document') || mt.includes('doc') || mt.includes('word')) return 'Document';
    if (mt.includes('sheet') || mt.includes('xls')) return 'Spreadsheet';
    if (mt.includes('image')) return 'Image';
    if (mt.includes('video')) return 'Video';
    if (mt.includes('audio')) return 'Audio';
    return 'File';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="text-6xl">📄</span>
          <p className="text-slate-600 mb-4 mt-4">File not found</p>
          <Link href="/dashboard/links" className="text-blue-600 hover:underline">
            ← Back to my links
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = getShareUrl();

  return (
    <>
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Back Link */}
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            ← Back to my links
          </Link>

          {/* Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* File Type Badge */}
              <div className="flex flex-col items-center">
                <span className="text-3xl">{getFileTypeIcon(file.mime_type, file.type)}</span>
                <span className="text-xs font-medium text-slate-500 mt-1">
                  {file.type === 'url' ? 'URL' : (file.mime_type?.split('/')[1]?.toUpperCase().slice(0, 4) || 'FILE')}
                </span>
              </div>
              <div>
                {/* File/URL Name */}
                <h1 className="text-xl font-semibold text-slate-900">
                  {file.title || file.original_filename || file.name}
                </h1>
                {/* Slug */}
                <p className="text-sm text-blue-600 font-mono mt-0.5">
                  /{file.custom_slug || file.slug}
                </p>
                {/* Meta info */}
                <p className="text-sm text-slate-500 mt-1">
                  Created {formatCreatedDate(file.created_at)} • {getFileTypeLabel()}
                  {file.total_pages && ` • ${file.total_pages} pages`}
                  {summary?.lastViewAt && ` • Last view: ${formatRelativeTime(summary.lastViewAt)}`}
                </p>
                {/* Tags Display */}
                {fileTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fileTags.map(tag => (
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

{/* Action buttons moved to URL section */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Share URL with Action Buttons */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Share URL
            </div>

            <div className="flex-1 bg-white rounded-lg border border-slate-200 px-4 py-2.5">
              <span className="text-slate-700 text-sm font-mono">{shareUrl}</span>
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
              {/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-md transition-colors ${
                  file.is_favorite
                    ? 'text-yellow-500 bg-yellow-50'
                    : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
                title={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="w-5 h-5" fill={file.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>

              {/* Copy Button */}
              <button
                onClick={copyLink}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Copy link"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              {/* QR Code Button */}
              <button
                onClick={showQR}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium"
                title="Show QR code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Tag Selector */}
            <TagSelector
              entityType="link"
              entityId={fileId}
              appliedTags={fileTags}
              onTagsChange={setFileTags}
            />
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
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

        {/* Quick Stats */}
        {summary && (
          <FileDetailStats
            summary={summary}
            fileType={fileTypeCategory}
            isExternalRedirect={isConfirmedExternalRedirect}
            avgPlayTime={mediaStats.avgPlayTime}
            avgCompletion={mediaStats.avgCompletion}
            finishedCount={mediaStats.finishedCount}
          />
        )}

        {/* Insights & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FileInsights insights={insights} />
          <FileActions actions={actions} />
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="flex items-center gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={'px-4 py-3 font-medium text-sm border-b-2 ' + (
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('viewers')}
              className={'px-4 py-3 font-medium text-sm border-b-2 ' + (
                activeTab === 'viewers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              👥 Viewers ({uniqueViewersCount})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={'px-4 py-3 font-medium text-sm border-b-2 ' + (
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'analytics' && summary && (
              <AnalyticsTab
                logs={logs}
                summary={summary}
                totalPages={file.total_pages || 0}
                pageLabels={pageLabels.reduce((acc, pl) => ({ ...acc, [pl.page]: pl.label }), {} as Record<number, string>)}
                isDocument={isDocument}
                isExternalRedirect={isConfirmedExternalRedirect}
                fileType={fileTypeCategory}
                videoDuration={file.video_duration_seconds}
                isTrackSite={isTrackSite}
                fileId={fileId}
              />
            )}

            {activeTab === 'viewers' && (
              <ViewersTab
                logs={logs}
                totalPages={file.total_pages}
                isTrackSite={file.type === 'url'}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">⚙️ Link settings</h3>

                  {/* Save and Delete buttons - right aligned */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveSettings}
                      disabled={saving || !formIsValid}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg transition-all text-sm font-medium ${
                        saved
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                      title={!formIsValid ? 'Please fix form errors before saving' : ''}
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : saved ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved
                        </>
                      ) : (
                        <>💾 Save settings</>
                      )}
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <LinkSettingsForm
                    fileId={file.id}
                    fileSlug={file.slug || file.custom_slug}
                    fileType={file.type === 'url' ? 'track-site' : 'file'}
                    baseUrl={typeof window !== 'undefined' ? window.location.origin : 'https://linklens.tech'}
                    userTier={userTier as 'free' | 'starter' | 'pro'}
                    initialSettings={{
                      require_name: settings.require_name,
                      require_email: settings.require_email,
                      allow_download: settings.allow_download,
                      password: file.password_hash ? '********' : '',
                      expiration_date: settings.expires_at ? settings.expires_at.slice(0, 16) : '',
                      notes: settings.notes,
                      og_title: settings.og_title,
                      og_description: settings.og_description,
                      og_image_type: settings.og_image_type,
                      og_image_url: settings.og_image_url,
                      utm_enabled: settings.utm_enabled,
                    }}
                    onSettingsChange={handleFormSettingsChange}
                    isModal={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{file.title || file.original_filename}</h3>
              <p className="text-slate-600 text-sm mb-6">Scan to open link</p>
              {qrCodeDataUrl && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mb-6">
                  <img src={qrCodeDataUrl} alt="QR Code" width={200} height={200} />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={copyQRImage}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    qrCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {qrCopied ? '✓ Copied!' : '📋 Copy image'}
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeDataUrl;
                    link.download = `${file.custom_slug || file.id}-qrcode.png`;
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteFile}
        title="Delete link?"
        itemName={file?.title || file?.original_filename || file?.name}
        message="This action cannot be undone. All analytics data will be lost."
        isLoading={isDeleting}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={upgradeRequiredTier}
        onUpgrade={() => router.push('/dashboard/settings')}
        feature="analytics history"
      />
    </>
  );
}
