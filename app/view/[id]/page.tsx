'use client';

import { useEffect, useState, use } from 'react';
import ViewerGate from '@/components/ViewerGate';
import LinkExpired from '@/components/LinkExpired';
import dynamic from 'next/dynamic';

const FileViewer = dynamic(() => import('@/components/FileViewer'), {
    ssr: false,
    loading: () => <LoadingScreen message="Loading Viewer..." />
});

const NativeVideoPlayer = dynamic(() => import('@/components/NativeVideoPlayer'), {
    ssr: false,
    loading: () => <LoadingScreen message="Loading Video..." dark />
});

const ImageViewer = dynamic(() => import('@/components/ImageViewer'), {
    ssr: false,
    loading: () => <LoadingScreen message="Loading Image..." dark />
});

const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), {
    ssr: false,
    loading: () => <LoadingScreen message="Loading Audio..." dark />
});

const TextViewer = dynamic(() => import('@/components/TextViewer'), {
    ssr: false,
    loading: () => <LoadingScreen message="Loading..." dark />
});

function LoadingScreen({ message, dark }: { message: string; dark?: boolean }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: dark ? '#0a0a0a' : '#f8fafc',
            color: dark ? 'white' : '#1e293b'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid ' + (dark ? '#333' : '#e2e8f0'),
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p>{message}</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

// NOTE: Removed isEmbeddableVideo() - ALL Track Sites now redirect to external URL
// Video embedding (YouTube, TikTok, Vimeo) was removed because tracking didn't work

function isNativeVideo(mimeType: string): boolean {
    if (!mimeType) return false;
    return mimeType.startsWith('video/');
}

function isImage(mimeType: string): boolean {
    if (!mimeType) return false;
    return mimeType.startsWith('image/');
}

function isAudio(mimeType: string): boolean {
    if (!mimeType) return false;
    return mimeType.startsWith('audio/');
}

function isPDF(mimeType: string, fileName: string): boolean {
    if (mimeType === 'application/pdf') return true;
    if (fileName && fileName.toLowerCase().endsWith('.pdf')) return true;
    return false;
}

function isText(mimeType: string, fileName: string): boolean {
    // Exclude RTF - should be treated as Office document
    if (mimeType?.includes('rtf')) return false;
    if (fileName?.toLowerCase().endsWith('.rtf')) return false;
    if (mimeType?.startsWith('text/')) return true;
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.py', '.css', '.html', '.xml', '.yml', '.yaml', '.sh', '.bash', '.env', '.gitignore'];
    return textExtensions.some(ext => fileName?.toLowerCase().endsWith(ext));
}

function isCode(fileName: string): boolean {
    if (!fileName) return false;
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.sh', '.bash', '.sql', '.html', '.css', '.json', '.xml', '.yml', '.yaml'];
    return codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

function isOfficeDocument(mimeType: string, fileName: string): boolean {
    const officeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'text/rtf',
    ];
    if (mimeType && officeTypes.includes(mimeType)) return true;
    const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf'];
    return officeExtensions.some(ext => fileName?.toLowerCase().endsWith(ext));
}

interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    type?: 'file' | 'url';
    external_url?: string;
    pdf_path?: string;
    hasPassword?: boolean;
    expires_at?: string;
    require_email?: boolean;
    require_name?: boolean;
    allow_download: boolean;
    allow_print: boolean;
}

interface Branding {
    showWatermark: boolean;
    logoUrl: string | null;
    tier: string;
}

