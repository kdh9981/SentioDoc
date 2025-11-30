'use client'
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { FloatingIcons } from './FloatingIcons';

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const proPrice = isAnnual ? "$15" : "$19";

  const freeFeatures = ["Unlimited links", "Unlimited views", "Basic analytics", "Email capture", "linklens.tech domain"];
  const proFeatures = ["Everything in Free", "Custom domain (1 domain)", "Advanced analytics", "No branding", "Priority support", "Early access to features"];

  return (
    <section id="pricing" style={{ padding: '100px 24px', backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* Floating Icons */}
      <FloatingIcons variant="pricing" />

      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Simple pricing. Start free.
          </h2>
          <p style={{ fontSize: '18px', color: '#64748b' }}>
            No credit card required. Upgrade anytime.
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '48px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: !isAnnual ? '#0f172a' : '#64748b' }}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            style={{ width: '56px', height: '32px', backgroundColor: '#6366f1', borderRadius: '9999px', padding: '4px', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', transform: isAnnual ? 'translateX(24px)' : 'translateX(0)', transition: 'transform 0.2s ease' }}></div>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: isAnnual ? '#0f172a' : '#64748b' }}>Yearly</span>
            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px' }}>Save 17%</span>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* Free */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', color: '#64748b', marginBottom: '8px' }}>Free</h3>
            <p style={{ fontSize: '40px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Free Forever</p>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>Perfect for getting started</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {freeFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#e2e8f0', borderRadius: '50%', padding: '2px' }}>
                    <Check style={{ width: '12px', height: '12px', color: '#475569' }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>

            <button style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '32px', border: '2px solid #6366f1', boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.15)', position: 'relative', transform: 'scale(1.02)' }}>
            <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(to right, #6366f1, #7c3aed)', color: 'white', fontSize: '12px', fontWeight: 700, padding: '6px 16px', borderRadius: '9999px', textTransform: 'uppercase' }}>
              Most Popular
            </div>

            <h3 style={{ fontSize: '18px', color: '#64748b', marginBottom: '8px' }}>Pro</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '8px' }}>
              <span style={{ fontSize: '40px', fontWeight: 700, color: '#0f172a' }}>{proPrice}</span>
              <span style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>/month</span>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>{isAnnual ? 'Billed annually ($180)' : 'Billed monthly'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {proFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#dcfce7', borderRadius: '50%', padding: '2px' }}>
                    <Check style={{ width: '12px', height: '12px', color: '#15803d' }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>

            <button style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #6366f1, #7c3aed)', border: 'none', borderRadius: '12px', fontWeight: 600, color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
              Start Free Trial
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: '#64748b' }}>
          14-day free trial on Pro. Cancel anytime.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
