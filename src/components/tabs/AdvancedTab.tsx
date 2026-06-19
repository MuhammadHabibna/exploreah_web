'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import { CoxCovariate, DiDResult, FairnessGroup } from '@/lib/types';
import { TOOLTIP_STYLE, AXIS_TICK, GRID_STROKE } from '@/lib/constants';

export default function AdvancedTab() {
  const [did, setDid] = useState<DiDResult | null>(null);
  const [cox, setCox] = useState<CoxCovariate[]>([]);
  const [fairEth, setFairEth] = useState<FairnessGroup[]>([]);
  const [fairGen, setFairGen] = useState<FairnessGroup[]>([]);

  useEffect(() => {
    fetch('/data/did_results.json').then(r => r.json()).then((d: DiDResult[]) => setDid(d[0]));
    fetch('/data/cox_ph_summary.json').then(r => r.json()).then(setCox);
    fetch('/data/fairness_ethnicity.json').then(r => r.json()).then(setFairEth);
    fetch('/data/fairness_gender.json').then(r => r.json()).then(setFairGen);
  }, []);

  if (!did) return (
    <div className="tab-content" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Memuat data...</div>
  );

  const significantCox = cox.filter(c => c.p_value < 0.05).sort((a, b) => Math.abs(b.hazard_ratio - 1) - Math.abs(a.hazard_ratio - 1));
  const coxData = significantCox.map(c => ({
    name: c.covariate.replace(/_/g, ' '),
    hr: +c.hazard_ratio.toFixed(4),
  }));

  const ethData = fairEth.map(f => ({
    name: f.sensitive_feature_0,
    'Akurasi (%)': +(f.accuracy * 100).toFixed(2),
  }));

  const genData = fairGen.map(f => ({
    name: f.sensitive_feature_0 === 'F' ? 'Female' : f.sensitive_feature_0 === 'M' ? 'Male' : 'Unknown',
    'Akurasi (%)': +(f.accuracy * 100).toFixed(2),
  }));

  return (
    <div className="tab-content">
      {/* Section A: DiD */}
      <div className="section-title">
        <span className="accent-line" />
        Difference-in-Differences (Kausalitas Kebijakan)
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
        <KpiCard label="DiD Coefficient" value={did.DiD_Coefficient.toFixed(1)} color="red" sub="Kasus/bulan berkurang" />
        <KpiCard label="P-Value" value={did.P_Value.toFixed(4)} color="green" sub="Signifikan (p < 0.05)" />
        <KpiCard label="R-Squared" value={did.R_Squared.toFixed(4)} color="blue" sub="Goodness of fit" />
        <KpiCard label="Observasi" value={did.N_Observations} color="purple" sub="Data points" />
      </div>

      <div className="info-card" style={{ marginBottom: 32 }}>
        <div className="info-card-title">Interpretasi DiD</div>
        <div className="info-card-text">
          Lockdown COVID-19 (Maret 2020) terbukti secara <strong>kausal</strong> menurunkan tingkat kejahatan sebesar 
          <strong> ~54 kasus/bulan</strong> di area high-crime (p=0.035, R²=0.797). 
          Area yang sebelumnya memiliki kejahatan tinggi mengalami penurunan yang jauh lebih tajam dibandingkan area low-crime.
        </div>
      </div>

      {/* Section B: Survival */}
      <div className="section-title">
        <span className="accent-line" style={{ background: 'var(--accent-gold)' }} />
        Survival Analysis — Cox Proportional Hazards
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 16 }}>
        <KpiCard label="Concordance Index" value="0.7324" color="gold" sub="Discriminative ability model" />
        <KpiCard label="Covariat Signifikan" value={`${significantCox.length} / ${cox.length}`} color="blue" sub="p < 0.05" />
      </div>

      <ChartCard title="Hazard Ratios per Covariat (Signifikan, p < 0.05)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={coxData} layout="vertical" margin={{ left: 100, right: 60, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} width={95} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any) => [parseFloat(v).toFixed(4), 'Hazard Ratio']}
              labelFormatter={(l: any) => `Covariat: ${l}`}
            />
            <ReferenceLine x={1} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} label={{ value: 'HR = 1', fill: '#94a3b8', fontSize: 10, position: 'top' }} />
            <Bar dataKey="hr" radius={[0, 4, 4, 0]}>
              {coxData.map((entry, i) => (
                <Cell key={i} fill={entry.hr > 1 ? '#dc2626' : '#2563eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: '#dc2626', borderRadius: 2, display: 'inline-block' }} />
            HR &gt; 1 (mempercepat arrest)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: '#2563eb', borderRadius: 2, display: 'inline-block' }} />
            HR &lt; 1 (memperlambat arrest)
          </span>
        </div>
      </ChartCard>

      <div className="info-card" style={{ marginBottom: 32, marginTop: 0 }}>
        <div className="info-card-text" style={{ fontSize: 13 }}>
          Kasus bersenjata memiliki Hazard Ratio <strong>2.08</strong> — 2x lebih cepat ditangani. 
          Sebaliknya, kejahatan properti (<code>is_property</code>) memiliki HR <strong>0.31</strong> — 69% lebih lambat diproses.
        </div>
      </div>

      {/* Section C: Fairness */}
      <div className="section-title">
        <span className="accent-line" style={{ background: 'var(--accent-green)' }} />
        Fairness Audit — Uji Bias Algoritmik
      </div>

      <div className="grid-2">
        <ChartCard title="Akurasi Model per Etnisitas" dotColor="var(--accent-green)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ethData} margin={{ left: 5, right: 10, top: 4, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={AXIS_TICK} domain={[85, 100]} unit="%" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Akurasi']} />
              <Bar dataKey="Akurasi (%)" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Akurasi Model per Gender" dotColor="var(--accent-purple)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={genData} margin={{ left: 5, right: 10, top: 4, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={AXIS_TICK} domain={[85, 100]} unit="%" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Akurasi']} />
              <Bar dataKey="Akurasi (%)" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="info-card success">
        <div className="info-card-title">Kesimpulan: Tidak Ada Bias Sistematis</div>
        <div className="info-card-text">
          Akurasi model konsisten di kisaran <strong>90.6% - 94.7%</strong> untuk semua grup etnisitas dan gender. 
          Disparitas maksimum hanya <strong>~4%</strong> (Hispanic vs White), berada dalam batas toleransi yang dapat diterima. 
          Model tidak menunjukkan bias algoritmik sistematis.
        </div>
      </div>
    </div>
  );
}
