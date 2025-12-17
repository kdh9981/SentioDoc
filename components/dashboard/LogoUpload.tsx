'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface LogoUploadProps {
  onLogoChange?: (logoUrl: string | null) => void;
}

export default function LogoUpload({ onLogoChange }: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [canCustomize, setCanCustomize] = useState(false);
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLogo = useCallback(async () => {
    try {
      const response = await fetch('/api/user/logo');
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.logoUrl);
        setCanCustomize(data.canCustomize);
        setTier(data.tier);
      }
    } catch (err) {
      console.error('Failed to fetch logo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be under 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/user/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLogoUrl(data.logoUrl);
      onLogoChange?.(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove your custom logo?')) return;

    try {
      const response = await fetch('/api/user/logo', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove logo');
      setLogoUrl(null);
      onLogoChange?.(null);
    } catch (err) {
      setError('Failed to remove logo');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
          <div className="h-20 w-20 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800">Custom logo</h3>
          <p className="text-sm text-slate-600 mt-1">
            Your logo will appear on all viewer pages
          </p>
        </div>
        {!canCustomize && (
          <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">lock</span>
            Pro feature
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Current Logo / Upload Area */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <div className="relative group">
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              <Image
                src={logoUrl}
                alt="Custom logo"
                width={80}
                height={80}
                className="object-contain max-h-full max-w-full"
              />
            </div>
            {canCustomize && (
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-slate-400">image</span>
          </div>
        )}

        <div className="flex-1">
          {canCustomize ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
                {uploading ? 'Uploading...' : logoUrl ? 'Change logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                PNG, JPG, or SVG. Max 2MB. Recommended: 200x60px
              </p>
            </>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-600 mb-2">
                Upgrade to add your own branding
              </p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-1 text-blue-500 text-sm font-semibold hover:text-blue-600"
              >
                View plans
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {logoUrl && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm font-semibold text-slate-700 mb-3">Preview</p>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Image
                src={logoUrl}
                alt="Logo preview"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-slate-600 text-sm">Your viewer pages will show this logo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
