import { TabConfig } from './types';

export const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'clustering', label: 'Clustering', icon: 'layers' },
  { id: 'association', label: 'Association', icon: 'link' },
  { id: 'classification', label: 'Classification', icon: 'target' },
  { id: 'spatial', label: 'Spatial', icon: 'map' },
  { id: 'forecasting', label: 'Forecasting', icon: 'trending-up' },
  { id: 'advanced', label: 'Advanced', icon: 'zap' },
];

export const COLORS = {
  bgPrimary: '#f5f7fa',
  bgSecondary: '#ffffff',
  accentBlue: '#2563eb',
  accentGold: '#d97706',
  accentRed: '#dc2626',
  accentGreen: '#16a34a',
  accentOrange: '#ea580c',
  accentPurple: '#7c3aed',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
};

// Chart-safe colors for light background (saturated, high contrast)
export const CHART_COLORS = [
  '#2563eb', // blue
  '#d97706', // amber
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#7c3aed', // purple
  '#0891b2', // cyan
  '#c2410c', // deep orange
  '#4f46e5', // indigo
  '#059669', // emerald
];

export const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: 12,
  color: '#0f172a',
};

export const LISA_COLORS: Record<string, string> = {
  'High-High': '#dc2626',
  'Low-Low': '#2563eb',
  'Low-High': '#ea580c',
  'High-Low': '#db2777',
  'Not Significant': '#cbd5e1',
};

export const AXIS_TICK = { fill: '#64748b', fontSize: 11 };
export const GRID_STROKE = '#f1f5f9';
