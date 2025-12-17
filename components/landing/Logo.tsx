'use client'
import React from 'react';
import { Link } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ color: '#6366f1' }}>
        <Link strokeWidth={2.5} style={{ width: '32px', height: '32px' }} />
      </div>
      <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em' }}>
        <span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span>
      </span>
    </div>
  );
};
