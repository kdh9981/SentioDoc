'use client';

import { useState, useEffect } from 'react';

interface CustomDomain {
    id: string;
    full_domain: string;
    subdomain: string | null;
    domain: string;
    verification_status: 'pending' | 'verified' | 'failed';
    ssl_status: 'pending' | 'active' | 'failed' | 'expired';
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

interface DomainLimits {
    max: number;
    current: number;
}

export default function DomainSettings() {
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');
    const [limits, setLimits] = useState<DomainLimits>({ max: 0, current: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/domains');
            const data = await res.json();
            setDomains(data.domains || []);
            setTier(data.tier);
            setLimits(data.limits);
        } catch (error) {
            console.error('Failed to fetch domains:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteDomain = async (id: string) => {
        if (!confirm('Are you sure you want to delete this domain?')) return;

        try {
            const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchDomains();
            } else {
                alert('Failed to delete domain');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete domain');
        }
    };

    const setAsDefault = async (id: string) => {
        try {
            const res = await fetch(`/api/domains/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setAsDefault: true })
            });
            if (res.ok) {
                fetchDomains();
            }
        } catch (error) {
            console.error('Set default error:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': case 'active': return 'var(--success, #22c55e)';
            case 'pending': return 'var(--warning, #f59e0b)';
            case 'failed': case 'expired': return 'var(--error, #ef4444)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': case 'active': return '✅';
            case 'pending': return '⏳';
            case 'failed': case 'expired': return '❌';
            default: return '○';
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading domains...</div>;
    }

    // Free tier - show upgrade prompt
    if (tier === 'free') {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                <h2 style={{ marginBottom: '16px' }}>Custom Domains</h2>
                <div style={{
                    background: 'var(--surface)',
                    padding: '24px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    border: '2px dashed var(--border)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                    <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
                        Upgrade to Pro to use custom domains
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        With custom domains you can:
                    </p>
                    <ul style={{
                        textAlign: 'left',
                        display: 'inline-block',
                        color: 'var(--text-secondary)',
                        marginBottom: '20px'
                    }}>
                        <li>✅ Use go.yourdomain.com for branded links</li>
                        <li>✅ Build trust with  your own domain</li>
                        <li>✅ Professional appearance</li>
                        <li>✅ Up to 50 custom domains</li>
                    </ul>
                </div>
                <button className="btn btn-primary" style={{ fontSize: '16px', padding: '12px 32px' }}>
                    Upgrade to Pro →
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ marginBottom: '8px' }}>Custom Domains</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {limits.current} of {limits.max} domains used • {tier.toUpperCase()} tier
                    </p>
                </div>
                {limits.current < limits.max && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Add Domain
                    </button>
                )}
            </div>

            {/* Default Domain */}
            <div style={{
                padding: '16px',
                background: 'var(--surface)',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            doc.sentio.ltd
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Default domain (always available)
                        </div>
                    </div>
                    <span style={{
                        padding: '4px 12px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        Default
                    </span>
                </div>
            </div>

            {/* Custom Domains */}
            {domains.length === 0 ? (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
                    <p>No custom domains added yet</p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAddModal(true)}
                        style={{ marginTop: '16px' }}
                    >
                        Add Your First Domain
                    </button>
                </div>
            ) : (
                domains.map(domain => (
                    <div key={domain.id} style={{
                        padding: '16px',
                        background: 'var(--surface)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                            <span style={{ fontSize: '20px' }}>
                                {getStatusIcon(domain.verification_status)}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                    {domain.full_domain}
                                </div>
                                <div style={{ fontSize: '13px', color: getStatusColor(domain.verification_status), marginBottom: '8px' }}>
                                    {domain.verification_status === 'verified' ? 'Verified & Active' :
                                        domain.verification_status === 'pending' ? 'Pending DNS verification' :
                                            'Verification failed'}
                                </div>
                                {domain.ssl_status !== 'active' && domain.verification_status === 'verified' && (
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        SSL: {domain.ssl_status} - Contact admin to complete setup
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {domain.verification_status === 'pending' && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                        onClick={() => window.location.href = `/domains/${domain.id}/setup`}
                                    >
                                        Complete Setup
                                    </button>
                                )}
                                {!domain.is_default && domain.is_active && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                        onClick={() => setAsDefault(domain.id)}
                                    >
                                        Set as Default
                                    </button>
                                )}
                                <button
                                    className="btn"
                                    style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--error)' }}
                                    onClick={() => deleteDomain(domain.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Add Domain Modal */}
            {showAddModal && (
                <AddDomainModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchDomains();
                    }}
                />
            )}
        </div>
    );
}

// Add Domain Modal Component
function AddDomainModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [step, setStep] = useState<'input' | 'dns'>('input');
    const [subdomain, setSubdomain] = useState('');
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [dnsInstructions, setDnsInstructions] = useState<any>(null);
    const [domainId, setDomainId] = useState('');

    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    const handleSubmit = async () => {
        if (!domain) {
            alert('Please enter your domain');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain: subdomain || null, domain })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.upgradeRequired) {
                    alert(`Upgrade required: ${data.error}`);
                } else {
                    alert(data.error || 'Failed to add domain');
                }
                return;
            }

            setDnsInstructions(data.dnsInstructions);
            setDomainId(data.domain.id);
            setStep('dns');
        } catch (error) {
            console.error('Add domain error:', error);
            alert('Failed to add domain');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
                {step === 'input' ? (
                    <>
                        <h2 style={{ marginBottom: '8px' }}>Add Custom Domain</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                            Enter your domain or subdomain
                        </p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Subdomain (optional)
                            </label>
                            <input
                                type="text"
                                value={subdomain}
                                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="go"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Leave empty to use your main domain
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                Your Domain *
                            </label>
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                                placeholder="yourdomain.com"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--surface)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {domain && (
                            <div style={{
                                padding: '12px',
                                background: 'var(--surface-hover)',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Preview:
                                </div>
                                <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                    🔗 https://{fullDomain}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={!domain || loading}
                            >
                                {loading ? 'Adding...' : 'Continue to DNS Setup →'}
                            </button>
                        </div>
                    </>
                ) : (
                    <DNSSetupInstructions
                        fullDomain={fullDomain}
                        dnsInstructions={dnsInstructions}
                        domainId={domainId}
                        onClose={onClose}
                        onSuccess={onSuccess}
                        copyToClipboard={copyToClipboard}
                    />
                )}
            </div>
        </div>
    );
}

// DNS Setup Instructions Component
function DNSSetupInstructions({ fullDomain, dnsInstructions, domainId, onClose, onSuccess, copyToClipboard }: any) {
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    const verifyDNS = async () => {
        setVerifying(true);
        setVerificationResult(null);

        try {
            const res = await fetch(`/api/domains/${domainId}/verify`, { method: 'POST' });
            const data = await res.json();
            setVerificationResult(data);

            if (data.verified) {
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setVerificationResult({ verified: false, message: 'Verification failed' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <>
            <h2 style={{ marginBottom: '8px' }}>DNS Setup Instructions</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Add this DNS record at your domain provider
            </p>

            <div style={{
                padding: '20px',
                background: 'var(--surface)',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid var(--border)'
            }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Record Type
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                            {dnsInstructions.type}
                        </span>
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => copyToClipboard(dnsInstructions.type)}
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Host/Name
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                            {dnsInstructions.host}
                        </span>
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => copyToClipboard(dnsInstructions.host)}
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Value/Points to
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                            {dnsInstructions.value}
                        </span>
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => copyToClipboard(dnsInstructions.value)}
                        >
                            Copy
                        </button>
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        TTL
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                        {dnsInstructions.ttl}
                    </span>
                </div>
            </div>

            <div style={{
                padding: '16px',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
            }}>
                ℹ️ DNS changes can take 5-30 minutes to propagate. After adding the record, click "Verify DNS" below.
            </div>

            {verificationResult && (
                <div style={{
                    padding: '16px',
                    background: verificationResult.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${verificationResult.verified ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', color: verificationResult.verified ? '#22c55e' : '#ef4444' }}>
                        {verificationResult.verified ? '✅ Verification Successful!' : '❌ Verification Failed'}
                    </div>
                    <div style={{ fontSize: '13px' }}>
                        {verificationResult.message}
                    </div>
                    {verificationResult.nextSteps && (
                        <div style={{ fontSize: '13px', marginTop: '8px' }}>
                            Next: {verificationResult.nextSteps}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onClose}>
                    {verificationResult?.verified ? 'Close' : 'Save & Verify Later'}
                </button>
                {!verificationResult?.verified && (
                    <button
                        className="btn btn-primary"
                        onClick={verifyDNS}
                        disabled={verifying}
                    >
                        {verifying ? 'Verifying...' : 'Verify DNS Now'}
                    </button>
                )}
            </div>
        </>
    );
}
