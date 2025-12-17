'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoViewerProps {
  fileId: string;
  fileName: string;
  videoUrl: string;
  accessLogId: string | null;
  showBranding?: boolean;
}

type VideoPlatform = 'youtube' | 'youtube-shorts' | 'vimeo' | 'tiktok' | 'loom' | 'wistia' | 'instagram' | 'native' | null;

interface ParsedVideo {
  platform: VideoPlatform;
  videoId: string | null;
  embedUrl: string | null;
  isVertical: boolean;
}

// Extract video ID and platform from URL
function parseVideoUrl(url: string): ParsedVideo {
  if (!url) return { platform: null, videoId: null, embedUrl: null, isVertical: false };

  // YouTube Shorts - CHECK FIRST (before regular YouTube)
  const youtubeShortsPattern = /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;
  const shortsMatch = url.match(youtubeShortsPattern);
  if (shortsMatch) {
    return {
      platform: 'youtube-shorts',
      videoId: shortsMatch[1],
      embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?enablejsapi=1&loop=1&playlist=${shortsMatch[1]}`,
      isVertical: true,
    };
  }

  // Regular YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        platform: 'youtube',
        videoId: match[1],
        embedUrl: `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`,
        isVertical: false,
      };
    }
  }

  // Vimeo
  const vimeoPattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch) {
    return {
      platform: 'vimeo',
      videoId: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
      isVertical: false,
    };
  }

  // TikTok
  const tiktokPattern = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
  const tiktokMatch = url.match(tiktokPattern);
  if (tiktokMatch) {
    return {
      platform: 'tiktok',
      videoId: tiktokMatch[1],
      embedUrl: url,
      isVertical: true,
    };
  }

  // Instagram Reels
  const instagramPattern = /instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/;
  const instagramMatch = url.match(instagramPattern);
  if (instagramMatch) {
    return {
      platform: 'instagram',
      videoId: instagramMatch[1],
      embedUrl: `https://www.instagram.com/p/${instagramMatch[1]}/embed`,
      isVertical: true,
    };
  }

  // Loom
  const loomPattern = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/;
  const loomMatch = url.match(loomPattern);
  if (loomMatch) {
    return {
      platform: 'loom',
      videoId: loomMatch[1],
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      isVertical: false,
    };
  }

  // Wistia
  const wistiaPattern = /wistia\.com\/medias\/([a-zA-Z0-9]+)/;
  const wistiaMatch = url.match(wistiaPattern);
  if (wistiaMatch) {
    return {
      platform: 'wistia',
      videoId: wistiaMatch[1],
      embedUrl: `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`,
      isVertical: false,
    };
  }

  // Direct video file
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) {
    return {
      platform: 'native',
      videoId: null,
      embedUrl: url,
      isVertical: false,
    };
  }

  return { platform: null, videoId: null, embedUrl: null, isVertical: false };
}

