'use client'
import React from 'react';

// CSS Keyframes for wave animations
const waveKeyframes = `
  @keyframes wave1 {
    0%, 100% { d: path('M0,50 C150,100 350,0 500,50 C650,100 800,0 1000,50 C1150,100 1200,50 1200,50 L1200,120 L0,120 Z'); }
    50% { d: path('M0,50 C150,0 350,100 500,50 C650,0 800,100 1000,50 C1150,0 1200,50 1200,50 L1200,120 L0,120 Z'); }
  }

  @keyframes wave2 {
    0%, 100% { d: path('M0,60 C200,100 400,20 600,60 C800,100 1000,40 1200,70 L1200,120 L0,120 Z'); }
    50% { d: path('M0,70 C200,30 400,90 600,50 C800,20 1000,80 1200,60 L1200,120 L0,120 Z'); }
  }

  @keyframes wave3 {
    0%, 100% { d: path('M0,80 C300,40 500,100 700,70 C900,40 1100,90 1200,60 L1200,120 L0,120 Z'); }
    50% { d: path('M0,60 C300,100 500,40 700,80 C900,100 1100,50 1200,80 L1200,120 L0,120 Z'); }
  }

  @keyframes wave4 {
    0%, 100% { d: path('M0,95 C150,80 350,110 550,90 C750,70 950,100 1200,85 L1200,120 L0,120 Z'); }
    50% { d: path('M0,85 C150,100 350,70 550,95 C750,110 950,80 1200,95 L1200,120 L0,120 Z'); }
  }

  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }

  @keyframes horizontalFlow {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }

  @keyframes blobMorph {
    0%, 100% { d: path('M0,40 C100,100 200,20 350,50 C500,80 550,10 700,40 C850,70 950,20 1050,50 C1100,65 1150,45 1200,55 L1200,120 L0,120 Z'); }
    33% { d: path('M0,50 C100,20 200,80 350,40 C500,10 550,70 700,50 C850,30 950,80 1050,40 C1100,55 1150,35 1200,45 L1200,120 L0,120 Z'); }
    66% { d: path('M0,45 C100,70 200,30 350,60 C500,90 550,40 700,30 C850,50 950,60 1050,45 C1100,30 1150,60 1200,50 L1200,120 L0,120 Z'); }
  }
`;

// Animated Wave Divider - Single smooth wave
export const AnimatedWaveDivider: React.FC<{
  flip?: boolean;
  color?: string;
  duration?: number;
}> = ({ flip = false, color = '#f8faff', duration = 8 }) => (
  <div style={{
    width: '100%', overflow: 'hidden', lineHeight: 0,
    transform: flip ? 'rotate(180deg)' : 'none',
    marginTop: flip ? '-1px' : '0',
    marginBottom: flip ? '0' : '-1px'
  }}>
    <style>{waveKeyframes}</style>
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '70px', display: 'block' }}
    >
      <path
        d="M0,50 C150,100 350,0 500,50 C650,100 800,0 1000,50 C1150,100 1200,50 1200,50 L1200,120 L0,120 Z"
        fill={color}
        style={{ animation: `wave1 ${duration}s ease-in-out infinite` }}
      />
    </svg>
  </div>
);

// Animated Layered Waves - Multiple waves moving at different speeds
export const AnimatedLayeredWaves: React.FC<{
  flip?: boolean;
  colors?: string[];
}> = ({
  flip = false,
  colors = ['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.25)', '#f8faff']
}) => (
  <div style={{
    width: '100%', overflow: 'hidden', lineHeight: 0, position: 'relative', height: '120px',
    transform: flip ? 'rotate(180deg)' : 'none',
    marginTop: flip ? '-1px' : '0',
    marginBottom: flip ? '0' : '-1px'
  }}>
    <style>{waveKeyframes}</style>
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', position: 'absolute', bottom: 0 }}
    >
      {/* Back wave - slowest */}
      <path
        d="M0,60 C200,100 400,20 600,60 C800,100 1000,40 1200,70 L1200,120 L0,120 Z"
        fill={colors[0]}
        style={{ animation: 'wave2 10s ease-in-out infinite' }}
      />
      {/* Middle wave - medium speed */}
      <path
        d="M0,80 C300,40 500,100 700,70 C900,40 1100,90 1200,60 L1200,120 L0,120 Z"
        fill={colors[1]}
        style={{ animation: 'wave3 7s ease-in-out infinite' }}
      />
      {/* Front wave - fastest */}
      <path
        d="M0,95 C150,80 350,110 550,90 C750,70 950,100 1200,85 L1200,120 L0,120 Z"
        fill={colors[2]}
        style={{ animation: 'wave4 5s ease-in-out infinite' }}
      />
    </svg>
  </div>
);

