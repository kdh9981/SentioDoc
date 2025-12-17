'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-auth';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface ErrorInfo {
  title: string;
  message: string;
  action: string | null;
  actionLink: string | null;
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resent, setResent] = useState(false);
  const supabase = createClient();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResent(false);

    // Password match validation
    if (password !== confirmPassword) {
      setError({
        title: 'Passwords do not match',
        message: 'Please make sure both passwords are the same.',
        action: null,
        actionLink: null,
      });
      setLoading(false);
      return;
    }

    // First, try to sign up
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
          display_name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (authError) {
      console.log('Signup error:', authError.message);

      // Handle email sending failure
      if (authError.message.includes('Error sending confirmation email') ||
          authError.message.includes('Unable to send') ||
          authError.message.includes('email')) {

        // User was likely created but email failed - try to resend
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (!resendError) {
          // Resend successful
          setResent(true);
          setSuccess(true);
          setLoading(false);
          return;
        }

        // Resend also failed
        if (resendError.message.includes('rate limit') ||
            resendError.message.includes('For security purposes')) {
          setError({
            title: 'Too many email requests',
            message: 'Please wait a few minutes before requesting another verification email.',
            action: null,
            actionLink: null,
          });
        } else if (resendError.message.includes('already confirmed') ||
                   resendError.message.includes('Email link is invalid')) {
          setError({
            title: 'Account already verified',
            message: 'This email is already verified.',
            action: 'Sign in instead',
            actionLink: '/auth/signin',
          });
        } else {
          setError({
            title: 'Email delivery issue',
            message: 'We had trouble sending the verification email. Please try again later or',
            action: 'request verification email manually',
            actionLink: '/auth/resend-verification',
          });
        }
        setLoading(false);
        return;
      }

      // Handle "User already registered" error
      if (authError.message.includes('User already registered')) {
        // Try to resend verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (resendError) {
          if (resendError.message.includes('already confirmed') ||
              resendError.message.includes('Email link is invalid')) {
            setError({
              title: 'Account already exists',
              message: 'This email is already registered and verified.',
              action: 'Sign in instead',
              actionLink: '/auth/signin',
            });
          } else if (resendError.message.includes('rate limit') ||
                     resendError.message.includes('For security purposes')) {
            setError({
              title: 'Too many requests',
              message: 'Please wait a few minutes before requesting another verification email.',
              action: null,
              actionLink: null,
            });
          } else {
            setError({
              title: 'Account already exists',
              message: 'This email is already registered.',
              action: 'Sign in instead',
              actionLink: '/auth/signin',
            });
          }
          setLoading(false);
          return;
        }

        // Resend successful
        setResent(true);
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Handle other errors
      if (authError.message.includes('Password should be at least')) {
        setError({
          title: 'Password too short',
          message: 'Your password must be at least 8 characters long.',
          action: null,
          actionLink: null,
        });
      } else if (authError.message.includes('Invalid email')) {
        setError({
          title: 'Invalid email',
          message: 'Please enter a valid email address.',
          action: null,
          actionLink: null,
        });
      } else if (authError.message.includes('Network') || authError.message.includes('fetch')) {
        setError({
          title: 'Connection error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          action: null,
          actionLink: null,
        });
      } else {
        setError({
          title: 'Sign up failed',
          message: authError.message,
          action: null,
          actionLink: null,
        });
      }
      setLoading(false);
      return;
    }

    // Check if user was created but needs confirmation
    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // If we got a session immediately (shouldn't happen with email confirmation enabled)
    if (data.session) {
      window.location.href = '/dashboard';
      return;
    }

    setSuccess(true);
    setLoading(false);
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

          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '16px'
          }}>
            {resent ? 'New Verification Email Sent! 📬' : 'Check Your Email! 📬'}
          </h1>

          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: 1.7,
            marginBottom: '28px'
          }}>
            {resent ? (
              <>We sent a new verification link to <strong style={{ color: '#0f172a' }}>{email}</strong>. Your previous link has been invalidated.</>
            ) : (
              <>We sent a verification link to <strong style={{ color: '#0f172a' }}>{email}</strong>. Click the link to verify your account and get started.</>
            )}
          </p>

          {/* Feature List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '15px', color: '#475569' }}>
              ✓ Share any content with smart links
            </div>
            <div style={{ fontSize: '15px', color: '#475569' }}>
              ✓ See exactly who's viewing
            </div>
            <div style={{ fontSize: '15px', color: '#475569' }}>
              ✓ Capture leads automatically
            </div>
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
              marginBottom: '20px',
            }}
          >
            Go to sign in
          </Link>

          {/* Expiry Warning */}
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            marginBottom: '24px',
          }}>
            ⚠️ This link expires in 1 hour.
          </p>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            marginTop: '8px',
          }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
              Questions? Reply to this email.
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
            Share anything.<br/>Track everything.
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.7 }}>
            Documents, videos, links — share any content and see exactly who's engaging. Capture leads and get real-time analytics on every view.
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
          <form onSubmit={handleEmailSignUp}>
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
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or company"
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
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    paddingRight: '48px',
                    border: password && confirmPassword && password !== confirmPassword
                      ? '1px solid #ef4444'
                      : '1px solid #d1d5db',
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Passwords do not match
                </p>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <p style={{
                  fontSize: '12px',
                  color: '#10b981',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (password !== confirmPassword)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading || (password !== confirmPassword) ? '#a5b4fc' : '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading || (password !== confirmPassword) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
            Free forever • No credit card required
          </p>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/auth/signin" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
