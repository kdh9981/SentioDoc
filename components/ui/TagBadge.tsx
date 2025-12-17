'use client';

import React from 'react';
import { getTagColorClasses } from '@/lib/tag-presets';

interface TagBadgeProps {
  name: string;
  emoji?: string;
  color: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export default function TagBadge({
  name,
  emoji = '🏷️',
  color,
  size = 'md',
  onRemove
}: TagBadgeProps) {
  const colors = getTagColorClasses(color);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <span>{emoji}</span>
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// TagList component for displaying multiple tags
interface TagListProps {
  tags: Array<{ id: string; name: string; emoji?: string; color: string }>;
  size?: 'sm' | 'md';
  onRemove?: (tagId: string) => void;
  maxVisible?: number;
}

export function TagList({ tags, size = 'sm', onRemove, maxVisible = 3 }: TagListProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = tags.length - visibleTags.length;

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          emoji={tag.emoji}
          color={tag.color}
          size={size}
          onRemove={onRemove ? () => onRemove(tag.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className={`text-slate-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}
