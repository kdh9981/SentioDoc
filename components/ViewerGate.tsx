'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ViewerGateProps {
  fileId: string;
  fileName: string;
  mimeType?: string;
  isExternalUrl?: boolean;
  requireEmail?: boolean;
  requireName?: boolean;
  requirePassword?: boolean;
  onAccessGranted: (accessLogId: string) => void;
}

// Helper to get file type info for dynamic icon and text
function getFileTypeInfo(mimeType: string | undefined, isExternalUrl: boolean, fileName: string) {
  // External URL (Track Site)
  if (isExternalUrl) {
    return {
      icon: 'link',
      text: 'Enter your details to access this link',
      buttonText: 'Access link',
      loadingText: 'Loading link...',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    };
  }

  const mime = mimeType?.toLowerCase() || '';
  const name = fileName?.toLowerCase() || '';

  // Video
  if (mime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi', '.mkv'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'movie',
      text: 'Enter your details to watch this video',
      buttonText: 'Watch video',
      loadingText: 'Loading video...',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    };
  }

  // Audio
  if (mime.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg', '.flac'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'music_note',
      text: 'Enter your details to listen to this audio',
      buttonText: 'Listen now',
      loadingText: 'Loading audio...',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    };
  }

  // Image
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'image',
      text: 'Enter your details to view this image',
      buttonText: 'View image',
      loadingText: 'Loading image...',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    };
  }

  // PDF
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return {
      icon: 'picture_as_pdf',
      text: 'Enter your details to view this document',
      buttonText: 'View document',
      loadingText: 'Loading document...',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600'
    };
  }

  // Spreadsheet
  if (mime.includes('spreadsheet') || mime.includes('excel') || ['.xlsx', '.xls', '.csv'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'table_chart',
      text: 'Enter your details to view this spreadsheet',
      buttonText: 'View spreadsheet',
      loadingText: 'Loading spreadsheet...',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    };
  }

  // Presentation
  if (mime.includes('presentation') || ['.pptx', '.ppt'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'slideshow',
      text: 'Enter your details to view this presentation',
      buttonText: 'View presentation',
      loadingText: 'Loading presentation...',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    };
  }

  // Document (Word, etc.)
  if (mime.includes('document') || mime.includes('msword') || ['.docx', '.doc', '.rtf'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'description',
      text: 'Enter your details to view this document',
      buttonText: 'View document',
      loadingText: 'Loading document...',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    };
  }

  // Text/Code files
  if (mime.startsWith('text/') || ['.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css', '.xml', '.yml', '.yaml'].some(ext => name.endsWith(ext))) {
    return {
      icon: 'article',
      text: 'Enter your details to view this file',
      buttonText: 'View file',
      loadingText: 'Loading file...',
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600'
    };
  }

  // Default
  return {
    icon: 'draft',
    text: 'Enter your details to view this file',
    buttonText: 'View file',
    loadingText: 'Loading file...',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-600'
  };
}

export default function ViewerGate({
  fileId,
  fileName,
  mimeType,
  isExternalUrl = false,
  requireEmail = false,
  requireName = false,
  requirePassword = false,
  onAccessGranted
}: ViewerGateProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoGranting, setAutoGranting] = useState(false);

  // Prevent double API calls in React Strict Mode
  const hasGrantedRef = useRef(false);

  // Get file type info for dynamic icon and text
  const fileInfo = getFileTypeInfo(mimeType, isExternalUrl, fileName);

  // If nothing is required, auto-grant access
  useEffect(() => {
    console.log('[ViewerGate] useEffect check:', { requireEmail, requireName, requirePassword, hasGranted: hasGrantedRef.current });

    if (!requireEmail && !requireName && !requirePassword && !hasGrantedRef.current) {
      console.log('[ViewerGate] Auto-granting access (no gates required)');
      hasGrantedRef.current = true;
      setAutoGranting(true);
      grantAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireEmail, requireName, requirePassword]);

  const grantAccess = async (submittedData?: { email?: string; name?: string; password?: string }) => {
    setLoading(true);
    setError('');

    console.log('[ViewerGate] Starting grantAccess for fileId:', fileId);
    console.log('[ViewerGate] Submitted data:', submittedData);

    try {
      console.log('[ViewerGate] Calling /api/viewer/access...');

      const response = await fetch('/api/viewer/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          email: submittedData?.email || null,
          name: submittedData?.name || null,
          password: submittedData?.password || null,
        }),
      });

      console.log('[ViewerGate] Response status:', response.status);

      const data = await response.json();
      console.log('[ViewerGate] Response data:', data);

      if (!response.ok) {
        console.error('[ViewerGate] API returned error:', data.error);
        if (data.error === 'Invalid password') {
          setError('Incorrect password. Please try again.');
        } else {
          setError(data.error || 'Access denied');
        }
        setAutoGranting(false);
        return;
      }

      // Success - grant access
      console.log('[ViewerGate] SUCCESS! accessLogId:', data.accessLogId);
      onAccessGranted(data.accessLogId || '');

    } catch (err) {
      console.error('[ViewerGate] FETCH ERROR:', err);
      setError('Something went wrong. Please try again.');
      setAutoGranting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate only the fields that are required
    if (requireName && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (requireEmail && !email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (requirePassword && !password.trim()) {
      setError('Please enter the password');
      return;
    }

    // All validations passed - grant access
    await grantAccess({
      email: email.trim() || undefined,
      name: name.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  // If no gates required, show loading with dynamic text
  if (autoGranting || (!requireEmail && !requireName && !requirePassword)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{fileInfo.loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Material Symbols stylesheet */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
      />

      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header with dynamic icon */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${fileInfo.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {requirePassword ? (
              <span className="material-symbols-outlined text-3xl text-amber-600">lock</span>
            ) : (
              <span className={`material-symbols-outlined text-3xl ${fileInfo.iconColor}`}>{fileInfo.icon}</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 break-words">{fileName}</h1>
          <p className="text-slate-600 mt-2 text-sm">
            {requirePassword && !requireEmail && !requireName
              ? 'This content is password protected'
              : fileInfo.text
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name FIRST */}
          {requireName && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Your name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                autoFocus={requireName}
              />
            </div>
          )}

          {/* Email SECOND */}
          {requireEmail && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                autoFocus={!requireName && requireEmail}
              />
            </div>
          )}

          {/* Password LAST */}
          {requirePassword && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                autoFocus={!requireName && !requireEmail && requirePassword}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : fileInfo.buttonText}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-6">
          Shared securely via <span className="font-medium"><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span>
        </p>
      </div>
    </div>
  );
}
