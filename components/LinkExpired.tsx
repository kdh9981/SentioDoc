import Link from 'next/link';

export default function LinkExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏰</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Link Expired</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          This link is no longer available. It may have passed its expiration date.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
