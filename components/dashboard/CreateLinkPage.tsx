'use client';

import React, { useState, useEffect } from 'react';
import LinkConfigModal from '@/components/LinkConfigModal';

interface CreateLinkPageProps {
  defaultTab?: 'file' | 'site';
  onSuccess: () => void;
  onNavigateToMyLinks: () => void;
  onTabChange?: (tab: 'file' | 'site') => void;
}

interface LinkResult {
  fileId: string;
  slug: string;
  url: string;
}

export default function CreateLinkPage({ defaultTab = 'file', onSuccess, onNavigateToMyLinks, onTabChange }: CreateLinkPageProps) {
  const [mode, setMode] = useState<'file' | 'site'>(defaultTab);
  const [isDragging, setIsDragging] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [urlName, setUrlName] = useState('');

  // Update mode when defaultTab changes
  useEffect(() => {
    setMode(defaultTab);
  }, [defaultTab]);

  // Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingFileInfo, setPendingFileInfo] = useState<{
    file?: File;
    url?: string;
    name: string;
  } | null>(null);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLink, setCreatedLink] = useState<LinkResult | null>(null);

  const handleTabChange = (newMode: 'file' | 'site') => {
    setMode(newMode);
    if (onTabChange) {
      onTabChange(newMode);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      openConfigModal(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FILE SELECTED ===');
    const files = e.target.files;
    console.log('Files:', files);
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File name:', file.name, 'Type:', file.type, 'Size:', file.size);
      openConfigModal(file);
    }
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const openConfigModal = (file: File) => {
    console.log('Opening config modal for:', file.name);
    setPendingFileInfo({
      file,
      name: file.name
    });
    setShowConfigModal(true);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!externalUrl || !urlName) {
      alert('Please enter both URL and name');
      return;
    }

    setPendingFileInfo({
      url: externalUrl,
      name: urlName
    });
    setShowConfigModal(true);
  };

  const handleConfigComplete = (result: LinkResult) => {
    setShowConfigModal(false);
    setPendingFileInfo(null);
    setCreatedLink(result);
    setShowSuccess(true);
    setExternalUrl('');
    setUrlName('');
    onSuccess();
  };

  const handleConfigCancel = () => {
    setShowConfigModal(false);
    setPendingFileInfo(null);
  };

  const [copied, setCopied] = useState(false);

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedLink(null);
  };

  // Success View
  if (showSuccess && createdLink) {
    return (
      <div className="p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Link Created Successfully!</h1>
              <p className="text-green-100">Your trackable link is ready to share</p>
            </div>

            {/* Link Display */}
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Link</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="material-symbols-outlined text-blue-500">link</span>
                <span className="flex-1 text-slate-800 font-medium truncate">{createdLink.url}</span>
                <button
                  onClick={() => copyLink(createdLink.url)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  style={{ boxShadow: copied ? '0 4px 12px rgba(34, 197, 94, 0.4)' : undefined }}
                >
                  <span className="material-symbols-outlined text-lg">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={handleCreateAnother}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Create another link
              </button>
              <button
                onClick={onNavigateToMyLinks}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                View my links
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header - Centered */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create new link</h1>
        <p className="text-slate-600 mt-1">Upload a file or track an external website</p>
      </div>

      {/* Main Content - Centered */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => handleTabChange('file')}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-semibold transition-all ${
                    mode === 'file'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined">upload_file</span>
                  Upload file
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('site')}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-semibold transition-all ${
                    mode === 'site'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined">link</span>
                  Track site
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* File Upload Mode - BULLETPROOF: Input inside label as overlay */}
                {mode === 'file' && (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    {/* INVISIBLE FILE INPUT - Covers entire label area */}
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="*/*"
                    />

                    {/* Visual Content - underneath the invisible input */}
                    <div className="flex flex-col items-center justify-center min-h-[200px] pointer-events-none">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                        isDragging ? 'bg-blue-100' : 'bg-white shadow-md'
                      }`}>
                        <span className={`material-symbols-outlined text-3xl ${
                          isDragging ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                          cloud_upload
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-800 mb-2">
                        {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
                      </p>
                      <p className="text-slate-500 text-sm">
                        Documents, spreadsheets, images, videos, and more
                      </p>
                      <p className="text-slate-400 text-xs mt-3">
                        Maximum file size: 100MB
                      </p>
                    </div>
                  </label>
                )}

                {/* Track Site Mode */}
                {mode === 'site' && (
                  <form onSubmit={handleUrlSubmit} className="space-y-5">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-800">
                        Link Name
                      </label>
                      <input
                        type="text"
                        value={urlName}
                        onChange={(e) => setUrlName(e.target.value)}
                        placeholder="e.g., Product Demo Video"
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Give your link a name so you can find it easily
                      </p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-slate-800">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Paste the full URL including https://
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
                    >
                      Continue to Settings →
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Tips Sidebar - Takes 1 column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pro Tip */}
            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-500">lightbulb</span>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Pro tip</p>
                  <p className="text-blue-700 text-sm mt-1">
                    {mode === 'file'
                      ? 'Enable "Require email" to capture leads when viewers access your file.'
                      : 'Track who clicks your links and see detailed engagement analytics.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Supported Files - For File Upload Mode */}
            {mode === 'file' && (
              <div className="p-5 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-800 text-sm mb-4">Supported files</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>📄</span> Documents
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.pdf, .doc, .docx, .txt, .rtf</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>📊</span> Spreadsheets
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.xls, .xlsx, .csv</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>📽️</span> Presentations
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.ppt, .pptx, .key</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>🖼️</span> Images
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.jpg, .png, .gif, .webp, .svg</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>🎬</span> Videos
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.mp4, .mov, .avi, .webm</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>🎵</span> Audio
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.mp3, .wav, .ogg, .m4a</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span>💻</span> Code & Data
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 ml-6">.js, .ts, .py, .html, .css, .json</p>
                  </div>
                </div>
              </div>
            )}

            {/* Track Site Info - For Track Site Mode */}
            {mode === 'site' && (
              <>
                <div className="p-5 bg-white rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-800 text-sm mb-4">Supported sites</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>🎬</span> Video platforms
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 ml-6">YouTube, Vimeo, Loom, Wistia</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>📁</span> Cloud storage
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 ml-6">Google Drive, Dropbox, OneDrive</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>📝</span> Productivity tools
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 ml-6">Notion, Confluence, Google Docs</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>📱</span> Social media
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 ml-6">X, Facebook, Instagram, LinkedIn</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>🌐</span> Any website
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5 ml-6">Landing pages, blogs, portfolios, news</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-800 text-sm mb-3">How It Works</p>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                      <span>Paste any URL you want to track</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                      <span>Get a unique <span style={{ fontWeight: 600 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span> tracking link</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                      <span>Share it and track every click</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Link Configuration Modal */}
      {showConfigModal && pendingFileInfo && (
        <LinkConfigModal
          fileInfo={pendingFileInfo}
          onComplete={handleConfigComplete}
          onCancel={handleConfigCancel}
        />
      )}
    </div>
  );
}
