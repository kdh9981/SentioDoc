'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  files_count: number;
}

const TAG_COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { name: 'Red', value: 'red', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { name: 'Gray', value: 'gray', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('blue');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalFiles, setTotalFiles] = useState(0);
  const [taggedFiles, setTaggedFiles] = useState(0);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
      if (!response.ok) {
        // Table might not exist, show empty state
        setTags([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setTags(data.tags || []);
      setTotalFiles(data.totalFiles || 0);
      setTaggedFiles(data.taggedFiles || 0);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const getColorConfig = (colorValue: string) => {
    return TAG_COLORS.find(c => c.value === colorValue) || TAG_COLORS[0];
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setTagName('');
    setTagColor('blue');
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color || 'blue');
    setError(null);
    setShowModal(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingTag) {
        // Update existing tag
        const response = await fetch('/api/tags', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tagId: editingTag.id,
            name: tagName.trim(),
            color: tagColor,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update tag');
        }

        setTags(tags.map(t =>
          t.id === editingTag.id
            ? { ...t, name: tagName.trim(), color: tagColor }
            : t
        ));
      } else {
        // Create new tag
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create tag');
        }

        const data = await response.json();
        setTags([...tags, { ...data.tag, files_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save tag';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!confirm(`Delete tag "${tag?.name}"? This won't delete your files.`)) return;

    try {
      const response = await fetch(`/api/tags?id=${tagId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete tag');
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err) {
      alert('Failed to delete tag');
    }
  };

  // Find most used tag
  const mostUsedTag = tags.reduce((prev, current) =>
    (prev.files_count || 0) > (current.files_count || 0) ? prev : current
    , { files_count: 0, name: '' } as Tag);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tags</h1>
          <p className="text-slate-600">Organize your links with tags</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Create tag
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Total tags</div>
          <div className="text-2xl font-bold text-slate-900">{tags.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Tagged links</div>
          <div className="text-2xl font-bold text-slate-900">{taggedFiles}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Untagged</div>
          <div className="text-2xl font-bold text-slate-900">{Math.max(0, totalFiles - taggedFiles)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Most used</div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            {mostUsedTag.name || '—'}
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-500 tracking-wider">Your tags</h2>
        </div>

        {tags.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tags.map(tag => {
              const colorConfig = getColorConfig(tag.color);
              return (
                <div key={tag.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${colorConfig.dot}`}></span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorConfig.bg} ${colorConfig.text}`}>
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {tag.files_count || 0} link{(tag.files_count || 0) !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => openEditModal(tag)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      x
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tags yet</h3>
            <p className="text-slate-600 mb-4">
              Create tags to organize your links by project, client, or purpose
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              + Create your first tag
            </button>
          </div>
        )}
      </div>

      {/* Usage Tip */}
      {tags.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <div className="font-medium text-slate-900">Pro tip</div>
              <div className="text-sm text-slate-600">
                You can add tags to files from the file detail page or when creating new links.
                Tags help you quickly filter and find related content.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingTag ? 'Edit tag' : 'Create tag'}
            </h3>

            {/* Tag Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tag name
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g., Sales, Marketing, Q4 2025"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Color Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setTagColor(color.value)}
                    className={`w-8 h-8 rounded-full ${color.dot} ${tagColor === color.value
                      ? 'ring-2 ring-offset-2 ring-blue-500'
                      : ''
                      }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Preview
              </label>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getColorConfig(tagColor).dot}`}></span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getColorConfig(tagColor).bg} ${getColorConfig(tagColor).text}`}>
                  {tagName || 'Tag name'}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                disabled={saving || !tagName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingTag ? 'Save changes' : 'Create tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
