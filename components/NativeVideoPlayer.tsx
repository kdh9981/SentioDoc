'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface NativeVideoPlayerProps {
  fileId: string;
  fileName: string;
  fileUrl?: string;
  videoSrc?: string; // Legacy prop name - support both
  accessLogId: string;
  allowDownload?: boolean;
  showBranding?: boolean;
  logoUrl?: string | null;
}

export default function NativeVideoPlayer({
  fileId,
  fileName,
  fileUrl,
  videoSrc,
  accessLogId,
  allowDownload = true,
  showBranding = true,
  logoUrl,
}: NativeVideoPlayerProps) {
  // Support both prop names
  const videoUrl = fileUrl || videoSrc || '';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // ============================================
  // TRACKING REFS (avoid stale closures)
  // ============================================
  const sessionStartTime = useRef<number>(Date.now());
  const watchTimeRef = useRef<number>(0);
  const maxPositionRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const playCountRef = useRef<number>(0);
  const pauseCountRef = useRef<number>(0);
  const seekCountRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const hasDownloadedRef = useRef<boolean>(false);
  const downloadCountRef = useRef<number>(0);
  const hasSentFinalRef = useRef<boolean>(false);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);

  // NEW: Segment tracking (like PDF page tracking)
  // Divide video into 10 segments (0-9), track time in each
  const NUM_SEGMENTS = 10;
  const segmentsTimeData = useRef<Record<number, number>>({});
  const currentSegmentRef = useRef<number>(0);
  const segmentStartTime = useRef<number>(Date.now());
  const segmentsViewedRef = useRef<Set<number>>(new Set());

  // Debounce refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 1000; // Match PDF frequency

  // ============================================
  // HELPER: Get segment from time position
  // ============================================
  const getSegmentFromTime = useCallback((time: number): number => {
    if (!durationRef.current || durationRef.current === 0) return 0;
    const segment = Math.floor((time / durationRef.current) * NUM_SEGMENTS);
    return Math.min(segment, NUM_SEGMENTS - 1);
  }, []);

  // ============================================
  // BUILD SESSION DATA
  // ============================================
  const buildSessionData = useCallback(() => {
    const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    const videoDur = durationRef.current || 1;
    const completionPercentage = Math.min(100, Math.round((maxPositionRef.current / videoDur) * 100));

    // Calculate time for current segment
    const currentSegmentTime = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;
    const finalSegmentsTimeData = { ...segmentsTimeData.current };
    const currentSeg = currentSegmentRef.current;
    if (currentSegmentTime > 0 && currentSegmentTime < 1800) {
      finalSegmentsTimeData[currentSeg] = (finalSegmentsTimeData[currentSeg] || 0) + currentSegmentTime;
    }

    // Determine exit segment
    const exitSegment = getSegmentFromTime(lastTimeRef.current);

    return {
      accessLogId,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      // Video-specific fields
      watchTimeSeconds: watchTimeRef.current,
      videoCompletionPercent: completionPercentage,
      videoFinished: hasCompletedRef.current,
      videoDurationSeconds: Math.round(videoDur),
      // NEW: Segment tracking (like pages_time_data for PDFs)
      segmentsTimeData: finalSegmentsTimeData,
      exitSegment: exitSegment,
      // Standard fields
      pagesViewedCount: segmentsViewedRef.current.size || 1,
      maxPageReached: Math.max(...Array.from(segmentsViewedRef.current), 0) + 1,
      totalPages: NUM_SEGMENTS,
      exitPage: exitSegment + 1,
      completionPercentage,
      downloaded: hasDownloadedRef.current,
      downloadCount: downloadCountRef.current,
      // Video metadata
      videoMetadata: {
        platform: 'native',
        playCount: playCountRef.current,
        pauseCount: pauseCountRef.current,
        seekCount: seekCountRef.current,
        maxPosition: Math.round(maxPositionRef.current),
        watchTimeSeconds: watchTimeRef.current,
      },
    };
  }, [accessLogId, getSegmentFromTime]);

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
    console.log(`[NativeVideoPlayer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

    if (isFinalSend && navigator.sendBeacon) {
      const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
      console.log('[NativeVideoPlayer] sendBeacon result:', success);
    } else {
      fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: isFinalSend,
      }).catch(err => console.error('[NativeVideoPlayer] Send error:', err));
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
  // TRACK SEGMENT CHANGE (like page change in PDF)
  // ============================================
  const handleSegmentChange = useCallback((newSegment: number) => {
    const prevSegment = currentSegmentRef.current;

    if (newSegment !== prevSegment) {
      // Calculate time spent on previous segment
      const timeOnSegment = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;

      if (timeOnSegment > 0 && timeOnSegment < 1800) {
        segmentsTimeData.current[prevSegment] = (segmentsTimeData.current[prevSegment] || 0) + timeOnSegment;
        console.log(`[NativeVideoPlayer] Segment ${prevSegment} time: ${timeOnSegment}s`);
      }

      // Update to new segment
      currentSegmentRef.current = newSegment;
      segmentsViewedRef.current.add(newSegment);
      segmentStartTime.current = Date.now();

      // Trigger debounced send on segment change (like page change)
      debouncedSend();
    }
  }, [debouncedSend]);

  // ============================================
  // VIDEO EVENT HANDLERS
  // ============================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      durationRef.current = video.duration;
      console.log(`[NativeVideoPlayer] Loaded, duration: ${video.duration}s`);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      playCountRef.current += 1;
      console.log(`[NativeVideoPlayer] Play #${playCountRef.current}`);

      // Reset segment timer on play
      segmentStartTime.current = Date.now();

      // Start tracking watch time AND segments (0.5s precision)
      watchIntervalRef.current = setInterval(() => {
        watchTimeRef.current += 0.5; // Track in 0.5s increments
        setCurrentTime(video.currentTime);

        if (video.currentTime > maxPositionRef.current) {
          maxPositionRef.current = video.currentTime;
        }

        // Check for segment change
        const currentSeg = getSegmentFromTime(video.currentTime);
        handleSegmentChange(currentSeg);

        // Send data every 1 second (every 2 intervals)
        if (Math.floor(watchTimeRef.current * 2) % 2 === 0 && watchTimeRef.current > 0) {
          debouncedSend();
        }
      }, 500); // 500ms = 0.5 second intervals
    };

    const handlePause = () => {
      setIsPlaying(false);
      pauseCountRef.current += 1;

      // Save time for current segment on pause
      const currentSeg = currentSegmentRef.current;
      const timeOnSegment = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;
      if (timeOnSegment > 0 && timeOnSegment < 1800) {
        segmentsTimeData.current[currentSeg] = (segmentsTimeData.current[currentSeg] || 0) + timeOnSegment;
      }
      segmentStartTime.current = Date.now(); // Reset for next play

      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
      debouncedSend();
    };

    const handleSeeking = () => {
      if (Math.abs(video.currentTime - lastTimeRef.current) > 2) {
        seekCountRef.current += 1;

        // Save time for previous segment before seek
        const prevSeg = currentSegmentRef.current;
        const timeOnSegment = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;
        if (timeOnSegment > 0 && timeOnSegment < 1800) {
          segmentsTimeData.current[prevSeg] = (segmentsTimeData.current[prevSeg] || 0) + timeOnSegment;
        }

        // Update to new segment after seek
        const newSeg = getSegmentFromTime(video.currentTime);
        currentSegmentRef.current = newSeg;
        segmentsViewedRef.current.add(newSeg);
        segmentStartTime.current = Date.now();
      }
      lastTimeRef.current = video.currentTime;
    };

    const handleEnded = () => {
      setIsPlaying(false);
      hasCompletedRef.current = true;

      // Save time for final segment
      const currentSeg = currentSegmentRef.current;
      const timeOnSegment = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;
      if (timeOnSegment > 0 && timeOnSegment < 1800) {
        segmentsTimeData.current[currentSeg] = (segmentsTimeData.current[currentSeg] || 0) + timeOnSegment;
      }

      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
      console.log('[NativeVideoPlayer] Completed, segments:', segmentsTimeData.current);
      sendSessionData(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime > maxPositionRef.current) {
        maxPositionRef.current = video.currentTime;
      }
      lastTimeRef.current = video.currentTime;

      // Track segment on every time update (more accurate)
      const currentSeg = getSegmentFromTime(video.currentTime);
      segmentsViewedRef.current.add(currentSeg);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    };
  }, [debouncedSend, sendSessionData, getSegmentFromTime, handleSegmentChange]);

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
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
      sendSessionData(true);
    };
  }, [sendSessionData]);

  // ============================================
  // DOWNLOAD HANDLER
  // ============================================
  const handleDownload = () => {
    console.log('[NativeVideoPlayer] Download clicked');
    hasDownloadedRef.current = true;
    downloadCountRef.current += 1;

    fetch('/api/viewer/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessLogId,
        downloaded: true,
        downloadCount: downloadCountRef.current,
        isDownloaded: true,
      }),
    }).catch(err => console.error('[NativeVideoPlayer] Download track error:', err));

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = fileName || 'video';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0a',
      color: 'white',
    }}>
      {/* Branding */}
      {showBranding && (
        <>
          <a href="https://linklens.tech" target="_blank" rel="noopener noreferrer"
            style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 99999, textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'white', borderRadius: '12px', padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}>
              <img src={logoUrl || "/logo.png"} alt="LinkLens" style={{ height: '28px', width: 'auto' }} />
            </div>
          </a>
          <a href="https://linklens.tech" target="_blank" rel="noopener noreferrer"
            style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'white', borderRadius: '999px', padding: '10px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Powered by</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                <span style={{ color: '#1e293b' }}>Link</span>
                <span style={{ color: '#7c8ce0' }}>Lens</span>
              </span>
            </div>
          </a>
        </>
      )}

      {/* Download Button */}
      {allowDownload && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 99999 }}>
          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', background: '#3b82f6', border: 'none',
            borderRadius: '12px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white',
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '16px 24px', paddingTop: showBranding ? '70px' : '16px',
        borderBottom: '1px solid #27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{fileName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {completionPercent > 0 && (
            <span style={{
              padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
              background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa',
            }}>
              {completionPercent}% watched
            </span>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', paddingBottom: showBranding ? '80px' : '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload"
            style={{ width: '100%', maxHeight: 'calc(100vh - 200px)', borderRadius: '12px', background: '#000' }}
          />
        </div>
      </div>
    </div>
  );
}