export default function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [metadata, setMetadata] = useState<FileMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [accessLogId, setAccessLogId] = useState<string>('');
    const [branding, setBranding] = useState<Branding>({ showWatermark: true, logoUrl: null, tier: 'free' });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await fetch(`/api/file/${id}/metadata`);

                // Handle expired links
                if (res.status === 410) {
                    setError('expired');
                    setLoading(false);
                    return;
                }

                if (res.ok) {
                    const data = await res.json();

                    // Handle boolean values properly
                    const allowDownload = data.allow_download === true;
                    const allowPrint = data.allow_print === true;

                    setMetadata({
                        id: data.id,
                        name: data.name || '',
                        mimeType: data.mime_type || '',
                        size: data.size || 0,
                        type: data.type || 'file',
                        external_url: data.external_url,
                        pdf_path: data.pdf_path,
                        hasPassword: !!data.password_hash || data.hasPassword,
                        expires_at: data.expires_at,
                        require_email: data.require_email === true,
                        require_name: data.require_name === true,
                        allow_download: allowDownload,
                        allow_print: allowPrint
                    });

                    try {
                        const brandingRes = await fetch(`/api/files/${data.id}/branding`);
                        if (brandingRes.ok) {
                            const brandingData = await brandingRes.json();
                            setBranding(brandingData);
                        }
                    } catch (e) {
                        console.error('Branding fetch failed:', e);
                    }
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
    }, [id]);

    // ALL Track Sites (type='url') redirect immediately - no embedding
    useEffect(() => {
        if (authorized && metadata?.type === 'url' && metadata?.external_url) {
            const timer = setTimeout(() => {
                window.location.href = metadata.external_url!;
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [authorized, metadata]);

    const renderContent = () => {
        if (!metadata) return null;

        const fileUrl = `/api/file/${metadata.id}`;
        const mimeType = metadata.mimeType || '';
        const fileName = metadata.name || '';

        const canDownload = metadata.allow_download;
        const canPrint = metadata.allow_print;

        // 1. External URLs (Track Sites) - ALWAYS redirect, no embedding
        if (metadata.type === 'url' && metadata.external_url) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-slate-600">Redirecting to {metadata.name}...</p>
                    <a href={metadata.external_url} className="text-blue-500 hover:underline text-sm">
                        Click here if not redirected
                    </a>
                </div>
            );
        }

        // 2. Uploaded native video files (.mp4, .webm, etc.)
        if (isNativeVideo(mimeType)) {
            return (
                <NativeVideoPlayer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    fileUrl={fileUrl}
                    accessLogId={accessLogId}
                    allowDownload={canDownload}
                    showBranding={branding.showWatermark}
                    logoUrl={branding.logoUrl}
                />
            );
        }

        // 3. Images
        if (isImage(mimeType)) {
            return (
                <ImageViewer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    imageSrc={fileUrl}
                    accessLogId={accessLogId}
                    allowDownload={canDownload}
                    showBranding={branding.showWatermark}
                />
            );
        }

        // 4. Audio files
        if (isAudio(mimeType)) {
            return (
                <AudioPlayer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    audioSrc={fileUrl}
                    accessLogId={accessLogId}
                    allowDownload={canDownload}
                    showBranding={branding.showWatermark}
                />
            );
        }

        // 5. Text/Code files
        if (isText(mimeType, fileName) || isCode(fileName)) {
            return (
                <TextViewer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    fileUrl={fileUrl}
                    accessLogId={accessLogId}
                    allowDownload={canDownload}
                    showBranding={branding.showWatermark}
                />
            );
        }

        // 6. PDF or Office documents with PDF conversion
        if (isPDF(mimeType, fileName) || (isOfficeDocument(mimeType, fileName) && metadata.pdf_path)) {
            return (
                <FileViewer
                    fileId={metadata.id}
                    fileName={metadata.name}
                    pdfUrl={metadata.pdf_path ? `/api/file/${metadata.id}/pdf` : fileUrl}
                    originalUrl={fileUrl}
                    accessLogId={accessLogId}
                    allowDownload={canDownload}
                    allowPrint={canPrint}
                    showBranding={branding.showWatermark}
                    logoUrl={branding.logoUrl}
                />
            );
        }

        // 7. Office documents without PDF conversion - show download prompt
        if (isOfficeDocument(mimeType, fileName)) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 gap-6 p-6">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📄</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">{metadata.name}</h2>
                        <p className="text-slate-600 mb-6">This document is being processed for viewing. You can download it now.</p>
                        {canDownload && (
                            <a
                                href={fileUrl}
                                download={metadata.name}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download File
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        // 8. Fallback - unknown file type
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 gap-6 p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📁</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{metadata.name}</h2>
                    <p className="text-slate-600 mb-6">This file type cannot be previewed. Download to view.</p>
                    {canDownload && (
                        <a
                            href={fileUrl}
                            download={metadata.name}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download File
                        </a>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return <LoadingScreen message="Loading..." />;
    if (error === 'expired') return <LinkExpired />;
    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-center">
                <span className="text-6xl">😢</span>
                <p className="text-slate-600 mt-4">{error}</p>
            </div>
        </div>
    );
    if (!metadata) return null;

    // Check expiration
    if (metadata.expires_at && new Date(metadata.expires_at) < new Date()) {
        return <LinkExpired />;
    }

    // ============================================
    // CRITICAL FIX: ALWAYS render ViewerGate
    // ViewerGate handles both:
    // 1. Showing forms when password/email/name required
    // 2. Auto-granting access (and calling API) when nothing required
    // This ensures access_logs are ALWAYS created!
    // ============================================
    if (!authorized) {
        return (
            <ViewerGate
                fileId={metadata.id}
                fileName={metadata.name}
                mimeType={metadata.mimeType}
                isExternalUrl={metadata.type === 'url'}
                requirePassword={metadata.hasPassword || false}
                requireEmail={metadata.require_email || false}
                requireName={metadata.require_name || false}
                onAccessGranted={(logId) => {
                    setAccessLogId(logId);
                    setAuthorized(true);
                }}
            />
        );
    }

    return renderContent();
}
