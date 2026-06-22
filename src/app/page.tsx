'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { TabId } from '@/lib/types';
import dynamic from 'next/dynamic';

const OverviewTab        = dynamic(() => import('@/components/tabs/OverviewTab'), { ssr: false });
const ClusteringTab      = dynamic(() => import('@/components/tabs/ClusteringTab'), { ssr: false });
const AssociationTab     = dynamic(() => import('@/components/tabs/AssociationTab'), { ssr: false });
const ClassificationTab  = dynamic(() => import('@/components/tabs/ClassificationTab'), { ssr: false });
const SpatialTab         = dynamic(() => import('@/components/tabs/SpatialTab'), { ssr: false });
const ForecastingTab     = dynamic(() => import('@/components/tabs/ForecastingTab'), { ssr: false });
const AdvancedTab        = dynamic(() => import('@/components/tabs/AdvancedTab'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':       return <OverviewTab />;
      case 'clustering':     return <ClusteringTab />;
      case 'association':    return <AssociationTab />;
      case 'classification': return <ClassificationTab />;
      case 'spatial':        return <SpatialTab />;
      case 'forecasting':    return <ForecastingTab />;
      case 'advanced':       return <AdvancedTab />;
      default:               return <OverviewTab />;
    }
  };

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {renderTab()}
      </main>

      {/* ── Premium Footer Watermark ── */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="site-footer-copy">
            Dashboard Analisis Kejahatan LAPD &copy; {new Date().getFullYear()}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--accent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M5 3h10v7a5 5 0 0 1-10 0V3z" />
              <path d="M5 5H2a2 2 0 0 0 2 2h1" />
              <path d="M15 5h3a2 2 0 0 1-2 2h-1" />
              <line x1="10" y1="15" x2="10" y2="18" />
              <line x1="6" y1="18" x2="14" y2="18" />
            </svg>
            <div>
              <div className="site-footer-team">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px' }}>Tim:</span>
                <span className="site-footer-team-name">Juara Di Malang</span>
              </div>
              <div className="site-footer-members">
                Muhammad Habib Nur Aiman &amp; Nazril Ravi Pratama
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