// Animated Blob Divider - Morphing organic shape
export const AnimatedBlobDivider: React.FC<{
  flip?: boolean;
  color?: string;
}> = ({ flip = false, color = '#1a1625' }) => (
  <div style={{
    width: '100%', overflow: 'hidden', lineHeight: 0,
    transform: flip ? 'rotate(180deg)' : 'none',
    marginTop: flip ? '-1px' : '0',
    marginBottom: flip ? '0' : '-1px'
  }}>
    <style>{waveKeyframes}</style>
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100px', display: 'block' }}
    >
      <path
        d="M0,40 C100,100 200,20 350,50 C500,80 550,10 700,40 C850,70 950,20 1050,50 C1100,65 1150,45 1200,55 L1200,120 L0,120 Z"
        fill={color}
        style={{ animation: 'blobMorph 12s ease-in-out infinite' }}
      />
    </svg>
  </div>
);

// Flowing Ocean Waves - Continuous horizontal motion
export const OceanWaveDivider: React.FC<{
  flip?: boolean;
  colors?: string[];
}> = ({
  flip = false,
  colors = ['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0.2)', '#eef2ff']
}) => (
  <div style={{
    width: '100%', overflow: 'hidden', lineHeight: 0, position: 'relative', height: '100px',
    transform: flip ? 'rotate(180deg)' : 'none',
    marginTop: flip ? '-1px' : '0',
    marginBottom: flip ? '0' : '-1px'
  }}>
    <style>{waveKeyframes}</style>
    {/* Double-width SVG for seamless horizontal scroll */}
    <svg
      viewBox="0 0 2400 120"
      preserveAspectRatio="none"
      style={{
        width: '200%',
        height: '100%',
        position: 'absolute',
        bottom: 0,
        animation: 'horizontalFlow 20s linear infinite'
      }}
    >
      {/* Wave pattern repeated twice for seamless loop */}
      <path
        d="M0,70 C100,40 200,90 300,60 C400,30 500,80 600,70 C700,60 800,30 900,60 C1000,90 1100,50 1200,70 C1300,40 1400,90 1500,60 C1600,30 1700,80 1800,70 C1900,60 2000,30 2100,60 C2200,90 2300,50 2400,70 L2400,120 L0,120 Z"
        fill={colors[0]}
      />
      <path
        d="M0,85 C150,60 300,100 450,80 C600,60 750,95 900,85 C1050,75 1200,60 1350,80 C1500,100 1650,70 1800,85 C1950,75 2100,95 2250,80 C2400,65 2400,85 2400,85 L2400,120 L0,120 Z"
        fill={colors[1]}
      />
      <path
        d="M0,100 C200,90 400,105 600,95 C800,85 1000,100 1200,100 C1400,100 1600,90 1800,95 C2000,100 2200,92 2400,100 L2400,120 L0,120 Z"
        fill={colors[2]}
      />
    </svg>
  </div>
);

// Curved Divider with gentle floating animation
export const AnimatedCurvedDivider: React.FC<{
  flip?: boolean;
  color?: string;
}> = ({ flip = false, color = 'white' }) => (
  <div style={{
    width: '100%', overflow: 'hidden', lineHeight: 0,
    transform: flip ? 'rotate(180deg)' : 'none',
    marginTop: flip ? '-1px' : '0',
    marginBottom: flip ? '0' : '-1px'
  }}>
    <style>{waveKeyframes}</style>
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      style={{
        width: '100%',
        height: '80px',
        display: 'block',
        animation: 'gentleFloat 6s ease-in-out infinite'
      }}
    >
      <path
        d="M0,60 Q600,120 1200,60 L1200,120 L0,120 Z"
        fill={color}
      />
    </svg>
  </div>
);

// Keep original static versions for backward compatibility
export const WaveDivider = AnimatedWaveDivider;
export const LayeredWavesDivider = AnimatedLayeredWaves;
export const BlobDivider = AnimatedBlobDivider;
export const CurvedDivider = AnimatedCurvedDivider;

export default AnimatedWaveDivider;
