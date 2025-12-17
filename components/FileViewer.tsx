'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FileViewerProps {
    fileId: string;
    mimeType: string;
    fileName?: string;
    pdfPath?: string | null;
    accessLogId?: string;
    totalPages?: number;
    allowDownload?: boolean;
    allowPrint?: boolean;
    showBranding?: boolean;
}

export default function FileViewer({
    fileId,
    mimeType,
    fileName = '',
    pdfPath,
    accessLogId,
    totalPages: propTotalPages,
    allowDownload = true,
    allowPrint = true,
    showBranding = true,
}: FileViewerProps) {
    const fileUrl = `/api/file/${fileId}`;
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [downloading, setDownloading] = useState(false);
    const [zoom, setZoom] = useState<number>(100);
    const containerRef = useRef<HTMLDivElement>(null);

    // ============================================
    // TRACKING REFS (avoid stale closures)
    // ============================================
    const sessionStartTime = useRef<number>(Date.now());
    const pageStartTime = useRef<number>(Date.now());
    const pagesTimeData = useRef<Record<number, number>>({});
    const maxPageReached = useRef<number>(1);
    const pagesViewed = useRef<Set<number>>(new Set([1]));
    const hasDownloadedRef = useRef<boolean>(false);
    const downloadCountRef = useRef<number>(0);
    const numPagesRef = useRef<number>(0);
    const currentPageRef = useRef<number>(1);
    const previousPage = useRef<number>(1);
    const isFirstRender = useRef<boolean>(true);
    const hasSentFinalRef = useRef<boolean>(false);

    // Debounce refs
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_MS = 1000;

    const MIN_ZOOM = 50;
    const MAX_ZOOM = 200;
    const ZOOM_STEP = 25;

    // ============================================
    // BUILD SESSION DATA
    // ============================================
    const buildSessionData = useCallback(() => {
        const currentPage = currentPageRef.current;
        const totalPagesCount = numPagesRef.current || propTotalPages || 1;

        // Calculate time for current page (with decimal precision for sub-second tracking)
        const currentPageTime = Math.round((Date.now() - pageStartTime.current) / 100) / 10; // 0.1s precision
        const finalPagesTimeData = { ...pagesTimeData.current };
        if (currentPageTime > 0 && currentPageTime < 1800) {
            finalPagesTimeData[currentPage] = (finalPagesTimeData[currentPage] || 0) + currentPageTime;
        }

        const totalDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        const completionPercentage = Math.round((maxPageReached.current / totalPagesCount) * 100);

        // Calculate engagement score
        let engagementScore = 0;
        // Completion (0-40 points)
        engagementScore += Math.min(40, completionPercentage * 0.4);
        // Time spent (0-30 points) - 30s per page expected
        const expectedTime = Math.max(totalPagesCount * 30, 30);
        const timeRatio = Math.min(totalDuration / expectedTime, 2);
        engagementScore += timeRatio * 15;
        // Pages viewed (0-20 points)
        const viewedRatio = pagesViewed.current.size / totalPagesCount;
        engagementScore += viewedRatio * 20;
        // Download bonus (0-10 points)
        if (hasDownloadedRef.current) {
            engagementScore += 10;
        }
        engagementScore = Math.round(Math.min(100, engagementScore));

        return {
            accessLogId,
            sessionEndAt: new Date().toISOString(),
            totalDurationSeconds: totalDuration,
            exitPage: currentPage,
            pagesViewedCount: pagesViewed.current.size,
            maxPageReached: maxPageReached.current,
            completionPercentage,
            pagesTimeData: finalPagesTimeData,
            totalPages: totalPagesCount,
            downloaded: hasDownloadedRef.current,
            downloadCount: downloadCountRef.current,
            engagementScore,
            intentSignal: engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low',
        };
    }, [accessLogId, propTotalPages]);

    // ============================================
    // SEND SESSION DATA
    // ============================================
    const sendSessionData = useCallback((isFinalSend: boolean = false) => {
        if (!accessLogId) return;
        if (hasSentFinalRef.current && isFinalSend) return;

        if (isFinalSend) {
            hasSentFinalRef.current = true;
            // Clear any pending debounce
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        }

        const data = buildSessionData();
        console.log(`[FileViewer] ${isFinalSend ? 'FINAL' : 'Debounced'} send:`, JSON.stringify(data, null, 2));

        if (isFinalSend && navigator.sendBeacon) {
            const success = navigator.sendBeacon('/api/viewer/session', JSON.stringify(data));
            console.log('[FileViewer] sendBeacon result:', success);
        } else {
            fetch('/api/viewer/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: isFinalSend,
            }).catch(err => console.error('[FileViewer] Send error:', err));
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
    // SEND PAGE VIEW (for page_views table)
    // ============================================
    const sendPageView = useCallback(async (page: number, durationSeconds: number) => {
        if (!accessLogId || !fileId) return;

        try {
            await fetch('/api/track/page-enhanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessLogId,
                    fileId,
                    pageNumber: page,
                    duration: durationSeconds,
                    scrollDepth: 100,
                }),
            });
        } catch (error) {
            console.error('[FileViewer] Failed to send page view:', error);
        }
    }, [accessLogId, fileId]);

    // ============================================
    // PAGE CHANGE TRACKING
    // ============================================
    useEffect(() => {
        currentPageRef.current = pageNumber;

        if (pageNumber > 0) {
            // Calculate time spent on previous page (skip on first render)
            if (!isFirstRender.current) {
                // 0.1s precision: Math.round(ms / 100) / 10 = seconds with 1 decimal
                const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 100) / 10;

                if (timeOnPage > 0 && timeOnPage < 1800) {
                    const prevPage = previousPage.current;
                    pagesTimeData.current[prevPage] = (pagesTimeData.current[prevPage] || 0) + timeOnPage;
                    console.log(`[FileViewer] Page ${prevPage} time: ${timeOnPage}s`);

                    // Send page view for previous page
                    if (prevPage !== pageNumber) {
                        sendPageView(prevPage, timeOnPage);
                    }
                }

                // Trigger debounced send on page change
                debouncedSend();
            } else {
                isFirstRender.current = false;
                console.log('[FileViewer] First render - initializing');
            }

            // Update tracking for current page
            pagesViewed.current.add(pageNumber);
            if (pageNumber > maxPageReached.current) {
                maxPageReached.current = pageNumber;
            }

            // Reset page timer
            pageStartTime.current = Date.now();
            previousPage.current = pageNumber;
        }
    }, [pageNumber, sendPageView, debouncedSend]);

    // ============================================
    // PERIODIC SEND (every 1 second for better data capture)
    // ============================================
    useEffect(() => {
        if (!accessLogId) return;

        const periodicInterval = setInterval(() => {
            // Only send if we have meaningful data
            if (pagesViewed.current.size > 0) {
                sendSessionData(false);
            }
        }, 1000); // Send every 1 second

        return () => {
            clearInterval(periodicInterval);
        };
    }, [accessLogId, sendSessionData]);

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
            // Send on unmount
            sendSessionData(true);
        };
    }, [sendSessionData]);

    // ============================================
    // PDF LOAD SUCCESS
    // ============================================
    const onDocumentLoadSuccess = ({ numPages: loadedPages }: { numPages: number }) => {
        console.log(`[FileViewer] PDF loaded with ${loadedPages} pages`);
        setNumPages(loadedPages);
        numPagesRef.current = loadedPages;
    };

    // ============================================
    // NAVIGATION
    // ============================================
    const nextPage = useCallback(() => {
        if (pageNumber < numPages) setPageNumber(prev => prev + 1);
    }, [pageNumber, numPages]);

    const prevPage = useCallback(() => {
        if (pageNumber > 1) setPageNumber(prev => prev - 1);
    }, [pageNumber]);

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(100);
    }, []);

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                prevPage();
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
                event.preventDefault();
                nextPage();
            }

            if (event.ctrlKey || event.metaKey) {
                if (event.key === '=' || event.key === '+') {
                    event.preventDefault();
                    zoomIn();
                } else if (event.key === '-') {
                    event.preventDefault();
                    zoomOut();
                } else if (event.key === '0') {
                    event.preventDefault();
                    resetZoom();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextPage, prevPage, zoomIn, zoomOut, resetZoom]);

    // ============================================
    // DOWNLOAD HANDLER - IMMEDIATE TRACKING
    // ============================================
    const handleDownload = async () => {
        console.log('[FileViewer] Download button clicked');
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
        }).catch(err => console.error('[FileViewer] Download track error:', err));

        try {
            // Get signed download URL from API
            const response = await fetch(`/api/file/${fileId}/download`);
            const data = await response.json();

            if (!response.ok || !data.downloadUrl) {
                throw new Error(data.error || 'Failed to get download URL');
            }

            // Use the signed URL with download disposition
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.fileName || fileName || 'download';
            link.target = '_blank'; // Open in new context to trigger download
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`[FileViewer] Download initiated, count=${downloadCountRef.current}`);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: try direct file URL with download attribute
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
                    onClick={zoomOut}
                    disabled={zoom <= MIN_ZOOM}
                    style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: zoom <= MIN_ZOOM ? '#f1f5f9' : '#f8fafc',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
                        color: zoom <= MIN_ZOOM ? '#94a3b8' : '#374151',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        transition: 'all 0.15s',
                    }}
                    title="Zoom out (Ctrl -)"
                >
                    −
                </button>

                <button
                    onClick={resetZoom}
                    style={{
                        minWidth: '60px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: zoom === 100 ? '#f1f5f9' : '#eff6ff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: zoom === 100 ? '#64748b' : '#3b82f6',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.15s',
                    }}
                    title="Reset to 100% (Ctrl 0)"
                >
                    {zoom}%
                </button>

                <button
                    onClick={zoomIn}
                    disabled={zoom >= MAX_ZOOM}
                    style={{
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: zoom >= MAX_ZOOM ? '#f1f5f9' : '#f8fafc',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
                        color: zoom >= MAX_ZOOM ? '#94a3b8' : '#374151',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        transition: 'all 0.15s',
                    }}
                    title="Zoom in (Ctrl +)"
                >
                    +
                </button>
            </div>
        );
    };

    const pdfUrl = pdfPath ? `/api/file/${fileId}?pdf=true` : fileUrl;
    const baseHeight = typeof window !== 'undefined' ? window.innerHeight * 0.75 : 700;
    const scaledHeight = baseHeight * (zoom / 100);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', userSelect: 'none' }}>
            <Branding />
            <ControlBar />
            <ZoomControls />

            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: zoom > 100 ? 'flex-start' : 'center',
                    position: 'relative',
                    overflow: 'auto',
                    padding: '20px',
                }}
            >
                {numPages > 1 && (
                    <>
                        <button
                            onClick={prevPage}
                            disabled={pageNumber <= 1}
                            style={{
                                position: 'fixed',
                                left: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: pageNumber <= 1 ? 'transparent' : 'rgba(255,255,255,0.15)',
                                border: 'none',
                                color: 'white',
                                fontSize: '36px',
                                padding: '20px 24px',
                                borderRadius: '50%',
                                cursor: pageNumber <= 1 ? 'default' : 'pointer',
                                zIndex: 20,
                                opacity: pageNumber <= 1 ? 0.2 : 0.8,
                                transition: 'all 0.2s',
                            }}
                            title="Previous page"
                        >
                            ‹
                        </button>
                        <button
                            onClick={nextPage}
                            disabled={pageNumber >= numPages}
                            style={{
                                position: 'fixed',
                                right: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: pageNumber >= numPages ? 'transparent' : 'rgba(255,255,255,0.15)',
                                border: 'none',
                                color: 'white',
                                fontSize: '36px',
                                padding: '20px 24px',
                                borderRadius: '50%',
                                cursor: pageNumber >= numPages ? 'default' : 'pointer',
                                zIndex: 20,
                                opacity: pageNumber >= numPages ? 0.2 : 0.8,
                                transition: 'all 0.2s',
                            }}
                            title="Next page"
                        >
                            ›
                        </button>
                    </>
                )}

                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
                    error={<div style={{ color: '#ef4444', textAlign: 'center' }}>
                        <p>Failed to load PDF.</p>
                        {allowDownload && (
                            <button onClick={handleDownload} style={{ color: '#3b82f6', marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                Download instead
                            </button>
                        )}
                    </div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        height={scaledHeight}
                        className="pdf-page"
                    />
                </Document>
            </div>

            {numPages > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '70px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '14px',
                    zIndex: 100,
                }}>
                    {pageNumber} / {numPages}
                </div>
            )}

            <style jsx global>{`
                .pdf-page canvas {
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    border-radius: 4px;
                }
                @media print {
                    .pdf-page {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
