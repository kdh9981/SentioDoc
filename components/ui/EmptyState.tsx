'use client';

import { ReactNode } from 'react';

type EmptyStateType = 'no-files' | 'no-views' | 'no-contacts' | 'no-analytics' | 'no-results' | 'no-tags' | 'no-actions';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const defaultContent: Record<EmptyStateType, { icon: string; title: string; description: string }> = {
  'no-files': {
    icon: 'description',
    title: 'No links yet',
    description: 'Upload your first file to start tracking who views your content.'
  },
  'no-views': {
    icon: 'bar_chart',
    title: 'No views yet',
    description: 'Share your link to start tracking engagement. Views will appear here in real-time.'
  },
  'no-contacts': {
    icon: 'group',
    title: 'No contacts yet',
    description: "When viewers provide their email, they'll appear here as contacts you can track across all your content."
  },
  'no-analytics': {
    icon: 'analytics',
    title: 'Not enough data',
    description: 'Analytics will become available after your content receives more views.'
  },
  'no-results': {
    icon: 'inbox',
    title: 'No results found',
    description: "Try adjusting your search or filters to find what you're looking for."
  },
  'no-tags': {
    icon: 'label',
    title: 'No tags yet',
    description: 'Create tags to organize and categorize your files for easier management.'
  },
  'no-actions': {
    icon: 'task_alt',
    title: 'No actions needed',
    description: "You're all caught up! New recommended actions will appear here."
  }
};

export default function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-slate-400">
          {content.icon}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {title || content.title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {description || content.description}
      </p>
      {action}
    </div>
  );
}
