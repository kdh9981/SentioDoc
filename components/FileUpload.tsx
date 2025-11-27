'use client';

import { useState, useRef } from 'react';

type UploadMode = 'file' | 'url';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [mode, setMode] = useState<UploadMode>('file');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [urlName, setUrlName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            uploadFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                onUploadSuccess();
            } else {
                const data = await response.json();
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!externalUrl || !urlName) {
            alert('Please enter both URL and name');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('url', externalUrl);
        formData.append('name', urlName);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setExternalUrl('');
                setUrlName('');
                onUploadSuccess();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to create link');
            }
        } catch (error) {
            console.error('Error creating link:', error);
            alert('Failed to create link');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
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
                    {isUploading ? (
                        <div className="animate-fade-in">
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid var(--surface-hover)',
                                borderTopColor: 'var(--primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Uploading your file...</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : (
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
                                Supports PDF, Images, and Text files
                            </p>
                        </div>
                    )}
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
                            disabled={isUploading}
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
                            disabled={isUploading}
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
                        disabled={isUploading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {isUploading ? 'Creating Link...' : 'Create Link'}
                    </button>
                </form>
            )}
        </div>
    );
}
