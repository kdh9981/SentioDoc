'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'link_expired') {
      setIsExpired(true);
    }
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (resendError) {
      if (resendError.message.includes('rate limit') ||
          resendError.message.includes('For security purposes')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else if (resendError.message.includes('already confirmed') ||
                 resendError.message.includes('Email link is invalid')) {
        setError('This email is already verified. You can sign in directly.');
      } else {
        setError(resendError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '48px 40px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
        }}>
          {/* LinkLens Logo */}
          <div style={{ marginBottom: '32px' }}>
            <Logo variant="full" size="md" linkTo="/" />
          </div>

          {/* Success Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            backgroundColor: '#ecfdf5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px',
          }}>
            ✉️
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '16px'
          }}>
            Verification Email Sent!
          </h1>

          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.7,
            marginBottom: '28px'
          }}>
            We sent a new verification link to <strong style={{ color: '#0f172a' }}>{email}</strong>. Click the link to verify your account.
          </p>

          {/* Warning */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#fef9c3',
            borderRadius: '8px',
            marginBottom: '28px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#854d0e',
              lineHeight: 1.5,
            }}>
              ⚠️ The link expires in 1 hour. Don't forget to check your spam folder!
            </p>
          </div>

          {/* Button */}
          <Link
            href="/auth/signin"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to sign in
          </Link>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            marginTop: '32px',
          }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
              Questions? Contact support@linklens.tech
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              © 2025 <span style={{ fontWeight: 600 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '48px 40px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      }}>
        {/* LinkLens Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Logo variant="full" size="md" linkTo="/" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          Resend verification email
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '15px',
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          Enter your email and we'll send you a new verification link.
        </p>

        {/* Expired Warning */}
        {isExpired && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <p style={{
              margin: '0 0 4px 0',
              fontWeight: 600,
              color: '#854d0e',
              fontSize: '14px',
            }}>
              ⚠️ Your verification link has expired
            </p>
            <p style={{
              margin: 0,
              color: '#a16207',
              fontSize: '14px',
              lineHeight: 1.5,
            }}>
              Verification links are valid for 1 hour. Enter your email below to get a new one.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <p style={{
              margin: 0,
              color: '#dc2626',
              fontSize: '14px',
              lineHeight: 1.5,
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResend}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                backgroundColor: '#ffffff',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#a5b4fc' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Sending...' : 'Send verification email'}
          </button>
        </form>

        {/* Back to Sign In */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/auth/signin"
            style={{
              fontSize: '14px',
              color: '#6366f1',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '20px',
          marginTop: '32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            © 2025 <span style={{ fontWeight: 600 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span>. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
