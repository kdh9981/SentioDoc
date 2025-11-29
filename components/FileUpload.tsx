'use client';

import { useState, useRef } from 'react';
import LinkConfigModal from './LinkConfigModal';

type UploadMode = 'file' | 'url';

interface LinkResult {
    fileId: string;
    slug: string;
    url: string;
}

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [mode, setMode] = useState<UploadMode>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [urlName, setUrlName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [pendingFileInfo, setPendingFileInfo] = useState<{
        file?: File;
        url?: string;
        name: string;
    } | null>(null);

    // Success state
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdLink, setCreatedLink] = useState<LinkResult | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            openConfigModal(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            openConfigModal(e.target.files[0]);
        }
    };

    const openConfigModal = (file: File) => {
        setPendingFileInfo({
            file,
            name: file.name
        });
        setShowConfigModal(true);
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!externalUrl || !urlName) {
            alert('Please enter both URL and name');
            return;
        }

        setPendingFileInfo({
            url: externalUrl,
            name: urlName
        });
        setShowConfigModal(true);
    };

    const handleConfigComplete = (result: LinkResult) => {
        setShowConfigModal(false);
        setPendingFileInfo(null);
        setCreatedLink(result);
        setShowSuccess(true);

        // Reset form
        setExternalUrl('');
        setUrlName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Auto-hide success after 5 seconds
        setTimeout(() => {
            setShowSuccess(false);
            onUploadSuccess();
        }, 5000);
    };

    const handleConfigCancel = () => {
        setShowConfigModal(false);
        setPendingFileInfo(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    return (
        <div>
            {/* Success Message */}
            {showSuccess && createdLink && (
                <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>
                        ✅ Link created successfully!
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '12px',
                        borderRadius: '6px',
                        wordBreak: 'break-all',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>{createdLink.url}</span>
                        <button
                            onClick={() => copyLink(createdLink.url)}
                            style={{
                                background: 'white',
                                color: '#22c55e',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setMode('file')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: mode === 'file' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: mode === 'file' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: mode === 'file' ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    📄 File Upload
                </button>
                <button
                    onClick={() => setMode('url')}
                    style={{
                        padding: '12px 24px',
                        background: 'none',
                        border: 'none',
                        borderBottom: mode === 'url' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: mode === 'url' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: mode === 'url' ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    🔗 External Link
                </button>
            </div>

            {/* File Upload Mode */}
            {mode === 'file' && (
                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '60px 40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px'
                    }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <div className="animate-fade-in">
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px',
                            color: isDragging ? 'var(--primary)' : 'var(--text-secondary)',
                            transition: 'color 0.2s'
                        }}>
                            📄
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Supports PDF, Office docs, images, video, audio, code, CSV, and more
                        </p>
                    </div>
                </div>
            )}

            {/* URL Input Mode */}
            {mode === 'url' && (
                <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            Link Name
                        </label>
                        <input
                            type="text"
                            value={urlName}
                            onChange={(e) => setUrlName(e.target.value)}
                            placeholder="e.g., YouTube Demo Video"
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            External URL
                        </label>
                        <input
                            type="url"
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--text-primary)',
                                fontSize: '14px'
                            }}
                        />
                        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Enter any external URL (YouTube, Google Drive, website, etc.)
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        Configure Link →
                    </button>
                </form>
            )}

            {/* Link Configuration Modal */}
            {showConfigModal && pendingFileInfo && (
                <LinkConfigModal
                    fileInfo={pendingFileInfo}
                    onComplete={handleConfigComplete}
                    onCancel={handleConfigCancel}
                />
            )}
        </div>
    );
}
