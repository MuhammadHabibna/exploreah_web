import { ReactNode } from 'react';

interface ChartCardProps {
  title: ReactNode;
  children: ReactNode;
  dotColor?: string;
  accentColor?: string; // optional per-card top strip color override
}

export default function ChartCard({
  title,
  children,
  dotColor = 'var(--accent-blue)',
  accentColor,
}: ChartCardProps) {
  return (
    <div className="chart-card">
      {/* Per-card accent strip override */}
      {accentColor && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: accentColor,
          borderRadius: '18px 18px 0 0',
          opacity: 0.5,
        }} />
      )}
      <div className="chart-card-title">
        <span className="dot" style={{ background: dotColor }} />
        {title}
      </div>
      {children}
    </div>
  );
}
