'use client';

import { useState, useRef, useEffect } from 'react';
import LinkConfigModal from './LinkConfigModal';

type UploadMode = 'file' | 'site';

interface LinkResult {
    fileId: string;
    slug: string;
    url: string;
}

interface FileUploadProps {
    onUploadSuccess: () => void;
    defaultTab?: 'file' | 'site';
}

export default function FileUpload({ onUploadSuccess, defaultTab = 'file' }: FileUploadProps) {
    const [mode, setMode] = useState<UploadMode>(defaultTab);
    const [isDragging, setIsDragging] = useState(false);
    const [externalUrl, setExternalUrl] = useState('');
    const [urlName, setUrlName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update mode when defaultTab changes
    useEffect(() => {
        setMode(defaultTab);
    }, [defaultTab]);

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
            e.target.value = '';
        }
    };

    const handleUploadZoneClick = () => {
        fileInputRef.current?.click();
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

        setExternalUrl('');
        setUrlName('');

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
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mb-5 text-white">
                    <p className="text-base font-semibold mb-3">
                        Link created successfully!
                    </p>
                    <div className="bg-white/20 p-3 rounded-md flex justify-between items-center gap-3">
                        <span className="text-sm break-all">{createdLink.url}</span>
                        <button
                            onClick={() => copyLink(createdLink.url)}
                            className="bg-white text-green-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-green-50 transition-colors flex-shrink-0"
                        >
                            Copy link
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setMode('file')}
                    className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 ${
                        mode === 'file'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                    Upload file
                </button>
                <button
                    type="button"
                    onClick={() => setMode('site')}
                    className={`px-6 py-3 border-b-2 transition-all flex items-center gap-2 ${
                        mode === 'site'
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                >
                    <span className="material-symbols-outlined text-xl">link</span>
                    Track site
                </button>
            </div>

            {/* File Upload Mode */}
            {mode === 'file' && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <div
                        onClick={handleUploadZoneClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
                            isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                    >
                        <div className={`text-5xl mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>upload_file</span>
                        </div>
                        <p className="text-lg font-medium text-slate-800 mb-2">
                            {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
                        </p>
                        <p className="text-slate-600 text-sm">
                            Supports PDF, Office docs, images, video, audio, code, CSV, and more
                        </p>
                    </div>
                </>
            )}

            {/* Track Site Mode */}
            {mode === 'site' && (
                <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-800">
                            Link name
                        </label>
                        <input
                            type="text"
                            value={urlName}
                            onChange={(e) => setUrlName(e.target.value)}
                            placeholder="e.g., Product Demo Video"
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-slate-800">
                            Website URL
                        </label>
                        <input
                            type="url"
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-2 text-xs text-slate-600">
                            YouTube, Vimeo, Google Drive, Notion, or any website
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="w-full mt-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                        Configure link
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
