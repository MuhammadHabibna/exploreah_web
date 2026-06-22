'use client';

import { TabId } from '@/lib/types';
import { TABS } from '@/lib/constants';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TAB_ICONS: Record<string, string> = {
  overview:       '📊',
  clustering:     '🔵',
  association:    '🔗',
  classification: '🤖',
  spatial:        '🗺️',
  forecasting:    '📈',
  advanced:       '🧪',
};

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <div className="header-logo-dot" />
          <span className="header-logo-text">EXPLORE.AH!</span>
        </div>
        <nav className="header-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span role="img" aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
