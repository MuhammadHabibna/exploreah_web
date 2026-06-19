import { ReactNode } from 'react';

interface ChartCardProps {
  title: ReactNode;
  children: ReactNode;
  dotColor?: string;
}

export default function ChartCard({ title, children, dotColor = 'var(--accent-blue)' }: ChartCardProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <span className="dot" style={{ background: dotColor }} />
        {title}
      </div>
      {children}
    </div>
  );
}
