'use client'
import React from 'react';
import { Logo } from './Logo';
import { IconX, IconGithub, IconLinkedIn } from './SocialIcons';

const Footer: React.FC = () => {
  return (
    <footer style={{ position: 'relative', width: '100%', backgroundColor: '#F8FAFC', borderTop: '1px solid #e2e8f0', padding: '80px 24px 48px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '64px', marginBottom: '64px' }}>

          {/* Brand */}
          <div>
            <Logo />
            <p style={{ marginTop: '24px', color: '#64748b', fontSize: '16px', lineHeight: 1.6, maxWidth: '300px' }}>
              Track who views your documents, videos, or any link.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Product</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Features</a></li>
                <li><a href="#pricing" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Pricing</a></li>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Use Cases</a></li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Company</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>About</a></li>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Contact</a></li>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Legal</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Privacy Policy</a></li>
                <li><a href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '15px' }}>Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px' }}>© 2025 LinkLens. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <a href="#" style={{ color: '#94a3b8' }}><IconX /></a>
            <a href="#" style={{ color: '#94a3b8' }}><IconGithub /></a>
            <a href="#" style={{ color: '#94a3b8' }}><IconLinkedIn /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
