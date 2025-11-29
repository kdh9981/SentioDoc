'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from "next-auth/react";
import FileUpload from './FileUpload';
import ThemeToggle from './ThemeToggle';

interface FileRecord {
    id: string;
    name: string;
    views: number;
    createdAt: string;
    slug?: string;
    deletedAt?: string;
    type?: 'file' | 'url';
    externalUrl?: string;
}

interface ActivityLog {
    viewerName: string;
    viewerEmail: string;
    country: string;
    accessedAt: string;
    fileName: string;
    fileId: string;
}

interface GlobalStats {
    totalViews: number;
    uniqueViewers: number;
    topCountry: string;
    countryRanking?: Array<{ country: string; count: number }>;
}

export default function Dashboard() {
    const { data: session } = useSession();
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<GlobalStats>({ totalViews: 0, uniqueViewers: 0, topCountry: 'N/A' });

    const fetchDashboardData = async () => {
        try {
            // Fetch files
            const filesRes = await fetch('/api/files');
            const filesData = await filesRes.json();
            if (filesData.files) {
                setFiles(filesData.files);
            }

            // Fetch global analytics
            const analyticsRes = await fetch('/api/analytics/global');
            const analyticsData = await analyticsRes.json();
            if (analyticsData.recentActivity) {
                setRecentActivity(analyticsData.recentActivity);
                setStats(analyticsData.stats);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedFileLogs, setSelectedFileLogs] = useState<any[] | null>(null);
    const [selectedFilePageStats, setSelectedFilePageStats] = useState<any[] | null>(null);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const copyLink = (file: FileRecord) => {
        const linkId = file.slug || file.id;
        const link = `${window.location.origin}/view/${linkId}`;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    };



    const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
    const [createLinkFile, setCreateLinkFile] = useState<FileRecord | null>(null);
    const [customSlug, setCustomSlug] = useState('');
    const [isSavingSlug, setIsSavingSlug] = useState(false);
    const [slugAvailability, setSlugAvailability] = useState<'checking' | 'available' | 'taken' | null>(null);

    const handleCreateLink = (file: FileRecord) => {
        setCreateLinkFile(file);
        setCustomSlug('');
        setSlugAvailability(null);
        setShowCreateLinkModal(true);
    };

    // Check slug availability with debounce
    useEffect(() => {
        if (!customSlug) {
            setSlugAvailability(null);
            return;
        }

        setSlugAvailability('checking');
        console.log('[FRONTEND] Checking slug:', customSlug);

        const timeoutId = setTimeout(async () => {
            try {
                const url = `/api/slug/check?slug=${encodeURIComponent(customSlug)}`;
                console.log('[FRONTEND] Fetching:', url);

                const res = await fetch(url);
                const data = await res.json();

                console.log('[FRONTEND] Response:', { status: res.status, ok: res.ok, data });

                if (res.ok) {
                    const newAvailability = data.available ? 'available' : 'taken';
                    console.log('[FRONTEND] Setting availability to:', newAvailability);
                    setSlugAvailability(newAvailability);
                } else {
                    console.log('[FRONTEND] API error, setting to null');
                    setSlugAvailability(null);
                }
            } catch (error) {
                console.error('[FRONTEND] Failed to check slug availability:', error);
                setSlugAvailability(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [customSlug]);

    const saveSlug = async () => {
        if (!createLinkFile || !customSlug) return;

        setIsSavingSlug(true);
        try {
            const res = await fetch(`/api/files/${createLinkFile.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: customSlug })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.details || data.error || 'Failed to create link');
            }

            alert('Link created successfully!');
            setShowCreateLinkModal(false);
            fetchDashboardData(); // Refresh list
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSavingSlug(false);
        }
    };

    const handleDelete = async (file: FileRecord) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/files/${file.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Failed to delete file');
            }

            fetchDashboardData(); // Refresh list
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete file');
        }
    };

    const viewAnalytics = async (file: FileRecord) => {
        try {
            const res = await fetch(`/api/files/${file.id}/analytics`);
            const data = await res.json();
            if (data.logs) {
                setSelectedFileLogs(data.logs);
                setSelectedFilePageStats(data.pageStats || []);
                setSelectedFileName(file.name);
                setShowAnalyticsModal(true);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            alert('Failed to load analytics');
        }
    };

    const formatKST = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }) + ' (KST)';
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '40px 20px' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em' }}>Document Viewer</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Secure document sharing and analytics.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {session?.user && (
                        <div style={{ textAlign: 'right', marginRight: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                {session.user.name || session.user.email}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {session.user.email}
                            </div>
                        </div>
                    )}
                    <ThemeToggle />
                    <button
                        onClick={() => signOut()}
                        className="btn btn-secondary"
                        style={{ fontSize: '14px' }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Views</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary)' }}>{stats.totalViews}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Unique Viewers</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary)' }}>{stats.uniqueViewers}</div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>Country Ranking</div>
                    {stats.countryRanking && stats.countryRanking.length > 0 ? (
                        <div style={{
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            paddingBottom: '4px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '12px',
                                height: '80px',
                                minWidth: `${stats.countryRanking.length * 50}px`,
                                paddingTop: '5px'
                            }}>
                                {stats.countryRanking.map((item, index) => {
                                    const maxCount = stats.countryRanking![0].count;
                                    const heightPercentage = (item.count / maxCount) * 100;
                                    return (
                                        <div key={index} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '50px',
                                            gap: '8px'
                                        }}>
                                            {/* Count label on top */}
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: 'var(--text-primary)',
                                                minHeight: '18px'
                                            }}>
                                                {item.count}
                                            </div>
                                            {/* Vertical bar */}
                                            <div style={{
                                                width: '100%',
                                                height: `${heightPercentage}%`,
                                                background: 'linear-gradient(180deg, var(--primary) 0%, #8b5cf6 100%)',
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: '20px',
                                                transition: 'height 0.3s ease'
                                            }} />
                                            {/* Country name at bottom */}
                                            <div style={{
                                                fontSize: '10px',
                                                color: 'var(--text-secondary)',
                                                textAlign: 'center',
                                                wordBreak: 'break-word',
                                                width: '100%'
                                            }}>
                                                {item.country}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', paddingTop: '30px' }}>
                            No data yet
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '40px', alignItems: 'start' }}>
                {/* Left Column: Upload & Files */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div className="card">
                        <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>Create Link</h2>
                        <p style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Track views on documents or external links (YouTube, X, websites, and more)
                        </p>
                        <FileUpload onUploadSuccess={fetchDashboardData} />
                    </div>

                    <div className="card">
                        <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>Your Files</h2>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : files.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No files uploaded yet.
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', paddingBottom: '12px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ textAlign: 'right', paddingBottom: '12px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map((file) => (
                                            <tr key={file.id} style={{
                                                borderTop: '1px solid var(--border)',
                                                opacity: file.deletedAt ? 0.6 : 1,
                                                background: file.deletedAt ? 'rgba(255,255,255,0.02)' : 'transparent'
                                            }}>
                                                <td style={{ padding: '16px 0', maxWidth: '300px' }}>
                                                    <div style={{
                                                        fontWeight: '500',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }} title={file.name}>
                                                        <span style={{ flexShrink: 0, fontSize: '18px' }}>
                                                            {file.type === 'url' ? '🔗' : '📄'}
                                                        </span>
                                                        {file.name}
                                                        {file.deletedAt && (
                                                            <span style={{
                                                                fontSize: '10px',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                flexShrink: 0
                                                            }}>DELETED</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                        {file.type === 'url' && file.externalUrl && (
                                                            <div style={{ marginBottom: '4px', fontStyle: 'italic' }}>
                                                                → {file.externalUrl.length > 50 ? file.externalUrl.substring(0, 50) + '...' : file.externalUrl}
                                                            </div>
                                                        )}
                                                        {file.views} views • {new Date(file.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '16px 0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={() => viewAnalytics(file)}
                                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                                        >
                                                            Analytics
                                                        </button>
                                                        {file.deletedAt ? (
                                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 12px' }}>
                                                                Archived
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {file.slug ? (
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={() => copyLink(file)}
                                                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                                                    >
                                                                        Copy Link
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={() => handleCreateLink(file)}
                                                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                                                    >
                                                                        Create Link
                                                                    </button>
                                                                )}
                                                                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }}></div>
                                                                <button
                                                                    onClick={() => handleDelete(file)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#ef4444',
                                                                        cursor: 'pointer',
                                                                        padding: '8px',
                                                                        borderRadius: '6px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    title="Delete file"
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 6h18"></path>
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Recent Activity Feed */}
                <div className="card" style={{ height: '100%', maxHeight: '800px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '600' }}>Recent Activity</h2>
                    <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                        {recentActivity.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No activity yet. Share a file to see logs here.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {recentActivity.map((log, index) => (
                                    <div key={index} style={{
                                        padding: '16px',
                                        background: 'var(--surface-hover)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{log.viewerName}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatKST(log.accessedAt)}</span>
                                        </div>
                                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                                            Viewed <strong>{log.fileName}</strong>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                                            <span>📧 {log.viewerEmail}</span>
                                            <span>🌍 {log.country || 'Unknown'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Analytics Modal */}
            {showAnalyticsModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '20px',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowAnalyticsModal(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '1000px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '40px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>📊 Analytics Dashboard</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{selectedFileName}</p>
                            </div>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAnalyticsModal(false)}
                                style={{ fontSize: '14px' }}
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Stats Overview */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '24px',
                                borderRadius: '12px',
                                color: 'white'
                            }}>
                                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Views</div>
                                <div style={{ fontSize: '36px', fontWeight: '700' }}>{selectedFileLogs?.length || 0}</div>
                            </div>
                            <div style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                padding: '24px',
                                borderRadius: '12px',
                                color: 'white'
                            }}>
                                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Unique Viewers</div>
                                <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                    {selectedFileLogs ? new Set(selectedFileLogs.map((log: any) => log.viewerEmail)).size : 0}
                                </div>
                            </div>
                            {selectedFilePageStats && selectedFilePageStats.length > 0 && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    color: 'white'
                                }}>
                                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Avg. Time/Page</div>
                                    <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                        {(selectedFilePageStats.reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / selectedFilePageStats.length).toFixed(1)}s
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Access Timeline - Moved to top */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>🕐 Access Timeline</h3>
                            {selectedFileLogs && selectedFileLogs.length > 0 ? (
                                <div style={{
                                    background: 'var(--surface)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    {selectedFileLogs.map((log: any, index: number) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '16px',
                                                background: index % 2 === 0 ? 'var(--surface-hover)' : 'transparent',
                                                borderRadius: '8px',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                                flexShrink: 0
                                            }}>
                                                👤
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                                                    {log.viewerName}
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                    <span>📧 {log.viewerEmail}</span>
                                                    <span>🌍 {log.country || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <div style={{
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                flexShrink: 0
                                            }}>
                                                {formatKST(log.accessedAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    No views yet. Share your link to start tracking!
                                </div>
                            )}
                        </div>

                        {/* Country Breakdown - New section */}
                        {selectedFileLogs && selectedFileLogs.length > 0 && (() => {
                            const countryCounts: { [key: string]: number } = {};
                            selectedFileLogs.forEach((log: any) => {
                                const country = log.country || 'Unknown';
                                countryCounts[country] = (countryCounts[country] || 0) + 1;
                            });
                            const countryData = Object.entries(countryCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([country, count]) => ({ country, count }));

                            return (
                                <div style={{ marginBottom: '40px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>🌍 Country Distribution</h3>
                                    <div style={{
                                        background: 'var(--surface)',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {countryData.map((item, index) => {
                                            const maxCount = countryData[0].count;
                                            const percentage = (item.count / maxCount) * 100;
                                            return (
                                                <div key={index} style={{ marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                                        <span style={{ fontWeight: '500' }}>{item.country}</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {item.count} {item.count === 1 ? 'view' : 'views'}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '8px',
                                                        background: 'var(--border)',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${percentage}%`,
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Page Engagement Chart - Moved after Access Timeline and Country */}
                        {selectedFilePageStats && selectedFilePageStats.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>📈 Page Engagement</h3>
                                <div style={{
                                    background: 'var(--surface)',
                                    padding: '24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {[...selectedFilePageStats]
                                        .sort((a: any, b: any) => {
                                            if (b.viewCount !== a.viewCount) {
                                                return b.viewCount - a.viewCount; // Views Descending
                                            }
                                            return b.avgDuration - a.avgDuration; // Duration Descending
                                        })
                                        .map((stat: any) => {
                                            const maxDuration = Math.max(...selectedFilePageStats.map((s: any) => s.avgDuration));
                                            const percentage = (stat.avgDuration / maxDuration) * 100;
                                            return (
                                                <div key={stat.pageNumber} style={{ marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                                        <span style={{ fontWeight: '500' }}>Page {stat.pageNumber}</span>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {stat.avgDuration.toFixed(1)}s • {stat.viewCount} views
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '8px',
                                                        background: 'var(--border)',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${percentage}%`,
                                                            height: '100%',
                                                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Link Modal */}
            {showCreateLinkModal && createLinkFile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowCreateLinkModal(false)}>
                    <div style={{
                        background: 'var(--surface)',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '500px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowCreateLinkModal(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Create Custom Link</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', wordBreak: 'break-word', lineHeight: '1.5' }}>
                            Create a memorable link for <strong style={{ color: 'var(--text-primary)' }}>{createLinkFile.name}</strong>
                        </p>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Custom URL</label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--background)',
                                border: slugAvailability === 'taken'
                                    ? '2px solid #ef4444'
                                    : slugAvailability === 'available'
                                    ? '2px solid #22c55e'
                                    : '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '0 12px',
                                height: '48px',
                                transition: 'border-color 0.2s'
                            }}>
                                <span style={{ color: 'var(--text-secondary)', marginRight: '4px', fontSize: '14px' }}>
                                    {window.location.origin}/view/
                                </span>
                                <input
                                    type="text"
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="my-pitch-deck"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        flex: 1,
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                                {slugAvailability === 'checking' && (
                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>⏳</span>
                                )}
                                {slugAvailability === 'available' && (
                                    <span style={{ fontSize: '14px', color: '#22c55e' }}>✓</span>
                                )}
                                {slugAvailability === 'taken' && (
                                    <span style={{ fontSize: '14px', color: '#ef4444' }}>✗</span>
                                )}
                            </div>
                            {slugAvailability === 'available' && (
                                <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px', fontWeight: '500' }}>
                                    ✓ This link is available!
                                </p>
                            )}
                            {slugAvailability === 'taken' && (
                                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>
                                    ✗ This link is already taken. Please try another.
                                </p>
                            )}
                            {!slugAvailability && customSlug && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Only lowercase letters, numbers, and hyphens allowed.
                                </p>
                            )}
                            {!customSlug && (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                    Only lowercase letters, numbers, and hyphens allowed.
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowCreateLinkModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSlug}
                                className="btn btn-primary"
                                disabled={!customSlug || isSavingSlug || slugAvailability !== 'available'}
                            >
                                {isSavingSlug ? 'Saving...' : 'Create Link'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
