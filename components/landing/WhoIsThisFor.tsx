'use client'
import React from 'react';
import { Rocket, Video, Users, Briefcase, GraduationCap, Megaphone } from 'lucide-react';

const audiences = [
  {
    icon: Rocket,
    title: 'Founders & startups',
    description: 'Track who\'s viewing your pitch deck. Know which investors are engaged before the meeting.',
    color: '#6366f1',
    bgColor: '#eef2ff'
  },
  {
    icon: Video,
    title: 'Content creators',
    description: 'See which links drive engagement. Understand your audience with real-time analytics.',
    color: '#ec4899',
    bgColor: '#fdf2f8'
  },
  {
    icon: Briefcase,
    title: 'Sales teams',
    description: 'Know when prospects open proposals. Follow up at the perfect moment.',
    color: '#f97316',
    bgColor: '#fff7ed'
  },
  {
    icon: Megaphone,
    title: 'Marketing & agencies',
    description: 'Branded links for every campaign. Track performance across all channels.',
    color: '#8b5cf6',
    bgColor: '#f5f3ff'
  },
  {
    icon: Users,
    title: 'Recruiters & HR',
    description: 'Track candidate engagement with job postings and company materials.',
    color: '#14b8a6',
    bgColor: '#f0fdfa'
  },
  {
    icon: GraduationCap,
    title: 'Educators & coaches',
    description: 'See who accessed course materials. Measure student engagement easily.',
    color: '#eab308',
    bgColor: '#fefce8'
  }
];

const WhoIsThisFor: React.FC = () => {
  return (
    <section id="who-is-this-for" style={{
      padding: '100px 24px',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            Who is <span style={{ fontWeight: 800 }}><span style={{ color: '#1e293b' }}>Link</span><span style={{ color: '#7c8ce0' }}>Lens</span></span> for?
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Anyone who shares links and wants to know who's actually clicking.
            From founders to creators to sales teams.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          {audiences.map((audience, index) => {
            const IconComponent = audience.icon;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = audience.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: audience.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <IconComponent size={28} style={{ color: audience.color }} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginBottom: '12px'
                }}>
                  {audience.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '15px',
                  color: '#64748b',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {audience.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisFor;
