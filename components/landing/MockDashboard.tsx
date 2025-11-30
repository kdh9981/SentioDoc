'use client'
import React, { useState, useRef } from 'react';
import { BarChart2, Bell, Layout, Search, TrendingUp } from 'lucide-react';

const MockDashboard: React.FC = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [iconOffset, setIconOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 15;
    const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 10;
    setRotation({ x: rotateX, y: rotateY });

    // Calculate icon offset based on mouse position
    const offsetX = ((e.clientX - centerX) / (rect.width / 2)) * 20;
    const offsetY = ((e.clientY - centerY) / (rect.height / 2)) * 15;
    setIconOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIconOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '500px', perspective: '1000px', cursor: 'pointer' }}
    >
      {/* Floating Element 1 - Moves opposite X, same Y */}
      <div style={{
        position: 'absolute', left: '-48px', top: '80px',
        backgroundColor: 'white', padding: '12px', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 20,
        transform: `translate(${-iconOffset.x * 0.8}px, ${iconOffset.y * 0.6}px)`,
        transition: 'transform 0.15s ease-out'
      }}>
        <BarChart2 style={{ color: '#6366f1', width: '32px', height: '32px' }} />
      </div>

      {/* Floating Element 2 - Moves same X, opposite Y */}
      <div style={{
        position: 'absolute', left: '-24px', top: '192px',
        backgroundColor: 'white', padding: '12px', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 20,
        transform: `translate(${iconOffset.x * 0.5}px, ${-iconOffset.y * 0.7}px)`,
        transition: 'transform 0.15s ease-out'
      }}>
        <Layout style={{ color: '#22c55e', width: '24px', height: '24px' }} />
      </div>

      {/* Floating Element 3 - Moves both opposite */}
      <div style={{
        position: 'absolute', right: '-16px', top: '128px',
        backgroundColor: 'white', padding: '12px', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 20,
        transform: `translate(${iconOffset.x * 1.2}px, ${iconOffset.y * 0.4}px)`,
        transition: 'transform 0.15s ease-out'
      }}>
        <Bell style={{ color: '#f97316', width: '24px', height: '24px' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></div>
      </div>

      {/* Main Dashboard */}
      <div style={{
        backgroundColor: '#0f172a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #334155', overflow: 'hidden',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out', transformStyle: 'preserve-3d'
      }}>
        {/* Browser Header */}
        <div style={{ backgroundColor: '#1e293b', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: '#94a3b8' }}>
            🔒 app.linklens.tech/dashboard
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <h3 style={{ color: 'white', fontWeight: 600, fontSize: '18px', margin: 0 }}>Dashboard</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Search size={16} />
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Bell size={16} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Views</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>12,847</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(34, 197, 94, 0.1)', width: 'fit-content', padding: '2px 8px', borderRadius: '9999px' }}>
                <TrendingUp size={12} style={{ color: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>+ 23%</span>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Unique Viewers</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>3,291</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(34, 197, 94, 0.1)', width: 'fit-content', padding: '2px 8px', borderRadius: '9999px' }}>
                <TrendingUp size={12} style={{ color: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>+ 18%</span>
              </div>
            </div>
            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Avg. View Time</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>4m 32s</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(34, 197, 94, 0.1)', width: 'fit-content', padding: '2px 8px', borderRadius: '9999px' }}>
                <TrendingUp size={12} style={{ color: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>↑ 12s</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px solid #334155', padding: '16px' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>Recent Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>SC</div>
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>Sarah Chen</span>
                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>viewed</span>
                    <span style={{ color: 'white', fontWeight: 500, marginLeft: '4px' }}>Pitch Deck.pdf</span>
                  </div>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>2m ago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>MJ</div>
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>Mike Johnson</span>
                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>viewed</span>
                    <span style={{ color: 'white', fontWeight: 500, marginLeft: '4px' }}>Product Demo</span>
                  </div>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>15m ago</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>ED</div>
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>Emily Davis</span>
                    <span style={{ color: '#94a3b8', marginLeft: '4px' }}>viewed</span>
                    <span style={{ color: 'white', fontWeight: 500, marginLeft: '4px' }}>Pricing.pdf</span>
                  </div>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>1h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', height: '90%', backgroundColor: 'rgba(99, 102, 241, 0.2)', filter: 'blur(100px)', zIndex: -1, borderRadius: '50%' }}></div>
    </div>
  );
};

export default MockDashboard;
