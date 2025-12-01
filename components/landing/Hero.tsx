'use client'
import React from 'react';
import Link from 'next/link';
import { Check, PlayCircle, ArrowRight } from 'lucide-react';
import MockDashboard from './MockDashboard';

const Hero: React.FC = () => {
  return (
    <section style={{ position: 'relative', paddingTop: '120px', paddingBottom: '96px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>

        {/* Left Content */}
        <div style={{ maxWidth: '672px', position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '24px' }}>
            Share anything <br />
            <span style={{ background: 'linear-gradient(to right, #6366f1, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              See everything
            </span>
          </h1>

          <p style={{ fontSize: '20px', color: '#475569', marginBottom: '32px', lineHeight: 1.6, maxWidth: '512px' }}>
            Track who views your documents, videos, or any link.
            Know who's serious with branded links and real-time analytics.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
            <Link
              href="/auth/signin"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px 32px', fontSize: '18px', fontWeight: 700, color: 'white', backgroundColor: '#0f172a', borderRadius: '9999px', textDecoration: 'none' }}
            >
              Get Started Free
              <ArrowRight style={{ marginLeft: '8px', width: '20px', height: '20px' }} />
            </Link>
            <a
              href="#how-it-works"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px 32px', fontSize: '18px', fontWeight: 700, color: '#0f172a', backgroundColor: 'white', border: '2px solid #cbd5e1', borderRadius: '9999px', textDecoration: 'none' }}
            >
              <PlayCircle style={{ marginRight: '8px', width: '20px', height: '20px' }} />
              See How It Works
            </a>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Check style={{ width: '20px', height: '20px', color: '#22c55e', marginRight: '8px' }} />
              Free forever
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Check style={{ width: '20px', height: '20px', color: '#22c55e', marginRight: '8px' }} />
              No credit card
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Check style={{ width: '20px', height: '20px', color: '#22c55e', marginRight: '8px' }} />
              Setup in 60 seconds
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
          <MockDashboard />
        </div>
      </div>

      {/* Background Decor */}
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: -1, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: 'rgba(243, 232, 255, 0.5)', filter: 'blur(100px)' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '600px', height: '600px', borderRadius: '50%', backgroundColor: 'rgba(239, 246, 255, 0.5)', filter: 'blur(100px)' }}></div>
      </div>
    </section>
  );
};

export default Hero;
