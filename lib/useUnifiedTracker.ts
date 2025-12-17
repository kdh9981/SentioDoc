'use client';

import { useRef, useEffect, useCallback } from 'react';

interface TrackerConfig {
  accessLogId: string;
  fileId: string;
  fileType: 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'url';
  totalPages?: number;
  videoDuration?: number;
}

interface TrackerState {
  startTime: number;
  pagesViewed: Set<number>;
  maxPageReached: number;
  pagesTimeData: Record<number, number>;
  currentPage: number;
  pageStartTime: number;
  idleTime: number;
  lastActivityTime: number;
  tabSwitches: number;
  downloaded: boolean;
  downloadCount: number;
  printAttempted: boolean;
  copyAttempted: boolean;
  // Video specific
  watchTime: number;
  videoCompleted: boolean;
}

export function useUnifiedTracker(config: TrackerConfig) {
  const stateRef = useRef<TrackerState>({
    startTime: Date.now(),
    pagesViewed: new Set([1]),
    maxPageReached: 1,
    pagesTimeData: { 1: 0 },
    currentPage: 1,
    pageStartTime: Date.now(),
    idleTime: 0,
    lastActivityTime: Date.now(),
    tabSwitches: 0,
    downloaded: false,
    downloadCount: 0,
    printAttempted: false,
    copyAttempted: false,
    watchTime: 0,
    videoCompleted: false,
  });

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const pendingSendRef = useRef<NodeJS.Timeout | null>(null);
  const hasSentFinalRef = useRef<boolean>(false);

  const IDLE_THRESHOLD = 30000; // 30 seconds
  const THROTTLE_MS = 500; // Send at most once per 0.5 seconds

  // Build session payload
  const buildPayload = useCallback(() => {
    const state = stateRef.current;
    const now = Date.now();

    // Calculate time on current page
    const currentPageTime = now - state.pageStartTime;
    const pagesTimeDataCopy = { ...state.pagesTimeData };
    pagesTimeDataCopy[state.currentPage] =
      (pagesTimeDataCopy[state.currentPage] || 0) + currentPageTime;

    const totalDurationSeconds = Math.round((now - state.startTime) / 1000);
    const pagesViewedCount = state.pagesViewed.size;
    const totalPages = config.totalPages || 1;
    const completionPercentage = Math.round((state.maxPageReached / totalPages) * 100);

    return {
      accessLogId: config.accessLogId,
      fileId: config.fileId,
      fileType: config.fileType,
      sessionEndAt: new Date().toISOString(),
      totalDurationSeconds,
      pagesViewedCount,
      maxPageReached: state.maxPageReached,
      completionPercentage,
      pagesTimeData: pagesTimeDataCopy,
      totalPages,
      exitPage: state.currentPage,
      idleTimeSeconds: Math.round(state.idleTime / 1000),
      tabSwitches: state.tabSwitches,
      downloaded: state.downloaded,
      downloadCount: state.downloadCount,
      printAttempted: state.printAttempted,
      copyAttempted: state.copyAttempted,
      // Video specific
      watchTimeSeconds: Math.round(state.watchTime),
      videoCompletionPercent: config.videoDuration
        ? Math.round((state.watchTime / config.videoDuration) * 100)
        : undefined,
      videoFinished: state.videoCompleted,
    };
  }, [config]);

  // Send data immediately (with throttle)
  const sendImmediately = useCallback(async (force: boolean = false) => {
    if (!config.accessLogId) return;

    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;

    // If we sent recently and not forced, schedule for later
    if (!force && timeSinceLastSend < THROTTLE_MS) {
      // Clear any existing pending send
      if (pendingSendRef.current) {
        clearTimeout(pendingSendRef.current);
      }
      // Schedule send after throttle period
      pendingSendRef.current = setTimeout(() => {
        sendImmediately(true);
      }, THROTTLE_MS - timeSinceLastSend);
      return;
    }

    // Clear pending send since we're sending now
    if (pendingSendRef.current) {
      clearTimeout(pendingSendRef.current);
      pendingSendRef.current = null;
    }

    lastSendTimeRef.current = now;

    try {
      const payload = buildPayload();
      await fetch('/api/track/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (error) {
      console.debug('Send failed, will retry on next activity:', error);
    }
  }, [config.accessLogId, buildPayload]);

  // Send page view to API (for page_views table)
  const sendPageView = useCallback(async (pageNumber: number, durationMs: number) => {
    if (!config.accessLogId || !config.fileId) return;

    try {
      await fetch('/api/track/page-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessLogId: config.accessLogId,
          fileId: config.fileId,
          pageNumber,
          durationSeconds: Math.round(durationMs / 1000),
          scrollDepth: 100,
        }),
      });
    } catch (error) {
      console.error('Failed to send page view:', error);
    }
  }, [config.accessLogId, config.fileId]);

  // Track page change (for PDFs)
  const trackPageChange = useCallback((newPage: number) => {
    const state = stateRef.current;
    const now = Date.now();

    // Record time on previous page
    const timeOnPrevPage = now - state.pageStartTime;
    state.pagesTimeData[state.currentPage] =
      (state.pagesTimeData[state.currentPage] || 0) + timeOnPrevPage;

    // Send page view for previous page
    if (state.currentPage !== newPage) {
      sendPageView(state.currentPage, timeOnPrevPage);
    }

    // Update to new page
    state.currentPage = newPage;
    state.pageStartTime = now;
    state.pagesViewed.add(newPage);
    state.maxPageReached = Math.max(state.maxPageReached, newPage);
    state.lastActivityTime = now;

    // Send immediately on page change
    sendImmediately();
  }, [sendPageView, sendImmediately]);

  // Track download
  const trackDownload = useCallback(() => {
    stateRef.current.downloaded = true;
    stateRef.current.downloadCount++;
    stateRef.current.lastActivityTime = Date.now();
    sendImmediately(); // Send immediately on download
  }, [sendImmediately]);

  // Track print attempt
  const trackPrint = useCallback(() => {
    stateRef.current.printAttempted = true;
    stateRef.current.lastActivityTime = Date.now();
    sendImmediately(); // Send immediately on print
  }, [sendImmediately]);

  // Track copy attempt
  const trackCopy = useCallback(() => {
    stateRef.current.copyAttempted = true;
    stateRef.current.lastActivityTime = Date.now();
    sendImmediately(); // Send immediately on copy
  }, [sendImmediately]);

  // Track video progress
  const trackVideoProgress = useCallback((currentTime: number, duration: number) => {
    stateRef.current.watchTime = currentTime;
    if (duration > 0 && currentTime >= duration * 0.9) {
      stateRef.current.videoCompleted = true;
    }
    stateRef.current.lastActivityTime = Date.now();
    sendImmediately(); // Send on video progress
  }, [sendImmediately]);

  // Track activity (any user interaction)
  const trackActivity = useCallback(() => {
    const now = Date.now();
    stateRef.current.lastActivityTime = now;

    // Reset idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      stateRef.current.idleTime += IDLE_THRESHOLD;
    }, IDLE_THRESHOLD);

    // Send data on every activity (throttled)
    sendImmediately();
  }, [sendImmediately]);

  // Send final session data (on page unload)
  const sendSessionEnd = useCallback(() => {
    if (hasSentFinalRef.current) return;
    hasSentFinalRef.current = true;

    const state = stateRef.current;
    const now = Date.now();

    // Record final time on current page
    const finalTimeOnPage = now - state.pageStartTime;
    state.pagesTimeData[state.currentPage] =
      (state.pagesTimeData[state.currentPage] || 0) + finalTimeOnPage;

    const payload = buildPayload();

    // Use sendBeacon for reliable delivery on page unload
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/track/unified', blob);

    // Fallback to sync XHR if sendBeacon fails
    if (!sent) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/track/unified', false); // sync
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
      } catch (e) {
        console.error('Final send failed:', e);
      }
    }
  }, [buildPayload]);

  // Setup event listeners
  useEffect(() => {
    if (!config.accessLogId) return;

    // Track visibility changes (tab switches)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stateRef.current.tabSwitches++;
        sendImmediately(true); // Force send when tab becomes hidden
      } else {
        trackActivity();
      }
    };

    // Track keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      trackActivity();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        trackDownload();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        trackPrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        trackCopy();
      }
    };

    // Track mouse/touch/scroll activity - send on every activity
    const handleActivity = () => trackActivity();

    // Handle page unload
    const handleUnload = () => sendSessionEnd();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleActivity, { passive: true });
    document.addEventListener('mousedown', handleActivity, { passive: true });
    document.addEventListener('touchstart', handleActivity, { passive: true });
    document.addEventListener('touchmove', handleActivity, { passive: true });
    document.addEventListener('scroll', handleActivity, { passive: true });
    document.addEventListener('wheel', handleActivity, { passive: true });
    document.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Send initial data immediately when viewer starts
    sendImmediately(true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('touchmove', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('wheel', handleActivity);
      document.removeEventListener('click', handleActivity);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      if (pendingSendRef.current) {
        clearTimeout(pendingSendRef.current);
      }

      // Send final data on cleanup
      sendSessionEnd();
    };
  }, [config.accessLogId, trackActivity, trackDownload, trackPrint, trackCopy, sendSessionEnd, sendImmediately]);

  return {
    trackPageChange,
    trackDownload,
    trackPrint,
    trackCopy,
    trackVideoProgress,
    trackActivity,
  };
}
