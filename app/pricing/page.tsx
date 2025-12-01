'use client'
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const PricingPage = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started',
      features: [
        '10 links',
        'Basic analytics (views, visitors, timestamps)',
        'Email capture',
        '50MB storage',
        '14-day analytics history'
      ],
      cta: 'Get Started',
      ctaLink: '/auth/signin',
      highlighted: false
    },
    {
      name: 'Starter',
      price: 9,
      yearlyPrice: 7,
      description: 'For active creators & founders',
      features: [
        '1,000 links',
        'Full analytics (device, country, traffic source)',
        '1 custom domain',
        'Remove LinkLens branding',
        'Real-time notifications',
        '10GB storage',
        '1-year analytics history'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/auth/signin?plan=starter',
      highlighted: true
    },
    {
      name: 'Pro',
      price: 19,
      yearlyPrice: 15,
      description: 'For power users & teams',
      features: [
        'Unlimited links',
        'Advanced analytics (city, page-by-page, completion rate)',
        'Unlimited custom domains',
        'Remove LinkLens branding',
        'Export data (CSV)',
        '50GB storage',
        'Lifetime analytics history',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      ctaLink: '/auth/signin?plan=pro',
      highlighted: false
    }
  ];

  const featureComparison = [
    {
      category: 'Links',
      features: [
        { name: 'Links', free: '10', starter: '1,000', pro: 'Unlimited' },
        { name: 'Link editing', free: true, starter: true, pro: true },
        { name: 'QR code generation', free: false, starter: true, pro: true },
        { name: 'Link expiration setup', free: false, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Basic Metrics',
      features: [
        { name: 'Total views', free: true, starter: true, pro: true },
        { name: 'Unique visitors', free: true, starter: true, pro: true },
        { name: 'View timestamp', free: true, starter: true, pro: true },
        { name: 'Email capture', free: true, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Time & Engagement',
      features: [
        { name: 'Average view time', free: false, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Device & Technical',
      features: [
        { name: 'Device type', free: false, starter: true, pro: true },
        { name: 'Operating system', free: false, starter: true, pro: true },
        { name: 'Browser', free: false, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Location',
      features: [
        { name: 'Country', free: false, starter: true, pro: true },
        { name: 'City', free: false, starter: false, pro: true },
      ]
    },
    {
      category: 'Analytics — Traffic Source',
      features: [
        { name: 'Traffic source', free: false, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Alerts',
      features: [
        { name: 'Real-time notifications', free: false, starter: true, pro: true },
      ]
    },
    {
      category: 'Analytics — Deep Engagement (Pro)',
      features: [
        { name: 'Page-by-page analytics', free: false, starter: false, pro: true },
        { name: 'Completion rate', free: false, starter: false, pro: true },
        { name: 'Return visit tracking', free: false, starter: false, pro: true },
      ]
    },
    {
      category: 'Analytics — Data Export',
      features: [
        { name: 'Export data (CSV)', free: false, starter: false, pro: true },
      ]
    },
    {
      category: 'Analytics — History',
      features: [
        { name: 'Analytics history', free: '14 days', starter: '1 year', pro: 'Lifetime' },
      ]
    },
    {
      category: 'Branding',
      features: [
        { name: 'Custom domains', free: false, starter: '1', pro: 'Unlimited' },
        { name: 'LinkLens branding', free: 'Shown', starter: 'Removed', pro: 'Removed' },
      ]
    },
    {
      category: 'Storage',
      features: [
        { name: 'Total file storage', free: '50MB', starter: '10GB', pro: '50GB' },
        { name: 'Max file size', free: '50MB', starter: '50MB', pro: '100MB' },
      ]
    },
    {
      category: 'Security',
      features: [
        { name: 'Password protection', free: false, starter: true, pro: true },
        { name: 'Revoke link access', free: true, starter: true, pro: true },
      ]
    },
    {
      category: 'Support',
      features: [
        { name: 'Support level', free: 'Community', starter: 'Email', pro: 'Priority email' },
      ]
    },
  ];

  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check size={20} style={{ color: '#22c55e' }} />
      ) : (
        <X size={20} style={{ color: '#d1d5db' }} />
      );
    }
    return <span style={{ color: value === 'Shown' ? '#f97316' : '#22c55e', fontWeight: 500 }}>{value}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />

      <main style={{ paddingTop: '80px' }}>
        {/* Header */}
        <section style={{ padding: '60px 24px 40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            Choose your plan
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            Start free, upgrade when you need more. All paid plans include a 14-day free trial.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'white',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setIsYearly(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: !isYearly ? '#6366f1' : 'transparent',
                color: !isYearly ? 'white' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isYearly ? '#6366f1' : 'transparent',
                color: isYearly ? 'white' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Yearly
            </button>
            <span style={{
              backgroundColor: '#22c55e',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              Save 20%
            </span>
          </div>
        </section>

        {/* Pricing Cards */}
        <section style={{ padding: '0 24px 60px' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {plans.map((plan, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: '40px',
                  border: plan.highlighted ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  position: 'relative',
                  boxShadow: plan.highlighted ? '0 10px 40px rgba(99, 102, 241, 0.15)' : '0 4px 20px rgba(0,0,0,0.03)'
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{
                      fontSize: '48px',
                      fontWeight: 800,
                      color: '#0f172a'
                    }}>
                      {plan.price === 0 ? 'Free' : `$${isYearly ? plan.yearlyPrice : plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span style={{ color: '#64748b', fontSize: '16px' }}>/month</span>
                    )}
                  </div>
                  {isYearly && plan.price > 0 && (
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                      Billed annually
                    </p>
                  )}
                  <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '32px'
                }}>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Check size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                      <span style={{ color: '#374151', fontSize: '14px' }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={plan.ctaLink}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: plan.highlighted ? '#6366f1' : 'white',
                    color: plan.highlighted ? 'white' : '#374151',
                    border: plan.highlighted ? 'none' : '1px solid #d1d5db',
                    borderRadius: '12px',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section style={{ padding: '60px 24px', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Compare all features
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '48px',
              textAlign: 'center'
            }}>
              See exactly what you get with each plan
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                backgroundColor: 'white',
                borderBottom: '2px solid #e2e8f0',
                position: 'sticky',
                top: 0
              }}>
                <div style={{ padding: '24px', fontWeight: 600, color: '#64748b' }}>
                  Features
                </div>
                <div style={{ padding: '24px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                  Free
                </div>
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#6366f1',
                  backgroundColor: '#eef2ff'
                }}>
                  Starter
                </div>
                <div style={{ padding: '24px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                  Pro
                </div>
              </div>

              {/* Table Body */}
              {featureComparison.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  {/* Category Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    backgroundColor: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      padding: '16px 24px',
                      fontWeight: 700,
                      color: '#0f172a',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {section.category}
                    </div>
                    <div></div>
                    <div style={{ backgroundColor: '#eef2ff' }}></div>
                    <div></div>
                  </div>

                  {/* Features */}
                  {section.features.map((feature, featureIdx) => (
                    <div
                      key={featureIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ padding: '16px 24px', color: '#374151', fontSize: '14px' }}>
                        {feature.name}
                      </div>
                      <div style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderValue(feature.free)}
                      </div>
                      <div style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        backgroundColor: '#fafbff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderValue(feature.starter)}
                      </div>
                      <div style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {renderValue(feature.pro)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '60px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '16px'
            }}>
              Questions?
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '24px'
            }}>
              Have questions about our pricing? We are here to help.
            </p>
            <a
              href="mailto:support@linklens.tech"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
