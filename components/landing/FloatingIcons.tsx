'use client'
import React from 'react';
import { CreditCard, Link as LinkIcon, Star, Check, BarChart3, Eye, Zap } from 'lucide-react';

// CSS Keyframes need to be added via style tag
const keyframesStyle = `
  @keyframes floatUpDown {
    0%, 100% { transform: translateY(0px) rotate(var(--rotate, 0deg)); }
    50% { transform: translateY(-20px) rotate(var(--rotate, 0deg)); }
  }
  @keyframes floatLeftRight {
    0%, 100% { transform: translateX(0px) rotate(var(--rotate, 0deg)); }
    50% { transform: translateX(15px) rotate(var(--rotate, 0deg)); }
  }
  @keyframes floatDiagonal {
    0%, 100% { transform: translate(0px, 0px) rotate(var(--rotate, 0deg)); }
    50% { transform: translate(10px, -15px) rotate(var(--rotate, 0deg)); }
  }
  @keyframes floatCircle {
    0% { transform: translate(0px, 0px) rotate(var(--rotate, 0deg)); }
    25% { transform: translate(8px, -8px) rotate(var(--rotate, 0deg)); }
    50% { transform: translate(0px, -12px) rotate(var(--rotate, 0deg)); }
    75% { transform: translate(-8px, -8px) rotate(var(--rotate, 0deg)); }
    100% { transform: translate(0px, 0px) rotate(var(--rotate, 0deg)); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

interface FloatingIconsProps {
  variant: 'pricing' | 'cta' | 'howItWorks';
}

export const FloatingIcons: React.FC<FloatingIconsProps> = ({ variant }) => {
  if (variant === 'howItWorks') {
    return (
      <>
        <style>{keyframesStyle}</style>

        {/* Top Left - Sparkles/Magic */}
        <div style={{
          position: 'absolute', top: '8%', left: '8%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          padding: '14px', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
          animation: 'floatUpDown 5s ease-in-out infinite',
          '--rotate': '-10deg'
        } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
            <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"/>
          </svg>
        </div>

        {/* Top Right - Cursor/Click */}
        <div style={{
          position: 'absolute', top: '12%', right: '10%',
          backgroundColor: 'white', padding: '12px', borderRadius: '14px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
          animation: 'floatDiagonal 6s ease-in-out infinite',
          '--rotate': '8deg'
        } as React.CSSProperties}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
          </svg>
        </div>

        {/* Left Middle - Document/File */}
        <div style={{
          position: 'absolute', top: '45%', left: '4%',
          backgroundColor: 'white', padding: '14px', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
          animation: 'floatCircle 7s ease-in-out infinite',
          '--rotate': '-6deg'
        } as React.CSSProperties}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>

        {/* Right Middle - Rocket/Launch */}
        <div style={{
          position: 'absolute', top: '50%', right: '5%',
          background: 'linear-gradient(135deg, #f97316, #fb923c)',
          padding: '12px', borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)',
          animation: 'floatUpDown 4.5s ease-in-out infinite',
          '--rotate': '15deg'
        } as React.CSSProperties}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
          </svg>
        </div>

        {/* Bottom Left - Target/Goal */}
        <div style={{
          position: 'absolute', bottom: '15%', left: '12%',
          backgroundColor: '#eef2ff', padding: '10px', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)', border: '1px solid #c7d2fe',
          animation: 'floatLeftRight 5.5s ease-in-out infinite',
          '--rotate': '5deg'
        } as React.CSSProperties}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>

        {/* Bottom Right - Share/Send */}
        <div style={{
          position: 'absolute', bottom: '18%', right: '8%',
          backgroundColor: 'white', padding: '12px', borderRadius: '14px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0',
          animation: 'floatDiagonal 6.5s ease-in-out infinite',
          '--rotate': '-8deg'
        } as React.CSSProperties}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>

        {/* Floating small elements */}
        <div style={{ position: 'absolute', top: '25%', left: '20%', width: '8px', height: '8px', backgroundColor: '#c7d2fe', borderRadius: '50%', animation: 'pulse 3s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '35%', right: '18%', width: '6px', height: '6px', backgroundColor: '#fde68a', borderRadius: '50%', animation: 'pulse 2.5s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '30%', left: '25%', width: '5px', height: '5px', backgroundColor: '#bbf7d0', borderRadius: '50%', animation: 'pulse 4s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '25%', right: '20%', width: '7px', height: '7px', backgroundColor: '#fecaca', borderRadius: '50%', animation: 'pulse 3.5s ease-in-out infinite' }}></div>
      </>
    );
  }

  if (variant === 'pricing') {
    return (
      <>
        <style>{keyframesStyle}</style>

        {/* Top Left - Credit Card */}
        <div style={{
          position: 'absolute', top: '15%', left: '8%',
          backgroundColor: 'white', padding: '14px', borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
          animation: 'floatUpDown 4s ease-in-out infinite',
          '--rotate': '-12deg'
        } as React.CSSProperties}>
          <CreditCard size={28} style={{ color: '#f43f5e' }} />
          <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '14px', height: '14px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></div>
        </div>

        {/* Left Middle - Link */}
        <div style={{
          position: 'absolute', top: '45%', left: '5%',
          backgroundColor: '#6366f1', padding: '12px', borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
          animation: 'floatDiagonal 5s ease-in-out infinite',
          '--rotate': '12deg'
        } as React.CSSProperties}>
          <LinkIcon size={20} style={{ color: 'white' }} />
        </div>

        {/* Right Top - Check */}
        <div style={{
          position: 'absolute', top: '20%', right: '8%',
          backgroundColor: 'white', padding: '10px', borderRadius: '50%',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '2px solid #dcfce7',
          animation: 'floatCircle 6s ease-in-out infinite',
          '--rotate': '0deg'
        } as React.CSSProperties}>
          <Check size={20} style={{ color: '#22c55e' }} />
        </div>

        {/* Right Bottom - Star */}
        <div style={{
          position: 'absolute', bottom: '25%', right: '6%',
          backgroundColor: '#22c55e', padding: '14px', borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)',
          animation: 'floatLeftRight 4.5s ease-in-out infinite',
          '--rotate': '-6deg'
        } as React.CSSProperties}>
          <Star size={24} style={{ color: 'white', fill: 'white' }} />
        </div>
      </>
    );
  }

  // CTA variant
  return (
    <>
      <style>{keyframesStyle}</style>

      {/* Top Left - Bar Chart */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%',
        backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
        padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)',
        animation: 'floatUpDown 5s ease-in-out infinite',
        '--rotate': '-8deg'
      } as React.CSSProperties}>
        <BarChart3 size={28} style={{ color: '#93c5fd' }} />
      </div>

      {/* Right Top - Link Active Badge */}
      <div style={{
        position: 'absolute', top: '18%', right: '12%',
        backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
        padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', gap: '8px',
        animation: 'floatDiagonal 6s ease-in-out infinite',
        '--rotate': '6deg'
      } as React.CSSProperties}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }}></div>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 500 }}>Link Active</span>
      </div>

      {/* Left Bottom - Link Icon */}
      <div style={{
        position: 'absolute', bottom: '30%', left: '18%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '12px', borderRadius: '14px',
        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
        animation: 'floatCircle 5.5s ease-in-out infinite',
        '--rotate': '-6deg'
      } as React.CSSProperties}>
        <LinkIcon size={22} style={{ color: 'white' }} />
      </div>

      {/* Right Middle - Eye */}
      <div style={{
        position: 'absolute', top: '45%', right: '10%',
        backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
        padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 10px 40px rgba(236, 72, 153, 0.2)',
        animation: 'floatLeftRight 4s ease-in-out infinite',
        '--rotate': '10deg'
      } as React.CSSProperties}>
        <Eye size={26} style={{ color: '#f9a8d4' }} />
      </div>

      {/* Right Bottom - Notification Badge */}
      <div style={{
        position: 'absolute', bottom: '25%', right: '15%',
        backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)',
        padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '10px',
        animation: 'floatUpDown 4.5s ease-in-out infinite',
        '--rotate': '8deg'
      } as React.CSSProperties}>
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '8px' }}>
          <Zap size={16} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: 0 }}>New Click</p>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>+124</p>
        </div>
      </div>

      {/* Left - Verified Badge */}
      <div style={{
        position: 'absolute', top: '50%', left: '5%',
        backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)',
        padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '10px',
        animation: 'floatDiagonal 5s ease-in-out infinite',
        '--rotate': '-8deg'
      } as React.CSSProperties}>
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', padding: '6px', borderRadius: '8px' }}>
          <Check size={16} style={{ color: '#4ade80' }} />
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: 0 }}>Status</p>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>Verified</p>
        </div>
      </div>

      {/* Floating dots */}
      <div style={{ position: 'absolute', top: '15%', left: '30%', width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'pulse 3s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', top: '25%', right: '25%', width: '4px', height: '4px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', animation: 'pulse 2.5s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', bottom: '35%', left: '25%', width: '5px', height: '5px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '50%', animation: 'pulse 4s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', top: '60%', right: '30%', width: '4px', height: '4px', backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: '50%', animation: 'pulse 3.5s ease-in-out infinite' }}></div>
    </>
  );
};

export default FloatingIcons;
