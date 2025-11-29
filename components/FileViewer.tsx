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
    fileName?: string;
    pdfPath?: string;
}

type ViewerType = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'code' | 'csv' | 'office' | 'unsupported';

function detectViewerType(mimeType: string, fileName: string = ''): ViewerType {
    // PDF
    if (mimeType === 'application/pdf') return 'pdf';

    // Images
    if (mimeType.startsWith('image/')) return 'image';

    // Video
    if (mimeType.startsWith('video/')) return 'video';

    // Audio
    if (mimeType.startsWith('audio/')) return 'audio';

    // CSV
    if (mimeType === 'text/csv') return 'csv';

    // Office Documents
    const officeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (officeTypes.includes(mimeType)) return 'office';

    // Code files (by extension)
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.rb', '.php', '.swift', '.kt', '.sh'];
    if (codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) return 'code';

    // Plain text
    if (mimeType.startsWith('text/')) return 'text';

    return 'unsupported';
}

function getLanguageFromFilename(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'rb': 'ruby',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'sh': 'bash',
        'md': 'markdown',
    };
    return languageMap[ext] || 'javascript';
}

export default function FileViewer({ fileId, mimeType, fileName = '', pdfPath }: FileViewerProps) {
    // If this is an Office document with a PDF version, use PDF viewer
    const viewerType = detectViewerType(mimeType, fileName);
    const shouldUsePdfForOffice = viewerType === 'office' && pdfPath;
    const effectiveViewerType = shouldUsePdfForOffice ? 'pdf' : viewerType;

    // Construct file URL
    // For converted Office docs, we need to construct the storage path correctly
    const fileUrl = shouldUsePdfForOffice
        ? `/api/file/${fileId}?pdf=true`
        : `/api/file/${fileId}`;

    // PDF state
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
    const [viewerEmail, setViewerEmail] = useState<string | null>(null);

    // Text/Code state
    const [textContent, setTextContent] = useState<string>('');
    const [highlightedCode, setHighlightedCode] = useState<string>('');

    // CSV state
    const [csvData, setCsvData] = useState<string[][]>([]);

    // Retrieve viewer email from localStorage
    useEffect(() => {
        const storedEmail = localStorage.getItem(`viewer_email_${fileId}`);
        if (storedEmail) {
            setViewerEmail(storedEmail);
        }
    }, [fileId]);

    // Load text/code content
    useEffect(() => {
        if (effectiveViewerType === 'text' || effectiveViewerType === 'code') {
            fetch(fileUrl)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    if (effectiveViewerType === 'code') {
                        // Load Prism.js dynamically
                        import('prismjs').then(Prism => {
                            const language = getLanguageFromFilename(fileName);
                            // Load language
                            if (language !== 'javascript') {
                                import(`prismjs/components/prism-${language}`).catch(() => { });
                            }
                            const highlighted = Prism.highlight(text, Prism.languages[language] || Prism.languages.javascript, language);
                            setHighlightedCode(highlighted);
                        });
                    }
                });
        }
    }, [effectiveViewerType, fileUrl, fileName]);

    // Load CSV content
    useEffect(() => {
        if (effectiveViewerType === 'csv') {
            fetch(fileUrl)
                .then(res => res.text())
                .then(text => {
                    import('papaparse').then(Papa => {
                        const result = Papa.parse(text);
                        setCsvData(result.data as string[][]);
                    });
                });
        }
    }, [effectiveViewerType, fileUrl]);

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
                    durationSeconds: duration / 1000
                }),
            });
        } catch (error) {
            console.error('Failed to track page view:', error);
        }
    };

    // PDF page tracking
    useEffect(() => {
        if (effectiveViewerType !== 'pdf' || !viewerEmail) return;

        setPageStartTime(Date.now());

        return () => {
            const duration = Date.now() - pageStartTime;
            if (duration > 1000) {
                trackPageDuration(pageNumber, duration);
            }
        };
    }, [pageNumber, viewerEmail]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const nextPage = () => {
        if (pageNumber < numPages) {
            setPageNumber(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (pageNumber > 1) {
            setPageNumber(prev => prev - 1);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(textContent);
    };

    // Keyboard navigation for PDF
    useEffect(() => {
        if (effectiveViewerType !== 'pdf') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                prevPage();
            } else if (event.key === 'ArrowRight') {
                nextPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [numPages]);

    // Common header
    const Header = () => (
        <header style={{
            padding: '16px 24px',
            background: 'transparent',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
                <div style={{ fontSize: '20px' }}>📄</div>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>Document Viewer</span>
            </div>
        </header>
    );

    // VIDEO VIEWER
    if (effectiveViewerType === 'video') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                    <video controls style={{ maxWidth: '100%', maxHeight: '90vh', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <source src={fileUrl} type={mimeType} />
                        Your browser doesn't support video playback.
                    </video>
                </div>
            </div>
        );
    }

    // AUDIO VIEWER
    if (effectiveViewerType === 'audio') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', gap: '32px' }}>
                    <div style={{ fontSize: '64px' }}>🎵</div>
                    <audio controls style={{ width: '100%', maxWidth: '600px' }}>
                        <source src={fileUrl} type={mimeType} />
                        Your browser doesn't support audio playback.
                    </audio>
                    <p style={{ color: 'var(--text-secondary)' }}>{fileName}</p>
                </div>
            </div>
        );
    }

    // TEXT VIEWER
    if (effectiveViewerType === 'text') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, overflow: 'auto', padding: '80px 40px 40px' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: 'white' }}>{fileName}</h2>
                            <button onClick={copyToClipboard} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                Copy Text
                            </button>
                        </div>
                        <pre style={{
                            background: 'var(--surface)',
                            padding: '24px',
                            borderRadius: '8px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            {textContent}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }

    // CODE VIEWER
    if (effectiveViewerType === 'code') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, overflow: 'auto', padding: '80px 40px 40px' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ color: 'white' }}>{fileName}</h2>
                            <button onClick={copyToClipboard} className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                Copy Code
                            </button>
                        </div>
                        <pre style={{
                            background: '#1e1e1e',
                            padding: '24px',
                            borderRadius: '8px',
                            overflow: 'auto',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            <code
                                className={`language-${getLanguageFromFilename(fileName)}`}
                                dangerouslySetInnerHTML={{ __html: highlightedCode || textContent }}
                                style={{ color: '#d4d4d4' }}
                            />
                        </pre>
                    </div>
                </div>
                <style jsx global>{`
                    @import url('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css');
                `}</style>
            </div>
        );
    }

    // CSV VIEWER
    if (effectiveViewerType === 'csv') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, overflow: 'auto', padding: '80px 40px 40px' }}>
                    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                        <h2 style={{ color: 'white', marginBottom: '16px' }}>{fileName}</h2>
                        <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '8px', padding: '16px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                {csvData.length > 0 && (
                                    <>
                                        <thead>
                                            <tr>
                                                {csvData[0].map((header, i) => (
                                                    <th key={i} style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        borderBottom: '2px solid var(--border)',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: '600',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvData.slice(1).map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={cellIndex} style={{
                                                            padding: '12px',
                                                            borderBottom: '1px solid var(--border)',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // OFFICE VIEWER (fallback if no PDF conversion available)
    if (effectiveViewerType === 'office') {
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, padding: '60px 20px 20px' }}>
                    <iframe
                        src={officeViewerUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                        title="Office Document Viewer"
                    />
                </div>
            </div>
        );
    }

    // UNSUPPORTED VIEWER
    if (effectiveViewerType === 'unsupported') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                <Header />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', gap: '24px' }}>
                    <div style={{ fontSize: '64px' }}>📦</div>
                    <h2 style={{ color: 'white' }}>Cannot Preview This File</h2>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                        File type: {mimeType}<br />
                        This file type is not supported for preview.
                    </p>
                    <a href={fileUrl} download className="btn btn-primary">
                        Download File
                    </a>
                </div>
            </div>
        );
    }

    // IMAGE VIEWER
    if (effectiveViewerType === 'image') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', userSelect: 'none' }}>
                <Header />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
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
                </div>
            </div>
        );
    }

    // PDF VIEWER (original implementation)
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', userSelect: 'none' }}>
            <Header />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Navigation Arrows */}
                {numPages > 1 && (
                    <>
                        <button
                            onClick={prevPage}
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

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                            height={window.innerHeight * 0.9}
                            className="pdf-page"
                        />
                    </Document>
                </div>
            </div>

            {/* Page indicator */}
            {numPages > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '14px',
                    pointerEvents: 'none'
                }}>
                    {pageNumber} / {numPages}
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
