'use client';

import { useState, useRef } from 'react';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
                alert('Upload failed');
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

    return (
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
    );
}
