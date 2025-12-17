'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface ErrorInfo {
  title: string;
  message: string;
  action: string | null;
  actionLink: string | null;
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ title: string; message: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const verifiedParam = params.get('verified');

    // Handle successful verification from different browser
    if (verifiedParam === 'true') {
      setSuccess({
        title: 'Email verified successfully! ✓',
        message: 'Your email has been verified. You can now sign in to your account.',
      });
      // Clean up URL
      window.history.replaceState({}, '', '/auth/signin');
      return;
    }

    if (errorParam === 'link_expired') {
      setError({
        title: 'Verification link expired',
        message: 'Your verification link has expired.',
        action: 'Request a new verification email',
        actionLink: '/auth/resend-verification',
      });
    } else if (errorParam === 'invalid_link') {
      setError({
        title: 'Invalid verification link',
        message: 'This verification link is invalid or has already been used.',
        action: 'Request a new verification email',
        actionLink: '/auth/resend-verification',
      });
    } else if (errorParam === 'verification_failed') {
      setError({
        title: 'Verification failed',
        message: 'We could not verify your email.',
        action: 'Try requesting a new verification email',
        actionLink: '/auth/resend-verification',
      });
    } else if (errorParam === 'auth_failed') {
      setError({
        title: 'Authentication failed',
        message: 'We could not complete authentication. Please try again.',
        action: null,
        actionLink: null,
      });
    } else if (errorParam) {
      setError({
        title: 'Authentication error',
        message: decodeURIComponent(errorParam),
        action: null,
        actionLink: null,
      });
    }

    // Clean up URL
    if (errorParam || verifiedParam) {
      window.history.replaceState({}, '', '/auth/signin');
    }
  }, []);

  const getErrorMessage = (errorMsg: string): ErrorInfo => {
    if (errorMsg.includes('Invalid login credentials')) {
      return {
        title: 'Unable to sign in',
        message: `We couldn't verify your credentials. Please check your email and password, or`,
        action: 'sign up for a new account',
        actionLink: '/auth/signup',
      };
    }

    if (errorMsg.includes('Email not confirmed')) {
      return {
        title: 'Email not verified',
        message: `Your email hasn't been verified yet.`,
        action: 'Resend verification email',
        actionLink: '/auth/resend-verification',
      };
    }

    if (errorMsg.includes('Too many requests')) {
      return {
        title: 'Too many attempts',
        message: `You've tried too many times. Please wait a few minutes before trying again.`,
        action: null,
        actionLink: null,
      };
    }

    if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
      return {
        title: 'Connection error',
        message: `Unable to connect to the server. Please check your internet connection and try again.`,
        action: null,
        actionLink: null,
      };
    }

    return {
      title: 'Sign in failed',
      message: errorMsg,
      action: null,
      actionLink: null,
    };
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getErrorMessage(authError.message));
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  const handleKakaoSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Side */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <Logo variant="full" size="md" linkTo="/" />
        </div>

        <div style={{ maxWidth: '480px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#0f172a', marginBottom: '20px', lineHeight: 1.1 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Your analytics dashboard is ready. See who's viewing your links, documents, and videos in real-time.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px',
              color: '#374151',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          {/* Kakao Button */}
          <button
            onClick={handleKakaoSignIn}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#FEE500',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '24px',
              color: '#000000',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fill="#000000" d="M9 1C4.58 1 1 3.87 1 7.39c0 2.21 1.47 4.15 3.68 5.26-.16.58-.57 2.1-.65 2.43-.1.41.15.4.32.29.13-.09 2.09-1.41 2.94-1.98.55.08 1.12.12 1.71.12 4.42 0 8-2.87 8-6.12S13.42 1 9 1z"/>
            </svg>
            Continue with Kakao
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Or continue with email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSignIn}>
            {success && (
              <div style={{
                padding: '16px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontWeight: 600,
                  color: '#059669',
                  fontSize: '14px',
                }}>
                  {success.title}
                </p>
                <p style={{
                  margin: 0,
                  color: '#065f46',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}>
                  {success.message}
                </p>
              </div>
            )}

            {error && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontWeight: 600,
                  color: '#dc2626',
                  fontSize: '14px',
                }}>
                  {error.title}
                </p>
                <p style={{
                  margin: 0,
                  color: '#7f1d1d',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}>
                  {error.message}
                  {error.action && error.actionLink && (
                    <>
                      {' '}
                      <Link
                        href={error.actionLink}
                        style={{
                          color: '#6366f1',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        {error.action}
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
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
                  padding: '12px 14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    paddingRight: '48px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '16px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
              <Link href="/auth/forgot-password" style={{ fontSize: '14px', color: '#6366f1', textDecoration: 'none' }}>
                Forgot password?
              </Link>
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
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
