'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import TagFilter from '@/components/ui/TagFilter';
import TagBadge from '@/components/ui/TagBadge';

interface FileRecord {
  id: string;
  name: string;
  slug: string;
  views: number;
  uniqueViewers?: number;
  avgEngagement?: number;
  hotLeads?: number;
  createdAt: string;
  lastViewedAt?: string;
  type: 'file' | 'url';
  fileType?: string;
  mime_type?: string;
  size?: number;
  isActive?: boolean;
  isFavorite?: boolean;
  tags?: string[];
}

interface FilesPageProps {
  files: FileRecord[];
  onUploadClick: () => void;
  onFileClick: (fileId: string) => void;
  onDeleteFile: (fileId: string) => Promise<void>;
  onRefresh: () => void;
}

// Sort types
type SortField = 'name' | 'views' | 'engagement' | 'hotLeads' | 'lastViewed' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// File type icons per Section 9.4
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

// Get file type label (PDF, MP4, URL, etc.)
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
  if (mt.includes('mp4')) return 'MP4';
  if (mt.includes('mov')) return 'MOV';
  if (mt.includes('mp3')) return 'MP3';
  if (mt.includes('wav')) return 'WAV';
  if (mt.includes('zip')) return 'ZIP';
  return 'FILE';
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Never';
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// Sortable Header Component
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

// Actions menu component
function ActionsMenu({
  file,
  onCopyLink,
  onCopyQR,
  onShowQR,
  onEditSettings,
  onDelete
}: {
  file: FileRecord;
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

export default function FilesPage({ files, onUploadClick, onFileClick, onDeleteFile, onRefresh }: FilesPageProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrFile, setQRFile] = useState<FileRecord | null>(null);
  const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string>('');
  const [qrCopied, setQrCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'urls'>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [fileTagsMap, setFileTagsMap] = useState<Record<string, Array<{ id: string; name: string; emoji: string; color: string }>>>({});

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
  }, [files]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopyLink = async (file: FileRecord) => {
    const url = `${window.location.origin}/s/${file.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyQR = async (file: FileRecord) => {
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

  const handleShowQR = async (file: FileRecord) => {
    setQRFile(file);
    setShowQRModal(true);
    const url = `${window.location.origin}/s/${file.slug}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' }
    });
    setQRCodeDataUrl(dataUrl);
  };

  const handleEditSettings = (file: FileRecord) => {
    router.push(`/dashboard/files/${file.id}?tab=settings`);
  };

  const handleDeleteClick = (file: FileRecord) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setDeletingId(fileToDelete.id);
    try {
      await onDeleteFile(fileToDelete.id);
      onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const toggleFavorite = useCallback(async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/files/${fileId}/favorite`, { method: 'POST' });
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [onRefresh]);

  // Count files and URLs
  const fileCount = files.filter(f => f.type !== 'url').length;
  const urlCount = files.filter(f => f.type === 'url').length;

  // Extract unique tags that are actually used on files
  const availableFileTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string; emoji: string; color: string }>();

    Object.values(fileTagsMap).forEach(tags => {
      tags.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fileTagsMap]);

  // Filter and sort files using useMemo
  const displayFiles = useMemo(() => {
    let filtered = [...files];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'files') {
      filtered = filtered.filter(f => f.type !== 'url');
    } else if (filterType === 'urls') {
      filtered = filtered.filter(f => f.type === 'url');
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
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        case 'engagement':
          aVal = a.avgEngagement || 0;
          bVal = b.avgEngagement || 0;
          break;
        case 'hotLeads':
          aVal = a.hotLeads || 0;
          bVal = b.hotLeads || 0;
          break;
        case 'lastViewed':
          aVal = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
          bVal = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    return filtered;
  }, [files, searchQuery, filterType, selectedTagIds, fileTagsMap, sortField, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header per Section 8.2 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            My links
          </h1>
          <p className="text-slate-600 mt-1">
            {files.length} total links ({fileCount} files, {urlCount} URLs)
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
        >
          + Create link
        </Link>
      </div>

      {/* Search & Filters Row per Section 8.2 */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-xl border border-slate-200 p-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1">
          {([
            { value: 'all', label: 'All' },
            { value: 'files', label: '📄 Files' },
            { value: 'urls', label: '🔗 URLs' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tag Filter */}
        <TagFilter
          availableTags={availableFileTags}
          selectedTags={selectedTagIds}
          onTagsChange={setSelectedTagIds}
        />
      </div>

      {/* Empty State */}
      {displayFiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No matching files' : 'No links yet'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery ? 'Try a different search term' : 'Upload a file or track a URL to get started'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
            >
              + Create link
            </Link>
          )}
        </div>
      ) : (
        /* Files Table per Section 8.2 */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">⭐</th>
                <SortableHeader
                  label="Type & name"
                  icon="📁"
                  field="name"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Views"
                  icon="👁️"
                  field="views"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Performance"
                  icon="📊"
                  field="engagement"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Hot"
                  icon="🔥"
                  field="hotLeads"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Last viewed"
                  icon="⏰"
                  field="lastViewed"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">🏷️ Tags</th>
                <th className="w-12 px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500">🔧</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayFiles.map(file => {
                const icon = getFileIcon(file.mime_type || file.fileType, file.type);
                const engagement = file.avgEngagement || 0;
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
                        onClick={(e) => toggleFavorite(file.id, e)}
                        className={`text-xl ${file.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {file.isFavorite ? '★' : '☆'}
                      </button>
                    </td>

                    {/* Type & Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10">
                          <span className="text-2xl">{icon}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {getFileTypeLabel(file.mime_type || file.fileType, file.type)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm truncate max-w-[250px]">{file.name}</p>
                          <p className="text-xs text-slate-500">/{file.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Views */}
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900">{file.views.toLocaleString()}</span>
                      {file.uniqueViewers !== undefined && (
                        <span className="text-slate-500 text-sm"> ({file.uniqueViewers} uniq)</span>
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
                      {file.hotLeads && file.hotLeads > 0 ? (
                        <span className="text-red-600 font-medium">🔥 {file.hotLeads}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Last Viewed */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">
                        {file.lastViewedAt ? formatRelativeTime(file.lastViewedAt) : 'Never'}
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
                        onDelete={() => handleDeleteClick(file)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={showDeleteModal && !!fileToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setFileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete link?"
        itemName={fileToDelete?.name}
        message="This action cannot be undone. All analytics data will be lost."
        isLoading={deletingId === fileToDelete?.id}
      />

      {/* QR Code Modal */}
      {showQRModal && qrFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowQRModal(false); setQrCopied(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <button
              onClick={() => { setShowQRModal(false); setQrCopied(false); }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              ✕
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{qrFile.name}</h3>
              <p className="text-slate-600 text-sm mb-6">Scan to open link</p>
              {qrCodeDataUrl && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mb-6">
                  <img src={qrCodeDataUrl} alt="QR Code" width={200} height={200} />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const response = await fetch(qrCodeDataUrl);
                    const blob = await response.blob();
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                      ]);
                      setQrCopied(true);
                      setTimeout(() => setQrCopied(false), 2000);
                    } catch {
                      // Fallback handled by download
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    qrCopied
                      ? 'bg-green-500 text-white border border-green-500'
                      : 'border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {qrCopied ? '✓ Copied' : '📷 Copy image'}
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeDataUrl;
                    link.download = `${qrFile.slug}-qrcode.png`;
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
    </div>
  );
}
