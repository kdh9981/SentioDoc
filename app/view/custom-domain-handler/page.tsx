'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import ViewerGate from '@/components/ViewerGate';
import dynamic from 'next/dynamic';

const FileViewer = dynamic(() => import('@/components/FileViewer'), {
    ssr: false,
    loading: () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Viewer...</div>
});

interface FileMetadata {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    type?: 'file' | 'url';
    external_url?: string;
    pdf_path?: string;
}

export default function CustomDomainHandlerPage() {
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');
    const slug = searchParams.get('slug');

    const [metadata, setMetadata] = useState<FileMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!domain || !slug) {
                setError('Invalid link');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/file/lookup?domain=${domain}&slug=${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setMetadata({
                        id: data.id,
                        name: data.name,
                        mimeType: data.mime_type,
                        size: data.size,
                        type: data.type || 'file',
                        external_url: data.external_url,
                        pdf_path: data.pdf_path
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
    }, [domain, slug]);

    // Handle external URL redirect after viewer gate
    useEffect(() => {
        if (authorized && metadata?.type === 'url' && metadata?.external_url) {
            // Redirect to external URL
            window.location.href = metadata.external_url;
        }
    }, [authorized, metadata]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    if (error || !metadata) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <h1>404</h1>
                <p>{error || 'File not found'}</p>
            </div>
        );
    }

    if (!authorized) {
        return (
            <ViewerGate
                fileId={metadata.id}
                fileName={metadata.name}
                onAccessGranted={() => setAuthorized(true)}
            />
        );
    }

    // Show redirecting message for URLs
    if (metadata.type === 'url') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--surface-hover)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p>Redirecting to {metadata.name}...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <FileViewer
            fileId={metadata.id}
            mimeType={metadata.mimeType}
            fileName={metadata.name}
            pdfPath={metadata.pdf_path}
        />
    );
}
