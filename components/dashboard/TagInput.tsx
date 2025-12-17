'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: string[];
  availableTags: Tag[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  placeholder?: string;
  disabled?: boolean;
}

const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function TagInput({
  selectedTags,
  availableTags,
  onChange,
  onCreateTag,
  placeholder = 'Add tags...',
  disabled = false,
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTagObjects = availableTags.filter(t => selectedTags.includes(t.id));
  const filteredTags = availableTags.filter(t =>
    !selectedTags.includes(t.id) &&
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
    setSearchQuery('');
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!searchQuery.trim() || !onCreateTag) return;
    setCreating(true);
    try {
      const newTag = await onCreateTag(searchQuery.trim(), newTagColor);
      onChange([...selectedTags, newTag.id]);
      setSearchQuery('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setCreating(false);
    }
  };

  const showCreateOption = searchQuery.trim() &&
    !availableTags.some(t => t.name.toLowerCase() === searchQuery.toLowerCase()) &&
    onCreateTag;

  return (
    <div ref={containerRef} className="relative">
      {/* Input Area */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`flex flex-wrap items-center gap-2 min-h-[42px] px-3 py-2 rounded-xl border transition-colors ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white cursor-text'}`}
      >
        {/* Selected Tags */}
        {selectedTagObjects.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            {!disabled && (
              <button
                onClick={(e) => handleRemoveTag(tag.id, e)}
                className="hover:bg-white/20 rounded p-0.5"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </span>
        ))}

        {/* Search Input */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
          {/* Create New Tag Form */}
          {showCreateForm && showCreateOption && (
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-2">Create &quot;{searchQuery}&quot;</p>
              <div className="flex items-center gap-2 mb-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewTagColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newTagColor === color.value ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <button
                onClick={handleCreateTag}
                disabled={creating}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create tag'}
              </button>
            </div>
          )}

          {/* Quick Create Option */}
          {showCreateOption && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm hover:bg-blue-50 border-b border-slate-100"
            >
              <span className="material-symbols-outlined text-blue-500">add_circle</span>
              <span className="text-slate-700">Create tag &quot;{searchQuery}&quot;</span>
            </button>
          )}

          {/* Available Tags */}
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-slate-700">{tag.name}</span>
              </button>
            ))
          ) : (
            !showCreateOption && (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                {searchQuery ? 'No matching tags' : 'No tags available'}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Simple tag display component
export function TagBadge({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:bg-white/20 rounded p-0.5">
          <span className="material-symbols-outlined text-xs">close</span>
        </button>
      )}
    </span>
  );
}
