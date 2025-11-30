'use client'
import React from 'react';
import { Link } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ color: '#6366f1' }}>
        <Link strokeWidth={2.5} style={{ width: '32px', height: '32px' }} />
      </div>
      <span style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>
        LinkLens
      </span>
    </div>
  );
};
