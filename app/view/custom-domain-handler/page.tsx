'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ViewerGate from '@/components/ViewerGate';
import LinkExpired from '@/components/LinkExpired';
import dynamic from 'next/dynamic';

// Dynamic imports for all viewer components
const FileViewer = dynamic(() => import('@/components/FileViewer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

const VideoViewer = dynamic(() => import('@/components/VideoViewer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

const NativeVideoPlayer = dynamic(() => import('@/components/NativeVideoPlayer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

const ImageViewer = dynamic(() => import('@/components/ImageViewer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

const TextViewer = dynamic(() => import('@/components/TextViewer'), {
    ssr: false,
    loading: () => <LoadingScreen />
});

// Loading screen component
function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#64748b' }}>Loading viewer...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// File type detection helpers
function isEmbeddableVideo(url: string): boolean {
    const patterns = [
        /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)/i,
        /(?:vimeo\.com\/(?:video\/)?)/i,
        /(?:loom\.com\/share\/)/i,
        /(?:wistia\.com\/medias\/)/i
    ];
    return patterns.some(pattern => pattern.test(url));
}

function isNativeVideo(mimeType: string): boolean {
    return mimeType?.startsWith('video/') || false;
}

function isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/') || false;
}

function isAudio(mimeType: string): boolean {
    return mimeType?.startsWith('audio/') || false;
}

function isPDF(mimeType: string, fileName: string): boolean {
    return mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf') || false;
}

function isText(mimeType: string, fileName: string): boolean {
    // Exclude RTF - should be treated as Office document
    if (mimeType?.includes('rtf')) return false;
    if (fileName?.toLowerCase().endsWith('.rtf')) return false;
    if (mimeType?.startsWith('text/')) return true;
    const textExtensions = ['.txt', '.md', '.markdown', '.log', '.ini', '.cfg', '.conf'];
    return textExtensions.some(ext => fileName?.toLowerCase().endsWith(ext)) || false;
}

function isCode(fileName: string): boolean {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.java', '.c', '.cpp', '.h', '.cs', '.go', '.rs', '.php', '.swift', '.kt', '.scala', '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.sql', '.sh', '.bash', '.zsh', '.ps1', '.vue', '.svelte'];
    return codeExtensions.some(ext => fileName?.toLowerCase().endsWith(ext)) || false;
}

function isOfficeDocument(mimeType: string, fileName: string): boolean {
    const officeMimeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'text/rtf'
    ];
    if (officeMimeTypes.includes(mimeType)) return true;
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf'];
    return officeExtensions.some(ext => fileName?.toLowerCase().endsWith(ext)) || false;
}

interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    type?: 'file' | 'url';
    external_url?: string;
    pdf_path?: string;
    require_email?: boolean;
    require_name?: boolean;
    allow_download?: boolean;
    allow_print?: boolean;
    password_hash?: string | null;
    expires_at?: string | null;
}

function CustomDomainHandlerContent() {
    const searchParams = useSearchParams();

    const [resolvedDomain, setResolvedDomain] = useState<string | null>(null);
    const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<FileMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [accessLogId, setAccessLogId] = useState<string | null>(null);

    // Resolve domain and slug on mount
    useEffect(() => {
        let domain = searchParams.get('domain');
        let slug = searchParams.get('slug');

        if (!domain || !slug) {
            const pathname = window.location.pathname;
            const reservedPaths = ['/view', '/api', '/auth', '/dashboard', '/pricing'];
            const isReserved = reservedPaths.some(p => pathname.startsWith(p)) || pathname === '/';

            if (!isReserved && pathname.length > 1) {
                slug = pathname.slice(1);
                domain = 'DEFAULT';
            }
        }

        setResolvedDomain(domain);
        setResolvedSlug(slug);
    }, [searchParams]);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!resolvedDomain || !resolvedSlug) {
                if (resolvedDomain === null && resolvedSlug === null) {
                    return;
                }
                setError('Invalid link');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/file/lookup?domain=${resolvedDomain}&slug=${resolvedSlug}`);
                if (res.ok) {
                    const data = await res.json();

                    setMetadata({
                        id: data.id,
                        name: data.name,
                        mimeType: data.mime_type || '',
                        size: data.size,
                        type: data.type || 'file',
                        external_url: data.external_url,
                        pdf_path: data.pdf_path,
                        require_email: data.require_email ?? false,
                        require_name: data.require_name ?? false,
                        allow_download: data.allow_download ?? true,
                        allow_print: data.allow_print ?? true,
                        password_hash: data.password_hash,
                        expires_at: data.expires_at
                    });

                } else {
                    setError('File not found');
                }
            } catch (err) {
                setError('Failed to load file');
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [resolvedDomain, resolvedSlug]);

    // Handle external URL redirect after viewer gate
    useEffect(() => {
        if (authorized && metadata?.type === 'url' && metadata?.external_url && !isEmbeddableVideo(metadata.external_url)) {
            setTimeout(() => {
                window.location.href = metadata.external_url!;
            }, 1500);
        }
    }, [authorized, metadata]);

    // Render the appropriate viewer based on file type
    const renderContent = () => {
        if (!metadata) return null;

        const fileUrl = `/api/file/${metadata.id}`;
        const mimeType = metadata.mimeType || '';
        const fileName = metadata.name || '';
        const canDownload = metadata.allow_download === true;
        const canPrint = metadata.allow_print === true;

        // 1. External URLs
        if (metadata.type === 'url' && metadata.external_url) {
            if (isEmbeddableVideo(metadata.external_url)) {
                return (
                    <VideoViewer
                        fileId={metadata.id}
                        fileName={metadata.name}
                        videoUrl={metadata.external_url}
                        accessLogId={accessLogId}
                    />
                );
            }
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>Redirecting to {metadata.name}...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            );
        }

        // 2. Images
        if (isImage(mimeType)) {
            return (
                <ImageViewer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    imageSrc={fileUrl}
                    accessLogId={accessLogId || ''}
                    allowDownload={canDownload}
                />
            );
        }

        // 3. Native Video (mp4, webm, etc.)
        if (isNativeVideo(mimeType)) {
            return (
                <NativeVideoPlayer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    videoSrc={fileUrl}
                    accessLogId={accessLogId || ''}
                    allowDownload={canDownload}
                />
            );
        }

        // 4. Audio
        if (isAudio(mimeType)) {
            return (
                <AudioPlayer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    audioSrc={fileUrl}
                    accessLogId={accessLogId || ''}
                    allowDownload={canDownload}
                />
            );
        }

        // 5. Office Documents (use Microsoft Office Online viewer)
        if (isOfficeDocument(mimeType, fileName)) {
            const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

            // Branding elements
            const OfficeBranding = () => (
                <>
                    {/* Logo - Top Left */}
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

                    {/* Powered by - Bottom Center */}
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

                    {/* Download Button - Top Right */}
                    {canDownload && (
                        <div style={{
                            position: 'fixed',
                            top: '16px',
                            right: '16px',
                            zIndex: 99999,
                        }}>
                            <a
                                href={fileUrl}
                                download={fileName}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                }}
                            >
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </a>
                        </div>
                    )}
                </>
            );

            if (isLocalhost) {
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-8">
                        <OfficeBranding />
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                            <div className="text-6xl mb-4">📄</div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">{fileName}</h2>
                            <p className="text-slate-600 mb-6">
                                Office documents require a public URL for preview.
                                Download the file to view it locally.
                            </p>
                        </div>
                    </div>
                );
            }

            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const fullFileUrl = `${baseUrl}${fileUrl}`;
            const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullFileUrl)}`;

            return (
                <div style={{ height: '100vh', background: '#0a0a0a' }}>
                    <OfficeBranding />
                    <iframe
                        src={officeViewerUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                        title={fileName}
                    />
                </div>
            );
        }

        // 6. Text/Code files
        if (isText(mimeType, fileName) || isCode(fileName)) {
            return (
                <TextViewer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    textSrc={fileUrl}
                    accessLogId={accessLogId || ''}
                    isCode={isCode(fileName)}
                    allowDownload={canDownload}
                    allowPrint={canPrint}
                />
            );
        }

        // 7. PDF or fallback (everything else goes to FileViewer)
        return (
            <FileViewer
                fileId={metadata.id}
                mimeType={mimeType}
                fileName={fileName}
                pdfPath={metadata.pdf_path}
                allowDownload={canDownload}
                allowPrint={canPrint}
                accessLogId={accessLogId || undefined}
            />
        );
    };

    if (loading) {
        return <LoadingScreen />;
    }

    if (error || !metadata) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column'
            }}>
                <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1e293b' }}>404</h1>
                <p style={{ color: '#64748b' }}>{error || 'File not found'}</p>
            </div>
        );
    }

    // Check if link is expired
    if (metadata.expires_at && new Date(metadata.expires_at) < new Date()) {
        return <LinkExpired />;
    }

    if (!authorized) {
        return (
            <ViewerGate
                fileId={metadata.id}
                fileName={metadata.name}
                requireEmail={metadata.require_email}
                requireName={metadata.require_name}
                requirePassword={!!metadata.password_hash}
                onAccessGranted={(logId) => {
                    setAccessLogId(logId || null);
                    setAuthorized(true);
                }}
            />
        );
    }

    return renderContent();
}

export default function CustomDomainHandlerPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <CustomDomainHandlerContent />
        </Suspense>
    );
}
