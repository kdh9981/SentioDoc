'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTagColorClasses } from '@/lib/tag-presets';

export interface Tag {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface TagFilterProps {
  availableTags: Tag[]; // Only tags that exist in this section
  selectedTags: string[]; // Array of tag IDs
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

export default function TagFilter({
  availableTags,
  selectedTags,
  onTagsChange,
  className = '',
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  const selectedTagObjects = availableTags.filter(t => selectedTags.includes(t.id));

  // Don't render if no tags available
  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
          selectedTags.length > 0
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span>🏷️</span>
        <span>Tags</span>
        {selectedTags.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {selectedTags.length}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Filter by Tags</h3>
            {selectedTags.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto p-3">
            <div className="space-y-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                const colors = getTagColorClasses(tag.color);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? `${colors.bg} ${colors.text}`
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span>{tag.emoji}</span>
                    <span className="flex-1 text-left">{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Tags Preview */}
          {selectedTagObjects.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
              <div className="flex flex-wrap gap-1.5">
                {selectedTagObjects.map(tag => {
                  const colors = getTagColorClasses(tag.color);
                  return (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {tag.emoji} {tag.name}
                      <button
                        onClick={() => toggleTag(tag.id)}
                        className="hover:bg-black/10 rounded-full p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
