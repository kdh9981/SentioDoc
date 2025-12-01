'use client'
import React from 'react';
import Link from 'next/link';
import { Link as LinkIcon } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      padding: '64px 24px 32px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '48px',
          marginBottom: '48px'
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#6366f1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LinkIcon size={18} style={{ color: 'white' }} />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                Link<span style={{ color: '#6366f1' }}>Lens</span>
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, maxWidth: '280px' }}>
              Track who views your documents, videos, or any link. Know who's serious with branded links and real-time analytics.
            </p>
          </div>

          {/* Product - Following homepage section order */}
          <div>
            <h4 style={{
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '16px',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Product
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/#who-is-this-for"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Who Is This For
              </Link>
              <Link
                href="/#how-it-works"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                How It Works
              </Link>
              <Link
                href="/#why-linklens"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Why LinkLens
              </Link>
              <Link
                href="/pricing"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '16px',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Company
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="mailto:support@linklens.tech"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Contact
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '16px',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Legal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/privacy"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            © 2025 LinkLens. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* X (Twitter) */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
