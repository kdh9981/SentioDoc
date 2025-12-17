'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TAG_PRESETS, TAG_COLORS, TAG_EMOJIS, getTagColorClasses, TagPreset } from '@/lib/tag-presets';

export interface Tag {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface TagSelectorProps {
  entityType: 'link' | 'contact';
  entityId: string;
  appliedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
}

export default function TagSelector({
  entityType,
  entityId,
  appliedTags,
  onTagsChange,
  className = '',
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create new tag state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('🏷️');
  const [newTagColor, setNewTagColor] = useState('blue');
  const [creating, setCreating] = useState(false);

  // Edit tag state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagEmoji, setEditTagEmoji] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user's tags when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setUserTags(data.tags || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetForms();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear action message after 2 seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const resetForms = () => {
    setShowCreateForm(false);
    setEditingTag(null);
    setDeletingTag(null);
    setActionMessage(null);
    setNewTagName('');
    setNewTagEmoji('🏷️');
    setNewTagColor('blue');
  };

  const presets = TAG_PRESETS.filter(p =>
    p.category === entityType || p.category === 'both'
  );

  const isTagApplied = (tagId: string) => {
    return appliedTags.some(t => t.id === tagId);
  };

  const isPresetApplied = (preset: TagPreset) => {
    return appliedTags.some(t => t.name === preset.name);
  };

  const handleToggleTag = async (tag: Tag) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const isApplied = isTagApplied(tag.id);
      const endpoint = entityType === 'link'
        ? `/api/files/${entityId}/tags`
        : `/api/contacts/${entityId}/tags`;

      if (isApplied) {
        const res = await fetch(`${endpoint}?tag_id=${tag.id}`, { method: 'DELETE' });
        if (res.ok) {
          onTagsChange(appliedTags.filter(t => t.id !== tag.id));
          setActionMessage({ type: 'success', text: `Removed "${tag.name}"` });
        } else {
          const data = await res.json();
          setActionMessage({ type: 'error', text: data.error || 'Failed to remove tag' });
        }
      } else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: tag.id }),
        });
        if (res.ok) {
          onTagsChange([...appliedTags, tag]);
          setActionMessage({ type: 'success', text: `Added "${tag.name}"` });
        } else {
          const data = await res.json();
          setActionMessage({ type: 'error', text: data.error || 'Failed to add tag' });
        }
      }
    } catch (error) {
      console.error('Failed to toggle tag:', error);
      setActionMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (preset: TagPreset) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const existingApplied = appliedTags.find(t => t.name === preset.name);
      if (existingApplied) {
        await handleToggleTag(existingApplied);
        return;
      }

      let tag = userTags.find(t => t.name === preset.name);

      if (!tag) {
        const res = await fetch('/api/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: preset.name,
            emoji: preset.emoji,
            color: preset.color,
            is_preset: true,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          tag = data.tag;
          if (tag) {
            setUserTags(prev => [...prev, tag!]);
          }
        } else {
          const data = await res.json();
          setActionMessage({ type: 'error', text: data.error || 'Failed to create tag' });
          setLoading(false);
          return;
        }
      }

      if (tag) {
        const endpoint = entityType === 'link'
          ? `/api/files/${entityId}/tags`
          : `/api/contacts/${entityId}/tags`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: tag.id }),
        });

        if (res.ok) {
          onTagsChange([...appliedTags, tag]);
          setActionMessage({ type: 'success', text: `Added "${tag.name}"` });
        } else {
          const data = await res.json();
          setActionMessage({ type: 'error', text: data.error || 'Failed to apply tag' });
        }
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
      setActionMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagName.trim(),
          emoji: newTagEmoji,
          color: newTagColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newTag = data.tag;
        setUserTags(prev => [newTag, ...prev]);

        const endpoint = entityType === 'link'
          ? `/api/files/${entityId}/tags`
          : `/api/contacts/${entityId}/tags`;

        const applyRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_id: newTag.id }),
        });

        if (applyRes.ok) {
          onTagsChange([...appliedTags, newTag]);
          setActionMessage({ type: 'success', text: `Created & applied "${newTag.name}"` });
        }

        setNewTagName('');
        setNewTagEmoji('🏷️');
        setNewTagColor('blue');
        setShowCreateForm(false);
      } else {
        const data = await res.json();
        setActionMessage({ type: 'error', text: data.error || 'Failed to create tag' });
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      setActionMessage({ type: 'error', text: 'Network error' });
    } finally {
      setCreating(false);
    }
  };

  // Start editing a tag
  const startEditTag = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagEmoji(tag.emoji);
    setEditTagColor(tag.color);
    setShowCreateForm(false);
    setDeletingTag(null);
  };

  // Save edited tag
  const handleSaveEdit = async () => {
    if (!editingTag || !editTagName.trim()) return;
    setSaving(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: editingTag.id,
          name: editTagName.trim(),
          emoji: editTagEmoji,
          color: editTagColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTag = data.tag;

        // Update in userTags
        setUserTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));

        // Update in appliedTags if it was applied
        if (isTagApplied(updatedTag.id)) {
          onTagsChange(appliedTags.map(t => t.id === updatedTag.id ? updatedTag : t));
        }

        setActionMessage({ type: 'success', text: `Updated "${updatedTag.name}"` });
        setEditingTag(null);
      } else {
        const data = await res.json();
        setActionMessage({ type: 'error', text: data.error || 'Failed to update tag' });
      }
    } catch (error) {
      console.error('Failed to update tag:', error);
      setActionMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  // Confirm delete
  const confirmDelete = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTag(tag);
    setEditingTag(null);
    setShowCreateForm(false);
  };

  // Delete tag
  const handleDeleteTag = async () => {
    if (!deletingTag) return;
    setDeleting(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/tags?id=${deletingTag.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from userTags
        setUserTags(prev => prev.filter(t => t.id !== deletingTag.id));

        // Remove from appliedTags if it was applied
        if (isTagApplied(deletingTag.id)) {
          onTagsChange(appliedTags.filter(t => t.id !== deletingTag.id));
        }

        setActionMessage({ type: 'success', text: `Deleted "${deletingTag.name}"` });
        setDeletingTag(null);
      } else {
        const data = await res.json();
        setActionMessage({ type: 'error', text: data.error || 'Failed to delete tag' });
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
      setActionMessage({ type: 'error', text: 'Network error' });
    } finally {
      setDeleting(false);
    }
  };

  const colorClasses = getTagColorClasses(newTagColor);
  const editColorClasses = getTagColorClasses(editTagColor);

  // Custom tags (excluding presets that are in the presets list)
  const customTags = userTags.filter(t => !presets.some(p => p.name === t.name));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span>🏷️</span>
        <span>Add tag</span>
        {appliedTags.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {appliedTags.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header with Status */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">🏷️ Manage Tags</h3>
              {loading && (
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {actionMessage && (
              <div className={`mt-2 text-xs font-medium px-2 py-1 rounded ${
                actionMessage.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {actionMessage.text}
              </div>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto">
            {/* Delete Confirmation */}
            {deletingTag && (
              <div className="p-3 bg-red-50 border-b border-red-100">
                <p className="text-sm text-red-800 mb-2">
                  Delete <strong>"{deletingTag.emoji} {deletingTag.name}"</strong>?
                </p>
                <p className="text-xs text-red-600 mb-3">
                  This will remove the tag from all links and contacts.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingTag(null)}
                    className="flex-1 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTag}
                    disabled={deleting}
                    className="flex-1 py-1.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editingTag && !deletingTag && (
              <div className="p-3 bg-blue-50 border-b border-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                  ✏️ Edit Tag
                </p>

                {/* Emoji Picker */}
                <div className="mb-2">
                  <label className="text-xs text-slate-500 mb-1 block">Emoji</label>
                  <div className="flex flex-wrap gap-1">
                    {TAG_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditTagEmoji(emoji)}
                        className={`w-7 h-7 text-base rounded-lg transition-all cursor-pointer ${
                          editTagEmoji === emoji
                            ? 'bg-blue-100 ring-2 ring-blue-400'
                            : 'hover:bg-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div className="mb-2">
                  <label className="text-xs text-slate-500 mb-1 block">Name</label>
                  <input
                    type="text"
                    value={editTagName}
                    onChange={(e) => setEditTagName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={30}
                  />
                </div>

                {/* Color Picker */}
                <div className="mb-2">
                  <label className="text-xs text-slate-500 mb-1 block">Color</label>
                  <div className="flex gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setEditTagColor(color.name)}
                        className={`w-6 h-6 rounded-full ${color.dot} transition-all cursor-pointer ${
                          editTagColor === color.name
                            ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {editTagName.trim() && (
                  <div className="mb-3">
                    <label className="text-xs text-slate-500 mb-1 block">Preview</label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium ${editColorClasses.bg} ${editColorClasses.text}`}>
                      {editTagEmoji} {editTagName}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    className="flex-1 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editTagName.trim() || saving}
                    className="flex-1 py-1.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {/* Preset Tags */}
            {!editingTag && !deletingTag && (
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  📌 Quick Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const applied = isPresetApplied(preset);
                    const colors = getTagColorClasses(preset.color);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        disabled={loading}
                        className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          applied
                            ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-blue-400`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.name}</span>
                        {applied && <span className="text-green-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User's Custom Tags */}
            {!editingTag && !deletingTag && customTags.length > 0 && (
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  🎨 Your Custom Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => {
                    const applied = isTagApplied(tag.id);
                    const colors = getTagColorClasses(tag.color);
                    return (
                      <div key={tag.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          disabled={loading}
                          className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 pr-14 ${
                            applied
                              ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-blue-400`
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.name}</span>
                          {applied && <span className="text-green-600 font-bold">✓</span>}
                        </button>

                        {/* Edit/Delete buttons */}
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => startEditTag(tag, e)}
                            className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-blue-600"
                            title="Edit tag"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => confirmDelete(tag, e)}
                            className="p-1 rounded hover:bg-white/80 text-slate-500 hover:text-red-600"
                            title="Delete tag"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            {!editingTag && !deletingTag && (
              <div className="p-3">
                {!showCreateForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    ➕ Create New Tag
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      ➕ Create New Tag
                    </p>

                    {/* Emoji Picker */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Emoji</label>
                      <div className="flex flex-wrap gap-1">
                        {TAG_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewTagEmoji(emoji)}
                            className={`w-8 h-8 text-lg rounded-lg transition-all cursor-pointer ${
                              newTagEmoji === emoji
                                ? 'bg-blue-100 ring-2 ring-blue-400'
                                : 'hover:bg-slate-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name Input */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Enter tag name..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={30}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagName.trim()) {
                            handleCreateTag();
                          }
                        }}
                      />
                    </div>

                    {/* Color Picker */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Color</label>
                      <div className="flex gap-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setNewTagColor(color.name)}
                            className={`w-7 h-7 rounded-full ${color.dot} transition-all cursor-pointer ${
                              newTagColor === color.name
                                ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                                : 'hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {newTagName.trim() && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Preview</label>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                          {newTagEmoji} {newTagName}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewTagName('');
                        }}
                        className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim() || creating}
                        className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {creating ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </span>
                        ) : (
                          'Create Tag'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
