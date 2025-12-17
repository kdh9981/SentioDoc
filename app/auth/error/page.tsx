'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let errorMessage = 'An unknown error occurred.';
    if (error === 'AccessDenied') {
        errorMessage = 'You are not authorized to access this application. Please contact the administrator to add your email to the allowlist.';
    } else if (error === 'Configuration') {
        errorMessage = 'There is a problem with the server configuration. Check if the redirect URL matches the one in Google Cloud Console.';
    }

    return (
        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--error)' }}>Authentication error</h1>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{errorMessage}</p>
            <Link href="/api/auth/signin" style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none'
            }}>
                Try again
            </Link>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
