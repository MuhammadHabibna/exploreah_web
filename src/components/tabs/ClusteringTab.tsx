'use client';

import { useEffect, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { ClusterProfile, AreaYearlyProfile, ClusterMetaGroup } from '@/lib/types';
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

interface CompRow {
  Silhouette: number;
  'Calinski-Harabasz': number;
  'Davies-Bouldin': number;
  N_Clusters: number;
  Noise_Pct: number;
}

export default function ClusteringTab() {
  const [comparison, setComparison] = useState<CompRow[]>([]);
  const [profiles, setProfiles] = useState<ClusterProfile[]>([]);
  const [areaYearly, setAreaYearly] = useState<AreaYearlyProfile[]>([]);
  const [metaGroups, setMetaGroups] = useState<ClusterMetaGroup[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('77th Street');

  useEffect(() => {
    fetch('/data/clustering_comparison.json').then(r => r.json()).then(setComparison);
    fetch('/data/cluster_profiles.json').then(r => r.json()).then(setProfiles);
    fetch('/data/area_yearly_profile.json').then(r => r.json()).then(setAreaYearly);
    fetch('/data/cluster_meta_summary.json').then(r => r.json()).then(setMetaGroups);
  }, []);

  if (comparison.length === 0) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  const hdbscan = comparison[0];
  const kmeans = comparison[1];

  const radarData = [
    { metric: 'Silhouette', HDBSCAN: hdbscan.Silhouette, KMeans: kmeans.Silhouette },
    { metric: 'CH Index (norm)', HDBSCAN: 1, KMeans: +(kmeans['Calinski-Harabasz'] / hdbscan['Calinski-Harabasz']).toFixed(3) },
    { metric: 'DB (inverse)', HDBSCAN: +(1 / hdbscan['Davies-Bouldin']).toFixed(3), KMeans: +(1 / kmeans['Davies-Bouldin']).toFixed(3) },
  ];

  const top15 = [...profiles].sort((a, b) => b.count - a.count).slice(0, 15);
  
  const uniqueAreas = Array.from(new Set(areaYearly.map(a => a.area))).sort();
  const selectedAreaData = areaYearly.filter(a => a.area === selectedArea).sort((a, b) => a.year - b.year);
  
  // Format data for stacked area chart
  const stackedData = selectedAreaData.map(d => ({
    year: d.year,
    Violent: d.violent_pct * 100,
    Property: d.property_pct * 100,
    Other: 100 - (d.violent_pct * 100) - (d.property_pct * 100),
    dominant: d.dominant_type
  }));

  return (
    <div className="tab-content">
      <div className="kpi-grid">
        <KpiCard label="HDBSCAN Clusters" value={hdbscan.N_Clusters} color="blue" sub="Density-based adaptive" />
        <KpiCard label="K-Means Clusters" value={kmeans.N_Clusters} color="orange" sub="Centroid-based" />
        <KpiCard label="Silhouette HDBSCAN" value={hdbscan.Silhouette.toFixed(4)} color="green" sub={`vs ${kmeans.Silhouette} K-Means (+60%)`} />
        <KpiCard label="Davies-Bouldin" value={hdbscan['Davies-Bouldin'].toFixed(4)} color="purple" sub={`vs ${kmeans['Davies-Bouldin']} K-Means (lebih kecil = lebih baik)`} />
      </div>

      <div className="comparison-grid">
        {(['Silhouette', 'Calinski-Harabasz', 'Davies-Bouldin'] as const).map(metric => {
          const hVal = hdbscan[metric as keyof CompRow] as number;
          const kVal = kmeans[metric as keyof CompRow] as number;
          const hWins = metric === 'Davies-Bouldin' ? hVal < kVal : hVal > kVal;
          const fmt = (v: number) => v > 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 0 }) : v.toFixed(4);
          return (
            <div className="comparison-card" key={metric}>
              <div className="metric-label">{metric}</div>
              <div className="metric-row">
                <span className={`metric-value ${hWins ? 'winner' : 'loser'}`}>{fmt(hVal)}</span>
                <span className="metric-vs">vs</span>
                <span className={`metric-value ${!hWins ? 'winner' : 'loser'}`}>{fmt(kVal)}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                {hWins ? 'UMAP+HDBSCAN' : 'PCA+K-Means'} lebih baik
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        <ChartCard title="Perbandingan Metrik Evaluasi (Radar Chart)">
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="UMAP+HDBSCAN" dataKey="HDBSCAN" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="PCA+K-Means" dataKey="KMeans" stroke="#ea580c" fill="#ea580c" fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 13, color: '#475569' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profil Top 15 Cluster (HDBSCAN)" dotColor="var(--accent-gold)">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Count</th>
                  <th>Tipe</th>
                  <th>Senjata</th>
                  <th>Arrest</th>
                  <th>Area</th>
                </tr>
              </thead>
              <tbody>
                {top15.map(c => (
                  <tr key={c.cluster_hdbscan}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>#{c.cluster_hdbscan}</td>
                    <td style={{ fontWeight: 600 }}>{c.count.toLocaleString()}</td>
                    <td><span className={`badge ${c.top_crime === 'VIOLENT' ? 'violent' : 'property'}`}>{c.top_crime}</span></td>
                    <td>{(c.weapon_rate * 100).toFixed(0)}%</td>
                    <td>{(c.arrest_rate * 100).toFixed(1)}%</td>
                    <td>{c.top_area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <div className="chart-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="chart-card-title" style={{ marginBottom: 0 }}>
            <span className="dot" style={{ background: 'var(--accent-purple)' }} />
            Tren Karakteristik Kejahatan per Wilayah
          </div>
          <select 
            value={selectedArea} 
            onChange={(e) => setSelectedArea(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', background: '#f8fafc', cursor: 'pointer' }}
          >
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        
        <div className="grid-2" style={{ padding: 24, gap: 32 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Arrest Rate vs Weapon Rate (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={selectedAreaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => (v*100).toFixed(0) + '%'} />
                <Tooltip 
                  contentStyle={TOOLTIP_STYLE} 
                  formatter={(v: any, name: any) => [(parseFloat(v) * 100).toFixed(1) + '%', name === 'arrest_rate' ? 'Arrest Rate' : 'Weapon Rate']} 
                  labelFormatter={(label) => `Tahun ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line name="Arrest Rate" type="monotone" dataKey="arrest_rate" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line name="Weapon Rate" type="monotone" dataKey="weapon_rate" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Komposisi Tipe Kejahatan (%)</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="year" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
                <Tooltip 
                  contentStyle={TOOLTIP_STYLE} 
                  formatter={(v: any) => [parseFloat(v).toFixed(1) + '%', undefined]} 
                  labelFormatter={(label) => `Tahun ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Violent" stackId="1" stroke="#ef4444" fill="#fca5a5" />
                <Area type="monotone" dataKey="Property" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
                <Area type="monotone" dataKey="Other" stackId="1" stroke="#94a3b8" fill="#cbd5e1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Interpretasi 52 Klaster (Meta-Groups)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {metaGroups.map(mg => (
            <div key={mg.key} className="highlight-card">
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                {mg.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
                {mg.cluster_count} Clusters • {mg.total_crimes.toLocaleString()} Kasus
              </div>
              
              <div className="highlight-card-inner-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Arrest Rate</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: mg.avg_arrest_rate > 0.1 ? '#16a34a' : '#dc2626' }}>
                      {(mg.avg_arrest_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Weapon Rate</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {(mg.avg_weapon_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Usia Korban Rata-rata</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      {mg.avg_age > 1 ? mg.avg_age.toFixed(0) + ' thn' : 'Tidak Ada Data'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Jarak ke Pusat (CBD)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                      {mg.avg_dist_cbd.toFixed(1)} km
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {mg.interpretation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-card success">
        <div className="info-card-title">Interpretasi</div>
        <div className="info-card-text">
          UMAP+HDBSCAN mengungguli PCA+K-Means di <strong>semua metrik evaluasi</strong> (Silhouette 0.66 vs 0.41). 
          Dari 52 cluster teridentifikasi, terbentuk dua profil berbeda: cluster <strong>VIOLENT</strong> (weapon rate 100%, arrest tinggi) 
          terkonsentrasi di South LA, dan cluster <strong>PROPERTY</strong> (tanpa senjata, arrest sangat rendah) tersebar luas.
        </div>
      </div>
    </div>
  );
}
