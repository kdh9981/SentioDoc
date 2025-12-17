'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ImageViewerProps {
  fileId: string;
  fileName: string;
  imageSrc: string;
  accessLogId: string;
  allowDownload?: boolean;
  showBranding?: boolean;
}

export default function ImageViewer({
  fileId,
  fileName,
  imageSrc,
  accessLogId,
  allowDownload = true,
  showBranding = true
}: ImageViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================
  // TRACKING REFS (avoid stale closures)
  // ============================================
  const sessionStartTime = useRef<number>(Date.now());
  const hasZoomedRef = useRef<boolean>(false);
  const hasFullscreenedRef = useRef<boolean>(false);
  const hasDownloadedRef = useRef<boolean>(false);
  const downloadCountRef = useRef<number>(0);
  const maxZoomRef = useRef<number>(1);
  const hasSentFinalRef = useRef<boolean>(false);

  // Debounce refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 1000;

  // ============================================
  // BUILD SESSION DATA
  // ============================================
  const buildSessionData = useCallback(() => {
    const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    // For images, completion is based on time (60 seconds = 100%)
    const completionPercentage = Math.min(100, Math.round((totalDuration / 60) * 100));

    // Calculate engagement score for images
    let engagementScore = 0;
    // Time spent (0-40 points) - 60 seconds = max
    engagementScore += Math.min(40, (totalDuration / 60) * 40);
    // Zoom interaction (0-20 points)
    if (hasZoomedRef.current) {
      engagementScore += 15;
      // Extra points for zooming in more
      engagementScore += Math.min(5, (maxZoomRef.current - 1) * 5);
    }
    // Fullscreen (0-15 points)
    if (hasFullscreenedRef.current) {
      engagementScore += 15;
    }
    // Download (0-25 points)
    if (hasDownloadedRef.current) {
      engagementScore += 25;
    }
    engagementScore = Math.round(Math.min(100, engagementScore));

    return {
      accessLogId,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      // Images don't have pages, but set these for consistency
      pagesViewedCount: 1,
      maxPageReached: 1,
      totalPages: 1,
      exitPage: 1,
      completionPercentage,
      downloaded: hasDownloadedRef.current,
      downloadCount: downloadCountRef.current,
      engagementScore,
      intentSignal: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
      // Image-specific metadata
      imageMetadata: {
        hasZoomed: hasZoomedRef.current,
        maxZoom: maxZoomRef.current,
        hasFullscreened: hasFullscreenedRef.current,
      },
    };
  }, [accessLogId]);

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
    console.log(`[ImageViewer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

    if (isFinalSend && navigator.sendBeacon) {
      const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
      console.log('[ImageViewer] sendBeacon result:', success);
    } else {
      fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: isFinalSend,
      }).catch(err => console.error('[ImageViewer] Send error:', err));
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
  // FULLSCREEN DETECTION
  // ============================================
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs && !hasFullscreenedRef.current) {
        hasFullscreenedRef.current = true;
        debouncedSend();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [debouncedSend]);

  // ============================================
  // ZOOM HANDLERS
  // ============================================
  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 0.25, 3);
      if (!hasZoomedRef.current) {
        hasZoomedRef.current = true;
      }
      if (newZoom > maxZoomRef.current) {
        maxZoomRef.current = newZoom;
      }
      debouncedSend();
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ============================================
  // DOWNLOAD HANDLER - IMMEDIATE TRACKING
  // ============================================
  const handleDownload = async () => {
    console.log('[ImageViewer] Download button clicked');
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
    }).catch(err => console.error('[ImageViewer] Download track error:', err));

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log(`[ImageViewer] Download complete, count=${downloadCountRef.current}`);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(imageSrc, '_blank');
    } finally {
      setDownloading(false);
    }
  };

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
    if (!allowDownload) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 99999,
        display: 'flex',
        gap: '8px',
      }}>
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
      </div>
    );
  };

  // ============================================
  // ZOOM CONTROLS
  // ============================================
  const ZoomControls = () => {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'white',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}>
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: zoomLevel <= 0.5 ? '#f1f5f9' : '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
            color: zoomLevel <= 0.5 ? '#94a3b8' : '#374151',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          −
        </button>

        <button
          onClick={() => setZoomLevel(1)}
          style={{
            minWidth: '60px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: zoomLevel === 1 ? '#f1f5f9' : '#eff6ff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: zoomLevel === 1 ? '#64748b' : '#3b82f6',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: zoomLevel >= 3 ? '#f1f5f9' : '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
            color: zoomLevel >= 3 ? '#94a3b8' : '#374151',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          +
        </button>

        <button
          onClick={handleFullscreen}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#374151',
            fontSize: '16px',
            marginLeft: '4px',
          }}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0a',
        color: 'white',
      }}
    >
      <Branding />
      <ControlBar />
      <ZoomControls />

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        paddingTop: showBranding ? '70px' : '16px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{fileName}</h1>
      </div>

      {/* Image */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '24px',
        paddingBottom: showBranding ? '80px' : '24px',
      }}>
        <img
          src={imageSrc}
          alt={fileName}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease',
            borderRadius: '8px',
          }}
        />
      </div>
    </div>
  );
}
