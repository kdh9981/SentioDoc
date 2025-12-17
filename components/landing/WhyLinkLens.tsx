'use client'
import React from 'react';
import { BarChart3, Globe, Clock, Shield, Zap, Mail } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Generous free tier',
    description: '10 free links with 5,000 monthly views. Perfect for getting started and testing the waters.',
    highlight: 'Free forever',
    highlightColor: '#22c55e'
  },
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    description: 'See who\'s clicking your links as it happens. Location, time, device—all in one dashboard.',
    highlight: 'Live tracking',
    highlightColor: '#f97316'
  },
  {
    icon: Globe,
    title: 'Custom domains',
    description: 'Use your own domain for maximum brand recognition. links.yourbrand.com looks professional.',
    highlight: 'Starter & Pro',
    highlightColor: '#8b5cf6'
  },
  {
    icon: Clock,
    title: '60-second setup',
    description: 'Upload, get your link, start sharing. No complicated onboarding or setup required.',
    highlight: 'Instant start',
    highlightColor: '#ec4899'
  },
  {
    icon: Mail,
    title: 'Email capture',
    description: 'Collect viewer emails before they access your content. Build your audience automatically.',
    highlight: 'All plans',
    highlightColor: '#6366f1'
  },
  {
    icon: Shield,
    title: 'Privacy first',
    description: 'We track clicks, not people. GDPR compliant and privacy-focused by design.',
    highlight: 'Secure',
    highlightColor: '#14b8a6'
  }
];


const WhyLinkLens: React.FC = () => {
  return (
    <section id="why-linklens" style={{
      padding: '100px 24px',
      backgroundColor: '#f8fafc',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background elements */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 60%)',
        borderRadius: '50%'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#202124',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            Why teams choose{' '}
            <span style={{ fontWeight: 800 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#5F6368',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Simple pricing. Powerful analytics. Fast setup.
            Here's what makes us different.
          </p>
        </div>

        {/* Benefits Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '28px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                }}
              >
                {/* Icon + Badge Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComponent size={24} style={{ color: benefit.highlightColor }} />
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: benefit.highlightColor,
                    backgroundColor: `${benefit.highlightColor}15`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    letterSpacing: '0.05em'
                  }}>
                    {benefit.highlight}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '8px'
                }}>
                  {benefit.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#5F6368',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyLinkLens;
