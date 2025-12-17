'use client'
import React, { useState } from 'react';
import { Check, DollarSign, CreditCard, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started',
      includesFrom: null,
      features: [
        '10 active links',
        '5,000 views + clicks/month',
        'Basic analytics (views, visitors, timestamps)',
        'Email capture',
        '100MB file storage',
        '14-day analytics history'
      ],
      cta: 'Get started',
      ctaLink: '/auth/signup',
      highlighted: false
    },
    {
      name: 'Starter',
      price: 9,
      yearlyPrice: 7,
      description: 'For active creators & founders',
      includesFrom: 'Free',
      features: [
        'Total 500 active links',
        'Total 50,000 views + clicks/month',
        'Full analytics (device, country, traffic source)',
        '1 custom domain',
        'Custom logo, no watermark',
        'Total 10GB file storage',
        'Total 1-year analytics history'
      ],
      cta: 'Start free trial',
      ctaLink: '/auth/signup?plan=starter',
      highlighted: true
    },
    {
      name: 'Pro',
      price: 19,
      yearlyPrice: 15,
      description: 'For power users & teams',
      includesFrom: 'Starter',
      features: [
        'Total 5,000 active links',
        'Total 100,000 views + clicks/month',
        'Advanced analytics (city, page-by-page, completion rate)',
        '10 custom domains',
        'Export data (CSV)',
        'Total 50GB file storage',
        'Lifetime analytics history',
        'Priority support'
      ],
      cta: 'Start free trial',
      ctaLink: '/auth/signup?plan=pro',
      highlighted: false
    }
  ];

  return (
    <section id="pricing" style={{
      padding: '100px 24px',
      backgroundColor: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Icons */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '8%',
        width: '48px',
        height: '48px',
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        animation: 'float 6s ease-in-out infinite'
      }}>
        <DollarSign size={24} style={{ color: '#22c55e' }} />
      </div>

      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '44px',
        height: '44px',
        backgroundColor: '#eef2ff',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        animation: 'float 7s ease-in-out infinite',
        animationDelay: '1s'
      }}>
        <CreditCard size={22} style={{ color: '#6366f1' }} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '12%',
        width: '40px',
        height: '40px',
        backgroundColor: '#fef3c7',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        animation: 'float 5s ease-in-out infinite',
        animationDelay: '2s'
      }}>
        <Sparkles size={20} style={{ color: '#f59e0b' }} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '8%',
        width: '44px',
        height: '44px',
        backgroundColor: '#fce7f3',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        animation: 'float 6s ease-in-out infinite',
        animationDelay: '0.5s'
      }}>
        <Zap size={22} style={{ color: '#ec4899' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            Simple pricing. Start free
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            No credit card required. Upgrade anytime.
          </p>

          {/* Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px'
          }}>
            <button
              onClick={() => setIsYearly(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: !isYearly ? 'white' : 'transparent',
                color: !isYearly ? '#0f172a' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: !isYearly ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
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
                backgroundColor: isYearly ? 'white' : 'transparent',
                color: isYearly ? '#0f172a' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isYearly ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
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
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {plans.map((plan, index) => (
            <div
              key={index}
              style={{
                backgroundColor: plan.highlighted ? 'white' : '#f8fafc',
                borderRadius: '24px',
                padding: '40px',
                border: plan.highlighted ? '2px solid #6366f1' : '1px solid #e2e8f0',
                position: 'relative',
                boxShadow: plan.highlighted ? '0 10px 40px rgba(99, 102, 241, 0.15)' : 'none'
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
                  Most popular
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
                {plan.includesFrom && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6366f1',
                    marginBottom: '4px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Everything in {plan.includesFrom}, plus:
                  </div>
                )}
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

        {/* Link to full comparison */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>
            14-day free trial on paid plans. Cancel anytime.
          </p>
          <Link
            href="/pricing"
            style={{
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            See full feature comparison →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
