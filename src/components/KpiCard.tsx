interface KpiCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'gold' | 'red' | 'green' | 'orange' | 'purple';
  sub?: string;
}

const WATERMARKS = {
  blue: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' stroke='%232563eb' stroke-width='2' stroke-opacity='0.1' stroke-dasharray='4 4'/%3E%3Ccircle cx='50' cy='50' r='20' fill='%232563eb' fill-opacity='0.05'/%3E%3C/svg%3E",
  red: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10L90 80H10L50 10Z' stroke='%23dc2626' stroke-width='2' stroke-opacity='0.1' stroke-linejoin='round'/%3E%3Cpath d='M50 30L75 70H25L50 30Z' fill='%23dc2626' fill-opacity='0.05'/%3E%3C/svg%3E",
  green: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 80L40 40L60 60L90 20' stroke='%2316a34a' stroke-width='4' stroke-opacity='0.1' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='90' cy='20' r='6' fill='%2316a34a' fill-opacity='0.1'/%3E%3C/svg%3E",
  orange: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='20' y='20' width='60' height='60' rx='8' stroke='%23ea580c' stroke-width='2' stroke-opacity='0.1' transform='rotate(45 50 50)'/%3E%3Crect x='35' y='35' width='30' height='30' rx='4' fill='%23ea580c' fill-opacity='0.05' transform='rotate(45 50 50)'/%3E%3C/svg%3E",
  gold: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10L60 40L90 50L60 60L50 90L40 60L10 50L40 40L50 10Z' stroke='%23d97706' stroke-width='2' stroke-opacity='0.1' stroke-linejoin='round'/%3E%3Cpath d='M50 25L55 45L75 50L55 55L50 75L45 55L25 50L45 45L50 25Z' fill='%23d97706' fill-opacity='0.05'/%3E%3C/svg%3E",
  purple: "data:image/svg+xml,%3Csvg width='100' height='100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10L85 30V70L50 90L15 70V30L50 10Z' stroke='%237c3aed' stroke-width='2' stroke-opacity='0.1' stroke-linejoin='round'/%3E%3Cpath d='M50 25L70 38V62L50 75L30 62V38L50 25Z' fill='%237c3aed' fill-opacity='0.05'/%3E%3C/svg%3E"
};

const BG_GRADIENTS = {
  blue: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
  red: "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)",
  green: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  orange: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
  gold: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
  purple: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)"
};

const BORDER_COLORS = {
  blue: "var(--accent-blue)",
  red: "var(--accent-red)",
  green: "var(--accent-green)",
  orange: "var(--accent-orange)",
  gold: "var(--accent-gold)",
  purple: "var(--accent-purple)"
};

export default function KpiCard({ label, value, color = 'blue', sub }: KpiCardProps) {
  return (
    <div 
      className="kpi-card" 
      style={{ 
        background: BG_GRADIENTS[color],
        borderLeft: `4px solid ${BORDER_COLORS[color]}`
      }}
    >
      <div 
        style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          width: '120px',
          height: '120px',
          backgroundImage: `url("${WATERMARKS[color]}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
          opacity: 0.8,
          transform: 'rotate(-10deg)'
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="kpi-label">{label}</div>
        <div className={`kpi-value ${color}`}>{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
