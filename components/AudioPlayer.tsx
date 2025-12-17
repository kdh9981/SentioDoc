'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioPlayerProps {
  fileId: string;
  fileName: string;
  audioSrc: string;
  accessLogId: string;
  allowDownload?: boolean;
  showBranding?: boolean;
}

export default function AudioPlayer({
  fileId,
  fileName,
  audioSrc,
  accessLogId,
  allowDownload = true,
  showBranding = true
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // ============================================
  // TRACKING REFS (avoid stale closures)
  // ============================================
  const sessionStartTime = useRef<number>(Date.now());
  const listenTimeRef = useRef<number>(0);
  const maxPositionRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const playCountRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const hasDownloadedRef = useRef<boolean>(false);
  const downloadCountRef = useRef<number>(0);
  const hasSentFinalRef = useRef<boolean>(false);
  const listenIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 1000;

  // ============================================
  // BUILD SESSION DATA
  // ============================================
  const buildSessionData = useCallback(() => {
    const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    const audioDur = durationRef.current || 1;
    const completionPercentage = Math.min(100, Math.round((maxPositionRef.current / audioDur) * 100));
    const listenPercentage = Math.min(100, Math.round((listenTimeRef.current / audioDur) * 100));

    // Calculate engagement score for audio
    let engagementScore = 0;
    // Listen time (0-50 points) - based on percentage of audio listened
    engagementScore += Math.min(50, listenPercentage * 0.5);
    // Completion (0-30 points)
    if (hasCompletedRef.current) {
      engagementScore += 30;
    } else if (completionPercentage >= 75) {
      engagementScore += 20;
    } else if (completionPercentage >= 50) {
      engagementScore += 10;
    }
    // Session time (0-10 points)
    const sessionMinutes = totalDuration / 60;
    engagementScore += Math.min(10, sessionMinutes * 2);
    // Download (0-10 points)
    if (hasDownloadedRef.current) {
      engagementScore += 10;
    }
    engagementScore = Math.round(Math.min(100, engagementScore));

    return {
      accessLogId,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      // Use video fields for audio tracking (reusing structure)
      watchTimeSeconds: listenTimeRef.current,
      videoCompletionPercent: completionPercentage,
      videoFinished: hasCompletedRef.current,
      videoDurationSeconds: Math.round(audioDur),
      // Standard fields
      pagesViewedCount: 1,
      maxPageReached: 1,
      totalPages: 1,
      exitPage: 1,
      completionPercentage,
      downloaded: hasDownloadedRef.current,
      downloadCount: downloadCountRef.current,
      engagementScore,
      intentSignal: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
      // Audio metadata
      audioMetadata: {
        listenTimeSeconds: listenTimeRef.current,
        maxPosition: Math.round(maxPositionRef.current),
        playCount: playCountRef.current,
        audioDuration: Math.round(audioDur),
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
    console.log(`[AudioPlayer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

    if (isFinalSend && navigator.sendBeacon) {
      const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
      console.log('[AudioPlayer] sendBeacon result:', success);
    } else {
      fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: isFinalSend,
      }).catch(err => console.error('[AudioPlayer] Send error:', err));
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
  // AUDIO EVENT HANDLERS
  // ============================================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      durationRef.current = audio.duration;
      console.log(`[AudioPlayer] Loaded, duration: ${audio.duration}s`);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      playCountRef.current += 1;
      console.log(`[AudioPlayer] Play #${playCountRef.current}`);

      // Start tracking listen time (0.5s precision)
      listenIntervalRef.current = setInterval(() => {
        listenTimeRef.current += 0.5; // Track in 0.5s increments
        setCurrentTime(audio.currentTime);
        if (audio.currentTime > maxPositionRef.current) {
          maxPositionRef.current = audio.currentTime;
        }

        // Send data every 1 second (every 2 intervals)
        if (Math.floor(listenTimeRef.current * 2) % 2 === 0 && listenTimeRef.current > 0) {
          debouncedSend();
        }
      }, 500); // 500ms = 0.5 second intervals
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
      }
      debouncedSend();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      hasCompletedRef.current = true;
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
      }
      console.log('[AudioPlayer] Completed');
      sendSessionData(false); // Immediate send on completion
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime > maxPositionRef.current) {
        maxPositionRef.current = audio.currentTime;
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (listenIntervalRef.current) clearInterval(listenIntervalRef.current);
    };
  }, [debouncedSend, sendSessionData]);

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
      if (listenIntervalRef.current) {
        clearInterval(listenIntervalRef.current);
      }
      sendSessionData(true);
    };
  }, [sendSessionData]);

  // ============================================
  // DOWNLOAD HANDLER - IMMEDIATE TRACKING
  // ============================================
  const handleDownload = () => {
    console.log('[AudioPlayer] Download button clicked');

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
    }).catch(err => console.error('[AudioPlayer] Download track error:', err));

    // Direct download using anchor tag - works even while playing
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = fileName || 'audio';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`[AudioPlayer] Download initiated, count=${downloadCountRef.current}`);
  };

  // ============================================
  // FORMAT TIME HELPER
  // ============================================
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completionPercent = duration > 0 ? Math.round((maxPositionRef.current / duration) * 100) : 0;

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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0a',
      color: 'white',
      padding: '24px',
    }}>
      <Branding />
      <ControlBar />

      <div style={{
        background: '#18181b',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Audio Icon */}
        <div style={{ fontSize: '80px', marginBottom: '24px' }}>audio</div>

        {/* File Name */}
        <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', margin: '0 0 8px 0' }}>
          {fileName}
        </h1>

        {/* Duration */}
        <p style={{ color: '#94a3b8', marginBottom: '32px', margin: '0 0 32px 0' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
          {completionPercent > 0 && ` - ${completionPercent}% played`}
        </p>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioSrc}
          controls
          controlsList="nodownload"
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
