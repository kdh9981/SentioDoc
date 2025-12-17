'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { Tooltip } from '@/components/ui/Tooltip';
import QRCode from 'qrcode';
import TimeFilter from '@/components/dashboard/TimeFilter';
import ViewsOverTimeChart from '@/components/analytics/ViewsOverTimeChart';
import TrafficSourcesChart from '@/components/analytics/TrafficSourcesChart';
import DeviceChart from '@/components/analytics/DeviceChart';
import CountryList from '@/components/analytics/CountryList';
import PageHeatmapChart from '@/components/analytics/PageHeatmapChart';
import DropOffAnalysisChart from '@/components/analytics/DropOffAnalysisChart';

interface Viewer {
  id: string;
  name: string;
  email: string;
  company?: string;
  avatar?: string;
  engagementScore: number;
  totalTime: string;
  pagesViewed: number;
  lastVisit: string;
  visits: number;
  downloaded: boolean;
  isReturnVisit?: boolean;
}

interface FileDetail {
  id: string;
  name: string;
  slug: string;
  type: 'file' | 'url';
  fileType?: string;
  size?: number;
  views: number;
  uniqueViewers: number;
  avgEngagement: number;
  downloads: number;
  createdAt: string;
  lastAccessed?: string;
  isActive: boolean;
  requireEmail: boolean;
  requireName: boolean;
  allowDownload: boolean;
  password?: string;
  expiresAt?: string;
  customSlug?: string;
  notes?: string;
  isFavorite?: boolean;
}

interface FileDetailPageProps {
  file: FileDetail;
  viewers: Viewer[];
  onBack: () => void;
  onSave: (settings: Partial<FileDetail>) => Promise<void>;
  onDelete: () => Promise<void>;
}

type TabType = 'analytics' | 'viewers' | 'settings';

