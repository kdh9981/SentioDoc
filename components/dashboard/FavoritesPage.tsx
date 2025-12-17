'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import TagFilter from '@/components/ui/TagFilter';
import TagBadge from '@/components/ui/TagBadge';

interface FavoriteFile {
  id: string;
  name: string;
  slug: string;
  type: 'file' | 'url';
  mime_type?: string;
  cached_total_views: number;
  cached_unique_viewers: number;
  cached_avg_engagement: number;
  cached_hot_leads: number;
  created_at: string;
  cached_last_viewed_at: string | null;
}

interface FavoritesPageProps {
  onFileClick: (id: string) => void;
  periodParams?: { startDate: string; endDate: string };
}

type SortField = 'name' | 'views' | 'engagement' | 'hotLeads' | 'lastViewed' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function SortableHeader({
  label,
  icon,
  field,
  currentField,
  currentOrder,
  onSort,
}: {
  label: string;
  icon: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{icon}</span>
        <span>{label}</span>
        {isActive && (
          <span className="text-blue-500">{currentOrder === 'desc' ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  );
}

// File type icons (same as FilesPage)
function getFileIcon(mimeType: string | undefined, type: string): string {
  if (type === 'url') return '🔗';
  const mt = mimeType?.toLowerCase() || '';
  if (mt.includes('pdf')) return '📕';
  if (mt.includes('presentation') || mt.includes('ppt')) return '📊';
  if (mt.includes('word') || mt.includes('doc')) return '📘';
  if (mt.includes('sheet') || mt.includes('xls')) return '📗';
  if (mt.includes('image') || mt.includes('png') || mt.includes('jpg') || mt.includes('jpeg')) return '🖼️';
  if (mt.includes('video') || mt.includes('mp4') || mt.includes('mov')) return '🎬';
  if (mt.includes('audio') || mt.includes('mp3')) return '🎵';
  if (mt.includes('zip') || mt.includes('rar')) return '📦';
  return '📄';
}

// Get file type label (PDF, MP4, URL, etc.) - same as FilesPage
function getFileTypeLabel(mimeType: string | undefined, type: string): string {
  if (type === 'url') return 'URL';
  const mt = mimeType?.toLowerCase() || '';
  if (mt.includes('pdf')) return 'PDF';
  if (mt.includes('presentation') || mt.includes('ppt')) return 'PPTX';
  if (mt.includes('word') || mt.includes('doc')) return 'DOCX';
  if (mt.includes('sheet') || mt.includes('xls')) return 'XLSX';
  if (mt.includes('png')) return 'PNG';
  if (mt.includes('jpg') || mt.includes('jpeg')) return 'JPG';
  if (mt.includes('gif')) return 'GIF';
  if (mt.includes('webp')) return 'WEBP';
  if (mt.includes('mp4')) return 'MP4';
  if (mt.includes('mov')) return 'MOV';
  if (mt.includes('webm')) return 'WEBM';
  if (mt.includes('mp3')) return 'MP3';
  if (mt.includes('wav')) return 'WAV';
  if (mt.includes('zip')) return 'ZIP';
  if (mt.includes('rar')) return 'RAR';
  return 'FILE';
}

// Format relative time (same as FilesPage)
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// Actions menu component (same as FilesPage)
function ActionsMenu({
  file,
  onCopyLink,
  onCopyQR,
  onShowQR,
  onEditSettings,
  onDelete
}: {
  file: FavoriteFile;
  onCopyLink: () => void;
  onCopyQR: () => void;
  onShowQR: () => void;
  onEditSettings: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate whether to flip menu up when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      setFlipUp(spaceBelow < menuHeight);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
      >
        ⋯
      </button>

      {isOpen && (
        <div className={`absolute right-0 ${flipUp ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-slate-200 rounded-xl shadow-lg py-2 min-w-[160px] z-50`}>
          <button
            onClick={() => { onCopyLink(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            📋 Copy link
          </button>
          <button
            onClick={() => { onCopyQR(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            📷 Copy QR image
          </button>
          <button
            onClick={() => { onShowQR(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            📱 Show QR
          </button>
          <button
            onClick={() => { onEditSettings(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm flex items-center gap-2"
          >
            ⚙️ Edit settings
          </button>
          <hr className="my-2 border-slate-200" />
          <button
            onClick={() => { onDelete(); setIsOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage({ onFileClick, periodParams }: FavoritesPageProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [fileTagsMap, setFileTagsMap] = useState<Record<string, Array<{ id: string; name: string; emoji: string; color: string }>>>({});

  // Action states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FavoriteFile | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrFile, setQRFile] = useState<FavoriteFile | null>(null);
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      // Build URL with date params
      let url = '/api/files?favorites=true';
      if (periodParams) {
        url += `&startDate=${encodeURIComponent(periodParams.startDate)}&endDate=${encodeURIComponent(periodParams.endDate)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.files) {
        setFavorites(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [periodParams]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch file tags map
  useEffect(() => {
    async function fetchFileTags() {
      try {
        const res = await fetch('/api/files/with-tags');
        if (res.ok) {
          const data = await res.json();
          setFileTagsMap(data.fileTagsMap || {});
        }
      } catch (error) {
        console.error('Failed to fetch file tags:', error);
      }
    }
    fetchFileTags();
  }, [favorites]);

  // Action handlers
  const handleCopyLink = async (file: FavoriteFile) => {
    const url = `${window.location.origin}/s/${file.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyQR = async (file: FavoriteFile) => {
    const url = `${window.location.origin}/s/${file.slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' }
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${file.slug}-qrcode.png`;
      link.click();
    }
  };

  const handleShowQR = async (file: FavoriteFile) => {
    setQRFile(file);
    setShowQRModal(true);
    setQrCopied(false);
    const url = `${window.location.origin}/s/${file.slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    setQRCodeDataUrl(dataUrl);
  };

  const handleCopyQRFromModal = async () => {
    if (!qrFile) return;
    const url = `${window.location.origin}/s/${qrFile.slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setQrCopied(true);
    } catch {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${qrFile.slug}-qrcode.png`;
      link.click();
    }
  };

  const handleEditSettings = (file: FavoriteFile) => {
    onFileClick(file.id);
  };

  const handleDelete = (file: FavoriteFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites(prev => prev.filter(f => f.id !== fileToDelete.id));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const handleRemoveFavorite = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(f => f.id !== fileId));
    try {
      await fetch(`/api/files/${fileId}/favorite`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      fetchFavorites();
    }
  };

  // Extract unique tags that are actually used on favorited files
  const availableFileTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; emoji: string; color: string }>();

    // Only get tags from files that are in the favorites list
    favorites.forEach(file => {
      const tags = fileTagsMap[file.id] || [];
      tags.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [favorites, fileTagsMap]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort using useMemo
  const filteredFiles = useMemo(() => {
    let filtered = [...favorites];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tag filter
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter(f => {
        const fileTags = fileTagsMap[f.id] || [];
        return fileTags.some(tag => selectedTagIds.includes(tag.id));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'views':
          aVal = a.cached_total_views || 0;
          bVal = b.cached_total_views || 0;
          break;
        case 'engagement':
          aVal = a.cached_avg_engagement || 0;
          bVal = b.cached_avg_engagement || 0;
          break;
        case 'hotLeads':
          aVal = a.cached_hot_leads || 0;
          bVal = b.cached_hot_leads || 0;
          break;
        case 'lastViewed':
          aVal = a.cached_last_viewed_at ? new Date(a.cached_last_viewed_at).getTime() : 0;
          bVal = b.cached_last_viewed_at ? new Date(b.cached_last_viewed_at).getTime() : 0;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    return filtered;
  }, [favorites, searchQuery, selectedTagIds, fileTagsMap, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-32 mb-6"></div>
          <div className="h-12 bg-slate-200 rounded mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Favorites
          </h1>
          <p className="text-slate-600 mt-1">
            {favorites.length} favorite link{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          + Create link
        </Link>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <TagFilter
          availableTags={availableFileTags}
          selectedTags={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      {/* Table */}
      {filteredFiles.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">⭐</th>
                <SortableHeader label="Type & name" icon="📁" field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Views" icon="👁️" field="views" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Performance" icon="📊" field="engagement" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Hot" icon="🔥" field="hotLeads" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Last viewed" icon="⏰" field="lastViewed" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">🏷️ Tags</th>
                <th className="w-12 px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">🔧</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map(file => {
                const icon = getFileIcon(file.mime_type, file.type);
                const engagement = file.cached_avg_engagement || 0;
                const engagementColor = engagement >= 70 ? 'bg-red-500' : engagement >= 40 ? 'bg-yellow-500' : 'bg-slate-300';

                return (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onFileClick(file.id)}
                  >
                    {/* Favorite Star */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleRemoveFavorite(file.id, e)}
                        className="text-xl text-yellow-500 hover:text-yellow-600 transition-colors"
                        title="Remove from favorites"
                      >
                        ★
                      </button>
                    </td>

                    {/* Type & Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10">
                          <span className="text-2xl">{icon}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {getFileTypeLabel(file.mime_type, file.type)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 text-sm truncate max-w-[250px]">{file.name}</p>
                            {copiedId === file.id && (
                              <span className="text-xs text-green-600 font-medium">✓ Copied</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">/{file.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900">{(file.cached_total_views || 0).toLocaleString()}</span>
                      {file.cached_unique_viewers !== undefined && (
                        <span className="text-slate-500 text-sm"> ({file.cached_unique_viewers} uniq)</span>
                      )}
                    </td>

                    {/* Engagement Bar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${engagementColor} rounded-full`}
                            style={{ width: `${Math.min(engagement, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{engagement}</span>
                      </div>
                    </td>

                    {/* Hot Leads */}
                    <td className="px-4 py-4">
                      {(file.cached_hot_leads || 0) > 0 ? (
                        <span className="text-red-600 font-medium">🔥 {file.cached_hot_leads}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Last Viewed */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">
                        {formatRelativeTime(file.cached_last_viewed_at)}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(fileTagsMap[file.id] || []).slice(0, 3).map(tag => (
                          <TagBadge key={tag.id} name={tag.name} emoji={tag.emoji} color={tag.color} size="sm" />
                        ))}
                        {(fileTagsMap[file.id] || []).length > 3 && (
                          <span className="text-xs text-slate-500">+{(fileTagsMap[file.id] || []).length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu
                        file={file}
                        onCopyLink={() => handleCopyLink(file)}
                        onCopyQR={() => handleCopyQR(file)}
                        onShowQR={() => handleShowQR(file)}
                        onEditSettings={() => handleEditSettings(file)}
                        onDelete={() => handleDelete(file)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No favorites yet</h3>
          <p className="text-slate-600 mb-6">
            Star your important files to find them quickly here
          </p>
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
          >
            Browse my links
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No matching favorites</h3>
          <p className="text-slate-600">
            Try adjusting your search query
          </p>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && qrFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowQRModal(false); setQrCopied(false); }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">QR Code</h3>
              <p className="text-sm text-slate-600 mb-4 truncate">/{qrFile.slug}</p>
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto mb-4" />
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyQRFromModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    qrCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {qrCopied ? '✓ Copied' : '📋 Copy Image'}
                </button>
                <button
                  onClick={() => { setShowQRModal(false); setQrCopied(false); }}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setFileToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Link"
        description={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
