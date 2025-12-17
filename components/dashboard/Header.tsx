'use client';

import React, { useState } from 'react';
import GlobalPeriodSelector from './GlobalPeriodSelector';

const MENU_STRUCTURE: Record<string, { section: string; label: string }> = {
  'overview': { section: 'Dashboard', label: 'Dashboard' },
  'upload-file': { section: 'Create links', label: 'Upload file' },
  'track-site': { section: 'Create links', label: 'Track site' },
  'my-links': { section: 'View links', label: 'My links' },
  'favorites': { section: 'View links', label: 'Favorites' },
  'contacts': { section: 'Manage', label: 'Contacts' },
  'domains': { section: 'Manage', label: 'Domains' },
  'tags': { section: 'Manage', label: 'Tags' },
  'settings': { section: 'Manage', label: 'Settings' },
  'file-detail': { section: 'View links', label: 'Link details' },
  'contact-detail': { section: 'Manage', label: 'Contact details' },
};

// Pages that should show the period selector
const PAGES_WITH_PERIOD_SELECTOR = ['overview', 'my-links', 'favorites', 'file-detail'];

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onSignOut?: () => void;
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export default function Header({ userName, userEmail, userAvatar, onSignOut, onNavigate, currentPage = 'overview' }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || '?';

  const pageInfo = MENU_STRUCTURE[currentPage] || { section: 'Dashboard', label: 'Overview' };
  const showPeriodSelector = PAGES_WITH_PERIOD_SELECTOR.includes(currentPage);

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left - Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gd-light-grey">{pageInfo.section}</span>
        <span className="text-slate-300">&rsaquo;</span>
        <span className="font-medium text-slate-700">{pageInfo.label}</span>
      </div>

      {/* Center - Period Selector (when applicable) */}
      <div className="flex flex-1 justify-center px-4">
        {showPeriodSelector ? (
          <GlobalPeriodSelector onUpgradeClick={() => onNavigate?.('settings')} />
        ) : (
          <div className="flex w-full max-w-md items-stretch rounded-xl bg-slate-100 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="flex items-center justify-center pl-4 text-gd-light-grey">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-2.5 text-sm text-gd-black placeholder:text-gd-light-grey focus:outline-none"
              placeholder="Search files, contacts..."
            />
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg text-gd-grey hover:bg-slate-100 hover:text-gd-black transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-all"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm ring-2 ring-slate-200">
                {initials}
              </div>
            )}
            <span className="material-symbols-outlined text-gd-grey">expand_more</span>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-slate-800">{userName}</p>
                  <p className="text-xs text-gd-grey truncate">{userEmail}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { onNavigate?.('settings'); setShowDropdown(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    Settings
                  </button>
                  <button
                    onClick={() => { onNavigate?.('settings'); setShowDropdown(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">help</span>
                    Help & support
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => { onSignOut?.(); setShowDropdown(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upgrade Button */}
        <button
          onClick={() => onNavigate?.('settings')}
          className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 text-sm font-bold text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
        >
          Upgrade
        </button>
      </div>
    </header>
  );
}
