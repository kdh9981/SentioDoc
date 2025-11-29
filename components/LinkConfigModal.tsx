'use client';

import { useState, useEffect } from 'react';

interface CustomDomain {
    id: string;
    full_domain: string;
    verification_status: string;
    is_default: boolean;
}

interface LinkConfigModalProps {
    fileInfo: {
        file?: File;
        url?: string;
        name: string;
    };
    onComplete: (result: { fileId: string; slug: string; url: string }) => void;
    onCancel: () => void;
}

export default function LinkConfigModal({ fileInfo, onComplete, onCancel }: LinkConfigModalProps) {
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [selectedDomainId, setSelectedDomainId] = useState<string>('');
    const [slug, setSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [slugSuggestion, setSlugSuggestion] = useState('');
    const [isValidatingSlug, setIsValidatingSlug] = useState(false);
    const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch domains
    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/domains');
            const data = await res.json();
            setDomains(data.domains || []);
            setTier(data.tier);

            // Set default domain
            const defaultDomain = data.domains?.find((d: CustomDomain) => d.is_default);
            if (defaultDomain) {
                setSelectedDomainId(defaultDomain.id);
            }
        } catch (error) {
            console.error('Failed to fetch domains:', error);
        }
    };

    // Validate slug when user types
    useEffect(() => {
        if (!slug) {
            setSlugError('');
            setSlugSuggestion('');
            return;
        }

        const timer = setTimeout(async () => {
            setIsValidatingSlug(true);
            try {
                const res = await fetch('/api/validate-slug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug })
                });
                const data = await res.json();

                if (!data.available) {
                    setSlugError(data.message || data.error || 'Not available');
                    setSlugSuggestion(data.suggestion || '');
                } else {
                    setSlugError('');
                    setSlugSuggestion('');
                }
            } catch (error) {
                console.error('Slug validation error:', error);
            } finally {
                setIsValidatingSlug(false);
            }
        }, 500); // Debounce

        return () => clearTimeout(timer);
    }, [slug]);

    // Generate suggested slug from filename
    useEffect(() => {
        if (!slug && fileInfo.name) {
            const suggested = fileInfo.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50);
            setSlug(suggested);
        }
    }, [fileInfo.name]);

    const handleCreate = async () => {
        if (!slug) {
            setSlugError('Link name is required');
            return;
        }

        if (slugError) {
            return;
        }

        setIsCreating(true);
        try {
            const formData = new FormData();

            if (fileInfo.file) {
                formData.append('file', fileInfo.file);
            } else if (fileInfo.url) {
                formData.append('url', fileInfo.url);
                formData.append('name', fileInfo.name);
            }

            formData.append('slug', slug);
            if (selectedDomainId) {
                formData.append('customDomainId', selectedDomainId);
            }

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create link');
            }

            // Get the domain info for URL construction
            const domain = selectedDomainId
                ? domains.find(d => d.id === selectedDomainId)?.full_domain
                : 'doc.sentio.ltd';

            const fullUrl = `https://${domain}/${slug}`;

            onComplete({
                fileId: data.fileId,
                slug: slug,
                url: fullUrl
            });
        } catch (error: any) {
            alert(error.message || 'Failed to create link');
        } finally {
            setIsCreating(false);
        }
    };

    const selectedDomain = selectedDomainId
        ? domains.find(d => d.id === selectedDomainId)?.full_domain
        : 'doc.sentio.ltd';

    const previewUrl = slug ? `https://${selectedDomain}/${slug}` : '';

    const verifiedDomains = domains.filter(d => d.verification_status === 'verified');

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onCancel}
        >
            <div
                className="card"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>
                    🔗 Configure Your Link
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                    {fileInfo.file ? `File: ${fileInfo.name}` : `External URL: ${fileInfo.url}`}
                </p>

                {/* Domain Selector */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Domain *
                    </label>
                    <select
                        value={selectedDomainId}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Check if free user is trying to select a custom domain
                            if (tier === 'free' && value !== '') {
                                alert('🔒 Custom domains are only available on Pro and Enterprise plans.\n\nUpgrade to Pro to:\n• Use your own branded domains\n• Create up to 50 custom domains\n• Build trust with professional links\n\nContact us to upgrade!');
                                return;
                            }
                            setSelectedDomainId(value);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">doc.sentio.ltd (Default)</option>

                        {/* Show verified domains for paid users */}
                        {tier !== 'free' && verifiedDomains.map(domain => (
                            <option key={domain.id} value={domain.id}>
                                {domain.full_domain}
                            </option>
                        ))}

                        {/* Show locked options for free users to promote upgrade */}
                        {tier === 'free' && verifiedDomains.length > 0 && verifiedDomains.map(domain => (
                            <option key={domain.id} value={domain.id}>
                                🔒 {domain.full_domain} (Pro)
                            </option>
                        ))}

                        {/* If free tier and no custom domains exist yet, show example */}
                        {tier === 'free' && verifiedDomains.length === 0 && (
                            <>
                                <option value="example1" disabled>
                                    🔒 links.yourdomain.io (Pro)
                                </option>
                                <option value="example2" disabled>
                                    🔒 yourdomain.com (Pro)
                                </option>
                                <option value="example3" disabled>
                                    🔒 docs.yourdomain.com (Pro)
                                </option>
                            </>
                        )}
                    </select>
                    {tier === 'free' && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            🔒 Upgrade to Pro to use custom domains
                        </div>
                    )}
                </div>

                {/* Custom Link Name (Slug) */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Custom Link Name *
                    </label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-awesome-link"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${slugError ? '#ef4444' : 'var(--border)'}`,
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                        }}
                    />
                    {isValidatingSlug && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Checking availability...
                        </div>
                    )}
                    {slugError && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                            ❌ {slugError}
                            {slugSuggestion && (
                                <span>
                                    {' '}Try:{' '}
                                    <button
                                        onClick={() => setSlug(slugSuggestion)}
                                        style={{
                                            color: 'var(--primary)',
                                            textDecoration: 'underline',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        {slugSuggestion}
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                    {!slugError && slug && !isValidatingSlug && (
                        <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                            ✅ This link name is available!
                        </div>
                    )}
                </div>

                {/* Preview */}
                {previewUrl && (
                    <div style={{
                        padding: '16px',
                        background: 'var(--surface-hover)',
                        borderRadius: '8px',
                        marginBottom: '24px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Preview:
                        </div>
                        <div style={{
                            fontWeight: '600',
                            color: 'var(--primary)',
                            wordBreak: 'break-all',
                            fontSize: '14px'
                        }}>
                            🔗 {previewUrl}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isCreating}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={isCreating || !slug || !!slugError || isValidatingSlug}
                    >
                        {isCreating ? 'Creating...' : 'Create Link →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
