// LEAN Analytics Tracker - Captures summary data only
// Sends data at end of session using sendBeacon for reliability

interface TrackerConfig {
  accessLogId: string;
  fileId: string;
  totalPages: number;
}

interface SessionData {
  pagesViewed: Set<number>;
  maxPageReached: number;
  totalDuration: number;
  idleTime: number;
  tabSwitches: number;
  downloadAttempted: boolean;
  printAttempted: boolean;
  copyAttempted: boolean;
  currentPage: number;
  exitPage: number;
}

class AnalyticsTracker {
  private config: TrackerConfig | null = null;
  private session: SessionData | null = null;
  private sessionStartTime: number = 0;
  private lastActivityTime: number = 0;
  private idleThreshold = 30000; // 30 seconds of no activity = idle
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private isIdle = false;
  private idleStartTime = 0;
  private pageStartTime: number = 0;
  private destroyed = false;

  init(config: TrackerConfig) {
    if (this.destroyed) return;

    this.config = config;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.pageStartTime = Date.now();

    this.session = {
      pagesViewed: new Set([1]),
      maxPageReached: 1,
      totalDuration: 0,
      idleTime: 0,
      tabSwitches: 0,
      downloadAttempted: false,
      printAttempted: false,
      copyAttempted: false,
      currentPage: 1,
      exitPage: 1,
    };

    this.setupEventListeners();
    this.startIdleCheck();
  }

  private setupEventListeners() {
    // Activity detection
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });

    // Tab visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Session end handlers
    window.addEventListener('beforeunload', this.handleSessionEnd);
    window.addEventListener('pagehide', this.handleSessionEnd);

    // Download/print detection
    window.addEventListener('keydown', this.handleKeyboardShortcuts);

    // Copy detection
    document.addEventListener('copy', this.handleCopy);
  }

  private handleActivity = () => {
    const now = Date.now();

    if (this.isIdle) {
      // Was idle, now active - calculate idle duration
      if (this.session && this.idleStartTime > 0) {
        this.session.idleTime += (now - this.idleStartTime) / 1000;
      }
      this.isIdle = false;
    }

    this.lastActivityTime = now;
  };

  private startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivityTime;

      if (timeSinceActivity > this.idleThreshold && !this.isIdle) {
        this.isIdle = true;
        this.idleStartTime = this.lastActivityTime + this.idleThreshold;
      }
    }, 5000);
  }

  private handleVisibilityChange = () => {
    if (this.session && document.hidden) {
      this.session.tabSwitches++;
    }
  };

  private handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if (!this.session) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl) {
      if (e.key === 's' || e.key === 'S') {
        this.session.downloadAttempted = true;
        e.preventDefault();
      }
      if (e.key === 'p' || e.key === 'P') {
        this.session.printAttempted = true;
        e.preventDefault();
      }
    }
  };

  private handleCopy = () => {
    if (this.session) {
      this.session.copyAttempted = true;
    }
  };

  // Call this when page changes
  onPageChange(newPage: number) {
    if (!this.session || !this.config) return;

    // Track page view duration for current page
    const now = Date.now();
    const duration = (now - this.pageStartTime) / 1000;

    // Send page tracking data
    this.trackPage(this.session.currentPage, duration);

    // Update session
    this.session.pagesViewed.add(newPage);
    this.session.maxPageReached = Math.max(this.session.maxPageReached, newPage);
    this.session.currentPage = newPage;
    this.session.exitPage = newPage;
    this.pageStartTime = now;
  }

  private trackPage(pageNumber: number, duration: number) {
    if (!this.config) return;

    // Use fetch (not beacon) for page tracking since session is still active
    fetch('/api/track/page-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessLogId: this.config.accessLogId,
        fileId: this.config.fileId,
        pageNumber,
        duration: Math.round(duration),
        scrollDepth: 100, // Simplified - assume full scroll for now
      }),
    }).catch(console.error);
  }

  private handleSessionEnd = () => {
    if (this.destroyed || !this.session || !this.config) return;
    this.destroyed = true;

    // Calculate final idle time if currently idle
    if (this.isIdle && this.idleStartTime > 0) {
      this.session.idleTime += (Date.now() - this.idleStartTime) / 1000;
    }

    // Calculate total duration
    const totalDuration = (Date.now() - this.sessionStartTime) / 1000;

    // Send session summary using sendBeacon for reliability
    const payload = JSON.stringify({
      accessLogId: this.config.accessLogId,
      totalDuration: Math.round(totalDuration),
      pagesViewed: this.session.pagesViewed.size,
      maxPageReached: this.session.maxPageReached,
      totalPages: this.config.totalPages,
      exitPage: this.session.exitPage,
      idleTime: Math.round(this.session.idleTime),
      tabSwitches: this.session.tabSwitches,
      downloadAttempted: this.session.downloadAttempted,
      printAttempted: this.session.printAttempted,
      copyAttempted: this.session.copyAttempted,
    });

    // sendBeacon is more reliable for beforeunload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track/session', payload);
    } else {
      // Fallback to synchronous XHR (less preferred)
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/track/session', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    }
  };

  destroy() {
    // Clean up
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    activityEvents.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleSessionEnd);
    window.removeEventListener('pagehide', this.handleSessionEnd);
    window.removeEventListener('keydown', this.handleKeyboardShortcuts);
    document.removeEventListener('copy', this.handleCopy);

    // Send final session data
    this.handleSessionEnd();
  }
}

// Singleton instance
export const analyticsTracker = new AnalyticsTracker();
