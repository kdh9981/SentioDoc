'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  LayoutDashboard,
  Upload,
  Link as LinkIcon,
  FolderOpen,
  Star,
  Users,
  Globe,
  Settings,
  Zap,
} from 'lucide-react';

interface DashboardSidebarProps {
  activePage: string;
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

export default function DashboardSidebar({ activePage, usage, tier }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (page: string) => activePage === page;

  const navItemClass = (page: string) =>
    `group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-all ${
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
        <Link href="/dashboard" className={navItemClass('overview')}>
          <LayoutDashboard size={18} strokeWidth={1.75} />
          <span>Dashboard</span>
        </Link>

        {/* Create links Section */}
        <p className="text-section-label mt-4 px-2.5">Create links</p>

        <Link href="/dashboard/upload" className={navItemClass('upload-file')}>
          <Upload size={18} strokeWidth={1.75} />
          <span>Upload file</span>
        </Link>

        <Link href="/dashboard/track" className={navItemClass('track-site')}>
          <LinkIcon size={18} strokeWidth={1.75} />
          <span>Track site</span>
        </Link>

        {/* View links Section */}
        <p className="text-section-label mt-4 px-2.5">View links</p>

        <Link href="/dashboard/links" className={navItemClass('my-links')}>
          <FolderOpen size={18} strokeWidth={1.75} />
          <span>My links</span>
        </Link>

        <Link href="/dashboard/favorites" className={navItemClass('favorites')}>
          <Star size={18} strokeWidth={1.75} />
          <span>Favorites</span>
        </Link>

        {/* Manage Section */}
        <p className="text-section-label mt-4 px-2.5">Manage</p>

        <Link href="/dashboard/contacts" className={navItemClass('contacts')}>
          <Users size={18} strokeWidth={1.75} />
          <span>Contacts</span>
        </Link>

        <Link href="/dashboard/domains" className={navItemClass('domains')}>
          <Globe size={18} strokeWidth={1.75} />
          <span>Domains</span>
        </Link>

        {/* Tags hidden for MVP - re-enable later
        <Link href="/dashboard/tags" className={navItemClass('tags')}>
          <Tag size={18} strokeWidth={1.75} />
          <span>Tags</span>
        </Link>
        */}

        <Link href="/dashboard/settings" className={navItemClass('settings')}>
          <Settings size={18} strokeWidth={1.75} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Compact Usage Card */}
      <div className="mt-auto flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-gd-black">Usage</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            tier === 'pro' ? 'bg-purple-100 text-purple-700' :
            tier === 'starter' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-200 text-gd-grey'
          }`}>
            {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Free'}
          </span>
        </div>

        {/* Links */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gd-grey">Links</span>
            <span className="font-medium text-gd-black">{usage?.activeLinks || 0}/{usage?.linksLimit || 10}</span>
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
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gd-grey">Views</span>
            <span className="font-medium text-gd-black">{usage?.viewsThisMonth || 0}/{usage?.viewsLimit ? (usage.viewsLimit / 1000) + 'K' : '5K'}</span>
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
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gd-grey">Storage</span>
            <span className="font-medium text-gd-black">{formatStorage(usage?.storageUsed || 0)}/{formatStorage(usage?.storageLimit || 104857600)}</span>
          </div>
          <div className="w-full rounded-full bg-slate-100 h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
              style={{ width: `${Math.min(((usage?.storageUsed || 0) / (usage?.storageLimit || 104857600)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <Link
          href="/dashboard/settings"
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 text-xs font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
        >
          <Zap size={14} strokeWidth={2} />
          Upgrade
        </Link>
      </div>
    </aside>
  );
}
