'use client'
import React from 'react';
import Link from 'next/link';
import { Link2 } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#6366f1', padding: '6px', borderRadius: '8px', color: 'white' }}>
            <Link2 size={24} strokeWidth={3} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>LinkLens</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontWeight: 500, color: '#475569' }}>
          <a href="#how-it-works" style={{ textDecoration: 'none', color: '#475569' }}>How It Works</a>
          <a href="#pricing" style={{ textDecoration: 'none', color: '#475569' }}>Pricing</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/auth/signin" style={{ fontWeight: 500, color: '#1e293b', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link
            href="/auth/signin"
            style={{ backgroundColor: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
