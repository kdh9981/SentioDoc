'use client';

import { useState } from 'react';

interface ViewerGateProps {
    fileId: string;
    fileName: string;
    onAccessGranted: () => void;
}

export default function ViewerGate({ fileId, fileName, onAccessGranted }: ViewerGateProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    viewerName: name,
                    viewerEmail: email,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem(`viewer_email_${fileId}`, email);
                onAccessGranted();
            } else {
                alert(data.error || 'Failed to grant access. Please try again.');
            }
        } catch (error) {
            console.error('Access error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'radial-gradient(circle at center, #1f1f1f 0%, #0a0a0a 100%)'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', wordBreak: 'break-word' }}>
                        {fileName}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        This document is protected. Please enter your details to view.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                        disabled={loading}
                    >
                        {loading ? 'Verifying Access...' : 'View Document'}
                    </button>
                </form>
            </div>
        </div>
    );
}
