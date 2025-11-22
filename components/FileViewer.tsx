'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FileViewerProps {
    fileId: string;
    mimeType: string;
}

export default function FileViewer({ fileId, mimeType }: FileViewerProps) {
    const fileUrl = `/api/file/${fileId}`;
    const isImage = mimeType.startsWith('image/');
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
    const [viewerEmail, setViewerEmail] = useState<string | null>(null);

    // Retrieve viewer email from localStorage (set during gate access)
    useEffect(() => {
        const storedEmail = localStorage.getItem(`viewer_email_${fileId}`);
        if (storedEmail) {
            setViewerEmail(storedEmail);
        }
    }, [fileId]);

    const trackPageDuration = async (page: number, duration: number) => {
        if (!viewerEmail) return;
        try {
            await fetch('/api/track/page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    viewerEmail,
                    pageNumber: page,
                    durationSeconds: duration / 1000 // Convert to seconds
                }),
            });
        } catch (error) {
            console.error('Failed to track page view:', error);
        }
    };

    // Track when page changes
    useEffect(() => {
        // When page changes, track the PREVIOUS page's duration
        const currentTime = Date.now();
        const duration = currentTime - pageStartTime;

        // We need to track the *previous* page number, but state update happens after.
        // So we'll use a ref or just track "on unmount" of the effect.
        // Actually, simpler: when pageNumber changes, we log the duration for the *previous* render cycle.
        // But we don't have the "previous" page number easily available without a ref.

        // Let's use a ref to store the current page number so we can access it in the cleanup/next effect
    }, [pageNumber]); // This logic is tricky with just useEffect deps.

    // Better approach: Use a ref to track the active page and start time
    const activePageRef = useRef<number>(1);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        activePageRef.current = pageNumber;
        startTimeRef.current = Date.now();

        return () => {
            // Cleanup: calculate duration and send
            const duration = Date.now() - startTimeRef.current;
            if (duration > 500) { // Only track if > 0.5s
                trackPageDuration(activePageRef.current, duration);
            }
        };
    }, [pageNumber, viewerEmail]); // Re-run when page changes. Cleanup runs first.

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            return Math.max(1, Math.min(newPage, numPages));
        });
    }

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                previousPage();
            } else if (event.key === 'ArrowRight') {
                nextPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [numPages]); // Re-bind when numPages changes (though logic inside uses functional update, good practice)

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a0a',
            userSelect: 'none' // Prevent text selection for "presentation" feel
        }}>
            {/* Minimal Header */}
            <header style={{
                padding: '16px 24px',
                background: 'transparent', // Transparent header for presentation mode
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'none' // Let clicks pass through to viewer
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
                    <div style={{ fontSize: '20px' }}>📄</div>
                    <span style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>Document Viewer</span>
                </div>
                {/* Download button REMOVED */}
            </header>

            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Navigation Arrows */}
                {!isImage && numPages > 1 && (
                    <>
                        <button
                            onClick={previousPage}
                            disabled={pageNumber <= 1}
                            style={{
                                position: 'absolute',
                                left: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '24px',
                                padding: '20px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                zIndex: 20,
                                opacity: pageNumber <= 1 ? 0 : 1,
                                transition: 'opacity 0.2s, background 0.2s'
                            }}
                            className="nav-arrow"
                        >
                            ‹
                        </button>
                        <button
                            onClick={nextPage}
                            disabled={pageNumber >= numPages}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                fontSize: '24px',
                                padding: '20px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                zIndex: 20,
                                opacity: pageNumber >= numPages ? 0 : 1,
                                transition: 'opacity 0.2s, background 0.2s'
                            }}
                            className="nav-arrow"
                        >
                            ›
                        </button>
                    </>
                )}

                {isImage ? (
                    <img
                        src={fileUrl}
                        alt="Document"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            borderRadius: '4px'
                        }}
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
                            error={<div style={{ color: 'red' }}>Failed to load PDF.</div>}
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                height={window.innerHeight * 0.9} // Fit to height
                                className="pdf-page"
                            />
                        </Document>
                    </div>
                )}
            </div>

            {/* Page Indicator */}
            {!isImage && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '14px',
                    zIndex: 20
                }}>
                    Page {pageNumber} of {numPages || '--'}
                </div>
            )}

            <style jsx global>{`
                .nav-arrow:hover {
                    background: rgba(255,255,255,0.2) !important;
                }
                .pdf-page canvas {
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
