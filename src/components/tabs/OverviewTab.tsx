'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { EDAStats, AreaData } from '@/lib/types';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE, LISA_COLORS } from '@/lib/constants';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

// Choropleth color scale by crime count
function getCrimeColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 0.8) return '#1d4ed8';
  if (ratio > 0.6) return '#2563eb';
  if (ratio > 0.45) return '#3b82f6';
  if (ratio > 0.3) return '#60a5fa';
  if (ratio > 0.18) return '#93c5fd';
  return '#dbeafe';
}

export default function OverviewTab() {
  const [eda, setEda] = useState<EDAStats | null>(null);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [geojson, setGeojson] = useState<any>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<{month: string, count: number}[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hoveredArea, setHoveredArea] = useState<AreaData | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaData | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/data/eda_summary_stats.json').then(r => r.json()).then(setEda);
    fetch('/data/spatial_analysis_results.json').then(r => r.json()).then(setAreas);
    fetch('/data/lapd_divisions.geojson').then(r => r.json()).then(setGeojson);
    fetch('/data/monthly_trend.json').then(r => r.json()).then(setMonthlyTrend);
  }, []);

  const areaMap = useMemo(() => {
    const map: Record<string, AreaData> = {};
    areas.forEach(a => {
      map[a['AREA NAME'].toUpperCase()] = a;
    });
    return map;
  }, [areas]);

  const maxCrimes = useMemo(() => Math.max(...areas.map(a => a.crime_count), 1), [areas]);

  if (!eda || areas.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
      Memuat data...
    </div>
  );

  const areaBarData = [...areas]
    .sort((a, b) => b.crime_count - a.crime_count)
    .map(a => ({ name: a['AREA NAME'], crimes: a.crime_count }));

  const totalViolent = areas.reduce((s, a) => s + a.violent_pct * a.crime_count, 0);
  const totalProperty = areas.reduce((s, a) => s + a.property_pct * a.crime_count, 0);
  const totalOther = eda.total_records - totalViolent - totalProperty;

  const categoryData = [
    { name: 'Property', value: Math.round(totalProperty) },
    { name: 'Violent', value: Math.round(totalViolent) },
    { name: 'Other', value: Math.round(totalOther) },
  ];

  const lookupArea = (name: string): AreaData | null => {
    const key = name?.toUpperCase()?.replace(/\s+/g, ' ').trim();
    return areaMap[key] ?? null;
  };

  // Intensity badge for crime level
  const crimeLevel = (count: number) => {
    const r = count / maxCrimes;
    if (r > 0.75) return { label: 'Sangat Tinggi', color: '#dc2626', bg: '#fef2f2' };
    if (r > 0.5) return { label: 'Tinggi', color: '#ea580c', bg: '#fff7ed' };
    if (r > 0.3) return { label: 'Sedang', color: '#d97706', bg: '#fffbeb' };
    return { label: 'Rendah', color: '#16a34a', bg: '#f0fdf4' };
  };

  return (
    <div className="tab-content">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Total Kasus Tercatat" value={eda.total_records.toLocaleString()} color="blue" sub={eda.date_range} />
        <KpiCard label="Arrest Rate" value={`${eda.overall_arrest_rate}%`} color="red" sub="Sangat rendah" />
        <KpiCard label="Weapon Usage Rate" value={`${eda.weapon_usage_rate}%`} color="orange" sub="1 dari 3 kasus bersenjata" />
        <KpiCard label="Area LAPD" value={eda.total_areas} color="green" sub={`${eda.total_crime_types} jenis kejahatan`} />
      </div>

      {/* Map + Info Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        {/* Map */}
        <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <div className="chart-card-title" style={{ marginBottom: 0 }}>
              <span className="dot" />
              Peta Kejahatan per Wilayah LAPD
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                Hover atau klik area untuk detail
              </span>
            </div>
          </div>

          {mounted && geojson && (
            <MapContainer
              center={[34.02, -118.28]}
              zoom={11}
              style={{ height: 480, width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <GeoJSON
                key={areas.length}
                data={geojson}
                style={(feature) => {
                  const info = lookupArea(feature?.properties?.APREC || '');
                  return {
                    fillColor: info ? getCrimeColor(info.crime_count, maxCrimes) : '#e2e8f0',
                    weight: 1.5,
                    color: '#ffffff',
                    fillOpacity: 0.75,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const info = lookupArea(feature?.properties?.APREC || '');
                  if (!info) return;

                  // Hover: preview only (does not override locked selection)
                  layer.on('mouseover', () => {
                    setHoveredArea(info);
                    (layer as any).setStyle({
                      weight: 2.5,
                      color: '#1d4ed8',
                      fillOpacity: 0.92,
                    });
                  });
                  layer.on('mouseout', () => {
                    setHoveredArea(null);
                    (layer as any).setStyle({
                      weight: 1.5,
                      color: '#ffffff',
                      fillOpacity: 0.75,
                    });
                  });
                  // Click: lock/unlock detail panel
                  layer.on('click', () => {
                    setSelectedArea(prev =>
                      prev?.['AREA NAME'] === info['AREA NAME'] ? null : info
                    );
                  });

                  // Click popup
                  const level = crimeLevel(info.crime_count);
                  layer.bindPopup(`
                    <div style="font-family:Inter,sans-serif;min-width:210px;line-height:1.75">
                      <div style="font-size:15px;font-weight:700;margin-bottom:6px;color:#0f172a">${info['AREA NAME']}</div>
                      <div style="display:flex;gap:6px;margin-bottom:8px">
                        <span style="background:${level.bg};color:${level.color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${level.label}</span>
                        <span style="background:#f0f9ff;color:#0369a1;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${info.lisa_label}</span>
                      </div>
                      <table style="width:100%;font-size:12.5px;border-collapse:collapse">
                        <tr><td style="color:#64748b;padding:2px 0">Total Kejahatan</td><td style="text-align:right;font-weight:600;color:#0f172a">${info.crime_count.toLocaleString()}</td></tr>
                        <tr><td style="color:#64748b;padding:2px 0">Arrest Rate</td><td style="text-align:right;font-weight:600;color:${info.arrest_rate > 0.1 ? '#16a34a' : '#dc2626'}">${(info.arrest_rate * 100).toFixed(1)}%</td></tr>
                        <tr><td style="color:#64748b;padding:2px 0">Weapon Rate</td><td style="text-align:right;font-weight:600;color:#ea580c">${(info.weapon_rate * 100).toFixed(1)}%</td></tr>
                        <tr><td style="color:#64748b;padding:2px 0">Violent</td><td style="text-align:right;font-weight:600;color:#dc2626">${(info.violent_pct * 100).toFixed(1)}%</td></tr>
                        <tr><td style="color:#64748b;padding:2px 0">Property</td><td style="text-align:right;font-weight:600;color:#2563eb">${(info.property_pct * 100).toFixed(1)}%</td></tr>
                        <tr><td style="color:#64748b;padding:2px 0">Rata-rata Usia Korban</td><td style="text-align:right;font-weight:600;color:#0f172a">${info.avg_victim_age.toFixed(0)} th</td></tr>
                      </table>
                    </div>
                  `, { maxWidth: 260 });
                }}
              />
            </MapContainer>
          )}

          {/* Color Legend */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Intensitas:</span>
            {['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'].map((c, i) => (
              <span key={i} style={{ width: 28, height: 14, background: c, borderRadius: 3, display: 'inline-block' }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>Rendah → Tinggi</span>
          </div>
        </div>

        {/* Area Info Panel: selected (locked) > hovered > default */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedArea ? (
            <AreaDetailPanel
              area={selectedArea}
              max={maxCrimes}
              locked={true}
              onDeselect={() => setSelectedArea(null)}
            />
          ) : hoveredArea ? (
            <AreaDetailPanel area={hoveredArea} max={maxCrimes} locked={false} />
          ) : (
            <DefaultInfoPanel areas={areas} />
          )}
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid-2">
        <ChartCard title="Jumlah Kejahatan per Area LAPD (Top to Bottom)">
          <ResponsiveContainer width="100%" height={430}>
            <BarChart data={areaBarData} layout="vertical" margin={{ left: 80, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11.5 }} width={78} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} formatter={(v: any) => [Number(v).toLocaleString(), 'Kasus']} />
              <Bar dataKey="crimes" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribusi Kategori Kejahatan" dotColor="var(--accent-gold)">
          <ResponsiveContainer width="100%" height={430}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="45%"
                innerRadius={90} outerRadius={155}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                labelLine={{ stroke: '#94a3b8' }}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [Number(v).toLocaleString(), 'Kasus']} />
              <Legend wrapperStyle={{ fontSize: 13, color: '#475569', paddingTop: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2">
        <ChartCard title="Tren Volume Kejahatan Bulanan (2020 - 2024)" dotColor="var(--accent-purple)">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => {
                  if (val.endsWith('-01')) return val.substring(0, 4);
                  return '';
                }}
              />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
              <Tooltip 
                contentStyle={TOOLTIP_STYLE} 
                formatter={(v: any) => [Number(v).toLocaleString(), 'Kasus']} 
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tingkat Penangkapan (Arrest Rate) per Area LAPD" dotColor="var(--accent-green)">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...areas].sort((a, b) => b.arrest_rate - a.arrest_rate).map(a => ({ name: a['AREA NAME'], arrestRate: (a.arrest_rate * 100) }))} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} angle={-45} textAnchor="end" />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [parseFloat(v).toFixed(2) + '%', 'Arrest Rate']} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="arrestRate" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="info-card">
        <div className="info-card-title">Temuan Kunci</div>
        <div className="info-card-text">
          Area <strong>Central</strong> memiliki jumlah kejahatan tertinggi (67.580 kasus). Kejahatan <strong>PROPERTY</strong> mendominasi (~54%),
          namun arrest rate keseluruhan hanya <strong>9.01%</strong>. Satu dari tiga kasus (<strong>33.18%</strong>) melibatkan senjata,
          menunjukkan tingkat kekerasan yang signifikan di wilayah Los Angeles.
        </div>
      </div>
    </div>
  );
}

// ─── Area Detail Panel (hover / click-locked) ────────────────────────────────
function AreaDetailPanel({
  area, max, locked = false, onDeselect,
}: {
  area: AreaData;
  max: number;
  locked?: boolean;
  onDeselect?: () => void;
}) {
  const ratio = area.crime_count / max;
  const level = ratio > 0.75 ? { label: 'Sangat Tinggi', color: '#dc2626', bg: '#fef2f2' }
    : ratio > 0.5 ? { label: 'Tinggi', color: '#ea580c', bg: '#fff7ed' }
    : ratio > 0.3 ? { label: 'Sedang', color: '#d97706', bg: '#fffbeb' }
    : { label: 'Rendah', color: '#16a34a', bg: '#f0fdf4' };

  const lisaColor = LISA_COLORS[area.lisa_label] || '#94a3b8';

  const stats = [
    { label: 'Total Kejahatan', value: area.crime_count.toLocaleString(), color: '#0f172a' },
    { label: 'Arrest Rate', value: `${(area.arrest_rate * 100).toFixed(1)}%`, color: area.arrest_rate > 0.1 ? '#16a34a' : '#dc2626' },
    { label: 'Weapon Rate', value: `${(area.weapon_rate * 100).toFixed(1)}%`, color: '#ea580c' },
    { label: 'Kejahatan Violent', value: `${(area.violent_pct * 100).toFixed(1)}%`, color: '#dc2626' },
    { label: 'Kejahatan Property', value: `${(area.property_pct * 100).toFixed(1)}%`, color: '#2563eb' },
    { label: 'Rata-rata Usia Korban', value: `${area.avg_victim_age.toFixed(0)} tahun`, color: '#475569' },
    { label: 'Jarak ke CBD', value: `${area.avg_dist_cbd.toFixed(1)} km`, color: '#475569' },
  ];

  return (
    <div
      className="chart-card"
      style={{
        flex: 1,
        borderColor: locked ? '#2563eb' : 'var(--border)',
        borderWidth: locked ? 2 : 1,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
            {area['AREA NAME']}
          </div>
          {locked && onDeselect && (
            <button
              onClick={onDeselect}
              title="Hapus pilihan"
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                color: '#64748b',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                marginLeft: 8,
                marginTop: 2,
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {locked && (
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              📌 Terpilih
            </span>
          )}
          <span style={{ background: level.bg, color: level.color, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
            {level.label}
          </span>
          <span style={{ background: `${lisaColor}18`, color: lisaColor, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, border: `1px solid ${lisaColor}30` }}>
            {area.lisa_label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {stats.map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Composition bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Komposisi Kejahatan
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${area.violent_pct * 100}%`, background: '#dc2626', transition: 'width 0.4s ease' }} />
          <div style={{ width: `${area.property_pct * 100}%`, background: '#2563eb', transition: 'width 0.4s ease' }} />
          <div style={{ flex: 1, background: '#94a3b8' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ color: '#dc2626' }}>■ Violent {(area.violent_pct * 100).toFixed(0)}%</span>
          <span style={{ color: '#2563eb' }}>■ Property {(area.property_pct * 100).toFixed(0)}%</span>
          <span>■ Other {((1 - area.violent_pct - area.property_pct) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Click-to-lock hint (only when hovering, not locked) */}
      {!locked && (
        <div style={{ marginTop: 14, padding: '8px 10px', background: '#f8fafc', borderRadius: 7, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center' }}>
          🖱️ Klik area di peta untuk mengunci panel ini
        </div>
      )}
    </div>
  );
}

// ─── Default Info Panel (no hover) ───────────────────────────────────────────
function DefaultInfoPanel({ areas }: { areas: AreaData[] }) {
  const sorted = [...areas].sort((a, b) => b.crime_count - a.crime_count);
  const top5 = sorted.slice(0, 5);
  const low5 = sorted.slice(-5).reverse();
  const maxCount = sorted[0]?.crime_count || 1;

  return (
    <>
      <div className="highlight-card" style={{ padding: 18 }}>
        <div className="chart-card-title" style={{ marginBottom: 14 }}>
          <span className="dot" style={{ background: '#dc2626' }} />
          Area Tertinggi
        </div>
        <div className="highlight-card-inner-box" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top5.map((a, i) => (
              <div key={a['AREA NAME']}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>#{i + 1}</span>
                    {a['AREA NAME']}
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>{a.crime_count.toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(a.crime_count / maxCount) * 100}%`, background: `hsl(${220 - i * 15}, 80%, 55%)`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="highlight-card" style={{ padding: 18 }}>
        <div className="chart-card-title" style={{ marginBottom: 14 }}>
          <span className="dot" style={{ background: '#16a34a' }} />
          Area Terendah
        </div>
        <div className="highlight-card-inner-box" style={{ background: 'transparent', border: 'none', padding: 0, marginBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {low5.map((a, i) => (
              <div key={a['AREA NAME']}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>#{i + 1}</span>
                    {a['AREA NAME']}
                  </span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>{a.crime_count.toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(a.crime_count / maxCount) * 100}%`, background: '#86efac', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="highlight-card" style={{ padding: '12px 16px', background: 'var(--accent-blue-light)', border: '1px solid #bfdbfe', fontSize: 12.5, color: '#1e3a8a', textAlign: 'center', lineHeight: 1.7 }}>
        🖱️ <strong style={{ color: '#1e40af' }}>Hover</strong> area di peta untuk melihat<br />karakteristik detail wilayah tersebut
      </div>
    </>
  );
}
