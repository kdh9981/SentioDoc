'use client';

import React from 'react';
import Logo from '@/components/Logo';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface SidebarProps {
  activePage: string;
  onNavigate?: (page: string) => void;
  usage?: {
    activeLinks: number;
    linksLimit: number;
    viewsThisMonth: number;
    viewsLimit: number;
    storageUsed: number;
    storageLimit: number;
  };
  tier?: string;
}

export default function Sidebar({ activePage, onNavigate, usage, tier }: SidebarProps) {
  const isActive = (page: string) => activePage === page;

  const navItemClass = (page: string) =>
    `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-all cursor-pointer ${
      isActive(page)
        ? 'bg-gd-blue text-white shadow-md'
        : 'text-gd-grey hover:bg-blue-50 hover:text-gd-blue'
    }`;

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3">
      {/* Logo */}
      <div className="flex h-12 items-center px-1">
        <Logo variant="full" size="md" linkTo="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-0.5">
        <button
          onClick={() => onNavigate?.('overview')}
          className={navItemClass('overview')}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span className="flex-1 text-left">Dashboard</span>
          <InfoTooltip content={getMetricDefinition('dashboard')} position="right" size="sm" />
        </button>

        {/* Create links section */}
        <p className="text-section-label mt-4 px-2.5">Create links</p>

        <button onClick={() => onNavigate?.('upload-file')} className={navItemClass('upload-file')}>
          <span className="material-symbols-outlined text-lg">upload_file</span>
          <span className="flex-1 text-left">Upload file</span>
          <InfoTooltip content={getMetricDefinition('uploadFile')} position="right" size="sm" />
        </button>

        <button onClick={() => onNavigate?.('track-site')} className={navItemClass('track-site')}>
          <span className="material-symbols-outlined text-lg">link</span>
          <span className="flex-1 text-left">Track site</span>
          <InfoTooltip content={getMetricDefinition('trackSite')} position="right" size="sm" />
        </button>

        {/* View links section */}
        <p className="text-section-label mt-4 px-2.5">View links</p>

        <button onClick={() => onNavigate?.('my-links')} className={navItemClass('my-links')}>
          <span className="material-symbols-outlined text-lg">folder_open</span>
          <span className="flex-1 text-left">My links</span>
          <InfoTooltip content={getMetricDefinition('myLinks')} position="right" size="sm" />
        </button>

        <button onClick={() => onNavigate?.('favorites')} className={navItemClass('favorites')}>
          <span className="material-symbols-outlined text-lg">star</span>
          <span className="flex-1 text-left">Favorites</span>
          <InfoTooltip content={getMetricDefinition('favorites')} position="right" size="sm" />
        </button>

        {/* Manage section */}
        <p className="text-section-label mt-4 px-2.5">Manage</p>

        <button onClick={() => onNavigate?.('contacts')} className={navItemClass('contacts')}>
          <span className="material-symbols-outlined text-lg">group</span>
          <span className="flex-1 text-left">Contacts</span>
          <InfoTooltip content={getMetricDefinition('contacts')} position="right" size="sm" />
        </button>

        <button onClick={() => onNavigate?.('analytics')} className={navItemClass('analytics')}>
          <span className="material-symbols-outlined text-lg">analytics</span>
          <span className="flex-1 text-left">Analytics</span>
          <InfoTooltip content={getMetricDefinition('analytics')} position="right" size="sm" />
        </button>

        <button onClick={() => onNavigate?.('domains')} className={navItemClass('domains')}>
          <span className="material-symbols-outlined text-lg">language</span>
          <span className="flex-1 text-left">Domains</span>
          <InfoTooltip content={getMetricDefinition('domains')} position="right" size="sm" />
        </button>

        {/* Tags hidden for MVP - re-enable later
        <button onClick={() => onNavigate?.('tags')} className={navItemClass('tags')}>
          <span className="material-symbols-outlined text-lg">label</span>
          <span>Tags</span>
        </button>
        */}

        <button onClick={() => onNavigate?.('settings')} className={navItemClass('settings')}>
          <span className="material-symbols-outlined text-lg">settings</span>
          <span className="flex-1 text-left">Settings</span>
          <InfoTooltip content={getMetricDefinition('settings')} position="right" size="sm" />
        </button>
      </nav>

      {/* Compact Usage Card */}
      <div className="mt-auto flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <p className="text-nav font-medium text-slate-800">Usage</p>
            <InfoTooltip content={getMetricDefinition('usage')} position="right" size="sm" />
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            tier === 'pro' ? 'bg-purple-100 text-purple-700' :
            tier === 'starter' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-200 text-slate-700'
          }`}>
            {tier ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase() : 'Free'}
          </span>
        </div>

        {/* Links */}
        <div>
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="text-meta text-slate-600">Links</span>
              <InfoTooltip content={getMetricDefinition('links')} position="right" size="sm" />
            </div>
            <span className="text-meta font-medium text-slate-800">{usage?.activeLinks || 0}/{usage?.linksLimit || 10}</span>
          </div>
          <div className="w-full rounded-full bg-slate-100 h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
              style={{ width: `${Math.min(((usage?.activeLinks || 0) / (usage?.linksLimit || 10)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Views */}
        <div>
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="text-meta text-slate-600">Views</span>
              <InfoTooltip content={getMetricDefinition('views')} position="right" size="sm" />
            </div>
            <span className="text-meta font-medium text-slate-800">{usage?.viewsThisMonth || 0}/{usage?.viewsLimit ? (usage.viewsLimit / 1000) + 'K' : '5K'}</span>
          </div>
          <div className="w-full rounded-full bg-slate-100 h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${Math.min(((usage?.viewsThisMonth || 0) / (usage?.viewsLimit || 5000)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between mb-1">
            <div className="flex items-center gap-1">
              <span className="text-meta text-slate-600">Storage</span>
              <InfoTooltip content={getMetricDefinition('storage')} position="right" size="sm" />
            </div>
            <span className="text-meta font-medium text-slate-800">{formatStorage(usage?.storageUsed || 0)}/{formatStorage(usage?.storageLimit || 104857600)}</span>
          </div>
          <div className="w-full rounded-full bg-slate-100 h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
              style={{ width: `${Math.min(((usage?.storageUsed || 0) / (usage?.storageLimit || 104857600)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('settings')}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 text-button text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-sm">bolt</span>
          Upgrade
        </button>
      </div>
    </aside>
  );
}
