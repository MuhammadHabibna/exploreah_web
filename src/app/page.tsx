'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { TabId } from '@/lib/types';
import dynamic from 'next/dynamic';

const OverviewTab = dynamic(() => import('@/components/tabs/OverviewTab'), { ssr: false });
const ClusteringTab = dynamic(() => import('@/components/tabs/ClusteringTab'), { ssr: false });
const AssociationTab = dynamic(() => import('@/components/tabs/AssociationTab'), { ssr: false });
const ClassificationTab = dynamic(() => import('@/components/tabs/ClassificationTab'), { ssr: false });
const SpatialTab = dynamic(() => import('@/components/tabs/SpatialTab'), { ssr: false });
const ForecastingTab = dynamic(() => import('@/components/tabs/ForecastingTab'), { ssr: false });
const AdvancedTab = dynamic(() => import('@/components/tabs/AdvancedTab'), { ssr: false });

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'clustering': return <ClusteringTab />;
      case 'association': return <AssociationTab />;
      case 'classification': return <ClassificationTab />;
      case 'spatial': return <SpatialTab />;
      case 'forecasting': return <ForecastingTab />;
      case 'advanced': return <AdvancedTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {renderTab()}
      </main>
    </>
  );
}
