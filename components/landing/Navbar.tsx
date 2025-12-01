'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Link as LinkIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
      backdropFilter: isScrolled ? 'blur(10px)' : 'none',
      borderBottom: '1px solid #e2e8f0',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              href="/#how-it-works"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Pricing
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/auth/signin"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signin"
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
