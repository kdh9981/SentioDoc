'use client';

import React, { useState } from 'react';

interface LinkItem {
  id: string;
  name: string;
  originalUrl: string;
  slug: string;
  views: number;
  uniqueViewers: number;
  createdAt: string;
  isActive: boolean;
}

interface LinksPageProps {
  links: LinkItem[];
  onCreateLink: () => void;
  onLinkClick: (linkId: string) => void;
  onDeleteLink: (linkId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function LinksPage({ links, onCreateLink, onLinkClick, onDeleteLink, onRefresh }: LinksPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLinks = links.filter(link =>
    link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyLink = async (slug: string | null | undefined, id: string) => {
    // Use slug if available, otherwise fall back to ID
    const identifier = slug || id;
    const link = `${window.location.origin}/s/${identifier}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    setDeletingId(id);
    try {
      await onDeleteLink(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Links</h1>
        <p className="mt-1 text-slate-600">Create trackable short links for external URLs</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="material-symbols-outlined text-gd-light-grey text-xl mr-2">search</span>
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm text-gd-black placeholder:text-gd-light-grey w-64"
          />
        </div>

        <button
          onClick={onCreateLink}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <span className="material-symbols-outlined text-xl">add_link</span>
          Create link
        </button>
      </div>

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchQuery ? 'No links found' : 'No links yet'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? 'Try a different search term.'
              : 'Create your first trackable link to start monitoring engagement.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onCreateLink}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <span className="material-symbols-outlined">add_link</span>
              Create your first link
            </button>
          )}
        </div>
      )}

      {/* Links List */}
      {filteredLinks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600">Link</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600">Original URL</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600">Views</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600">Created</th>
                <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLinks.map(link => (
                <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="cursor-pointer" onClick={() => onLinkClick(link.id)}>
                      <p className="font-semibold text-slate-800">{link.name}</p>
                      <p className="text-xs text-blue-500">/{link.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-blue-500 text-sm"
                      title={link.originalUrl}
                    >
                      {truncateUrl(link.originalUrl)}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{link.views}</span>
                    <span className="text-gd-grey text-sm ml-1">({link.uniqueViewers} unique)</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(link.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(link.slug, link.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          copiedId === link.id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {copiedId === link.id ? 'check' : 'link'}
                        </span>
                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => onLinkClick(link.id)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">analytics</span>
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deletingId === link.id}
                        className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