function getEngagementBadge(score: number) {
  if (score >= 80) return { emoji: '🔥', label: 'Hot', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  if (score >= 50) return { emoji: '🟡', label: 'Warm', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
  return { emoji: '⚪', label: 'Cold', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
}

function getInitials(name: string): string {
  if (!name || name === 'Anonymous') return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getIntentBadge(signal: string, score: number) {
  if (signal === 'hot' || score >= 70) {
    return { emoji: '🔥', label: 'Hot', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  }
  if (signal === 'warm' || score >= 40) {
    return { emoji: '🟡', label: 'Warm', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
  }
  return { emoji: '⚪', label: 'Cold', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
}

function getCountryFlag(country: string | null): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'South Korea': '🇰🇷',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'India': '🇮🇳',
    'Thailand': '🇹🇭',
    'Singapore': '🇸🇬',
    'Netherlands': '🇳🇱',
    'Brazil': '🇧🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Mexico': '🇲🇽',
    'Indonesia': '🇮🇩',
    'Vietnam': '🇻🇳',
    'Malaysia': '🇲🇾',
    'Philippines': '🇵🇭',
    'Taiwan': '🇹🇼',
    'Hong Kong': '🇭🇰',
  };
  return flags[country || ''] || '🌍';
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    direct: '🔗',
    google: '🔍',
    linkedin: '💼',
    facebook: '👤',
    twitter: '🐦',
    instagram: '📷',
    email: '📧',
    other: '🌐'
  };
  return icons[source] || '🌐';
}

function getFileTypeIcon(fileType: string | undefined, type: 'file' | 'url'): string {
  if (type === 'url') return 'link';
  if (!fileType) return 'description';
  const ft = fileType.toLowerCase();
  if (ft.includes('pdf')) return 'picture_as_pdf';
  if (ft.includes('doc') || ft.includes('word')) return 'article';
  if (ft.includes('sheet') || ft.includes('excel') || ft.includes('xls')) return 'table_chart';
  if (ft.includes('presentation') || ft.includes('powerpoint') || ft.includes('ppt')) return 'slideshow';
  if (ft.includes('image') || ft.includes('png') || ft.includes('jpg') || ft.includes('jpeg') || ft.includes('gif') || ft.includes('webp')) return 'image';
  if (ft.includes('video') || ft.includes('mp4') || ft.includes('webm') || ft.includes('mov')) return 'movie';
  if (ft.includes('audio') || ft.includes('mp3') || ft.includes('wav')) return 'audio_file';
  return 'description';
}

function getFileTypeLabel(fileType: string | undefined, type: 'file' | 'url'): string {
  if (type === 'url') return 'Track Site';
  if (!fileType) return 'File';
  const ft = fileType.toLowerCase();
  if (ft.includes('pdf')) return 'PDF';
  if (ft.includes('doc') || ft.includes('word')) return 'Document';
  if (ft.includes('sheet') || ft.includes('excel') || ft.includes('xls')) return 'Spreadsheet';
  if (ft.includes('presentation') || ft.includes('powerpoint') || ft.includes('ppt')) return 'Presentation';
  if (ft.includes('image') || ft.includes('png') || ft.includes('jpg') || ft.includes('jpeg') || ft.includes('gif') || ft.includes('webp')) return 'Image';
  if (ft.includes('video') || ft.includes('mp4') || ft.includes('webm') || ft.includes('mov')) return 'Video';
  if (ft.includes('audio') || ft.includes('mp3') || ft.includes('wav')) return 'Audio';
  return 'File';
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FileDetailPage({ file, viewers, onBack, onSave, onDelete }: FileDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Toggle states for password and expiration
  const [passwordEnabled, setPasswordEnabled] = useState(!!file.password);
  const [expirationEnabled, setExpirationEnabled] = useState(!!file.expiresAt);

  const [settings, setSettings] = useState({
    requireEmail: file.requireEmail,
    requireName: file.requireName,
    allowDownload: file.allowDownload,
    password: file.password || '',
    expiresAt: file.expiresAt || '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Full analytics data
  interface FullAnalytics {
    summary: {
      totalViews: number;
      uniqueViewers: number;
      avgEngagement: number;
      hotLeads: number;
      warmLeads: number;
      coldLeads: number;
      completionRate: number;
      returnRate: number;
      downloads: number;
      avgTimeSpent: number;
      totalPages: number;
    };
    trafficSources: Array<{ source: string; count: number; percentage: number }>;
    accessMethods: Array<{ method: string; count: number; percentage: number }>;
    devices: Array<{ device: string; count: number; percentage: number }>;
    countries: Array<{ country: string; count: number; percentage: number }>;
    pageHeatmap: Array<{ page: number; totalTime: number; avgTime: number; viewCount: number; heatLevel: string }>;
    dropOff: Array<{ page: number; viewers: number; dropOffRate: number; dropOffCount: number }>;
    viewsOverTime: Array<{ date: string; views: number }>;
    video?: {
      avgWatchTime: number;
      avgCompletion: number;
      finishedCount: number;
      totalDuration: number | null;
      completionBuckets: Record<string, number>;
      totalVideoViews: number;
    } | null;
    viewers: Array<{
      id: string;
      name: string;
      email: string;
      company?: string;
      engagementScore: number;
      intentSignal: string;
      completionPercentage: number;
      pagesViewed: number;
      totalDuration: number;
      totalPages?: number;
      country?: string;
      city?: string;
      device?: string;
      browser?: string;
      referrerSource?: string;
      accessedAt: string;
      totalVisitsToFile: number;
      downloaded: boolean;
    }>;
  }

  const [fullAnalytics, setFullAnalytics] = useState<FullAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Time filter for analytics
  const [timeFilter, setTimeFilter] = useState('30d');

  // Notes state
  const [notes, setNotes] = useState(file.notes || '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(file.isFavorite || false);

  // Tags state
  const [fileTags, setFileTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Real-time password match validation
  useEffect(() => {
    if (!passwordEnabled) {
      setPasswordMatch(null);
      return;
    }
    if (!settings.password && !confirmPassword) {
      setPasswordMatch(null);
      return;
    }
    if (settings.password && confirmPassword.length > 0) {
      setPasswordMatch(settings.password === confirmPassword);
    } else if (!settings.password && confirmPassword) {
      setPasswordMatch(false);
    } else {
      setPasswordMatch(null);
    }
  }, [settings.password, confirmPassword, passwordEnabled]);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${file.slug}`;

  // Fetch full analytics data
  useEffect(() => {
    const fetchFullAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const response = await fetch(`/api/files/${file.id}/analytics/full?period=${timeFilter}`);
        if (response.ok) {
          const data = await response.json();
          setFullAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchFullAnalytics();
  }, [file.id, timeFilter]);

  // Auto-save notes with debounce
  useEffect(() => {
    const originalNotes = file.notes || '';
    if (notes === originalNotes) return;

    const timer = setTimeout(async () => {
      setNotesSaving(true);
      try {
        await fetch(`/api/files/${file.id}/notes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch (error) {
        console.error('Failed to save notes:', error);
      } finally {
        setNotesSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, file.id, file.notes]);

  // Fetch file tags and available tags
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        // Fetch file's current tags
        const fileTagsRes = await fetch(`/api/files/${file.id}/tags`);
        if (fileTagsRes.ok) {
          const data = await fileTagsRes.json();
          setFileTags(data.tags || []);
        }

        // Fetch all available tags
        const allTagsRes = await fetch('/api/tags');
        if (allTagsRes.ok) {
          const data = await allTagsRes.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [file.id]);

  // Add tag to file
  const addTagToFile = async (tagId: string) => {
    try {
      const res = await fetch(`/api/files/${file.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      });

      if (res.ok) {
        const tag = availableTags.find(t => t.id === tagId);
        if (tag) {
          setFileTags(prev => [...prev, tag]);
        }
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
    setShowTagDropdown(false);
  };

  // Remove tag from file
  const removeTagFromFile = async (tagId: string) => {
    try {
      const res = await fetch(`/api/files/${file.id}/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setFileTags(prev => prev.filter(t => t.id !== tagId));
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // Get tag color classes
  const getTagColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      '#3B82F6': { bg: 'bg-blue-100', text: 'text-blue-700' },
      '#3b82f6': { bg: 'bg-blue-100', text: 'text-blue-700' },
      '#8B5CF6': { bg: 'bg-purple-100', text: 'text-purple-700' },
      '#8b5cf6': { bg: 'bg-purple-100', text: 'text-purple-700' },
      '#22C55E': { bg: 'bg-green-100', text: 'text-green-700' },
      '#22c55e': { bg: 'bg-green-100', text: 'text-green-700' },
      '#F97316': { bg: 'bg-orange-100', text: 'text-orange-700' },
      '#f97316': { bg: 'bg-orange-100', text: 'text-orange-700' },
      '#EC4899': { bg: 'bg-pink-100', text: 'text-pink-700' },
      '#ec4899': { bg: 'bg-pink-100', text: 'text-pink-700' },
      '#EF4444': { bg: 'bg-red-100', text: 'text-red-700' },
      '#ef4444': { bg: 'bg-red-100', text: 'text-red-700' },
      '#EAB308': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      '#eab308': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      '#14B8A6': { bg: 'bg-teal-100', text: 'text-teal-700' },
      '#14b8a6': { bg: 'bg-teal-100', text: 'text-teal-700' },
    };
    return colors[color] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  };

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    const prevState = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      const res = await fetch(`/api/files/${file.id}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsFavorite(data.is_favorite);
      } else {
        setIsFavorite(prevState); // Revert on error
      }
    } catch (error) {
      setIsFavorite(prevState); // Revert on error
      console.error('Failed to toggle favorite:', error);
    }
  }, [file.id, isFavorite]);

  // Generate QR Code when modal opens
  useEffect(() => {
    if (showQRModal && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
      }).then(setQRCodeDataUrl).catch(console.error);
    }
  }, [showQRModal, shareUrl]);

  // Handle delete with confirmation
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${file.slug}-qrcode.png`;
    link.click();
  };

  // Copy QR Code image to clipboard
  const handleCopyQRCode = async () => {
    if (!qrCodeDataUrl) return;
    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();

      // Copy image to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      // Show success feedback
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR code:', error);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    // Validate password confirmation if password is enabled and set
    if (passwordEnabled && settings.password && settings.password !== confirmPassword) {
      setSaveError('Passwords do not match');
      setTimeout(() => setSaveError(''), 5000);
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      // If password toggle is off, clear password
      const settingsToSave = {
        ...settings,
        password: passwordEnabled ? settings.password : '',
        expiresAt: expirationEnabled ? settings.expiresAt : '',
      };
      await onSave(settingsToSave);
      setSaveSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Failed to save settings. Please try again.');
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hotLeads = viewers.filter(v => v.engagementScore >= 80);
  const warmLeads = viewers.filter(v => v.engagementScore >= 50 && v.engagementScore < 80);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-4 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Files
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              file.type === 'url' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                file.type === 'url' ? 'text-purple-600' : 'text-blue-600'
              }`}>
                {getFileTypeIcon(file.fileType, file.type)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  file.type === 'url' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {getFileTypeLabel(file.fileType, file.type)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{file.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">/{file.slug}</code>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 text-sm">Created {formatDate(file.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              className={`p-2.5 rounded-xl transition-colors ${
                isFavorite
                  ? 'bg-yellow-100 text-yellow-500'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                star
              </span>
            </button>
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                copied
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
              }`}
              style={{ boxShadow: copied ? '0 4px 12px rgba(34, 197, 94, 0.4)' : '0 4px 12px rgba(59, 130, 246, 0.4)' }}
            >
              <span className="material-symbols-outlined text-xl">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
              QR Code
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Share URL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Share URL:</span>
          <code className="flex-1 bg-slate-50 px-4 py-2 rounded-lg text-slate-800 text-sm font-mono">
            {shareUrl}
          </code>
          <button
            onClick={copyLink}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">content_copy</span>
          </button>
        </div>
      </div>

      {/* Quick Stats - Title on top, no icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Total views</p>
          <p className="text-3xl font-bold text-slate-800">{file.views}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Unique viewers</p>
          <p className="text-3xl font-bold text-slate-800">{file.uniqueViewers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Avg engagement</p>
          <p className="text-3xl font-bold text-slate-800">{file.avgEngagement}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Hot leads</p>
          <p className="text-3xl font-bold text-slate-800">{hotLeads.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm mb-6 w-fit">
        {[
          { id: 'analytics', label: 'Analytics', icon: 'analytics' },
          { id: 'viewers', label: 'Viewers', icon: 'group' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header with Time Filter */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Analytics overview</h2>
            <TimeFilter value={timeFilter} onChange={setTimeFilter} />
          </div>

          {loadingAnalytics ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                    <div className="h-48 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : !fullAnalytics ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <span className="text-5xl mb-4 block">📊</span>
              <p className="text-slate-600 font-medium">No analytics data available</p>
              <p className="text-slate-500 text-sm mt-1">Share your link to start collecting data</p>
            </div>
          ) : (
            <>
              {/* Summary Stats - Title on top, no icons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Completion rate</p>
                  <p className="text-2xl font-bold text-slate-800">{fullAnalytics.summary.completionRate}%</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Return rate</p>
                  <p className="text-2xl font-bold text-slate-800">{fullAnalytics.summary.returnRate}%</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Avg time</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {fullAnalytics.summary.avgTimeSpent < 60
                      ? `${fullAnalytics.summary.avgTimeSpent}s`
                      : `${Math.floor(fullAnalytics.summary.avgTimeSpent / 60)}m`}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-orange-600 mb-1">Hot</p>
                  <p className="text-2xl font-bold text-slate-800">{fullAnalytics.summary.hotLeads}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-yellow-600 mb-1">Warm</p>
                  <p className="text-2xl font-bold text-slate-800">{fullAnalytics.summary.warmLeads}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Cold</p>
                  <p className="text-2xl font-bold text-slate-800">{fullAnalytics.summary.coldLeads}</p>
                </div>
              </div>

              {/* Hot Leads Alert */}
              {hotLeads.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    🔥 {hotLeads.length} Hot Lead{hotLeads.length !== 1 ? 's' : ''} - Follow Up Now!
                  </h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {hotLeads.slice(0, 3).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{lead.name}</p>
                            <p className="text-xs text-slate-600">{lead.email}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          🔥 {lead.engagementScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Views Over Time */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="material-symbols-outlined text-blue-500 align-middle mr-2">trending_up</span>
                    Views over time
                  </h3>
                  <ViewsOverTimeChart data={fullAnalytics.viewsOverTime} />
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="material-symbols-outlined text-purple-500 align-middle mr-2">share</span>
                    Traffic sources
                  </h3>
                  <TrafficSourcesChart data={fullAnalytics.trafficSources} />
                </div>

                {/* Devices */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="material-symbols-outlined text-green-500 align-middle mr-2">devices</span>
                    Devices
                  </h3>
                  <DeviceChart data={fullAnalytics.devices} />
                </div>

                {/* Geographic Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="material-symbols-outlined text-orange-500 align-middle mr-2">public</span>
                    Geographic distribution
                  </h3>
                  <CountryList data={fullAnalytics.countries} />
                </div>
              </div>

              {/* PDF-specific analytics */}
              {file.fileType === 'pdf' && fullAnalytics.summary.totalPages > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Page Heatmap */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      <span className="material-symbols-outlined text-red-500 align-middle mr-2">local_fire_department</span>
                      Page engagement heatmap
                    </h3>
                    <PageHeatmapChart
                      data={fullAnalytics.pageHeatmap}
                      totalPages={fullAnalytics.summary.totalPages}
                    />
                  </div>

                  {/* Drop-off Analysis */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                      <span className="material-symbols-outlined text-amber-500 align-middle mr-2">trending_down</span>
                      Drop-off Analysis
                    </h3>
                    <DropOffAnalysisChart data={fullAnalytics.dropOff} />
                  </div>
                </div>
              )}

              {/* Video-specific analytics */}
              {(file.fileType?.toLowerCase().includes('video') ||
                file.fileType?.includes('mp4') ||
                file.fileType?.includes('webm') ||
                file.fileType?.includes('mov')) && fullAnalytics.video && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    <span className="material-symbols-outlined text-purple-500 align-middle mr-2">play_circle</span>
                    Video Analytics
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <p className="text-2xl font-bold text-purple-700">
                        {fullAnalytics.video.avgWatchTime < 60
                          ? `${fullAnalytics.video.avgWatchTime}s`
                          : `${Math.floor(fullAnalytics.video.avgWatchTime / 60)}m ${fullAnalytics.video.avgWatchTime % 60}s`}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">Avg Watch Time</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-700">
                        {fullAnalytics.video.avgCompletion}%
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Avg Completion</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-700">
                        {fullAnalytics.video.finishedCount}
                      </p>
                      <p className="text-xs text-green-600 font-medium">Watched to End</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <p className="text-2xl font-bold text-orange-700">
                        {fullAnalytics.video.totalDuration
                          ? fullAnalytics.video.totalDuration < 60
                            ? `${fullAnalytics.video.totalDuration}s`
                            : `${Math.floor(fullAnalytics.video.totalDuration / 60)}m`
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">Video Length</p>
                    </div>
                  </div>

                  {/* Video completion distribution */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Completion Distribution</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Watched 100%', color: 'bg-green-500' },
                        { label: 'Watched 75-99%', color: 'bg-blue-500' },
                        { label: 'Watched 50-74%', color: 'bg-yellow-500' },
                        { label: 'Watched 25-49%', color: 'bg-orange-500' },
                        { label: 'Watched <25%', color: 'bg-red-500' },
                      ].map(bucket => {
                        const count = fullAnalytics.video?.completionBuckets?.[bucket.label] || 0;
                        const percentage = fullAnalytics.video?.totalVideoViews
                          ? Math.round((count / fullAnalytics.video.totalVideoViews) * 100)
                          : 0;
                        return (
                          <div key={bucket.label} className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 w-28">{bucket.label}</span>
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${bucket.color} rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-700 w-12 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Taken */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  <span className="material-symbols-outlined text-indigo-500 align-middle mr-2">bolt</span>
                  Actions taken
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <span className="text-2xl">⬇️</span>
                    <p className="text-2xl font-bold text-blue-700 mt-2">{fullAnalytics?.summary?.downloads || 0}</p>
                    <p className="text-sm text-blue-600 font-medium">Downloads</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <span className="text-2xl">🔄</span>
                    <p className="text-2xl font-bold text-purple-700 mt-2">{fullAnalytics?.viewers?.filter(v => v.isReturnVisit).length || 0}</p>
                    <p className="text-sm text-purple-600 font-medium">Return visits</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <span className="text-2xl">📧</span>
                    <p className="text-2xl font-bold text-green-700 mt-2">{fullAnalytics?.viewers?.filter(v => v.email && v.email !== 'Anonymous').length || 0}</p>
                    <p className="text-sm text-green-600 font-medium">Emails captured</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Viewers Tab */}
      {activeTab === 'viewers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!fullAnalytics?.viewers || fullAnalytics.viewers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">👀</div>
              <p className="text-slate-600 font-medium">No viewers yet.</p>
              <p className="text-slate-500 text-sm mt-1">Share your link to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Viewer</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Intent</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Engage</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Complete</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">Device</th>
                    <th className="px-4 py-3 text-center text-xs font-bold tracking-wider text-slate-600">Visits</th>
                    <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-600">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fullAnalytics.viewers.map((viewer) => {
                    const intentBadge = getIntentBadge(viewer.intentSignal, viewer.engagementScore);
                    return (
                      <tr key={viewer.id} className="hover:bg-slate-50 transition-colors">
                        {/* Viewer Info - Clean, no badges */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm flex-shrink-0">
                              {getInitials(viewer.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-base truncate">{viewer.name}</p>
                              {viewer.email && (
                                <a
                                  href={`mailto:${viewer.email}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {viewer.email}
                                </a>
                              )}
                              {viewer.company && (
                                <p className="text-xs text-slate-500 mt-0.5">{viewer.company}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Intent Signal */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${intentBadge.bgColor} ${intentBadge.textColor}`}>
                            {intentBadge.label}
                          </span>
                        </td>

                        {/* Engagement Score */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  viewer.engagementScore >= 70 ? 'bg-green-500' :
                                  viewer.engagementScore >= 40 ? 'bg-yellow-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${viewer.engagementScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{viewer.engagementScore}%</span>
                          </div>
                        </td>

                        {/* Completion */}
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${
                            viewer.completionPercentage >= 90 ? 'text-green-600' :
                            viewer.completionPercentage >= 50 ? 'text-yellow-600' : 'text-slate-600'
                          }`}>
                            {viewer.completionPercentage}%
                          </span>
                          {viewer.totalPages && viewer.totalPages > 0 && (
                            <span className="text-xs text-slate-400 ml-1">
                              ({viewer.pagesViewed || Math.round((viewer.completionPercentage / 100) * viewer.totalPages)}/{viewer.totalPages}pg)
                            </span>
                          )}
                        </td>

                        {/* Time Spent */}
                        <td className="px-4 py-3">
                          <span className={`text-sm ${viewer.totalDuration === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                            {formatDuration(viewer.totalDuration)}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-base">{getCountryFlag(viewer.country || null)}</span>
                            <span className="text-sm text-slate-600">{viewer.country || 'Unknown'}</span>
                          </div>
                        </td>

                        {/* Device */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 capitalize">{viewer.device || 'Unknown'}</span>
                          {viewer.browser && (
                            <span className="text-xs text-slate-400 ml-1">({viewer.browser})</span>
                          )}
                        </td>

                        {/* Visits - Shows total visit count to this file */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            viewer.totalVisitsToFile >= 3
                              ? 'bg-purple-100 text-purple-700'
                              : viewer.totalVisitsToFile === 2
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {viewer.totalVisitsToFile}
                          </span>
                        </td>

                        {/* When */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{formatTimeAgo(viewer.accessedAt)}</span>
                          {viewer.downloaded && (
                            <span className="ml-2 text-green-500 text-sm" title="Downloaded">↓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">🔒 Access control</h3>
            <div className="space-y-5">
              {/* Require Name FIRST */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">Require Name</p>
                  <p className="text-sm text-slate-600">Viewers must enter their name</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireName}
                  onChange={(e) => setSettings({ ...settings, requireName: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
              </label>
              {/* Require Email SECOND */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">Require Email</p>
                  <p className="text-sm text-slate-600">Viewers must enter email to access</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEmail}
                  onChange={(e) => setSettings({ ...settings, requireEmail: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">Allow Download</p>
                  <p className="text-sm text-slate-600">Viewers can download the file</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowDownload}
                  onChange={(e) => setSettings({ ...settings, allowDownload: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">🔐 Security</h3>
            <div className="space-y-5">
              {/* Password Protection with Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">Password Protection</p>
                    <p className="text-sm text-slate-600">Require password to view</p>
                  </div>
                  <ToggleSwitch
                    enabled={passwordEnabled}
                    onChange={(enabled) => {
                      setPasswordEnabled(enabled);
                      if (!enabled) {
                        setSettings({ ...settings, password: '' });
                        setConfirmPassword('');
                        setPasswordMatch(null);
                      }
                    }}
                  />
                </div>
                {passwordEnabled && (
                  <div className="space-y-3 mt-3">
                    <input
                      type="password"
                      value={settings.password}
                      onChange={(e) => {
                        setSettings({ ...settings, password: e.target.value });
                        if (!e.target.value) {
                          setConfirmPassword('');
                          setPasswordMatch(null);
                        }
                      }}
                      placeholder="Enter password"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    {settings.password && (
                      <div className="relative">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className={`w-full px-4 py-2.5 pr-10 rounded-xl border outline-none transition-all ${
                            passwordMatch === null
                              ? 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                              : passwordMatch
                              ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                              : 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          }`}
                        />
                        {passwordMatch !== null && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                            passwordMatch ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {passwordMatch ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    )}
                    {passwordMatch === false && (
                      <p className="text-sm text-red-500">Passwords do not match</p>
                    )}
                  </div>
                )}
              </div>

              {/* Expiration Date with Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800">Expiration Date</p>
                    <p className="text-sm text-slate-600">Link expires after date</p>
                  </div>
                  <ToggleSwitch
                    enabled={expirationEnabled}
                    onChange={(enabled) => {
                      setExpirationEnabled(enabled);
                      if (!enabled) {
                        setSettings({ ...settings, expiresAt: '' });
                      }
                    }}
                  />
                </div>
                {expirationEnabled && (
                  <input
                    type="datetime-local"
                    value={settings.expiresAt}
                    onChange={(e) => setSettings({ ...settings, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">📝 Notes</h3>
              <div className="flex items-center gap-2">
                {notesSaving && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    Saving...
                  </span>
                )}
                {notesSaved && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check</span>
                    Saved
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this link... (e.g., who you shared it with, context, follow-up reminders)"
              className="w-full h-32 p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-2">
              Only you can see these notes. Auto-saves as you type.
            </p>
          </div>

          {/* Tags Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">🏷️ Tags</h3>

            {loadingTags ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-slate-200 rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Tags */}
                <div className="flex flex-wrap gap-2">
                  {fileTags.map(tag => {
                    const colors = getTagColorClasses(tag.color);
                    return (
                      <span
                        key={tag.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTagFromFile(tag.id)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    );
                  })}

                  {/* Add Tag Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Tag
                    </button>

                    {/* Tag Dropdown */}
                    {showTagDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-2">
                        {availableTags.filter(t => !fileTags.find(ft => ft.id === t.id)).length === 0 ? (
                          <p className="px-4 py-2 text-sm text-slate-500">No more tags available</p>
                        ) : (
                          availableTags
                            .filter(t => !fileTags.find(ft => ft.id === t.id))
                            .map(tag => {
                              const colors = getTagColorClasses(tag.color);
                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => addTagToFile(tag.id)}
                                  className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                    {tag.name}
                                  </span>
                                </button>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {fileTags.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No tags assigned. Add tags to organize and filter your links.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={saving || (passwordEnabled && settings.password && passwordMatch !== true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  saveSuccess
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                }`}
              >
                <span className="material-symbols-outlined">
                  {saving ? 'hourglass_empty' : saveSuccess ? 'check_circle' : 'save'}
                </span>
                {saving ? 'Saving...' : saveSuccess ? 'Saved Successfully!' : 'Save Settings'}
              </button>

              {/* Success Toast */}
              {saveSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl animate-fade-in">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="font-medium">Settings saved successfully!</span>
                </div>
              )}

              {/* Error Toast */}
              {saveError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl animate-fade-in">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="font-medium">{saveError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-red-600">delete</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete File?</h3>
              <p className="text-slate-600 mb-1">Are you sure you want to delete</p>
              <p className="text-slate-800 font-semibold mb-2">&quot;{file.name}&quot;</p>
              <p className="text-sm mb-6" style={{ color: '#ef4444', fontSize: '14px' }}>
                This action cannot be undone. All analytics data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQRModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500">close</span>
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{file.name}</h3>
              <p className="text-slate-600 text-sm mb-6">Scan to open link</p>

              {qrCodeDataUrl ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mb-6">
                  <img src={qrCodeDataUrl} alt="QR Code" width={200} height={200} />
                </div>
              ) : (
                <div className="w-52 h-52 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={downloadQRCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                  style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}
                >
                  <span className="material-symbols-outlined text-xl">download</span>
                  Download QR code
                </button>
                <button
                  onClick={handleCopyQRCode}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    qrCopied
                      ? 'bg-green-500 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  style={qrCopied ? { boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' } : undefined}
                >
                  <span className="material-symbols-outlined text-xl">
                    {qrCopied ? 'check' : 'content_copy'}
                  </span>
                  {qrCopied ? 'Copied!' : 'Copy QR Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add fade-in animation */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
