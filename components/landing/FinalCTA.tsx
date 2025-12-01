'use client'
import React from 'react';
import Link from 'next/link';
import { FloatingIcons } from './FloatingIcons';

const FinalCTA: React.FC = () => {
  return (
    <section style={{
      position: 'relative', minHeight: '500px', width: '100%', overflow: 'hidden',
      backgroundColor: '#1a1625', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '100px 24px'
    }}>

      {/* Background Effects */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '70%', backgroundColor: 'rgba(139, 92, 246, 0.3)', borderRadius: '50%', filter: 'blur(120px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(100px)' }}></div>
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: '40%', height: '40%', backgroundColor: 'rgba(217, 70, 239, 0.2)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
      </div>

      {/* Floating Icons */}
      <FloatingIcons variant="cta" />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '800px', textAlign: 'center' }}>

<h2 style={{ fontSize: '56px', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '24px' }}>
          Ready to see <br />
          <span style={{ background: 'linear-gradient(to right, #93c5fd, #c4b5fd, #f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            who's clicking?
          </span>
        </h2>

        <p style={{ fontSize: '20px', color: 'rgba(196, 181, 253, 0.8)', marginBottom: '40px' }}>
          Start tracking your links in 60 seconds. <br />
          No credit card required. Real-time insights.
        </p>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-4px', background: 'linear-gradient(to right, #3b82f6, #a855f7)', borderRadius: '9999px', filter: 'blur(10px)', opacity: 0.4 }}></div>
          <Link
            href="/auth/signin"
            style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '12px',
              padding: '20px 48px', backgroundColor: 'white', borderRadius: '9999px',
              color: '#312e81', fontWeight: 700, fontSize: '18px', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(255,255,255,0.39)'
            }}
          >
            Get Started Free
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FinalCTA;
