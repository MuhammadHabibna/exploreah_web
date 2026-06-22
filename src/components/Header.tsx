'use client';

import { TabId } from '@/lib/types';
import { TABS } from '@/lib/constants';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// Clean inline SVG icons — 16×16 stroke-based
const TabIcon = ({ id, active }: { id: string; active: boolean }) => {
  const color = active ? 'var(--accent-blue)' : 'currentColor';
  const s = { width: 15, height: 15, display: 'block', flexShrink: 0 } as const;

  switch (id) {
    case 'overview':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="6" height="6" rx="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" />
        </svg>
      );
    case 'clustering':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="4" cy="4" r="2.5" />
          <circle cx="12" cy="4" r="2.5" />
          <circle cx="4" cy="12" r="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <line x1="4" y1="6.5" x2="4" y2="9.5" />
          <line x1="12" y1="6.5" x2="12" y2="9.5" />
          <line x1="6.5" y1="4" x2="9.5" y2="4" />
          <line x1="6.5" y1="12" x2="9.5" y2="12" />
        </svg>
      );
    case 'association':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="3" cy="8" r="2" />
          <circle cx="13" cy="4" r="2" />
          <circle cx="13" cy="12" r="2" />
          <line x1="5" y1="7" x2="11" y2="4.8" />
          <line x1="5" y1="9" x2="11" y2="11.2" />
        </svg>
      );
    case 'classification':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" />
        </svg>
      );
    case 'spatial':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.5-2-4.5-4.5-4.5z" />
          <circle cx="8" cy="6" r="1.5" />
        </svg>
      );
    case 'forecasting':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1,12 5,7 8,9 12,4 15,4" />
          <polyline points="12,4 15,4 15,7" />
        </svg>
      );
    case 'advanced':
      return (
        <svg {...s} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2l-1 4H2l3 2-1 4 4-2.5L12 12l-1-4 3-2H11L10 2 8 5z" />
        </svg>
      );
    default:
      return null;
  }
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
              <TabIcon id={tab.id} active={activeTab === tab.id} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
