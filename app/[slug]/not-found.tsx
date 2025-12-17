export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f8fafc',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                maxWidth: '400px'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔗</div>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#1e293b',
                    margin: '0 0 12px 0'
                }}>
                    Invalid Link
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: '#64748b',
                    margin: '0 0 24px 0',
                    lineHeight: 1.5
                }}>
                    This link doesn&apos;t exist or has been removed by the owner.
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '14px'
                    }}
                >
                    Go to <span style={{ fontWeight: 600 }}><span style={{ color: 'white' }}>Link</span><span style={{ color: '#c4b5fd' }}>Lens</span></span>
                </a>
            </div>
        </div>
    );
}
