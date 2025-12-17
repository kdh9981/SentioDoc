'use client';

import React from 'react';

interface FileNotFoundProps {
  onBack: () => void;
  onGoToFiles: () => void;
}

export default function FileNotFound({ onBack, onGoToFiles }: FileNotFoundProps) {
  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">📄</span>
          <span className="absolute text-2xl ml-12 mt-8">❌</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          File not found
        </h1>

        {/* Description */}
        <p className="text-slate-600 mb-2">
          This file may have been deleted or moved.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Don't worry — your contacts and analytics data are still safe.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Good to know</p>
              <p className="text-sm text-slate-600 mt-1">
                Viewer contacts from this file are preserved in your Contacts page.
                You can still follow up with leads who viewed this content.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Go back
          </button>
          <button
            onClick={onGoToFiles}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <span className="material-symbols-outlined text-xl">folder</span>
            View all files
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <button
          onClick={() => window.location.href = '/dashboard?page=contacts'}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">group</span>
          View contacts
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => window.location.href = '/dashboard?page=analytics'}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          View analytics
        </button>
      </div>
    </div>
  );
}
