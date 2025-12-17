'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TextViewerProps {
  fileId: string;
  fileName: string;
  content?: string;        // Direct content (optional)
  textSrc?: string;        // URL to fetch content from (optional)
  accessLogId: string;
  isCode?: boolean;
  allowDownload?: boolean;
  allowPrint?: boolean;
  showBranding?: boolean;
}

export default function TextViewer({
  fileId,
  fileName,
  content: initialContent,
  textSrc,
  accessLogId,
  isCode = false,
  allowDownload = true,
  allowPrint = true,
  showBranding = true,
}: TextViewerProps) {
  const [content, setContent] = useState(initialContent || '');
  const [loading, setLoading] = useState(!initialContent && !!textSrc);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================
  // TRACKING REFS (avoid stale closures)
  // ============================================
  const sessionStartTime = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const copyAttemptedRef = useRef<boolean>(false);
  const hasDownloadedRef = useRef<boolean>(false);
  const downloadCountRef = useRef<number>(0);
  const hasSentFinalRef = useRef<boolean>(false);
  const contentLengthRef = useRef<number>(0);

  // Debounce refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 1000;

  // Fetch content from URL if textSrc is provided
  useEffect(() => {
    if (textSrc && !initialContent) {
      setLoading(true);
      fetch(textSrc)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.text();
        })
        .then(text => {
          setContent(text);
          contentLengthRef.current = text.length;
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      contentLengthRef.current = (initialContent || '').length;
    }
  }, [textSrc, initialContent]);

  // ============================================
  // BUILD SESSION DATA
  // ============================================
  const buildSessionData = useCallback(() => {
    const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    // Calculate engagement score for text/code
    let engagementScore = 0;
    // Scroll depth (0-35 points)
    engagementScore += Math.min(35, (maxScrollDepthRef.current / 100) * 35);
    // Time spent (0-25 points) - 30 seconds = max
    engagementScore += Math.min(25, (totalDuration / 30) * 25);
    // Copy interaction (0-20 points)
    if (copyAttemptedRef.current) {
      engagementScore += 20;
    }
    // Download (0-20 points)
    if (hasDownloadedRef.current) {
      engagementScore += 20;
    }
    engagementScore = Math.round(Math.min(100, engagementScore));

    return {
      accessLogId,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      // Text has 1 "page"
      pagesViewedCount: 1,
      maxPageReached: 1,
      totalPages: 1,
      exitPage: 1,
      completionPercentage: maxScrollDepthRef.current,
      downloaded: hasDownloadedRef.current,
      downloadCount: downloadCountRef.current,
      engagementScore,
      intentSignal: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
      // Text-specific metadata
      textMetadata: {
        scrollDepth: maxScrollDepthRef.current,
        copyAttempted: copyAttemptedRef.current,
        isCode,
        contentLength: contentLengthRef.current,
        lineCount: content.split('\n').length,
      },
    };
  }, [accessLogId, content, isCode]);

  // ============================================
  // SEND SESSION DATA
  // ============================================
  const sendSessionData = useCallback((isFinalSend: boolean = false) => {
    if (!accessLogId) return;
    if (hasSentFinalRef.current && isFinalSend) return;

    if (isFinalSend) {
      hasSentFinalRef.current = true;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    }

    const data = buildSessionData();
    console.log(`[TextViewer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

    if (isFinalSend && navigator.sendBeacon) {
      const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
      console.log('[TextViewer] sendBeacon result:', success);
    } else {
      fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: isFinalSend,
      }).catch(err => console.error('[TextViewer] Send error:', err));
    }
  }, [accessLogId, buildSessionData]);

  // ============================================
  // DEBOUNCED SEND
  // ============================================
  const debouncedSend = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      sendSessionData(false);
    }, DEBOUNCE_MS);
  }, [sendSessionData]);

  // ============================================
  // SCROLL TRACKING
  // ============================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 100;

      if (scrollPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollPercent;
        // Debounce on significant scroll milestones
        if (scrollPercent % 25 === 0) {
          debouncedSend();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [debouncedSend]);

  // ============================================
  // COPY DETECTION
  // ============================================
  useEffect(() => {
    const handleCopy = () => {
      if (!copyAttemptedRef.current) {
        copyAttemptedRef.current = true;
        console.log('[TextViewer] Copy detected');
        debouncedSend();
      }
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [debouncedSend]);

  // ============================================
  // CLEANUP & FINAL SEND
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendSessionData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendSessionData(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      sendSessionData(true);
    };
  }, [sendSessionData]);

  // ============================================
  // DOWNLOAD HANDLER - IMMEDIATE TRACKING
  // ============================================
  const handleDownload = async () => {
    console.log('[TextViewer] Download button clicked');
    setDownloading(true);

    // Track download IMMEDIATELY (critical action)
    hasDownloadedRef.current = true;
    downloadCountRef.current += 1;

    // Send immediate update for download
    const downloadData = {
      accessLogId,
      downloaded: true,
      downloadCount: downloadCountRef.current,
      isDownloaded: true,
    };

    fetch('/api/viewer/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(downloadData),
    }).catch(err => console.error('[TextViewer] Download track error:', err));

    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`[TextViewer] Download complete, count=${downloadCountRef.current}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const lines = content.split('\n');

  // ============================================
  // BRANDING COMPONENT
  // ============================================
  const Branding = () => {
    if (!showBranding) return null;
    return (
      <>
        <a
          href="https://linklens.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 99999,
            textDecoration: 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'white',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            <img
              src="/logo.png"
              alt="LinkLens"
              style={{ height: '28px', width: 'auto' }}
            />
          </div>
        </a>

        <a
          href="https://linklens.tech"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            textDecoration: 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            borderRadius: '999px',
            padding: '10px 20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Powered by</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span>
          </div>
        </a>
      </>
    );
  };

  // ============================================
  // CONTROL BAR
  // ============================================
  const ControlBar = () => {
    if (!allowDownload && !allowPrint) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 99999,
        display: 'flex',
        gap: '8px',
      }}>
        {allowPrint && (
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'white',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
        {allowDownload && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              cursor: downloading ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0a',
        color: 'white',
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #27272a',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ color: '#94a3b8' }}>Loading file...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0a',
        color: 'white',
        gap: '16px',
      }}>
        <div style={{ fontSize: '48px' }}>!</div>
        <h2 style={{ margin: 0 }}>Failed to load file</h2>
        <p style={{ color: '#94a3b8' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0a',
      color: 'white',
    }}>
      <Branding />
      <ControlBar />

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        paddingTop: '70px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{fileName}</h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {lines.length} lines - {maxScrollDepthRef.current}% scrolled
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          paddingBottom: '80px',
        }}
      >
        <pre style={{
          margin: 0,
          fontFamily: isCode ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' : 'inherit',
          fontSize: '14px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: isCode ? '#18181b' : 'transparent',
          padding: isCode ? '20px' : 0,
          borderRadius: isCode ? '12px' : 0,
        }}>
          {isCode ? (
            <code>{content}</code>
          ) : (
            content
          )}
        </pre>
      </div>
    </div>
  );
}