export default function VideoViewer({
  fileId,
  fileName,
  videoUrl,
  accessLogId,
  showBranding = true
}: VideoViewerProps) {
  const { platform, videoId, embedUrl, isVertical } = parseVideoUrl(videoUrl);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tiktokLoaded, setTiktokLoaded] = useState(false);
  const playerRef = useRef<YT.Player | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tiktokContainerRef = useRef<HTMLDivElement | null>(null);

  // ============================================
  // TRACKING REFS (avoid stale closures)
  // ============================================
  const sessionStartTime = useRef<number>(Date.now());
  const lastPositionRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const hasSentFinalRef = useRef<boolean>(false);

  // ============================================
  // NEW: Segment tracking refs (like pages_time_data)
  // ============================================
  const segmentsTimeData = useRef<Record<number, number>>({});
  const lastSegmentRef = useRef<number>(-1);
  const segmentStartTime = useRef<number>(Date.now());

  // Debounce refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 1000;

  // Keep refs in sync with state
  useEffect(() => {
    watchTimeRef.current = watchTime;
  }, [watchTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // ============================================
  // CALCULATE CURRENT SEGMENT (0-9)
  // ============================================
  const getCurrentSegment = useCallback((position: number, totalDuration: number): number => {
    if (totalDuration <= 0) return 0;
    const percentage = (position / totalDuration) * 100;
    return Math.min(Math.floor(percentage / 10), 9);
  }, []);

  // ============================================
  // UPDATE SEGMENT TIME
  // ============================================
  const updateSegmentTime = useCallback((position: number) => {
    const totalDuration = durationRef.current;
    if (totalDuration <= 0) return;

    const currentSegment = getCurrentSegment(position, totalDuration);
    const now = Date.now();

    // If segment changed, save time to previous segment
    if (lastSegmentRef.current !== -1 && lastSegmentRef.current !== currentSegment) {
      const timeInPrevSegment = Math.round((now - segmentStartTime.current) / 100) / 10; // 0.1s precision
      if (timeInPrevSegment > 0 && timeInPrevSegment < 300) { // Cap at 5 minutes per segment
        segmentsTimeData.current[lastSegmentRef.current] =
          (segmentsTimeData.current[lastSegmentRef.current] || 0) + timeInPrevSegment;
      }
      segmentStartTime.current = now;
    }

    // First time tracking
    if (lastSegmentRef.current === -1) {
      segmentStartTime.current = now;
    }

    lastSegmentRef.current = currentSegment;
  }, [getCurrentSegment]);

  // ============================================
  // FINALIZE CURRENT SEGMENT TIME
  // ============================================
  const finalizeCurrentSegment = useCallback(() => {
    if (lastSegmentRef.current === -1) return;

    const timeInSegment = Math.round((Date.now() - segmentStartTime.current) / 100) / 10;
    if (timeInSegment > 0 && timeInSegment < 300) {
      segmentsTimeData.current[lastSegmentRef.current] =
        (segmentsTimeData.current[lastSegmentRef.current] || 0) + timeInSegment;
    }
  }, []);

  // ============================================
  // BUILD SESSION DATA
  // ============================================
  const buildSessionData = useCallback(() => {
    const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    const videoDur = durationRef.current || 1;
    const completionPercentage = Math.min(100, Math.round((lastPositionRef.current / videoDur) * 100));
    const watchPercentage = Math.min(100, Math.round((watchTimeRef.current / videoDur) * 100));

    // Finalize current segment before building data
    finalizeCurrentSegment();

    // Clone segments data
    const finalSegmentsTimeData = { ...segmentsTimeData.current };

    let engagementScore = 0;
    engagementScore += Math.min(50, watchPercentage * 0.5);
    if (hasCompletedRef.current) {
      engagementScore += 30;
    } else if (completionPercentage >= 75) {
      engagementScore += 20;
    } else if (completionPercentage >= 50) {
      engagementScore += 10;
    }
    const sessionMinutes = totalDuration / 60;
    engagementScore += Math.min(20, sessionMinutes * 5);
    engagementScore = Math.round(Math.min(100, engagementScore));

    // Calculate exit segment
    const exitSegment = getCurrentSegment(lastPositionRef.current, videoDur);

    return {
      accessLogId,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      watchTimeSeconds: watchTimeRef.current,
      videoCompletionPercent: completionPercentage,
      videoFinished: hasCompletedRef.current,
      videoDurationSeconds: Math.round(videoDur),
      pagesViewedCount: 1,
      maxPageReached: 1,
      totalPages: 1,
      exitPage: 1,
      exitSegment, // NEW: Which segment user exited at
      completionPercentage,
      segmentsTimeData: finalSegmentsTimeData, // NEW: Time per segment
      engagementScore,
      intentSignal: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
      videoMetadata: {
        platform,
        videoId,
        isVertical,
        currentPosition: Math.round(lastPositionRef.current),
        watchTimeSeconds: watchTimeRef.current,
      },
    };
  }, [accessLogId, platform, videoId, isVertical, finalizeCurrentSegment, getCurrentSegment]);

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
    console.log(`[VideoViewer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

    if (isFinalSend && navigator.sendBeacon) {
      const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
      console.log('[VideoViewer] sendBeacon result:', success);
    } else {
      fetch('/api/viewer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: isFinalSend,
      }).catch(err => console.error('[VideoViewer] Send error:', err));
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
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
      sendSessionData(true);
    };
  }, [sendSessionData]);

  // ============================================
  // YOUTUBE PLAYER API (for YouTube and YouTube Shorts)
  // ============================================
  useEffect(() => {
    if (platform !== 'youtube' && platform !== 'youtube-shorts') return;
    if (!videoId) return;

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          loop: platform === 'youtube-shorts' ? 1 : 0,
          playlist: platform === 'youtube-shorts' ? videoId : undefined,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };

    (window as any).onYouTubeIframeAPIReady = initPlayer;

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    }

    return () => {
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
      playerRef.current?.destroy();
    };
  }, [platform, videoId]);

  const onPlayerReady = (event: any) => {
    const dur = event.target.getDuration();
    setDuration(dur);
    durationRef.current = dur;
    console.log(`[VideoViewer] YouTube ready, duration: ${dur}s`);
  };

  const onPlayerStateChange = (event: any) => {
    const player = event.target;
    const currentTime = player.getCurrentTime();
    lastPositionRef.current = currentTime;
    updateSegmentTime(currentTime); // Track segment

    switch (event.data) {
      case (window as any).YT.PlayerState.PLAYING:
        setIsPlaying(true);
        if (!hasStarted) {
          setHasStarted(true);
          console.log('[VideoViewer] Video started');
        }
        // Start tracking interval
        watchIntervalRef.current = setInterval(() => {
          const pos = player.getCurrentTime();
          setWatchTime(prev => prev + 1);
          lastPositionRef.current = pos;
          updateSegmentTime(pos); // Track segment every second
          if (watchTimeRef.current % 10 === 0) {
            debouncedSend();
          }
        }, 1000);
        break;

      case (window as any).YT.PlayerState.PAUSED:
        setIsPlaying(false);
        if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
        finalizeCurrentSegment(); // Finalize time on pause
        debouncedSend();
        break;

      case (window as any).YT.PlayerState.ENDED:
        setIsPlaying(false);
        hasCompletedRef.current = true;
        if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
        finalizeCurrentSegment();
        console.log('[VideoViewer] Video completed');
        sendSessionData(false);
        break;
    }
  };

  // ============================================
  // TIKTOK EMBED (using official embed script)
  // ============================================
  useEffect(() => {
    if (platform !== 'tiktok' || !videoId) return;

    // Load TikTok embed script
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    script.onload = () => {
      setTiktokLoaded(true);
      console.log('[VideoViewer] TikTok embed script loaded');
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if it exists in the body
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [platform, videoId]);

  // ============================================
  // NATIVE VIDEO HANDLERS
  // ============================================
  useEffect(() => {
    if (platform !== 'native' || !nativeVideoRef.current) return;

    const video = nativeVideoRef.current;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      durationRef.current = video.duration;
    };

    const handleTimeUpdate = () => {
      lastPositionRef.current = video.currentTime;
      updateSegmentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasStarted) setHasStarted(true);
      watchIntervalRef.current = setInterval(() => {
        setWatchTime(prev => prev + 1);
        lastPositionRef.current = video.currentTime;
        updateSegmentTime(video.currentTime);
        if (watchTimeRef.current % 10 === 0) debouncedSend();
      }, 1000);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
      finalizeCurrentSegment();
      debouncedSend();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      hasCompletedRef.current = true;
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
      finalizeCurrentSegment();
      sendSessionData(false);
    };

    const handleSeeked = () => {
      // On seek, update segment tracking
      updateSegmentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [platform, debouncedSend, sendSessionData, hasStarted, updateSegmentTime, finalizeCurrentSegment]);

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
            <img src="/logo.png" alt="LinkLens" style={{ height: '28px', width: 'auto' }} />
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
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              <span style={{ color: '#1e293b' }}>Link</span>
              <span style={{ color: '#7c8ce0' }}>Lens</span>
            </span>
          </div>
        </a>
      </>
    );
  };

  // Platform badge
  const getPlatformBadge = () => {
    const badges: Record<string, { bg: string; color: string; label: string }> = {
      'youtube': { bg: 'rgba(255, 0, 0, 0.2)', color: '#ff4444', label: 'YouTube' },
      'youtube-shorts': { bg: 'rgba(255, 0, 0, 0.2)', color: '#ff4444', label: 'YouTube Shorts' },
      'vimeo': { bg: 'rgba(0, 173, 239, 0.2)', color: '#00adef', label: 'Vimeo' },
      'tiktok': { bg: 'rgba(0, 0, 0, 0.2)', color: '#ffffff', label: 'TikTok' },
      'instagram': { bg: 'rgba(225, 48, 108, 0.2)', color: '#e1306c', label: 'Instagram' },
      'loom': { bg: 'rgba(98, 77, 227, 0.2)', color: '#624de3', label: 'Loom' },
      'wistia': { bg: 'rgba(84, 187, 255, 0.2)', color: '#54bbff', label: 'Wistia' },
      'native': { bg: 'rgba(100, 100, 100, 0.2)', color: '#999', label: 'Video' },
    };
    return badges[platform || ''] || badges['native'];
  };

  // ============================================
  // RENDER - UNSUPPORTED/FALLBACK
  // ============================================
  if (!platform || (!videoId && platform !== 'native')) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        textAlign: 'center',
        background: '#0a0a0a',
        color: 'white',
      }}>
        <Branding />
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎬</div>
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>{fileName}</h1>
        <p style={{ color: '#94a3b8', marginBottom: '32px' }}>
          This video will open in a new window
        </p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendSessionData(false)}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            backgroundColor: '#6366f1',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Open Video
        </a>
      </div>
    );
  }

  const badge = getPlatformBadge();

  // ============================================
  // RENDER - MAIN
  // ============================================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0a',
      color: 'white',
    }}>
      <Branding />

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        paddingTop: showBranding ? '70px' : '16px',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{fileName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {duration > 0 && (
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              {Math.floor(watchTime / 60)}:{(watchTime % 60).toString().padStart(2, '0')} /
              {Math.floor(duration / 60)}:{(Math.round(duration) % 60).toString().padStart(2, '0')}
            </span>
          )}
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            background: badge.bg,
            color: badge.color,
          }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Video Player Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingBottom: showBranding ? '80px' : '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: isVertical ? '400px' : '1200px',
          aspectRatio: isVertical ? '9/16' : '16/9',
          maxHeight: isVertical ? '85vh' : undefined,
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* YouTube & YouTube Shorts */}
          {(platform === 'youtube' || platform === 'youtube-shorts') && (
            <div id="youtube-player" style={{ width: '100%', height: '100%' }} />
          )}

          {/* Vimeo */}
          {platform === 'vimeo' && (
            <iframe
              src={embedUrl || ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* TikTok - Official Embed */}
          {platform === 'tiktok' && (
            <div
              ref={tiktokContainerRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#000',
              }}
            >
              <blockquote
                className="tiktok-embed"
                cite={videoUrl}
                data-video-id={videoId}
                style={{ maxWidth: '605px', minWidth: '325px' }}
              >
                <section>
                  {!tiktokLoaded && (
                    <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #333',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      <p>Loading TikTok video...</p>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#00f2ea', textDecoration: 'underline', fontSize: '14px' }}
                        onClick={() => sendSessionData(false)}
                      >
                        Open on TikTok →
                      </a>
                    </div>
                  )}
                </section>
              </blockquote>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Instagram */}
          {platform === 'instagram' && (
            <iframe
              src={embedUrl || ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              scrolling="no"
            />
          )}

          {/* Loom */}
          {platform === 'loom' && (
            <iframe
              src={embedUrl || ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}

          {/* Wistia */}
          {platform === 'wistia' && (
            <iframe
              src={embedUrl || ''}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}

          {/* Native Video */}
          {platform === 'native' && (
            <video
              ref={nativeVideoRef}
              src={embedUrl || ''}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
