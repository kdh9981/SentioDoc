'use client';

import { useEffect, useState, use } from 'react';
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
}

export default function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [metadata, setMetadata] = useState<FileMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await fetch(`/api/file/${id}/metadata`);
                if (res.ok) {
                    const data = await res.json();
                    // Map Supabase snake_case to camelCase
                    setMetadata({
                        id: data.id,
                        name: data.name,
                        mimeType: data.mime_type, // Convert snake_case to camelCase
                        size: data.size
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
    }, [id]);

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

    return <FileViewer fileId={metadata.id} mimeType={metadata.mimeType} />;
}
